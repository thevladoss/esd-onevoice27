---
phase: 14-hero-video-particles
plan: 01
subsystem: ui
tags: [hero, canvas, particles, motion, vitest]

requires:
  - phase: 05-polish-and-deploy
    provides: реестр data-anim и политика reduced motion в motionPolicy.test.ts
  - phase: 01-skeleton
    provides: REDUCED_MOTION_QUERY и prefersReducedMotion в src/lib/useReducedMotion.ts
provides:
  - Чистый модуль heroParticles.ts — порт docs/research/v1.2/orig-hero-motion.js со всеми числами оригинала и палитрой литералами
  - Компонент HeroParticles с canvas.hero__particles[data-anim="stars"], циклом 30 fps и паузами по видимости, вкладке и reduce
  - Пара чистых функций кадра shouldDrawFrame/frameElapsed и предикат shouldAnimate для повторного использования в цикле карты
  - particleFrame(particle, time) — числа мерцания, вспышки и глубины отдельно от отрисовки
affects: [14-02 подключение в Hero.tsx и стиль .hero__particles, 15 огоньки карты (тот же приём паузы цикла)]

tech-stack:
  added: []
  patterns:
    - "Порт стороннего скрипта делится надвое: чистый модуль с состоянием в объекте Scene и React-компонент с наблюдателями; тесты гоняют те же формулы, что и браузер"
    - "Источник случайности — параметр random со значением по умолчанию Math.random: тест подставляет seededRandom и получает воспроизводимую сцену"
    - "Статичное звёздное поле рисуется один раз на offscreen-canvas и кладётся кадром через drawImage"

key-files:
  created:
    - src/components/hero/heroParticles.ts
    - src/components/hero/heroParticles.test.ts
    - src/components/hero/HeroParticles.tsx
    - src/components/hero/HeroParticles.test.tsx
  modified: []

key-decisions:
  - "Компонент импортируется с явным расширением (\"./HeroParticles.tsx\"): имена heroParticles.ts и HeroParticles.tsx различаются только регистром, macOS регистр в путях не различает, а Vite перебирает .ts раньше .tsx — без расширения импорт приводит к чистому модулю. Hero.tsx в плане 14-02 обязан импортировать так же"
  - "Формулы кадра вынесены в экспорт particleFrame: тест проверяет pulse, flare, depth, drawRadius и alpha числами, а не следами вызовов контекста (требование чекера плана)"
  - "resolveBrandColors оригинала не портирован: палитра задана литералами 248 247 251 / 227 175 210 / 184 192 230 / 170 217 220, как требует GLOBE-04"

patterns-established:
  - "Пауза цикла рвёт отсчёт времени (lastTime = 0), иначе первый кадр после возврата вкладки прыгает на всю длину паузы"
  - "IntersectionObserver вешается на ближайшую section с rootMargin 100px, ResizeObserver — на сам canvas"

requirements-completed: [GLOBE-04, GLOBE-05, GLOBE-07]

duration: 10 min
completed: 2026-09-06
---

# Phase 14 Plan 01: Порт canvas-частиц оригинала Summary

**Скрипт частиц оригинала переехал в пару `heroParticles.ts` + `HeroParticles.tsx` без единого изменённого числа: шаг 30 fps с потолком 40 мс, dpr 1,75 и 1,25, seed 270927, счёт 3600/12000 с потолками 220/340/520 и 70/100/140, три туманности, падающие звёзды каждые 4,2–9,2 с и лучи при flare > .34; цикл стоит вне экрана, в скрытой вкладке и при reduce, а в jsdom компонент молчит и не просит кадров.**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-09-06T15:40:00Z
- **Completed:** 2026-09-06T15:50:00Z
- **Tasks:** 2
- **Files created:** 4 (1235 строк)

## Accomplishments

- `heroParticles.ts` (476 строк) держит весь порт: константы, `seededRandom`, `randomBetween`, `starCount`, `particleCount`, `pickColor`, `shouldDrawFrame`, `frameElapsed`, `shouldAnimate`, `createParticle`, `createNebulae`, `createShootingStar`, `createScene`, `populateScene`, `renderStaticField`, `particleFrame`, `drawScene`. DOM модуль не трогает: `document.`, `window.`, `getComputedStyle` и запрос кадра в нём не встречаются ни разу, состояние живёт в объекте `Scene`, случайность приходит параметром.
- `HeroParticles.tsx` (161 строка) рисует `<canvas class="hero__particles" data-anim="stars" aria-hidden="true">`, ведёт цикл через `shouldDrawFrame`/`frameElapsed`, вешает `ResizeObserver` на canvas, `IntersectionObserver` с `rootMargin: "100px"` на ближайшую `section`, слушает `visibilitychange` и `change` медиазапроса. Вне экрана, в скрытой вкладке и при reduce рисуется один статичный кадр: туманности на фазе, падающие звёзды сброшены.
- Палитра задана литералами и проверяется тестом на все четыре тройки; `getComputedStyle` из оригинала не переносился.
- Формулы кадра проверены числами: `pulse = 0,64 + sin(phase + t·twinkle)·0,36`, `drawRadius = radius·(1 + (1 − depth)·3,2)`, `alpha = min(1, (alpha·pulse + flare·0,86)·(0,28 + depth·0,72))` и стопы туманности `0.085 / 0.050 / 0.018 / 0`.

