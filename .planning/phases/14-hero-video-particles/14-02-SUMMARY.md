---
phase: 14-hero-video-particles
plan: 02
subsystem: ui
tags: [hero, video, css, vitest, check-dist]

requires:
  - phase: 14-hero-video-particles
    plan: 01
    provides: компонент HeroParticles с canvas.hero__particles[data-anim="stars"]
  - phase: 01-skeleton
    provides: usePrefersReducedMotion в src/lib/useReducedMotion.ts
provides:
  - Обёртка .hero__video с видео оригинала, двумя источниками под BASE_URL и ветками reduce/saveData
  - Стили видео по трём брейкпоинтам и высота секции оригинала (100svh / max(600px, 65svh) / max(600px, 64vh))
  - Проверка checkHeroVideo в scripts/check-dist.mjs: оба файла в dist и ссылки на них в JS-бандле
  - Hero.test.tsx на 15 кейсов: видео, источники, слои, muted, reduce, saveData, текст hero.css
affects: [17 приёмка SHIP-03 (визуальная сверка hero с оригиналом), 17 гейт SHIP-01]

tech-stack:
  added: []
  patterns:
    - "Подсказка navigator.connection.saveData читается один раз ленивым инициализатором useState: значение стабильно на сессию, рендер остаётся чистым"
    - "Компонент из соседнего файла, отличающегося только регистром, импортируется с явным расширением .tsx"
    - "Текстовые проверки CSS живут в тесте компонента: vitest с css: false отдаёт CSS-модули пустой строкой, файл читается с диска"

key-files:
  created: []
  modified:
    - src/components/hero/Hero.tsx
    - src/components/hero/hero.css
    - src/components/hero/Hero.test.tsx
    - scripts/check-dist.mjs
  deleted:
    - src/components/hero/GlobeCanvas.tsx
    - src/components/hero/GlobeCanvas.test.tsx
    - src/components/hero/globe.ts
    - src/components/hero/globe.test.ts
    - src/components/hero/Starfield.tsx

key-decisions:
  - "saveData читается через useState(() => prefersSaveData()) — единственный путь по указанию оркестратора; развилки с чтением прямо в рендере в коде нет"
  - "Импорт HeroParticles написан с расширением .tsx, как требует SUMMARY плана 14-01; рядом стоит комментарий с причиной"
  - "Спред NodeList и HTMLCollection в тесте заменён на Array.from: в tsconfig нет DOM.Iterable, tsc роняет TS2488"
  - "Комментарий .hero::after про «слой контраста поверх канваса» оставлен символ в символ: блок запрещено трогать, слово «канвас» теперь читается как canvas частиц"

patterns-established:
  - "Заглушки HTMLMediaElement.prototype.play и pause ставятся в beforeEach файла с видео: иначе jsdom печатает «Not implemented» на каждый рендер"
  - "Проверка бандла в check-dist идёт через общий bundleText(distDir): склейка чанков больше не дублируется"

requirements-completed: [GLOBE-01, GLOBE-02, GLOBE-03, GLOBE-05, GLOBE-06, GLOBE-07, GLOBE-08]

duration: 12 min
completed: 2026-09-06
---

# Phase 14 Plan 02: Hero — видео-глобус и стили оригинала Summary

**Canvas-глобус и CSS-звёздное поле уехали из кода, на их месте видео оригинала: `<video data-anim="globe">` с webm и mp4 под `BASE_URL`, `muted` через ref до `play()`, пауза на первом кадре при reduce и пустой `<video>` без источников при `saveData`; стили разложены по трём брейкпоинтам (cover с фильтром до 640px, `72% center` от 640px, 16:9 справа вверху с `screen` и двойной маской от 1280px), высота секции стала `100svh` / `max(600px, 65svh)` / `max(600px, 64vh)`.**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-09-06T15:53:34Z
- **Completed:** 2026-09-06T16:05:00Z
- **Tasks:** 3
- **Files modified:** 4, **deleted:** 5

## Accomplishments

