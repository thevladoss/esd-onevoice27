---
phase: 15-lights-canvas
plan: 02
subsystem: ui
tags: [map, canvas, react, lights, tests]

requires:
  - phase: 15-lights-canvas
    provides: lightsCanvas.ts — константы, дыхание корзин, спрайты, drawFrame, типы кадра
  - phase: 02-map-and-lights
    provides: EsdMap с проекцией, useMapZoom с onFrame, LightsProvider с isNew
provides:
  - LightsCanvas.tsx — холст огоньков с наблюдателями, планировщиком 30 fps, кольцами и data-атрибутами
  - Императивный draw(transform) из handleFrame — огоньки в том же кадре жеста, что и страны
  - SVG карты только со странами — 180 узлов внутри карты вместо 3020
  - map.css без правил огоньков; .map-lights-canvas поверх SVG
  - EsdMap.test.tsx, App.seams.test.tsx, motionPolicy.test.ts на атрибутах холста и константах модуля
affects: [15-03 зонд fps, 17 общая ревизия no-op селекторов global.css]

tech-stack:
  added: []
  patterns:
    - "Движок в замыкании вместо состояния React: подписки, спрайты и планировщик живут в createEngine, компонент держит только ref и разметку"
    - "Сцена через ref в useLayoutEffect: рендер React бывает отброшен, а кадр уже был бы нарисован"
    - "Сравнение ссылки на transform вместо значения: та же ссылка значит промежуточный рендер посреди жеста, и кадр жеста не откатывается"
    - "Свой мок-контекст каждому холсту: спрайты рисуются в offscreen, кадр — в основном, и вызовы не смешиваются"

key-files:
  created:
    - src/components/map/LightsCanvas.tsx
    - src/components/map/LightsCanvas.test.tsx
  modified:
    - src/components/map/EsdMap.tsx
    - src/components/map/EsdMap.test.tsx
    - src/components/map/map.css
    - src/App.seams.test.tsx
    - src/styles/motionPolicy.test.ts

key-decisions:
  - "Кольца хранятся по id огонька, а не по ссылке на точку: массив точек пересобирается на каждой смене проекции, ссылка протухает за один ресайз"
  - "inView стартует с false, когда IntersectionObserver есть: браузер шлёт первую запись сразу после observe, а карта вне экрана не начинает дышать до прокрутки"
  - "Под reduce первый кадр рисуется дважды (render движка и статичный кадр sync): пара лишних проходов при монтировании дешевле ветвления в планировщике"
  - "mockReducedMotion в тестах подменяет matchMedia присваиванием: vi.spyOn поверх мока setup.ts возвращает тот же мок, и restoreAllMocks оставляет reduce включённым для остальных тестов файла"

patterns-established:
  - "Компонент canvas поверх SVG: логическая сетка равна viewBox, позиция точки — transform.apply, CSS-размер задаёт inset: 0"
  - "Тест читает снимки drawImage последнего кадра: границы кадров ловятся моком clearRect"

requirements-completed: [LIGHT-01, LIGHT-03, LIGHT-04, LIGHT-05, LIGHT-06]

duration: 22 min
completed: 2026-09-06
---

# Phase 15 Plan 02: Холст огоньков в карте Summary

**942 огонька переехали из SVG на `<canvas class="map-lights-canvas">` поверх карты: 1884 круга, пять корзин и два градиента `<defs>` исчезли из разметки, кадр жеста приходит императивным `draw(transform)`, а дыхание идёт на 30 fps с паузами вне экрана, в скрытой вкладке и под бережным движением.**

## Performance

- **Duration:** 22 min
- **Started:** 2026-09-06T15:57:00Z
- **Completed:** 2026-09-06T16:19:00Z
- **Tasks:** 3 (первая по TDD: 9 тестов красными, потом компонент)
- **Files modified:** 7 (создано 2, изменено 5)

## Accomplishments

