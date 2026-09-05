---
phase: 06-original-fidelity
plan: 02
subsystem: ui
tags: [css, conic-gradient, at-property, mask-image, button, reduced-motion]

requires:
  - phase: 01-foundation
    provides: примитив Button, класс .btn и блок .btn[data-beam] в global.css
  - phase: 05-polish-and-release
    provides: единый блок prefers-reduced-motion и реестр data-anim в global.css
provides:
  - луч кнопки в border-box рамки 1.5px вместо маскированного псевдоэлемента
  - сетка точек ::after под конической маской на той же переменной угла --ov-hero-beam
  - блик ::before кнопки по правилам оригинала
  - проп size="form" у Button и размер submit формы через data-size
affects: [06-04-smoke, любые будущие кнопки лендинга]

tech-stack:
  added: []
  patterns:
    - "Луч живёт в самом фоне кнопки: поверхность в padding-box, конический градиент в border-box, псевдоэлементы свободны под блик и точки"
    - "Точки и луч крутит одна зарегистрированная переменная --ov-hero-beam: маска ::after и рамка идут в фазе"
    - "Подпись кнопки заворачивается в span.btn__label и поднимается над слоем точек"

key-files:
  created: []
  modified:
    - src/styles/global.css
    - src/components/layout/Button.tsx
    - src/components/hero/Hero.tsx
    - src/components/form/LightForm.tsx
    - src/components/layout/primitives.test.tsx
    - src/styles/motionPolicy.test.ts

key-decisions:
  - "data-beam ставит сам Button для варианта primary: иначе submit формы пришлось бы помечать вручную, как это делал Hero"
  - "Подпись всегда в span.btn__label, у ghost тоже: разметка кнопки одна на оба варианта, а CSS поднимает подпись над точками только под data-beam"
  - "Запасное правило @supports not (conic-gradient) сохранено и переписано под новую структуру: без конического градиента браузер отбрасывает всю сокращённую запись background и кнопка осталась бы прозрачной"
  - "Своё кольцо фокуса у кнопки убрано: его рисует глобальное :focus-visible, а :focus-visible теперь показывает hover-поверхность, как в оригинале"
  - "Правило :active снято вслед за оригиналом: кнопка остаётся приподнятой на translateY(-1px) всё нажатие"

patterns-established:
  - "CSS-инварианты оригинала проверяются текстом global.css в motionPolicy.test.ts, а не через getComputedStyle в jsdom"

requirements-completed: [FID-03]

duration: 12min
completed: 2026-09-05
---

# Phase 6 Plan 02: Кнопка по CSS оригинала Summary

**Луч кнопки переехал с маскированного псевдоэлемента в border-box рамки 1.5px, а `::after` получил сетку точек шагом 7px под конической маской на той же переменной `--ov-hero-beam`: точки проявляются в секторе за лучом и гаснут позади него, период 3s, у hero CTA и у submit формы.**

## Performance

- **Duration:** ~12 мин
- **Started:** 2026-09-05T20:12:00Z
- **Completed:** 2026-09-05T20:24:16Z
- **Tasks:** 1
- **Files modified:** 6

## Accomplishments

- Кнопка `.btn[data-beam]` собрана по правилам оригинала: поверхность `linear-gradient(125deg, rgb(108 44 104), rgb(59 77 161) 50%, rgb(57 114 126))` в `padding-box`, бегущий конический градиент в `border-box` рамки `1.5px solid transparent`, тень `inset 0 0 0 1px rgb(217 222 244 / .34)` плюс два внешних слоя, `min-height: 52px`, `padding: 16px 40px`, `letter-spacing: .08em`, uppercase.
- `::before` рисует блик: пятно `radial-gradient(circle at 20% 12%, rgb(248 234 244 / .16), transparent 34%)` и косая полоса `linear-gradient(110deg, transparent 30%, rgb(255 255 255 / .08) 50%, transparent 70%)`.
- `::after` держит точки `radial-gradient(circle, rgb(248 247 251 / .72) 0.8px, transparent 1.1px)` с `background-size: 7px 7px` и `opacity: .42`, замаскированные `conic-gradient(from var(--ov-hero-beam), … black 286deg 316deg …)`; та же анимация `hero-beam 3s linear infinite`, что и у рамки, поэтому сектор точек идёт вместе с лучом.
- Обе анимации крутит одна переменная: `@property --ov-hero-beam` объявлена ровно один раз, старое имя `--beam-angle` и старые `@keyframes beam` удалены.
- Hover и focus-visible осветляют поверхность до `rgb(132 53 127) / rgb(79 93 175) / rgb(67 139 150)` и поднимают кнопку на `translateY(-1px)`, тень растёт до `0 14px 34px rgb(59 77 161 / .40)`.
- Submit формы стал тем же лучом: `Button` получил проп `size="form"`, правило `.btn[data-beam][data-size="form"]` задаёт `width: 100%`, `min-height: 54px`, `padding: 14px 28px`.
- Reduced motion гасит движение обеих петель (`.btn[data-beam], .btn[data-beam]::after { animation: none }`): угол остаётся 0deg, точки видны статичным сектором 286-316deg, цвет и тень кнопки не трогаются.

