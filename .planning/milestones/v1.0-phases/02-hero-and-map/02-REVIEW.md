---
phase: 02-hero-and-map
reviewed: 2026-09-05T16:26:02Z
depth: standard
files_reviewed: 39
files_reviewed_list:
  - src/components/hero/Hero.tsx
  - src/components/hero/Hero.test.tsx
  - src/components/hero/Starfield.tsx
  - src/components/hero/globe.ts
  - src/components/hero/globe.test.ts
  - src/components/hero/GlobeCanvas.tsx
  - src/components/hero/GlobeCanvas.test.tsx
  - src/components/hero/hero.css
  - src/components/hero/scrollToSection.ts
  - src/components/map/MapSection.tsx
  - src/components/map/MapSection.test.tsx
  - src/components/map/EsdMap.tsx
  - src/components/map/EsdMap.test.tsx
  - src/components/map/useMapZoom.ts
  - src/components/map/CountryChips.tsx
  - src/components/map/CountryChips.test.tsx
  - src/components/map/ZoomHint.tsx
  - src/components/map/Counters.tsx
  - src/components/map/Counters.test.tsx
  - src/components/map/map.css
  - src/data/copy.hero.ts
  - src/data/copy.map.ts
  - src/data/countries.ts
  - src/data/lights.ts
  - src/data/lights.test.ts
  - src/lib/geo.ts
  - src/lib/geo.test.ts
  - src/lib/rng.ts
  - src/lib/rng.test.ts
  - src/lib/format.ts
  - src/lib/format.test.ts
  - src/lib/easing.ts
  - src/lib/easing.test.ts
  - src/lib/useReducedMotion.ts
  - src/lib/useInViewOnce.ts
  - src/lib/useCountUp.ts
  - src/state/lights.tsx
  - src/state/lights.reducer.test.tsx
  - src/types/world-atlas.d.ts
findings:
  critical: 2
  warning: 10
  info: 14
  total: 26
status: issues_found
---

# Фаза 2: отчёт код-ревью

**Дата:** 2026-09-05T16:26:02Z
**Глубина:** standard
**Файлов просмотрено:** 39
**Статус:** issues_found

## Summary

Я прочитал все 39 файлов фазы, прогнал `eslint` по `src/components/hero`, `src/components/map`, `src/lib`, `src/data`, `src/state` (чисто, ноль сообщений) и проверил три гипотезы измерением на реальных данных world-atlas: покрытие bbox при rejection sampling, положение центроидов и стоимость `generateLights`.

Что держится хорошо: антимеридиан в `randomPointIn` посчитан верно (`180 - x0 + (x1 + 180)` = 360 - x0 + x1, замер по 12 странам даёт попадание 34–62% за попытку, вероятность исчерпать 50 попыток не выше 8e-11, а запасной центроид у всех 12 стран лежит внутри границ). Очистка rAF и наблюдателей в `GlobeCanvas` и `useCountUp` полная: кадр снимается, `ResizeObserver`, `IntersectionObserver`, `visibilitychange` и `matchMedia` отписываются. Снятие d3-zoom через `svg.on(".zoom", null)` снимает namespace целиком, повторное монтирование под StrictMode проходит без дублей (это же покрыто тестом `EsdMap.test.tsx:216`). Инъекций, секретов, `eval`, `innerHTML`, `dangerouslySetInnerHTML` и внешних сетевых вызовов в фазе нет: тексты приходят из статических модулей `copy.*`, единственный пользовательский ввод (`countryId`, `type`) проверяется через `countryById` до записи в состояние.

Что ломается: карта теряет положение камеры при любом изменении размера контейнера, карточки счётчиков перекрывают верх карты и съедают жесты, а состояние «карта не загрузилась» срабатывает на неизмеренном контейнере, а не на сломанной проекции. Дальше по списку — фильтр жестов пропускает macOS ctrl+click, глобус крутится со скоростью, привязанной к частоте кадров, и два `aria-live`-региона объявляют голые числа без подписи.

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01: Любое изменение размера контейнера сбрасывает зум и панораму карты

