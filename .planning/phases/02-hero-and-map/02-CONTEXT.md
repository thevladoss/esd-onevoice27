# Phase 2: Hero и карта - Context

**Gathered:** 2026-09-05
**Status:** Ready for planning
**Mode:** Smart discuss (autonomous), рекомендованные ответы приняты автоматически, пользователь недоступен

<domain>
## Phase Boundary

Фаза заменяет заглушки `Hero` и `MapSection` из фазы 1 на готовые секции: hero с canvas-глобусом из частиц, звёздным полем, градиентным H1 и кнопкой с лучом; секция карты со скошенными краями, SVG-картой ЕАД на d3-geo, огоньками, счётчиками с count-up и чипами стран. Добавляет `LightsProvider` (контекст огоньков и счётчиков), моки стран и огоньков, чистые функции в `lib/` и их тесты. Форма (`#light-form`) остаётся заглушкой до фазы 3, но контекст уже экспортирует `addLight`.

Требования: HERO-01, HERO-02, HERO-03, MAP-01, MAP-02, MAP-03, MAP-04, MAP-05, MAP-06, QA-01.

</domain>

<decisions>
## Implementation Decisions

### Hero
- Раскладка: `min-height: clamp(600px, 92vh, 820px)`, контент прижат к низу слева (`justify-end`), колонка текста `max-w-3xl`, padding-inline `clamp(20px, 4vw, 48px)`, padding-bottom `clamp(48px, 9vh, 104px)`, верх отдан под header. Фон `#070210`, поверх него `Starfield`, затем `GlobeCanvas`, затем скрим `linear-gradient(180deg, rgb(7 2 16 / .2), rgb(7 2 16 / .92))` и виньетка.
- Тексты (в `data/copy.ts`): eyebrow «Единое глобальное движение»; H1 «Вместе, единым голосом»; подзаголовок «Единая весть. Евро-Азиатский дивизион присоединяется к всемирному движению: один человек и одна группа за раз.»; CTA «Зажечь свой свет» → `#light-form`.
- H1: Onest 900, размер `clamp(2.75rem, 8vw, 4.5rem)` на мобильном и `clamp(3.75rem, 5.4vw, 5.5rem)` от 1024px, letter-spacing -0.055em, line-height 0.94, градиент оригинала `linear-gradient(90deg, #d28ebe 0%, #bb6cae 7%, #9e439a 17%, #943393 22%, #713d98 32%, #4a489e 45%, #3b4da1 52%, #3d54a2 60%, #436ba4 71%, #4e90a9 83%, #54a4ac 89%, #7bc2c7 100%)`, `background-clip: text`, `padding-bottom: .12em` от обрезки выносных.
- `GlobeCanvas`: canvas на всю секцию, `mix-blend-mode: screen`, opacity .72; ~1800 точек на сфере (фибоначчи-распределение), центр в 72% ширины и 46% высоты, радиус `min(width, height) * 0.46`; вращение 0.0008 рад/кадр вокруг наклонённой оси; точки на передней половине ярче, размер 1–2.2px; цвет по широте от `#d28ebe` (север) через `#3b4da1` к `#7bc2c7` (юг); каждая 12-я точка со свечением (`shadowBlur 8`); поверх — 3 тонкие орбитальные дуги opacity .18. Останавливается при `prefers-reduced-motion` (рисует один статичный кадр), при `document.hidden` и когда hero вне вьюпорта (IntersectionObserver); `devicePixelRatio` ограничен 2; `ResizeObserver` для размеров.
- `Starfield`: два CSS-слоя `radial-gradient` точек размером 1–1.5px с `background-size` 180px и 320px, медленный дрейф 120s только вне reduced motion; плюс 3 мягких пятна атмосферы (`radial-gradient` signal-900/.25, unity-800/.15) как в `--ov-hero-atmosphere-*`.
- CTA-луч (HERO-03): `@property --beam-angle { syntax: "<angle>"; inherits: false; initial-value: 0deg }`; у `Button` variant `primary` `::before` с `inset: -1.5px`, `border-radius: inherit`, фон `conic-gradient(from var(--beam-angle), transparent 0deg 238deg, #aad9dc 270deg, #f8eaf4 294deg, #fff 304deg, #f0d3e7 316deg, transparent 346deg)`, маска `padding-box`/`border-box` через `-webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)` и `mask-composite: exclude`; анимация `beam 3s linear infinite` до `360deg`; текстура точек `radial-gradient` 7px/0.8px opacity .42 поверх градиента; hover поднимает на 1px и усиливает тень; без анимации в `@supports not (background: conic-gradient(from 1deg, #000, #000))` и при reduced motion.

