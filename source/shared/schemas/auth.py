from pydantic import BaseModel, computed_field
import uuid


class LaunchSession(BaseModel):
  username: str
  session_token: str

  @computed_field
  @property
  def player_uuid(self) -> str:
    return str(uuid.uuid3(uuid.NAMESPACE_DNS, self.username))