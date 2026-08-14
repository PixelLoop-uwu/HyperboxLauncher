import logging
import sys
from loguru import logger

class InterceptHandler(logging.Handler):
  def emit(self, record: logging.LogRecord) -> None:
    try:
      level = logger.level(record.levelname).name
    except ValueError:
      level = record.levelno

    frame, depth = logging.currentframe(), 2
    while frame and frame.f_code.co_filename == logging.__file__:
      frame = frame.f_back
      depth += 1

    logger.opt(depth=depth, exception=record.exc_info).log(
      level, record.getMessage()
    )


def setup_logging(log_level: str = "INFO") -> None:
  logger.remove()

  console_format = (
    "<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "
    "<level>{level}</level> | "
    "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>"
  )

  logger.add(
    sys.stdout,
    format=console_format,
    level=log_level
  )

  logging.basicConfig(handlers=[InterceptHandler()], level=0, force=True)

  for log_name in ("pywebview", "qasync", "urllib3", "pyside6", "pygobject", "pyqt"):
    logging_logger = logging.getLogger(log_name)
    logging_logger.handlers = []
    logging_logger.propagate = True