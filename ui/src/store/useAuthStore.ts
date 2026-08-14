import { create } from 'zustand';

import { getPywebviewApi } from '@/utils/pywebview';
import type { LoginCreds, User } from '@/types/auth';


type AuthState = {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  hasTriedConfigAuth: boolean;
  login: (creds: LoginCreds, isAutoAttempt?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  hasTriedConfigAuth: false,
  error: null,

  clearError: () => set({ error: null }),

  login: async (creds, isAutoAttempt = false) => {
    set({ isLoading: true, error: null, hasTriedConfigAuth: true });
    try {
      const api = await getPywebviewApi();
      const result = await api.login_perform(creds);

      if (result.success) {
        set({ user: result.user, isLoading: false });
        return;
      }

      // For auto-attempts, only show errors about invalid credentials/bans, not network issues
      const shouldShowError = !isAutoAttempt || result.error?.includes('Username') || result.error?.includes('Password') || result.error?.includes('banned');
      
      if (shouldShowError) {
        set({ error: result.error || 'Неверные данные' });
      }
      
      set({ isLoading: false });
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : 'Ошибка связи с сервером';
      
      // For auto-attempts, silently fail if it's a connection error
      if (!isAutoAttempt) {
        set({ error: errorMsg });
      }
      
      set({ isLoading: false });
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      const api = await getPywebviewApi();
      await api.logout_perform();
    } catch (e) {
      console.error('Не удалось чисто разлогиниться на бэке:', e);
    } finally {
      set({ user: null, isLoading: false, error: null });
    }
  }
}));