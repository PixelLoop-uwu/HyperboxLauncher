from loguru import logger
import sys


def setup_logging(level: str = "DEBUG"):
  logger.remove()

  log_format = (
    "<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "
    "<level>{level: <8}</level> | "
    "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - "
    "<level>{message}</level>"
  )

  logger.add(
    sys.stdout,
    level=level,
    format=log_format,
    colorize=True,
    backtrace=True, 
    diagnose=True
  )