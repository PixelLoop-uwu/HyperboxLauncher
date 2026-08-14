import { motion, AnimatePresence } from 'framer-motion';
import { Play, Server, Loader2, ShieldAlert } from "lucide-react";

import { useLauncherStore } from '@/store/useLauncherStore';
import { useAuthStore } from '@/store/useAuthStore';

type ModpackActionBarProps = {
  modpackName: string;
  onPlay?: () => void;
}

export default function ModpackActionBar({ modpackName, onPlay }: ModpackActionBarProps) {
  const { status } = useLauncherStore();
  const { user } = useAuthStore();

  const isBanned = user?.ban?.active;
  const isLoading = status === "launching";
  const isRunning = status === "running";
  
  const isDisabled = isLoading || isRunning || isBanned;

  const getButtonText = () => {
    if (isLoading) return "Загрузка...";
    if (isRunning) return "В игре";
    if (isBanned) return "Отказанно";
    return "Играть";
  };

  const getButtonStyles = () => {
    if (isLoading) {
      return "bg-zinc-800/40 border-zinc-700/50 text-zinc-400 cursor-not-allowed";
    }
    if (isRunning) {
      return "bg-indigo-500/10 border-indigo-500/30 text-indigo-400 cursor-default";
    }
    if (isBanned) {
      return "bg-rose-500/20 border-rose-500/40 text-rose-400 cursor-not-allowed";
    }
    return "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/50";
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 100, damping: 15, delay: 0.1 }}
      className="w-full max-w-4xl flex items-center justify-between border border-zinc-800/80 rounded-xl p-3 bg-zinc-900/10 backdrop-blur-md"
    >

      <div className="flex items-center gap-3 min-w-0 pl-1">
        <div className="p-2 bg-indigo-950/20 text-indigo-400 rounded-lg border border-indigo-900/30 shrink-0">
          <Server className="w-4 h-4" />
        </div>

        <div className="flex flex-col min-w-0">
          <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider leading-none mb-1">
            Выбранный сервер
          </span>
          <div className="overflow-hidden h-5 relative flex items-center">
            <AnimatePresence mode="wait">
              {modpackName && (
                <motion.span
                  key={modpackName}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.15, ease: 'easeInOut' }}
                  className="text-sm font-semibold text-zinc-200 truncate max-w-60 sm:max-w-112.5"
                >
                  {modpackName}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <motion.button
        whileTap={!isDisabled ? { scale: 0.97 } : undefined}
        onClick={onPlay}
        disabled={isDisabled}
        title={isBanned && user.ban.reason ? `Причина: ${user.ban.reason}` : undefined}
        className={`flex items-center gap-2 px-8 py-2 border rounded-lg text-sm font-semibold transition-all duration-200 shrink-0 disabled:opacity-60 ${getButtonStyles()}`}
      >
        {isLoading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : isRunning ? (
          <Server size={16} />
        ) : isBanned ? (
          <ShieldAlert size={16} />
        ) : (
          <Play size={16} className="fill-emerald-400/20" />
        )}
        
        <span>{getButtonText()}</span>
      </motion.button>

    </motion.div>
  )
}