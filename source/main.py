import webview

from core.consts import consts
from shared.utils.logger import setup_logging
from shared.utils.system import get_os_type
from web_bridge import WebViewApi


def main():
  setup_logging("DEBUG" if consts.DEBUG else "INFO")

  os_type = get_os_type()
  url = "http://localhost:5173/" if consts.DEBUG else "web/index.html"
  gui_backend = "qt" if os_type == "linux" else None

  api = WebViewApi()

  window = webview.create_window(
    "Hyperbox Launcher",
    url,
    js_api=api,
    width=1050,
    height=580,
    min_size=(1050, 580),
    resizable=False,
    background_color="#0b0b10",
    frameless=(os_type != "darwin")
  )

  api.set_window(window) # type: ignore

  webview.start(gui=gui_backend, debug=consts.DEBUG)


if __name__ == "__main__":
  main()