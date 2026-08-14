import time

from loguru import logger
from webview import Window
import json

class LogBridge:
  def __init__(self, window: Window) -> None:
    self.window = window

  def resource_log(
    self,
    statusText: str | None = None,
    percentage: float | int | None = None,
    totalBytes: int | None = None,
    transferredBytes: int | None = None,
    speedKbps: float | None = None,
    etaSeconds: float | int | None = None
  ) -> None:
    data = {
      "statusText": statusText,
      "percentage": percentage,
      "totalBytes": totalBytes,
      "transferredBytes": transferredBytes,
      "speedKbps": speedKbps,
      "etaSeconds": etaSeconds
    }
    
    clean_data = {k: v for k, v in data.items() if v is not None}

    safe_data = json.dumps(clean_data)
    logger.debug(f"Sending to JS: {safe_data}")
    self.window.evaluate_js(f"window.onResourceLog({safe_data})")

  def game_log(self, message: str, type: str = "info", timestamp: int | None = None) -> None:
    log_data = {
      "type": type,
      "message": message,
      "timestamp": timestamp or int(time.time())
    }
    json_string = json.dumps(json.dumps(log_data))
    self.window.evaluate_js(f"window.onGameLog(JSON.parse({json_string}))")


  def game_terminated(self, exit_code: int) -> None:
    self.window.evaluate_js(f"window.onGameProcessTerminated({exit_code})")