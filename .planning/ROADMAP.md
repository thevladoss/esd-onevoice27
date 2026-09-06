# Roadmap: Единый голос 27 — лендинг ЕАД (редизайн)

## Milestones

- ✅ **v1.0 Прототип редизайна ЕАД** — Phases 1-6 (shipped 2026-09-05) — [архив](milestones/v1.0-ROADMAP.md)
- ✅ **v1.1 Дизайн-правки по оригиналу** — Phases 7-13 (shipped 2026-09-06) — [архив](milestones/v1.1-ROADMAP.md)
- [ ] **v1.2 Мобильная адаптация, глобус оригинала и производительность** — Phases 14-17 (in progress, started 2026-09-06)

## Overview v1.2

Три правки пользователя после приёмки v1.1: глобус первого экрана «точно как в оригинале», лаги карты и анимаций на телефоне, мобильная адаптация. Замеры (`docs/research/v1.2/measurements.md`) показали, что на 390×844 при CPU×4 hero, карта и форма падают до 30 fps при 117 у оригинала: canvas-глобус рисует 2200 точек на кадр, карта держит 1884 круга SVG и перерисовывает 942 ореола каждый кадр. Работа разбита на три независимые зоны кода и одну интеграцию: hero (видео оригинала плюс порт его canvas-частиц), карта (огоньки переезжают из SVG на canvas-оверлей), мобильные цели касания и картинки, затем гейт, деплой и Playwright-приёмка с таблицей fps. Фазы 14–16 владеют разными файлами и исполняются параллельно в отдельных worktree; фаза 17 идёт после слияния. Точные значения CSS, параметры скрипта частиц и бюджеты берутся из `docs/superpowers/specs/2026-09-06-mobile-hero-perf-v1.2-design.md`; номера пунктов спецификации совпадают с REQ-ID.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

<details>
<summary>✅ v1.0 Прототип редизайна ЕАД (Phases 1-6) — SHIPPED 2026-09-05</summary>

- [x] Phase 1: Каркас и деплой (5/5 plans) — completed 2026-09-05
- [x] Phase 2: Hero и карта (5/5 plans) — completed 2026-09-05
- [x] Phase 3: Форма, О проекте, Участие (4/4 plans) — completed 2026-09-05
- [x] Phase 4: Новости, Ресурсы, Цитата (4/4 plans) — completed 2026-09-05
- [x] Phase 5: Полировка и финальный прогон (8/8 plans) — completed 2026-09-05
- [x] Phase 6: Точность оригинала (4/4 plans, правки пользователя после приёмки) — completed 2026-09-05

</details>

<details>
<summary>✅ v1.1 Дизайн-правки по оригиналу (Phases 7-13) — SHIPPED 2026-09-06</summary>

- [x] **Phase 7: Стекло и заголовки** - Полупрозрачное стекло карточек About, Involve и ресурсов по CSS оригинала, плоские белые заголовки секций, градиент только у About (completed 2026-09-06)
- [x] **Phase 8: Лента карты и дышащие огоньки** - Карта и форма на одной скошенной подложке без второй линии среза, огоньки с дышащим свечением в пяти корзинах, карта без reveal (completed 2026-09-06)
- [x] **Phase 9: Форма как в оригинале** - Форма без карточки-обёртки, тип света не выбран при старте, поле «Название организации» для группы, русские подписи и стили полей оригинала (completed 2026-09-06)
- [x] **Phase 10: Превью новостей и видео** - Карточки новостей 16:9 без чёрных полос с панелью заголовка и ховером оригинала, превью роликов без полос (completed 2026-09-06)
- [x] **Phase 11: Ресурсы: сетка, карточки, панели** - Сетка 320/528/272, карточки с индикатором и подчёркиванием, полноэкранные панели со шторным переходом и наполнением ЕАД плюс английские материалы (completed 2026-09-06)
- [x] **Phase 12: Футер в одну колонку** - Логотип, подпись, ссылки столбиком и юридический текст по центру без разделительной линии (completed 2026-09-06)
- [x] **Phase 13: Интеграция, гейт и приёмка** - Слияние фаз 7–12, полный гейт, деплой и Playwright-сравнение с оригиналом на 1440×900 и 390×844 (completed 2026-09-06)

</details>

### v1.2 Мобильная адаптация, глобус оригинала и производительность (Phases 14-17)

