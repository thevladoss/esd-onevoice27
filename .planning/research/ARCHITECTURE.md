# Architecture Research

**Domain:** React SPA-лендинг с интерактивной SVG-картой, canvas-глобусом и мок-данными
**Researched:** 2026-09-05
**Confidence:** HIGH (архитектура простая, паттерны d3 + React устоявшиеся)

## Standard Architecture

### System Overview

```
index.html ─ main.tsx ─ App.tsx
                          ├─ LightsProvider (context: lights[], counters, addLight)
                          │    ├─ Header (fixed, якоря)
                          │    ├─ Hero ── GlobeCanvas (rAF) + Starfield (CSS)
                          │    ├─ MapSection ── Counters ── CountryChips ── EsdMap (SVG, d3-geo, d3-zoom)
                          │    ├─ LightForm ── addLight() → toast
                          │    ├─ About ── VideoEmbed + StepCard×3
                          │    ├─ Involve (триптих)
                          │    ├─ News (пагинация)
                          │    ├─ Resources ── ResourcePanel (materials | video | music)
                          │    ├─ Quote
                          │    └─ Footer
                          └─ data/*.ts (типизированные моки) ← lib/geo.ts (seed-генератор огоньков)
```

### Component Responsibilities

| Компонент | Отвечает за | Не отвечает за |
|---|---|---|
| `LightsProvider` (`state/lights.tsx`) | список огоньков, счётчики people/groups, `addLight` | рендер карты |
| `EsdMap` | проекция, `geoPath`, слой стран, слой огоньков, zoom/pan, центрирование на страну | данные огоньков (получает из контекста) |
| `CountryChips` | выбор активной страны (state вверх через `onSelect`) | геометрия |
| `Counters` | count-up при появлении, форматирование `4 268` | источник чисел (из контекста) |
| `LightForm` | валидация, локальное состояние полей, вызов `addLight`, тост | геокодирование (город → координата центра страны с небольшим сдвигом) |
| `GlobeCanvas` | rAF-цикл, точки на сфере, пауза при `document.hidden` и reduced motion | что-либо вне canvas |
| `VideoEmbed` | обложка `img.youtube.com/vi/{id}/hqdefault.jpg` → iframe `youtube-nocookie` по клику | список видео |
| `Section`, `Eyebrow`, `GradientTitle`, `Button`, `GlassCard` | единый визуальный язык | бизнес-логика |

## Recommended Project Structure

```
src/
  main.tsx  App.tsx
  styles/tokens.css   # @theme токены, шрифты
  styles/global.css   # @import tailwind, keyframes, утилиты .glass .skew .beam
  data/countries.ts   # 12 стран ЕАД: id ISO-3166 numeric, название, центр, bbox
  data/lights.ts      # seed + генератор → Light[]
  data/copy.ts        # все тексты секций
  data/news.ts data/videos.ts data/materials.ts
  lib/geo.ts          # loadWorld(), esdFeatures, projection factory, randomInBBox(seed)
  lib/format.ts       # formatCount(4268) → "4 268"
  lib/useCountUp.ts lib/useInViewOnce.ts
  state/lights.tsx
  components/{layout,hero,map,form,about,involve,news,resources,quote}/
  test/setup.ts       # jest-dom, моки IntersectionObserver/ResizeObserver/canvas
```

### Structure Rationale

- Данные отделены от компонентов: тесты проверяют моки и чистые функции без DOM.
- Один контекст, потому что только карта, счётчики и форма делят состояние. Остальное статично.
- Каждая секция в своей папке: фазы bm выполняются параллельно без конфликтов файлов.

## Architectural Patterns

### Pattern 1: d3 для математики, React для DOM

**What:** d3-geo считает `path d`, React рендерит `<path>` и `<circle>`; только d3-zoom привязан императивно к `<svg>` через `useRef` + `useEffect`, transform складывается в `useState` и применяется к `<g transform>`.
**When to use:** всегда для SVG-карты в React.
**Trade-offs:** чуть больше кода, чем `d3.select().data().join()`, но нет двух владельцев DOM.

**Example:**
```tsx
useEffect(() => {
  const z = zoom<SVGSVGElement, unknown>().scaleExtent([1, 8]).on("zoom", e => setTransform(e.transform));
  select(svgRef.current!).call(z);
  return () => { select(svgRef.current!).on(".zoom", null); };
}, []);
```

### Pattern 2: Проекция под регион с антимеридианом

