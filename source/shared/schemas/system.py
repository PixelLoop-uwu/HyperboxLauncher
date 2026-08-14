from enum import Enum

class OSType(str, Enum):
  WINDOWS = "Windows"
  MACOS = "Darwin"
  LINUX = "Linux"
  UNKNOWN = "Unknown"