## Task Commits

Коммитов нет: фаза идёт в worktree `agent-14`, слияние и коммиты делает оркестратор. Все четыре файла лежат в рабочем дереве со статусом `??`.

1. **Task 1: Чистый модуль heroParticles.ts и его тесты** — без коммита, 2 файла
2. **Task 2: Компонент HeroParticles.tsx и его тесты** — без коммита, 2 файла

## Files Created/Modified

- `src/components/hero/heroParticles.ts` — порт скрипта оригинала: 20 экспортируемых констант и функций, типы `RGB`, `Random`, `Particle`, `Nebula`, `ShootingStar`, `Scene`, `ParticleFrame`
- `src/components/hero/heroParticles.test.ts` — 20 тестов чистых функций
- `src/components/hero/HeroParticles.tsx` — canvas-слой с циклом кадров и наблюдателями
- `src/components/hero/HeroParticles.test.tsx` — 5 тестов компонента

## Экспорты heroParticles.ts

| Группа | Имена |
|---|---|
| Палитра | `BRAND_COLORS`, `PALETTE` |
| Константы кадра | `FRAME_INTERVAL_MS` (1000/30), `MAX_ELAPSED_MS` (40), `MAX_PIXEL_RATIO` (1.75), `STATIC_MAX_PIXEL_RATIO` (1.25), `STATIC_SEED` (270927) |
| Брейкпоинты и счёт | `TABLET_MIN_WIDTH`, `DESKTOP_MIN_WIDTH`, `STAR_MAX`, `PARTICLE_MAX`, `STATIC_RIGHT_SHARE` (0.62), `PARTICLE_RIGHT_SHARE` (0.58) |
| Падающие звёзды и лучи | `SHOOTING_STAR_GAP_MS` ([4200, 9200]), `FIRST_SHOOTING_STAR_GAP_MS` ([1600, 4800]), `FLARE_RAY_THRESHOLD` (0.34) |
| Наблюдение | `VIEWPORT_ROOT_MARGIN` ("100px") |
| Функции | `seededRandom`, `randomBetween`, `isDesktop`, `starCount`, `particleCount`, `pickColor`, `shouldDrawFrame`, `frameElapsed`, `shouldAnimate`, `createParticle`, `createNebulae`, `createShootingStar`, `createScene`, `populateScene`, `renderStaticField`, `particleFrame`, `drawScene` |
| Типы | `RGB`, `Random`, `Particle`, `Nebula`, `ShootingStar`, `Scene`, `ParticleFrame` |

`drawNebulae` и `drawShootingStars` остались внутренними: наружу их контракт `<interfaces>` не выводит.

## Тесты

### `heroParticles.test.ts` — 20 тестов

| Группа | Что проверено |
|---|---|
| `seededRandom` (2) | одно зерно даёт ту же пятёрку значений, каждое в [0, 1); зёрна 1 и 2 расходятся |
| счёт (2) | `starCount` 140 / 199 / 240 / 520 и `particleCount` 48 / 60 / 72 / 140 на 390×844, 1024×700, 1440×600, 1920×1080 |
| палитра (2) | четыре литерала оригинала; `pickColor(() => 0)` → light, `pickColor(() => 0.99)` → horizon, без аргумента — элемент `PALETTE` |
| шаг кадра (3) | пропуск кадра на 30 мс и отрисовка на 34; `frameElapsed` 0 / 20 / 40; `shouldAnimate` только на трёх поднятых флагах |
| `createParticle` (2) | диапазоны x, y, radius, alpha и цвет из палитры для «правой» частицы и для обычной |
| `createNebulae` (1) | три облака с цветами signal, unity, horizon и долями 0,25/0,46/0,62, 0,66/0,31/0,54, 0,82/0,68/0,48 |
| `populateScene` (1) | offscreen-canvas 1800×750 при dpr 1,75 (обрезка до 1,25), 240 вызовов `arc`, 72 частицы, 3 туманности |
| `drawScene` (5) | один `clearRect(0, 0, 1440, 600)`, ≥3 радиальных градиента, `drawImage` без статичного контекста не зовётся, `screen` на каждом `fill`, по одному `save`/`restore`; стопы туманности `0.085 / 0.050 / 0.018 / 0` строками; статичный кадр очищает падающие звёзды и не строит линейный градиент; живой кадр запускает звезду и назначает следующую в [1000 + 4200, 1000 + 9200]; лучи при flare = 1 дают ≥2 `moveTo`, ≥2 `lineTo` и `stroke`, без вспышки `moveTo` молчит |
| `particleFrame` (2) | частица без вспышки на t = 1000: pulse 0,9429295545, drawRadius 2, alpha 0,4714647773; частица на дальней глубине со вспышкой: pulse 1, flare 1, depth 0, drawRadius 4,2, alpha 0,4088 |

