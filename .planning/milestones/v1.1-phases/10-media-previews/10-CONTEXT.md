# Phase 10: Превью новостей и видео — Context

**Gathered:** 2026-09-06
**Status:** Ready for planning
**Source:** правки пользователя (пункт 4: превью ниже по высоте и без чёрных пробелов) + спецификация v1.1, раздел 4; правила карточки новости оригинала в `docs/research/v1.1/orig-rules.css` (`#ov-news-feed article …`)

<domain>
## Phase Boundary

`NewsCard.tsx`, `news.css`, тесты новостей; `VideoEmbed.tsx`/`video-embed.css` только проверка кропа. Не трогать `News.tsx`, `NewsPagination.tsx`, `about.css`, `About.tsx`, `resources/*`, `global.css`.
</domain>

<decisions>
## Implementation Decisions

- Источник обложек остаётся `hqdefault.jpg` (480×360, полосы 45px сверху и снизу = 12,5%). Контейнер 16:9 с `object-fit: cover; object-position: center` обрезает ровно полосы; менять адреса картинок не нужно. Fallback при ошибке загрузки сохраняется.
- Карточка: `article` с рамкой `1px solid rgb(239 237 245 / .18)`, radius 16px, фон `rgb(18 12 52)`, `overflow: hidden`; первый блок — обложка 16:9 с оверлеем (значения в MEDIA-02); второй блок — панель заголовка (absolute, inset 4px, padding `clamp(18px, 2.4vw, 28px)`, radius 12px, `justify-content: flex-end`), заголовок 800 `clamp(1.125rem, 1.6vw, 1.375rem)` `-0.03em` lh 1.08 `line-clamp: 3`, дата 700 12px uppercase `rgb(170 217 220)`.
- Ховер/фокус-within: картинка `scale(1.035)` 760ms `cubic-bezier(.16, 1, .3, 1)`; панель через `::before` получает фон `rgb(247 239 232 / .96)` и тень `0 12px 30px rgb(2 2 12 / .24)` за 240ms, текст панели (заголовок и дата) становится `rgb(18 12 52)`; рамка карточки `rgb(143 157 214 / .38)`. Reduced motion: без масштабирования и переходов.
- Тест MEDIA-01 (яркость полос) — Playwright-скрипт в фазе 13; в фазе 10 unit-тест проверяет `aspect-ratio` контейнера и `object-fit` (через className/inline style) и что `hqdefault` остаётся источником.
- `VideoEmbed`: проверить, что контейнер 16:9 с `object-fit: cover` не оставляет полос (по расчёту не оставляет); правки только если замер покажет полосы.

### Claude's Discretion
- Tailwind-утилиты vs `news.css` — на выбор, но hover-состояния панели проще держать в `news.css`.
</decisions>

## Canonical References

- `docs/superpowers/specs/2026-09-06-design-fixes-v1.1-design.md` — спецификация с точными значениями CSS оригинала (раздел 4 (MEDIA)); при расхождении с любым другим документом побеждает спецификация
- `.planning/ROADMAP.md` — фаза 10: критерии успеха, список файлов во владении, правила параллельной работы (фазы 7–12 идут одновременно в разных worktree от одного `main`)
- `docs/research/v1.1/orig-rules.css` и `orig-vars.txt` — правила и переменные оригинала; `dom-*.html` — разметка; скриншоты `orig-*.jpeg`
- `docs/qa/SMOKE.md` — как принимались прошлые фазы (Playwright на 1440×900 и 390×844)

## Правила фазы

- Редактировать только файлы из списка **Files** фазы 10 в ROADMAP.md. Чужие файлы не трогать даже ради одной строки; правило для чужого селектора класть в свой CSS-файл.
- Цвета в CSS писать литералами `rgb(r g b / a)` из спецификации: токены `--color-midnight-*` проекта сдвинуты на шаг относительно палитры оригинала.
- Тесты в той же фазе, что и код; `npm test` по затронутым файлам зелёный до завершения плана; `npx tsc -b` и `npm run lint` без ошибок.
- Весь пользовательский текст на русском, идентификаторы на английском. Комментарии в коде на русском, как в проекте.
- Reduced motion: единственный блок `@media (prefers-reduced-motion: reduce)` живёт в `src/styles/global.css` (тест `src/styles/motionPolicy.test.ts`); в CSS фазы такой блок не заводить. Декоративные петли помечать существующими значениями `data-anim` из закрытого реестра (stars, globe, beam, pulse, new-light, particles, atmosphere, wave, halo), новых значений не добавлять; переходы гасит глобальное правило `transition-duration: 0.01ms`.

## Deferred Ideas

- Всё из бэклога v2 (`.planning/PROJECT.md`, «Key context») остаётся вне фазы.
