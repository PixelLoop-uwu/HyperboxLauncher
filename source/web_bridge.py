import asyncio
import threading
from typing import Coroutine
from concurrent.futures import CancelledError, Future

from loguru import logger
from webview import Window

from core.log_bridge import LogBridge
from core.services import ModpacksCacheStorage, StateStorage
from modules.auth import AuthService
from modules.modpacks import ModpacksService
from modules.settings import SettingsService
from modules.launch import GameCommandService, LauncherService


class WebViewApi:
  def __init__(self) -> None:
    self.window: Window | None = None
    self.state = StateStorage()

    self.auth_service = AuthService(self.state)
    self.settings_service = SettingsService(self.state)

    self.modpack_service: ModpacksService | None = None
    self.launcher_service: LauncherService | None = None

    self.async_loop = asyncio.new_event_loop()
    self._launch_future: Future | None = None

    threading.Thread(
      target=self._start_loop, 
      daemon=True, 
      name="AsyncioThread"
    ).start()

  def _start_loop(self) -> None:
    asyncio.set_event_loop(self.async_loop)
    self.async_loop.run_forever()

  def set_window(self, window: Window) -> None:
    self.window = window

  def _run_async(self, coro: Coroutine):
    future = asyncio.run_coroutine_threadsafe(coro, self.async_loop)
    return future.result()

  def destroy_window(self) -> None:
    if self._launch_future and not self._launch_future.done():
      self._launch_future.cancel()

    self.async_loop.call_soon_threadsafe(self.async_loop.stop)
    if self.window:
      self.window.destroy()
    exit()

  def minimize_window(self) -> None:
    if self.window:
      self.window.minimize()

  def login_perform(self, creds: dict) -> dict:
    payload = self._run_async(
      self.auth_service.login_perform(creds.get("username"), creds.get("password"))
    )
    return payload.model_dump(exclude={"session_token"}, by_alias=True)

  def logout_perform(self) -> None:
    self.auth_service.logout_perform()

  def load_modpacks_data(self) -> list:
    modpacks = self._run_async(ModpacksService.load_modpacks_data())
    return [modpack.model_dump(by_alias=True) for modpack in modpacks]

  def load_settings(self) -> dict:
    settings = self.settings_service.load_settings()
    return settings.model_dump(by_alias=True, mode="json")

  def save_settings(self, settings: dict) -> None:
    self.settings_service.set_settings(settings)

  def select_game_folder(self) -> str | None:
    if not self.window:
      raise RuntimeError("WINDOW_NOT_INITIALIZED")
    return self.settings_service.select_game_folder(self.window)

  def launch_game(self, modpack_id: str) -> None:
    if not self.auth_service.username or not self.auth_service.session_token:
      raise RuntimeError("NOT_AUTHORIZED")

    if not self.window:
      raise RuntimeError("WINDOW_NOT_INITIALIZED")

    if self._launch_future and not self._launch_future.done():
      logger.warning("Launch attempt blocked: process is already running.")
      return

    log_bridge = LogBridge(self.window)
    settings = self.settings_service.load_settings()
    session = self.auth_service.launch_session

    cache_file = settings.base_folder / ".launcher_cache"
    cache_storage = ModpacksCacheStorage(cache_file)

    command_service = GameCommandService()
    self.modpack_service = ModpacksService(log_bridge, cache_storage)
    self.launcher_service = LauncherService(
      self.modpack_service,
      log_bridge,
      command_service
    )

    self._launch_future = asyncio.run_coroutine_threadsafe(
      self.launcher_service.launch_game(
        modpack_id,
        session,  # type: ignore
        settings
      ),
      self.async_loop
    )

    def _on_launch_complete(future: Future) -> None:
      try:
        future.result()
      except CancelledError:
        logger.info(f"Launch of modpack {modpack_id} was cancelled by user.")
        log_bridge.resource_log(statusText="Cancelled")
      except Exception as exc:
        logger.critical(f"Launch error: {exc}")
        log_bridge.resource_log(statusText=f"Error: {exc}")
      finally:
        self._launch_future = None

    self._launch_future.add_done_callback(_on_launch_complete)

  def cancel_launch(self) -> None:
    if self.launcher_service and self.launcher_service._active_process:
      logger.info("Killing active game process...")
      self._run_async(self.launcher_service.kill_game())

    if self._launch_future and not self._launch_future.done():
      logger.info("Cancelling active launch/download task...")
      self._launch_future.cancel()