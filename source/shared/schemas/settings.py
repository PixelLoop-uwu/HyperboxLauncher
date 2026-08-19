from pathlib import Path

import psutil
from pydantic import BaseModel, Field, ConfigDict, computed_field, field_serializer


class RecentAuthCreds(BaseModel):
  username: str = ""
  password: str = ""


class Settings(BaseModel):
  selected_ram: int = Field(
    default_factory=lambda: max(1024, (psutil.virtual_memory().total >> 20) // 2), 
    alias="selectedRam"
  )
  fullscreen: bool = False
  rich_presence: bool = Field(default=True, alias="richPresence")
  debug: bool = False
  base_folder: Path = Field(..., alias="baseFolder")

  @computed_field(alias="maxRam", repr=False)
  @property
  def max_ram(self) -> int:
    return psutil.virtual_memory().total >> 20
  
  @field_serializer("base_folder")
  def serialize_path(self, val: Path) -> str:
    return str(val)

  model_config = ConfigDict(
    populate_by_name=True,
    serialize_by_alias=True
  )


class StateModel(BaseModel):
  auth_creds: RecentAuthCreds
  settings: Settings
  
  model_config = ConfigDict(
    populate_by_name=True
  )
