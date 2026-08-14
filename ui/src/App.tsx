import { QueryClientProvider } from '@tanstack/react-query';
import { Route, Routes } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';

import AppHeader from '@/components/Header';
import HomePage from '@/pages/Home';
import LoginPage from '@/pages/Login';
import DebugConsole from '@/pages/Debug';

import MeshGradient from '@/components/bg/MeshGradient';

import SettingsOverlay from '@/components/overlay/SettingsOverlay';
import ResourceLoaderOverlay from '@/components/overlay/ResourcesOverlay';

import { queryClient } from '@/providers/queryClient';
import ProtectedRoute from '@/providers/ProtectedRoute';

import { useSettingsStore } from '@/store/useSettingsStore';
import { useLauncherStore } from '@/store/useLauncherStore';


export default function App() {
  const { isOpen, fetchSettings } = useSettingsStore();
  const { status } = useLauncherStore();

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings]);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="relative h-screen w-screen bg-zinc-950 overflow-hidden">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <MeshGradient />
        </div>

        <div className="relative z-10 flex flex-col h-full w-full">
          <AppHeader />

          <main className="flex-1 flex">
            <Routes>
              <Route path="/login" element={<LoginPage />} />

              <Route element={<ProtectedRoute />}>
                <Route path="/home" element={<HomePage />} />
                <Route path="/debug" element={<DebugConsole/>} />
              </Route>
            </Routes>
          </main>
        </div>

        <AnimatePresence>
          {isOpen && <SettingsOverlay />}

          {["launching", "error"].includes(status) && <ResourceLoaderOverlay />}
        </AnimatePresence>

      </div>
    </QueryClientProvider>
  )
}