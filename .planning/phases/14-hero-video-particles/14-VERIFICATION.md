---
phase: 14-hero-video-particles
verified: 2026-09-06T19:10:00Z
status: passed
score: 5/5 success criteria verified (GLOBE-01…08: 8/8)
has_blocking_gaps: false
overrides_applied: 0
deferred:
  - truth: "Видео и canvas частиц реально воспроизводятся в браузере: video.paused === false, currentTime растёт, canvas держит 30 fps на CPU×4"
    addressed_in: "Phase 17"
    evidence: "ROADMAP.md, Phase 17, SC 3 (SHIP-03): «Playwright на 1440×900 и 390×844 против оригинала: видео !paused и currentTime растёт… canvas частиц держит 30 fps»; постановщик задачи явно закрепил визуальную/браузерную приёмку за фазой 17 («не гап»)"
---

# Phase 14: Hero: видео-глобус и частицы оригинала — отчёт о верификации

**Цель фазы:** Посетитель открывает страницу и видит глобус оригинала: то же видео с теми же стилями и высотой секции, поверх него живые частицы оригинала, которые не грузят процессор вне экрана и при reduced motion
**Проверено:** 2026-09-06
**Статус:** passed
**Повторная верификация:** Нет — первичная проверка

## Ход проверки

Проверка велась в git worktree `/Users/thevladoss/devs/web/esd_cringe-wt/14` (ветка `agent-14`, коммиты `3e14326` план 14-01 и `8a2b06a` план 14-02). Код читан построчно и сверен с эталоном `docs/research/v1.2/orig-hero-motion.js`; команды прогонялись напрямую, а не взяты из SUMMARY.

## Goal Achievement

### Observable Truths (Success Criteria фазы 14)

| # | Truth | Статус | Свидетельство |
|---|---|---|---|
| 1 | На 390×844 `<video data-anim="globe">` занимает первый экран (`min-height: 100svh`) с `cover`/`center center`/фильтром; на 1440×900 hero 600px (`max(600px, 64vh)`), видео `contain` 16:9 справа вверху со `screen` и двойной `mask-image` (`mask-composite: intersect` + `-webkit-`); от 640px `72% center`/`72% 46%`; два `<source>` под `BASE_URL`, атрибуты автовоспроизведения, `muted` продублирован через ref; колонка текста и `.hero::after` не изменились | ✓ VERIFIED (кроме факта воспроизведения в браузере — см. «Deferred») | `hero.css:4-97` содержит все три брейкпоинта дословно; `Hero.tsx:94-116` — video с полным набором атрибутов и двумя `<source>`; `Hero.test.tsx` (15 тестов) проверяет атрибуты, источники, слои, текст CSS — все зелёные; `git diff main -- hero.css` не трогает `.hero::after`/`.hero__content`/`.hero__title h1` |
| 2 | Canvas `data-anim="stars"` (absolute inset 0, z 1, `opacity: .72; mix-blend-mode: screen`) рисует порт `orig-hero-motion.js` 1:1: 30 fps, dpr ≤1,75/1,25, seed 270927, счёт по формулам с потолками 220/340/520 и 70/100/140, доли 0,58/0,62, три туманности, падающие звёзды 4,2–9,2 с, `screen`, лучи при flare>0,34, палитра литералами | ✓ VERIFIED | Построчное сравнение `heroParticles.ts` с `orig-hero-motion.js`: все формулы, константы и порядок вызовов совпадают (LCG `1664525/1013904223`, `starCount`/`particleCount`, `createParticle`, `createNebulae`, `createShootingStar`, `renderStaticField`, `drawScene`); палитра `BRAND_COLORS` = `248,247,251`/`227,175,210`/`184,192,230`/`170,217,220`; `heroParticles.test.ts` (20 тестов) сверяет числа напрямую (`particleFrame`, стопы градиента, счёт, seed) |
| 3 | Пауза цикла и видео вне экрана (`IntersectionObserver rootMargin: "100px"`), в скрытой вкладке, при reduce; `ResizeObserver`; при `saveData` у `<video>` нет источников | ✓ VERIFIED | `HeroParticles.tsx` реализует все наблюдатели и `shouldAnimate`; `HeroParticles.test.tsx` (5 тестов) проверяет статичный кадр при reduce, шаг 30 fps, паузу по `visibilitychange`, `rootMargin: "100px"` на `section`; `Hero.tsx:56-67` — пауза видео на `loadeddata` при reduce, `play()` при снятии; `Hero.tsx:108` — источники не рендерятся при `saveData`, тест «при saveData не подключает источники» зелёный |
| 4 | `GlobeCanvas.tsx`, `globe.ts`, их тесты, `Starfield.tsx`, `.starfield__*`, `star-drift*` удалены; `motionPolicy.test.ts` проходит без правок, значения `stars`/`globe` остаются в реестре | ✓ VERIFIED | `ls src/components/hero` — только 7 файлов фазы, ни одного из удалённого списка; `grep -rEn "GlobeCanvas|Starfield|starfield|star-drift|globe-canvas" src` не даёт code-хитов (единственное совпадение — комментарий-пояснение в тесте); `npx vitest run src/styles/motionPolicy.test.ts` — 13/13 зелёных, `REGISTRY` содержит `stars` и `globe`, `used` их подтверждает; `git diff main -- src/styles/motionPolicy.test.ts` пуст |
| 5 | `Hero.test.tsx`, `heroParticles.test.ts`, `HeroParticles.test.tsx` зелёные; `check-dist.mjs` подтверждает видео в `dist/` и ссылки в JS | ✓ VERIFIED | Прогнано напрямую: `npx vitest run` — 50 файлов / 515 тестов passed; `npx tsc -b` — код 0; `npm run lint` — код 0; `npm run build && node scripts/check-dist.mjs` — `OK: 12 проверок`, включая `OK видео глобуса hero-globe.webm, hero-globe.mp4 в dist и ссылки в бандле` |