- [ ] **Phase 14: Hero: видео-глобус и частицы оригинала** - Видео глобуса оригинала со стилями трёх брейкпоинтов и высотой секции оригинала, порт canvas-частиц на 30 fps с паузами вне экрана; canvas-глобус и звёздное поле удалены
- [ ] **Phase 15: Огоньки карты на canvas** - 942 огонька переезжают из SVG на canvas-оверлей со спрайтами, дыханием радиуса 7→12px в пяти корзинах, синхронизацией с зумом, паузой вне экрана и кольцом нового огонька; бюджет ≥ 55 fps при CPU×4
- [ ] **Phase 16: Мобильная адаптация** - Ссылки футера и чекбокс согласия не ниже 44px, превью новостей с `width`/`height` и приоритетом первой карточки, подпись логотипа .625rem
- [ ] **Phase 17: Интеграция, гейт и приёмка** - Слияние фаз 14–16, полный гейт, деплой и Playwright-приёмка против оригинала с таблицей fps, раздел «Фаза 17 / v1.2» в SMOKE.md, аудит и тег v1.2

## Prerequisites / Dependencies

- Фазы 14, 15 и 16 не зависят друг от друга и стартуют одновременно от текущего `main` (сборка fafc605 после архива v1.1, 50 тестовых файлов / 504 теста зелёные). Видео `public/hero-globe.webm` и `public/hero-globe.mp4` уже лежат в репозитории.
- Фаза 17 зависит от всех трёх: начинается после слияния веток 14–16.
- Стыки между фазами закрыты правилами владения файлами (ниже) и проверяются в фазе 17: закрытый реестр `data-anim` при двух новых canvas (`stars` из фазы 14 и `pulse` из фазы 15), правки `motionPolicy.test.ts` фазы 15 против неизменного hero-набора значений фазы 14, чтение `light-form.css` тестом `App.seams.test.tsx` (фаза 15 правит тест, фаза 16 правит CSS), бюджет hero из LIGHT-07 (код фазы 14, замер в фазе 17).

## Правила параллельной работы (фазы 14–16)

1. Каждая фаза редактирует только файлы из своего списка **Files**. Чужие файлы не трогать, даже ради одной строки.
2. `src/styles/global.css` не меняет ни одна из трёх фаз: единственный блок `prefers-reduced-motion` и правила `[data-anim="pulse"] circle`, `[data-anim="pulse"] .light-halo`, `[data-anim="new-light"]` остаются на месте как no-op после переезда огоньков на canvas (их наличие проверяет `motionPolicy.test.ts`).
3. `src/styles/motionPolicy.test.ts` правит только фаза 15 (значение `new-light` уходит из списка обязательных). Фаза 14 обязана пройти этот тест без правок: значения `stars` (canvas частиц) и `globe` (видео) остаются в коде hero.
4. `src/test/setup.ts` не меняется: `getContext` там уже отдаёт `null`, на это опираются тесты `HeroParticles.test.tsx` (фаза 14) и `LightsCanvas`/`EsdMap` (фаза 15).
5. Общие модули (`src/lib/*`, `src/state/lights.tsx` с готовым `isNew`, `Button`, `Reveal`, `Wordmark`) можно вызывать, но не менять. Нужен новый проп у общего компонента: заводить его в своей зоне (фаза 16 передаёт приоритет первой карточки через `News.tsx` → `NewsCard.tsx`, оба в её зоне).
6. Новые файлы создаются только внутри своей зоны (`src/components/hero/`, `src/components/map/`, `src/components/layout/`, `src/components/form/`, `src/components/news/`).
7. Тесты пишутся в той же фазе, что и код (test-as-you-go); в конце фазы на её ветке зелёные `npm test`, `npx tsc -b` и `npm run lint`. Полный гейт с `build` и `check:dist` гоняет фаза 17, но фаза 14 сама прогоняет `node scripts/check-dist.mjs`, потому что правит его.
8. Замеры fps в ветке фазы делаются в Playwright-Chrome при закрытых WebGL-вкладках (решение фазы 5); сводная таблица против оригинала собирается один раз в фазе 17.

## Phase Details

### Phase 14: Hero: видео-глобус и частицы оригинала