**File:** `src/components/map/EsdMap.tsx:157-177`
**Issue:** Эффект полёта камеры зависит от `projection`, `width` и `height`. `projection` — это `useMemo` по `[width, height]` (строки 89–92), поэтому смена измеренного размера даёт новый объект и перезапускает эффект. При `selectedCountryId === null` цель равна `zoomIdentity`, и `zoomTo` анимацией возвращает карту в исходное положение. Посетитель, который вручную приблизил Ташкент и подвинул карту, теряет вид при повороте телефона, изменении окна и при схлопывании адресной строки в Chrome Android: высота `.map-container` задана как `clamp(520px, 70vh, 880px)` (`map.css:293`), поэтому `vh` меняется прямо во время прокрутки. `ResizeObserver` в `useLayoutEffect` (строки 62–83) сообщает о новом размере, и камера уезжает в обзор дивизиона.
**Fix:**
```tsx
// Полёт только на смену выбора; смена размера пересчитывает проекцию, но не трогает камеру.
const lastFlownRef = useRef<{ id: number | null; w: number; h: number } | null>(null);

useEffect(() => {
  if (!projection) return;
  const prev = lastFlownRef.current;
  const sizeChanged = prev !== null && (prev.w !== width || prev.h !== height);
  const selectionChanged = prev === null || prev.id !== selectedCountryId;
  lastFlownRef.current = { id: selectedCountryId, w: width, h: height };

  // Размер изменился, а страну не переключали: посетитель сам поставил камеру, оставляем её.
  if (sizeChanged && !selectionChanged) return;
  // ...дальше расчёт target и zoomTo
}, [projection, selectedCountryId, width, height, reduced, zoomTo]);
```

### CR-02: Карточки счётчиков глушат жесты на верхней трети карты

**File:** `src/components/map/map.css:235-253`
**Issue:** С 768px `.counters` становится `position: absolute; top: 88px; left: 50%; z-index: 3` внутри `.map-stage`, а `.map-container` занимает ту же область (`MapSection.tsx:30-41`). Две карточки по 240px с зазором 16px дают непрозрачный прямоугольник примерно 496×112px по центру верха карты. `pointer-events: none` на нём нет, в отличие от соседней подсказки `.map-hint` (`map.css:376`). Нажатие мышью в этой зоне не начинает панораму, `⌘/Ctrl + колесо` над карточкой не масштабирует карту, а курсор `grab` от `.map-container` подсказывает обратное. Именно в эту точку попадает указатель у посетителя, который тянет карту от центра.
**Fix:**
```css
.counters {
  /* Карточки только показывают числа: жесты уходят в карту под ними. */
  pointer-events: none;
}
```

## Warnings

### WR-01: «Карта не загрузилась» показывается неизмеренному контейнеру, а не сломанной проекции

**File:** `src/components/map/EsdMap.tsx:85-100`
**Issue:** При `width` или `height` меньше 1 `projection` равен `null` (строки 89–92), `probe` равен `null`, и `hasError` становится `true` (строки 94–96), как только `resolved` перестал быть `null`. Ноль размера означает «контейнер ещё не разложен» либо «контейнер скрыт», а не «проекция сломалась». Последствия: `role="status"` объявляет скринридеру ложное «Карта не загрузилась», `onError(true)` гасит все 13 чипов (`MapSection.tsx:29`), а совет «Обновите страницу» не помогает, потому что компонент сам восстановится по `ResizeObserver`. Поведение закреплено тестами (`MapSection.test.tsx:34-39`, `EsdMap.test.tsx:102-113`), то есть весь остальной набор тестов по умолчанию гоняет ветку ошибки. Триггер в проде узкий (высота контейнера задана в CSS), но любая обёртка в скрытую вкладку, `display: none` или печатные стили включает ложную ошибку.
**Fix:**
```tsx
const measuredOk = width >= 1 && height >= 1;
// Ошибка — только сломанная проекция на измеренном контейнере.
const hasError =
  resolved !== null &&
  measuredOk &&
  (probe === null || !Number.isFinite(probe[0]) || !Number.isFinite(probe[1]));
```

### WR-02: Фильтр жестов пропускает ctrl+click, который на macOS открывает контекстное меню

