import { motion } from 'framer-motion';
import { getLogStyle } from '@/utils/utils';
import type { GameLog } from '@/types/launch';

interface LogItemProps {
  log: GameLog;
  index: number;
}

export function LogItem({ log, index }: LogItemProps) {
  const cfg = getLogStyle(log.type);

  return (
    <motion.div
      key={`${log.timestamp}-${index}`}
      initial={{ opacity: 0, y: 1 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.05 }}
      className="flex items-start justify-start gap-2 py-0.5 hover:bg-zinc-900/30 px-1.5 rounded transition-colors"
    >
      <span
        className={`px-1.5 py-0.5 text-[12px] font-bold rounded border uppercase tracking-wider shrink-0 select-none leading-none -my-0.5 ${cfg.badge}`}
      >
        {cfg.label}
      </span>
      <span
        className={`break-all text-[12px] whitespace-pre-wrap flex-1 leading-normal text-left ${cfg.text}`}
      >
        {log.message}
      </span>
    </motion.div>
  );
}