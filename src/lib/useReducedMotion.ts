import { useSyncExternalStore } from "react";

export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function mediaQuery(): MediaQueryList | null {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return null;
  }

  return window.matchMedia(REDUCED_MOTION_QUERY);
}

/** Синхронное чтение: подходит для rAF-циклов и первого кадра canvas. */
export function prefersReducedMotion(): boolean {
  return mediaQuery()?.matches ?? false;
}

function subscribe(onChange: () => void): () => void {
  const mq = mediaQuery();
  // addEventListener может отсутствовать в jsdom-моке, поэтому вызов необязательный.
  mq?.addEventListener?.("change", onChange);

  return () => {
    mq?.removeEventListener?.("change", onChange);
  };
}

/**
 * Подписка на prefers-reduced-motion. Свой хук вместо motion/react:
 * motion кэширует matchMedia в модульном синглтоне, и в jsdom значение не переключить.
 */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, prefersReducedMotion, () => false);
}
