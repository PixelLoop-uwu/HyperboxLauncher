import * as ScrollArea from '@radix-ui/react-scroll-area';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FaServer } from 'react-icons/fa';
import { useState } from 'react';

import ModpackActionBar from '@/components/modpack/ModpackActionBar';
import ModpackCard from '@/components/modpack/ModpackCard';
import ModpackMain from '@/components/modpack/ModpackMain';
import { useModpacks } from '@/hooks/useModpacks';
import { useLaunchStore } from '@/store/useLaunchStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useGameLogsStore } from '@/store/useGameLogsStore';
import { listStaggerVariants } from '@/constants/animationVariants';
import type { Modpack } from '@/types/modpack';


export default function HomePage() {
  const { launchGame } = useLaunchStore();
  const { settings } = useSettingsStore();
  const { initTracking, clearLogs } = useGameLogsStore();
  const navigate = useNavigate();

  const { data: modpacks, isLoading, isError } = useModpacks();
  const [ selectedId, setSelectedId ] = useState<string | undefined>();

  const activeId = selectedId || modpacks?.[0]?.id;
  const activeModpack = modpacks?.find(m => m.id === activeId);

  const handleLaunch = async () => {
    try {
      if (settings.debug) {
        initTracking();
        clearLogs();
      }

      await launchGame(activeId);

      if (settings.debug) {
        navigate('/debug');
      }
    } catch (error) {
      console.error("Запуск прерван или упал с ошибкой:", error);
    }
  };

  return (
    <div className="flex-1 flex overflow-hidden">
      <div className="h-full w-62 p-4 pr-2 flex flex-col gap-4 border-r border-zinc-800/60 bg-zinc-900/10">
        <div className="flex items-center gap-2 opacity-70 text-[13px] font-semibold tracking-wider uppercase text-zinc-400">
          <FaServer size={14} />
          <p>Все сервера</p>
        </div>
        
        <ScrollArea.Root className="flex-1 overflow-hidden flex flex-col">
          <ScrollArea.Viewport className="w-full h-full pr-3">
            {isLoading && (
              <div className="flex flex-col gap-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="w-full h-16 border bg-zinc-900/10 border-zinc-800/40 rounded-lg animate-pulse" />
                ))}
              </div>
            )}

            {isError && (
              <p className="text-xs text-rose-400/80 p-2">Не удалось загрузить сборки...</p>
            )}

            {modpacks && (
              <motion.div 
                variants={listStaggerVariants}
                initial="hidden"
                animate="visible"
                className="flex flex-col gap-2"
              >
                {modpacks.map((modpack: Modpack) => (
                  <ModpackCard 
                    key={modpack.id}
                    modpack={modpack} 
                    isActive={modpack.id === activeId}
                    onClick={() => setSelectedId(modpack.id)}
                  />
                ))}
              </motion.div>
            )}
          </ScrollArea.Viewport>

          <ScrollArea.Scrollbar 
            className="flex select-none touch-none p-0.5 bg-transparent transition-colors duration-150 ease-out w-1" 
            orientation="vertical"
          >
            <ScrollArea.Thumb className="flex-1 bg-zinc-700/40 rounded-full relative hover:bg-zinc-600/70 transition-colors duration-200" />
          </ScrollArea.Scrollbar>
        
          <ScrollArea.Corner className="bg-transparent" />
        </ScrollArea.Root>
      </div>

      <div className="flex-1 flex flex-col h-full bg-zinc-900/5 relative overflow-hidden">
        <div className="absolute inset-0 bottom-20"> 
          <ScrollArea.Root className="w-full h-full flex flex-col">
            <ScrollArea.Viewport className="w-full h-full px-6 pt-4 pr-3">
              <div className="flex">
                <AnimatePresence mode="wait">
                  {activeModpack && (
                    <ModpackMain 
                      key={activeModpack.id} 
                      modpack={activeModpack} 
                    />
                  )}
                </AnimatePresence>
              </div>
            </ScrollArea.Viewport>

            <ScrollArea.Scrollbar 
              className="flex select-none touch-none p-0.5 bg-transparent transition-colors duration-150 ease-out w-1" 
              orientation="vertical"
            >
              <ScrollArea.Thumb className="flex-1 bg-zinc-700/40 rounded-full relative hover:bg-zinc-600/70 transition-colors duration-200" />
            </ScrollArea.Scrollbar>
          
            <ScrollArea.Corner className="bg-transparent" />
          </ScrollArea.Root>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-15 mb-6 px-6 pb-4 pt-2 bg-zinc-900/10 backdrop-blur-sm border-t border-zinc-800/40 flex items-center">
          <ModpackActionBar 
            modpackName={activeModpack?.name} 
            onPlay={async () => handleLaunch()} 
          />
        </div>
      </div>
    </div>
  )
}