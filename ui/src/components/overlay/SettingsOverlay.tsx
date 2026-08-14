import { Sliders, Monitor, HelpCircle, Save, X, Cpu, FolderOpen } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { useSettingsStore } from '@/store/useSettingsStore';
import { motion } from 'framer-motion';
import MarqueeText from '../MarqueeText';
import type { Settings } from '@/types/settings';
import { fadeOverlayVariants, panelScaleUpVariants } from '@/constants/animationVariants';

const TOGGLE_ITEMS = [
  { id: 'fullscreen', label: 'Полноэкранный режим' },
  { id: 'richPresence', label: 'Discord Rich Presence' },
  { id: 'debug', label: 'Режим отладки (Debug)' }
] as const;

export default function SettingsOverlay() {
  const { settings, saveSettings, selectGameFolder } = useSettingsStore();
  const [localSettings, setLocalSettings] = useState<Settings | null>(null);

  useEffect(() => {
    if (settings) setLocalSettings(settings);
  }, [settings]);

  const handleSave = useCallback(async () => {
    if (!localSettings) return;
    await saveSettings(localSettings, true);
  }, [localSettings, saveSettings]);

  const handleCloseWithoutSaving = useCallback(async () => {
    await saveSettings({}, true);
  }, [saveSettings]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  if (!localSettings) return null;

  const updateField = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setLocalSettings(prev => prev ? { ...prev, [key]: value } : null);
  };

  const mbToGb = (mb: number) => (mb / 1024).toFixed(1);

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
        className="w-full max-w-165 bg-zinc-900/10 border border-zinc-800/80 rounded-2xl flex backdrop-blur-sm flex-col h-85 shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-900 bg-zinc-900/10">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-400">
              <Sliders size={15} />
            </div>
            <h2 className="text-sm font-bold text-zinc-100 tracking-tight">Настройки лаунчера</h2>
          </div>
          <button
            onClick={handleCloseWithoutSaving}
            className="p-1.5 text-zinc-500 hover:text-zinc-300 rounded-lg transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-5 min-h-0">
          <div className="grid grid-cols-2 gap-4 h-full">
            
            {/* Left Column: Performance & Sliders */}
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-3 p-4 bg-zinc-900/20 border border-zinc-800/40 rounded-xl flex-1 justify-center">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  <Cpu size={14} />
                  <span>Производительность</span>
                </div>
                
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between text-xs font-medium text-zinc-400">
                    <span>Выделенная RAM</span>
                    <span className="font-mono text-zinc-200 font-semibold">
                      {mbToGb(localSettings.selectedRam)} ГБ
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1024}
                    max={localSettings.maxRam}
                    step={512}
                    value={localSettings.selectedRam}
                    onChange={(e) => updateField('selectedRam', Number(e.target.value))}
                    className="w-full h-1 bg-zinc-950 rounded-lg appearance-none cursor-pointer accent-zinc-400 border border-zinc-900"
                  />
                  <div className="text-[11px] font-semibold text-zinc-600 font-mono text-right -mt-0.5">
                    макс: {mbToGb(localSettings.maxRam)} ГБ
                  </div>
                </div>
              </div>

              {/* Game Directory Block */}
              <div className="flex flex-col gap-2.5 p-4 bg-zinc-900/20 border border-zinc-800/40 rounded-xl flex-1 justify-center">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  <HelpCircle size={14} />
                  <span>Путь к файлам игры</span>
                </div>
                <div className="flex gap-2">
                  <MarqueeText text={localSettings.baseFolder || 'Не выбрано'} />
                  <button
                    onClick={selectGameFolder}
                    className="p-1.5 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-lg transition-colors shrink-0"
                    title="Выбрать другую папку"
                  >
                    <FolderOpen size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Toggles */}
            <div className="flex flex-col p-4 bg-zinc-900/20 border border-zinc-800/40 rounded-xl justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
                <Monitor size={14} />
                <span>Параметры запуска</span>
              </div>

              <div className="flex flex-col gap-3.5 flex-1 justify-center">
                {TOGGLE_ITEMS.map((item) => {
                  const val = localSettings[item.id] as boolean;
                  return (
                    <div key={item.id} className="flex items-center justify-between gap-4">
                      <span className="text-xs text-zinc-400 font-medium">{item.label}</span>
                      <button
                        onClick={() => updateField(item.id, !val)}
                        className={`w-8 h-4.5 rounded-full p-0.5 transition-colors duration-150 focus:outline-none border shrink-0 ${
                          val ? 'bg-zinc-100 border-zinc-200' : 'bg-zinc-950 border-zinc-900'
                        }`}
                      >
                        <motion.div
                          layout
                          className={`w-3 h-3 rounded-full shadow-md ${val ? 'bg-zinc-950' : 'bg-zinc-500'}`}
                          animate={{ x: val ? 14 : 0 }}
                          transition={{ type: "spring", stiffness: 600, damping: 35 }}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-zinc-900 bg-zinc-950/20 flex justify-end">
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-950 text-xs font-semibold transition-all shadow-sm"
          >
            <Save size={14} />
            <span>Сохранить изменения</span>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}