**What:** для ЕАД (Россия пересекает 180°) использовать `geoMercator().rotate([-90, 0])` или `geoConicConformal().rotate([-85, 0]).parallels([40, 65])`, затем `fitExtent([[pad,pad],[w-pad,h-pad]], esdFeatureCollection)`. Поворот переносит разрыв проекции в Атлантику.
**When to use:** любая карта, где регион пересекает 180°.
**Trade-offs:** Чукотка не рвётся; Европа слегка сжата на краю.

### Pattern 3: Canvas-декор с управляемым циклом

**What:** `GlobeCanvas` держит точки в `Float32Array`, рисует в rAF, останавливается при `prefers-reduced-motion`, `document.hidden` и когда секция вне вьюпорта (IntersectionObserver).
**When to use:** любые декоративные canvas-эффекты.
**Trade-offs:** больше кода, чем видео, но 0 байт трафика и нет проблем с автоплеем.

## Data Flow

### Request Flow

Нет сети, кроме шрифтов и YouTube-превью. `world-atlas` импортируется как JSON-модуль на билде.

### State Management

`LightsProvider`: `useReducer` с `{ lights: Light[] }`, селекторы `people = lights.filter(l => l.type === "person").length`, `groups` аналогично. Начальное состояние: `generateLights(seed = 27)` → 694 person + 248 group, распределённые по странам пропорционально весу (Россия ~55%, Украина не входит в ЕАД).

### Key Data Flows

1. `data/lights.ts` → `LightsProvider` → `EsdMap` (кружки) и `Counters` (числа).
2. `LightForm.submit` → `addLight({ type, countryId })` → координата = центр страны + детерминированный сдвиг → карта и счётчики обновляются.
3. `CountryChips.onSelect(id)` → `EsdMap` анимирует zoom к bbox страны через `zoom.transform` с `transition`-подобным `requestAnimationFrame` интерполятором или мгновенно при reduced motion.
4. `Resources` → `activePanel` (`materials | video | music | null`) → `ResourcePanel`.

## Scaling Considerations

Не применимо: статический прототип. Единственный «масштаб» — число огоньков: до ~1 000 `<circle>` SVG рендерит без проблем, пульсацию давать не более 40 через `nth-child`/класс.

### Scaling Priorities

1. Производительность анимаций на мобильном (backdrop-filter, blend modes).
2. Размер бандла: world-atlas 110m ≈ 110 КБ gzip, motion ≈ 35 КБ, d3 части ≈ 30 КБ.

## Anti-Patterns

### Anti-Pattern 1: d3 владеет DOM внутри React

**What people do:** `d3.select(ref).selectAll("circle").data(...).join(...)` в `useEffect`.
**Why it's wrong:** React перерисовывает и теряет узлы d3, тесты не видят элементы.
**Do this instead:** d3 только считает, React рендерит.

### Anti-Pattern 2: Один гигантский `App.tsx`

**What people do:** все секции в одном файле с копипастой классов.
**Why it's wrong:** параллельные фазы конфликтуют, тесты неудобны.
**Do this instead:** папка на секцию, общие примитивы в `layout/`.

### Anti-Pattern 3: Анимации без reduced-motion

**What people do:** бесконечные keyframes и rAF без проверки `prefers-reduced-motion`.
**Why it's wrong:** доступность и батарея.
**Do this instead:** `useReducedMotion()` из motion и `@media (prefers-reduced-motion: reduce)` в CSS, как в оригинале (пять таких блоков).

## Build Order

1. Каркас: токены, шрифты, `Section`/`Button`/`GlassCard`, Header/Footer, пустые секции с якорями, тесты, CI + первый деплой.
2. Hero + карта: `GlobeCanvas`, `EsdMap`, `LightsProvider`, `Counters`, `CountryChips`.
3. Форма + About + Involve: зависят от контекста огоньков и примитивов.
4. News + Resources + Quote: только данные и примитивы.
5. Полировка: reveal-анимации, мобильная вёрстка, a11y, производительность, финальный smoke.

## Testing Seams

- Чистые функции (`lib/geo.ts`, `lib/format.ts`, редьюсер огоньков, пагинация) — Vitest без DOM.
- Компоненты (`LightForm`, `CountryChips`, `Resources`, `Header`) — Testing Library, с моками IntersectionObserver/ResizeObserver и `HTMLCanvasElement.prototype.getContext`.
- Визуал и анимации — Playwright smoke по собранному билду.