**File:** `src/components/map/useMapZoom.ts:47`
**Issue:** Ветка по умолчанию возвращает `!event.button`. Штатный фильтр d3-zoom (`node_modules/d3-zoom/src/zoom.js:13-15`) написан как `(!event.ctrlKey || event.type === 'wheel') && !event.button` именно потому, что на macOS ctrl+click приходит как `mousedown` с `button === 0` и `ctrlKey === true` и одновременно открывает контекстное меню. Здесь такой клик стартует жест: `setDragging(true)` (строка 93), карта уезжает под открывшимся меню, `.esd-map` получает курсор `grabbing`.
**Fix:**
```ts
// Ctrl+click на macOS — это контекстное меню, а не панорама.
return !event.ctrlKey && !event.button;
```

### WR-03: Выбор страны снимается только зумом, а повторный клик по активному чипу ничего не делает

**File:** `src/components/map/EsdMap.tsx:143-148`
**Issue:** `handleUserZoom` сравнивает только масштаб `k` с `kAtSelectionRef`. При панораме d3 шлёт события `zoom` с тем же `k`, отношение равно нулю, и `onUserZoomAway` не вызывается. Посетитель утаскивает карту с Молдовы к Камчатке, а чип «Молдова» остаётся `aria-pressed="true"` и подсветка `country--selected` висит за краем экрана. Вернуться к стране повторным кликом нельзя: `onSelect(643)` при уже выбранном 643 отдаёт то же значение в `setSelectedId`, React отбрасывает обновление, эффект полёта не перезапускается. Единственный выход — выбрать другую страну и вернуться.
**Fix:** сравнивать полный трансформ, а не только масштаб, и заводить перелёт по клику независимо от равенства id.
```ts
const handleUserZoom = useCallback((t: ZoomTransform) => {
  if (selectedRef.current === null) return;
  const base = transformAtSelectionRef.current;
  const movedScale = Math.abs(t.k / base.k - 1) > ZOOM_AWAY_RATIO;
  const movedPan = Math.hypot(t.x - base.x, t.y - base.y) > ZOOM_AWAY_PX;
  if (movedScale || movedPan) zoomAwayRef.current?.();
}, []);
```

### WR-04: Скорость вращения глобуса привязана к частоте кадров

**File:** `src/components/hero/GlobeCanvas.tsx:55-59`
**Issue:** `tick` прибавляет фиксированный `GLOBE_SPEED` на каждый кадр и игнорирует метку времени, которую rAF передаёт первым аргументом. На дисплее 120Hz глобус крутится вдвое быстрее, чем на 60Hz, на 144Hz — в 2.4 раза, а при просадке кадров замедляется. Соседние анимации фазы считают время правильно (`useCountUp.ts:37-42`, `useMapZoom.ts:132-134`), так что это ещё и расхождение с принятым в фазе подходом.
**Fix:**
```ts
let lastAt: number | null = null;

function tick(now: number) {
  const dt = lastAt === null ? 16.7 : Math.min(now - lastAt, 100);
  lastAt = now;
  angle += GLOBE_SPEED * (dt / 16.7);
  renderFrame();
  frameId = window.requestAnimationFrame(tick);
}
```
Плюс сбрасывать `lastAt = null` в `sync()` при остановке, иначе после возврата вкладки глобус прыгнет на накопленную дельту.

### WR-05: Живые регионы счётчиков объявляют голые числа без подписи

**File:** `src/components/map/Counters.tsx:29-34`
**Issue:** Внутри `.counter__value` видимое число скрыто через `aria-hidden`, а рядом стоит `<span class="sr-only" aria-live="polite">` с итоговым значением. При добавлении огонька скринридер произносит «695» и «249» без единого слова контекста: подпись «ЧЕЛОВЕК» лежит в отдельном абзаце вне живого региона. Два одновременных polite-региона к тому же ставят два объявления в очередь на одно действие.
**Fix:** включить подпись в объявление и оставить один регион.
```tsx
<p className="counter__value">
  <span aria-hidden="true">{formatCount(people)}</span>
  <span className="sr-only">
    {formatCount(counts.people)} {mapCopy.counters.people.toLowerCase()}
  </span>
</p>
```
и повесить один `aria-live="polite"` на `.counters`, а не на каждую карточку.

