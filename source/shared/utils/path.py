from pathlib import Path

from loguru import logger

from shared.schemas.system import OSType
from shared.utils.system import get_os_type
from shared.schemas.modpacks import FileManifest, FileType


def get_default_directory() -> Path:
  name = ".hyperbox"
  os_type = get_os_type()
  home = Path.home()

  if os_type == OSType.WINDOWS:
    path = home / "AppData" / "Roaming" / name
   
  elif os_type == OSType.MACOS:
    path = home / "Library" / "Application Support" / name
   
  elif os_type == OSType.LINUX:
    path = home / name

  else:
    path = home / f"{name.lower()}"

  path.parent.mkdir(parents=True, exist_ok=True)
  return path


def resolve_absolute_file_path(base_folder: Path, modpack_id: str, java_version: str, file_info: FileManifest) -> Path:
  if file_info.type in (FileType.CLIENT):
    return base_folder / "updates" / modpack_id / file_info.path
  
  elif file_info.type == FileType.JAVA:
    return base_folder / "java" / java_version / file_info.path
  
  elif file_info.type == FileType.ASSET:
    return base_folder / "assets" / file_info.path
  
  elif file_info.type in (FileType.LIBRARY, FileType.NATIVE):
    return base_folder / "libraries" / file_info.path
  
  elif file_info.type == FileType.NATIVE:
    return base_folder / "native" / file_info.path
  
  else:
    raise ValueError(f"Unknown file type: {file_info.type}")
  

def get_executable_java(base_runtime_folder: Path, version: str) -> Path:
  os_type = get_os_type()
  base_path = base_runtime_folder / "java" / f"java_{version}" / "bin"

  if os_type == OSType.WINDOWS:
    java_path = base_path / "java.exe"
  
  else:
    java_path = base_path / "java"

  logger.info(f"Java path: {java_path}")
  return java_path