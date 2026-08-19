# HyperBox Launcher

HyperBox Launcher is a desktop launcher for Minecraft servers that distribute custom modpacks. The project has a Python backend that manages authentication, download synchronization, Java and native setup, and game launch orchestration, while the frontend is a React + TypeScript UI rendered through `pywebview`.

This is not a generic game launcher template. The codebase is structured around a custom server-driven modpack ecosystem: the launcher fetches modpack metadata from an API, validates file integrity, downloads only the files required for the selected Java version and platform, and launches the game with the correct classpath, JVM arguments, and session token.

## Core capabilities

- User authentication against a backend API
- Modpack catalog loading from a remote API
- Manifest-based modpack resolution and file validation
- Download caching with SHA-1 verification
- Java runtime detection and launcher command generation
- Native library preparation for the current OS
- Modular launch flow for the Minecraft client process
- Local settings persistence for RAM, fullscreen, base game folder, and debug options
- Real-time progress and log bridge from Python to the UI

## Architecture

The project uses a clear split between desktop shell, backend services, and front-end logic.

### 1. Desktop shell

The main entry point is `source/main.py`.

- Initializes application logging
- Detects the operating system
- Creates a `pywebview` window
- Exposes a Python API object to the UI through `js_api`
- Opens the UI in debug mode against a local Vite dev server or uses a packaged static page in production

This makes the launcher behave like a native desktop app while still rendering a web interface.

### 2. Python backend bridge

The bridge layer is defined in `source/web_bridge.py`.

It exposes methods such as:

- `login_perform()`
- `logout_perform()`
- `load_modpacks_data()`
- `load_settings()`
- `save_settings()`
- `select_game_folder()`
- `launch_game()`
- `cancel_launch()`

The backend runs an asyncio loop in a background thread. UI calls go through `pywebview` to Python methods, which then delegate to service objects. The launch process can run asynchronously while the UI continues to update progress and logs.

### 3. Service layer

Core services are organized under `source/modules/` and `source/core/`.

- `modules/auth/service.py`
  - Handles login flow
  - Stores username and session token
  - Uses a hardware ID (`get_hwid`) for server-side auth

- `modules/modpacks/service.py`
  - Loads modpack metadata from the API
  - Fetches modpack manifests
  - Verifies local files against the manifest
  - Downloads missing or invalid files
  - Removes stale files from modpack directories
  - Maintains a SHA-1 cache to avoid unnecessary re-downloads

- `modules/launch/services/command.py`
  - Resolves Java executable path
  - Builds the final JVM and game argument list
  - Prepares the native libraries directory
  - Constructs the classpath and module path from the manifest

- `modules/launch/services/launch.py`
  - Starts the Minecraft process as a subprocess
  - Writes the session token to the child process
  - Monitors stdout/stderr and forwards logs to the UI
  - Handles process termination and cancellation

- `modules/settings/service.py`
  - Loads and saves application settings
  - Opens the native folder picker dialog

### 4. Persistence and cache layer

The launcher keeps local state in a small, deterministic data model.

- `source/core/services/state_storage.py`
  - Stores auth credentials and launcher settings to disk
  - Uses `pickle` for the app config state

- `source/core/services/cache_storage.py`
  - Persists file metadata including SHA-1, size, and modification time
  - Prevents repeated downloads when a file is already valid

### 5. Shared schemas and data contracts

The `source/shared` package defines the strong data model used across the application:

- `shared/schemas/state.py` for launcher settings and app state
- `shared/schemas/modpack.py` for modpack manifests and file metadata
- `shared/schemas/auth.py` for auth/session payloads
- `shared/schemas/cache.py` for cache representation

The app uses `pydantic` models heavily to validate incoming API payloads and to stabilize the local configuration schema.

## Modpack system design

The launcher treats each modpack as a manifest-driven release package. The manifest includes:

- modpack ID and display name
- game version
- required Java version
- launch class and native settings
- JVM argument list and game argument list
- a list of files with URL, hash, size, type, and OS applicability

The `ModpackManifest` includes file entries of types such as `client`, `library`, `native`, `java`, and `asset`. The command builder resolves file paths based on the selected Java version and target platform, then assembles the final launch command.

This is important because the project is designed for multiple custom modpack builds and not for a single hardcoded game configuration.

## Front-end architecture