### WR-06: Исключение в редьюсере огоньков гасит всю страницу

**File:** `src/state/lights.tsx:55-58`
**Issue:** `createLight` бросает `Error` на неизвестной стране, `lightsReducer` вызывает его прямо в фазе рендера (строка 83), а `LightsProvider` дополнительно вызывает `generateLights()` в инициализаторе `useReducer` (строки 98–100), где `data/lights.ts:59-62` бросает при отсутствии страны в world-atlas. Ни в `App.tsx`, ни в `main.tsx` нет error boundary, поэтому React 19 размонтирует корень и посетитель получает белый экран вместо восьми секций. У карты уже есть щадящее состояние ошибки (`mapCopy.error`), а у состояния огоньков — нет: одинаковая по смыслу поломка обрабатывается двумя разными способами (сравните с `lib/geo.ts:25-27`, где отсутствующая страна молча отфильтровывается).
**Fix:** вернуть состояние без изменений и залогировать вместо `throw`, а корень обернуть в error boundary.
```ts
export function lightsReducer(state: LightsState, action: LightsAction): LightsState {
  switch (action.type) {
    case "add": {
      const light = tryCreateLight(state.lights, action.input);
      return light ? { lights: [...state.lights, light] } : state;
    }
    default:
      return state;
  }
}
```

### WR-07: Пустые границы страны дают трансформ `translate(NaN,NaN)`

**File:** `src/components/map/EsdMap.tsx:163-173`
**Issue:** `path.bounds(feature)` для геометрии, полностью отсечённой проекцией, возвращает `[[Infinity, Infinity], [-Infinity, -Infinity]]`. Тогда `fit` равен `0.8 / -Infinity` = `-0`, `k` схлопывается к `ZOOM_MIN`, а `-(x0 + x1) / 2` даёт `Infinity + (-Infinity)` = `NaN`, и `transform.toString()` выдаёт `translate(NaN,NaN) scale(1)` — карта исчезает целиком. Ветка достижима, потому что `featureById(selectedCountryId)` (строка 160) ищет по всем 177 странам мира, а не по 12 странам дивизиона: пропс `selectedCountryId?: number | null` принимает любое число, и первый же внешний вызов (диплинк, параметр хеша, тест) попадает мимо ЕАД.
**Fix:**
```tsx
const feature =
  selectedCountryId !== null && isEsd(selectedCountryId) ? featureById(selectedCountryId) : undefined;

if (feature) {
  const [[x0, y0], [x1, y1]] = geoPath(projection).bounds(feature);
  if (![x0, y0, x1, y1].every(Number.isFinite) || x1 <= x0 || y1 <= y0) return;
  // ...расчёт target
}
```

### WR-08: Программный полёт обходит `constrain` d3-zoom, и карта прыгает на следующем жесте

**File:** `src/components/map/useMapZoom.ts:124-141`
**Issue:** `behavior.transform(...)` в d3-zoom v3 записывает трансформ напрямую и не применяет `constrain` (`node_modules/d3-zoom/src/zoom.js:84-97`), в отличие от `scaleTo`/`translateTo`. Заданный на строках 87–90 `translateExtent` при перелёте не действует, поэтому камера у краёв дивизиона (Чукотка, Молдова) встаёт за пределами разрешённой области. Первый же пользовательский жест проходит через `constrain` и рывком возвращает карту внутрь границ.
**Fix:** отдавать цель через `behavior.scaleTo` + `behavior.translateTo`, которые применяют ограничение, либо прогонять `target` через собственную реализацию `constrain` перед `behavior.transform`.

### WR-09: `allocateByWeight` молча ломает контракт суммы при весах не равных единице