- `LightsCanvas.tsx` держит холст и движок кадра. Компонент остаётся тонким: два `useMemo` (корзины и сводка), сцена в ref через `useLayoutEffect`, mount-эффект с `getContext("2d")` и `useImperativeHandle`. Всё остальное — подписки, спрайты, планировщик, кольца — живёт в замыкании `createEngine`, поэтому ни один кадр не проходит через состояние React.
- Кадр жеста и полёта рисуется синхронно. `handleFrame` пишет атрибут `transform` вьюпорту и тем же вызовом зовёт `lightsRef.current?.draw(next)`; порог 30 fps на этот путь не действует, иначе огоньки отставали бы от стран на треть секунды жеста.
- Цикл дыхания стоит там, где должен: вне экрана (`IntersectionObserver`, threshold 0), в скрытой вкладке (`visibilitychange`), под `prefers-reduced-motion` (`matchMedia`). Под reduce рисуется один статичный кадр — ореол 18px шириной с alpha .22, ядра обычные, колец нет. Кольцо нового огонька живёт 900 мс и на это время снимает порог: 10 мс между кадрами проходят, 33 мс после его конца — нет.
- В jsdom компонент ведёт себя тихо: `getContext` отдаёт null, движок не создаётся, подписок и `requestAnimationFrame` нет, а `data-light-count`, `data-people`, `data-groups` и `data-new` стоят и обновляются, потому что объявлены разметкой.
- Число узлов SVG на странице упало с 3109 (замер прода, `docs/research/v1.2/measurements.md`) до 282, из них 180 внутри карты: 177 стран, две группы и `<title>`. Порог LIGHT-07 в 1300 узлов взят с запасом в четыре с половиной раза.

## Task Commits

Коммитов исполнитель не делал: ветка `agent-15` в worktree, слияние за оркестратором.

1. **Task 1: LightsCanvas.tsx и LightsCanvas.test.tsx (TDD: 9 тестов красными, потом компонент)**
2. **Task 2: EsdMap.tsx без огоньков SVG, map.css без их правил, перевод EsdMap.test.tsx**
3. **Task 3: блок карты в App.seams.test.tsx, список обязательных значений в motionPolicy.test.ts, полный гейт**

## Что удалено из SVG

| Узел | Было | Стало |
|---|---|---|
| `<defs>` с двумя `radialGradient` и четырьмя `<stop>` | 7 узлов | нет |
| `g.map-lights` с пятью `g.light-bucket` | 6 узлов | нет |
| `circle.light-halo` | 942 | нет |
| `g.light-cores` с `g.light` и `circle.light-core` | 1885 узлов | нет |
| `circle.light-ring[data-anim="new-light"]` у нового огонька | 1 на огонёк | нет, кольцо рисует холст |
| `style` с `--zoom-k`, `--light-core-r`, `--light-halo-r` на `g.map-viewport` | атрибут | нет |

Внутри `.esd-map` осталось: `<svg>` с `<title>`, `g.map-viewport` и `g.map-countries` со 177 путями, затем `<canvas class="map-lights-canvas">` и скрытый абзац описания.

## Что удалено из map.css

- `@property --halo-k` с комментарием о fallback MAP-06 (12 строк).
- Блок огоньков целиком (103 строки): `.light--person`, `.light--group`, `.light-halo-def--person`, `.light-halo-def--group`, `.light-core`, `.light-halo`, `.light-ring`, `.light-bucket` с четырьмя отрицательными задержками, `@keyframes light-breathe`, `.light.is-new .light-ring`, `@keyframes light-arrive`.
- Алиасы `--light-person` и `--light-group` в `.map-section`: цвета живут в `LIGHT_RGB` и `LIGHT_COLORS` модуля, счётчики и раньше стояли на литералах.

Добавлен один блок с комментарием на русском:

```css
.map-lights-canvas {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
```

`prefers-reduced-motion` в файле по-прежнему нет: паузу цикла держит сам компонент.

## Как устроен движок LightsCanvas

| Метод | Что делает |
|---|---|
| `resize()` | битмап под размер сцены и `clampDpr(devicePixelRatio)`; ранний выход, если ширина, высота и dpr не изменились; `setTransform(dpr, 0, 0, dpr, 0, 0)` после смены размера; спрайты пересобираются только при смене dpr |
| `collect()` | указатель `id → точка` и кольца для огоньков, которых движок ещё не видел (`seen`) |
| `render(now)` | собирает живые кольца по id и зовёт `drawFrame`; запоминает `ringsActive` и `lastAt`; выбрасывает отыгравшие кольца |
| `tick(now)` | пропускает кадр раньше 33 мс, пока не идёт кольцо; иначе рисует и перепланирует |
| `sync()` | заводит или снимает rAF по `shouldAnimate`; на паузе рвёт отсчёт, под reduce рисует статичный кадр |
| `onScene()` | принимает новое состояние камеры (по смене ссылки), размер, точки; рисует кадр сразу и синхронизирует цикл |
| `draw(next)` | кадр жеста мимо порога |
| `dispose()` | снимает rAF, отключает оба наблюдателя и три слушателя (`visibilitychange`, reduce, dpr) |

