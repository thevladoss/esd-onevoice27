/**
 * Значение на случай, когда стили ещё не подключены: в jsdom и до загрузки CSS
 * `getComputedStyle` отдаёт пустую строку. Совпадает с `--breakpoint-nav`
 * в `src/styles/tokens.css`.
 */
export const NAV_MIN_PX_FALLBACK = 1024;

/**
 * Ширина, с которой пункты меню разворачиваются в строку внутри пилюли, а
 * бургер с оверлеем исчезают.
 *
 * Значение приходит из `--breakpoint-nav`: ту же переменную через
 * `theme(--breakpoint-nav)` читают `@media` в `Header.css`. Пока JS и CSS
 * считали границу по отдельным литералам, их расхождение вешало клавиатурную
 * навигацию: CSS прятал оверлей, а фокус-ловушка продолжала ловить Tab и
 * уводить фокус внутрь скрытого контейнера.
 */
export function navMinPx(): number {
  const raw = getComputedStyle(document.documentElement).getPropertyValue("--breakpoint-nav");
  const value = Number.parseFloat(raw);
  return Number.isFinite(value) ? value : NAV_MIN_PX_FALLBACK;
}

/** Медиазапрос строчного меню для `window.matchMedia`. */
export function navQuery(): string {
  return `(min-width: ${navMinPx()}px)`;
}
