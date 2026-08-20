import os
import shutil
import uuid
from shared.schemas.modpacks import ModpackManifest, ConditionalArg
from shared.schemas.settings import Settings
from shared.schemas.auth import LaunchSession
from shared.schemas.schemas import LaunchPlaceholders
from shared.utils.path import get_executable_java, resolve_absolute_file_path


class GameCommandService:
  def build(
    self,
    manifest: ModpackManifest,
    settings: Settings,
    session: LaunchSession,
  ) -> list[str]:
    
    java_path = get_executable_java(settings.base_folder, manifest.java.major_version)
    natives_dir = self._prepare_natives_dir(manifest, settings)
    classpath_str, modulepath_str = self._resolve_paths(manifest, settings)
    jvm_args, game_args = self._parse_args(manifest, settings)

    placeholders = LaunchPlaceholders(
      library_directory=str(settings.base_folder / "libraries"),
      modulepath=modulepath_str,
      natives_directory=natives_dir,
      classpath=classpath_str,
      auth_player_name=session.username,
      game_directory=str(settings.base_folder / "updates" / manifest.id),
      assets_root=str(settings.base_folder / "assets"),
      auth_uuid=session.player_uuid,
      auth_access_token=session.session_token,
      selected_ram=settings.selected_ram,
    )
    replacement_map = placeholders.to_replacement_map()

    def replace(arg: str) -> str:
      for key, val in replacement_map.items():
        arg = arg.replace(key, val)
      return arg

    return [
      str(java_path),
      *[replace(a) for a in jvm_args],
      manifest.launch.main_class,
      *[replace(a) for a in game_args],
    ]

  def _prepare_natives_dir(self, manifest: ModpackManifest, settings: Settings) -> str:
    natives_dir = settings.base_folder / "natives" / manifest.id
    if natives_dir.exists():
      shutil.rmtree(natives_dir, ignore_errors=True)
    natives_dir.mkdir(parents=True, exist_ok=True)
    return str(natives_dir)

  def _resolve_paths(self, manifest: ModpackManifest, settings: Settings) -> tuple[str, str]:
    classpath_paths = []
    modulepath_paths = []

    for file_info in manifest.files:
      resolved_path = resolve_absolute_file_path(
        settings.base_folder,
        manifest.id,
        manifest.java.major_version,
        file_info,
      )
      if file_info.is_classpath:
        classpath_paths.append(str(resolved_path))
      elif file_info.is_module_path:
        modulepath_paths.append(str(resolved_path))

    return os.pathsep.join(classpath_paths), os.pathsep.join(modulepath_paths)

  def _parse_args(
    self, manifest: ModpackManifest, settings: Settings
  ) -> tuple[list[str], list[str]]:
    def resolve(args: list[str | ConditionalArg]) -> list[str]:
      result = []
      for arg in args:
        if isinstance(arg, str):
          result.append(arg)
        elif isinstance(arg, ConditionalArg) and arg.is_applicable:
          result.append(arg.value)
      return result

    jvm_args = resolve(manifest.launch.jvm_args)
    game_args = resolve(manifest.launch.game_args)

    if settings.fullscreen:
      game_args.append("--fullscreen")

    return jvm_args, game_args