## Task Commits

1. **Task 1: правила кнопки оригинала** — `4926641` (feat)

## Files Created/Modified

- `src/styles/global.css` — блок `.btn[data-beam]` переписан целиком: `@property --ov-hero-beam`, `@keyframes hero-beam`, фон в двух боксах, `::before` блик, `::after` точки под маской, `> *` для подписи, hover/focus, `[data-size="form"]`, запасное правило `@supports not`; в блоке reduced motion правило луча заменено на гашение анимации кнопки и её `::after`
- `src/components/layout/Button.tsx` — проп `size?: "form"` → `data-size`, вариант primary сам ставит `data-beam="true"` рядом с `data-anim="beam"`, подпись заворачивается в `span.btn__label`
- `src/components/hero/Hero.tsx` — убран ручной `data-beam="true"` у CTA, его ставит `Button`
- `src/components/form/LightForm.tsx` — submit получил `size="form"`
- `src/components/layout/primitives.test.tsx` — тест луча проверяет и `data-beam`, и `data-anim`; добавлены тесты обёртки подписи и пропа `size`
- `src/styles/motionPolicy.test.ts` — describe «кнопка с лучом» (единственная `@property`, маска на `--ov-hero-beam`, одна `background-size: 7px 7px`, две петли `hero-beam`, правило размера формы), в списке статичных кадров `[data-anim="beam"]::before` заменён на `.btn[data-beam]::after`

## Verification Results

Все команды прогнаны в worktree, вывод наблюдался:

- `npm test` — 43 файла, 351 тест, все зелёные
- `npm run lint` — без замечаний
- `npm run build` — `tsc -b && vite build`, 787 модулей, без предупреждений, CSS 73.44 КБ
- `node scripts/check-dist.mjs` — 11 проверок OK
- `grep -c "mask-image: conic-gradient(from var(--ov-hero-beam)" src/styles/global.css` → 2 (с webkit-префиксом), `background-size: 7px 7px` → 1, `@property --ov-hero-beam` → 1
- Собранный `dist/assets/index-*.css` проверен глазами: запасное правило осталось внутри `@supports not (background:conic-gradient(…))`, а не всплыло в общий каскад; в блоке `@media (prefers-reduced-motion:reduce)` присутствует `.btn[data-beam],.btn[data-beam]:after{animation:none}`

**Не проверено:** живая картинка на 1440 в браузере (период 3s, ход сектора точек, статика при reduced motion). У исполнителя нет браузерного инструмента; проверка остаётся за smoke-планом фазы.

## Decisions Made

- **`data-beam` ставит `Button`, а не вызывающий код.** Раньше атрибут писал руками только `Hero`, из-за чего submit формы луча не получал вовсе. Условие для `data-beam` и `data-anim="beam"` одно и то же (`variant === "primary"`), поэтому оба атрибута теперь выставляет компонент, а дублирующая строка ушла из `Hero.tsx`. `Hero.test.tsx` проверяет `data-beam="true"` на ссылке и продолжает проходить.
- **`span.btn__label` появляется у обоих вариантов.** Точки лежат слоем `z-index: 1` поверх поверхности, поэтому подпись поднимается правилом `.btn[data-beam] > *`. Разные деревья у primary и ghost создали бы вторую разметку кнопки ради одного слоя; у ghost span просто ничем не стилизован. `<span>` внутри `<button>` не ломает инвариант `App.test.tsx` (там запрещены `p`, `div` и заголовки).
- **Запасное правило `@supports not (conic-gradient)` переписано, а не удалено.** Оригинал такого правила не держит, но у нас конический градиент теперь входит в сокращённую запись `background`: браузер без поддержки отбросил бы её целиком вместе с поверхностью, и кнопка стала бы прозрачной. Правило возвращает плоский `var(--gradient-action)`, красит рамку и прячет `::after` (без маски точки высыпались бы по всей кнопке).
- **Кольцо фокуса у кнопки не своё.** Прежнее `.btn[data-beam="true"]:focus-visible { outline: 2px solid #aad9dc }` снято: глобальное `:focus-visible` в `global.css` рисует кольцо `2px solid var(--color-horizon-200)` с отступом 4px, а `:focus-visible` у кнопки теперь показывает hover-поверхность, как в оригинале.
- **`:active` снят.** В оригинале правила нажатия нет, кнопка держит `translateY(-1px)` всё время удержания; наш прежний `translateY(0)` на `:active` убран вместе со старым блоком.
- **Дубликат `width: 100%` в `light-form.css` оставлен.** Правило `.lf-submit { width: 100% }` теперь повторяет `[data-size="form"]`, но файл формы правит соседний план фонов; трогать его ради косметики значило бы напрашиваться на конфликт слияния.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `docs/research/orig-fidelity-css.md` в ветке отсутствует**

