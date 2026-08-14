import { create } from 'zustand';
import { getPywebviewApi } from '@/utils/pywebview';
import type { gameLog, ResourceProgress } from '@/types/launch';


type LauncherState = {
  status: "idle" | "launching" | "running" | "error";
  resourceProgress: ResourceProgress | null;
  error: string | null;
  gameLogs: gameLog[];

  launchGame: (modpack_id: string) => Promise<void>;
  cancelLaunch: () => Promise<void>;
  setLauncherError: (message: string) => void;
  resetLauncherState: () => void;
}

export const useLauncherStore = create<LauncherState>((set, get) => ({
  status: "idle",
  resourceProgress: null,
  error: null,
  gameLogs: [],

  launchGame: async (modpack_id: string) => {
    const api = await getPywebviewApi();

    set({ 
      status: "launching",
      error: null, 
      resourceProgress: { statusText: "Инициализация...", percentage: 0 } 
    })

    window.onResourceLog = (progress: Partial<ResourceProgress>) => {
      set((state) => ({
        resourceProgress: state.resourceProgress 
          ? { ...state.resourceProgress, ...progress }
          : (progress as ResourceProgress)
      }))
    }

    window.onGameProcessTerminated = (exitCode: number) => {
      set({
        status: "idle",
        error: exitCode == 1 && "Во время запуска игры произошла ошибка"
      })
    }

    try {
      await api.launch_game(modpack_id);

      set({ status: "running", resourceProgress: null });
      
    } catch (err: any) {
      const errMsg = err?.message || String(err);

      if (errMsg.includes("LAUNCH_CANCELLED")) {
        set({ status: "idle", resourceProgress: null });
        return; 
      }

      set({ status: "error", error: errMsg, resourceProgress: null });
      throw err;
    } finally {
      delete (window as any).onResourceLog;
    }
  },

  cancelLaunch: async () => {
    const api = await getPywebviewApi();

    try {
      await api.cancel_launch();
      get().resetLauncherState()
    } catch (err) {
      console.error("Ошибка при отмене запуска на стороне бэкенда:", err);
    }
  },

  setLauncherError: (message: string) => {
    set({ status: "error", error: message, resourceProgress: null });
    
    delete window.onResourceLog;
    delete window.onGameProcessTerminated;
  },

  resetLauncherState: () => {
    delete window.onResourceLog;
    delete window.onGameProcessTerminated;

    set({ 
      status: "idle",
      resourceProgress: null, 
      error: null 
    });
  },

}));