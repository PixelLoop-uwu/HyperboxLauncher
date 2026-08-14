import hashlib
import platform
import uuid

def get_hwid() -> str:
  hwid_str = f"{platform.processor()}|{platform.node()}|{uuid.getnode()}"
  return hashlib.sha256(hwid_str.encode("utf-8")).hexdigest()