### Секция карты
- Оболочка `#map`: фон `#070210` с радиальными пятнами (`--ov-map-*`), верхний и нижний скосы глубиной 46px через `clip-path: polygon(0 46px, 100% 0, 100% calc(100% - 46px), 0 100%)` у внутреннего слоя; над картой центрированный блок текста: eyebrow «Все вместе», H2 «Зажигаем свет по всему дивизиону» (Onest 900, `text-3xl md:text-4xl lg:text-5xl`, цвет paper).
- Контейнер карты: высота `clamp(520px, 70vh, 880px)`, `touch-action: pan-y` (двумя пальцами перехватывает d3-zoom), курсор grab; подсказка «⌘/Ctrl + колесо — масштаб, два пальца — перемещение» мелким текстом в углу.
- `EsdMap` (SVG, `viewBox` по размеру контейнера через `ResizeObserver`): проекция `geoMercator().rotate([-90, 0])` (разрыв уходит в Атлантику, Чукотка целая), `fitExtent([[24, 24], [w - 24, h - 24]], esdCollection)`; `world-atlas/countries-110m.json` конвертируется один раз в `lib/geo.ts` (`feature(topology, topology.objects.countries)`); страны ЕАД по numeric id: 643 Россия, 112 Беларусь, 498 Молдова, 268 Грузия, 051 Армения, 031 Азербайджан, 398 Казахстан, 417 Кыргызстан, 762 Таджикистан, 795 Туркменистан, 860 Узбекистан, 004 Афганистан. Заливка ЕАД `rgb(59 77 161 / .55)`, остальные страны `rgb(33 26 62 / .55)`, границы `rgb(184 192 230 / .28)` 0.6px (`vector-effect: non-scaling-stroke`), фон океана прозрачный (виден фон секции).
- Огоньки: слой `<g>` после стран; каждый огонёк — `<circle r=2.2>` ядро (люди `#d28ebe`, группы `#7bc2c7`) плюс `<circle r=6 opacity=.22>` гало того же цвета; без `filter`. Класс `pulse` у каждого 24-го огонька (≈40 штук): `@keyframes light-pulse { 0%,100% { transform: scale(1); opacity: .9 } 50% { transform: scale(1.8); opacity: .45 } }` 2.4s с разными `animation-delay`, `transform-box: fill-box; transform-origin: center`; выключено при reduced motion. Новый огонёк из формы получает класс `pulse` и `is-new` (кольцо расходится один раз).
- Zoom/pan (MAP-05): `d3-zoom` `scaleExtent([1, 8])`, `translateExtent` по размеру контейнера с запасом 200px, `filter`: колесо только с `ctrlKey || metaKey`, touch только при `event.touches.length >= 2`, drag мышью разрешён; transform хранится в `useState` и применяется к общему `<g>`; при реинициализации (StrictMode) обработчики снимаются в cleanup.
- Чипы (MAP-06): ряд `flex-wrap` под заголовком: «Весь дивизион» плюс 12 стран; кнопки-пилюли `GlassCard`-стиля 40px высотой, Noto Sans 700 12px uppercase letter-spacing .08em; активный чип с градиентом `linear-gradient(125deg, #6c2c68, #3b4da1)`; `role="tablist"`-подобная семантика через `aria-pressed`; клик вычисляет bbox страны через `geoPath.bounds(feature)`, целевой масштаб `min(8, 0.8 / max(dx/w, dy/h))`, плавный переход 600ms через `rAF` и `d3-interpolate`-подобную линейную интерполяцию transform (или `zoom.transform` без transition); при reduced motion мгновенно. «Весь дивизион» возвращает `zoomIdentity`.
- Счётчики (MAP-04): две `GlassCard` 240px шириной поверх карты сверху по центру на десктопе (absolute, `top: 88px`), на мобильном строкой над картой; подпись с точкой-индикатором «ЧЕЛОВЕК» / «ГРУПП», число Onest 900 56–72px цветом `#d28ebe` / `#7bc2c7`; `useCountUp(target, 1600ms, easeOutCubic)` стартует один раз при `IntersectionObserver` (threshold .4), при reduced motion сразу конечное значение; `formatCount` вставляет неразрывный тонкий пробел между тысячами (`4 268`); `aria-live="polite"` на числе, реальный текст (не canvas).

