# Pitfalls Research

**Domain:** React + Vite лендинг с d3-geo картой, canvas, Tailwind v4, motion, деплой на GitHub Pages
**Researched:** 2026-09-05
**Confidence:** HIGH для деплоя, Tailwind v4 и jsdom; MEDIUM для производительности анимаций (проверяется на устройстве)

## Critical Pitfalls

### Pitfall 1: Россия рвётся на антимеридиане

**What goes wrong:** при `geoMercator()` без поворота Чукотка оказывается на левом краю карты, `fitExtent` растягивает проекцию на весь мир, огоньки Дальнего Востока улетают.
**Why it happens:** стандартная проекция режет мир по 180°, а Россия его пересекает.
**How to avoid:** `geoMercator().rotate([-90, 0])` (или коническая с `rotate([-85,0])`), затем `fitExtent` по FeatureCollection стран ЕАД; проверить тестом, что все 12 центров стран проецируются внутрь вьюбокса.
**Warning signs:** карта выглядит как весь мир мелко; Чукотка слева от Беларуси.
**Phase to address:** 2.

### Pitfall 2: Пустая страница на GitHub Pages из-за base path

**What goes wrong:** `index.html` открывается, ассеты 404, белый экран.
**Why it happens:** сайт живёт по `/esd-onevoice27/`, а Vite собрал пути от корня.
**How to avoid:** `base: "/esd-onevoice27/"` в `vite.config.ts`; ссылки на ассеты только через `import` или `import.meta.env.BASE_URL`; проверять `vite preview` и итоговый URL после деплоя.
**Warning signs:** в консоли 404 на `/assets/...`.
**Phase to address:** 1.

### Pitfall 3: Tailwind v4 настроен как v3

**What goes wrong:** классы не применяются, `@tailwind base` ругается, `tailwind.config.js` игнорируется.
**Why it happens:** v4 перешёл на CSS-конфигурацию.
**How to avoid:** `@import "tailwindcss";` и `@theme { --color-...; --font-... }` в CSS, плагин `@tailwindcss/vite`, без PostCSS-конфига.
**Warning signs:** нет стилей, предупреждения в консоли Vite.
**Phase to address:** 1.

### Pitfall 4: jsdom без IntersectionObserver, ResizeObserver и canvas

**What goes wrong:** тесты компонентов с motion `whileInView`, счётчиками и `GlobeCanvas` падают с `IntersectionObserver is not defined` / `getContext is not a function`.
**Why it happens:** jsdom не реализует эти API.
**How to avoid:** `src/test/setup.ts` с моками: класс `IntersectionObserver` (`observe`, `unobserve`, `disconnect`, `takeRecords`), `ResizeObserver`, `HTMLCanvasElement.prototype.getContext = () => null`, `matchMedia`. В компонентах защищаться от `null` контекста.
**Warning signs:** первая же component-проверка падает до рендера.
**Phase to address:** 1 (setup), далее в каждой фазе.

### Pitfall 5: Деплой падает по правам

**What goes wrong:** `actions/deploy-pages` возвращает 403.
**Why it happens:** нет `permissions: pages: write, id-token: write` или Pages не в режиме workflow.
**How to avoid:** в workflow `permissions: { contents: read, pages: write, id-token: write }`, `environment: github-pages`, `concurrency: pages`. Pages уже включён с `build_type: workflow`.
**Warning signs:** красный job deploy при зелёном build.
**Phase to address:** 1.

### Pitfall 6: SVG с сотнями пульсирующих кружков тормозит

**What goes wrong:** на мобильном скролл дёргается, вентилятор ноутбука ревёт.
**Why it happens:** 900 `<circle>` с `filter: drop-shadow` и бесконечной анимацией `r`/`opacity`.
**How to avoid:** без `filter` на каждом кружке (glow рисовать вторым кружком с низкой непрозрачностью), анимировать только `opacity`/`transform` у ≤40 огоньков, остальные статичны; при `prefers-reduced-motion` анимацию выключить.
**Warning signs:** FPS < 40 в DevTools Performance при скролле к карте.
**Phase to address:** 2, контроль в 5.

## Technical Debt Patterns

