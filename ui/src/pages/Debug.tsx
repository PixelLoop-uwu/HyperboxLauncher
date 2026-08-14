import * as ScrollArea from '@radix-ui/react-scroll-area';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState, useMemo } from 'react';
import { 
  Terminal, 
  Trash2, 
  XOctagon, 
  Activity, 
  ShieldAlert, 
  Info, 
  AlertTriangle,
  ArrowDown
} from 'lucide-react';

import { useGameTrackerStore } from '@/store/useGameTrackerStore';
import type { gameLog } from '@/types/launch';
import { fadeContainerVariants } from '@/constants/animationVariants';

const formatTimestamp = (timestamp: number) => {
  const d = new Date(timestamp);
  const pad = (n: number, len = 2) => n.toString().padStart(len, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`;
};

const getLogStyle = (type: gameLog['type']) => {
  switch (type) {
    case 'error':
      return {
        text: 'text-rose-400',
        badge: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
        label: 'ERR'
      };
    case 'critical':
      return {
        text: 'text-red-500 font-semibold',
        badge: 'bg-red-500/15 text-red-400 border-red-500/30 animate-pulse',
        label: 'CRT'
      };
    case 'info':
    default:
      return {
        text: 'text-zinc-300',
        badge: 'bg-zinc-800/40 text-zinc-500 border-zinc-700/30',
        label: 'INF'
      };
  }
};

export default function DebugPage() {
  const { gameLogs, clearLogs, terminateGame } = useGameTrackerStore();
  const viewportRef = useRef<HTMLDivElement>(null);
  
  const [isProcessActive, setIsProcessActive] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);

  // Считаем типы логов для верхней панели
  const stats = useMemo(() => {
    return gameLogs.reduce((acc, log) => {
      if (log.type === 'error') acc.error++;
      else if (log.type === 'critical') acc.critical++;
      else acc.info++;
      return acc;
    }, { info: 0, error: 0, critical: 0 });
  }, [gameLogs]);

  // Следим за скроллом пользователя
  const handleScroll = () => {
    const el = viewportRef.current;
    if (!el) return;

    const threshold = 30; // зона погрешности в пикселях
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= threshold;
    
    if (autoScroll !== isAtBottom) {
      setAutoScroll(isAtBottom);
    }
  };

  // Прокрутка вниз
  const scrollToBottom = (behavior: 'smooth' | 'instant' = 'smooth') => {
    const el = viewportRef.current;
    if (el) {
      el.scrollTo({
        top: el.scrollHeight,
        behavior
      });
      setAutoScroll(true);
    }
  };

  // Автоскролл при прилете новых логов (только если мы уже были внизу)
  useEffect(() => {
    if (autoScroll) {
      scrollToBottom('instant');
    }
  }, [gameLogs]);

  const handleTerminate = async () => {
    try {
      await terminateGame();
      setIsProcessActive(false);
    } catch (err) {
      console.error("Не удалось завершить процесс:", err);
    }
  };

  return (
    <motion.div
      variants={fadeContainerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="flex-1 flex flex-col h-full gap-4 p-4 overflow-hidden bg-zinc-950/5 select-none"
    >
      {/* Топ-панель: Метрики и кнопки управления */}
      <div className="grid grid-cols-3 gap-3 shrink-0">
        
        {/* Карточка 1: Процесс */}
        <div className="p-3 bg-zinc-900/10 border border-zinc-800/60 rounded-xl flex items-center justify-between backdrop-blur-sm">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-zinc-950/40 border border-zinc-900 rounded-lg text-zinc-400">
              <Activity size={14} className={isProcessActive ? 'animate-pulse text-emerald-500' : ''} />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Процесс игры</span>
              <span className={`text-xs font-bold ${isProcessActive ? 'text-emerald-400' : 'text-zinc-500'}`}>
                {isProcessActive ? 'ВЫПОЛНЯЕТСЯ' : 'ОСТАНОВЛЕН'}
              </span>
            </div>
          </div>
          <span className="text-[11px] font-mono text-zinc-400 bg-zinc-950/30 px-2.5 py-1 rounded-md border border-zinc-900">
            PID: {isProcessActive ? '14820' : '---'}
          </span>
        </div>

        {/* Карточка 2: Счётчики ошибок */}
        <div className="p-3 bg-zinc-900/10 border border-zinc-800/60 rounded-xl flex items-center justify-between backdrop-blur-sm">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-zinc-950/40 border border-zinc-900 rounded-lg text-zinc-400">
              <Terminal size={14} />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Статистика вывода</span>
              <span className="text-xs font-bold text-zinc-300">Всего строк: {gameLogs.length}</span>
            </div>
          </div>
          
          <div className="flex gap-1.5">
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-950/30 border border-zinc-900 text-[10px] font-mono" title="Инфо">
              <Info size={11} className="text-zinc-500" />
              <span className="text-zinc-400">{stats.info}</span>
            </div>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-950/30 border border-zinc-900 text-[10px] font-mono" title="Ошибки">
              <AlertTriangle size={11} className="text-rose-400" />
              <span className="text-rose-400">{stats.error}</span>
            </div>
            {stats.critical > 0 && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-950/20 border border-red-900/30 text-[10px] font-mono animate-pulse" title="Критические">
                <ShieldAlert size={11} className="text-red-400" />
                <span className="text-red-400">{stats.critical}</span>
              </div>
            )}
          </div>
        </div>

        {/* Карточка 3: Управление */}
        <div className="p-2 bg-zinc-900/10 border border-zinc-800/60 rounded-xl flex gap-2 items-center justify-end backdrop-blur-sm">
          <button
            onClick={clearLogs}
            className="flex-1 flex items-center justify-center gap-1.5 h-full rounded-lg bg-zinc-900/60 border border-zinc-800/60 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition-all text-[11px] font-semibold"
          >
            <Trash2 size={13} />
            <span>Очистить</span>
          </button>

          <button
            onClick={handleTerminate}
            disabled={!isProcessActive}
            className="flex-1 flex items-center justify-center gap-1.5 h-full rounded-lg bg-rose-950/20 border border-rose-900/30 text-rose-400 hover:bg-rose-900/30 hover:text-rose-300 disabled:opacity-40 disabled:hover:bg-rose-950/20 disabled:hover:text-rose-400 transition-all text-[11px] font-semibold"
          >
            <XOctagon size={13} />
            <span>Убить игру</span>
          </button>
        </div>

      </div>

      {/* Консоль */}
      <div className="flex-1 h-full flex flex-col bg-zinc-900/10 border border-zinc-800/80 rounded-2xl overflow-hidden backdrop-blur-sm relative">
        
        {/* Шапка консоли */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-900 bg-zinc-900/10 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-650" />
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">game_output.log</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-zinc-500 font-mono">
            <span>auto-scroll: {autoScroll ? 'on' : 'off'}</span>
          </div>
        </div>

        {/* Вывод логов */}
        <div className="flex-1 p-3 bg-zinc-950/40 font-mono text-[11px] min-h-0 select-text relative">
          <ScrollArea.Root className="w-full h-full flex flex-col">
            <ScrollArea.Viewport 
              ref={viewportRef} 
              onScroll={handleScroll}
              className="w-full h-full pr-3"
            >
              {gameLogs.length === 0 ? (
                <div className="h-full flex items-center justify-center text-zinc-700 italic">
                  ~ ожидание вывода игры ~
                </div>
              ) : (
                <div className="flex flex-col">
                  <AnimatePresence initial={false}>
                    {gameLogs.map((log, index) => {
                      const cfg = getLogStyle(log.type);
                      return (
                        <motion.div
                          key={`${log.timestamp}-${index}`}
                          initial={{ opacity: 0, y: 1 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.05 }}
                          className="flex items-start gap-2 py-0.5 hover:bg-zinc-900/30 px-1.5 rounded transition-colors"
                        >
                          <span className="text-zinc-650 select-none shrink-0 font-medium">
                            [{formatTimestamp(log.timestamp)}]
                          </span>

                          <span className={`px-1 py-0.5 text-[10px] font-bold rounded border uppercase tracking-wider shrink-0 select-none leading-none scale-90 -my-0.5 ${cfg.badge}`}>
                            {cfg.label}
                          </span>

                          <span className={`break-all text-[11px] whitespace-pre-wrap flex-1 leading-normal ${cfg.text}`}>
                            {log.message}
                          </span>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </ScrollArea.Viewport>

            <ScrollArea.Scrollbar 
              className="flex select-none touch-none p-0.5 bg-transparent transition-colors duration-150 ease-out w-1" 
              orientation="vertical"
            >
              <ScrollArea.Thumb className="flex-1 bg-zinc-800/40 rounded-full hover:bg-zinc-700/60 transition-colors duration-200" />
            </ScrollArea.Scrollbar>
            
            <ScrollArea.Corner className="bg-transparent" />
          </ScrollArea.Root>

          {/* Плавающая кнопка-индикатор возврата к автоскроллу */}
          <AnimatePresence>
            {!autoScroll && gameLogs.length > 0 && (
              <motion.button
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                onClick={() => scrollToBottom('smooth')}
                className="absolute bottom-4 right-6 px-3 py-1.5 bg-zinc-900/90 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-zinc-100 rounded-xl text-[10px] font-semibold flex items-center gap-1.5 shadow-xl backdrop-blur-md transition-all"
              >
                <ArrowDown size={12} className="animate-bounce" />
                <span>Вернуться вниз</span>
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}