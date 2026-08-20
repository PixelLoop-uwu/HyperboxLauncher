from pydantic import BaseModel, Field, computed_field

class LaunchPlaceholders(BaseModel):
  library_directory: str
  modulepath: str
  natives_directory: str
  classpath: str
  auth_player_name: str
  game_directory: str
  assets_root: str
  auth_uuid: str
  auth_access_token: str
  selected_ram: int

  def to_replacement_map(self) -> dict[str, str]:
    return {f"${{{k}}}": str(v) for k, v in self.model_dump().items()}