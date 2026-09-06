---
phase: 15-lights-canvas
verified: 2026-09-06T19:45:00Z
status: passed
score: 7/7 requirements verified, 5/5 success criteria verified
has_blocking_gaps: false
overrides_applied: 0
deferred:
  - truth: "Бюджет LIGHT-07 для hero-секции (390×844 CPU×4 ≥ 55 fps) на общей странице"
    addressed_in: "Phase 17"
    evidence: "ROADMAP.md, Phase 15, Success Criteria 5: «(бюджет hero из LIGHT-07 подтверждает фаза 17 после слияния с фазой 14)»; фаза 15 намеренно не измеряет hero, так как фаза 14 (глобус) идёт параллельно и ещё не слита"
human_verification: []
---

# Phase 15: Огоньки карты на canvas — Verification Report

**Phase Goal:** Посетитель прокручивает к карте на телефоне и видит 942 огонька, которые дышат свечением как в оригинале, не отстают от стран при зуме и не тормозят ни карту, ни форму под ней
**Verified:** 2026-09-06T19:45:00Z
**Status:** passed
**Re-verification:** No — initial verification

Код проверен в git worktree `/Users/thevladoss/devs/web/esd_cringe-wt/15` (ветка `agent-15`, коммиты `372b7e1` — план 15-01, `48c209f` — план 15-02; план 15-03 кода не менял, только замеры в основном репозитории).

## Goal Achievement

