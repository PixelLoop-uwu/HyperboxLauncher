from functools import partial
from typing import Callable
from pathlib import Path
import asyncio
import hashlib

from pydantic import TypeAdapter
from loguru import logger

from core.consts import consts
from core.network import HttpClient
from core.log_bridge import LogBridge
from core.services import ModpacksCacheStorage
from shared.schemas.modpack import ModpackManifest, FileManifest
from shared.utils.path import resolve_absolute_file_path
from .progress import DownloadProgressNotifier
from .schemas.modpacks import Modpack


class ModpacksService:
  def __init__(self, log_bridge: LogBridge, cache_storage: ModpacksCacheStorage) -> None:
    self.log_bridge = log_bridge
    self.cache_storage = cache_storage

  @staticmethod
  async def load_modpacks_data() -> list[Modpack]:
    try:
      async with HttpClient() as api:
        response = await api.load_modpacks_data()
        modpacks = TypeAdapter(list[Modpack]).validate_python(response)
        logger.info(f"Loaded {len(modpacks)} modpacks from API")
        return modpacks
    except Exception as e:
      logger.error(f"Failed to load modpacks: {e}")
      raise

  async def _get_manifest(self, api: HttpClient, modpack_id: str) -> ModpackManifest:
    manifest_dict = await api.load_modpack_manifest(modpack_id)
    return ModpackManifest.model_validate(manifest_dict)

  async def sync_release(self, modpack_id: str, base_folder: Path) -> ModpackManifest:
    async with HttpClient() as api:
      manifest = await self._get_manifest(api, modpack_id)
      java_version = manifest.java.major_version

      download_semaphore = asyncio.Semaphore(consts.MAX_CONCURRENT_DOWNLOADS)
      hash_semaphore = asyncio.Semaphore(consts.MAX_CONCURRENT_HASHES)

      check_tasks = [
        self._check_file_for_download(base_folder, modpack_id, java_version, file_info, hash_semaphore)
        for file_info in manifest.files
        if file_info.is_applicable()
      ]
      check_results = await asyncio.gather(*check_tasks)
      files_to_download = [item for item in check_results if item is not None]

      if files_to_download:
        self.log_bridge.resource_log(statusText="Updating files")

        total_bytes = sum(item[2].size for item in files_to_download)
        progress_notifier = DownloadProgressNotifier(
          total_bytes=total_bytes,
          log_bridge=self.log_bridge,
          loop=asyncio.get_running_loop()
        )

        download_tasks = [
          self._ensure_file(
            api=api,
            file_path=fp,
            rel_path=rp,
            file_info=fi,
            semaphore=download_semaphore,
            chunk_callback=progress_notifier
          )
          for fp, rp, fi in files_to_download
        ]
        await asyncio.gather(*download_tasks)

      await self.remove_extraneous_files(
        modpack_id=modpack_id,
        base_folder=base_folder,
        manifest=manifest,
        target_dirs=["mods"]
      )

      self.cache_storage.save()

    return manifest

  async def _check_file_for_download(
    self,
    base_folder: Path,
    modpack_id: str,
    java_version: str | int,
    file_info: FileManifest,
    semaphore: asyncio.Semaphore
  ) -> tuple[Path, str, FileManifest] | None:
    file_path = resolve_absolute_file_path(base_folder, modpack_id, str(java_version), file_info)
    rel_path = str(file_path.relative_to(base_folder))

    is_valid = await self._is_file_valid(
      file_path=file_path,
      rel_path=rel_path,
      file_info=file_info,
      semaphore=semaphore
    )

    if not is_valid:
      return (file_path, rel_path, file_info)
    return None

  async def _is_file_valid(
    self, 
    file_path: Path, 
    rel_path: str,
    file_info: FileManifest,
    semaphore: asyncio.Semaphore
  ) -> bool:
    stat = self._get_file_stat(file_path)
    if not stat:
      return False

    size, mtime = stat
    cached = self.cache_storage.get_file(rel_path)

    if cached and cached.mtime == mtime and cached.size == size:
      return True

    async with semaphore:
      actual_sha1 = await self._calc_sha1_async(file_path)

    if actual_sha1 == file_info.sha1:
      self.cache_storage.set_file(
        rel_path=rel_path,
        sha1=actual_sha1,
        size=size,
        mtime=mtime
      )
      return True
    return False

  async def _ensure_file(
    self, 
    api: HttpClient,
    file_path: Path, 
    rel_path: str,
    file_info: FileManifest, 
    semaphore: asyncio.Semaphore,
    chunk_callback: Callable | None = None
  ) -> None:
    async with semaphore:
      success = await api.download_file(
        url=file_info.url,
        destination=file_path,
        expected_sha1=file_info.sha1,
        chunk_callback=chunk_callback
      )

      if not success:
        err_msg = f"Critical error loading file: {file_info.path}"
        raise RuntimeError(err_msg)

      stat = self._get_file_stat(file_path)
      if stat:
        size, mtime = stat
        self.cache_storage.set_file(
          rel_path=rel_path,
          sha1=file_info.sha1,
          size=size,
          mtime=mtime
        )

  async def remove_extraneous_files(
    self,
    modpack_id: str,
    base_folder: Path,
    manifest: ModpackManifest,
    target_dirs: list[str]
  ) -> list[Path]:
    java_version = manifest.java.major_version
    
    expected_paths = {
      resolve_absolute_file_path(base_folder, modpack_id, java_version, file_info).resolve()
      for file_info in manifest.files
      if file_info.is_applicable()
    }

    modpack_dir = base_folder / "updates" / modpack_id

    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(
      None,
      self._sync_cleanup_disk,
      modpack_dir,
      target_dirs,
      expected_paths
    )

  def _sync_cleanup_disk(
    self,
    modpack_dir: Path,
    target_dirs: list[str],
    expected_paths: set[Path]
  ) -> list[Path]:
    removed_files: list[Path] = []
    
    for folder_name in target_dirs:
      dir_path = modpack_dir / folder_name
      if not dir_path.is_dir():
        continue

      for file_path in dir_path.rglob("*"):
        if file_path.is_file():
          resolved = file_path.resolve()
          if resolved not in expected_paths:
            try:
              resolved.unlink()
              removed_files.append(file_path)
              logger.warning(f"Removed external file: {file_path}")
            except Exception as e:
              logger.error(f"Failed to remove external file {file_path}: {e}")

      self._cleanup_empty_dirs(dir_path)

    return removed_files

  @staticmethod
  def _cleanup_empty_dirs(path: Path) -> None:
    try:
      for child in list(path.iterdir()):
        if child.is_dir():
          ModpacksService._cleanup_empty_dirs(child)
      if path.is_dir() and not any(path.iterdir()):
        path.rmdir()
    except Exception as e:
      logger.debug(f"Failed to remove empty directory {path}: {e}")

  @staticmethod
  def _get_file_stat(path: Path) -> tuple[int, float] | None:
    try:
      stat = path.stat()
      return stat.st_size, stat.st_mtime
    except FileNotFoundError:
      return None

  async def _calc_sha1_async(self, path: Path) -> str:
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(None, partial(self._calc_sha1, path))

  @staticmethod
  def _calc_sha1(path: Path) -> str:
    sha1 = hashlib.sha1()
    with open(path, "rb") as f:
      while chunk := f.read(64 * 1024):
        sha1.update(chunk)
    return sha1.hexdigest()