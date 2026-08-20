import { motion } from 'framer-motion';
import { Loader2, ArrowUpRight, ShieldAlert, DownloadCloud, Clock, X } from 'lucide-react';
import { useLaunchStore } from '@/store/useLaunchStore';
import { fadeOverlayVariants, panelScaleUpVariants } from '@/constants/animationVariants';

const formatSize = (bytes?: number) => {
  if (!bytes) return '0 MB';
  const mb = bytes / (1024 * 1024);
  return mb >= 1024 ? `${(mb / 1024).toFixed(2)} GB` : `${mb.toFixed(1)} MB`;
};

const formatSpeed = (kbps?: number) => {
  if (!kbps) return '0 KB/s';
  return kbps >= 1024 ? `${(kbps / 1024).toFixed(1)} MB/s` : `${Math.round(kbps)} KB/s`;
};

const formatETA = (seconds?: number) => {
  if (!seconds || !Number.isFinite(seconds)) return '--:--';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  
  const pad = (num: number) => num.toString().padStart(2, '0');
  
  if (h > 0) return `${h}:${pad(m)}:${pad(s)}`;
  return `${pad(m)}:${pad(s)}`;
};

export default function ResourceLoaderOverlay() {
  const { status, resourceProgress, error, resetLaunchState, cancelLaunch } = useLaunchStore();

  const {
    statusText,
    percentage,
    totalBytes,
    transferredBytes,
    etaSeconds,
    speedKbps
  } = resourceProgress || {};

  return (
    <motion.div
      variants={fadeOverlayVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="absolute inset-0 z-50 flex items-center justify-center bg-zinc-950/50 backdrop-blur-xl p-6 select-none"
    >
      <motion.div
        variants={panelScaleUpVariants}
        className="w-full max-w-135 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl flex backdrop-blur-sm flex-col shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-900 bg-zinc-900/10">
          <div className="flex items-center gap-2.5">
            <div className={`p-1.5 border rounded-lg ${status !== 'error' ? 'bg-zinc-900 border-zinc-800 text-zinc-400' : 'bg-red-950/30 border-red-900/40 text-red-400'}`}>
              {status !== 'error' ? <DownloadCloud size={15} /> : <ShieldAlert size={15} />}
            </div>
            <h2 className="text-sm font-bold text-zinc-100 tracking-tight">
              {status !== 'error' ? 'Запуск игры' : 'Ошибка обновления'}
            </h2>
          </div>
          {status !== 'error' && (
            <div className="flex items-center gap-2 text-zinc-500">
              <Loader2 size={14} className="animate-spin" />
            </div>
          )}
        </div>

        <div className="p-5">
          {status !== 'error' ? (
            <div className="flex flex-col w-full">
              <div className="flex justify-between items-end mb-3">
                <p className="text-xs text-zinc-400 font-medium line-clamp-1 max-w-70">
                  {statusText}
                </p>
                <span className="text-xl font-bold text-zinc-100 tabular-nums leading-none">
                  {Math.round(percentage)}%
                </span>
              </div>

              <div className="w-full h-1.5 bg-zinc-950/80 rounded-full overflow-hidden border border-zinc-800/80 mb-4 relative">
                <motion.div
                  className="h-full bg-zinc-200 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(Math.max(percentage, 0), 100)}%` }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs font-medium text-zinc-400 bg-zinc-900/20 rounded-xl p-3 border border-zinc-800/40">
                <div className="flex flex-col gap-1">
                  <span className="text-zinc-500 text-[11px] uppercase tracking-wider">Загружено</span>
                  <span className="text-zinc-200 tabular-nums">
                    {formatSize(transferredBytes)} <span className="text-zinc-600">/</span> {formatSize(totalBytes)}
                  </span>
                </div>
                
                <div className="flex flex-col gap-1 items-end">
                  <span className="text-zinc-500 text-[11px] uppercase tracking-wider">Скорость</span>
                  <div className="flex items-center gap-3">
                    <span className="text-zinc-200 tabular-nums">{formatSpeed(speedKbps)}</span>
                    <span className="flex items-center gap-1 text-zinc-400 tabular-nums">
                      <Clock size={12} className="text-zinc-500" />
                      {formatETA(etaSeconds)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col w-full">
              <div className="flex flex-col gap-2 p-4 bg-red-950/20 border border-red-900/30 rounded-xl">
                <p className="text-xs text-red-300/80 leading-relaxed max-h-32 overflow-y-auto font-mono">
                  {error || 'Не удалось установить соединение с сервером или распаковать архивы.'}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-zinc-900 bg-zinc-950/20 flex items-center justify-between">
          <div className="text-[10px] font-mono text-zinc-600 tracking-wider uppercase">
            {status !== 'error' ? 'Идет скачивание...' : 'Действие прервано'}
          </div>
          <button
            onClick={status !== 'error' ? cancelLaunch : resetLaunchState}
            className={`flex items-center gap-1.5 px-8 py-2 rounded-xl text-xs font-semibold transition-all shadow-sm ${
              status !== 'error' 
                ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-950' 
                : 'bg-zinc-100 hover:bg-white text-zinc-900'
            }`}
          >
            {status !== 'error' ? (
              <>
                <X size={14} />
                <span>Отменить</span>
              </>
            ) : (
              <>
                <span>Вернуться</span>
                <ArrowUpRight size={14} />
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}