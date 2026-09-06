# Phase 8: Лента карты и дышащие огоньки — Context

**Gathered:** 2026-09-06
**Status:** Ready for planning
**Source:** правки пользователя (пункт 2: кривые срезы карты, огоньки пропадают и мигают, карта грузится некорректно) + спецификация v1.1, раздел 2; слои Mapbox оригинала сняты через `map.getStyle()`

<domain>
## Phase Boundary

Лента `.map-band` (карта + форма на одной скошенной подложке), орбы, удаление reveal вокруг карты, огоньки с дышащим свечением в пяти корзинах, производительность. Не трогать `src/components/form/*`, `global.css`, `primitives.css`.
</domain>

<decisions>
## Implementation Decisions

### Лента
- Новый `MapBand.tsx` рендерит `<MapSection />` и `<LightForm />` внутри `<div className="map-band">`; `App.tsx` подключает `MapBand` вместо пары. Секции остаются `<section id="map">` и `<section id="light-form">` (тесты App ищут их по id).
- Подложка ленты: `::before` с `background: rgb(18 12 52)` и `clip-path: polygon(0 var(--map-wedge), 100% 0, 100% 100%, 0 100%)`; лента несёт `margin-top: calc(0px - var(--map-wedge) - 1px)`, `isolation: isolate`, `overflow-x: clip`. `.map-section` теряет `margin-top`, `.map-section__skew` и `overflow-x: clip`; `.map-section::before` (три ореола у верхней кромки) остаётся.
- Правила `.map-band .lf-section { background: transparent }` и `.map-band .lf-section::before { content: none }` живут в `map.css` (форму правит фаза 9 параллельно; после слияния правила становятся no-op).
- Нижний орб: якорь — нижний край `.map-section` (секция заканчивается низом карты), `right: 0; transform: translate(38%, -50%)`, z-index выше подложки ленты и ниже контента; вертикаль не клипуется ни секцией, ни формой. На <768px — полоса во всю ширину, как сейчас.
- Проверка MAP-03 (отсутствие второй линии) — скриптом Playwright по пиксельным выборкам; описать в SUMMARY как воспроизводимую команду для фазы 13.

### Огоньки
- Модель оригинала: ядро (`circle-radius` 2.24 при zoom 1, обводка белая 0.96px, opacity .5) + пять glow-слоёв с `circle-blur: 1`, радиусами ~7–12 и opacity ~.30–.60, которые непрерывно меняются во времени; признак `b` 0–4 раскладывает огоньки по корзинам с разной фазой.
- У нас: `<g class="light-bucket" data-bucket="n">` × 5 внутри `.map-lights`; ореол — `<circle>` с `fill="url(#light-halo-person|group)"` (радиальный градиент: цвет с alpha .9 в центре → прозрачный на краю). `@property --halo-k { syntax: "<number>"; inherits: true; initial-value: 1 }` объявляется в `map.css`; keyframes на группе меняют `--halo-k` (1 → 2 → 1) и `opacity` (.30 → .60 → .30), период 2.6s, `animation-delay: calc(-2.6s * n / 5)`; радиус ореола `r: calc(var(--light-halo-r) * var(--halo-k) / var(--zoom-k))`, где `--light-halo-r: 6px`. Fallback: `@supports not (animation-timeline: auto)` не годится — использовать проверку `CSS.registerProperty`/`@property` через `@supports (background: paint(x))`? Нет: проще всегда объявлять `@property`, а в keyframes держать и opacity, и `--halo-k`; браузер без `@property` проигнорирует незарегистрированное свойство и анимирует только opacity. Это и есть fallback.
- Цвета огоньков: `--light-person: rgb(158 67 154)`, `--light-group: rgb(84 164 172)`; ядро 2.2px `fill: currentColor`, `stroke: #fff; stroke-width: .9px; stroke-opacity: .5`.
- Удалить `light-pulse` и `PULSE_EVERY`; `is-new` + `light-arrive` оставить. Экспортируемые константы обновить вместе с тестами.
- Замер fps: скрипт rAF за 2 с на 1440×900 в Chrome (Playwright), при закрытых WebGL-вкладках; порог 50 fps. Если ниже — убрать анимацию `--halo-k`, оставить opacity. Результат замера в SUMMARY.
- Reduced motion: `animation: none`, ореол статичный opacity .45.

### Загрузка
- Reveal вокруг `.map-container` убрать; `Reveal` у заголовка и `RevealGroup` счётчиков остаются. Ничего асинхронного добавлять не нужно (world-atlas уже в статическом чанке).

### Claude's Discretion
- Точный z-index орбов и слоёв, структура `MapBand.test.tsx`, способ измерения fps.
</decisions>

## Canonical References

- `docs/superpowers/specs/2026-09-06-design-fixes-v1.1-design.md` — спецификация с точными значениями CSS оригинала (раздел 2 (MAP)); при расхождении с любым другим документом побеждает спецификация
- `.planning/ROADMAP.md` — фаза 8: критерии успеха, список файлов во владении, правила параллельной работы (фазы 7–12 идут одновременно в разных worktree от одного `main`)
- `docs/research/v1.1/orig-rules.css` и `orig-vars.txt` — правила и переменные оригинала; `dom-*.html` — разметка; скриншоты `orig-*.jpeg`
- `docs/qa/SMOKE.md` — как принимались прошлые фазы (Playwright на 1440×900 и 390×844)

## Правила фазы

- Редактировать только файлы из списка **Files** фазы 8 в ROADMAP.md. Чужие файлы не трогать даже ради одной строки; правило для чужого селектора класть в свой CSS-файл.
- Цвета в CSS писать литералами `rgb(r g b / a)` из спецификации: токены `--color-midnight-*` проекта сдвинуты на шаг относительно палитры оригинала.
- Тесты в той же фазе, что и код; `npm test` по затронутым файлам зелёный до завершения плана; `npx tsc -b` и `npm run lint` без ошибок.
- Весь пользовательский текст на русском, идентификаторы на английском. Комментарии в коде на русском, как в проекте.
- Reduced motion: единственный блок `@media (prefers-reduced-motion: reduce)` живёт в `src/styles/global.css` (тест `src/styles/motionPolicy.test.ts`); в CSS фазы такой блок не заводить. Декоративные петли помечать существующими значениями `data-anim` из закрытого реестра (stars, globe, beam, pulse, new-light, particles, atmosphere, wave, halo), новых значений не добавлять; переходы гасит глобальное правило `transition-duration: 0.01ms`.

## Deferred Ideas

- Всё из бэклога v2 (`.planning/PROJECT.md`, «Key context») остаётся вне фазы.
