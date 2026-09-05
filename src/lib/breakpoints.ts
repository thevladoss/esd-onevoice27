/**
 * Значение на случай, когда стили ещё не подключены: в jsdom и до загрузки CSS
 * `getComputedStyle` отдаёт пустую строку. Совпадает с `--breakpoint-desktop`
 * в `src/styles/tokens.css`.
 */
export const DESKTOP_MIN_PX_FALLBACK = 768;

/**
 * Ширина, с которой начинается десктопная раскладка.
 *
 * Значение приходит из `--breakpoint-desktop`: ту же переменную через
 * `theme(--breakpoint-desktop)` читают `@media` в `Header.css` и `Footer.css`.
 * Пока JS и CSS считали границу по отдельным литералам, их расхождение вешало
 * клавиатурную навигацию: CSS прятал оверлей, а фокус-ловушка продолжала
 * ловить Tab и уводить фокус внутрь скрытого контейнера.
 */
export function desktopMinPx(): number {
  const raw = getComputedStyle(document.documentElement).getPropertyValue("--breakpoint-desktop");
  const value = Number.parseFloat(raw);
  return Number.isFinite(value) ? value : DESKTOP_MIN_PX_FALLBACK;
}

/** Медиазапрос десктопной раскладки для `window.matchMedia`. */
export function desktopQuery(): string {
  return `(min-width: ${desktopMinPx()}px)`;
}
