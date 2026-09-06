---
phase: 08-map-band-and-lights
plan: 01
subsystem: ui
tags: [map, css, layout, clip-path, playwright, react]

requires:
  - phase: 05-polish-and-deploy
    provides: preview на 4173, чеклист docs/qa/SMOKE.md, порядок замера fps через rAF
  - phase: 02-map-and-lights
    provides: MapSection, EsdMap, 942 огонька, полигон .map-shell
provides:
  - Лента .map-band: одна скошенная подложка rgb(18 12 52) под секциями #map и #light-form
  - Прозрачные .map-section и .lf-section внутри ленты (правила для формы живут в map.css)
  - Нижний орб на кромке карты: top: 100%, translate(38%, -50%), без обрезки формой
  - Карта и огоньки в первом кадре: Reveal вокруг .map-container снят
  - Зонд .planning/phases/08-map-band-and-lights/qa/map-probe.mjs, режимы band и fps
affects: [08-02 огоньки, 09 форма, 13 приёмочный smoke]

tech-stack:
  added: []
  patterns:
    - "Общая подложка двух секций: обёртка .map-band несёт ::before со скосом, секции прозрачны"
    - "Правило для чужого селектора (.lf-section) живёт в CSS своей фазы под префиксом .map-band"
    - "Пиксельная приёмка вёрстки: Playwright-скриншот декодируется через canvas в отдельной вкладке, без внешних зависимостей"

key-files:
  created:
    - src/components/map/MapBand.tsx
    - src/components/map/MapBand.test.tsx
    - .planning/phases/08-map-band-and-lights/qa/map-probe.mjs
  modified:
    - src/App.tsx
    - src/components/map/MapSection.tsx
    - src/components/map/MapSection.test.tsx
    - src/components/map/map.css

key-decisions:
  - "Высота ступеньки скоса меряется по плато с двух сторон окна ±3px, а не по максимуму построчной разницы: наклон 1px на 31px размазывает ступеньку сглаживанием на две строки и занижает построчный максимум вдвое (7.07 против 4.86)"
  - "Зонд поднимался на порту 4181 вместо 4173: в соседних worktree параллельно шли фазы 7 и 9–12"
  - "playwright резолвится из кэша npx MCP (1.63.0-alpha-2026-08-31, Microsoft); package.json не менялся"

patterns-established:
  - "Секции внутри общей ленты не несут ни своей подложки, ни margin-top: обе величины переехали на .map-band"
  - "Орб-«подсветка стыка» якорится на top: 100% родительской секции и центрируется на кромке через translateY(-50%)"

requirements-completed: [MAP-01, MAP-02, MAP-03, MAP-04]

duration: 20 min
completed: 2026-09-06
---

# Phase 8 Plan 01: Лента карты, орбы и зонд MAP-03 Summary

**Карта и форма переехали на одну скошенную подложку `.map-band`: вторая линия на их стыке исчезла (пиксельная выборка даёт `jumps: []` по обеим абсциссам), нижний орб светит из кромки карты в форму, а карта рисуется в первом кадре без reveal-обёртки.**

## Performance

- **Duration:** 20 min
- **Started:** 2026-09-06T08:13:00Z
- **Completed:** 2026-09-06T08:33:00Z
- **Tasks:** 3
- **Files modified:** 7 (3 создано, 4 изменено)

## Accomplishments

- `MapBand.tsx` собрал `#map` и `#light-form` под одну подложку `rgb(18 12 52)` со скосом `polygon(0 var(--map-wedge), 100% 0, 100% 100%, 0 100%)`; правила `.map-band .lf-section { background: transparent }` и `.map-band .lf-section::before { content: none }` гасят непрозрачный фон формы и её собственный орб, не трогая файлы фазы 9.
- Нижний орб переехал на `top: 100%; transform: translate(38%, -50%)`: замер на 1440×900 показывает орб `1320.2 → 2357.0` с центром ровно на `1838.6` — это и низ карты, и низ секции, и верх формы; 518.4px орба светят в область формы, ничем не обрезаясь.
- Reveal вокруг `.map-container` снят: `.map-shell` держит контейнер единственным ребёнком без inline-стилей, `getComputedStyle(.map-container).opacity === "1"` и 942 `.light-core` присутствуют в первом кадре до любой прокрутки. Каскад у `.map-section__header` и счётчиков остался.
- Зонд `map-probe.mjs` доказал MAP-03 пиксельной выборкой и дал базовый fps до смены огоньков (медиана 120.3).