**File:** `src/data/lights.ts:32-35`
**Issue:** Комментарий обещает «сумма ровно равна total», но цикл раздачи остатка идёт только при `rest > 0`. Если сумма весов больше единицы, `rest` отрицателен, цикл не выполняется и функция возвращает больше `total`. Если сумма заметно меньше единицы, остаток по кругу `k % order.length` уходит одним и тем же странам по второму разу, что тихо искажает распределение. Валидации весов нет ни здесь, ни в `countries.ts` — держится только тест `geo.test.ts:34-37`, который живёт в другом файле и проверяет данные, а не функцию.
**Fix:**
```ts
export function allocateByWeight(total: number, weights: readonly number[]): number[] {
  const sum = weights.reduce((a, b) => a + b, 0);
  if (Math.abs(sum - 1) > 1e-9) {
    throw new Error(`Weights must sum to 1, got ${sum}`);
  }
  // ...дальше как есть
}
```

### WR-10: Каждый кадр жеста перерисовывает около 2900 SVG-узлов через состояние React

**File:** `src/components/map/useMapZoom.ts:95-99`
**Issue:** Отмечаю по прямому запросу на ревью производительности 942 огоньков; по умолчанию производительность вне области v1. Обработчик `zoom` зовёт `setTransform(event.transform)` на каждое событие жеста, то есть на каждый кадр колеса и перетаскивания. `EsdMap` пересчитывает `coreRadius` и `haloRadius` от `transform.k` (строки 180–181) и отдаёт их в атрибуты `r` всех 942 гало и 942 ядер, плюс перерисовывает 177 путей стран и группу вьюпорта: около 2900 узлов на кадр вместо изменения одного атрибута `transform` у `g.map-viewport`. На мобильных это превращает панораму в слайдшоу, то есть жест перестаёт работать по назначению.
**Fix:** во время жеста менять только атрибут группы вьюпорта императивно, а состояние обновлять на `end`.
```ts
.on("zoom", (event) => {
  viewportRef.current?.setAttribute("transform", event.transform.toString());
  viewportRef.current?.style.setProperty("--zoom-k", String(event.transform.k));
  if (event.sourceEvent) onUserZoomRef.current?.(event.transform.k);
})
.on("end", (event) => {
  setDragging(false);
  setTransform(event.transform);
})
```
и считать радиусы в CSS: `.light-core { r: calc(2.2px / var(--zoom-k, 1)); }`.

## Info

### IN-01: Строка медиазапроса reduced motion продублирована

**File:** `src/components/hero/GlobeCanvas.tsx:12`
**Issue:** Локальная константа `REDUCED_MOTION` повторяет `REDUCED_MOTION_QUERY` из `src/lib/useReducedMotion.ts:3`. Расхождение при правке одной из копий останется незамеченным.
**Fix:** импортировать `REDUCED_MOTION_QUERY` из `../../lib/useReducedMotion`.

### IN-02: Подсчёт огоньков продублирован в двух модулях

**File:** `src/components/map/EsdMap.tsx:122-130`
**Issue:** Инлайновый цикл повторяет экспортируемую `countLights` из `src/state/lights.tsx:33-46` слово в слово. Вторая реализация нужна только ради строки для скринридера.
**Fix:** `const counts = useMemo(() => countLights(lights), [lights]);`

### IN-03: Золотой угол задан двумя способами

**File:** `src/state/lights.tsx:49`
**Issue:** Здесь стоит литерал `2.39996`, а `src/components/hero/globe.ts:8` вычисляет тот же угол как `Math.PI * (3 - Math.sqrt(5))`. Один смысл, два источника и разная точность.
**Fix:** вынести `GOLDEN_ANGLE` в `src/lib/` и импортировать в оба модуля.

### IN-04: `fibonacciSphere(1)` возвращает NaN

**File:** `src/components/hero/globe.ts:32`
**Issue:** `1 - (i / (n - 1)) * 2` при `n === 1` даёт деление ноль на ноль, и все три координаты становятся `NaN`. При `n <= 0` возвращается пустой массив, что безопасно, а вот единица проходит молча.
**Fix:** `const y = n === 1 ? 0 : 1 - (i / (n - 1)) * 2;`

### IN-05: Цвет дуг в canvas записан синтаксисом CSS Color 4

