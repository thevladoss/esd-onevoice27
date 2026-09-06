# Requirements: Единый голос 27 — лендинг ЕАД, milestone v1.2

**Defined:** 2026-09-06
**Core Value:** Посетитель открывает страницу и видит красивый, живой лендинг уровня оригинала onevoice27.org, но про ЕАД: узнаёт, что такое «Единый голос 27», видит карту движения по дивизиону и может «зажечь свой свет».

Источник: `docs/superpowers/specs/2026-09-06-mobile-hero-perf-v1.2-design.md` (точные значения CSS,
параметры скрипта частиц, бюджеты fps), замеры `docs/research/v1.2/measurements.md`. Идентификаторы
не пересекаются с milestone v1.1 (там были GLASS/MAP/FORM/MEDIA/RES/FOOT/QA).

## v1 Requirements

### Глобус hero (GLOBE)

- [ ] **GLOBE-01**: Посетитель видит на первом экране видео глобуса оригинала: `<video autoPlay muted loop playsInline preload="auto" disablePictureInPicture disableRemotePlayback tabIndex={-1} aria-hidden data-anim="globe">` с источниками `hero-globe.webm` и `hero-globe.mp4` из `public/` по `import.meta.env.BASE_URL`; `muted` продублирован через ref до `play()`; `GlobeCanvas.tsx`, `globe.ts` и их тесты удалены
- [ ] **GLOBE-02**: Видео стоит и выглядит как у оригинала на трёх брейкпоинтах: до 640px `object-fit: cover; object-position: center center; filter: saturate(1.18) contrast(1.28) brightness(0.96)`; от 640px `object-position: 72% center; transform-origin: 72% 46%`; от 1280px `width: auto; max-width: min(100%, 1920px); aspect-ratio: 16 / 9; margin-left: auto; object-fit: contain; object-position: right top; mix-blend-mode: screen` и двойная `mask-image` с `mask-composite: intersect` (плюс `-webkit-` варианты); обёртка `.hero__video` absolute inset 0, z 0, flex-колонка `align-items: flex-end`
- [ ] **GLOBE-03**: Высота hero как у оригинала: `min-height: 100svh`, от 768px `max(600px, 65svh)`, от 1024px `max(600px, 64vh)`; колонка текста, отступы, кегли, градиент H1 и `.hero::after` не меняются
- [ ] **GLOBE-04**: Поверх видео живут canvas-частицы, портированные один к одному из `docs/research/v1.2/orig-hero-motion.js` (`HeroParticles.tsx` + чистый `heroParticles.ts`): 30 fps, `elapsed` ≤ 40 мс, dpr ≤ 1,75, статичное поле с `seededRandom(270927)` на offscreen-canvas (dpr ≤ 1,25, счёт `min(max, max(140, round(w·h/3600)))`, max 220/340/520), живые частицы `min(max, max(48, round(w·h/12000)))` (max 70/100/140, доля «справа» 0,58 и 0,62 на десктопе), три туманности, падающие звёзды каждые 4,2–9,2 с, `screen`, лучи при `flare > .34`; палитра литералами light `248 247 251`, signal `227 175 210`, unity `184 192 230`, horizon `170 217 220`; canvas `data-anim="stars"`, absolute inset 0, z 1, `opacity: .72; mix-blend-mode: screen`
- [ ] **GLOBE-05**: Частицы и видео экономят ресурсы: `ResizeObserver` на canvas, `IntersectionObserver` на секции с `rootMargin: "100px"`, `visibilitychange`, слушатель `prefers-reduced-motion`; вне экрана, в скрытой вкладке и при reduce цикл остановлен и нарисован один статичный кадр; при reduce видео на паузе на первом кадре, при снятии reduce — `play()`
- [ ] **GLOBE-06**: `Starfield.tsx`, слои `.starfield__*` и keyframes `star-drift*` удалены; значения реестра `stars` (canvas) и `globe` (видео) остаются в коде, `motionPolicy.test.ts` проходит без правок
- [ ] **GLOBE-07**: Тесты и гейт: `Hero.test.tsx` проверяет видео с двумя источниками под `BASE_URL`, атрибуты автовоспроизведения и `data-anim`; `heroParticles.test.ts` проверяет чистые функции (счёт звёзд и частиц по ширине, воспроизводимость `seededRandom`, цвет из палитры, пропуск кадра раньше 33 мс); `HeroParticles.test.tsx` — без 2d-контекста компонент не падает и не запускает rAF; `scripts/check-dist.mjs` проверяет наличие `hero-globe.webm`/`.mp4` в `dist/` и ссылки на них в JS
- [ ] **GLOBE-08**: При `navigator.connection.saveData === true` источники видео не подключаются, остаются фон `#070210` и частицы; иначе `preload="auto"` как у оригинала