| Паттерн | Последствие | Как избежать |
|---|---|---|
| Тексты вшиты в JSX | нельзя быстро поправить копирайт | все строки в `data/copy.ts` |
| Магические цвета в классах | расползание палитры | только токены `@theme` |
| Один `index.css` на 2 000 строк | никто не найдёт keyframes | `tokens.css`, `global.css`, стили секций рядом с компонентами |

## Integration Gotchas

| Интеграция | Ловушка | Решение |
|---|---|---|
| world-atlas JSON | TypeScript не знает тип импорта | `declare module "world-atlas/*.json"` или `import ... with { type: "json" }` + `Topology` из `@types/topojson-specification` |
| YouTube превью | `maxresdefault.jpg` есть не у всех роликов | использовать `hqdefault.jpg` (480×360), масштабировать `object-fit: cover` |
| Google Fonts | FOUT на кириллице | `display=swap`, `font-display` уже в ссылке; preconnect к `fonts.gstatic.com` |
| d3-zoom и скролл страницы | колесо мыши над картой зумит вместо скролла | `zoom.filter(e => e.type !== "wheel" || e.ctrlKey || e.metaKey)`, подсказка «⌘ + scroll», как в оригинале; на touch разрешать только два пальца |
| `@property --beam-angle` | Firefox старше 128 не анимирует угол conic-gradient | fallback: статичная граница, эффект декоративный |

## Performance Traps

| Ловушка | Решение |
|---|---|
| `backdrop-filter: blur` на десятках карточек | blur только на header и 3–6 карточках во вьюпорте, остальным полупрозрачный фон |
| rAF глобуса крутится за экраном | останавливать при `document.hidden` и когда hero вне вьюпорта |
| motion на каждом элементе списка | `staggerChildren` на контейнере, не 50 отдельных `whileInView` |

## Security Mistakes

Статический сайт без бэкенда. Единственное: `youtube-nocookie.com` для iframe и `rel="noopener noreferrer"` на внешних ссылках.

## UX Pitfalls

| Ловушка | Решение |
|---|---|
| Форма «отправляется» без ответа | тост `role="status"` + видимый новый огонёк + счётчик |
| Градиентный заголовок обрезает нижние выносные элементы | `padding-bottom: 0.1em` и `line-height ≥ 1.05` у `background-clip: text` |
| Скошенные секции оставляют «дырки» фона | фон родителя тот же тёмный, `clip-path` только на внутреннем слое |
| Бургер-меню без Esc и фокус-трапа | `dialog`-подобное поведение, `aria-expanded`, блокировка скролла |

## "Looks Done But Isn't" Checklist

- [ ] Открыт итоговый URL на Pages, не только `vite preview`
- [ ] Консоль без ошибок и без 404
- [ ] Мобильный 390px: меню, карта (два пальца), форма
- [ ] `prefers-reduced-motion: reduce` не ломает раскладку (секции видны без скролл-анимаций)
- [ ] Все 12 чипов стран центрируют карту, огоньки внутри границ
- [ ] Тесты и билд зелёные в CI, не только локально

## Recovery Strategies

| Проблема | Откат |
|---|---|
| Vite 8 несовместим с плагином Tailwind или Vitest | Vite 7 |
| d3-zoom конфликтует с React 19 StrictMode (двойной effect) | снимать обработчик в cleanup, идемпотентная инициализация |
| Onest не грузится | стек `"Onest", "Noto Sans", sans-serif` |

## Pitfall-to-Phase Mapping

| Фаза | Ловушки |
|---|---|
| 1 | base path, Tailwind v4, jsdom-моки, права deploy-pages |
| 2 | антимеридиан, производительность огоньков, колесо мыши vs скролл |
| 3 | обратная связь формы, jsdom для формы |
| 4 | YouTube-превью, внешние ссылки |
| 5 | reduced motion, backdrop-filter, мобильная проверка, чеклист выше |

## Sources

- Опыт деплоя Vite на GitHub Pages (`base`, deploy-pages permissions) — HIGH
- Tailwind v4 миграция (`@import "tailwindcss"`, `@theme`) — HIGH
- d3-geo `rotate` + `fitExtent` для регионов через 180° — HIGH
- jsdom ограничения (IntersectionObserver, canvas) — HIGH
- Производительность SVG-анимаций — MEDIUM, замерить на устройстве в фазе 5
