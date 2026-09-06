# Phase 12: Футер в одну колонку — Context

**Gathered:** 2026-09-06
**Status:** Ready for planning
**Source:** правки пользователя (пункт 6: футер как в оригинале, в один столбец, ссылки ниже в один столбец) + спецификация v1.1, раздел 6; разметка оригинала `docs/research/v1.1/dom-ov-main-site-footer.html`, правила `#ov-main-footer*` в `orig-rules.css`, скриншот `orig-footer.jpeg`

<domain>
## Phase Boundary

`Footer.tsx`, `Footer.css`, `Footer.test.tsx`, блок `footer` в `copy.ts`, опциональный проп размера `Wordmark`. Не трогать `Header.tsx`, `Header.css`, `global.css`, `primitives.css`.
</domain>

<decisions>
## Implementation Decisions

- Колонка по центру: `.site-footer__inner` — flex-колонка, `align-items: center`, `text-align: center`, `width: min(100% - 32px, 1152px)`, gap `clamp(20px, 3vw, 34px)`; padding-block футера `clamp(72px, 10vw, 124px)` (плюс глубина скоса сверху, как сейчас). Порядок: логотип → подпись → ссылки → юридический текст. Grid `site-footer__grid` и верхняя линия у `.site-footer__legal` удаляются.
- Логотип: `Wordmark` с новым пропом (например, `size="footer"`), который задаёт ширину `clamp(190px, 26vw, 300px)` и минимальную высоту `clamp(72px, 10vw, 108px)`, `filter: drop-shadow(0 0 22px rgb(91 90 214 / .13))`; значение по умолчанию оставляет шапку без изменений.
- Подпись: `min(100%, 680px)`, 16px на мобильном, 18px от 768, 20px от 1024, line-height normal, `rgb(248 247 251 / .92)`.
- Ссылки: `ul` столбиком по центру, gap 8px, 700 14px `rgb(248 247 251 / .92)`, ховер/фокус `rgb(170 217 220)`; `target="_blank" rel="noopener noreferrer"` и sr-only подсказка про новую вкладку сохраняются.
- Юридический текст: `min(100%, 680px)`, .75rem lh 1.7 `rgb(239 237 245 / .66)`, `text-wrap: balance`, без рамки сверху.
- Скос, волны (`::after`) и гало (`.site-footer__halo`) не меняются.

### Claude's Discretion
- Имя пропа `Wordmark`, структура теста порядка узлов.
</decisions>

## Canonical References

- `docs/superpowers/specs/2026-09-06-design-fixes-v1.1-design.md` — спецификация с точными значениями CSS оригинала (раздел 6 (FOOT)); при расхождении с любым другим документом побеждает спецификация
- `.planning/ROADMAP.md` — фаза 12: критерии успеха, список файлов во владении, правила параллельной работы (фазы 7–12 идут одновременно в разных worktree от одного `main`)
- `docs/research/v1.1/orig-rules.css` и `orig-vars.txt` — правила и переменные оригинала; `dom-*.html` — разметка; скриншоты `orig-*.jpeg`
- `docs/qa/SMOKE.md` — как принимались прошлые фазы (Playwright на 1440×900 и 390×844)

## Правила фазы

- Редактировать только файлы из списка **Files** фазы 12 в ROADMAP.md. Чужие файлы не трогать даже ради одной строки; правило для чужого селектора класть в свой CSS-файл.
- Цвета в CSS писать литералами `rgb(r g b / a)` из спецификации: токены `--color-midnight-*` проекта сдвинуты на шаг относительно палитры оригинала.
- Тесты в той же фазе, что и код; `npm test` по затронутым файлам зелёный до завершения плана; `npx tsc -b` и `npm run lint` без ошибок.
- Весь пользовательский текст на русском, идентификаторы на английском. Комментарии в коде на русском, как в проекте.
- Reduced motion: единственный блок `@media (prefers-reduced-motion: reduce)` живёт в `src/styles/global.css` (тест `src/styles/motionPolicy.test.ts`); в CSS фазы такой блок не заводить. Декоративные петли помечать существующими значениями `data-anim` из закрытого реестра (stars, globe, beam, pulse, new-light, particles, atmosphere, wave, halo), новых значений не добавлять; переходы гасит глобальное правило `transition-duration: 0.01ms`.

## Deferred Ideas

- Всё из бэклога v2 (`.planning/PROJECT.md`, «Key context») остаётся вне фазы.
