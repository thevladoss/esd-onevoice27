---
phase: 03-form-about-involve
plan: 04
subsystem: ui
tags: [form, css, tokens, reduced-motion, accessibility]

requires:
  - phase: 03-form-about-involve
    plan: 01
    provides: "Разметка секции #light-form с классами lf-*, SuccessToast через портал, тесты формы"
  - phase: 01-scaffold-and-deploy
    provides: "Токены палитры и шрифтов, примитивы Section, GlassCard, Button, GradientTitle"
provides:
  - "src/components/form/light-form.css: токены полей и радио-карточек на .lf-section, оформление формы, тоста и правила reduced motion"
  - "Фаза ухода тоста 200 мс через data-state=\"closing\", мгновенное закрытие при уменьшенном движении"
affects: [05-polish-and-release]

tech-stack:
  added: []
  patterns:
    - "Локальные токены секции объявляются на её корневом классе, global.css фазы 1 не растёт (тот же приём у .ab-section и .inv-section)"
    - "Состояния радио-карточек и чекбокса рисует CSS через :has(input:checked) и :has(input:focus-visible), JS-классов нет"
    - "CSS компонента импортируется из TSX и остаётся вне @layer, поэтому перебивает утилиты Tailwind без !important и без роста специфичности"
    - "Открытый тост — отдельный внутренний компонент: размонтирование сбрасывает фазу ухода вместо setState в эффекте"

key-files:
  created:
    - src/components/form/light-form.css
  modified:
    - src/components/form/LightForm.tsx
    - src/components/form/SuccessToast.tsx
    - src/components/form/LightForm.test.tsx

key-decisions:
  - "Шар атмосферы рисуется на .lf-section::before без full-bleed обёртки: секция и так во всю ширину окна, ограничение 72rem живёт на внутреннем div примитива Section"
  - "SuccessToast разделён на SuccessToast и LiveToast: правило react-hooks/set-state-in-effect (eslint 10 + react-hooks 7) запрещает сброс closing внутри эффекта"
  - "Локальный мок matchMedia в LightForm.test.tsx переведён на reduced motion = false по умолчанию, иначе фаза ухода в тестах не проверяется"

metrics:
  duration: 10min
  completed: 2026-09-05
---

# Phase 3 Plan 04: Визуальный контракт формы Summary

**Форма «Зажгите свой свет» получила свой CSS: поля 54px с фокусным кольцом, радио-карточки и чекбокс на `:has(input:checked)`, своя стрелка select инлайн-SVG, тост снизу по центру с появлением 240 мс и уходом 200 мс, который при уменьшенном движении исчезает мгновенно.**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-09-05T16:00Z
- **Completed:** 2026-09-05T16:09Z
- **Tasks:** 2
- **Files modified:** 4 (1 создан, 3 изменено)

## Accomplishments

- `light-form.css` (388 строк): токены `--field-*`, `--option-*`, `--focus-ring`, `--ui-transition` на `.lf-section`; `global.css` фазы 1 не тронут
- Поля и `select` высотой 54px: фон `rgb(18 12 52 / .58)`, рамка `rgb(248 247 251 / .18)`, плейсхолдер `paper/.56`, в фокусе рамка `rgb(123 194 199 / .46)` с кольцом 2px `#aad9dc`, при `aria-invalid` рамка `#fca5a5`
- Радио-карточки: hover только под `@media (hover: hover)`, выбранное состояние и точка-индикатор 12px (маджента у индивидуального, бирюза у группового) через `:has(input:checked)`, кольцо фокуса на всей карточке через `:has(input:focus-visible)`
- Кастомный чекбокс 20px: галочка проявляется по `:checked`, красная рамка по `:has(input[aria-invalid="true"])`
- Стрелка `select` — URL-кодированный инлайн-SVG в `background-image`; фон задан через `background-color`, поэтому стрелка не стирается при смене состояния. Внешних `url()` в файле нет
- Раскладка: карточка `max-width: 56rem`, padding 24px → 40px от 768px, поля и типы света в две колонки от 768px, email/согласие/кнопка на всю ширину
- Тост: `bottom: 24px`, `z-index: 60`, появление `lf-toast-in` 240 мс со сдвигом 12px, уход `lf-toast-out` 200 мс, автозакрытие 4000 мс не зависит от режима движения
- Блок `@media (prefers-reduced-motion: reduce)` снимает анимацию тоста и переходы карточек, точки, полей и чекбокса
- `npm test` — 152 теста в 27 файлах зелёные, `npm run build` и `npx eslint src/components/form` без замечаний

