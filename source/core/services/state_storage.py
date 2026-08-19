import pickle
from pathlib import Path
from typing import Any
from pydantic import ValidationError
from loguru import logger

from core.consts import consts
from shared.schemas.settings import StateModel, RecentAuthCreds, Settings


class StateStorage:
  def __init__(self, config_file: Path = consts.CONFIG_FILE) -> None:
    self.config_file = config_file
    self.current = self._load_state()

  def _default_state(self) -> StateModel:
    return StateModel(
      auth_creds=RecentAuthCreds(username="", password=""),
      settings=Settings.model_validate(consts.DEFAULT_GAME_SETTINGS),
    )

  def _save_to_disk(self) -> None:
    try:
      self.config_file.parent.mkdir(parents=True, exist_ok=True)
      with self.config_file.open("wb") as handle:
        clean_data = self.current.model_dump()
        pickle.dump(clean_data, handle)
        logger.info(clean_data)
    except OSError as e:
      logger.error("Failed to save state to disk: {}", e)

  def _load_state(self) -> StateModel:
    if not self.config_file.exists():
      self.current = self._default_state()
      self._save_to_disk()
      return self.current

    try:
      with self.config_file.open("rb") as handle:
        payload = pickle.load(handle)
      return StateModel.model_validate(payload)
    except (OSError, EOFError, pickle.PickleError, ValidationError) as e:
      logger.warning("State load failed, using defaults")
      self.current = self._default_state()
      self._save_to_disk()
      return self.current

  def update(self, **updates: Any) -> StateModel:
    current_data = self.current.model_dump()

    for key, value in updates.items():
      if key in current_data and isinstance(current_data[key], dict) and isinstance(value, dict):
        current_data[key].update(value)
      else:
        current_data[key] = value

    try:
      # adapt: if incoming update still uses 'config' key, map it to 'settings'
      if 'config' in current_data and 'settings' not in current_data:
        current_data['settings'] = current_data.pop('config')
      self.current = StateModel.model_validate(current_data)
      self._save_to_disk()
      logger.info("Configuration updated and saved")
    except ValidationError as e:
      logger.error("State update failed: {}", e)
      raise

    return self.current