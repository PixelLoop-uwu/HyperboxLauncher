import asyncio
from loguru import logger

from core.log_bridge import LogBridge
from modules.launch import GameCommandService
from modules.modpacks import ModpacksService
from shared.schemas.auth import LaunchSession
from shared.schemas.settings import Settings


class LauncherService:
  def __init__(
    self, 
    modpack_serv: ModpacksService, 
    log_bridge: LogBridge,
    command_service: GameCommandService
  ) -> None:
    self.modpack_serv = modpack_serv
    self.log_bridge = log_bridge
    self.command_service = command_service
    self._active_process: asyncio.subprocess.Process | None = None
    self._monitor_task: asyncio.Task | None = None

  async def launch_game(
    self, 
    modpack_id: str,
    session: LaunchSession,
    settings: Settings
  ) -> None:
    if self._active_process and self._active_process.returncode is None:
      self.log_bridge.game_log("Game is already running!")
      logger.warning("Launch attempt while process is already active.")
      return

    manifest = await self.modpack_serv.sync_release(modpack_id, settings.base_folder)
    cmd = self.command_service.build(manifest, settings, session)
    
    game_dir = settings.base_folder / "updates" / manifest.id

    logger.debug(f"Launch command: {' '.join(cmd)}")

    try:
      process = await asyncio.create_subprocess_exec(
        *cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
        cwd=str(game_dir)
      )
      self._active_process = process
      self.log_bridge.game_log(f"Process started (PID: {process.pid})")

      if process.stdin:
        await self._write_session_token(process, session.session_token)

      self._monitor_task = asyncio.create_task(
        self._monitor_process(modpack_id, process)
      )

    except Exception as e:
      self.log_bridge.game_log(f"Critical launch error: {e}")
      logger.critical(f"Launch error: {e}", exc_info=True)
      raise

  async def _write_session_token(
    self,
    process: asyncio.subprocess.Process,
    session_token: str
  ) -> None:
    if not process.stdin:
      logger.warning("Game process stdin is not available; session token was not sent.")
      return

    payload = f"{session_token}\n".encode("utf-8")
    process.stdin.write(payload)
    await process.stdin.drain()
    logger.debug("Session token was written to game stdin.")

  async def _monitor_process(
    self, 
    modpack_id: str, 
    process: asyncio.subprocess.Process
  ) -> None:
    try:
      tasks = []
      if process.stdout:
        tasks.append(self._read_stream(process.stdout, self.log_bridge.game_log))
      if process.stderr:
        tasks.append(self._read_stream(process.stderr, self.log_bridge.game_log))

      tasks.append(process.wait())
      await asyncio.gather(*tasks)

      logger.info(f"Process {modpack_id} exited with code: {process.returncode}")
      self.log_bridge.game_log(f"Process {modpack_id} exited with code: {process.returncode}")
      
      if hasattr(self.log_bridge, "game_terminated"):
        exit_code = process.returncode if process.returncode is not None else 0
        self.log_bridge.game_terminated(exit_code)

    except asyncio.CancelledError:
      logger.info(f"Process monitoring for {modpack_id} was cancelled.")
    except Exception as e:
      logger.error(f"Error monitoring process {modpack_id}: {e}")
    finally:
      if self._active_process == process:
        self._active_process = None

  @staticmethod
  async def _read_stream(stream: asyncio.StreamReader, log_func) -> None:
    while True:
      line = await stream.readline()
      if not line:
        break
      decoded = line.decode("utf-8", errors="replace").strip()
      if decoded:
        log_func(decoded)

  async def kill_game(self) -> bool:
    if not self._active_process:
      logger.warning("No active process to terminate.")
      return False

    try:
      self._active_process.terminate()
      try:
        await asyncio.wait_for(self._active_process.wait(), timeout=3.0)
      except asyncio.TimeoutError:
        logger.warning("Process did not terminate gracefully, forcing SIGKILL...")
        self._active_process.kill()
        await self._active_process.wait()

      logger.info("Process terminated successfully.")
      return True
    except Exception as e:
      logger.error(f"Failed to terminate process: {e}")
      return False
    finally:
      self._active_process = None