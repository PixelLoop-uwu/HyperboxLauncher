from typing import Optional
from pydantic import BaseModel, Field, ConfigDict
import uuid


class BanInfo(BaseModel):
  model_config = ConfigDict(populate_by_name=True)

  active: bool
  reason: Optional[str] = None
  expiry: Optional[int] = None

class UserInfo(BaseModel):
  model_config = ConfigDict(populate_by_name=True)

  username: str
  avatar_url: str = Field(..., alias="avatarUrl")
  ban: Optional[BanInfo] = None

class AuthPayload(BaseModel):
  success: bool
  session_token: Optional[str] = None
  user: Optional[UserInfo] = None

class LaunchSession(BaseModel):
  username: str
  session_token: str

  @property
  def player_uuid(self) -> str:
    return str(uuid.uuid3(uuid.NAMESPACE_DNS, self.username))