**Goal**: Посетитель открывает страницу и видит глобус оригинала: то же видео с теми же стилями и высотой секции, поверх него живые частицы оригинала, которые не грузят процессор вне экрана и при reduced motion
**Depends on**: Nothing (стартует от main)
**Parallel**: Параллельно с фазами 15 и 16
**Requirements**: GLOBE-01, GLOBE-02, GLOBE-03, GLOBE-04, GLOBE-05, GLOBE-06, GLOBE-07, GLOBE-08
**Success Criteria** (what must be TRUE):

  1. На 390×844 `<video data-anim="globe">` занимает весь первый экран (`.hero` `min-height: 100svh`, 844px) с `object-fit: cover; object-position: center center; filter: saturate(1.18) contrast(1.28) brightness(0.96)`; на 1440×900 hero высотой 600px (`max(600px, 64vh)`), видео `object-fit: contain`, 16:9 (1067×600) справа вверху с `mix-blend-mode: screen` и двойной `mask-image` (`mask-composite: intersect` плюс `-webkit-` варианты); от 640px `object-position: 72% center; transform-origin: 72% 46%`; видео воспроизводится (`!paused`, `currentTime` растёт), у него два источника `hero-globe.webm` и `hero-globe.mp4` под `import.meta.env.BASE_URL`, атрибуты `autoPlay muted loop playsInline preload="auto" disablePictureInPicture disableRemotePlayback tabIndex={-1} aria-hidden`, `muted` продублирован через ref до `play()`; колонка текста, кегли, градиент H1 и `.hero::after` не изменились (GLOBE-01, GLOBE-02, GLOBE-03)
  2. Поверх видео canvas `data-anim="stars"` (absolute inset 0, z 1, `opacity: .72; mix-blend-mode: screen`) рисует порт `docs/research/v1.2/orig-hero-motion.js`: шаг 30 fps с `elapsed` ≤ 40 мс, dpr ≤ 1,75, статичное поле с `seededRandom(270927)` на offscreen-canvas (dpr ≤ 1,25, `min(max, max(140, round(w·h/3600)))` при max 220/340/520), живые частицы `min(max, max(48, round(w·h/12000)))` при max 70/100/140 с долей «справа» 0,58 и 0,62 на десктопе, три туманности, падающие звёзды каждые 4,2–9,2 с, `globalCompositeOperation: "screen"`, лучи при `flare > .34`; палитра литералами light `248 247 251`, signal `227 175 210`, unity `184 192 230`, horizon `170 217 220` (GLOBE-04)
  3. Когда hero вне экрана (`IntersectionObserver` с `rootMargin: "100px"`), вкладка скрыта (`visibilitychange`) или включён `prefers-reduced-motion`, цикл частиц остановлен и виден один статичный кадр (туманности на фазе, без падающих звёзд); при reduce видео стоит на первом кадре (`pause()` после `loadeddata`), при снятии reduce снова `play()`; `ResizeObserver` на canvas переразмечает поле; при `navigator.connection.saveData === true` у `<video>` нет источников, посетитель видит фон `#070210` и частицы (GLOBE-05, GLOBE-08)
  4. В `src/` нет `GlobeCanvas.tsx`, `globe.ts`, их тестов, `Starfield.tsx`, слоёв `.starfield__*` и keyframes `star-drift*`; `motionPolicy.test.ts` проходит без правок, значения `stars` и `globe` остаются в коде hero (GLOBE-06)
  5. Тесты зелёные: `Hero.test.tsx` находит видео с двумя источниками под `BASE_URL`, атрибутами автовоспроизведения и `data-anim`; `heroParticles.test.ts` проверяет `starCount`/`particleCount` по ширине, воспроизводимость `seededRandom`, цвет из палитры и пропуск кадра раньше 33 мс; `HeroParticles.test.tsx` подтверждает, что без 2d-контекста компонент не падает и не вызывает rAF; `node scripts/check-dist.mjs` после `npm run build` подтверждает `hero-globe.webm` и `hero-globe.mp4` в `dist/` и ссылки на них в JS-бандле (GLOBE-07)

**Files** (владение):
- `src/components/hero/Hero.tsx` (обёртка `.hero__video` с `<video>`, ref для `muted`/`pause`/`play`, ветка `saveData`, `<HeroParticles />` вместо `Starfield` и `GlobeCanvas`), `src/components/hero/hero.css` (высота секции, `.hero__video`, стили видео по трём брейкпоинтам, `.hero__particles`; удалить `.starfield__*` и `star-drift*`), `src/components/hero/Hero.test.tsx`
- новые `src/components/hero/HeroParticles.tsx`, `heroParticles.ts`, `HeroParticles.test.tsx`, `heroParticles.test.ts`
- удалить `src/components/hero/GlobeCanvas.tsx`, `GlobeCanvas.test.tsx`, `globe.ts`, `globe.test.ts`, `Starfield.tsx`
- `scripts/check-dist.mjs` (проверка `hero-globe.webm`/`.mp4` в `dist/` и ссылок в JS)
- `public/hero-globe.webm`, `public/hero-globe.mp4` уже на месте, не меняются

