---
phase: 07-glass-and-titles
plan: 01
subsystem: ui
tags: [css, tailwind-v4, glassmorphism, backdrop-filter, vitest]

requires:
  - phase: 01-foundation
    provides: утилита glass, токены стекла в global.css, примитив GlassCard
  - phase: 03-about-involve
    provides: карточки шагов .ab-step и триптих .inv-triptych / .inv-card
provides:
  - Полупрозрачные токены стекла --glass-surface, --glass-border, --shadow-card по карточке оригинала
  - Утилита glass-resource для карточек ресурсов (класс вешает фаза 11)
  - Блик и ховер .glass-card по спецификации GLASS-01, переход 420ms
  - Карточки шагов About без своего фона, с ховером рамки и тени оригинала
  - Триптих Involve без размытия рамки, карточки со своей поверхностью, швом и радиусом 14px
  - Текстовые проверки CSS в трёх тестовых файлах через хелперы flat и block
affects: [11-resources, 09-form, 13-qa-and-deploy]

tech-stack:
  added: []
  patterns:
    - "Значения CSS сверяются по тексту исходника с диска: vitest настроен с css: false"
    - "Хелперы flat и block объявляются локально в каждом тестовом файле, общего тестового модуля нет"
    - "Цвета оригинала пишутся литералами rgb(r g b / a), а не токенами палитры проекта"

key-files:
  created: []
  modified:
    - src/styles/global.css
    - src/components/layout/primitives.css
    - src/components/about/about.css
    - src/components/involve/involve.css
    - src/components/layout/primitives.test.tsx
    - src/components/about/About.test.tsx
    - src/components/involve/Involve.test.tsx

key-decisions:
  - "--shadow-card переопределён в :root файла global.css, а не в tokens.css: tokens.css вне зоны владения фазы 7, а незаслоённый :root побеждает @layer theme в каскаде — проверено на собранном бандле"
  - "Длительность ховера стеклянной карточки записана литералом 420ms вместо var(--dur-ui): у примитива 240ms, у оригинала 420ms"
  - "Шов триптиха перенесён с соседства слотов (.inv-slot + .inv-slot) на рамку каждой карточки: так работает .ov-involve-item оригинала"

patterns-established:
  - "Текстовая проверка CSS: flat(css) схлопывает пробелы, block(css, head) достаёт тело правила — переформатирование исходника тесты не роняет"
  - "Побочные эффекты смены общих токенов принимаются целиком, чужие файлы под них не правятся"

requirements-completed: [GLASS-01, GLASS-02, GLASS-03, GLASS-04, GLASS-05]

duration: 8 min
completed: 2026-09-06
---

# Phase 7 Plan 01: Стекло по оригиналу Summary

**Стеклянные поверхности проекта переведены с непрозрачного индиго `rgb(48 63 131 / .86)` на полупрозрачную карточку оригинала `rgb(49 41 77 / .44) → rgb(18 12 52 / .62)`; триптих Involve потерял размытие рамки и получил карточки со своей поверхностью и швом.**

## Performance

- **Duration:** 8 min
- **Started:** 2026-09-06T08:09:00Z
- **Completed:** 2026-09-06T08:17:00Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- Три токена стекла в `global.css` приведены к значениям спецификации: фон секции теперь просвечивает сквозь карточку, тень стала вчетверо легче (`0 20px 46px rgb(3 2 18 / .24)` вместо `0 30px 72px rgb(18 12 52 / .62)`).
- Утилита `glass-resource` со своим верхним бликом и `saturate(125%)` готова к фазе 11; класс на `.resource-card` вешает она.
- Блик `.glass-card::before` и ховер `.glass-card--interactive` совпали с оригиналом: рамка светлеет до `rgb(143 157 214 / .34)`, тень мягкая, переход 420ms.
- Карточки шагов About своего фона не объявляют — поверхность приходит из утилиты; акцентная линия и разделитель остались на месте.
- Рамка триптиха Involve отдала размытие карточкам: `backdrop-filter: none`, кольцо 4px, тень `0 34px 76px rgb(2 2 12 / .58), 0 0 54px rgb(59 77 161 / .22)`; каждая карточка несёт `rgb(33 26 62 / .48)`, шов `1px solid rgb(239 237 245 / .15)` и радиус 14px внутри рамки 18px.
- Шапка и счётчики карты не изменились: `Counters.test.tsx` зелёный без правок, независимость закреплена тестом.

## Task Commits

1. **Task 1: Токены и утилиты стекла в global.css, блик и ховер .glass-card, тесты primitives** — `02f4ed4` (feat)
2. **Task 2: Карточки шагов About и триптих Involve на стекле оригинала, тесты About и Involve** — `e9a5e16` (feat)

## Files Created/Modified