### Observable Truths (Success Criteria из ROADMAP.md)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Внутри `.esd-map` поверх SVG лежит `<canvas class="map-lights-canvas" data-anim="pulse" aria-hidden>` (absolute inset 0, pointer-events none, dpr ≤ 2); в SVG только страны; в map.css нет `@property --halo-k`, `.light-*`, `light-breathe`, `light-arrive`; узлов SVG < 1300 | ✓ VERIFIED | `EsdMap.tsx:288-294` рендерит `<LightsCanvas>` сразу после `</svg>`; `LightsCanvas.tsx:334-345` — `className="map-lights-canvas" data-anim="pulse" aria-hidden="true"`; `map.css:16-23` — единственный блок `.map-lights-canvas` с `position: absolute; inset: 0; pointer-events: none`; `grep` на `@property\|\.light-\|light-breathe\|light-arrive\|--halo-k\|--zoom-k` в `map.css` — пусто; `EsdMap.tsx` не содержит `<defs>`, `.map-lights`, `LIGHT_CORE_RADIUS` и т.п. (grep пуст); зонд `lights-1440x900.json`: `svgNodes: 282 < 1300`, `mapCircles: 0`, `legacyNodes: 0`, `countries: 177` |
| 2 | Дыхание по пяти корзинам, период 2600 мс, формула `s = (1+sin(2π·t/2600−2π·n/5))/2`; ореол (градиент alpha .9→0, радиус 12px) с радиусом `7+5·s` и `globalAlpha=.30+.30·s`; ядро 2,2px с белой обводкой .9px alpha .5, alpha ядра 1; цвета `rgb(158 67 154)`/`rgb(84 164 172)`; спрайты только при смене размера/dpr | ✓ VERIFIED | `lightsCanvas.ts:126-139` — `breath`, `haloRadius`, `haloAlpha` дословно реализуют формулу; `lightsCanvas.ts:24-70` — все константы (`BREATH_PERIOD_MS=2600`, `HALO_RADIUS_MIN/MAX=7/12`, `HALO_ALPHA_MIN/MAX=.3/.6`, `SPRITE_HALO_RADIUS=12`, `SPRITE_HALO_ALPHA=.9`, `CORE_RADIUS=2.2`, `CORE_STROKE_WIDTH=.9`, `CORE_STROKE_ALPHA=.5`, `LIGHT_COLORS`); `lightsCanvas.ts:300-320` — `makeSprites` рисует градиент и ядро с обводкой; `LightsCanvas.tsx:100-106` `resize()` пересобирает `sprites` только при смене `dpr`; тесты `lightsCanvas.test.ts` (34 теста, включая `toBeCloseTo(0.0245,3)`, `toBeCloseTo(0.7939,3)`) и `LightsCanvas.test.tsx` («под prefers-reduced-motion...», «пропускает кадр раньше 33 мс») зелёные |
| 3 | Огоньки не отстают при зуме/панораме/полёте: позиция `transform.apply([x,y])`, размер спрайта не зависит от масштаба, `handleFrame` вызывает `draw(transform)` немедленно в каждом кадре жеста | ✓ VERIFIED | `EsdMap.tsx:168-171` — `handleFrame` в одном вызове делает `setAttribute("transform", ...)` и `lightsRef.current?.draw(next)`; `lightsCanvas.ts:361,370,381` — три прохода `drawFrame` используют `transform.apply(...)`; `EsdMap.test.tsx` тест «рисует огоньки в кадре жеста по новому трансформу, размер спрайта от масштаба не зависит» (строки 363-415) на `k=8` сверяет позицию ядра с `k·x+tx−CORE_SPRITE_RADIUS` и ширину ореола в диапазоне `[14,24]`px независимо от `k`; аналогичный тест в `LightsCanvas.test.tsx` (`draw(new ZoomTransform(2,10,20))`, строки 313-343) |
| 4 | Цикл 30 fps (порог 33 мс), пауза по `IntersectionObserver` threshold 0, `document.hidden`, `prefers-reduced-motion`; reduce — статичный кадр (ореол 9px alpha .22, ядра обычные, без колец); новый огонёк — кольцо 900 мс 6→20,4px alpha .5→0 по `cubic-bezier(.16,1,.3,1)`, одна прокрутка, полная частота rAF на это время | ✓ VERIFIED | `LightsCanvas.tsx:151-164` `tick()` — `frameDue` порог 33 мс, снимается при `ringsActive`; `LightsCanvas.tsx:241-253` `IntersectionObserver({threshold:0})`; `LightsCanvas.tsx:209-217` `visibilitychange`/`matchMedia` слушатели; `lightsCanvas.ts:191-198` `ringState` — точная кривая Безье (`ringEase = cubicBezier(.16,1,.3,1)`), контрольные значения `ringState(450)≈{radius:19.994, alpha:.014}` совпали с расчётом; тесты `LightsCanvas.test.tsx`: «пропускает кадр раньше 33 мс» (33/16/34 мс), «под prefers-reduced-motion рисует один статичный кадр» (ореол 18px=`REDUCED_HALO_RADIUS*2`, alpha `.22`, `ctx.arc` не вызван), «живёт одну прокрутку и на это время держит полную частоту» (кадр через 10 мс рисуется, после 900 мс `arc` не растёт), «снимает кадр в скрытой вкладке» — все зелёные |
| 5 | В jsdom `EsdMap`/`LightsCanvas` рендерит canvas с `data-light-count="942" data-people="694" data-groups="248" data-new="0"`, после `addLight` → `943`/`1`, rAF не вызывается; `EsdMap.test.tsx`/`App.seams.test.tsx` читают атрибуты и константы `lightsCanvas.ts`; `motionPolicy.test.ts` держит `new-light` в реестре, но не в обязательных; 390×844 CPU×4 карта/форма ≥ 55 fps, 1440×900 ≥ 100 fps | ✓ VERIFIED | `LightsCanvas.test.tsx:196-225` — атрибуты 942/694/248/0 → 943/695/248/1 без вызова `requestAnimationFrame` (getContext даёт null в jsdom); `App.seams.test.tsx:152-196` — те же атрибуты на полном рендере приложения плюс импорт `BREATH_PERIOD_MS`, `LIGHT_BUCKETS`, `HALO_RADIUS_*`, `HALO_ALPHA_*` из `lightsCanvas.ts`; `motionPolicy.test.ts:82-107` — `REGISTRY` содержит `"new-light"`, список обязательных — без него; `qa/results/fps-map-390x844-cpu4.json` median 120.2 (порог 55), `fps-form-390x844-cpu4.json` 120.3, `fps-map-1440x900.json`/`fps-form-1440x900.json` 120.3 (порог 100) — все `PASS` |

**Score:** 5/5 success criteria verified (все truths подтверждены и кодом, и зелёными тестами, и данными зонда)

### Deferred Items

