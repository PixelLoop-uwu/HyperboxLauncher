from pathlib import Path
from webview import FileDialog, Window
from loguru import logger

from core.services import StateStorage
from shared.schemas.state import Settings


class SettingsService:
  def __init__(self, state: StateStorage) -> None:
    self.state = state

  def load_settings(self) -> Settings:
    return self.state.current.settings

  def set_settings(self, settings: dict) -> None:
    validated = Settings.model_validate(settings)
    self.state.update(settings=validated.model_dump(by_alias=True))
    logger.info("Settings updated")

  def select_game_folder(self, window: Window) -> str | None:
    result = window.create_file_dialog(FileDialog.FOLDER)  # type: ignore

    if not result:
      return None

    new_path = str(Path(result[0]).resolve())
    self.state.update(settings={"gameDir": new_path})
    logger.info(f"Game directory set to: {new_path}")
    return new_path