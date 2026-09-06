---
phase: 09-form-original
plan: 02
subsystem: ui
tags: [form, css, layout, a11y]

requires:
  - phase: 09-form-original
    provides: "Модель формы с пустым типом, условное поле orgName, тексты FORM-02"
provides:
  - "Форма без GlassCard: Reveal оборачивает form.lf-form, колонка 42rem по центру"
  - "Сетка полей 6 колонок: lf-col-3 у имени, фамилии, страны и города, lf-span у организации и почты"
  - "Карточка типа с маячком ::before, точкой-радио 16px и свечением выбранного состояния"
  - "Нативный чекбокс .lf-checkbox 18×18 с accent-color"
  - "Инварианты значений light-form.css в тестах: CSS читается с диска, как в motionPolicy.test.ts"
affects: [08-map-band, 13-qa]

tech-stack:
  added: []
  patterns:
    - "Отступы чужого контейнера Section переопределяются неслоёным правилом .lf-section > div: утилиты Tailwind лежат в @layer utilities и проигрывают ему без наращивания специфичности"
    - "Значения CSS стережёт тест, читающий файл с диска: vitest настроен с css: false, и в jsdom правил формы нет"

key-files:
  created: []
  modified:
    - src/components/form/LightForm.tsx
    - src/components/form/LightTypeChoice.tsx
    - src/components/form/ConsentCheckbox.tsx
    - src/components/form/light-form.css
    - src/components/form/LightForm.test.tsx

key-decisions:
  - "`outline: none` на .lf-control:focus из плана не добавлял: политика фокуса проекта (motionPolicy.test.ts) запрещает гасить обводку где-либо, кроме цели ссылки пропуска"
  - "Поле города переписано в многострочный вызов FormField: className не помещался в одну строку рядом с тремя пропами"

patterns-established:
  - "Точка-радио показывает выбор вместо скрытого input: .lf-type-row держит название и точку в одной строке, маячок рисует ::before"

requirements-completed: [FORM-01, FORM-03, FORM-04, FORM-05]

duration: 12min
completed: 2026-09-06
---

# Phase 9 Plan 2: Разметка и стили формы как в оригинале Summary

**Форма съехала со стеклянной карточки на секцию: колонка 42rem, сетка шести колонок, карточки типа с маячком и точкой-радио, поля 54px с радиусом 16 и нативный чекбокс.**

## Performance

- **Duration:** 12 min
- **Started:** 2026-09-06T11:28:00Z
- **Completed:** 2026-09-06T11:40:00Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- `GlassCard` ушёл из формы вместе с импортом: `Reveal delay={0.1}` оборачивает `form.lf-form`, и внутри `#light-form` стеклянной карточки больше нет.
- Поля разложены по сетке шести колонок: на ≥768px имя рядом с фамилией и страна рядом с городом, организация и почта во всю ширину; на узком экране всё в одну колонку.
- Карточка типа собрана как в оригинале: маячок `::before` 40×40 из двух радиальных градиентов, строка «название + точка-радио 16px», выбранная карточка светится `0 0 24px var(--halo)` и меняет рамку на `rgb(123 194 199 / .72)`, ховер и `:focus-within` поднимают её на 2px.
- Поля и select выросли до `min-height 54px` с радиусом 16px, фоном `rgb(33 26 62 / .58)` и рамкой `rgb(239 237 245 / .18)`; фокус даёт рамка `rgb(170 217 220)`, фон `rgb(49 41 77 / .7)` и кольцо `0 0 0 3px rgb(123 194 199 / .12)`.
- Чекбокс согласия стал нативным 18×18 с `accent-color: rgb(170 217 220)`; свой бокс со свёрстанной галочкой удалён вместе с правилами `.lf-check-box*`.
- Секция отдала фон и орб: `.lf-section` осталась прозрачной, подложку после слияния даёт лента `.map-band` фазы 8. Отступы контейнера `Section` перебиты своим правилом `.lf-section > div { padding-block: 64px }`, форма стоит через 48px после лида.
- Тестов в затронутых файлах стало 69: девять новых проверяют разметку без карточки, строку карточки типа, нативный чекбокс, классы сетки и значения `light-form.css`, прочитанного с диска.

## Task Commits

1. **Task 1: Разметка без GlassCard, точка-радио, сетка 6 колонок, нативный чекбокс** — `b7b9ff2` (feat)
2. **Task 2: light-form.css по FORM-03/04/05 и инварианты значений** — `4880ad5` (feat)

## Files Created/Modified

- `src/components/form/LightForm.tsx` — импорт и обёртка `GlassCard` удалены, тело формы поднято на уровень выше, `className="lf-col-3"` у имени, фамилии, страны и города
- `src/components/form/LightTypeChoice.tsx` — `span.lf-type-row` с названием и точкой вместо трёх плоских span, описание карточки следом
- `src/components/form/ConsentCheckbox.tsx` — `input.lf-checkbox` вместо `sr-only`, свой бокс с svg-галочкой удалён
- `src/components/form/light-form.css` — файл переписан: токены секции, отступы контейнера, шапка, сетка, карточки типа, поля, чекбокс, кнопка; блоки `.lf-toast*` и `.lf-required` перенесены без изменений
- `src/components/form/LightForm.test.tsx` — четыре теста разметки в describe «структура секции» и describe «light-form.css: значения оригинала» из пяти тестов

