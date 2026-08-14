from enum import Enum
from pathlib import Path
from pydantic import BaseModel, Field

from shared.utils.system import get_os_type
from shared.schemas.system import OSType


class FileType(str, Enum):
  CLIENT = "client"
  LIBRARY = "library"
  NATIVE = "native"
  JAVA = "java"
  ASSET = "asset"


class JavaConfig(BaseModel):
  major_version: str


class ConditionalArg(BaseModel):
  value: str
  os: OSType

  @property
  def is_applicable(self) -> bool:
    if self.os is None:
      return True
    return OSType(self.os) == get_os_type() if isinstance(self.os, str) else self.os == get_os_type()


class LaunchConfig(BaseModel):
  main_class: str
  asset_index_name: str
  jvm_args: list[str | ConditionalArg] = Field(default_factory=list)
  game_args: list[str | ConditionalArg] = Field(default_factory=list)


class FileManifest(BaseModel):
  path: Path
  sha1: str
  size: int
  url: str
  type: FileType
  is_module: bool = False
  os: OSType | None = None

  def is_applicable(self) -> bool:
    if self.os is None:
      return True
    return OSType(self.os) == get_os_type() if isinstance(self.os, str) else self.os == get_os_type()

  @property
  def is_classpath(self) -> bool:
    return self.type in (FileType.LIBRARY, FileType.NATIVE) and not self.is_module and self.is_applicable()

  @property
  def is_module_path(self) -> bool:
    return self.type == FileType.LIBRARY and self.is_module and self.is_applicable()


class ModpackManifest(BaseModel):
  id: str
  name: str
  game_version: str
  java: JavaConfig
  launch: LaunchConfig
  files: list[FileManifest]