import asyncio
from collections import deque
import time

from core.log_bridge import LogBridge
from .schemas.tracker import ProgressSnapshot


class DownloadProgressNotifier:
  def __init__(
    self,
    total_bytes: int,
    log_bridge: LogBridge,
    loop: asyncio.AbstractEventLoop,
    window_size: float = 2.0
  ) -> None:
    self.total_bytes = total_bytes
    self.log_bridge = log_bridge
    self.loop = loop
    self.window_size = window_size

    self.transferred_bytes = 0
    self.history: deque[tuple[float, int]] = deque()
    self.lock = asyncio.Lock()

  def __call__(self, chunk_len: int) -> None:
    asyncio.run_coroutine_threadsafe(self._update_and_log(chunk_len), self.loop)

  async def _update_and_log(self, chunk_len: int) -> None:
    async with self.lock:
      snapshot = self._update(chunk_len)

    self.log_bridge.resource_log(
      percentage=snapshot.percentage,
      totalBytes=snapshot.total_bytes,
      transferredBytes=snapshot.transferred_bytes,
      speedKbps=snapshot.speed_kbps,
      etaSeconds=snapshot.eta_seconds
    )

  def _update(self, bytes_count: int) -> ProgressSnapshot:
    now = time.monotonic()
    self.transferred_bytes += bytes_count
    self.history.append((now, self.transferred_bytes))

    cutoff = now - self.window_size
    while len(self.history) > 1 and self.history[0][0] < cutoff:
      self.history.popleft()

    if len(self.history) >= 2:
      time_diff = self.history[-1][0] - self.history[0][0]
      bytes_diff = self.history[-1][1] - self.history[0][1]
      speed = bytes_diff / time_diff if time_diff > 0 else 0.0
    else:
      speed = 0.0

    percent = (self.transferred_bytes / self.total_bytes * 100) if self.total_bytes > 0 else 0.0
    remaining_bytes = max(0, self.total_bytes - self.transferred_bytes)
    eta = remaining_bytes / speed if speed > 0 else None

    return ProgressSnapshot(
      percentage=round(percent, 1),
      total_bytes=self.total_bytes,
      transferred_bytes=self.transferred_bytes,
      speed_kbps=round(speed / 1024, 1),
      eta_seconds=round(eta) if eta is not None else None
    )