# Milestone v1.2 — мобильная адаптация, глобус оригинала и производительность

Дата: 2026-09-06. Три правки пользователя: «проверь адаптацию и оптимизацию на мобильные устройства»,
«земной шарик в самом верху на оригинальном сайте лучше и сильно другой, сделай нам точно такой же»,
«периодически сайт подлагивает с анимациями, и карта постоянно лагает, в оригинале таких проблем нет».

Основа: замеры прода и оригинала в `docs/research/v1.2/measurements.md`, скрипт частиц оригинала
`docs/research/v1.2/orig-hero-motion.js`, CSS hero оригинала из `docs/research/v1.1/orig-rules.css`
и дампа `all.css`, скриншоты `orig-hero-1440.jpeg` и `orig-hero-390.jpeg`. Контент не меняется.
Объём — рабочий прототип.

Диагноз лагов. На десктопе hero, карта и форма держат 65–69 fps при 120 у остальных секций; в
мобильной эмуляции с CPU×4 те же три секции падают до 30 fps, оригинал в тех же условиях даёт 117.
Причины две: canvas-глобус рисует 2200 точек на кадр при dpr до 2, а карта держит 1884 круга SVG,
пять из которых анимируют opacity, и перерисовывает все 942 ореола каждый кадр. Форма лагает потому,
что карта над ней продолжает дышать, пока видна хотя бы частью. У оригинала глобус — видеофайл (декодер
GPU) плюс лёгкий canvas на 30 fps, а огоньки живут в WebGL.

## 1. GLOBE — глобус как в оригинале

- GLOBE-01. `GlobeCanvas.tsx`, `globe.ts` и их тесты удаляются. Вместо них в `Hero.tsx` появляется
  обёртка `.hero__video` с `<video>`: `autoPlay muted loop playsInline preload="auto"
  disablePictureInPicture disableRemotePlayback tabIndex={-1} aria-hidden="true" data-anim="globe"`,
  источники `${import.meta.env.BASE_URL}hero-globe.webm` (`video/webm`) и `hero-globe.mp4` (`video/mp4`).
  Файлы уже лежат в `public/`. Атрибут `muted` дублируется через ref (`video.muted = true`) до
  `play()`: React не всегда пишет его в DOM, а без него автовоспроизведение на iOS не стартует.
- GLOBE-02. Стили обёртки и видео из оригинала. Обёртка `.hero__video { position: absolute; inset: 0;
  z-index: 0; overflow: hidden; pointer-events: none; display: flex; flex-direction: column;
  align-items: flex-end; justify-content: flex-start }`. Видео базово (до 640px):
  `display: block; width: 100%; height: 100%; max-width: none; object-fit: cover;
  object-position: center center; transform: scale(1); transform-origin: center center;
  filter: saturate(1.18) contrast(1.28) brightness(0.96)`. От 640px (`min-width: 40rem`):
  `object-position: 72% center; transform-origin: 72% 46%`. От 1280px (`min-width: 80rem`):
  `width: auto; max-width: min(100%, 1920px); aspect-ratio: 16 / 9; margin-left: auto;
  object-fit: contain; object-position: right top; mix-blend-mode: screen;
  mask-image: linear-gradient(to right, transparent 0%, rgb(0 0 0 / .35) 4%, black 14%),
  linear-gradient(black 0%, black 76%, transparent 100%); mask-composite: intersect`
  (с `-webkit-mask-image` и `-webkit-mask-composite: source-in`). Фон секции остаётся `#070210`.
- GLOBE-03. Высота hero как у оригинала: `.hero { min-height: 100svh }`; от 768px
  `min-height: max(600px, 65svh)`; от 1024px `min-height: max(600px, 64vh)`. Текущий
  `clamp(600px, 92vh, 820px)` снимается. Раскладка колонки текста (`.hero__content`, отступы, кегли,
  градиент H1, `.hero::after`) не меняется.
- GLOBE-04. Частицы: новый компонент `HeroParticles.tsx` с `<canvas class="hero__particles"
  data-anim="stars" aria-hidden="true">` и чистый модуль `heroParticles.ts` — порт
  `orig-hero-motion.js` один к одному: интервал кадра `1000 / 30`, `elapsed` не больше 40 мс,
  dpr `min(devicePixelRatio, 1.75)`, статичное поле на offscreen-canvas с `seededRandom(270927)` и
  dpr не больше 1,25, число звёзд `min(max, max(140, round(w * h / 3600)))` при max 220 (ширина < 768),
  520 (≥ 1280), иначе 340; живые частицы `min(max, max(48, round(w * h / 12000)))` при max 70 / 140 /
  100 с теми же долями «справа» (0,62 и 0,58 на десктопе); три туманности, падающие звёзды каждые
  4,2–9,2 с, `globalCompositeOperation: "screen"`, вспышки-лучи при `flare > .34`. Палитра —
  разрешённые значения оригинала, литералами: light `248 247 251`, signal `227 175 210`,
  unity `184 192 230`, horizon `170 217 220`. Canvas: `position: absolute; inset: 0; z-index: 1;
  width: 100%; height: 100%; opacity: .72; mix-blend-mode: screen; pointer-events: none`.
