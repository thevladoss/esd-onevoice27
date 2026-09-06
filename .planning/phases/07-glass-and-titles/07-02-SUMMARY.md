---
phase: 07-glass-and-titles
plan: 02
subsystem: ui
tags: [css, typography, gradient, react-props, vitest]

requires:
  - phase: 01-foundation
    provides: примитив GradientTitle, токен --text-section, правила .gradient-title в primitives.css
  - phase: 07-glass-and-titles
    plan: 01
    provides: хелперы flat и block в тестах primitives, About и Involve
provides:
  - Плоский заголовок секции .gradient-title--section цвета rgb(239 237 245) без заливки текста фоном
  - Градиентный вариант .gradient-title--section-gradient с градиентом оригинала 104deg
  - Тип variant у GradientTitle с тремя значениями hero | section | section-gradient
  - Общее правило заливки текста фоном для hero и section-gradient
affects: [08-map-band, 09-form, 10-media, 11-resources, 13-qa-and-deploy]

tech-stack:
  added: []
  patterns:
    - "Вид чужой секции меняется через CSS-класс, а не через правку её вызова: файлы соседних фаз остаются нетронутыми"
    - "Градиент заголовка живёт литералом в primitives.css, общий токен под него не заводится"

key-files:
  created: []
  modified:
    - src/components/layout/primitives.css
    - src/components/layout/GradientTitle.tsx
    - src/styles/global.css
    - src/components/about/About.tsx
    - src/components/layout/primitives.test.tsx
    - src/components/about/About.test.tsx
    - src/components/involve/Involve.test.tsx

key-decisions:
  - "Отдельное правило .gradient-title--section-gradient стоит выше группового правила клипа: хелпер block ищет заголовок правила подстрокой, и групповой селектор перехватывал бы поиск"
  - "Комментарии в CSS и JSDoc описывают поведение вариантов без номеров фаз: номера остаются в .planning"
  - "Компенсация padding и margin осталась в базовом .gradient-title у всех вариантов, включая плоский: она перекрывает mt-2 и без неё плоские заголовки съехали бы относительно v1.0"

patterns-established:
  - "Групповое правило для свойств, общих двум вариантам, ставится после их собственных правил — так текстовые проверки блоков не путают селекторы"

requirements-completed: [GLASS-06]

duration: 5 min
completed: 2026-09-06
---

# Phase 7 Plan 02: Плоские заголовки секций Summary

**Градиент остался только у h1 первого экрана и у заголовка About (`linear-gradient(104deg, rgb(227 175 210) 2%, rgb(143 157 214) 52%, rgb(123 194 199))`); карта, форма, участие, новости и ресурсы получили плоский `rgb(239 237 245)` через класс, без единой правки в их файлах.**

## Performance

- **Duration:** 5 min
- **Started:** 2026-09-06T11:19:00Z
- **Completed:** 2026-09-06T11:24:00Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- Базовый `.gradient-title` больше не заливает текст фоном: `background-clip`, `-webkit-text-fill-color` и `box-decoration-break` переехали в общее правило `.gradient-title--hero, .gradient-title--section-gradient`, а типографика (вес 900, `text-wrap: balance`, компенсация выносных элементов) осталась общей.
- `.gradient-title--section` стал плоским `rgb(239 237 245)` с прежним кеглем `var(--text-section)`, трекингом `-0.035em` и интерлиньяжем 1.05 — ни `background-image`, ни клипа в правиле нет.
- `.gradient-title--section-gradient` несёт градиент спецификации литералом; отдельного токена под него не заводили.
- `GradientTitle` принимает `variant: "hero" | "section" | "section-gradient"`; формирование className не менялось, поэтому расширение типа обратно совместимо и `npx tsc -b` зелёный без правок вызовов.
- Токен `--gradient-title` удалён из `:root` в `global.css`: его единственный потребитель ушёл. `--gradient-brand` и `--gradient-action` на месте.
- `About.tsx` — единственный файл с `variant="section-gradient"`. Вызовы в `MapSection.tsx`, `LightForm.tsx`, `Involve.tsx`, `News.tsx`, `Resources.tsx`, `Section.tsx` и `Hero.tsx` не тронуты: `git diff` по ним пуст.
- Тесты закрепили оба состояния: primitives проверяет классы трёх вариантов и текст всех четырёх правил, About — градиентный класс своего h2, Involve — плоский класс при неизменном вызове.

