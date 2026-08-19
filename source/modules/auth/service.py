from loguru import logger

from core.network import HttpClient
from core.services import StateStorage
from shared.schemas.auth import LaunchSession
from shared.utils.security import get_hwid
from shared.schemas.auth import AuthPayload


class AuthService:
  def __init__(self, state: StateStorage) -> None:
    self.state = state
    self.username: str | None = None
    self.session_token: str | None = None

  @property
  def launch_session(self) -> LaunchSession | None:
    if not self.username or not self.session_token: 
      return

    return LaunchSession(
      username=self.username,
      session_token=self.session_token
    )

  async def login_perform(
    self, 
    username: str | None = None, 
    password: str | None = None
  ) -> AuthPayload:
    is_auto_attempt = not username and not password
    
    if is_auto_attempt:
      current_state = self.state.current
      username = current_state.auth_creds.username
      password = current_state.auth_creds.password

    if not username or not password:
      logger.warning("Login failed: invalid credentials")
      return AuthPayload.model_validate({"success": False, "error": "Invalid login credentials"})

    hwid = get_hwid()
    
    async with HttpClient() as api:
      response = await api.login_perform(username, password, hwid)
      payload = AuthPayload.model_validate(response)

      if payload.success:
        self.username = payload.user.username  # type: ignore
        self.session_token = payload.session_token

        if not is_auto_attempt:
          self.state.update(auth_creds={"username": username, "password": password})
          
        logger.info(f"User '{username}' logged in successfully")
      else:
        logger.warning(f"Login failed for user '{username}'")

      return payload

  def logout_perform(self) -> None:
    if self.username:
      logger.info(f"User '{self.username}' logged out")
    
    self.username = None
    self.session_token = None
    
    self.state.update(
      auth_creds={"username": "", "password": ""}
    )