Слушатель dpr (`matchMedia("(resolution: Ndppx)")`) перевешивается на новую плотность и пересобирает спрайты, когда окно переносят между экранами. План оставлял его на усмотрение исполнителя.

## Изменения тестов

| Файл | Было | Стало |
|---|---|---|
| `LightsCanvas.test.tsx` | — | 9 тестов: атрибуты без контекста, первый кадр и цикл после `enterViewport`, порог 33 мс, статичный кадр reduce, `draw(new ZoomTransform(2, 10, 20))`, кольцо в трёх точках времени, `visibilitychange`, размонтирование |
| `EsdMap.test.tsx` | 30 тестов, из них шесть про круги огоньков | 29 тестов: три переписаны на атрибуты холста, два — на снимки `drawImage`, тест радиального градиента удалён (спрайты покрыты `lightsCanvas.test.ts`), блок `map.css: дыхание огоньков` заменён на `map.css: canvas огоньков` |
| `App.seams.test.tsx` | корзины `.light-bucket` и `@keyframes light-breathe` | атрибуты `.esd-map > canvas.map-lights-canvas`, ноль узлов огоньков в SVG, `pointer-events: none` у холста, константы `BREATH_PERIOD_MS`, `LIGHT_BUCKETS`, радиусы 7–12, alpha .30–.60 |
| `motionPolicy.test.ts` | `new-light` в списке обязательных | `new-light` остался в `REGISTRY`, из обязательных вышел; правка на 4 строки |

Проверки `light-form.css` в `App.seams.test.tsx` (тест «форма стоит внутри ленты карты», строки про `.lf-section`) не тронуты: `git diff` их не показывает.

## Проверки кода

| Команда | Результат |
|---|---|
| `npx vitest run src/components/map/LightsCanvas.test.tsx` | код 0, 9 тестов passed |
| `npx vitest run src/components/map` | код 0, 7 файлов, 112 тестов passed |
| `npx vitest run` | код 0, 52 файла, 542 теста passed, без `console.error` и предупреждений `act` |
| `npx tsc -b` | код 0 |
| `npm run lint` | код 0 |
| `npm run build` | код 0, предупреждений о чанках нет (самый большой 394,6 КБ при пороге 500) |
| `node scripts/check-dist.mjs` | код 0, 11 проверок |
| `grep -c 'data-anim="' src/components/map/LightsCanvas.tsx` | 1 |
| `grep -c 'export ' src/components/map/LightsCanvas.tsx` | 3 |
| `grep -n "@property\|\.light-\|light-breathe\|light-arrive\|--halo-k\|--zoom-k\|prefers-reduced-motion" src/components/map/map.css` | пусто |
| `git status --short` | только семь файлов плана и симлинк `node_modules` |

Узлы SVG на странице: 282 всего, 180 внутри карты (считано рендером всего приложения с контейнером карты 1200×700).

## Decisions Made

- **Кольца держатся за id, а не за ссылку на точку.** `points` пересобирается на каждой смене проекции, и ссылка на точку протухает за один ресайз. Движок хранит `{ id, startedAt }`, а точку ищет в `pointById` перед кадром; кольцо огонька, пропавшего из данных, просто не рисуется.
- **`collect()` вызывается и при создании движка, не только в `onScene`.** Иначе `pointById` пуст до первой смены сцены, и кольцо огонька, зажжённого до монтирования холста, некуда поставить.
- **Двойной кадр под reduce при монтировании.** `createEngine` рисует кадр сам, потом `sync()` рисует статичный кадр бережного движения. Ветвление ради одного лишнего прохода усложнило бы планировщик там, где он и так отвечает за четыре флага.
- **Опорный огонёк в тесте кадра жеста выбирается по видимости.** На `k = 8` первый огонёк массива уходит за холст, и `drawFrame` его отсеивает. Тест берёт первый огонёк, чья экранная позиция после жеста лежит внутри 1200×700 с полем 20px, и сверяет `k·x + tx` именно по нему.

## Deviations from Plan

Все отклонения — в тестовой обвязке, поведение компонента совпадает с планом.

**1. [Rule 1 — Bug] `mockReducedMotion` подменяет `matchMedia` присваиванием, а не через `vi.spyOn`**
- **Найдено:** Task 1, три теста падали после теста reduce
- **Причина:** `setup.ts` кладёт в `window.matchMedia` мок-функцию; `vi.spyOn` поверх мока возвращает её же, `mockImplementation` переписывает её насовсем, а `vi.restoreAllMocks()` реализацию не откатывает. Reduce протекал в следующие тесты файла: кольцо не рисовалось, цикл не заводился
- **Фикс:** подмена присваиванием и возврат сохранённой ссылки в `afterEach`
- **Файл:** `src/components/map/LightsCanvas.test.tsx`

