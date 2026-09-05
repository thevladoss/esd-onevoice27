/**
 * Значение на случай, когда стили ещё не применены: в jsdom и до загрузки CSS
 * `getComputedStyle` отдаёт пустую строку. Совпадает с мобильным значением
 * `--header-offset` в `src/styles/global.css`.
 */
export const HEADER_OFFSET_FALLBACK = 88;

/**
 * Читает `--header-offset` — сколько плавающий header отъедает сверху вместе с
 * зазором до заголовка секции.
 *
 * Переменная объявлена в `global.css` и там же уходит в `scroll-padding-top`,
 * поэтому нативный переход по хешу (прямая ссылка `site/#about`, отказ JS) и
 * прокрутка по клику приводят в одну и ту же точку.
 */
export function headerOffset(): number {
  const raw = getComputedStyle(document.documentElement).getPropertyValue("--header-offset");
  const value = Number.parseFloat(raw);
  return Number.isFinite(value) ? value : HEADER_OFFSET_FALLBACK;
}
