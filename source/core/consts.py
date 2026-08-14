from pathlib import Path

from pydantic import BaseModel
from shared.utils.path import get_default_directory


class Consts(BaseModel):
  API: str = "http://127.0.0.1:1070/v1/"
  DEBUG: bool = True

  MAIN_DIR: Path = get_default_directory()
  CONFIG_FILE: Path = MAIN_DIR / "config.bin"
  CACHE_FILE: Path = MAIN_DIR / ".launcher_cache"

  DEFAULT_GAME_SETTINGS: dict = {
    "fullscreen": False,
    "rich_presence": True,
    "debug": False,
    
    "base_folder": MAIN_DIR,
  }

  MAX_CONCURRENT_DOWNLOADS = 5
  MAX_CONCURRENT_HASHES = 3

consts = Consts()
