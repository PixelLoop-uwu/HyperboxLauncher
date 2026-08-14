import json
from pathlib import Path
from pydantic import ValidationError
from loguru import logger

from shared.schemas.cache import ModpackCacheModel, CachedFile


class ModpacksCacheStorage:
  def __init__(self, cache_file: Path) -> None:
    self.cache_file = cache_file
    self.current = self._load_cache()

  def _default_cache(self) -> ModpackCacheModel:
    return ModpackCacheModel()

  def _save_to_disk(self) -> None:
    temp_file = self.cache_file.with_suffix(".tmp")
    try:
      self.cache_file.parent.mkdir(parents=True, exist_ok=True)
   
      with temp_file.open("w", encoding="utf-8") as handle:
        handle.write(self.current.model_dump_json(indent=2))
      
      temp_file.replace(self.cache_file)
    except OSError as e:
      logger.error("Failed to save modpack cache to disk: {}", e)
      if temp_file.exists():
        try:
          temp_file.unlink()
        except OSError:
          pass

  def _load_cache(self) -> ModpackCacheModel:
    if not self.cache_file.exists():
      return self._default_cache()

    try:
      with self.cache_file.open("r", encoding="utf-8") as handle:
        payload = handle.read()

      return ModpackCacheModel.model_validate_json(payload)
    except (OSError, json.JSONDecodeError, ValidationError) as e:
      logger.warning("Modpack cache load failed, resetting to defaults: {}", e)
      return self._default_cache()

  def set_file(self, rel_path: str, sha1: str, size: int, mtime: float) -> None:
    self.current.files[rel_path] = CachedFile(sha1=sha1, size=size, mtime=mtime)

  def get_file(self, rel_path: str) -> CachedFile | None:
    return self.current.files.get(rel_path)

  def save(self) -> None:
    self._save_to_disk()
    logger.info("Modpack cache successfully saved to disk")