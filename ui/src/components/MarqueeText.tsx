import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface MarqueeTextProps {
  text: string;
}

export default function MarqueeText({ text }: MarqueeTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (containerRef.current && textRef.current) {
      setIsOverflowing(textRef.current.offsetWidth > containerRef.current.offsetWidth);
    }
  }, [text]);

  const textWidth = textRef.current?.offsetWidth || 0;
  const duration = textWidth / 80;

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative flex-1 min-w-0 overflow-hidden px-3 py-1.5 bg-zinc-950 border border-zinc-900 text-zinc-400 font-mono text-[12px] rounded-lg leading-relaxed cursor-default"
    >
      <motion.div
        className="flex whitespace-nowrap gap-4 w-max"
        animate={isHovered && isOverflowing ? {
          x: -(textWidth + 16)
        } : { x: 0 }}
        transition={isHovered && isOverflowing ? {
          ease: "linear",
          duration: duration,
          repeat: Infinity,
          repeatType: "loop"
        } : {
          // Плавный возврат в исходное положение при уходе мышки
          type: "spring",
          damping: 20,
          stiffness: 120
        }}
      >
        <span ref={textRef}>{text}</span>
        
        {/* Дубликат для бесшовного цикла */}
        {isOverflowing && (
          <span className="text-zinc-400 select-none">
            {text}
          </span>
        )}
      </motion.div>

      {/* Градиенты размытия по краям */}
      {isOverflowing && (
        <>
          <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-zinc-950 to-transparent pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-3 bg-gradient-to-l from-zinc-950 to-transparent pointer-events-none" />
        </>
      )}
    </div>
  );
}