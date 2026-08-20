import { useEffect, useRef, useState } from 'react';

export function useAutoScroll(deps: unknown[]) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  const handleScroll = () => {
    const el = viewportRef.current;
    if (!el) return;

    const threshold = 30;
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= threshold;

    if (autoScroll !== isAtBottom) {
      setAutoScroll(isAtBottom);
    }
  };

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    const el = viewportRef.current;
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior });
      setAutoScroll(true);
    }
  };

  useEffect(() => {
    if (autoScroll) {
      scrollToBottom('instant');
    }
  }, [...deps, autoScroll]);

  return {
    viewportRef,
    autoScroll,
    handleScroll,
    scrollToBottom,
  };
}