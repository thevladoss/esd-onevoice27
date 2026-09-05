# Phase 2: Hero и карта - Research

**Researched:** 2026-09-05
**Confidence:** HIGH (проверено скриптом на реальных данных world-atlas)

## Проверено скриптом (scratchpad/probe/probe.mjs)

- `world-atlas/countries-110m.json`: 177 стран; все 12 стран ЕАД найдены. **Id в TopoJSON — строки с ведущими нулями** (`"004"`, `"031"`, `"051"`), сравнивать через `Number(f.id)`.

| numeric id | Страна | name в атласе | Центроид (lon, lat) |
|---|---|---|---|
| 643 | Россия | Russia | 95.8, 66.1 |
| 112 | Беларусь | Belarus | 28.0, 53.5 |
| 498 | Молдова | Moldova | 28.4, 47.2 |
| 268 | Грузия | Georgia | 43.5, 42.2 |
| 51 | Армения | Armenia | 45.0, 40.2 |
| 31 | Азербайджан | Azerbaijan | 47.6, 40.2 |
| 398 | Казахстан | Kazakhstan | 67.2, 48.4 |
| 417 | Кыргызстан | Kyrgyzstan | 74.6, 41.5 |
| 762 | Таджикистан | Tajikistan | 71.0, 38.6 |
| 795 | Туркменистан | Turkmenistan | 59.3, 39.1 |
| 860 | Узбекистан | Uzbekistan | 63.4, 41.8 |
| 4 | Афганистан | Afghanistan | 66.0, 33.8 |

Центроиды ЕАД для `data/countries.ts` можно брать из таблицы (или считать `geoCentroid` в рантайме). Для России центр слишком северный для «сдвига огонька из формы»: использовать точку 55.7, 37.6 (Москва) с сдвигом ±3°.

- Проекция `geoMercator().rotate([-90, 0]).fitExtent([[24,24],[w-24,h-24]], esdCollection)` при 1200×700: scale 320, translate [517, 848]; все 12 центроидов внутри вьюбокса; Чукотка не рвётся: точка 179.5E → x=1017, точка 179W → x=1026 (рядом). Калининград x=128, Москва x=224, Владивосток x=751. Габариты России в px: 123,24 → 1077,595. Вывод: антимеридиан решён поворотом, дополнительных `clipExtent` не нужно.
- Rejection sampling огоньков: `geoBounds(feature)` + `geoContains(feature, [lon, lat])`, для России bbox пересекает 180° (`x0 > x1`), поэтому долготу выбирать как `x0 + r * ((180 - x0) + (x1 + 180))` и нормализовать `> 180 → -360`. 240 точек по 12 странам взяты за 2.1 попытки в среднем, лимит 50 попыток с fallback на центроид не срабатывал.
- `mulberry32(seed)` детерминирован; seed 27 фиксируем.

## Импорт JSON в Vite/TS

```ts
import topology from "world-atlas/countries-110m.json";
import { feature } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
const world = feature(topology as unknown as Topology, (topology as any).objects.countries as GeometryCollection);
```

Нужны типы `@types/topojson-client`, `@types/topojson-specification`, `@types/geojson`, `@types/d3-geo`, `@types/d3-zoom`, `@types/d3-selection`. В `tsconfig` включить `"resolveJsonModule": true`. JSON весит ~108 КБ (gzip ~ 40 КБ); при желании вынести `EsdMap` в отдельный чанк через `React.lazy` в фазе 5.

## d3-zoom + React 19

```ts
useEffect(() => {
  const svg = select(svgRef.current!);
  const z = zoom<SVGSVGElement, unknown>()
    .scaleExtent([1, 8])
    .translateExtent([[-200, -200], [w + 200, h + 200]])
    .filter((e) => {
      if (e.type === "wheel") return e.ctrlKey || e.metaKey;
      if (e.type.startsWith("touch")) return e.touches?.length >= 2;
      return !e.button;
    })
    .on("zoom", (e) => setTransform(e.transform));
  svg.call(z);
  zoomRef.current = z;
  return () => { svg.on(".zoom", null); };
}, [w, h]);
```

Центрирование на страну: `const [[x0,y0],[x1,y1]] = path.bounds(feature); const k = Math.min(8, 0.8 / Math.max((x1-x0)/w, (y1-y0)/h)); const t = zoomIdentity.translate(w/2, h/2).scale(k).translate(-(x0+x1)/2, -(y0+y1)/2); svg.transition().duration(600).call(zoomRef.current.transform, t)` — для `transition()` нужен `d3-transition` (импорт побочного эффекта `import "d3-transition"`); при reduced motion вызывать `zoomRef.current.transform(svg, t)` без transition. Добавить `d3-transition` в зависимости.

## Canvas-глобус

Фибоначчи-сфера: `for i in 0..N: y = 1 - (i / (N-1)) * 2; r = sqrt(1 - y*y); theta = phi * i; x = cos(theta)*r; z = sin(theta)*r` где `phi = π(3 − √5)`. Вращение вокруг оси Y с наклоном 23° через матрицу; проекция ортографическая: `sx = cx + x*R, sy = cy - y*R`, точки с `z < 0` рисовать с alpha 0.18 (задняя сторона) или пропускать. Размер точки `1 + (z+1)*0.6`, цвет по широте (`y`) интерполяцией трёх цветов через `d3-interpolate` или ручной lerp в rgb. `ctx.globalCompositeOperation = "lighter"` даёт свечение без shadowBlur на каждой точке (дёшево). DPR ограничить 2. Пауза: `document.visibilitychange`, `IntersectionObserver` на секции, `matchMedia("(prefers-reduced-motion: reduce)")`.

## Луч по кнопке

```css
@property --beam-angle { syntax: "<angle>"; inherits: false; initial-value: 0deg; }
.btn-primary { position: relative; isolation: isolate; }
.btn-primary::before {
  content: ""; position: absolute; inset: -1.5px; border-radius: inherit; z-index: -1;
  background: conic-gradient(from var(--beam-angle), transparent 0deg 238deg, #aad9dc 270deg, #f8eaf4 294deg, #fff 304deg, #f0d3e7 316deg, transparent 346deg);
  animation: beam 3s linear infinite;
}
@keyframes beam { to { --beam-angle: 360deg; } }
```

Кнопка непрозрачным градиентом перекрывает центр, видна только кайма 1.5px. Firefox до 128 не анимирует `@property` — кайма остаётся статичной, это приемлемо.