- `Hero.tsx` (148 строк): обёртка `.hero__video` первым ребёнком секции, `<HeroParticles />` вторым, текстовая колонка третьей. У видео `autoPlay muted loop playsInline preload disablePictureInPicture disableRemotePlayback tabIndex={-1} aria-hidden="true" data-anim="globe"`, два `<source>` (webm первым — он вдвое легче). Эффект с зависимостью `[reduce]` дублирует `muted` свойством, при reduce вешает `loadeddata` и замораживает кадр (`pause()`, `currentTime = 0`), иначе зовёт `play()` и гасит отказ политики автовоспроизведения.
- `hero.css` (196 строк): высота секции по трём брейкпоинтам, блок `.hero__video` (absolute inset 0, z 0, flex-колонка к правому верхнему углу), видео с `cover` и `filter: saturate(1.18) contrast(1.28) brightness(0.96)`, от `40rem` — `object-position: 72% center` и `transform-origin: 72% 46%`, от `80rem` — `contain`, `aspect-ratio: 16 / 9`, `margin-left: auto`, `mix-blend-mode: screen` и пара масок через `mask-composite: intersect` с `-webkit-` дублями. Ниже `.hero__particles` (z 1, `opacity: .72`, `screen`).
- Удалены `GlobeCanvas.tsx`, `GlobeCanvas.test.tsx`, `globe.ts`, `globe.test.ts`, `Starfield.tsx`; из CSS ушли `.starfield__*`, `.globe-canvas` и оба `@keyframes star-drift*`. `motionPolicy.test.ts` не правился и зелёный: значение `stars` даёт `HeroParticles.tsx`, `globe` — видео.
- `Hero.test.tsx` вырос с 10 до 15 кейсов; `check-dist.mjs` получил `checkHeroVideo` и общий `bundleText`, всего 12 проверок.

## Task Commits

Коммитов нет: фаза идёт в worktree `agent-14`, слияние и коммиты делает оркестратор.

1. **Task 1: видео, стили, высота секции, удаление глобуса и звёздного поля** — без коммита, 2 файла изменены, 5 удалены
2. **Task 2: Hero.test.tsx под видео, saveData, reduce и текст CSS** — без коммита, 1 файл
3. **Task 3: checkHeroVideo в check-dist.mjs и полный гейт** — без коммита, 1 файл

## Files Created/Modified

| Файл | Что стало |
|---|---|
| `src/components/hero/Hero.tsx` | `prefersSaveData`, `videoRef`, эффект по `reduce`, `.hero__video` с двумя источниками, `<HeroParticles />` |
| `src/components/hero/hero.css` | высота секции 100svh / 65svh / 64vh, `.hero__video`, `.hero__video > video` на трёх брейкпоинтах, `.hero__particles`; звёздное поле и правило глобуса удалены |
| `src/components/hero/Hero.test.tsx` | 15 кейсов, из них 7 новых про видео, слои, muted, reduce, saveData и текст `hero.css` |
| `scripts/check-dist.mjs` | `HERO_VIDEO`, `MIN_VIDEO_BYTES`, `bundleText`, `checkHeroVideo`, вызов в `results` после `checkSectionIds` |
| удалены | `GlobeCanvas.tsx`, `GlobeCanvas.test.tsx`, `globe.ts`, `globe.test.ts`, `Starfield.tsx` |

`public/hero-globe.webm` и `public/hero-globe.mp4` не трогались: `git status` их не показывает.

## Новые кейсы Hero.test.tsx

| Тест | Что проверено |
|---|---|
| атрибуты автовоспроизведения | `.hero__video > video` есть; `data-anim="globe"`, `aria-hidden`, `tabindex="-1"`, `preload="auto"`, флаги `autoplay`, `loop`, `playsinline`, `disablepictureinpicture`, `disableremoteplayback` |
| источники под BASE_URL | ровно два `<source>`, webm с `video/webm` первым, mp4 с `video/mp4` вторым, каждый `src` от `/` и с нужным именем файла |
| порядок слоёв | дети секции: `.hero__video`, `canvas.hero__particles[data-anim="stars"][aria-hidden]`, `.hero__content` |
| без reduce | `muted === true`, `play` вызван один раз, `pause` не вызван |
| при reduce | `play` не вызван; после `loadeddata` вызван `pause`, `currentTime` сброшен с 3 в 0 |
| при saveData | видео есть, `<source>` внутри нет, `preload="none"`, canvas частиц на месте; после снятия подсказки источников снова два |
| текст `hero.css` | 19 строк стилей на месте, `starfield`, `star-drift`, `globe-canvas`, `clamp(600px, 92vh, 820px)` и `prefers-reduced-motion` отсутствуют |

## Проверки

