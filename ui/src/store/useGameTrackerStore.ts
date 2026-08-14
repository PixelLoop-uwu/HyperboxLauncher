import { create } from 'zustand';
import type { gameLog } from '@/types/launch';
import { getPywebviewApi } from '@/utils/pywebview';


type TrackerState = {
  gameLogs: gameLog[];

  initTracking: () => void;
  clearLogs: () => void;
  terminateGame: () => void;
}

export const useGameTrackerStore = create<TrackerState>((set, get) => ({
  gameLogs: [],

  initTracking: () => {
    window.onGameLog = (log: gameLog) => {
      set((state) => ({
        gameLogs: [...state.gameLogs, log]
      }))
  }},

  clearLogs: () => {
    delete window.onGameLog;

    set({ 
      gameLogs: []
    })},

  terminateGame: async () => {
      const api = await getPywebviewApi();
      await api.terminate_game();
    }
}))