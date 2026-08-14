import { motion } from 'framer-motion';
import { FaCircle } from 'react-icons/fa6';
import type { Modpack } from '@/types/modpack';
import { cardSlideInVariants } from '@/constants/animationVariants';

type ModpackCardProps = {
  modpack: Modpack;
  isActive?: boolean;
  onClick?: () => void;
}

export default function ModpackCard({ modpack, isActive, onClick }: ModpackCardProps) {
  const isOnline = modpack.online > -1;

  return (
    <motion.div 
      variants={cardSlideInVariants}
      whileHover={{ scale: 1.01, x: 4 }}
      onClick={onClick}
      className={`w-full flex justify-between h-16 border p-3 rounded-lg cursor-pointer group select-none transition-shadow ${
        isActive 
          ? "bg-zinc-800/40 border-zinc-600 text-white shadow-md shadow-black/20" 
          : "bg-zinc-900/20 border-zinc-800/80 hover:bg-zinc-950/40 hover:border-zinc-700/80 text-zinc-300"
      }`}
    >
      <div className="flex flex-col justify-between">
        <div>
          <span className={`block font-medium text-sm tracking-wide transition-colors ${
            isActive ? "text-white" : "text-zinc-200 group-hover:text-white"
          }`}>
            {modpack.name}
          </span>
          <span className="block text-[13px] opacity-60 text-zinc-400 mt-0.5">
            {modpack.info.version}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 opacity-90 self-end text-[12px]">
        <span className="font-medium">{modpack.online}</span>
        <FaCircle 
          size={8} 
          className={`transition-colors duration-300 ${
            isOnline 
              ? (isActive ? "text-emerald-400 animate-pulse" : "text-emerald-400 group-hover:text-emerald-400") 
              : "text-zinc-600"
          }`} 
        />
      </div>
    </motion.div>
  )
}