| Команда | Результат |
|---|---|
| `npx vitest run src/components/hero` | 3 файла, 40 тестов, passed; строк «Not implemented» в выводе нет |
| `npx vitest run src/components/hero src/App.test.tsx src/styles/motionPolicy.test.ts` | 5 файлов, 67 тестов, passed |
| `npx vitest run` (весь набор) | 50 файлов, 515 тестов, passed (было 52 файла и 529 тестов: ушли `globe.test.ts` и `GlobeCanvas.test.tsx` на 19 кейсов, добавились 5 в `Hero.test.tsx`) |
| `npx tsc -b` | код 0 |
| `npm run lint` | код 0, без предупреждений |
| `npm run build` | 791 модуль, ошибок нет |
| `node scripts/check-dist.mjs` | код 0, `OK: 12 проверок` |
| `grep -rEn "Starfield\|GlobeCanvas\|starfield\|star-drift\|globe-canvas" src` | 1 попадание — устаревший комментарий в `HeroParticles.test.tsx` (см. «Issues»), в коде и CSS чисто |
| `git diff main -- src/components/hero/hero.css` | правки заканчиваются на `.hero__particles`; `.hero::after`, `.hero__content`, `.hero__title h1` не тронуты |
| `git status --short` | 3 `M` + 5 `D` из `files_modified`, `M scripts/check-dist.mjs`, `?? node_modules` (симлинк) |

### Вывод check-dist

```
OK index.html найден: dist/index.html
OK атрибут lang="ru"
OK заголовок страницы
OK метаданные description, og:title, og:url
OK ссылки на ассеты под /esd-onevoice27/assets/: проверено ссылок: 3
OK base не потерян
OK чанк vendor-map: vendor-map-BjCgd77U.js
OK размер JS-чанков, порог 500.0 КБ: самый большой index-bAhp4kXP.js — 393.4 КБ
OK id секций в бандле, всего 8
OK видео глобуса hero-globe.webm, hero-globe.mp4 в dist и ссылки в бандле: hero-globe.webm — 1869.8 КБ; hero-globe.mp4 — 2789.3 КБ
OK запасной текст в <noscript>
OK внешние хосты в index.html: thevladoss.github.io, fonts.googleapis.com, fonts.gstatic.com
OK: 12 проверок
```

### Размеры бандла до и после

| Чанк | До (сборка ветки до правок) | После | Δ |
|---|---|---|---|
| `assets/index-*.js` | 399 487 Б (390,1 КБ) | 402 830 Б (393,4 КБ) | +3 343 Б |
| `assets/vendor-map-*.js` | 182 700 Б | 182 700 Б | 0 |
| `assets/index-*.css` | 76,46 КБ | 76,17 КБ | −0,29 КБ |
| модулей в графе | 792 | 791 | −1 |

Главный чанк не уменьшился, а подрос: порт частиц крупнее снятых `globe.ts`, `GlobeCanvas.tsx` и `Starfield.tsx` вместе (см. «Assumption Drift»). Порог `check-dist` в 500 КБ держится с запасом 107 КБ.

## Smoke на preview

Playwright MCP в сессии исполнителя недоступен, поэтому замеры `video.paused`, `getBoundingClientRect()` и `getComputedStyle(video).objectFit` на 1440×900 и 390×844 переносятся в фазу 17 (SHIP-03). Что проверено вместо этого на `npx vite preview --port 4173`:

| Запрос | Ответ |
|---|---|
| `GET /esd-onevoice27/` | 200 |
| `HEAD /esd-onevoice27/hero-globe.webm` | 200, `Content-Type: video/webm`, `Content-Length: 1914635` (байт в байт с `public/`) |
| `HEAD /esd-onevoice27/hero-globe.mp4` | 200, `Content-Type: video/mp4`, `Content-Length: 2856265` |
| `grep -o "/esd-onevoice27/hero-globe.[a-z0-9]*" dist/assets/*.js` | обе ссылки в главном чанке |

## Decisions Made

- **`saveData` через ленивый инициализатор `useState`.** План оставлял развилку (чтение в рендере, а при возражении `react-hooks/purity` — `useState`); оркестратор закрыл её в пользу `useState(() => prefersSaveData())`. Подсказка браузера не меняется в течение сессии, поэтому одного чтения хватает, а рендер остаётся чистым.
- **Импорт `./HeroParticles.tsx` с расширением.** Требование SUMMARY плана 14-01: без расширения Vite резолвит путь в `heroParticles.ts` и компонент приходит `undefined`. Рядом стоит комментарий с причиной, чтобы расширение не «почистили» при рефакторинге.
- **`Array.from` вместо спреда NodeList.** См. отклонение 1.
- **Комментарий блока `.hero::after` оставлен как есть.** Блок запрещено трогать, а слово «канвас» в нём теперь читается как canvas частиц.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `npx tsc -b` падал на спреде NodeList и HTMLCollection**