### Данные и состояние
- `data/countries.ts`: `EsdCountry { id: number; code: "RU" | ...; name: string; weight: number; center: [lon, lat] }`; веса распределения: RU .55, KZ .08, BY .07, MD .06, UZ .05, KG .04, TJ .03, GE .03, AM .03, AZ .02, TM .02, AF .02.
- `lib/geo.ts`: `loadWorld()` (синхронный импорт JSON), `esdFeatures`, `makeProjection(w, h)`, `randomPointIn(feature, rng)` — rejection sampling в bbox с `geoContains`, максимум 50 попыток, fallback центр страны; `mulberry32(seed)`.
- `data/lights.ts`: `generateLights(seed = 27, people = 694, groups = 248): Light[]` где `Light { id: string; type: "person" | "group"; countryId: number; lon: number; lat: number; isNew?: boolean }`; распределение по странам через веса с округлением так, чтобы суммы сошлись точно.
- `state/lights.tsx`: `LightsProvider` с `useReducer` (`{ lights }`), действия `add`, селекторы `counts` (`people`, `groups`), хук `useLights()`; `addLight({ type, countryId })` ставит координату центра страны с детерминированным сдвигом ±1.2° по индексу. Провайдер оборачивает `App` уже в этой фазе.
- Тесты (QA-01): `format.test.ts` (`694 → "694"`, `4268 → "4 268"`, `1150 → "1 150"`), `geo.test.ts` (генератор детерминирован при одном seed; все точки внутри своей страны по `geoContains`; 12 центров стран проецируются внутрь `[0,w]×[0,h]` без NaN), `lights.reducer.test.ts` (add увеличивает нужный счётчик, id уникальны), `Counters.test.tsx` (при reduced motion показывает конечное значение), `CountryChips.test.tsx` (клик меняет `aria-pressed`).

### Claude's Discretion
- Точная плотность звёзд, параметры орбитальных дуг глобуса, стиль подсказки про жесты, easing переходов зума.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- Из фазы 1: `Section`, `Eyebrow`, `GradientTitle`, `Button` (primary/ghost), `GlassCard`, токены `@theme`, `data/copy.ts`, тестовый setup с моками IntersectionObserver/ResizeObserver/canvas.
- Исследование: `docs/research/orig-vp-0.jpeg`, `orig-vp-900.jpeg` (hero и карта оригинала), `docs/research/orig-custom-styles.css` (`--ov-hero-*`, `--ov-map-*`, `.ov-map-skew-mask`).

### Established Patterns
- Токены в `@theme`, тексты в `data/copy.ts`, компонент = папка секции, тесты рядом (`*.test.ts(x)`), d3 считает, React рендерит.

### Integration Points
- `App.tsx` уже импортирует `Hero` и `MapSection` из их папок; заменяются файлы, не `App.tsx`. `LightsProvider` добавляется в `main.tsx` вокруг `App`.
- `Button` из фазы 1 расширяется лучом (`::before`), стиль остаётся в `global.css`.

</code_context>

<specifics>
## Specific Ideas

- Визуальный ориентир hero: `docs/research/orig-vp-0.jpeg` (глобус справа, текст слева внизу, пилюля header сверху). Карта: `docs/research/orig-vp-900.jpeg` (фиолетовые континенты, точки двух цветов с гало, счётчики стеклом).
- Счётчики стартуют с реальных значений ЕАД: 694 человека, 248 групп (esd-map.vercel.app на 2026-09-05).

</specifics>

<deferred>
## Deferred Ideas

- Кнопки «+»/«−»/«Сбросить» на карте — v2 (POLISH-03).
- Автоцентрирование на новом огоньке после формы — v2 (POLISH-02).
- Reveal-анимации секции — фаза 5.

</deferred>