**File:** `src/components/hero/globe.ts:82`
**Issue:** `ctx.strokeStyle = "rgb(170 217 220 / .18)"` использует пробельную запись со слешем. Движок, который её не разбирает, тихо игнорирует присваивание и оставляет чёрный `#000` по умолчанию, а при `globalCompositeOperation = "lighter"` чёрный не добавляет ничего: три орбитальные дуги просто исчезают без единой ошибки в консоли.
**Fix:** писать `rgba(170, 217, 220, 0.18)` — этот синтаксис понимают все движки, включая старые WebKit.

### IN-06: Генерация огоньков занимает около 105ms синхронно в рендере

**File:** `src/state/lights.tsx:98-100`
**Issue:** Замер на этой машине (Node, тёплый JIT, тот же алгоритм и те же данные world-atlas): три прогона `generateLights()` дали 115.7ms, 103.8ms, 105.7ms. Работа идёт в инициализаторе `useReducer`, то есть блокирует первый рендер, а под StrictMode в dev React зовёт инициализатор дважды. На среднем телефоне это сотни миллисекунд замершего главного потока до первой отрисовки. Производительность вне области v1, отмечаю как след для следующей фазы.
**Fix:** заранее посчитать координаты и сохранить их статическим JSON рядом с `copy.*`, либо считать в `useEffect` после первой отрисовки.

### IN-07: Схема id новых огоньков ломается при удалении

**File:** `src/state/lights.tsx:71`
**Issue:** `id: \`n${lights.length}\`` уникален только пока список растёт. Любое будущее удаление или фильтрация даст повтор id, а он используется как React `key` в `EsdMap.tsx:236`.
**Fix:** вести монотонный счётчик в состоянии или брать `crypto.randomUUID()`.

### IN-08: Двойные приведения типов обесценивают собственный `.d.ts`

**File:** `src/lib/geo.ts:13-19`
**Issue:** `src/types/world-atlas.d.ts` объявляет точный тип `Topology<{ countries: GeometryCollection<{ name: string }>; land: GeometryCollection }>`, а модуль сразу стирает его через `topology as unknown as Topology`, потом восстанавливает через второе приведение `topo.objects.countries as GeometryCollection<...>` и третье на результате `toFeature`. Проверка типов не срабатывает ровно там, где её и написали.
**Fix:** использовать объявленный дженерик напрямую: `const world = toFeature(topology, topology.objects.countries);`

### IN-09: Клик по CTA теряет хеш и перехватывает cmd+click

**File:** `src/components/hero/Hero.tsx:12-16`
**Issue:** `preventDefault` после успешной прокрутки убирает `#light-form` из адресной строки, поэтому ссылку на форму нельзя скопировать, а «назад» не возвращает к герою. Обработчик также не пропускает `metaKey`, `ctrlKey`, `shiftKey` и среднюю кнопку, то есть открыть якорь в новой вкладке штатным способом не выйдет.
**Fix:**
```tsx
function handleCtaClick(event: MouseEvent<HTMLAnchorElement>) {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
  if (scrollToSection(heroCopy.ctaHref)) {
    event.preventDefault();
    history.pushState(null, "", heroCopy.ctaHref);
  }
}
```

### IN-10: Высота фиксированного header задана в трёх местах

**File:** `src/components/hero/scrollToSection.ts:2`
**Issue:** `HEADER_OFFSET = 96` дублирует `scroll-padding-top: 96px` из `src/styles/global.css:18`, а `hero.css:125` компенсирует ту же шапку числом `padding-top: 160px`. Три независимых литерала на одну величину.
**Fix:** объявить `--header-h: 96px` в `global.css`, читать её в CSS и отдавать в JS через `getComputedStyle` либо через один экспортируемый модуль констант.

### IN-11: Задержка пульсации нового огонька считается из его порядкового номера

**File:** `src/components/map/EsdMap.tsx:242-246`
**Issue:** `animationDelay` вычисляется как `((index / PULSE_EVERY) % 12) * 200`. Для регулярных огоньков `index` кратен 24 и делит нацело, а вот у только что зажжённого огонька `index` произвольный: 943-й даёт задержку 658ms, 950-й — 1937ms. Отклик на действие посетителя откладывается до двух секунд, хотя кольцо прибытия стартует сразу.
**Fix:** `const delay = light.isNew ? 0 : ((index / PULSE_EVERY) % 12) * 200;`