## Decisions Made

- `.lf-field` потерял зарезервированную третью строку сетки: ритм 16px повторяет оригинал, а резерв 26px под текст ошибки растягивал форму на лишний ряд. Ошибка теперь появляется под контролом и сдвигает следующее поле.
- `.lf-checkbox[aria-invalid="true"]` объявлен выше `:focus-visible`: при равной специфичности побеждает последнее правило, и кольцо фокуса перекрывает красную обводку ошибки.
- Комментарий про `background-color` у `.lf-control` сохранён дословно: сокращённая запись `background` стёрла бы SVG-стрелку select.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `outline: none` на `.lf-control:focus` уронил бы политику фокуса**

- **Found during:** Task 2 (переписывание CSS)
- **Issue:** План дословно предписывает `.lf-control:focus { … outline: none; }` вслед за оригиналом. Тест `src/styles/motionPolicy.test.ts` («нигде в исходниках не снимает обводку фокуса») ищет по всем `.css/.ts/.tsx` регулярку `outline:\s*(none|0)` и разрешает единственное исключение — программный фокус на `<main>`. Правило из плана добавило бы `light-form.css` в список нарушителей, а прогон `motionPolicy.test.ts` входит в критерии успеха плана.
- **Fix:** Объявление `outline: none` не добавлял. Фокус поля меняет рамку `rgb(170 217 220)`, фон `rgb(49 41 77 / .7)` и кольцо `0 0 0 3px rgb(123 194 199 / .12)` — все три значения спецификации на месте; клавиатурную обводку поверх них рисует глобальное `:focus-visible` из `global.css`. Обходить тест прозрачным цветом (`outline-color: transparent`) не стал: сам тест такой приём и называет обманом.
- **Files modified:** `src/components/form/light-form.css`
- **Verification:** `npx vitest run src/components/form src/lib/validation.test.ts src/styles/motionPolicy.test.ts` — 5 файлов, 69 тестов зелёные. Ни один критерий приёмки задачи 2 `outline: none` не требует.
- **Committed in:** `4880ad5`

---

**Total deviations:** 1 auto-fixed (1 blocking).
**Impact on plan:** Область плана не расширялась, значения FORM-04 перенесены полностью. Расхождение с оригиналом ограничено видом сфокусированного поля.

## Assumption Drift (advisory)

**Сфокусированное поле выглядит не как в оригинале**

- **Planned:** FORM-04 и запись `T-09-06` в реестре угроз исходят из того, что индикатор фокуса задают только рамка и кольцо тени, как в `#ov-light-form-container`.
- **Actual:** поверх них лежит проектная обводка `:focus-visible` — 2px `--color-horizon-200` с отступом 4px от глобального правила.
- **Why:** политика фокуса проекта старше спецификации v1.1 и закреплена тестом; отменить её локально в `light-form.css` нельзя. Для клавиатурной доступности это плюс, для попиксельного сходства с оригиналом — минус, который увидит приёмка фазы 13.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Фаза 9 закрыта: FORM-01…FORM-05 выполнены, форма ждёт только визуальной приёмки.
- Секция прозрачна: пока фаза 8 не слита, форма стоит на фоне страницы, а не на ленте карты. До слияния скриншот формы будет темнее задуманного — это ожидаемо, а не регрессия.
- Ручную сверку с `orig-form.jpeg` и `orig-form-group.jpeg` (1440×900 и 390×844) не выполнял: в worktree дев-сервер и превью не запускаются. Проверка остаётся за фазой 13 (QA-03).

## Self-Check

- `LightForm.tsx`, `LightTypeChoice.tsx`, `ConsentCheckbox.tsx`, `light-form.css`, `LightForm.test.tsx` — на диске, изменены.
- Коммиты `b7b9ff2` и `4880ad5` в `git log` ветки `agent-09`.
- Критерии приёмки задачи 1: `GlassCard` 0, `lf-col-3` 4, `lf-span` 2, `lf-type-row` 1, `lf-type-dot` 1, `lf-checkbox` 1, остатков `sr-only|lf-check-box|<svg` в `ConsentCheckbox.tsx` 0.
- Критерии приёмки задачи 2: запрещённых строк 0, девять значений 9, шесть цветов 7, `.lf-submit` без `width`, `.lf-section` без `background`, `.lf-toast` 5, `.lf-required` 2.
- `npx tsc -b` без ошибок; `npx vitest run src/components/form src/lib/validation.test.ts src/styles/motionPolicy.test.ts` — 5 файлов, 69 тестов зелёные; `npm run lint` чист; `npm run build` собрал dist за 207 мс.

## Self-Check: PASSED

---
*Phase: 09-form-original*
*Completed: 2026-09-06*