- **Found during:** Task 1, подготовка контекста
- **Issue:** План и задание ссылаются на разбор `docs/research/orig-fidelity-css.md`, раздел 3. В ветке файла нет (в `docs/research/` лежат снимки и `orig-custom-styles.css`).
- **Fix:** Правила сверены напрямую по `docs/research/orig-custom-styles.css`, строки 2841-2941 (`.ov-hero-primary-action`, его `::before`, `::after`, `> span`, `@keyframes ov-hero-beam`) и по переменным 632-655. Разбор совпал с CSS из плана; расхождение одно — оригинал поднимает кнопку на `translateY(-2px)`, план предписывает `-1px`, взят план как источник истины.
- **Files modified:** нет
- **Verification:** значения стопов конического градиента, маски, `7px`, `0.8px`, `0.42` в правилах совпадают с оригиналом
- **Committed in:** `4926641`

**2. [Rule 3 - Blocking] `Button.test.tsx` в проекте не существует**

- **Found during:** Task 1
- **Issue:** План правит `src/components/layout/Button.test.tsx`; тесты примитивов живут одним файлом `src/components/layout/primitives.test.tsx` (describe «Button»).
- **Fix:** Правки внесены в `primitives.test.tsx`: расширен тест луча, добавлены тесты обёртки подписи и пропа `size`.
- **Files modified:** `src/components/layout/primitives.test.tsx`
- **Verification:** `npm test` — 351 тест зелёный
- **Committed in:** `4926641`

**3. [Rule 3 - Blocking] `LightForm.tsx` и `Hero.tsx` вне списка `files_modified`**

- **Found during:** Task 1
- **Issue:** Во фронтматтере плана перечислены четыре файла, но текст задачи требует передать `size="form"` в submit формы, а `Hero.tsx` держал ручной `data-beam`, который после переноса атрибута в `Button` стал дубликатом.
- **Fix:** `LightForm.tsx` — `size="form"` у submit; `Hero.tsx` — удалена строка `data-beam="true"`. Оба файла вне зоны параллельного плана 06-01 (шапка).
- **Files modified:** `src/components/form/LightForm.tsx`, `src/components/hero/Hero.tsx`
- **Verification:** `npm test`, `npm run build` зелёные; `Hero.test.tsx` по-прежнему видит `data-beam="true"` на CTA
- **Committed in:** `4926641`

### Assumption Drift (advisory)

**1. План считал, что `Button` уже ставит `data-beam`**

- **Found during:** Task 1, чтение `src/components/layout/Button.tsx`
- **Planned:** блок `<context>`: «`Button.tsx` (variant primary ставит `data-beam` и `data-anim="beam"`)»
- **Actual:** компонент ставил только `data-anim="beam"`; `data-beam="true"` приходил пропом из `Hero.tsx`, поэтому у submit формы луча не было вовсе.
- **Why:** без переноса атрибута в компонент требование «submit получает те же правила» не выполнялось бы, а `size="form"` работал бы вхолостую: правило `.btn[data-beam][data-size="form"]` не совпало бы ни с чем.

**2. Точки в прежней версии не были привязаны к лучу**

- **Found during:** Task 1
- **Planned:** формулировка «Заменить наш луч на кнопке точной копией правил оригинала» подразумевает правку рамки.
- **Actual:** `::after` с сеткой точек уже существовал, но лежал под контентом (`z-index: -1`) и без маски: точки стояли по всей кнопке ровным полем и с лучом никак не связывались. Это и есть та разница, которую заметил пользователь.
- **Why:** меняется не только рамка, но и слой точек целиком — z-index, маска и своя анимация; отсюда обёртка подписи в span.

## Known Stubs

Нет.

## Self-Check: PASSED

- `src/styles/global.css` — FOUND, `src/components/layout/Button.tsx` — FOUND, `src/components/hero/Hero.tsx` — FOUND, `src/components/form/LightForm.tsx` — FOUND, `src/components/layout/primitives.test.tsx` — FOUND, `src/styles/motionPolicy.test.ts` — FOUND
- Коммит `4926641` — FOUND в `git log` ветки `agent-06-02`