- **Found during:** Task 2 (первая проверка гейта после написания тестов)
- **Issue:** `TS2488` в двух строках `Hero.test.tsx`: `[...(video?.querySelectorAll("source") ?? [])]` и `[...(section?.children ?? [])]`. В `tsconfig` нет `DOM.Iterable`, поэтому у `NodeListOf` и `HTMLCollection` нет `[Symbol.iterator]`. План предписывал `section.children[0..2]`, но спред читался ровнее.
- **Fix:** Обе строки переписаны на `Array.from(...)`. Правка внутри `files_modified`, `tsconfig` не трогался.
- **Files modified:** `src/components/hero/Hero.test.tsx`
- **Verification:** `npx tsc -b` код 0, `npx vitest run src/components/hero` — 40 тестов passed
- **Committed in:** — (коммитов у исполнителя нет)

---

**Total deviations:** 1 auto-fixed (блокирующее)
**Impact on plan:** Ни объём, ни поведение не менялись; правка чисто типовая.

## Assumption Drift (advisory)

**1. Главный JS-чанк не похудел, а прибавил 3,3 КБ**

- **Found during:** Task 3
- **Planned:** «Размер главного JS-чанка должен уменьшиться относительно `main` (ушли 2200 точек и математика сферы)».
- **Actual:** 390,1 КБ → 393,4 КБ (+3 343 Б). CSS при этом ушёл на 0,29 КБ вниз.
- **Why:** Порт частиц (`heroParticles.ts` + `HeroParticles.tsx`, 637 строк) весит больше, чем снятые `globe.ts`, `GlobeCanvas.tsx` и `Starfield.tsx` вместе. Выигрыш v1.2 не в размере бандла, а в кадрах: сферу считал JS на каждом кадре, теперь глобус декодирует GPU.
- Порог `check-dist` (500 КБ) не задет; на приёмке фазы 17 сравнивать стоит fps, а не байты.

## Issues Encountered

- **`App.test.tsx` и `App.seams.test.tsx` печатают 19 строк «Not implemented: HTMLMediaElement's play() method».** Оба рендерят `App` целиком, а заглушки медиа стоят только в `Hero.test.tsx` (`beforeEach` со шпионами). Тесты зелёные, это шум в выводе. Починка требует либо `src/test/setup.ts`, либо самих файлов `App*.test.tsx` — оба вне владения плана 14-02. Предложение оркестратору или фазе 17: добавить в `src/test/setup.ts` две строки со шпионами `HTMLMediaElement.prototype.play`/`pause`.
- **Устаревший комментарий в `HeroParticles.test.tsx`** («Хелперы повторяют `GlobeCanvas.test.tsx`: тот файл удаляет план 14-02»). Файл создан планом 14-01, в `files_modified` плана 14-02 его нет, поэтому он не правился: единственное попадание grep по `GlobeCanvas` во всём `src` — эта строка комментария. Живых ссылок на удалённые модули в коде нет.
- `node_modules` в worktree — симлинк на каталог основного репозитория и висит в `git status` как untracked (то же, что в плане 14-01). Стадить при слиянии нужно поимённо.

## User Setup Required

None.

## Next Phase Readiness

- Фаза 17 (SHIP-03) снимает визуальную приёмку: на 1440×900 ожидается видео 1067×600 справа вверху с `object-fit: contain`, на 390×844 — на весь экран с `cover`, `!paused` и растущий `currentTime`.
- Гейт SHIP-01 после слияния должен давать `OK: 12 проверок` в `check-dist`; строка `OK видео глобуса …` — новая.
- Слияние ветки `agent-14` затрагивает `scripts/check-dist.mjs`: фазы 15 и 16 этот файл не трогают, конфликта быть не должно.

## Self-Check: PASSED

- `/Users/thevladoss/devs/web/esd_cringe-wt/14/src/components/hero/Hero.tsx` — FOUND (148 строк)
- `/Users/thevladoss/devs/web/esd_cringe-wt/14/src/components/hero/hero.css` — FOUND (196 строк)
- `/Users/thevladoss/devs/web/esd_cringe-wt/14/src/components/hero/Hero.test.tsx` — FOUND (249 строк, 15 `it(`)
- `/Users/thevladoss/devs/web/esd_cringe-wt/14/scripts/check-dist.mjs` — FOUND (272 строки)
- `GlobeCanvas.tsx`, `GlobeCanvas.test.tsx`, `globe.ts`, `globe.test.ts`, `Starfield.tsx` — REMOVED (в `git status` как `D`)
- Коммитов не создавалось по указанию оркестратора; проверка хешей неприменима.

---
*Phase: 14-hero-video-particles*
*Completed: 2026-09-06*