**Не трогать**: `src/styles/global.css`, `src/styles/motionPolicy.test.ts`, `src/test/setup.ts`, `src/App.tsx`, `src/components/map/*`, `src/components/layout/*`, `src/lib/useReducedMotion.ts` (вызывать как есть).
**Plans**: TBD
**UI hint**: yes

### Phase 15: Огоньки карты на canvas

**Goal**: Посетитель прокручивает к карте на телефоне и видит 942 огонька, которые дышат свечением как в оригинале, не отстают от стран при зуме и не тормозят ни карту, ни форму под ней
**Depends on**: Nothing (стартует от main)
**Parallel**: Параллельно с фазами 14 и 16
**Requirements**: LIGHT-01, LIGHT-02, LIGHT-03, LIGHT-04, LIGHT-05, LIGHT-06, LIGHT-07
**Success Criteria** (what must be TRUE):

  1. Внутри `.esd-map` поверх SVG лежит `<canvas class="map-lights-canvas" data-anim="pulse" aria-hidden>` (absolute inset 0, `pointer-events: none`, dpr ≤ 2); в SVG остались только страны: нет `.map-lights`, корзин, `.light-core`, `.light-ring` и `<defs>` с градиентами; в `map.css` нет `@property --halo-k`, правил `.light-*`, keyframes `light-breathe` и `light-arrive`; число узлов SVG на странице < 1300 (LIGHT-01, LIGHT-07)
  2. Огоньки дышат по пяти корзинам с периодом 2600 мс: для корзины `n` `s = (1 + sin(2π·t/2600 − 2π·n/5)) / 2`, ореол-спрайт (радиальный градиент от цвета с alpha .9 к 0, радиус 12px) рисуется с радиусом `7 + 5·s` px и `globalAlpha = .30 + .30·s`, ядро 2,2px с белой обводкой .9px alpha .5 рисуется с alpha 1; цвета `rgb(158 67 154)` для `person` и `rgb(84 164 172)` для `group`; спрайты перерисовываются только при смене размера или dpr (LIGHT-02)
  3. При зуме колесом с Ctrl/⌘, панораме и полёте к стране по чипу огоньки стоят на своих странах в каждом кадре жеста: позиция `transform.apply([x, y])`, `handleFrame` в `EsdMap.tsx` вызывает `draw(transform)` немедленно, размер спрайта от масштаба не зависит (LIGHT-03)
  4. Цикл дыхания идёт на 30 fps (пропуск кадра раньше 33 мс) и стоит, когда контейнер карты вне экрана (`IntersectionObserver`, threshold 0), вкладка скрыта или включён `prefers-reduced-motion`; при reduce один статичный кадр: ореол 9px alpha .22, ядра обычные, без колец; после отправки формы новый огонёк получает кольцо 1px своего цвета: 900 мс, радиус 6→20,4px, alpha .5→0 по `cubic-bezier(.16, 1, .3, 1)`, одна прокрутка, на это время цикл на полной частоте rAF (LIGHT-04, LIGHT-05)
  5. В jsdom `EsdMap` рендерит canvas с `data-light-count="942"`, `data-people="694"`, `data-groups="248"`, `data-new="0"` (при размере контейнера 1200×700, как мокает `App.seams.test.tsx`), после `addLight` атрибуты `data-light-count="943"` и `data-new="1"`, rAF не вызывается; `EsdMap.test.tsx` и `App.seams.test.tsx` читают эти атрибуты и константы `lightsCanvas.ts` (2600 мс, 5 корзин, радиусы 7–12, alpha .30–.60) вместо `.light-core`/`.light-bucket` и текста `map.css`; `motionPolicy.test.ts` держит `new-light` в реестре, но не в списке обязательных; на 390×844 при CPU×4 карта и форма держат ≥ 55 fps, на 1440×900 без троттлинга ≥ 100 fps (бюджет hero из LIGHT-07 подтверждает фаза 17 после слияния с фазой 14) (LIGHT-06, LIGHT-07)