### `HeroParticles.test.tsx` — 5 тестов

| Тест | Что проверено |
|---|---|
| без 2d-контекста | `render` не бросает, canvas с классом, `data-anim="stars"` и `aria-hidden` на месте, кадр не запрошен |
| reduce | кадров не просит, `clearRect` вызван, радиальных градиентов ≥3 (один статичный кадр) |
| шаг 30 fps | кадр на 1000 рисует, на 1010 пропускает и просит следующий, на 1040 снова рисует; размонтирование снимает последний выданный id |
| скрытая вкладка | `visibilitychange` при `document.hidden` снимает кадр, рисует статичный и новых не просит; возврат вкладки просит кадр снова |
| наблюдение | `IntersectionObserver` создан с `rootMargin: "100px"` и наблюдает `<section>`, а не сам canvas |

## Проверки кода

| Команда | Результат |
|---|---|
| `npx vitest run src/components/hero/heroParticles.test.ts` | 1 файл, 20 тестов, passed |
| `npx vitest run src/components/hero/HeroParticles.test.tsx` | 1 файл, 5 тестов, passed |
| `npx vitest run src/components/hero src/styles/motionPolicy.test.ts` | 6 файлов, 67 тестов, passed (реестр `data-anim` принял `stars` без правок политики) |
| `npm test` (весь набор) | 52 файла, 529 тестов, passed |
| `npx tsc -b` | код 0 |
| `npm run lint` | код 0, без предупреждений |
| `grep -E "document\.\|window\.\|getComputedStyle\|requestAnimationFrame" heroParticles.ts` вне комментариев | 0 строк |
| `grep -c "Math.random()" heroParticles.ts` | 0 (генератор приходит параметром, значение по умолчанию — `Math.random` без вызова) |
| литералы 270927, 1664525, 1013904223, 4294967296, 1000 / 30, 1.75, 1.25, 3600, 12000, 0.62, 0.58, 4200, 9200, 0.34, "screen", "100px" и четыре тройки палитры | все на месте |
| `git status --short` | четыре файла плана со статусом `??` (плюс симлинк `node_modules`, см. «Issues») |

## Decisions Made

- **Импорт компонента с явным расширением.** `heroParticles.ts` и `HeroParticles.tsx` различаются только регистром первой буквы. На macOS файловая система регистр в путях не различает, Vite перебирает расширения в порядке `.ts` → `.tsx`, поэтому `import { HeroParticles } from "./HeroParticles"` резолвится в чистый модуль и отдаёт `undefined`. Тест импортирует `"./HeroParticles.tsx"`; `allowImportingTsExtensions: true` в `tsconfig.app.json` это разрешает. **План 14-02 обязан написать в `Hero.tsx` ровно `import { HeroParticles } from "./HeroParticles.tsx"`**, иначе сборка упадёт на пустом экспорте.
- **`particleFrame` сверх контракта.** Числа мерцания, вспышки, глубины, радиуса и прозрачности вынесены из `drawScene` в чистую функцию, чтобы тест сверял их с эталоном напрямую. Остальные имена контракта `<interfaces>` не менялись.
- **`drawShootingStars` и `drawNebulae` не экспортируются.** Список экспортов в плане их не содержит, а `drawScene` вызывает их изнутри; экспорт добавил бы публичную поверхность без пользы.
- **Статичный кадр рисуется и в `resize`.** Оригинал в `resize` всегда зовёт `draw(performance.now(), 0)`; у нас пятый аргумент равен `!running()`, поэтому при reduce первый же кадр после разметки поля получается статичным, без лишнего вызова.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Импорт `./HeroParticles` резолвился в чистый модуль**