### Огоньки карты (LIGHT)

- [ ] **LIGHT-01**: Огоньки рисует `LightsCanvas.tsx` (чистый модуль `lightsCanvas.ts`): `<canvas class="map-lights-canvas" data-anim="pulse" aria-hidden>` внутри `.esd-map` поверх SVG, absolute inset 0, `pointer-events: none`, dpr ≤ 2; из SVG удалены `.map-lights`, корзины, `.light-core`, `.light-ring`, `<defs>` с градиентами и соответствующие правила `map.css` (`@property --halo-k`, `.light-*`, `light-breathe`, `light-arrive`)
- [ ] **LIGHT-02**: Свечение как у оригинала: спрайты ореола (радиальный градиент от цвета alpha .9 к 0, радиус 12px) и ядра (2,2px, белая обводка .9px alpha .5) для `person` `rgb(158 67 154)` и `group` `rgb(84 164 172)`; каждый кадр пять корзин рисуются с `globalAlpha = .30 + .30·s` и радиусом ореола `7 + 5·s` px, `s = (1 + sin(2π·t/2600 − 2π·n/5)) / 2`, ядра с alpha 1
- [ ] **LIGHT-03**: Огоньки не отстают от стран при зуме и панораме: позиция `transform.apply([x, y])`, размер спрайта от масштаба не зависит, `handleFrame` в `EsdMap.tsx` вызывает `draw(transform)` немедленно в каждом кадре жеста и полёта
- [ ] **LIGHT-04**: Цикл дыхания идёт на 30 fps и останавливается по `IntersectionObserver` (threshold 0) на контейнере карты, по `document.hidden` и при `prefers-reduced-motion`; при reduce один статичный кадр: ореол 9px alpha .22, ядра обычные, без колец
- [ ] **LIGHT-05**: Новый огонёк после отправки формы получает кольцо 1px цвета огонька: 900 мс, радиус 6→20,4px, alpha .5→0 по `cubic-bezier(.16, 1, .3, 1)`, одна прокрутка, на это время цикл на полной частоте rAF; в `motionPolicy.test.ts` значение `new-light` остаётся в реестре, но выходит из списка обязательных
- [ ] **LIGHT-06**: Canvas несёт `data-light-count`, `data-people`, `data-groups`, `data-new`, обновляемые при каждом изменении `lights`; без 2d-контекста (jsdom) атрибуты ставятся, рисование и rAF пропускаются; `EsdMap.test.tsx` и `App.seams.test.tsx` переведены с подсчёта `.light-core`/`.light-bucket` на атрибуты, проверки `map.css` заменены проверками констант `lightsCanvas.ts` (2600 мс, 5 корзин, радиусы 7–12, alpha .30–.60)
- [ ] **LIGHT-07**: Бюджет: на 390×844 при CPU×4 hero, карта и форма держат ≥ 55 fps; на 1440×900 без троттлинга ≥ 100 fps; число узлов SVG на странице < 1300

### Мобильная адаптация (MOB)

