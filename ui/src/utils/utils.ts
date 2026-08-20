import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

import type { gameLog } from "@/types/launch";


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export const formatElapsed = (totalSeconds: number) => {
  const pad = (n: number) => n.toString().padStart(2, '0');
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
};


export const getLogStyle = (type: gameLog['type']) => {
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