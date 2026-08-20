import * as ScrollArea from '@radix-ui/react-scroll-area';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useMemo } from 'react';
import {
  XOctagon,
  Activity,
  ArrowDown,
  ArrowLeft,
  Clock,
} from 'lucide-react';
import { useGameLogsStore } from '@/store/useGameLogsStore';
import { useLaunchStore } from '@/store/useLaunchStore';
import { fadeContainerVariants, panelScaleUpVariants } from '@/constants/animationVariants';
import { formatElapsed } from '@/utils/utils';
import { useElapsedTimer } from '@/hooks/useElapsedTimer';
import { useAutoScroll } from '@/hooks/useAutoScroll';
import { LogItem } from '@/components/debug/LogItem';


export default function DebugPage() {
  const { gameLogs } = useGameLogsStore();
  const { status, cancelLaunch } = useLaunchStore();
  const navigate = useNavigate();

  const isGameRunning = status === 'running';
  const elapsedSeconds = useElapsedTimer(isGameRunning);
  const { viewportRef, autoScroll, handleScroll, scrollToBottom } = useAutoScroll([gameLogs]);

  const statusDisplay = useMemo(() => {
    if (isGameRunning) {
      return { label: 'ВЫПОЛНЯЕТСЯ', color: 'text-emerald-400', icon: Activity, pulse: true };
    }
    return { label: 'ОСТАНОВЛЕН', color: 'text-zinc-500', icon: Activity, pulse: false };
  }, [isGameRunning]);

  const StatusIcon = statusDisplay.icon;

  const handleTerminate = async () => {
    if (!isGameRunning) return;
    try {
      await cancelLaunch();
    } catch (err) {
      console.error('Не удалось завершить процесс:', err);
    }
  };

  return (
    <motion.div
      variants={fadeContainerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="flex-1 flex flex-row h-full gap-4 p-4 overflow-hidden bg-zinc-900/5 select-none"
    >
      <motion.div
        variants={panelScaleUpVariants}
        initial="hidden"
        animate="visible"
        className="flex-1 h-full flex flex-col bg-zinc-900/10 border border-zinc-800/60 rounded-2xl overflow-hidden backdrop-blur-sm relative"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/40 bg-zinc-900/10 shrink-0">
          <div className="flex items-center gap-2">
            <span className="pl-1 text-[12px] font-mono text-zinc-500 uppercase tracking-wider">
              lasted.log
            </span>
          </div>
          <div className="flex items-center gap-1 text-[12px] text-zinc-500 font-mono">
            <span>auto-scroll: {autoScroll ? 'on' : 'off'}</span>
          </div>
        </div>

        <div className="flex-1 p-3 font-mono text-[12px] min-h-0 select-text relative">
          <ScrollArea.Root className="w-full h-full">
            <ScrollArea.Viewport
              ref={viewportRef}
              onScroll={handleScroll}
              className="w-full h-full pr-3 text-left"
            >
              {gameLogs.length === 0 ? (
                <div className="h-full flex items-center justify-center text-zinc-700 italic">
                  ~ ожидание вывода ~
                </div>
              ) : (
                <div className="flex flex-col">
                  <AnimatePresence initial={false}>
                    {gameLogs.map((log, index) => (
                      <LogItem key={`${log.timestamp}-${index}`} log={log} index={index} />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </ScrollArea.Viewport>

            <ScrollArea.Scrollbar
              className="flex select-none touch-none p-0.5 bg-transparent transition-colors duration-150 ease-out w-1"
              orientation="vertical"
            >
              <ScrollArea.Thumb className="flex-1 bg-zinc-700/40 rounded-full hover:bg-zinc-600/70 transition-colors duration-200" />
            </ScrollArea.Scrollbar>
            <ScrollArea.Corner className="bg-transparent" />
          </ScrollArea.Root>

          <AnimatePresence>
            {!autoScroll && gameLogs.length > 0 && (
              <motion.button
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                onClick={() => scrollToBottom('smooth')}
                className="absolute bottom-4 right-6 px-3 py-1.5 bg-zinc-900/90 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-zinc-100 rounded-xl text-[12px] font-semibold flex items-center gap-1.5 shadow-xl backdrop-blur-md transition-all"
              >
                <ArrowDown size={14} className="animate-bounce" />
                <span>Вниз</span>
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <motion.div
        variants={panelScaleUpVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.05 }}
        className="w-48 shrink-0 flex flex-col gap-3"
      >
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/home')}
            title="На главную"
            className="flex items-center justify-center p-2.5 rounded-lg bg-zinc-900/40 border border-zinc-800/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60 hover:border-zinc-700 transition-all shrink-0"
          >
            <ArrowLeft size={14} />
          </button>

          <div className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-zinc-900/10 border border-zinc-800/60 backdrop-blur-sm min-w-0">
            <Clock size={12} className="text-zinc-500 shrink-0" />
            <span className="text-[12px] font-mono text-zinc-300 tracking-wide truncate">
              {formatElapsed(elapsedSeconds)}
            </span>
          </div>
        </div>

        <div className="p-3 bg-zinc-900/10 border border-zinc-800/60 rounded-xl flex flex-col gap-2 backdrop-blur-sm">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-zinc-950/40 border border-zinc-900 rounded-lg text-zinc-400 shrink-0">
              <StatusIcon
                size={16}
                className={statusDisplay.pulse ? `animate-pulse ${statusDisplay.color}` : ''}
              />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
                Статус
              </span>
              <span className={`text-[13px] font-bold truncate ${statusDisplay.color}`}>
                {statusDisplay.label}
              </span>
            </div>
          </div>

          <div className="w-full text-center text-[10px] font-mono text-zinc-400 bg-zinc-950/30 px-2 py-1 rounded-md border border-zinc-900 truncate">
            {isGameRunning ? 'PID: ACTIVE' : 'ПРОЦЕСС УБИТ'}
          </div>
        </div>

        <div className="mt-auto flex flex-col gap-3">
          <div className="rounded-xl overflow-hidden bg-zinc-900/10 pointer-events-none opacity-80">
            <img
              src="/spinning.gif"
              alt="Frieren waiting"
              className="w-full h-auto object-cover"
            />
          </div>

          <button
            onClick={handleTerminate}
            disabled={!isGameRunning}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-rose-950/20 border border-rose-900/30 text-rose-400 hover:bg-rose-900/30 hover:text-rose-300 disabled:opacity-40 disabled:hover:bg-rose-950/20 disabled:hover:text-rose-400 disabled:border-rose-900/30 transition-all text-[12px] font-semibold"
          >
            <XOctagon size={14} />
            <span>Убить процесс</span>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}