## Task Commits

1. **Task 1: Лента .map-band (MapBand.tsx, App.tsx, MapSection, map.css)** — `094253a` (feat)
2. **Task 2: Тесты ленты (MapBand.test.tsx, MapSection.test.tsx)** — `718f10c` (test)
3. **Task 3: Зонд map-probe.mjs и три прогона** — `3abf92f` (test)

## Files Created/Modified

- `src/components/map/MapBand.tsx` — обёртка `<div class="map-band">` вокруг `<MapSection />` и `<LightForm />`; форму только вызывает
- `src/components/map/MapBand.test.tsx` — структура ленты (порядок `#map` → `#light-form`, один атрибут у обёртки, контейнер карты без inline-стилей) и семь текстовых проверок `map.css`
- `.planning/phases/08-map-band-and-lights/qa/map-probe.mjs` — зонд Playwright, режимы `band` и `fps`
- `src/App.tsx` — `<MapBand />` вместо пары `<MapSection /><LightForm />`
- `src/components/map/MapSection.tsx` — без `.map-section__skew` и без `<Reveal delay={0.1}>` вокруг `.map-container`
- `src/components/map/MapSection.test.tsx` — тест подложки заменён на проверку её отсутствия, добавлена проверка `.map-shell` с единственным ребёнком
- `src/components/map/map.css` — блоки `.map-band`, `.map-band::before`, `.map-band .lf-section(::before)`; из `.map-section` убраны `--map-wedge`, `margin-top` и `overflow-x`; блок `.map-section__skew` удалён; `.map-orb--bottom` перевешен на верхнюю кромку

## Проверки MAP-03 и базовый fps

### Как запустить

```bash
# сборка и preview (порт 4181: 4173 держали соседние worktree фаз 7 и 9–12)
npm run build && node scripts/check-dist.mjs
npx vite preview --port 4181 --strictPort &

# playwright берётся из кэша npx Playwright MCP автоматически:
#   ~/.npm/_npx/9833c18b2d85bc59/node_modules/playwright (1.63.0-alpha-2026-08-31)
# при желании путь задаётся явно: PW_ROOT=<каталог с node_modules/playwright>
P=.planning/phases/08-map-band-and-lights/qa/map-probe.mjs
node $P band --url http://localhost:4181/esd-onevoice27/ --width 1440 --height 900
node $P band --url http://localhost:4181/esd-onevoice27/ --width 390  --height 844
node $P fps  --url http://localhost:4181/esd-onevoice27/ --width 1440 --height 900 --runs 3
```

Браузер: `PW_CHANNEL` (по умолчанию установленный Chrome), `PW_HEADLESS=1` для headless. Все три прогона ниже сделаны в **headed-Chrome** (окно на переднем плане), headless-ветка не потребовалась.

### band, 1440×900 — PASS (код 0)

```
# band | chrome окно | playwright 1.63.0-alpha-2026-08-31 | 1440x900 | reduced: false
{"mode":"band","viewport":{"width":1440,"height":900},"wedge":46.08,
 "shell":{"top":-179.9,"bottom":450.1,"width":1440},
 "firstFrame":{"mapOpaque":true,"mapWithoutInlineStyle":true,"lightsRendered":true,
               "lightsCount":942,"shellWedge":true,"bandBackdrop":true},
 "scans":[{"x":200,"ySkew":443.7,"window":[437,563],"skewStep":7.07,"skewJump":4.86,
           "maxJumpOutsideSkew":0,"jumps":[]},
          {"x":1240,"ySkew":410.4,"window":[404,530],"skewStep":0.09,"skewJump":0,
           "maxJumpOutsideSkew":0.93,"jumps":[]}],
 "scrollWidth":1440,"innerWidth":1440,"noScrollbar":true,
 "strict":true,"cleanBand":true,"skewVisible":true,
 "channel":"chrome","headless":false,"reduced":false}
PASS
```

