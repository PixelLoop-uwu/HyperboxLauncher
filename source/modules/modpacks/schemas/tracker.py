from pydantic import BaseModel

class ProgressSnapshot(BaseModel):
  percentage: float
  total_bytes: int
  transferred_bytes: int
  speed_kbps: float
  eta_seconds: int | None