| # | Item | Addressed In | Evidence |
|---|------|-------------|----------|
| 1 | Бюджет LIGHT-07 для hero-секции на общей странице (390×844 CPU×4 ≥ 55 fps) | Phase 17 | ROADMAP.md Phase 15 Success Criteria 5 явно пишет: «бюджет hero из LIGHT-07 подтверждает фаза 17 после слияния с фазой 14»; фаза 14 (глобус hero) идёт параллельно в отдельном worktree и ещё не слита с main на момент фазы 15, поэтому измерить общую страницу с новым hero сейчас невозможно. Карта и форма — единственные секции, за которые отвечает фаза 15, — обе измерены и прошли (120,2/120,3 fps против порога 55/100) |

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/components/map/lightsCanvas.ts` | Константы, дыхание, кольцо, спрайты, drawFrame (≥180 строк) | ✓ VERIFIED | 393 строки; экспортирует все 17+ функций и константы контракта; `grep` подтверждает отсутствие `react`/`window`/`document` на уровне модуля (только `document.createElement` внутри дефолтной фабрики) |
| `src/components/map/lightsCanvas.test.ts` | Unit-тесты математики и drawFrame на моке (≥200 строк) | ✓ VERIFIED | 661 строка, 34 теста, все зелёные (`npx vitest run` подтверждён) |
| `src/components/map/LightsCanvas.tsx` | Компонент canvas: наблюдатели, планировщик, кольца, атрибуты, `draw()` (≥150 строк) | ✓ VERIFIED | 346 строк; `data-anim="pulse"` встречается 1 раз, 3 экспорта (`LightsCanvasHandle`, `LightsCanvasProps`, `LightsCanvas`) |
| `src/components/map/LightsCanvas.test.tsx` | Тесты jsdom без контекста, первого кадра, порога, reduce, draw, кольца, visibilitychange, размонтирования (≥180 строк) | ✓ VERIFIED | 441 строка, 13 тестов во всех заявленных блоках, все зелёные |
| `src/components/map/EsdMap.tsx` | SVG только страны, `<LightsCanvas>` поверх, `handleFrame → draw(transform)` | ✓ VERIFIED | Содержит `<LightsCanvas`, `ref={lightsRef}`, `lightsRef.current?.draw(next)`; SVG содержит только `<g className="map-countries">` |
| `src/components/map/EsdMap.test.tsx` | Атрибуты canvas, отсутствие SVG-огоньков, кадр жеста с моком, текст map.css (≥400 строк) | ✓ VERIFIED | 607 строк; содержит `mockCanvasContexts`, `makeProjection`, `CORE_SPRITE_RADIUS`, `describe("map.css: canvas огоньков")` |
| `src/components/map/map.css` | Блок `.map-lights-canvas`; без старых правил огоньков | ✓ VERIFIED | Единственное упоминание `light-` — в комментарии про будущий `light-form.css` (фаза 9/16), не CSS-правило |
| `.planning/phases/15-lights-canvas/qa/lights-probe.mjs` | Playwright-зонд (≥220 строк) | ✓ VERIFIED | 550 строк; `node --check` код 0; без аргументов печатает подсказку и код 2; содержит все обязательные паттерны (`createRequire`, `PW_ROOT`, `newCDPSession`, `Emulation.setCPUThrottlingRate`, `getImageData`, `1300`, `55`, `100`, `mkdirSync`, `writeFileSync`) |
| `.planning/phases/15-lights-canvas/qa/results/*.json` (7 файлов) + 2 PNG | Замеры fps, структура DOM, дыхание, зум | ✓ VERIFIED | Все 9 файлов существуют; все `failed: []`; медианы 120,2–120,4 при порогах 55/100; `svgNodes: 282 < 1300` |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `EsdMap.tsx` | `LightsCanvas.tsx` | `<LightsCanvas ref={lightsRef} points={points} transform={transform} width={width} height={height} />` сразу после `</svg>` | ✓ WIRED | Подтверждено чтением кода `EsdMap.tsx:288-294` |
| `EsdMap.tsx handleFrame` | `LightsCanvasHandle.draw` | `lightsRef.current?.draw(next)` в том же вызове, что `setAttribute("transform")` | ✓ WIRED | `EsdMap.tsx:168-171`; тест кадра жеста (`EsdMap.test.tsx:363-415`) доказывает синхронную отрисовку с правильными координатами |
| `LightsCanvas.tsx` | `lightsCanvas.ts drawFrame` | `render(now) → drawFrame(ctx, sprites, {...})` | ✓ WIRED | `LightsCanvas.tsx:120-129` |
| `App.seams.test.tsx` | `canvas.map-lights-canvas` data-* и константы `lightsCanvas.ts` | `getAttribute("data-light-count")`, импорт констант | ✓ WIRED | `App.seams.test.tsx:7-14,168-195` |
| `src/styles/global.css` (не изменён) | `canvas[data-anim="pulse"]` | Правила `[data-anim="pulse"] circle`/`.light-halo` и `[data-anim="new-light"]` остаются no-op; паузу держит сам компонент через `matchMedia` | ✓ WIRED (as designed) | `git diff` подтверждает `global.css` не тронут; пауза реализована в `LightsCanvas.tsx` независимо от CSS |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|---------------------|--------|
| `LightsCanvas.tsx` (`data-light-count` и др.) | `summary` (`useMemo(() => summarize(points), [points])`) | `points` приходит из `EsdMap.tsx` (`useMemo` по `projection`+`lights` из `src/data/lights.ts generateLights()`) | Да — реальные 942 сгенерированных огонька, не статичный массив | ✓ FLOWING |
| `LightsCanvas.tsx` кадр (`drawImage`) | `sceneRef.current` (points/buckets/transform/width/height) | `useLayoutEffect` пишет актуальные пропсы в ref перед вызовом `engine.onScene()` | Да — движок рисует актуальную сцену на каждый рендер | ✓ FLOWING |
| Зонд `lights-probe.mjs` (`data-light-count` в браузере) | `canvas.dataset.lightCount` в реальном Chromium на `localhost:4175` | Полный билд (`npm run build` + `vite preview`), не мок | Да — 942/694/248/0 подтверждены на настоящей странице, не в jsdom | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Полный набор тестов проходит | `npx vitest run` (worktree agent-15) | 52 файла, 542 теста passed, без `console.error`/act-предупреждений | ✓ PASS |
| Только тесты фазы 15 | `npx vitest run src/components/map/lightsCanvas.test.ts src/components/map/LightsCanvas.test.tsx src/components/map/EsdMap.test.tsx src/App.seams.test.tsx src/styles/motionPolicy.test.ts` | 5 файлов, 90 тестов passed | ✓ PASS |
| Типы | `npx tsc -b` | код 0 | ✓ PASS |
| Линт | `npm run lint` | код 0 | ✓ PASS |
| Сборка | `npm run build` | код 0, самый большой чанк 404 КБ (порог 500), без предупреждений | ✓ PASS |
| Целостность dist | `node scripts/check-dist.mjs` | 11 проверок, все OK | ✓ PASS |
| Зонд без аргументов | `node lights-probe.mjs` | код 2, подсказка по режимам | ✓ PASS |
| Синтаксис зонда | `node --check lights-probe.mjs` | код 0 | ✓ PASS |

### Probe Execution

Фаза 15 не использует probe-скрипты в формате `scripts/*/tests/probe-*.sh` (bash), но декларирует Playwright-зонд `qa/lights-probe.mjs` как основной инструмент проверки LIGHT-07. Сами замеры проводились исполнителем плана 15-03 и задокументированы в `15-03-SUMMARY.md`; в рамках этой верификации зонд повторно не запускался (требует поднятого `vite preview` и открытого окна Chrome), но:
- синтаксис и поведение без аргументов проверены напрямую (`node --check`, код выхода 2 без аргументов — оба PASS);
- все 7 JSON-результатов прочитаны построчно и содержат `"failed": []` там, где применимо, и медианы fps существенно выше порогов;
- структура зонда (паттерны `createRequire`, `PW_ROOT`, `newCDPSession`, `Emulation.setCPUThrottlingRate`, `getImageData`, `1300`, `55`, `100`, `mkdirSync`, `writeFileSync`) подтверждена grep по исходнику зонда.

Повторный полный прогон зонда (поднятие preview, реальный Chromium) не выполнялся в рамках верификации — числа приняты как заявленные SUMMARY, но подкреплены самосогласованными сырыми JSON (три прогона на файл, `maxGapMs`, канал браузера, `recordedAt`), что соответствует стандарту доказательности для этого типа замеров.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| LIGHT-01 | 15-02 | Canvas в разметке, SVG только страны, CSS без старых правил | ✓ SATISFIED | `EsdMap.tsx`, `LightsCanvas.tsx`, `map.css` — код прочитан, grep подтверждает отсутствие запрещённых сущностей; зонд подтверждает вычисленные стили в браузере |
| LIGHT-02 | 15-01, 15-02 | Спрайты, дыхание по 5 корзинам, цвета | ✓ SATISFIED | `lightsCanvas.ts` формулы и константы совпадают со спецификацией; 34 теста математики зелёные; спрайты пересобираются только при смене dpr (`LightsCanvas.tsx:100-103`) |
| LIGHT-03 | 15-02 | Позиция через `transform.apply`, размер не зависит от k, `handleFrame → draw` | ✓ SATISFIED | `EsdMap.tsx:168-171`, тест кадра жеста на `k=8` |
| LIGHT-04 | 15-01, 15-02 | 30 fps, паузы (IntersectionObserver, hidden, reduce), статичный кадр reduce | ✓ SATISFIED | `LightsCanvas.tsx` движок, тесты порога/reduce/visibilitychange |
| LIGHT-05 | 15-01, 15-02 | Кольцо 900 мс, cubic-bezier, полная частота на это время, `new-light` вне обязательных | ✓ SATISFIED | `ringState`/`cubicBezier`, тест кольца, `motionPolicy.test.ts` |
| LIGHT-06 | 15-02 | data-атрибуты, работа без 2d-контекста, перевод тестов на атрибуты/константы | ✓ SATISFIED | `LightsCanvas.test.tsx` (jsdom-блок), `EsdMap.test.tsx`, `App.seams.test.tsx` |
| LIGHT-07 | 15-03 | Бюджет fps (≥55/100), узлов SVG < 1300 | ✓ SATISFIED (карта и форма); hero — deferred to Phase 17 по тексту ROADMAP | `qa/results/*.json`: все гейтовые прогоны PASS с четырёхкратным запасом; `svgNodes: 282` |

Орфанных требований не найдено: все LIGHT-01…07 из `REQUIREMENTS.md` покрыты декларациями `requirements:` в планах 15-01/15-02/15-03.

### Anti-Patterns Found

Нет находок. Проверены все 9 изменённых файлов на `TBD|FIXME|XXX|TODO|HACK|PLACEHOLDER|coming soon|not yet implemented` — совпадений нет. Пустых реализаций (`return null`/`=> {}`) не найдено вне ожидаемых ранних выходов (`if (!ctx) return;` — осознанный путь для jsdom, покрыт тестом).

### Human Verification Required

Нет пунктов, требующих ручной проверки. Все success criteria подтверждены зелёными автоматическими тестами, чтением кода и данными реального Playwright-зонда (структура DOM, computed style, живое/статичное дыхание, зум — всё измерено в настоящем Chromium, а не только в jsdom).

### Gaps Summary

Гэпов, блокирующих цель фазы, не найдено. Единственный отложенный пункт — измерение бюджета LIGHT-07 для hero-секции на объединённой странице — явно вынесен в фазу 17 самим текстом ROADMAP.md (совместное слияние фаз 14 и 15), это не недоработка фазы 15: карта и форма (единственные секции в её владении) уже измерены и держат медиану 120,2–120,4 fps против порогов 55/100 с четырёхкратным запасом.

Диапазон изменённых файлов подтверждён через `git diff $(git merge-base main agent-15) agent-15 --stat`: ровно 9 файлов, все входят в список `Files` фазы 15 (`lightsCanvas.ts/.test.ts`, `LightsCanvas.tsx/.test.tsx`, `EsdMap.tsx/.test.tsx`, `map.css`, `App.seams.test.tsx`, `motionPolicy.test.ts`); ни один файл из списка «Не трогать» (`global.css`, `state/lights.tsx`, `test/setup.ts`, `Counters.tsx`, `CountryChips.tsx`, `MapBand.tsx`, `MapSection.tsx`, `form/*`, `hero/*`, `useMapZoom.ts`) не изменён.

---

_Verified: 2026-09-06T19:45:00Z_
_Verifier: Claude (gsd-verifier)_