- **Found during:** Task 2 (первый прогон `HeroParticles.test.tsx`)
- **Issue:** Все пять тестов падали с «Element type is invalid: … but got: undefined». Причина не в компоненте: на регистронезависимой файловой системе macOS путь `./HeroParticles` + расширение `.ts` совпадает с `heroParticles.ts`, а `.ts` Vite пробует раньше `.tsx`.
- **Fix:** В тесте импорт переписан на `"./HeroParticles.tsx"` с комментарием, объясняющим порядок расширений и требование к `Hero.tsx` в плане 14-02.
- **Files modified:** `src/components/hero/HeroParticles.test.tsx`
- **Verification:** `npx vitest run src/components/hero/HeroParticles.test.tsx` — 5 тестов passed; `npx tsc -b` код 0
- **Committed in:** — (коммитов у исполнителя нет)

**2. [Rule 2 - Missing critical] Экспорт `particleFrame` сверх блока `<interfaces>`**

- **Found during:** Task 1
- **Issue:** Чекер плана требует числовые проверки формул кадра, а внутри `drawScene` их значения наружу не видны: тест мог бы сверять только аргументы `arc` и строки `rgba`, что ломается от любой перестановки вызовов.
- **Fix:** Добавлены тип `ParticleFrame` и функция `particleFrame(particle, time)`; `drawScene` берёт значения у неё, дублирования формул нет.
- **Files modified:** `src/components/hero/heroParticles.ts`, `src/components/hero/heroParticles.test.ts`
- **Verification:** два теста `particleFrame` сверяют pulse, flare, depth, drawRadius и alpha с числами, посчитанными вручную (точность 1e-9)
- **Committed in:** —

---

**Total deviations:** 2 auto-fixed (1 блокирующее, 1 добавление по требованию чекера)
**Impact on plan:** Порт сделан числом в число, объём не расширялся. Единственное, что обязано доехать до плана 14-02, — расширение в пути импорта.

## Assumption Drift (advisory)

**1. Палитра порта ярче не станет, но она не палитра `orig-hero-motion.js`**

- **Found during:** Task 1
- **Planned:** «порт один к одному» (GLOBE-04).
- **Actual:** Числа, диапазоны, порядок вызовов и стопы градиентов совпадают с оригиналом, а цвета — нет: в скрипте оригинала литералы `255 236 255`, `210 142 190`, `126 164 255`, `91 211 226`, потом заменяемые значениями CSS-переменных сайта. Спека GLOBE-04 предписывает наши четыре тройки.
- **Why:** Оригинал читает переменные своей темы через `getComputedStyle`; у нас палитра проекта другая, и спека зафиксировала её литералами.
- Визуально частицы будут чуть светлее и холоднее оригинальных. Если план 14-02 или приёмка фазы захотят совпадения по цвету, менять надо `BRAND_COLORS` (одно место), тест палитры и спеку.

## Issues Encountered

`node_modules` в worktree — симлинк на каталог основного репозитория, а `.gitignore` содержит `node_modules/` со слешем и симлинк под правило не подпадает: в `git status --short` он висит как untracked. Файлов плана это не касается, но при слиянии стадить нужно поимённо.

## User Setup Required

None.

## Next Phase Readiness

- План 14-02 берёт `<HeroParticles />` готовым: остаётся импорт **с расширением `.tsx`**, вставка между `.hero__video` и `.hero__content` и правило `.hero__particles` в `hero.css` (`position: absolute; inset: 0; z-index: 1; width: 100%; height: 100%; opacity: .72; mix-blend-mode: screen; pointer-events: none`).
- `IntersectionObserver` уже ищет ближайшую `section`, поэтому в `Hero.tsx` компонент должен лежать внутри `<section class="hero">`, а не рядом с ней.
- Значение `stars` реестра `data-anim` теперь живёт в `HeroParticles.tsx`: удаление `Starfield.tsx` в плане 14-02 не уронит `motionPolicy.test.ts`.
- Фаза 15 может забрать `shouldDrawFrame`, `frameElapsed` и `shouldAnimate` из этого модуля вместо своей копии шага 30 fps.

## Self-Check: PASSED

- `src/components/hero/heroParticles.ts` — FOUND (476 строк)
- `src/components/hero/heroParticles.test.ts` — FOUND (388 строк)
- `src/components/hero/HeroParticles.tsx` — FOUND (161 строка)
- `src/components/hero/HeroParticles.test.tsx` — FOUND (210 строк)
- Коммитов не создавалось по указанию оркестратора; проверка хешей неприменима.

---
*Phase: 14-hero-video-particles*
*Completed: 2026-09-06*
