import type { RefObject } from "react";
import { useEffect, useRef, useState } from "react";

/** Порог из Motion Contract: счётчики стартуют, когда видно 40% блока. */
const DEFAULT_THRESHOLD = 0.4;

/**
 * Однократное срабатывание IntersectionObserver: после первого пересечения
 * наблюдатель отключается и хук навсегда остаётся в `true`.
 *
 * Без IntersectionObserver в окружении (старые движки, часть тестов) хук сразу
 * отдаёт `true`: анимация появления не должна прятать содержимое.
 */
export function useInViewOnce<T extends Element>(
  ref: RefObject<T | null>,
  threshold: number = DEFAULT_THRESHOLD,
): boolean {
  const [inView, setInView] = useState(() => typeof IntersectionObserver === "undefined");
  const seenRef = useRef(false);

  useEffect(() => {
    const node = ref.current;
    if (seenRef.current || !node || typeof IntersectionObserver === "undefined") {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) {
          return;
        }

        seenRef.current = true;
        setInView(true);
        observer.disconnect();
      },
      { threshold },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [ref, threshold]);

  return inView;
}