`jumps` пусты по обеим абсциссам: на отрезке «низ карты + 120px» второй линии нет. `maxJumpOutsideSkew` 0 и 0.93 — на порядок ниже порога 6. Сама кромка скоса на x = 200 даёт ступеньку 7.07 (карта `rgb(26 19 57)` над линией, подложка ленты `rgb(18 12 52)` под ней). На x = 1240 ступеньки нет вовсе (`rgb(30 19 63)` с обеих сторон): там под кромкой пусто, и нижний орб красит обе стороны одинаково — ровно тот бесшовный переход, ради которого фаза и делалась.

### band, 390×844 — PASS (код 0)

```
# band | chrome окно | playwright 1.63.0-alpha-2026-08-31 | 390x844 | reduced: false
{"mode":"band","viewport":{"width":390,"height":844},"wedge":32,
 "shell":{"top":-140.6,"bottom":450.2,"width":390},
 "firstFrame":{"mapOpaque":true,"mapWithoutInlineStyle":true,"lightsRendered":true,
               "lightsCount":942,"shellWedge":true,"bandBackdrop":true},
 "scans":[{"x":20,"ySkew":448.5,"window":[442,568],"skewStep":0,"skewJump":0,
           "maxJumpOutsideSkew":0,"jumps":[]},
          {"x":370,"ySkew":419.8,"window":[413,539],"skewStep":0.02,"skewJump":0.93,
           "maxJumpOutsideSkew":0.93,"jumps":[]}],
 "scrollWidth":390,"innerWidth":390,"noScrollbar":true,
 "strict":false,"cleanBand":true,"skewVisible":false,
 "channel":"chrome","headless":false,"reduced":false}
PASS
```

На узком экране критерий — первый кадр и `scrollWidth`; выборки по x печатаются информативно, обе чистые. Орб-полоса шириной во всю страницу вьюпорт не раздвигает: `scrollWidth` 390 = `innerWidth`.

### fps, 1440×900, 3 прогона — PASS (код 0)

```
# fps | chrome окно | playwright 1.63.0-alpha-2026-08-31 | 1440x900 | reduced: false
{"mode":"fps","viewport":{"width":1440,"height":900},
 "runs":[{"fps":120.2,"maxGapMs":10.3,"frames":241},
         {"fps":120.3,"maxGapMs":10.2,"frames":241},
         {"fps":120.3,"maxGapMs":10.1,"frames":241}],
 "median":120.3,"maxGapMs":10.3,"floor":50,
 "channel":"chrome","headless":false,"reduced":false}
PASS
```

Базовый замер **до** смены огоньков: медиана 120.3 fps, худший интервал между кадрами 10.3 мс, дисплей 120 Гц. План 02 сравнивает с этим числом дыхание `--halo-k`; запас над порогом 50 — 2.4×.

### Якорь нижнего орба: 1440 против 390

Замер `getBoundingClientRect` в координатах документа:

| Вьюпорт | Низ `.map-shell` | Низ `#map` | Орб (верх → низ) | Центр орба |
|---|---|---|---|---|
| 1440×900 | 1838.6 | 1838.6 | 1320.2 → 2357.0 | 1838.6 |
| 390×844 | 2039.7 | 2088.5 | 1828.5 → 2348.5 | 2088.5 |

На ≥768px `.map-hint` абсолютная (`bottom: calc(16px + var(--map-wedge))`, то есть 62.1px над кромкой), секция кончается ровно низом карты, и центр орба ложится на кромку.

