import { create } from "zustand"
import { getPywebviewApi } from "@/utils/pywebview"
import type { Settings } from "@/types/settings"

type SettingsState = {
  settings: Settings | null
  isOpen: boolean
  isLoading: boolean
  
  fetchSettings: () => Promise<void>
  openSettings: () => void
  closeSettings: () => void
  saveSettings: (settings: Partial<Settings>, close?: boolean) => Promise<void>
  selectGameFolder: () => Promise<void>
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: null,
  isOpen: false,
  isLoading: false,

  fetchSettings: async () => {
    set({ isLoading: true })
    try {
      const api = await getPywebviewApi()
      const result = await api.load_settings()
      if (result) {
        set({ settings: result })
      }
    } catch (e) {
      console.error("Ошибка загрузки настроек:", e)
    } finally {
      set({ isLoading: false })
    }
  },

  openSettings: () => set({ isOpen: true }),
  closeSettings: () => set({ isOpen: false }),

  saveSettings: async (newSettings, close) => {
    const currentSettings = get().settings
    if (!currentSettings) return

    if (!newSettings || Object.keys(newSettings).length === 0) {
      set({ isOpen: false })
      return
    }

    const updated = { ...currentSettings, ...newSettings }

    try {
      const api = await getPywebviewApi()
      await api.save_settings(updated)
      set({ settings: updated })

    } catch (e) {
      console.error("Ошибка сохранения настроек:", e)
    } finally {
      if (close) set({ isOpen: false })
    }
  },

  selectGameFolder: async () => {
    const currentSettings = get().settings
    if (!currentSettings) return

    try {
      const api = await getPywebviewApi()
      const selectedPath = await api.select_game_folder()
      
      if (selectedPath) {
        const updated = { ...currentSettings, baseFolder: selectedPath }

        set({ settings: updated })
      }
    } catch (e) {
      console.error("Ошибка при выборе папки игры:", e)
    }
  }
}))