**Оценка:** 5/5 success criteria (ROADMAP) и 8/8 требований GLOBE-01…08 подтверждены кодом и прогонами.

### Deferred Items

Пункт про фактическое воспроизведение видео/частиц в реальном браузере (`!paused`, растущий `currentTime`, живой 30 fps) программно в jsdom не проверяется — это явно закреплено за Playwright-приёмкой фазы 17 (SHIP-03) и не считается гапом фазы 14.

| # | Item | Addressed In | Evidence |
|---|---|---|---|
| 1 | Видео и canvas частиц реально воспроизводятся (`!paused`, `currentTime` растёт, 30 fps держится) | Phase 17 | ROADMAP.md SC3 фазы 17 (SHIP-03): Playwright-приёмка на 1440×900/390×844 |

### Required Artifacts

| Artifact | Ожидание | Статус | Детали |
|---|---|---|---|
| `src/components/hero/heroParticles.ts` | Чистый порт скрипта частиц: константы, seededRandom, счёт, drawScene | ✓ VERIFIED | 476 строк; экспортирует все имена контракта плюс `particleFrame`; `document.`/`window.`/`getComputedStyle`/`requestAnimationFrame` отсутствуют; `Math.random()` встречается только в значениях параметров по умолчанию |
| `src/components/hero/HeroParticles.tsx` | Canvas-слой с rAF-циклом и паузами | ✓ VERIFIED | 161 строка; `<canvas class="hero__particles" data-anim="stars" aria-hidden="true">`; наблюдатели `ResizeObserver`/`IntersectionObserver`/`visibilitychange`/`matchMedia` на месте; без 2d-контекста выходит до создания сцены |
| `src/components/hero/heroParticles.test.ts` | Тесты чистых функций | ✓ VERIFIED | 388 строк, 20 `it(`, покрывает счёт, seed, палитру, шаг кадра, `populateScene`, `drawScene`, `particleFrame` |
| `src/components/hero/HeroParticles.test.tsx` | Тесты компонента | ✓ VERIFIED | 210 строк, 5 `it(`, включая «без контекста нет rAF» |
| `src/components/hero/Hero.tsx` | Видео + `<HeroParticles />` вместо Starfield/GlobeCanvas | ✓ VERIFIED | 148 строк; `videoRef`, `prefersSaveData`, эффект `[reduce]`, слои video→particles→content |
| `src/components/hero/hero.css` | Высота секции, стили видео по трём брейкпоинтам, `.hero__particles` | ✓ VERIFIED | 196 строк; блоки `@media (min-width: 768px/1024px)` для высоты, `@media (min-width: 40rem/80rem)` для видео; `.starfield__*`/`.globe-canvas`/`star-drift*` отсутствуют |
| `src/components/hero/Hero.test.tsx` | Тесты видео, атрибутов, saveData, reduce, текста CSS | ✓ VERIFIED | 249 строк, 15 `it(` |
| `scripts/check-dist.mjs` | Проверка hero-видео в `dist/` и ссылок в бандле | ✓ VERIFIED | `checkHeroVideo` + `HERO_VIDEO`/`MIN_VIDEO_BYTES`/`bundleText`; прогон даёт `OK видео глобуса …` |
| `GlobeCanvas.tsx`, `GlobeCanvas.test.tsx`, `globe.ts`, `globe.test.ts`, `Starfield.tsx` | Удалены | ✓ VERIFIED | Отсутствуют на диске, помечены `D` в `git diff` |
| `public/hero-globe.webm`, `public/hero-globe.mp4` | Не изменены | ✓ VERIFIED | `git diff main..agent-14 --stat -- public/` пуст |