## Task Commits

1. **Task 1: Плоский section и градиентный section-gradient в primitives.css и GradientTitle.tsx, тесты primitives** — `862fe84` (feat)
2. **Task 2: Градиентный заголовок About, плоские заголовки остальных секций, тесты About и Involve** — `fa7b7bf` (feat)

## Files Created/Modified

- `src/components/layout/primitives.css` — базовое `.gradient-title` без клипа; плоское `.gradient-title--section`; новое `.gradient-title--section-gradient`; общее правило клипа для hero и section-gradient; `.gradient-title--hero` по значениям не менялся
- `src/components/layout/GradientTitle.tsx` — тип `variant` расширен третьим значением, над полем JSDoc про назначение вариантов
- `src/styles/global.css` — удалена строка токена `--gradient-title`
- `src/components/about/About.tsx` — `variant="section-gradient"` у заголовка секции, остальные пропсы прежние
- `src/components/layout/primitives.test.tsx` — тест варианта `section-gradient`, взаимное исключение классов у варианта `section`, describe «плоские и градиентные заголовки (GLASS-06)» из шести проверок
- `src/components/about/About.test.tsx` — тест градиентного класса у h2 About
- `src/components/involve/Involve.test.tsx` — тест плоского класса у h2 Involve

## Decisions Made

- **Порядок правил в `primitives.css`.** План ставил групповое правило клипа сразу за базовым, но хелпер `block` ищет заголовок правила подстрокой, а `.gradient-title--hero, .gradient-title--section-gradient {` содержит `.gradient-title--section-gradient {`. Поиск собственного правила градиента упирался в групповое. Собственные правила вариантов теперь идут раньше группового; каскад не меняется, свойства у правил не пересекаются.
- **Комментарии без номеров фаз.** План диктовал текст «с фазы 7 градиент несут только hero и section-gradient»; в коде это записано поведением («класс исторически называется gradient-title, но градиент несут только варианты hero и section-gradient»), номера фаз остаются в `.planning`.
- **Формулировка комментария о компенсации.** Прежний текст «Компенсация обрезки выносных элементов кириллицы при background-clip: text» пришлось переписать: подстрока `background-clip` внутри базового правила роняла проверку, что базовый класс клипом больше не занимается.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 — Bug] Тест плана не доставал правило `.gradient-title--section-gradient`**

- **Found during:** Task 1, первый прогон `npx vitest run src/components/layout/primitives.test.tsx`
- **Issue:** `block(PRIMITIVES_CSS, ".gradient-title--section-gradient {")` возвращал тело группового правила клипа: заголовок группового селектора содержит заголовок собственного как подстроку, а `block` берёт первое вхождение.
- **Fix:** правила переставлены — базовое, плоское `--section`, собственное `--section-gradient`, групповое правило клипа, `--hero`. Тексты тестов остались такими, как их задумал план.
- **Files modified:** `src/components/layout/primitives.css`
- **Verification:** `npx vitest run src/components/layout/primitives.test.tsx src/styles/motionPolicy.test.ts` — 46 тестов зелёные
- **Commit:** `862fe84`

**2. [Rule 2 — Соответствие CLAUDE.md] Комментарии в коде без номеров фаз**

- **Found during:** Task 1, написание комментариев к правилам
- **Issue:** план предписывал комментарий с номером фазы; правила проекта запрещают писать метаданные процесса в продуктовый код.
- **Fix:** тот же смысл записан через поведение вариантов, без номера фазы.
- **Files modified:** `src/components/layout/primitives.css`
- **Verification:** `grep -c "фаз" src/components/layout/primitives.css` → 0
- **Commit:** `862fe84`

**Total deviations:** 2 auto-fixed (1 баг в тесте плана, 1 приведение к правилам проекта). **Impact:** на видимый результат не влияют; значения CSS и набор классов ровно те, что в спецификации GLASS-06.