**Files** (владение):
- новые `src/components/map/LightsCanvas.tsx`, `lightsCanvas.ts`, `LightsCanvas.test.tsx`, `lightsCanvas.test.ts`
- `src/components/map/EsdMap.tsx` (canvas внутри `.esd-map`, `handleFrame` → `draw(transform)`, SVG без огоньков), `src/components/map/EsdMap.test.tsx`
- `src/components/map/map.css` (`.map-lights-canvas`; удалить `@property --halo-k`, `.light-*`, `light-breathe`, `light-arrive`)
- `src/components/map/useMapZoom.ts` только при необходимости (`onFrame` уже есть)
- `src/styles/motionPolicy.test.ts` (только список обязательных значений: `new-light` выходит из него)
- `src/App.seams.test.tsx` (только блок карты: атрибуты canvas и константы `lightsCanvas.ts` вместо `.light-bucket` и `map.css`)

**Не трогать**: `src/styles/global.css` (правила `[data-anim="pulse"] circle`, `.light-halo` и `[data-anim="new-light"]` в блоке reduce остаются no-op), `src/state/lights.tsx` (`isNew` уже есть), `src/test/setup.ts`, `src/components/map/Counters.tsx`, `CountryChips.tsx`, `MapBand.tsx`, `MapSection.tsx`, `src/components/form/*`, `src/components/hero/*`; в `App.seams.test.tsx` проверки `light-form.css` (строки про `.lf-section`) не менять.
**Plans**: TBD
**UI hint**: yes

### Phase 16: Мобильная адаптация

**Goal**: Посетитель на телефоне попадает по ссылкам футера и чекбоксу согласия с первого касания, превью новостей не сдвигают вёрстку при загрузке, а подпись логотипа читается
**Depends on**: Nothing (стартует от main)
**Parallel**: Параллельно с фазами 14 и 15
**Requirements**: MOB-01, MOB-02, MOB-03, MOB-04
**Success Criteria** (what must be TRUE):

  1. На 390×844 каждая ссылка `.site-footer__links a` имеет высоту ≥ 44px (`display: inline-flex; align-items: center; min-height: 44px; padding-inline: 8px`), список с `gap: 0`: шаг столбца 44px вместо 30,4px, боксы соседних ссылок не перекрываются (касание по краю бокса не уходит в соседнюю ссылку), текст центрирован в боксе (MOB-01)
  2. Label чекбокса согласия высотой ≥ 44px (`min-height: 44px; display: flex; align-items: center; gap: 12px`), input 20×20 с `margin: 0`; клик по тексту согласия переключает чекбокс, тест на это зелёный, ошибка валидации «согласие» показывается как раньше (MOB-02)
  3. Все `<img>` карточек новостей несут `width="480" height="360"` и `decoding="async"`; первая карточка ленты на первой странице пагинации `loading="eager"` и `fetchPriority="high"`, остальные `loading="lazy"`; `object-fit: cover`, `coverZoom` и `coverPosition` не изменились (MOB-03)
  4. Подпись «МИССИЯ ДЛЯ ВСЕХ» в шапке на узком экране `font-size: .625rem` (10px) с прежним `letter-spacing: .16em`; десктопное значение .625rem и вордмарк футера не изменились (MOB-04)

**Files** (владение):
- `src/components/layout/Footer.css`, `src/components/layout/Footer.test.tsx`
- `src/components/layout/Header.css` (только `.site-header .wordmark__tagline`), `src/components/layout/Header.test.tsx` или `Wordmark.test.tsx` при необходимости
- `src/components/form/ConsentCheckbox.tsx`, `src/components/form/light-form.css` (правила `.lf-check`, `.lf-checkbox`), `src/components/form/LightForm.test.tsx` (только кейс согласия)
- `src/components/news/NewsCard.tsx` (атрибуты `<img>`, проп приоритета), `src/components/news/News.tsx` (только передача приоритета первой карточке), `src/components/news/NewsCard.test.tsx`, `src/components/news/News.test.tsx`

**Не трогать**: `Footer.tsx`, `Header.tsx`, `Wordmark.tsx`, `LightForm.tsx`, `FormField.tsx`, `news.css`, `src/styles/global.css`, `src/components/map/*`, `src/components/hero/*`, `src/App.seams.test.tsx`; в `light-form.css` не добавлять `background` в блок `.lf-section` и `.lf-section::before` (это проверяет `App.seams.test.tsx`).
**Plans**: TBD
**UI hint**: yes

### Phase 17: Интеграция, гейт и приёмка

