import { motion, AnimatePresence } from 'framer-motion';
import { Box, LogOut, Minus, Square, X, Settings, ShieldAlert } from 'lucide-react';
import { useLocation } from 'react-router-dom';

import { useAuthStore } from '@/store/useAuthStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { getPywebviewApi } from '@/utils/pywebview';

export default function AppHeader() {
  const { user, logout } = useAuthStore();
  const { openSettings } = useSettingsStore();
  const location = useLocation();

  const showWidgets = user && location.pathname === '/home';

  const minimizeHandle = async () => {
    try {
      const api = await getPywebviewApi();
      api.minimize_window();
    } catch (e) {
      // ignore if API not available
    }
  };

  const destroyHandle = async () => {
    try {
      const api = await getPywebviewApi();
      api.destroy_window();
    } catch (e) {
      // ignore if API not available
    }
  };

  return (
    <header className="flex items-center justify-between h-12 p-2 select-none pywebview-drag-region">
      <div className="flex items-center gap-2.5">
        <div className="p-1.5 bg-zinc-800/50 rounded-md border border-zinc-700/50 flex items-center justify-center">
          <Box size={16} className="text-zinc-300" />
        </div>
        <span className="text-sm font-semibold text-zinc-200 tracking-wide leading-none pt-px">
          HyperBox
        </span>
      </div>

      <div className="flex items-center gap-4">
        <AnimatePresence mode="popLayout">
          {showWidgets && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-4"
            >
              <div className="flex items-center gap-2.5 bg-zinc-900/40 border border-zinc-800/80 pl-2 pr-1.5 py-1 rounded-lg">
                <div className="flex items-center gap-2">
                  <img 
                    src={user.avatarUrl} 
                    alt={user.username} 
                    className="w-5 h-5 rounded-full object-cover bg-zinc-800 border border-zinc-700/50 shrink-0"
                  />
                  <span className="text-xs font-medium text-zinc-300 max-w-25 truncate pt-px">
                    {user.username}
                  </span>
                </div>
                
                {user.ban.active && (
                  <div 
                    className="flex items-center gap-1 px-1.5 py-0.5 bg-red-500/10 border border-red-500/20 rounded text-[10px] font-bold text-red-400 uppercase tracking-wider cursor-help"
                    title={user.ban.reason ? `Причина: ${user.ban.reason}` : 'Аккаунт заблокирован'}
                  >
                    <ShieldAlert size={10} className="shrink-0" />
                    <span>Banned</span>
                  </div>
                )}

                <div className="w-px h-3.5 bg-zinc-800/80" />

                <button
                  onClick={() => logout()}
                  className="p-1 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors duration-150 flex items-center justify-center"
                  title="Выйти из аккаунта"
                >
                  <LogOut size={13} />
                </button>
              </div>
            </motion.div>
          )}

          {showWidgets && (
            <motion.button
              key="settings-btn"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.15 }}
              onClick={() => openSettings()}
              className="p-1.5 bg-zinc-800/50 hover:bg-zinc-800 rounded-md border border-zinc-700/50 hover:border-zinc-600 flex items-center justify-center text-zinc-300 hover:text-zinc-100 transition-all duration-150"
            >
              <Settings size={16} />
            </motion.button>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-1">
          <button 
            onClick={minimizeHandle}
            className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-md transition-colors duration-150 flex items-center justify-center"
            aria-label="Свернуть"
          >
            <Minus size={14} />
          </button>
          <button 
            onClick={destroyHandle}
            className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/20 rounded-md transition-colors duration-150 flex items-center justify-center"
            aria-label="Закрыть"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </header>
  );
}