The UI is organized under `ui/` and built with React 19 and Vite.

### Front-end stack

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Zustand for state management
- TanStack Query for async data loading
- Framer Motion for UI transitions
- Radix-based primitives and shadcn-style component patterns
- Lucide icons and custom background effects

### UI state flow

The frontend uses Zustand stores:

- `useAuthStore` for login/logout and auth state
- `useSettingsStore` for launcher settings and folder selection
- `useLauncherStore` for launch lifecycle, progress state, and game logs
- `useModpacks` hook for fetching modpack data through React Query

The app uses route guards to protect authenticated screens such as the home page and debug console.

## Network and API layer

The Python side uses `httpx` via `source/core/network.py`.

Available API calls include:

- `POST /auth/login`
- `GET /modpacks`
- `GET /modpacks/{modpack_id}`
- download helpers for modpack file transfer

The launcher expects a backend API at:

`http://127.0.0.1:1070/v1/`

This is defined in `source/core/consts.py` and is the main integration point for modpack metadata and authentication.

## Launch lifecycle

The actual launch flow is:

1. User selects a modpack from the UI.
2. Front-end calls `launch_game(modpack_id)` on the Python API.
3. `WebViewApi.launch_game()` verifies the active session.
4. `ModpacksService.sync_release()` checks whether required files are present and valid.
5. Missing or corrupted files are downloaded and verified by SHA-1.
6. `GameCommandService.build()` assembles the Java command for the correct modpack release.
7. `LauncherService.launch_game()` starts the Minecraft process in a dedicated subprocess.
8. The process stdout/stderr is forwarded to the UI log bridge.
9. The launcher monitors the process and updates the UI as it exits.

## Technology stack

### Python

- Python 3.11+
- `pywebview` for the desktop window
- `httpx` for HTTP communication
- `pydantic` for validation and typed schemas
- `loguru` for structured logging
- `aiofiles` for async file I/O
- `psutil` for memory detection and local system data
- `PySide6` / Qt support on Linux via `pywebview`

### Front-end

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Zustand
- TanStack Query
- Framer Motion

## Project structure

```text
launcher/
├── manifest.jsonc                 # Example modpack manifest schema
├── pyproject.toml                 # Python project metadata and dependencies
├── README.md                      # Project documentation
├── source/
│   ├── __init__.py
│   ├── main.py                    # Desktop application entry point
│   ├── web_bridge.py              # Python API bridge for pywebview
│   ├── core/
│   │   ├── consts.py              # Global constants and app config
│   │   ├── network.py             # HTTP client and API requests
│   │   ├── log_bridge.py          # UI log forwarding helpers
│   │   └── services/
│   │       ├── cache_storage.py   # Persistent modpack cache
│   │       └── state_storage.py   # Local settings/auth persistence
│   ├── modules/
│   │   ├── auth/
│   │   ├── launch/
│   │   ├── modpacks/
│   │   └── settings/
│   └── shared/
│       ├── schemas/
│       └── utils/
├── ui/
│   ├── package.json
│   ├── vite.config.ts
│   └── src/
│       ├── App.tsx
│       ├── components/
│       ├── hooks/
│       ├── pages/
│       ├── providers/
│       ├── store/
│       ├── types/
│       └── utils/
└── ...
```

## Development setup

### Requirements

- Python 3.11 or newer
- Node.js 20+ and npm
- A local backend API exposing the modpack/auth endpoints

### Python environment

```bash
uv sync
```

### Front-end setup

```bash
cd ui
npm install
npm run dev
```

### Run the application

With debug mode enabled by default, the launcher is expected to run in a desktop shell while the UI is served by the Vite dev server.

```bash
cd launcher
source .venv/bin/activate
uv run  source/main.py
```

The app points to the Vite login route in debug mode:

`http://localhost:5173/login`

This makes local development straightforward: the Python desktop shell hosts the app while the React UI is served from the frontend dev server.

## Operational notes

- The launcher is intentionally built around a server-managed modpack system rather than embedding modpack data in the client.
- File integrity is validated using SHA-1 before a file is treated as valid.
- The launcher stores local metadata so repeated launches do not re-download unchanged files.
- The system prepares OS-specific native libraries and classpath entries dynamically.
- The UI and backend are tightly coupled through `pywebview`; all launcher actions are triggered from the Python side, not from a browser-only runtime.