**Goal**: Прод на GitHub Pages содержит все три правки вместе, проходит полный гейт и по Playwright-приёмке совпадает с оригиналом по hero, держит бюджет fps на телефоне и не имеет целей касания ниже 44px
**Depends on**: Phases 14, 15, 16 (после слияния всех трёх)
**Requirements**: SHIP-01, SHIP-02, SHIP-03, SHIP-04
**Success Criteria** (what must be TRUE):

  1. После слияния веток 14–16 гейт зелёный: `npx tsc -b`, `npm test`, `npm run lint`, `npm run build`, `node scripts/check-dist.mjs`; в `global.css` единственный блок `prefers-reduced-motion`, реестр `data-anim` закрыт и `motionPolicy.test.ts` проходит с двумя новыми canvas (`stars`, `pulse`) и `new-light` вне обязательных (SHIP-01)
  2. Прогон Deploy to GitHub Pages зелёный, sha256 `index.html`, JS, CSS и `hero-globe.webm`/`hero-globe.mp4` на проде совпадают с локальным `dist/` (SHIP-02)
  3. Playwright на 1440×900 и 390×844 против оригинала: видео `!paused` и `currentTime` растёт; размер и `object-fit` видео совпадают с оригиналом (1067×600 `contain` справа вверху на 1440×900, `cover` во весь экран на 390×844); canvas частиц держит 30 fps; таблица fps по секциям при CPU×4 на 390×844 показывает hero, карту и форму ≥ 55 fps, на 1440×900 без троттлинга ≥ 100 fps; число узлов SVG < 1300; аудит целей касания не находит элементов ниже 44px, кроме визуально скрытых radio; скриншоты hero и карты рядом с оригиналом лежат в `docs/qa/v12-*.jpeg` (SHIP-03)
  4. `docs/qa/SMOKE.md` содержит раздел «Фаза 17 / v1.2» с таблицами «оригинал / прод» по GLOBE, LIGHT и MOB и принятыми отклонениями (видео на паузе при reduce, без источников при `saveData`, синусное дыхание вместо `ease-in-out`); milestone закрыт аудитом `milestones/v1.2-MILESTONE-AUDIT.md`, архивом фаз и тегом `v1.2` (SHIP-04)
  5. Стыки после слияния без дефектов: `App.seams.test.tsx` читает атрибуты canvas карты (фаза 15) и не ломается на правках `light-form.css` (фаза 16); `Hero.test.tsx` и `motionPolicy.test.ts` зелёные вместе; форма под картой держит ≥ 55 fps при CPU×4, потому что цикл огоньков стоит, когда карта ушла с экрана

**Files**:
- слияние веток/worktree фаз 14–16 в `main`
- `docs/qa/SMOKE.md`, скриншоты `docs/qa/v12-*.jpeg`, `README.md` при необходимости
- точечные правки в любых файлах при дефектах стыка (у фазы нет параллельных соседей)
- `.planning/*` по итогам приёмки (аудит, архив, PROJECT.md, MILESTONES.md)

**Plans**: TBD

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Каркас и деплой | v1.0 | 5/5 | Complete | 2026-09-05 |
| 2. Hero и карта | v1.0 | 5/5 | Complete | 2026-09-05 |
| 3. Форма, О проекте, Участие | v1.0 | 4/4 | Complete | 2026-09-05 |
| 4. Новости, Ресурсы, Цитата | v1.0 | 4/4 | Complete | 2026-09-05 |
| 5. Полировка и финальный прогон | v1.0 | 8/8 | Complete | 2026-09-05 |
| 6. Точность оригинала | v1.0 | 4/4 | Complete | 2026-09-05 |
| 7. Стекло и заголовки | v1.1 | 2/2 | Complete | 2026-09-06 |
| 8. Лента карты и дышащие огоньки | v1.1 | 2/2 | Complete | 2026-09-06 |
| 9. Форма как в оригинале | v1.1 | 2/2 | Complete | 2026-09-06 |
| 10. Превью новостей и видео | v1.1 | 1/1 | Complete | 2026-09-06 |
| 11. Ресурсы: сетка, карточки, панели | v1.1 | 3/3 | Complete | 2026-09-06 |
| 12. Футер в одну колонку | v1.1 | 1/1 | Complete | 2026-09-06 |
| 13. Интеграция, гейт и приёмка | v1.1 | 2/2 | Complete | 2026-09-06 |
| 14. Hero: видео-глобус и частицы оригинала | v1.2 | 0/0 | Pending | - |
| 15. Огоньки карты на canvas | v1.2 | 0/0 | Pending | - |
| 16. Мобильная адаптация | v1.2 | 0/0 | Pending | - |
| 17. Интеграция, гейт и приёмка | v1.2 | 0/0 | Pending | - |
