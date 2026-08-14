from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class ServerInfo(BaseModel):
  model_config = ConfigDict(
    alias_generator=to_camel,
    populate_by_name=True
  )

  version: str
  game_mode: str
  wipe_date: str  


class Modpack(BaseModel):
  model_config = ConfigDict(
    alias_generator=to_camel,
    populate_by_name=True
  )

  id: str
  name: str
  url: str
  description: str
  online: int
  info: ServerInfo
  mods: list[str]