## Assumption Drift (advisory)

**1. Критерий `grep -c "background-clip: text"` даёт 2, а не 1**

- **Found during:** Task 1, сверка критериев приёмки
- **Planned:** критерий требовал вывод 1 с оговоркой «`-webkit-background-clip` считается отдельно».
- **Actual:** `grep -c` считает строки, а строка `-webkit-background-clip: text;` содержит ту же подстроку, поэтому вывод 2.
- **Why:** префиксная форма не отделяется от базовой без якоря. С якорем `grep -cE '^\s*background-clip: text'` вывод 1; инвариант «клип объявлен ровно в одном правиле» выполнен.

**2. Счётчик `prefers-reduced-motion` в `global.css` равен 2**

- **Found during:** Task 1, сверка критериев приёмки
- **Planned:** критерий требовал 1.
- **Actual:** 2 и до правки, и после: строка комментария плюс сама строка `@media`.
- **Why:** в критерии посчитали `@media`-блоки, а не строки. Блок ровно один, `motionPolicy.test.ts` зелёный без правок теста. То же расхождение отмечено в плане 07-01.

## Issues Encountered

`git status --porcelain` показывает `?? node_modules` — симлинк инфраструктуры worktree, `.gitignore` содержит `node_modules/` со слешем и симлинк не покрывает. К результату плана отношения не имеет, файл не коммитился.

## Verification

Гейт плана прогнан в worktree, все команды с кодом 0:

- `npx tsc -b` — код 0
- `npx vitest run src/components/layout src/components/about src/components/involve src/styles/motionPolicy.test.ts` — 11 файлов, 145 тестов, все зелёные
- `npm run lint` — код 0, замечаний нет
- `git diff --name-only 3a055c2 -- src/components/map src/components/form src/components/news src/components/resources src/components/hero src/components/layout/Section.tsx src/styles/tokens.css src/components/involve/Involve.tsx` — пусто
- `git diff --name-only 74ec4d4 HEAD` — только файлы из `files_modified` планов 07-01 и 07-02 плюс `07-01-SUMMARY.md`

Критерии приёмки перепроверены командами: `gradient-title--section-gradient` в `primitives.css` — 2 вхождения, `color: rgb(239 237 245);` — 1, литерал градиента 104deg — 1, `var(--gradient-title)` — 0, `--gradient-title:` в `global.css` — 0, `--gradient-brand:` — 1, тип `"hero" | "section" | "section-gradient"` — 1, `animation: hero-beam 3s linear infinite;` — 2. `grep -rl 'variant="section-gradient"' src --include='*.tsx' | grep -v test` выводит один `src/components/about/About.tsx`; `variant="section"` встречается по одному разу в каждой из шести чужих секций.

Сверка вычисленных стилей в браузере не запускалась: по QA-03 она остаётся фазе 13, а `npm run preview` в этом worktree запрещён. Значения проверены по тексту исходников.

## User Setup Required

None — внешние сервисы не задействованы.

## Next Phase Readiness

- Фаза 7 закрыта: планы 07-01 и 07-02 выполнены, требования GLASS-01…GLASS-06 закрыты.
- Фазам 8–12 ничего доделывать не нужно: их заголовки становятся плоскими без правок их файлов; если чья-то ветка добавит новую секцию, `variant="section"` даст плоский вид автоматически.
- Фазе 13 на сверку: `getComputedStyle('#about-title').backgroundImage` должен быть градиентом 104deg, у `#involve-title`, `#map-title`, `#form-title` и заголовков новостей и ресурсов `color` равен `rgb(239, 237, 245)`, у `#hero-title` градиент 90deg.
- Блокеров нет.

## Self-Check: PASSED

- Все семь файлов из `files_modified` существуют на диске и изменены.
- Коммиты `862fe84` и `fa7b7bf` есть в `git log` ветки `agent-07`.
- Критерии приёмки обеих задач перепроверены командами после правок, гейт плана прогнан целиком.
- Заглушек в изменённых файлах нет; `STATE.md` и `ROADMAP.md` не трогались — их пишет оркестратор.

---
*Phase: 07-glass-and-titles*
*Completed: 2026-09-06*
