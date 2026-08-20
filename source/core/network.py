from pathlib import Path
from typing import Callable
from loguru import logger
import hashlib
import aiofiles
import httpx


class HttpClient:
  def __init__(
    self, 
    base_url: str = "http://127.0.0.1:1070/v1/", 
    timeout: float = 10.0,
    max_connections: int = 10,
    max_keepalive: int = 5
  ):
    limits = httpx.Limits(
      max_connections=max_connections, 
      max_keepalive_connections=max_keepalive
    )

    self.client = httpx.AsyncClient(
      base_url=base_url,
      timeout=httpx.Timeout(timeout),
      limits=limits
    )


  async def __aenter__(self) -> "HttpClient":
    return self

  async def __aexit__(self, exc_type, exc_val, exc_tb) -> None:
    await self.close()

  async def close(self) -> None:
    await self.client.aclose()


  async def _request(
    self, 
    method: str, 
    url: str, 
    **kwargs
  ) -> dict:
    try:
      response = await self.client.request(method, url, **kwargs)
      response.raise_for_status()
      return response.json()
    
    except httpx.HTTPStatusError as e:
      logger.error(
        f"HTTP {e.response.status_code} on {e.request.method} {e.request.url}"
      )
      raise RuntimeError(f"API request failed with status {e.response.status_code}") from None
    
    except httpx.RequestError as e:
      logger.error(f"Network error on {method} {url}: {e}")
      raise RuntimeError(f"Network error occurred during {method} {url}") from None


  async def login_perform(self, username: str, password: str, hwid: str):
    return await self._request(
      "POST",
      "/auth/login",
      json={"username": username, "password": password, "hwid": hwid}
    )
  
  async def load_modpacks_data(self) -> dict:
    return await self._request(
      "GET",
      "/modpacks"
    )
  
  async def load_modpack_manifest(self, modpack_id: str) -> dict:
    return await self._request(
      "GET",
      f"/modpacks/{modpack_id}"
    )
  
  async def download_file(
    self, 
    url: str, 
    destination: Path, 
    expected_sha1: str | None = None,
    chunk_callback: Callable | None = None
  ) -> bool:
    destination.parent.mkdir(parents=True, exist_ok=True)
    logger.debug(f"Downloading file: {url}")

    try:
      async with self.client.stream("GET", url) as response:
        if response.status_code != 200:
          logger.error(f"Failed to download {url}: Status {response.status_code}")
          return False

        sha1 = hashlib.sha1()
        
        async with aiofiles.open(destination, "wb") as f:
          async for chunk in response.aiter_bytes(chunk_size=65536):
            await f.write(chunk)
            if expected_sha1:
              sha1.update(chunk)
            if chunk_callback:
              chunk_callback(len(chunk))

        if expected_sha1 and sha1.hexdigest() != expected_sha1.lower():
          logger.error(f"Hash mismatch for {destination.name}. Expected {expected_sha1}, got {sha1.hexdigest()}")
          if destination.exists():
            destination.unlink()
          return False

        return True

    except Exception as e:
      logger.error(f"Error downloading {url} to {destination}: {e}")
      if destination.exists():
        destination.unlink()
      return False