import platform
from shared.schemas.system import OSType


def get_os_type() -> OSType:
  os_name = platform.system()
  try:
    return OSType(os_name)
  except ValueError:
    return OSType.UNKNOWN