### Key Link Verification

| From | To | Via | Статус | Детали |
|---|---|---|---|---|
| `Hero.tsx` | `HeroParticles.tsx` | `<HeroParticles />` между `.hero__video` и `.hero__content` | WIRED | Тест «складывает слои: видео, частицы, текст» подтверждает порядок детей секции |
| `Hero.tsx` | `public/hero-globe.webm`/`.mp4` | `<source src={\`${import.meta.env.BASE_URL}hero-globe.*\`}>` | WIRED | Тест «подключает webm и mp4 из public под BASE_URL»; `check-dist` находит имена файлов в JS-бандле |
| `Hero.tsx` | `src/lib/useReducedMotion.ts` | `usePrefersReducedMotion()` управляет паузой видео | WIRED | Эффект `[reduce]` вызывает `pause()`/`play()`; тесты reduce/без-reduce зелёные |
| `HeroParticles.tsx` | `heroParticles.ts` | импорт `createScene/populateScene/drawScene/shouldDrawFrame/frameElapsed/shouldAnimate` | WIRED | Импорт на месте, формулы используются в `animate`/`resize`/`updateAnimation` |
| `HeroParticles.tsx` | `IntersectionObserver` на `<section class="hero">` | `canvas.closest("section")`, `rootMargin: VIEWPORT_ROOT_MARGIN` | WIRED | Тест «наблюдает секцию hero с запасом 100px» подтверждает цель и `rootMargin` |
| `hero.css` | `<video>` внутри `.hero__video` | `.hero__video > video` на трёх брейкпоинтах | WIRED | Текстовые проверки `Hero.test.tsx` находят все селекторы |
| `scripts/check-dist.mjs` | `dist/hero-globe.webm`, `dist/hero-globe.mp4`, `dist/assets/*.js` | `checkHeroVideo` | WIRED | Прогон даёт `OK видео глобуса … в dist и ссылки в бандле` |

### Точность порта против `orig-hero-motion.js`

Построчное сравнение `heroParticles.ts` с эталоном — совпадение по числам и порядку вызовов:

| Элемент | Оригинал | Порт | Совпадение |
|---|---|---|---|
| LCG | `value * 1664525 + 1013904223`, `>>> 0`, `/4294967296` | то же | ✓ |
| Шаг кадра | `frameInterval = 1000/30`, потолок `elapsed` 40 | `FRAME_INTERVAL_MS`, `MAX_ELAPSED_MS = 40` | ✓ |
| dpr | `Math.min(devicePixelRatio, 1.75)` цикл, `Math.min(pixelRatio, 1.25)` статика | `MAX_PIXEL_RATIO`/`STATIC_MAX_PIXEL_RATIO` | ✓ |
| Seed статики | `seededRandom(270927)` | `STATIC_SEED = 270927` | ✓ |
| Счёт звёзд/частиц | `max(140, round(wh/3600))`/220-340-520; `max(48, round(wh/12000))`/70-100-140 | `starCount`/`particleCount` идентичны | ✓ |
| Доли «справа» | 0.62 (статика), 0.58 (частицы), только `width>=1280` | `STATIC_RIGHT_SHARE`/`PARTICLE_RIGHT_SHARE` те же значения и условие | ✓ |
| Туманности | 3 облака, координаты/фазы/скорости/цвета signal-unity-horizon | `createNebulae()` — те же числа | ✓ |
| Падающие звёзды | `randomBetween(4200, 9200)`, первая через 1600–4800 | `SHOOTING_STAR_GAP_MS`/`FIRST_SHOOTING_STAR_GAP_MS` | ✓ |
| Формулы кадра частицы | pulse/flare/depth/drawRadius/alpha | `particleFrame()` — числа проверены тестом с точностью 1e-9 | ✓ |
| Порог лучей | `flare > 0.34` | `FLARE_RAY_THRESHOLD = 0.34` | ✓ |
| Композитинг | `globalCompositeOperation = "screen"` на весь кадр | то же | ✓ |
| Палитра | оригинал берёт цвета через `getComputedStyle` (255,236,255 / 210,142,190 / 126,164,255 / 91,211,226) | Спека GLOBE-04 требует литералы 248,247,251 / 227,175,210 / 184,192,230 / 170,217,220 — так и реализовано | ✓ (осознанное отклонение по спеке, задокументировано в SUMMARY) |

