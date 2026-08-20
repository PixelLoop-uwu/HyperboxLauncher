import { create } from 'zustand';
import type { gameLog } from '@/types/launch';
import { getPywebviewApi } from '@/utils/pywebview';

type GameLogsState = {
  gameLogs: gameLog[];
  recentExitCode?: number;

  initTracking: () => void;
  clearLogs: () => void;
};

export const useGameLogsStore = create<GameLogsState>((set) => ({
  gameLogs: [],

  initTracking: () => {
    window.onGameLog = (log: gameLog) => {
      set((state) => ({
        gameLogs: [...state.gameLogs, log].slice(-1000)
      }));
    };
  },

  clearLogs: () => {
    set({ gameLogs: [] });
  }

}));