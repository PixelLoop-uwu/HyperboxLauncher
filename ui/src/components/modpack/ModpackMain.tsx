import { motion } from 'framer-motion';
import { Box, Calendar, ExternalLink, Swords } from 'lucide-react';
import type { Modpack } from '@/types/modpack';
import type { Variants } from 'framer-motion';

type ModpackMainProps = { 
  modpack: Modpack 
} 

const containerVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      damping: 25,
      stiffness: 120,
      staggerChildren: 0.05,
    },
  },
  exit: {
    opacity: 0,
    y: -15,
    transition: { duration: 0.2 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: 'spring', damping: 20, stiffness: 150 }
  },
};

export default function ModpackMain({ modpack }: ModpackMainProps) { 
  return ( 
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-5xl text-zinc-300"
    > 
      
      <motion.div variants={itemVariants} className="lg:col-span-2 flex flex-col gap-6"> 
        
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4"> 
          <h1 className="text-3xl font-bold text-zinc-100 tracking-tight">{modpack.name}</h1> 
          <a  
            href={modpack.url} 
            target="_blank"  
            rel="noopener noreferrer" 
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 transition-all text-xs font-medium" 
          > 
            <span>На сайт</span> 
            <ExternalLink size={14} /> 
          </a> 
        </div> 

        <div className="flex flex-col gap-2.5"> 
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Описание сервера</h2> 
          <p className="text-zinc-400 font-normal text-sm leading-relaxed bg-zinc-900/20 border border-zinc-800/40 p-4 rounded-xl"> 
            {modpack.description} 
          </p> 
        </div> 

        <div className="flex flex-col gap-3"> 
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Модификации</h2> 
          <div className="flex flex-wrap gap-1.5 items-center"> 
            {modpack.mods.map((mod) => ( 
              <motion.span  
                key={mod}  
                variants={itemVariants}
                className="px-2.5 py-1 bg-zinc-900/40 border font-semibold border-zinc-800/80 rounded-md text-zinc-300 text-[13px] hover:border-zinc-700 transition-colors" 
              > 
                {mod}
              </motion.span> 
            ))} 

            <motion.a 
              variants={itemVariants}
              className="px-3 py-1 bg-zinc-400/10 border border-zinc-300/10 text-zinc-400 rounded-md text-xs  
                         font-medium hover:bg-zinc-400/20 hover:border-zinc-400/20 transition-all duration-200 cursor-pointer" 
            > 
              Подробнее → 
            </motion.a> 
          </div> 
        </div> 
      </motion.div> 

      <motion.div variants={itemVariants} className="lg:col-span-1 flex flex-col gap-4 bg-zinc-900/10 border border-zinc-800/80 rounded-xl p-4 h-fit"> 
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 pb-1 border-b border-zinc-800/50"> 
          Информация 
        </h3> 
         
        <div className="flex items-center gap-3 py-1"> 
          <div className="p-2 bg-orange-950/20 text-orange-400 rounded-lg border border-orange-900/30 shrink-0"> 
            <Box className="w-4 h-4" /> 
          </div> 
          <div className="flex flex-col"> 
            <span className="text-[11px] text-zinc-500 uppercase tracking-wide font-medium">Версия</span> 
            <span className="text-sm font-semibold text-zinc-100 font-mono mt-0.5">{modpack.info.version}</span> 
          </div> 
        </div> 

        <div className="flex items-center gap-3 py-1"> 
          <div className="p-2 bg-red-950/20 text-red-400 rounded-lg border border-red-900/30 shrink-0"> 
            <Swords className="w-4 h-4" /> 
          </div> 
          <div className="flex flex-col"> 
            <span className="text-[11px] text-zinc-500 uppercase tracking-wide font-medium">Режим игры</span> 
            <span className="text-sm font-semibold text-zinc-100 mt-0.5">{modpack.info.gameMode}</span> 
          </div> 
        </div> 

        <div className="flex items-center gap-3 py-1"> 
          <div className="p-2 bg-emerald-950/20 text-emerald-400 rounded-lg border border-emerald-900/30 shrink-0"> 
            <Calendar className="w-4 h-4" /> 
          </div> 
          <div className="flex flex-col"> 
            <span className="text-[11px] text-zinc-500 uppercase tracking-wide font-medium">Дата вайпа</span> 
            <span className="text-sm font-semibold text-zinc-100 mt-0.5">{modpack.info.wipeDate}</span> 
          </div> 
        </div> 
      </motion.div> 
    </motion.div> 
  ) 
}