## Task Commits

1. **Task 1: Токены, поля, радио-карточки, чекбокс, кнопка и раскладка** — `7cba8a5` (style)
2. **Task 2: Тост с анимацией появления и ухода, reduced motion** — `03bebb9` (style)

## Files Created/Modified

- `src/components/form/light-form.css` — токены секции, шар атмосферы, заголовочный блок, карточка формы, типы света, поля, ошибки, согласие, кнопка, тост, reduced motion
- `src/components/form/LightForm.tsx` — одна строка: `import "./light-form.css"` первым импортом
- `src/components/form/SuccessToast.tsx` — фаза закрытия: `data-state`, таймер ухода 200 мс, мгновенное закрытие при уменьшенном движении, очистка таймеров на размонтировании
- `src/components/form/LightForm.test.tsx` — хелпер `mockReducedMotion`, ожидание 200 мс в двух тестах тоста, проверка `data-state="closing"`, новый тест мгновенного закрытия

## Decisions Made

- **Шар атмосферы без full-bleed обёртки.** `Section` держит ограничение `max-w-[72rem]` на внутреннем `div`, а сам `<section>` тянется во всю ширину окна, поэтому круг рисуется на `.lf-section::before` с `z-index: -1` под `isolation: isolate` и обрезается справа через `overflow-x: clip`. `MapSection` тоже обходится без обёртки: там атмосфера — это `radial-gradient` прямо в `background` секции. Приём фазы 2 повторён на уровне идеи, отдельного слоя разметки не понадобилось
- **Специфичность вместо `!important`.** Разметка 03-01 держит утилиты Tailwind (`max-w-4xl`, `bottom-6`, `z-[60]`, `p-6 md:p-8` из `GlassCard`). Импортированный из TSX CSS лежит вне `@layer`, а безслойные правила в каскаде выше любого слоя, поэтому `.lf-card { padding: 24px }` перебивает `p-6` без единого `!important`
- **Тост разделён на два компонента.** `SuccessToast` решает, показывать ли тост, `LiveToast` владеет фазой ухода. Закрытие снимает `LiveToast` с монтирования, и следующий тост стартует с `data-state="open"` без ручного сброса состояния
- **Повторный запрос закрытия игнорируется.** Клик во время фазы ухода упирается в проверку `closeTimer.current !== null`, поэтому `onClose` вызывается ровно один раз, а автотаймер не может перезапустить анимацию

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Сброс `closing` вынесен из эффекта в размонтирование**

- **Found during:** Task 2
- **Issue:** План велел сбрасывать `closing` в эффекте при смене `open`. `eslint 10` с `react-hooks 7` считает это ошибкой (`react-hooks/set-state-in-effect`: «Calling setState synchronously within an effect can trigger cascading renders»), `npx eslint src/components/form` падал с кодом 1
- **Fix:** Открытый тост вынесен во внутренний `LiveToast`: `SuccessToast` возвращает `null` при `open === false`, а состояние фазы ухода живёт в компоненте, который при закрытии размонтируется. Ни одного `setState` в теле эффекта не осталось, таймеры чистятся в cleanup
- **Files modified:** src/components/form/SuccessToast.tsx
- **Verification:** `npx eslint src/components/form` — код 0; `npx vitest run src/components/form` — 9 тестов зелёные
- **Committed in:** `03bebb9`

**2. [Rule 3 - Blocking] Локальный мок `matchMedia` в тестах переведён на «движение разрешено»**

- **Found during:** Task 2
- **Issue:** План опирался на `src/test/setup.ts`, где `matchMedia` всегда отдаёт `matches: false`. Но `LightForm.test.tsx` из плана 03-01 переопределяет мок в своём `beforeEach` и отдаёт `matches: true` для `prefers-reduced-motion`. С таким моком тост закрывался бы мгновенно, и требуемые планом ожидания в 200 мс проверяли бы пустоту
- **Fix:** Мок вынесен в хелпер `mockReducedMotion(reduced)`, `beforeEach` ставит `false`. Новый тест вызывает `mockReducedMotion(true)` и проверяет закрытие без ожидания. `src/test/setup.ts` не тронут (файл вне списка плана и правится параллельными планами)
- **Files modified:** src/components/form/LightForm.test.tsx
- **Verification:** Тест «убирает тост через четыре секунды» падает без ожидания 200 мс, тест «при уменьшенном движении…» падает, если фаза ухода срабатывает; оба зелёные на текущем коде
- **Committed in:** `03bebb9`