### Behavioral Spot-Checks / Прогоны

| Проверка | Команда | Результат | Статус |
|---|---|---|---|
| Полный тестовый набор | `npx vitest run` | 50 файлов / 515 тестов passed | ✓ PASS |
| Тесты hero | `npx vitest run src/components/hero` | 3 файла / 40 тестов passed | ✓ PASS |
| Политика движения | `npx vitest run src/styles/motionPolicy.test.ts` | 13 тестов passed, `stars`/`globe` в реестре | ✓ PASS |
| Типы | `npx tsc -b` | код 0 | ✓ PASS |
| Линт | `npm run lint` | код 0, без предупреждений | ✓ PASS |
| Сборка + гейт дистрибутива | `npm run build && node scripts/check-dist.mjs` | `OK: 12 проверок`, включая видео hero | ✓ PASS |
| Отсутствие удалённых имён в бандле | `grep -c "starfield\|globe-canvas\|star-drift" dist/assets/*` | 0 во всех файлах | ✓ PASS |
| Область правок фазы | `git diff $(git merge-base main agent-14)..agent-14 --stat` | Только файлы из списка Files фазы 14 (13 файлов: изменения/удаления/новые) | ✓ PASS |
| «Не трогать» не задето | `git diff … -- global.css motionPolicy.test.ts setup.ts App.tsx useReducedMotion.ts package.json package-lock.json` | Пусто по каждому файлу | ✓ PASS |

### Требования GLOBE-01…08

| Requirement | Описание (кратко) | Статус | Свидетельство |
|---|---|---|---|
| GLOBE-01 | Видео с атрибутами, источники под BASE_URL, muted через ref, GlobeCanvas/globe удалены | ✓ SATISFIED | `Hero.tsx:94-116`, удалённые файлы, `Hero.test.tsx` |
| GLOBE-02 | Стили видео по трём брейкпоинтам | ✓ SATISFIED | `hero.css:44-84` |
| GLOBE-03 | Высота hero, колонка текста не изменилась | ✓ SATISFIED | `hero.css:4-28`, `git diff` не трогает `.hero__content`/`.hero__title h1` |
| GLOBE-04 | Порт частиц 1:1 с формулами/палитрой | ✓ SATISFIED | `heroParticles.ts` построчно сверен с оригиналом |
| GLOBE-05 | Экономия ресурсов: наблюдатели, паузы, статичный кадр | ✓ SATISFIED | `HeroParticles.tsx`, `Hero.tsx` эффект `[reduce]` |
| GLOBE-06 | Удаление Starfield/GlobeCanvas/globe, реестр не трогается | ✓ SATISFIED | `ls`, `grep`, `motionPolicy.test.ts` зелёный без правок |
| GLOBE-07 | Тесты и check-dist | ✓ SATISFIED | Все тесты + `check-dist` зелёные |
| GLOBE-08 | saveData отключает источники | ✓ SATISFIED | `Hero.tsx:20-25,108`, тест «при saveData не подключает источники» |

### Anti-Patterns Found

Ни одного. `grep -n -iE "TBD|FIXME|XXX|TODO|HACK|PLACEHOLDER"` по всем файлам фазы (`Hero.tsx`, `hero.css`, `HeroParticles.tsx`, `heroParticles.ts`, три тестовых файла, `check-dist.mjs`) не даёт совпадений. Стабов, пустых обработчиков и захардкоженных пустых данных не найдено.

### Human Verification Required

Не требуется в рамках этой фазы. Визуальная и браузерная приёмка (реальное воспроизведение видео, живой рендер частиц, скриншоты против оригинала) намеренно закреплена за фазой 17 (Playwright-приёмка SHIP-03) и учтена в разделе «Deferred Items» — это не гап фазы 14.

### Gaps Summary

Гапов нет. Все 5 success criteria фазы 14 и все 8 требований GLOBE-01…08 подтверждены прямым чтением кода и независимым прогоном `npx vitest run`, `npx tsc -b`, `npm run lint`, `npm run build && node scripts/check-dist.mjs` в worktree `agent-14`. Область правок точно совпадает со списком Files фазы 14, файлы из списка «Не трогать» не задеты. Единственный неподтверждённый программно пункт — фактическое воспроизведение в браузере — явно и обоснованно вынесен в фазу 17 постановщиком задачи.

---

*Verified: 2026-09-06*
*Verifier: Claude (gsd-verifier)*
