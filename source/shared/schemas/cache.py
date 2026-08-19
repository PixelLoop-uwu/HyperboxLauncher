from pydantic import BaseModel, Field


class CachedFile(BaseModel):
  sha1: str
  size: int
  mtime: float

class ModpackCacheModel(BaseModel):
  files: dict[str, CachedFile] = Field(default_factory=dict)