**2. [Rule 3 — Blocking] Свой мок-контекст каждому холсту вместо общего `mockReturnValue(ctx)`**
- **Найдено:** Task 1
- **Причина:** план предлагал отдать один мок и спрайтам, и основному холсту. Тогда `ctx.arc` спрайтов ядра смешивается с дугами колец, и проверку «под reduce `arc` не вызывается» не написать
- **Фикс:** `mockCanvasContexts()` с картой `холст → контекст`, та же обвязка в обоих тестовых файлах
- **Файлы:** `src/components/map/LightsCanvas.test.tsx`, `src/components/map/EsdMap.test.tsx`

**3. [Rule 3 — Blocking] Мок `clearRect` копит границы кадров**
- **Найдено:** Task 1
- **Причина:** проверки «последнего кадра» нужны и тесту reduce, и `lightXs` в `EsdMap.test.tsx`, а по одному массиву `drawImage` кадры не разделить
- **Фикс:** `frameStarts` в мок-контексте, хелпер `lastFrame(ctx)`
- **Файлы:** `src/components/map/LightsCanvas.test.tsx`, `src/components/map/EsdMap.test.tsx`

**4. Комментарий у `<canvas>` не содержит литерала `data-anim=`**
- **Найдено:** Task 1
- **Причина:** критерий требует `grep -c 'data-anim="'` равным 1, а первая редакция комментария цитировала атрибут
- **Файл:** `src/components/map/LightsCanvas.tsx`

## Assumption Drift (advisory)

**Общий мок-контекст для спрайтов и кадра.** План исходил из того, что одного мока хватит, потому что спрайты рисуют `fillRect`/`arc`/`fill`, а кадр — `drawImage`. На деле спрайт ядра тоже зовёт `arc`, и «кольца под reduce нет» на общем контексте не проверяется. Разошлись только тесты: контракт `lightsCanvas.ts` и поведение компонента остались планными.

## Заметка для фазы 17

В `src/styles/global.css` остаются три селектора, ставшие no-op:

- `[data-anim="pulse"] circle` — кругов в карте больше нет;
- `[data-anim="pulse"] .light-halo` — класса больше нет;
- `[data-anim="new-light"]` — узла с этим значением в DOM нет.

Сам атрибут `data-anim="pulse"` на холсте нужен и остаётся: он держит слой в закрытом реестре `motionPolicy.test.ts`. Значение `new-light` тоже остаётся в реестре, но из списка обязательных вышло. Убирать селекторы стоит одним решением по всему блоку reduce, когда фазы 14 и 16 сольются: файл `global.css` фаза 15 не трогала.

## Requirements

LIGHT-01, LIGHT-03, LIGHT-04, LIGHT-05, LIGHT-06 закрыты кодом и тестами. LIGHT-02 закрыт вместе с планом 15-01 (числа и математика) и этим планом (спрайты пересобираются только при смене dpr или размера). LIGHT-07 остаётся за планом 15-03: число узлов SVG проверено (282 против 3109), fps меряет зонд. `REQUIREMENTS.md`, `STATE.md` и `ROADMAP.md` план не трогал — отметки за оркестратором.

## Known Stubs

Заглушек нет.

## Threat Flags

Нового периметра нет: зависимостей не добавлялось, `package.json` не менялся. T-15-03 (стоимость цикла) закрыт порогом 33 мс, тремя паузами и `cancelAnimationFrame` в `dispose`; T-15-04 — ранним выходом `resize()`; T-15-05 (рассинхрон огоньков и стран) — синхронным `draw` из `handleFrame` и тестом кадра жеста, который сверяет позицию ядра с `k·x + tx` по проекции карты.

## Self-Check: PASSED

- `src/components/map/LightsCanvas.tsx` — FOUND (346 строк)
- `src/components/map/LightsCanvas.test.tsx` — FOUND (441 строка)
- `src/components/map/EsdMap.tsx` — FOUND (312 строк, было 402)
- `src/components/map/EsdMap.test.tsx` — FOUND (607 строк)
- `src/components/map/map.css` — FOUND (505 строк, было 611)
- `src/App.seams.test.tsx`, `src/styles/motionPolicy.test.ts` — FOUND, изменены точечно
- Коммитов нет по указанию оркестратора: изменения лежат в рабочем дереве ветки `agent-15`
