---
phase: 12-footer-column
plan: 01
subsystem: ui
tags: [footer, layout, css, wordmark, tailwind, vitest]

requires:
  - phase: 05-shell
    provides: базовый футер со скосом, волнами и гало, компонент Wordmark, блок footer в copy.ts
provides:
  - футер одной колонкой по центру, порядок «логотип → подпись → ссылки → юридический текст»
  - опциональный проп size у Wordmark с модификатором wordmark--footer
  - тесты порядка узлов футера и текстовые проверки Footer.css
affects: [13-qa, визуальная приёмка Playwright, будущие правки шапки и футера]

tech-stack:
  added: []
  patterns:
    - правило чужого класса (.wordmark--footer) лежит в CSS своей фазы, а не в global.css
    - CSS проверяется чтением файла через readFileSync (vitest настроен с css: false)

key-files:
  created: []
  modified:
    - src/components/layout/Wordmark.tsx
    - src/components/layout/Wordmark.test.tsx
    - src/components/layout/Footer.tsx
    - src/components/layout/Footer.css
    - src/components/layout/Footer.test.tsx

key-decisions:
  - "Проп размера назван size со значениями default и footer: дефолт оставляет корень шапки строкой \"wordmark\" без изменений"
  - "Кегль вордмарка в футере clamp(1.25rem, 3.2vw, 1.875rem) с white-space: nowrap — название держится в 190px на 390px и не выходит за 300px"
  - "copy.ts не менялся: подпись и юридическая строка совпали с разметкой оригинала dom-ov-main-site-footer.html"

patterns-established:
  - "Ширину и центровку колонки задаёт CSS, а не Tailwind-классы в разметке"
  - "Цвета футера — литералы rgb(r g b / a) из спецификации, без токенов --color-*"

requirements-completed: [FOOT-01, FOOT-02]

duration: 12min
completed: 2026-09-06
---

# Phase 12 Plan 01: Футер в одну колонку Summary

**Футер перестроен во flex-колонку по центру шириной `min(100% - 32px, 1152px)`: увеличенный вордмарк со свечением, подпись, ссылки столбиком и юридический текст без линии-разделителя.**

## Performance

- **Duration:** ~12 мин
- **Started:** 2026-09-06T11:00:20Z
- **Completed:** 2026-09-06T11:12:00Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments

- `.site-footer__inner` стал flex-колонкой по центру: `width: min(100% - 32px, 1152px)`, `gap: clamp(20px, 3vw, 34px)`, `text-align: center`; grid `site-footer__grid` и обёртка `site-footer__brand` удалены вместе с Tailwind-классами `mx-auto max-w-[72rem] px-4 md:px-8`.
- Вордмарк в футере вырос до `clamp(190px, 26vw, 300px)` × `clamp(72px, 10vw, 108px)` со свечением `drop-shadow(0 0 22px rgb(91 90 214 / .13))`; шапка не изменилась (`Header.tsx`, `Header.css` не тронуты, `Header.test.tsx` зелёный без правок).
- Ссылки стоят столбиком по центру с gap 8px, 700 14px `rgb(248 247 251 / .92)`, ховер и фокус `rgb(170 217 220)`; `target="_blank"` и `rel="noopener noreferrer"` держатся в одной строке TSX.
- Юридический текст `.75rem` / lh 1.7 / `rgb(239 237 245 / .66)` / `text-wrap: balance` без `border-top`; скос, волны `::after` и `.site-footer__halo` не изменились, атрибуты `data-anim="wave"` и `data-anim="halo"` на месте.
- Тестов стало 9 в `Footer.test.tsx` (5 старых + 4 новых) и 7 в `Wordmark.test.tsx` (4 старых + 3 новых).

## Task Commits

1. **Task 1: Проп размера у Wordmark с тестами** — `f925862` (feat)
2. **Task 2: Футер одной колонкой по центру (разметка и CSS)** — `8d53f50` (feat)
3. **Task 3: Тесты порядка узлов и CSS футера, гейт фазы** — `e214c6a` (test)

## Files Created/Modified