- `src/styles/global.css` — токены `--glass-border`, `--glass-surface`, `--shadow-card`; комментарий у `@utility glass`; новая `@utility glass-resource`
- `src/components/layout/primitives.css` — блик `.glass-card::before`, переход и ховер `.glass-card--interactive`
- `src/components/about/about.css` — переход `.ab-step` на 420ms и ховер `.ab-step:hover` с рамкой и тенью оригинала
- `src/components/involve/involve.css` — радиус рамки 18px, рамка без размытия с кольцом 4px, поверхность и шов `.inv-card`, ховер карточки; удалены `--triptych-seam`, `--triptych-surface` и оба правила `.inv-slot + .inv-slot`
- `src/components/layout/primitives.test.tsx` — хелперы `flat`/`block`, describe «токены и утилиты стекла (GLASS-01, GLASS-03)» и «стекло не трогает шапку и счётчики (GLASS-05)»
- `src/components/about/About.test.tsx` — describe «стекло карточек шагов (GLASS-02)»
- `src/components/involve/Involve.test.tsx` — describe «стекло триптиха (GLASS-04)»

## Decisions Made

- **Переопределение `--shadow-card` в `global.css`.** Значение живёт в `@theme` файла `tokens.css`, который фаза 7 править не вправе. Проверил на собранном бандле: объявление из `@theme` попадает в `@layer theme`, а `:root` из `global.css` остаётся незаслоённым и в каскаде побеждает. Фаза 13 может перенести значение в `tokens.css` после слияния.
- **Литералы 420ms вместо `var(--dur-ui)`** в переходе `.glass-card--interactive` и `.ab-step`: общий токен держит 240ms, а у оригинала ховер длиннее.
- **Побочные эффекты смены токенов не компенсировались.** `.btn--ghost`, рамки карточек новостей, `.resources-panel` и тень `video-embed.css` читают те же токены и получили новую поверхность автоматически — так решено в CONTEXT.md, чужие файлы не тронуты.

## Deviations from Plan

None — план выполнен ровно как написан.

## Assumption Drift (advisory)

**1. Утилита `glass-resource` попадает в бандл уже сейчас**
- **Found during:** Task 1, проверка `npm run build`
- **Planned:** план предполагал, что Tailwind добавит утилиту в бандл только после первого использования класса в исходниках (фаза 11), а до слияния она живёт лишь в `global.css`.
- **Actual:** в `dist/assets/index-*.css` правило `.glass-resource` уже присутствует.
- **Why:** сканер Tailwind v4 берёт кандидатов из всех исходников, включая строковый литерал `"@utility glass-resource {"` внутри `primitives.test.tsx`.
- **Влияние:** около 200 байт CSS, ни один элемент класс не носит. На поведение и на работу фазы 11 не влияет.

**2. Счётчик `prefers-reduced-motion` в `global.css` равен 2, а не 1**
- **Found during:** Task 1, сверка критериев приёмки
- **Planned:** критерий требовал `grep -c "prefers-reduced-motion" src/styles/global.css` → 1, «как до правки».
- **Actual:** и до правки, и после `grep -c` даёт 2: строка комментария «Единственный блок prefers-reduced-motion в проекте» и сама строка `@media`.
- **Why:** в тексте плана посчитали `@media`-блоки, а не строки. Инвариант «как до правки» выполнен, `@media (prefers-reduced-motion: reduce)` ровно один, `motionPolicy.test.ts` зелёный без правок.

## Issues Encountered

`git status --porcelain` показывает `?? node_modules`: в worktree это симлинк на `node_modules` основного каталога, а `.gitignore` содержит `node_modules/` со слешем и симлинк не покрывает. Инфраструктура worktree, не результат работы плана; файл не коммитился, `.gitignore` вне зоны владения фазы 7 и не правился.

## Verification

Все команды гейта запущены в worktree и завершились кодом 0:

- `npx tsc -b` — код 0
- `npx vitest run src/components/layout/primitives.test.tsx src/components/about/About.test.tsx src/components/involve/Involve.test.tsx src/styles/motionPolicy.test.ts src/components/map/Counters.test.tsx` — 5 файлов, 64 теста, все зелёные
- `npm run lint` — код 0, замечаний нет
- `npm run build` — код 0; в собранном CSS `--glass-surface: linear-gradient(180deg, #31294d70, #120c349e)`, `--shadow-card: inset 0 1px 0 #ffffff09, 0 20px 46px #0302123d` (незаслоённый `:root` перебивает `@layer theme`)
- `git diff --name-only` по запрещённым путям (`tokens.css`, `map`, `form`, `resources`, `news`, `Header.css`, `StepCard.tsx`, `About.tsx`, `Involve.tsx`, `InvolveCard.tsx`) — пусто

Сверка computed-стилей в браузере не запускалась: по QA-03 она остаётся фазе 13, а `npm run preview` в этом worktree запрещён. Значения проверены по тексту исходников и по собранному бандлу.

## User Setup Required

None — внешние сервисы не задействованы.

## Next Phase Readiness

- План 07-02 (плоские заголовки секций и градиентный заголовок About) выполняется в этом же worktree другим агентом; правила `.gradient-title*` в `primitives.css` этот план не трогал.
- Фаза 11 может вешать класс `glass-resource` на `.resource-card`: утилита объявлена и покрыта тестом.
- Блокеров нет.

## Self-Check: PASSED

- Все семь файлов из `files_modified` существуют на диске и изменены.
- Коммиты `02f4ed4` и `e9a5e16` есть в `git log` ветки `agent-07`.
- Критерии приёмки обеих задач перепроверены командами `grep` после правок, гейт плана прогнан целиком.
- `STATE.md` и `ROADMAP.md` не изменялись — их пишет оркестратор.

---
*Phase: 07-glass-and-titles*
*Completed: 2026-09-06*