### IN-12: Тесты по-разному подключают API vitest

**File:** `src/components/hero/Hero.test.tsx:1-4`
**Issue:** Hero, globe, GlobeCanvas, EsdMap, MapSection и CountryChips полагаются на `globals: true` из `vite.config.ts:13`, а `Counters.test.tsx:2` и `lights.reducer.test.tsx:4` импортируют `describe`, `it`, `expect`, `vi` явно. Два стиля в одном наборе.
**Fix:** выбрать один стиль на проект и записать его в CONVENTIONS.md; при `globals: true` явные импорты избыточны.

### IN-13: Тест счётчиков проверяет объявление, а думает, что проверяет видимое число

**File:** `src/components/map/MapSection.test.tsx:31`
**Issue:** `expect(screen.getByText("694")).toBeInTheDocument()` в этом окружении находит скрытый `sr-only` спан, а не видимую цифру: `src/test/setup.ts:3-19` подменяет `IntersectionObserver` заглушкой, которая никогда не сообщает о пересечении, поэтому `useInViewOnce` держит `false`, а видимый счётчик показывает «0». Тест зелёный, но проверяет не то, что заявлено в названии.
**Fix:** искать по видимому узлу (`.counter--people .counter__value [aria-hidden="true"]`) и явно поднимать наблюдатель, как это сделано в `Counters.test.tsx:26-51`.

### IN-14: Двойной клик масштабирует карту, а подсказка об этом молчит

**File:** `src/components/map/useMapZoom.ts:38-48`
**Issue:** `zoom()` d3 вешает `dblclick.zoom` (`node_modules/d3-zoom/src/zoom.js:76`), и текущий фильтр его пропускает: `event.button === 0` даёт `true`. Двойной клик приближает карту вдвое и заодно сбрасывает выбранную страну через `onUserZoom`. Подсказка `mapCopy.hint.pointer` обещает только «⌘ / Ctrl + колесо» и перетаскивание, так что поведение для посетителя неожиданно.
**Fix:** либо отключить жест (`svg.on("dblclick.zoom", null)` после `svg.call(behavior)`), либо дописать его в текст подсказки.

## Проверки без находок

- Инъекции, XSS, секреты: `eval`, `innerHTML`, `dangerouslySetInnerHTML`, `document.write`, шаблонная сборка HTML и внешние запросы в фазе отсутствуют. Все тексты приходят из `copy.hero.ts` и `copy.map.ts`, `href` статические (`#light-form`), пользовательский ввод карты ограничен `countryId` и `type`, которые проходят через `countryById`.
- Антимеридиан в `randomPointIn` (`geo.ts:68-79`): формула `180 - x0 + (x1 + 180)` равна `360 - x0 + x1` и верна для bbox через 180°; замер на реальных данных дал попадание за попытку 34.7–62.0% по 12 странам, вероятность исчерпать 50 попыток не выше 8.03e-11, а запасной `geoCentroid` у всех 12 стран лежит внутри границ (`geoContains` = true).
- Очистка rAF и наблюдателей: `GlobeCanvas.tsx:115-125` снимает кадр, оба наблюдателя, `visibilitychange` и слушатель `matchMedia`; `useCountUp.ts:55-62` и `useInViewOnce.ts:41` снимают свои ресурсы; повторный вход в эффект под StrictMode дублей не оставляет.
- Снятие d3-zoom: `svg.on(".zoom", null)` снимает весь namespace, включая `wheel.zoom` с `{passive: false}`; тест `EsdMap.test.tsx:216-225` это фиксирует.
- `eslint` по всем каталогам фазы проходит без сообщений.

## Автоматический проход по конвенциям

`gsd-tools verify conventions --check` вернул 9 находок вида «identifier casing is Pascal (Hero) → should be camel» на компонентах React и провайдере. Все девять — ложные срабатывания: JSX требует PascalCase для имён компонентов, иначе React трактует тег как DOM-элемент. В список находок они не вынесены.

---

_Reviewed: 2026-09-05T16:26:02Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
