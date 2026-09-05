function clamp01(t: number): number {
  return Math.min(1, Math.max(0, t));
}

/** Плавное торможение для count-up счётчиков. */
export function easeOutCubic(t: number): number {
  return 1 - (1 - clamp01(t)) ** 3;
}

/** Резкий старт и долгий выход: эквивалент cubic-bezier(0.22, 1, 0.36, 1) для полёта карты. */
export function easeOutQuint(t: number): number {
  return 1 - (1 - clamp01(t)) ** 5;
}