**На <768px `.map-hint` становится статической (`margin: 16px auto 0`) и вытягивает `.map-stage`, поэтому нижний край `.map-section` уходит ниже карты на высоту подсказки: 2088.5 против 2039.7, разница 48.8px = 16px отступа + 32.8px подсказки.** Якорь орба — низ секции, значит на мобильном центр полосы стоит на 48.8px ниже низа карты. Для полосы `height: min(clamp(520px, 72vw, 1100px), 135vw)` без резкой границы это незаметно, но это отклонение от десктопной геометрии, и фаза 13 при пиксельной приёмке на 390 должна считать якорем именно низ секции, а не низ карты.

Форма внутри ленты действительно прозрачна: `getComputedStyle(#light-form).backgroundColor` = `rgba(0, 0, 0, 0)`, `::before` content = `none` на обоих вьюпортах.

## Проверки кода

| Команда | Результат |
|---|---|
| `npx tsc -b` | код 0 |
| `npm run lint` | код 0 |
| `npx vitest run src/components/map src/App.test.tsx src/styles/motionPolicy.test.ts` | 7 файлов, 91 тест, все passed; предупреждений `act` и `console.error` в выводе нет |
| `npm run build` | код 0, без предупреждений о размере чанков (самый большой чанк 385.0 КБ при пороге 500) |
| `node scripts/check-dist.mjs` | 11 проверок, все OK |
| `git status --porcelain` | только файлы из `files_modified` плана |

## Decisions Made

- **Ступенька скоса меряется по плато, а не по соседним строкам.** Линия скоса наклонена на 1px каждые 31px, сглаживание Chrome размазывает её на две строки: полная ступенька 7.07 распадается на 4.85 и 2.22, и построчный максимум не проходит порог 6, хотя кромка видна. Зонд теперь печатает обе величины: `skewStep` (разница средних по плато выше и ниже окна ±3px) и `skewJump` (прежний построчный максимум). Критерий «скос виден» опирается на `skewStep`. Критерий MAP-03 (`jumps` вне окна) остался построчным, как в спецификации.
- **Порт preview 4181 вместо 4173.** Соседние worktree фаз 7 и 9–12 работают одновременно; порт вынесен во флаг `--url`, фаза 13 подставит свой.
- **`z-index` орбов не менялся.** Внутри изолированного контекста `.map-section` их `z-index: -1` уже даёт нужный порядок: выше `.map-band::before` (он уходит под всех детей ленты) и ниже `.map-section::before`, `.map-section__inner` и `.map-stage`. Соображение записано комментарием у `.map-orb`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] playwright из кэша npx не отдавал `chromium` при ESM-импорте**

- **Found during:** Task 3 (первый прогон зонда)
- **Issue:** Пакет `playwright` — CommonJS; при `await import(pathToFileURL(entry))` его объект приезжает в `default`, а `api.chromium` оказывается `undefined`. Зонд падал с «Браузер не запустился: Cannot read properties of undefined (reading 'launch')» на всех трёх попытках запуска.
- **Fix:** Добавлен `unwrap(mod) => mod?.chromium ? mod : mod?.default` и проверка `api?.chromium` перед тем, как считать кандидата годным: кандидат без рабочего API теперь пропускается, а не роняет прогон.
- **Files modified:** `.planning/phases/08-map-band-and-lights/qa/map-probe.mjs`
- **Verification:** три прогона зонда стартуют и печатают PASS; в шапке видно, какой файл `playwright` подхвачен
- **Committed in:** `3abf92f`

**2. [Rule 1 - Bug] Критерий «скос виден» ловил сглаживание вместо ступеньки**