- `src/components/layout/Wordmark.tsx` — проп `size?: "default" | "footer"`; при `footer` корень получает `wordmark--footer`, дефолт оставляет `className` корня равным `"wordmark"`
- `src/components/layout/Wordmark.test.tsx` — три теста пропа `size` (дефолт, footer с градиентом, footer + `className` + `tone="solid"`)
- `src/components/layout/Footer.tsx` — четыре прямых ребёнка `.site-footer__inner`: `<Wordmark size="footer" />`, `p.site-footer__caption`, `nav.site-footer__links`, `p.site-footer__legal`
- `src/components/layout/Footer.css` — flex-колонка `.site-footer__inner`, правило `.site-footer .wordmark--footer` с размерами и свечением, подпись 16→18→20px по брейкпоинтам, столбик ссылок, юридический текст без рамки
- `src/components/layout/Footer.test.tsx` — константа `FOOTER_CSS` через `readFileSync` и четыре теста: порядок узлов `[0, 1, 2, 3]`, модификатор вордмарка, значения колонки и логотипа в CSS, столбик ссылок и отсутствие `border-top`

`src/data/copy.ts` остался без изменений: тексты блока `footer` сверены с `docs/research/v1.1/dom-ov-main-site-footer.html` и совпадают.

## Verification (наблюдаемые результаты)

- `npx tsc -b` — exit 0.
- `npx vitest run src/components/layout/Footer.test.tsx src/components/layout/Wordmark.test.tsx src/components/layout/Header.test.tsx src/styles/motionPolicy.test.ts` — 4 файла, 69 тестов, все зелёные.
- `npx vitest run` (полный набор) — 45 файлов, 393 теста, все зелёные.
- `npm run lint` — exit 0, без предупреждений.
- `grep -c 'prefers-reduced-motion' src/components/layout/Footer.css` → 0; `grep -c 'border-top' …` → 0; `grep -c 'max-w-\[72rem\]' src/components/layout/Footer.tsx` → 0.
- `git status --short` показывает только пять файлов фазы (плюс неотслеживаемый симлинк `node_modules`, созданный оркестратором при подготовке worktree).
- Визуальная приёмка на 1440×900 и 390×844 в этой фазе не выполнялась: по плану её делает фаза 13 через Playwright по `docs/qa/SMOKE.md`.

## Decisions Made

- Проп назван `size` со значениями `"default" | "footer"` (имя было на усмотрение исполнителя по CONTEXT.md); дефолт склеивает классы так, что корень в шапке остаётся строкой `"wordmark"` без хвостовых пробелов.
- Кегль названия в футере — `clamp(1.25rem, 3.2vw, 1.875rem)` с `white-space: nowrap`, подпись — `clamp(.625rem, 1.1vw, .8125rem)`: значения из плана взяты без сдвига, 15 знаков Onest 900 умещаются в 190px на вьюпорте 390px.
- Правило `.site-footer .wordmark--footer` живёт в `Footer.css`, а не в `global.css`: файл принадлежит фазе 7, параллельной этой.

## Deviations from Plan

None — план выполнен как написан.

## Issues Encountered

При генерации тестов через python-скрипт в файл попала лишняя строка с литеральными символами `\n`, oxc-трансформер уронил прогон. Строку убрал до коммита, тесты зелёные; в историю дефект не попал.

## User Setup Required

None — внешние сервисы не настраиваются.

## Next Phase Readiness

- Разметка и стили футера готовы к визуальной приёмке фазы 13 (Playwright, 1440×900 и 390×844): проверять центровку колонки, размер логотипа и отсутствие линии над юридическим текстом.
- `npm run build` и `node scripts/check-dist.mjs` в этой фазе не запускались — гейт сборки за оркестратором после слияния worktree.
- Стыков с другими фазами не осталось: полный `npx vitest run` в ветке зелёный.

## Self-Check: PASSED

- Файлы на месте: `Wordmark.tsx`, `Wordmark.test.tsx`, `Footer.tsx`, `Footer.css`, `Footer.test.tsx`.
- Коммиты найдены: `f925862`, `8d53f50`, `e214c6a`.

---
*Phase: 12-footer-column*
*Completed: 2026-09-06*