- [ ] **MOB-01**: Ссылки футера — цели касания ≥ 44px: `.site-footer__links a { display: inline-flex; align-items: center; min-height: 44px; padding-inline: 8px }`, интервал списка уменьшен на ту же величину, столбец выглядит как раньше
- [ ] **MOB-02**: Чекбокс согласия (`ConsentCheckbox.tsx`): label `min-height: 44px; display: flex; align-items: center; gap: 12px`, input 20×20 с `margin: 0`, нажатие по всей label
- [ ] **MOB-03**: Превью новостей (`NewsCard.tsx`): все `<img>` с `width="480" height="360"` и `decoding="async"`; первая карточка `loading="eager"` и `fetchPriority="high"`, остальные `lazy`; `object-fit: cover` и `coverZoom` без изменений
- [ ] **MOB-04**: Подпись логотипа «МИССИЯ ДЛЯ ВСЕХ» в шапке на узком экране .625rem вместо .5625rem, `letter-spacing` прежний

### Интеграция и приёмка (SHIP)

- [ ] **SHIP-01**: После слияния фаз 14–16 проходит гейт: `npx tsc -b`, `npm test`, `npm run lint`, `npm run build`, `node scripts/check-dist.mjs`; единственный блок reduce в `global.css` и закрытый реестр `data-anim` не нарушены
- [ ] **SHIP-02**: Сборка опубликована на GitHub Pages, sha256 файлов прода совпадает с `dist/`
- [ ] **SHIP-03**: Playwright-приёмка на 1440×900 и 390×844: видео воспроизводится (`!paused`, `currentTime` растёт), размер и `object-fit` видео совпадают с оригиналом, canvas частиц держит 30 fps; таблица fps по секциям с CPU×4 против бюджета LIGHT-07; аудит целей касания без элементов ниже 44px (кроме визуально скрытых radio); скриншоты hero и карты рядом с оригиналом в `docs/qa/v12-*.jpeg`
- [ ] **SHIP-04**: `docs/qa/SMOKE.md` получает раздел «Фаза 17 / v1.2» с таблицами «оригинал / прод» и принятыми отклонениями; milestone закрыт аудитом, архивом и тегом `v1.2`

## v2 Requirements

Бэклог без изменений с v1.1: фото-обложки триптиха и новостей; Lighthouse-аудит и OG-превью картинкой;
параллакс триптиха; автоцентрирование карты на новом огоньке и кнопки зума; плеер официальной песни ЕАД;
реальная отправка формы и бэкенд; единый браузерный E2E-тест «валидная отправка формы → новый огонёк».

## Out of Scope

| Feature | Reason |
|---------|--------|
| WebGL-карта (Mapbox/MapLibre) как у оригинала | нужны токены или тайлы; canvas-оверлей огоньков даёт тот же fps на нашей SVG-карте |
| Собственный рендер видео глобуса (three.js, cobe) | видеофайл оригинала скачан, GPU-декодер дешевле любого рендера |
| Постер для видео | у оригинала постера нет, фон `#070210` закрывает первые кадры |
| Изменение контента и раскладки текста hero | пользователь просил только глобус, лаги и мобильную адаптацию |
| Lighthouse-аудит и OG-превью | бэклог v2 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| GLOBE-01 | — | Pending |
| GLOBE-02 | — | Pending |
| GLOBE-03 | — | Pending |
| GLOBE-04 | — | Pending |
| GLOBE-05 | — | Pending |
| GLOBE-06 | — | Pending |
| GLOBE-07 | — | Pending |
| GLOBE-08 | — | Pending |
| LIGHT-01 | — | Pending |
| LIGHT-02 | — | Pending |
| LIGHT-03 | — | Pending |
| LIGHT-04 | — | Pending |
| LIGHT-05 | — | Pending |
| LIGHT-06 | — | Pending |
| LIGHT-07 | — | Pending |
| MOB-01 | — | Pending |
| MOB-02 | — | Pending |
| MOB-03 | — | Pending |
| MOB-04 | — | Pending |
| SHIP-01 | — | Pending |
| SHIP-02 | — | Pending |
| SHIP-03 | — | Pending |
| SHIP-04 | — | Pending |

**Coverage:**
- v1 requirements: 23 total
- Mapped to phases: 0
- Unmapped: 23 ⚠️ (заполняется при создании roadmap)

---
*Requirements defined: 2026-09-06*
*Last updated: 2026-09-06 after initial definition*