- **Found during:** Task 3 (band на 1440×900: `jumps` пусты, но `skewJump` 4.86 и 0 → FAIL)
- **Issue:** План задал «перепад на самой линии, ожидается > 6» как максимум построчной разницы. Кромка скоса наклонена и сглажена, ступенька 7.07 распадается на две строки (4.85 + 2.22), и верный результат помечался как провал.
- **Fix:** Добавлен `skewStep` — разница средних яркостей плато выше и ниже окна ±3px (12 строк снизу, чтобы не захватить дальний градиент орба); PASS опирается на него, `skewJump` остался в JSON для диагностики.
- **Files modified:** `.planning/phases/08-map-band-and-lights/qa/map-probe.mjs`
- **Verification:** прогон на 1440×900 даёт `skewStep: 7.07` при `skewJump: 4.86`; пиксельная выборка вручную подтвердила плато `23.23` над кромкой и `16.16` под ней
- **Committed in:** `3abf92f`

**3. [Rule 3 - Blocking] Порт preview 4173 → 4181**

- **Found during:** Task 3 (подъём preview)
- **Issue:** План фиксировал 4173, но фаза идёт параллельно с фазами 7 и 9–12 в соседних worktree, и порт занят.
- **Fix:** Прогоны сделаны на 4181 через флаг `--url`; в самом зонде дефолт остался 4173, как в SMOKE.md.
- **Files modified:** нет (флаг командной строки)
- **Verification:** `curl` на `http://localhost:4181/esd-onevoice27/` вернул 200, после прогонов процесс остановлен
- **Committed in:** —

---

**Total deviations:** 3 auto-fixed (2 блокирующих, 1 баг измерения)
**Impact on plan:** Все три касаются только зонда: вёрстка и компоненты сделаны ровно по плану. Расширения объёма нет.

## Assumption Drift (advisory)

**1. Кромка скоса видна не по всей ширине карты**

- **Found during:** Task 3
- **Planned:** MAP-03 в спецификации говорит «единственная видимая граница — скос карты поверх подложки ленты», и план ждал перепад > 6 на самой линии.
- **Actual:** На 1440×900 кромка читается только там, где под ней лежит суша: на x = 200 ступенька 7.07, на x = 1240 ровно 0 — цвет с обеих сторон `rgb(30 19 63)`.
- **Why:** У оригинала полотно карты — почти чёрное `rgb(4 3 18)` (см. `docs/research/v1.1/orig-map-bottom.jpeg`, скос читается по всей ширине), а у нас SVG прозрачный, и вне стран сквозь него видна та же подложка ленты `rgb(18 12 52)`. Плюс нижний орб красит обе стороны кромки одинаково.
- Для MAP-03 это в плюс (бесшовный стык), но если фаза 13 захочет видеть скос по всей ширине, как в оригинале, полотну карты понадобится собственный тёмный фон. В объём фазы 8 это не входит.

## Issues Encountered

Ничего сверх трёх отклонений выше. Заметка для соседних агентов: `node_modules` в worktree — симлинк, а `.gitignore` содержит `node_modules/` со слешем и симлинк не покрывает, поэтому он висит в `git status` как untracked. Файлы стадились поимённо, в коммиты симлинк не попал.

## User Setup Required

None — внешние сервисы не нужны, зонд работает по localhost.

## Next Phase Readiness

- План 08-02 (огоньки) может начинать: базовый fps 120.3 замерен тем же зондом, сравнивать есть с чем. Файлы плана 02 (`EsdMap.tsx`, `map.css` в части огоньков) этим планом не тронуты, кроме удаления `--map-wedge` из `.map-section` и добавления блоков ленты выше по файлу.
- Фаза 9 при уборке `background: rgb(18 12 52)` и `.lf-section::before` из `light-form.css` не сломает ленту: правила `.map-band .lf-section` после слияния станут no-op.
- Фаза 13 берёт команды из раздела «Проверки MAP-03 и базовый fps» как есть, поменяв только порт в `--url`.
- Открытый вопрос для приёмки на 390: якорь нижнего орба — низ `.map-section`, а он на 48.8px ниже низа карты из-за статической `.map-hint`.

## Self-Check: PASSED

---
*Phase: 08-map-band-and-lights*
*Completed: 2026-09-06*