- GLOBE-05. Паузы как в оригинале: `ResizeObserver` на canvas, `IntersectionObserver` на секции с
  `rootMargin: "100px"`, `visibilitychange`, слушатель `prefers-reduced-motion`. При reduce, вне
  экрана или в скрытой вкладке цикл останавливается и рисуется один статичный кадр (туманности на
  фазе, без падающих звёзд). При reduce видео ставится на паузу на первом кадре (`pause()` после
  `loadeddata`), при смене предпочтения обратно — `play()`.
- GLOBE-06. `Starfield.tsx`, слои `.starfield__*` и keyframes `star-drift*` удаляются: их роль берут
  статичное поле и туманности canvas. Значения реестра `stars` (canvas частиц) и `globe` (видео)
  остаются в коде, `motionPolicy.test.ts` не меняется.
- GLOBE-07. Тесты: `Hero.test.tsx` проверяет наличие видео с двумя источниками под `BASE_URL`,
  атрибуты автовоспроизведения и `data-anim`; `heroParticles.test.ts` проверяет чистые функции
  (`starCount`, `particleCount`, `seededRandom` воспроизводим, `pickColor` из палитры, шаг 30 fps
  пропускает кадр раньше 33 мс); `HeroParticles.test.tsx` — без 2d-контекста (jsdom) компонент не
  падает и не запускает rAF. `scripts/check-dist.mjs` получает проверку, что `hero-globe.webm` и
  `hero-globe.mp4` лежат в `dist/` и ссылки на них есть в JS-бандле.
- GLOBE-08. Экономия трафика: `preload="auto"` как у оригинала, но при `navigator.connection.saveData
  === true` источники видео не подключаются, остаётся фон `#070210` и частицы.

## 2. LIGHT — огоньки карты на canvas

- LIGHT-01. Новый компонент `LightsCanvas.tsx` (`src/components/map/`) с чистым модулем
  `lightsCanvas.ts`: `<canvas class="map-lights-canvas" data-anim="pulse" aria-hidden="true">`
  лежит внутри `.esd-map` поверх SVG (`position: absolute; inset: 0; pointer-events: none`),
  размер контейнера, dpr `min(devicePixelRatio, 2)`. SVG оставляет только страны: группа
  `.map-lights`, корзины, `.light-core`, `.light-ring` и `<defs>` с градиентами удаляются вместе с
  правилами `map.css` (`@property --halo-k`, `.light-*`, `light-breathe`, `light-arrive`).
- LIGHT-02. Спрайты: на смену размера или dpr рисуются четыре offscreen-canvas — ореол и ядро для
  `person` (`rgb(158 67 154)`) и `group` (`rgb(84 164 172)`). Ореол — радиальный градиент от цвета
  с alpha .9 в центре к 0 на краю радиуса 12px; ядро — круг 2,2px с белой обводкой .9px alpha .5.
  Кадр: `clearRect`, для каждой из пяти корзин `globalAlpha = .30 + .30 * s` и `drawImage` ореола
  с радиусом `7 + 5 * s` px, где `s = (1 + sin(2π · t / 2600 − 2π · n / 5)) / 2`, затем ядра с
  `globalAlpha = 1`. Это возвращает дыхание радиуса 7→12px оригинала, снятое в v1.1 (требование MAP-06 milestone v1.1).
- LIGHT-03. Позиция огонька на экране `transform.apply([x, y])`, размер спрайта от масштаба не
  зависит (как сейчас `r / --zoom-k`). Кадр жеста и полёта: `handleFrame` в `EsdMap.tsx` помимо
  атрибута группы вызывает `lights.draw(transform)` немедленно, чтобы огоньки не отставали от стран.
  Состояние `transform` из `useMapZoom` остаётся источником при рендере React.
- LIGHT-04. Цикл дыхания идёт на 30 fps (пропуск кадра раньше 33 мс), останавливается по
  `IntersectionObserver` на контейнере карты (threshold 0), по `document.hidden` и при
  `prefers-reduced-motion`. При reduce рисуется один статичный кадр: ореол радиусом 9px с alpha .22
  (политика v1.1), ядра как обычно, кольца новых огоньков не рисуются.
