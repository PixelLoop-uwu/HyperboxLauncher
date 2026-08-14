import type { LoginCreds, User, LoginResponse } from "./auth";
import type { ResourceProgress, gameLog } from "./launch";
import type { Modpack } from "./modpack";
import type { Settings } from "./settings";

interface PyWebViewAPI {
  destroy_window: () => void;
  minimize_window: () => void;

  login_perform: (creds: LoginCreds) => Promise<LoginResponse>;
  logout_perform: () => Promise<void>;

  load_modpacks_data: () => Promise<Modpack[]>;

  load_settings: () => Promise<Settings | null>;
  save_settings: (settings: Settings) => Promise<void>;
  select_game_folder: () => Promise<string | null>;

  launch_game: (modpack_id: string) => Promise<void>;
  cancel_launch: () => Promise<void>;
  terminate_game: () => Promise<void>;
}

declare global {
  interface Window {
    pywebview: {
      api: PyWebViewAPI;
    };

    onResourceLog?: (progress: ResourceProgress) => void;
    onGameLog?: (log: gameLog) => void;
    onGameProcessTerminated?: (exitCode: number) => void;
  }
}

export {};