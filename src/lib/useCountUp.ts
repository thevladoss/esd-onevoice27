import { useEffect, useRef, useState } from "react";

import { easeOutCubic } from "./easing";

export interface CountUpOptions {
  /** Длительность анимации в миллисекундах. */
  duration?: number;
  /** Пока `false`, счётчик стоит на нуле: старт отдан наблюдателю вьюпорта. */
  active?: boolean;
  /** prefers-reduced-motion: конечное значение без единого кадра. */
  reduced?: boolean;
  easing?: (t: number) => number;
}

/**
 * Счёт от нуля до `target` на requestAnimationFrame.
 *
 * Состояние хранит долю пройденной анимации, а число считается при рендере:
 * после проигранной анимации доля равна единице, поэтому новое значение
 * (например, огонёк посетителя) появляется мгновенно и без лишних кадров.
 * Время берётся из аргумента кадра, а не из `performance.now()`: так тест
 * управляет счётчиком фейковыми таймерами.
 */
export function useCountUp(target: number, options: CountUpOptions = {}): number {
  const { duration = 1600, active = true, reduced = false, easing = easeOutCubic } = options;
  const [progress, setProgress] = useState(0);
  const frameRef = useRef<number | null>(null);
  const playedRef = useRef(false);

  useEffect(() => {
    if (reduced || !active || playedRef.current) {
      return;
    }

    let startedAt: number | null = null;

    function step(now: number) {
      const start = startedAt ?? now;
      startedAt = start;

      const passed = duration > 0 ? Math.min(1, (now - start) / duration) : 1;
      setProgress(passed);

      if (passed < 1) {
        frameRef.current = window.requestAnimationFrame(step);
        return;
      }

      frameRef.current = null;
      playedRef.current = true;
    }

    frameRef.current = window.requestAnimationFrame(step);

    return () => {
      if (frameRef.current === null) {
        return;
      }

      window.cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    };
  }, [active, duration, reduced]);

  return reduced ? target : Math.round(target * easing(progress));
}