- LIGHT-05. Новый огонёк (`light.isNew`): кольцо `stroke: currentColor` 1px, 900 мс, радиус от 6px до
  20,4px (×3,4) и alpha .5→0 по `cubic-bezier(.16, 1, .3, 1)`, одна прокрутка от момента появления в
  `lights`; за время кольца цикл идёт на полной частоте rAF. Значение реестра `new-light` остаётся
  в списке `motionPolicy.test.ts`, но из обязательных к использованию убирается: кольцо рисует
  canvas, узла в DOM у него нет.
- LIGHT-06. Для тестов и приёмки canvas несёт атрибуты `data-light-count` (число размещённых
  огоньков), `data-people`, `data-groups`, `data-new` (число `isNew`), обновляемые при каждом
  изменении `lights`. В jsdom `getContext("2d")` даёт null: компонент выставляет атрибуты, рисование и
  rAF пропускает. `EsdMap.test.tsx` и `App.seams.test.tsx` переводятся с подсчёта `.light-core` /
  `.light-bucket` на эти атрибуты; проверки `map.css` (`light-breathe`, `light-pulse`) заменяются
  проверками `lightsCanvas.ts` (период 2600 мс, пять корзин, радиусы 7–12, alpha .30–.60).
- LIGHT-07. Бюджет: на 390×844 при CPU×4 карта и форма держат не меньше 55 fps, hero не меньше 55;
  на 1440×900 без троттлинга hero, карта и форма не ниже 100. Число узлов SVG на странице падает
  ниже 1300.

## 3. MOB — мобильная адаптация

Аудит на 390×844 горизонтальной прокрутки, обрезанного текста и мелких кеглей не нашёл; правятся
цели касания и вёрстка картинок.

- MOB-01. Ссылки футера (`.site-footer__links a`): `display: inline-flex; align-items: center;
  min-height: 44px; padding-inline: 8px`, у списка `gap: 0`. Шаг столбца растёт с 30,4px до 44px:
  сохранить прежний шаг при боксе 44px нельзя без перекрытия боксов, а перекрытие уводит касание в
  соседнюю ссылку.
- MOB-02. Чекбокс согласия (`ConsentCheckbox.tsx`): label `min-height: 44px; display: flex;
  align-items: center; gap: 12px`, сам input 20×20 с `margin: 0`; область нажатия — вся label.
- MOB-03. Превью новостей (`NewsCard.tsx`): все `<img>` получают `width="480" height="360"` и
  `decoding="async"`; первая карточка ленты — `loading="eager"` и `fetchPriority="high"`, остальные
  `lazy`. `object-fit: cover` и `coverZoom` не меняются.
- MOB-04. Подпись логотипа «МИССИЯ ДЛЯ ВСЕХ» поднимается с .5625rem до .625rem на узком экране
  (десктоп уже .625rem); `letter-spacing` остаётся.

## 4. SHIP — интеграция и приёмка

- SHIP-01. Гейт: `npx tsc -b`, `npm test`, `npm run lint`, `npm run build`, `node scripts/check-dist.mjs`;
  единственный блок reduce в `global.css` и закрытый реестр `data-anim` не нарушены.
- SHIP-02. Деплой на GitHub Pages, sha256 файлов прода = `dist/`.
- SHIP-03. Playwright-приёмка на 1440×900 и 390×844: видео воспроизводится (`!paused`, `currentTime`
  растёт), размер и `object-fit` видео совпадают с оригиналом на обоих размерах, canvas частиц 30 fps;
  таблица fps по секциям с CPU×4 против бюджета LIGHT-07; аудит целей касания без элементов ниже 44px
  (кроме визуально скрытых radio); скриншоты hero и карты рядом с оригиналом в `docs/qa/v12-*.jpeg`.
- SHIP-04. `docs/qa/SMOKE.md` получает раздел «Фаза 17 / v1.2» с таблицами «оригинал / прод» и
  принятыми отклонениями; `.planning` закрывается аудитом milestone и тегом `v1.2`.

## Фазы

| Фаза | Содержание | Файлы |
|---|---|---|
| 14 | GLOBE-01…08 | `src/components/hero/*`, `scripts/check-dist.mjs` |
| 15 | LIGHT-01…07 | `src/components/map/*`, `src/styles/motionPolicy.test.ts`, `src/App.seams.test.tsx` |
| 16 | MOB-01…04 | `src/components/layout/Footer.css`, `Header.css`, `form/ConsentCheckbox.tsx`, `light-form.css`, `news/NewsCard.tsx` |
| 17 | SHIP-01…04 | `docs/qa/*`, `.planning/*` |

Фазы 14–16 независимы по файлам и идут параллельно в worktree. Фаза 17 — после слияния 14–16.

## Принятые отклонения от оригинала

- Видео ставится на паузу при `prefers-reduced-motion` (оригинал крутит его всегда).
- При `saveData` видео не грузится (оригинал грузит всегда).
- Свечение огоньков дышит синусом, а не `ease-in-out` keyframes; на глаз это одно и то же.