---

**Total deviations:** 2 auto-fixed (обе блокирующие)
**Impact on plan:** Скоуп не вырос, значения UI-SPEC не изменились. Обе правки — про инструменты (правило линтера и чужой мок в тесте), а не про визуальный контракт.

## Assumption Drift (advisory)

**1. Приём full-bleed из фазы 2 оказался не нужен**

- **Found during:** Task 1
- **Planned:** План допускал, что `MapSection` рисует атмосферные слои через full-bleed обёртку, и предлагал повторить её, чтобы шар не обрезался по контейнеру 72rem
- **Actual:** В `map.css` нет ни обёртки, ни `100vw`: фон секции — набор `radial-gradient` в `background`. Ограничение 72rem у `Section` стоит на внутреннем `div`, поэтому псевдоэлемент на самой секции уже занимает всю ширину окна
- **Why:** Обёртка добавила бы лишний узел в разметку 03-01, которую план запрещает трогать. Читателю UI-SPEC стоит знать, что «шар» — это один псевдоэлемент, а не слой разметки

## Issues Encountered

- Команды `<verify>` в плане начинаются с `cd /Users/thevladoss/devs/web/esd_cringe` (основной чекаут). Исполнялись в воркетри `/Users/thevladoss/devs/web/esd_cringe-wt/03-04`, где лежит код ветки; сами команды и их критерии не менялись
- `grep -c "appearance: none"` требует ровно одно совпадение, поэтому `-webkit-appearance` в файл не добавлен. Для целевых браузеров (Safari 15.4+, где работает `:has`) префикс не нужен

## Verification Results

| Проверка | Результат |
|----------|-----------|
| `npm test` | 152 теста, 27 файлов — зелёные |
| `npm run build` (`tsc -b && vite build`) | успешно, CSS 64.07 kB |
| `npx eslint src/components/form` | код 0 |
| Греп-критерии Task 1 | все совпали: `:has(input:checked)` — 4 строки, `:has(input:focus-visible)` — 2, `[aria-invalid="true"]` — 2, `appearance: none` — 1, `data:image/svg+xml` — 1, `h2` — 0, `!important` — 0 |
| Греп-критерии Task 2 | `prefers-reduced-motion` — 1 в CSS и 1 в `SuccessToast.tsx`, `z-index: 60` — 1, `bottom: 24px` — 1, оба `@keyframes` — по 1, `data-state=` — 1, `<button` — 0, `advanceTimersByTime(200)` — 2 |
| Стрелка `select` после минификации | `data:image/svg+xml,%3Csvg …` присутствует в `dist/assets/*.css` |

`human-check` из Task 2 (визуальный проход по 390/768/1024/1440 и системный режим «уменьшить движение») выполнить в этой сессии некому: пользователь недоступен, режим автономный. ⚡ Auto-approved checkpoint — проверка остаётся за смоуком фазы 5 (MOTION-03, QA-04). Всё, что проверяемо без глаз, прогнано командами выше.

## Known Stubs

Заглушек нет. Оформление формы закрыто целиком: незакрытыми остаются только reveal-анимации секции при скролле, которые UI-SPEC явно отдаёт фазе 5.

## User Setup Required

None — новых зависимостей и внешних адресов не появилось, `package.json` не менялся.

## Next Phase Readiness

- Фаза 5 может подключать `whileInView` к секции: карточки остаются отдельными узлами, переходы описаны через `--ui-transition` и снимаются одним блоком reduced motion
- Ветка трогает только `src/components/form/**`, конфликтов с параллельными планами 02-04 и 02-05 нет
- Значения токенов формы совпадают с 03-UI-SPEC; если фаза 5 захочет вынести их в `global.css`, переносится один блок из `.lf-section`

---
_Phase: 03-form-about-involve_
_Completed: 2026-09-05_

## Self-Check: PASSED

Все четыре файла плана и SUMMARY на месте, оба коммита задач (`7cba8a5`, `03bebb9`) в истории ветки `agent-03-04`. STATE.md и ROADMAP.md не тронуты.
