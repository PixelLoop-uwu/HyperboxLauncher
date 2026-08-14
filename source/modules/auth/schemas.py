from typing import Optional
from pydantic import BaseModel, Field, ConfigDict

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