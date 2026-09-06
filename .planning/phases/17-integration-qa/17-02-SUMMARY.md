---
phase: 17-integration-qa
plan: 02
subsystem: testing
tags: [playwright, acceptance, fps, cdp, smoke, screenshots, docs, github-pages]

# Dependency graph
requires:
  - phase: 17-integration-qa
    provides: прод отдаёт сборку HEAD 827785c, побайтная сверка 7 из 7 (план 17-01)
  - phase: 14-hero-video-particles
    provides: video[data-anim="globe"] и canvas[data-anim="stars"] в hero
  - phase: 15-lights-canvas
    provides: canvas.map-lights-canvas со счётчиками и планировщиком 30 fps
  - phase: 16-mobile
    provides: цели касания 44px у ссылок футера, label согласия и логотипа
provides:
  - qa/v12-measure.js — снимок GLOBE, LIGHT и MOB на любом из двух сайтов одной функцией
  - qa/v12-run.mjs — драйвер с режимами measure, fps (CPU×4 через CDP) и shots
  - Восемь JSON замеров прода и оригинала в qa/results/
  - Шесть JPEG в docs/qa/ — hero и карта прода на двух вьюпортах, карта оригинала для сравнения
  - Раздел «Фаза 17 / v1.2» в docs/qa/SMOKE.md — приёмка с числами обеих сторон
affects: [закрытие milestone v1.2, README]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Частота кадров canvas меряется подменой ctx.clearRect на объекте контекста: второй getContext('2d') отдаёт тот же объект, delete возвращает метод прототипа"
    - "Счётчики обоих холстов идут внутри замера fps: по ним видно, кто рисует в секции и когда цикл встал"
    - "Доля кадров дольше 20 мс и maxGap читаются вместо медианы, когда стенд упирается в 120 Гц"

key-files:
  created:
    - .planning/phases/17-integration-qa/qa/v12-measure.js
    - .planning/phases/17-integration-qa/qa/v12-run.mjs
    - .planning/phases/17-integration-qa/qa/results/prod-measure-1440.json
    - .planning/phases/17-integration-qa/qa/results/prod-measure-390.json
    - .planning/phases/17-integration-qa/qa/results/prod-measure-1440-reduced.json
    - .planning/phases/17-integration-qa/qa/results/prod-fps-1440.json
    - .planning/phases/17-integration-qa/qa/results/prod-fps-390-cpu4.json
    - .planning/phases/17-integration-qa/qa/results/orig-measure-1440.json
    - .planning/phases/17-integration-qa/qa/results/orig-measure-390.json
    - .planning/phases/17-integration-qa/qa/results/orig-fps-390-cpu4.json
    - docs/qa/v12-hero-1440.jpeg
    - docs/qa/v12-hero-390.jpeg
    - docs/qa/v12-map-1440.jpeg
    - docs/qa/v12-map-390.jpeg
    - docs/qa/v12-orig-map-1440.jpeg
    - docs/qa/v12-orig-map-390.jpeg
  modified:
    - docs/qa/SMOKE.md
    - README.md

key-decisions:
  - "Оригинал открыт профилем фазы 13 через PW_PROFILE: challenge и баннер cookie на нём уже пройдены, свежий профиль тратил бы попытки"
  - "Ошибка goto «interrupted by another navigation» больше не хоронит попытку: challenge перезагружает страницу сам, документ уже открывается, драйвер ждёт якорь"
  - "Скриншоты hero оригинала не дублируются в docs/qa: они лежат в docs/research/v1.2, в приёмку добавлена только карта оригинала"

patterns-established:
  - "Селекторы обоих сайтов лежат таблицей в файле-снимке, драйвер про них не знает"
  - "Итог замера пишется в JSON рядом со скриптом, а SMOKE переписывает числа оттуда"

requirements-completed: [SHIP-03, SHIP-04, LIGHT-07]

# Metrics
duration: 21min
completed: 2026-09-06
---

# Phase 17 Plan 02: Приёмка v1.2 на проде против оригинала Summary

**Видео-глобус на проде совпал с оригиналом по всем измеренным величинам (1066,66×600 `contain` на 1440 и 390×844 `cover` на 390, тот же фильтр, маска и `mix-blend-mode`), огоньки на canvas дают 282 узла SVG против 3109 до v1.2, а бюджет LIGHT-07 закрыт с запасом: 120,2 / 120,3 / 120,3 при CPU×4 и пороге 55.**

## Performance

- **Duration:** 21 мин
- **Started:** 2026-09-06T16:57Z
- **Completed:** 2026-09-06T17:18Z
- **Tasks:** 3 из 3
- **Files modified:** 2 изменено, 16 создано

## Accomplishments

- Написаны два скрипта приёмки: снимок `v12-measure.js` (379 строк) и драйвер `v12-run.mjs` (487 строк) с режимами `measure`, `fps` и `shots`, троттлингом CPU через CDP и счётчиками кадров обоих холстов.
- Снято восемь JSON: прод на 1440, 390 и 1440 с `reduce`, fps на обоих вьюпортах, оригинал на 1440, 390 и его fps при CPU×4.
- Оригинал открылся, поэтому в SMOKE стоят его собственные числа, а не значения из `measurements.md`.
- Бюджет LIGHT-07 подтверждён на живом сайте: все гейтовые секции упёрлись в потолок стенда 120 Гц, доля кадров дольше 20 мс равна нулю.
- Аудит целей касания на 390 не нашёл ни одного нарушения: 47 проверенных узлов, ноль ниже 44px, у оригинала в том же аудите девять.
- Шесть скриншотов сняты и просмотрены, сравнение с выгрузками оригинала записано словами в SMOKE.

## Task Commits

Коммит и push делает оркестратор: исполнителю плана они запрещены.

1. **Task 1** — скрипты `qa/v12-measure.js` и `qa/v12-run.mjs`, пробный снимок прода на 1440
2. **Task 2** — восемь JSON в `qa/results/`, шесть JPEG в `docs/qa/`
3. **Task 3** — раздел «Фаза 17 / v1.2» в `docs/qa/SMOKE.md` (174 строки) и правка `README.md`

## Таблица fps

Три прогона по 2 с на секцию, в таблице медиана. Доля кадров дольше 20 мс равна нулю во всех прогонах
обеих сторон.

| Секция | До v1.2, 1440 | Прод 1440 | maxGap 1440 | Бюджет 1440 | До v1.2, 390 CPU×4 | Прод 390 CPU×4 | maxGap 390 | Оригинал 390 CPU×4 | Бюджет 390 | Вердикт |
|---|---|---|---|---|---|---|---|---|---|---|
| hero | 65 | **120,2** | 10,4 мс | ≥ 100 | 30 | **120,2** | 10,4 мс | 95,8 (18,7 мс) | ≥ 55 | PASS |
| карта | 66 | **120,3** | 10,4 мс | ≥ 100 | 30 | **120,3** | 10,4 мс | 120,4 (15,0 мс) | ≥ 55 | PASS |
| форма | 69 | **120,3** | 10,4 мс | ≥ 100 | 30 | **120,3** | 10,3 мс | не мерялась | ≥ 55 | PASS |
| about | 76 | 120,1 | 10,4 мс | нет | 73 | 120,3 | 10,4 мс | не мерялась | нет | информационно |
| потолок стенда | 120 | 120,2 | 10,4 мс | нет | 116–120 | 120,2 | 10,4 мс | не мерялась | нет | информационно |

Прогоны оригинала в hero разъехались (85,9 / 95,8 / 118,9), прод держал 120,1–120,4 в каждом прогоне.
Медианы прода упираются в частоту экрана, поэтому разница читается по `maxGap` и по разбросу.

Счётчики холстов внутри замера: на hero частицы дают 51–53 кадра за 2 с при нуле у огоньков, на карте
огоньки 55–60 при нуле у частиц. На секции формы 390 карта ушла с экрана (`mapIntersects` false) и цикл
огоньков встал: `lightsDraws` 0 во всех трёх прогонах. Это критерий 5 фазы 17. На 1440 карта остаётся в
кадре высотой 900px, там `mapIntersects` true и 58–60 кадров за 2 с.

## Видео и частицы: обе стороны

| Величина | Оригинал 1440 | Прод 1440 | Оригинал 390 | Прод 390 |
|---|---|---|---|---|
| Прямоугольник видео | 1066,66×600 | 1066,66×600 | 390×844 | 390×844 |
| Зазор справа, отступ от верха hero | 0 / 0 | 0 / 0 | видео во весь экран | видео во весь экран |
| `object-fit` / `object-position` | `contain` / `100% 0%` | `contain` / `100% 0%` | `cover` / `50% 50%` | `cover` / `50% 50%` |
| `mix-blend-mode` | `screen` | `screen` | `normal` | `normal` |
| Слоёв маски | 2 | 2 | 0 | 0 |
| Фильтр | `saturate(1.18) contrast(1.28) brightness(0.96)` | та же строка | та же строка | та же строка |
| Источник, размер, длительность | `Vml1788567268773.webm`, 1920×1080, 12,79 с | `hero-globe.webm`, 1920×1080, 12,79 с | то же | то же |
| Прирост `currentTime` за 1,5 с | 1,50 с | 1,50 с | 1,50 с | 1,50 с |
| Canvas частиц | 1440×600, `opacity` .72, `screen` | то же | 390×844, .72, `screen` | то же |
| Кадров частиц в секунду | 25,0 | 26,0 | 25,5 | 26,0 |

Разница размеров видео между сторонами равна нулю по обеим сторонам прямоугольника на обоих вьюпортах.

## Огоньки и цели касания

- Холст огоньков: 942 / 694 / 248 / 0, `position: absolute`, `pointer-events: none`, узел сразу за `<svg>`; битмап 1440×630 на десктопе и 390×591 на телефоне (контейнер 390×590,8 при `MAX_DPR` 2 и dpr 1).
- SVG после переезда: кругов 0, устаревших узлов огоньков 0, стран 177, узлов SVG на странице **282** при пороге 1300 (у оригинала 96: точки рисует Mapbox).
- Цикл огоньков: 29,5 кадра/с на обоих вьюпортах при `MIN_FRAME_GAP_MS` 33.
- Reduced motion на 1440: видео `paused` true с `currentTime` 0 до и после паузы, частицы 0 кадров/с, огоньки 0 кадров/с.
- Аудит 390: проверено 47 узлов, `small` пуст, `hidden` содержит два radio 1×1, `viaLabel` — чекбокс 20×20 при label 358×58,78. Ссылки футера 204,85×44 и 235,13×44, подпись логотипа 10px, логотип-ссылка 146×44,34 (на 1440 159×44,90), горизонтальной прокрутки нет (`scrollWidth` 390).
- Обложки новостей: первые три 480×360 `decoding="async"`, первая `loading="eager"` с `fetchpriority="high"`, остальные `lazy`.
- Для сравнения: у оригинала на 390 девять целей ниже 44px (логотип 146×29,93, три `input` 18×18, три действия триптиха 36px, две ссылки новостей 43,19px).

## Отклонения в SMOKE

Восемь пунктов: три из спецификации v1.2 (пауза видео при `reduce`, отказ от источников при `saveData`,
синусное дыхание вместо keyframes), палитра частиц литералами спеки, частота холста 24…30 из-за порога
кадра 33,3 мс при экране 120 Гц, шаг столбца ссылок футера 44px вместо 30,4px, тринадцать кнопок фильтра
карты 40px высотой на 1440 и уточнение про `a.skip-link`.

## Deviations from Plan

Дефектов приёмки нет, исходники не правились, останавливаться на чекпоинт не понадобилось. Три правки
внутри собственных скриптов приёмки:

**1. [Rule 1 — Bug] Слои маски считались дважды**
- **Found during:** Task 1, пробный снимок прода на 1440
- **Issue:** `maskLayers` вернул 4 вместо 2: Chrome отдаёт и `mask-image`, и `-webkit-mask-image`, а счётчик шёл по склейке обеих строк
- **Fix:** слои считаются по первой непустой строке маски
- **Files modified:** `qa/v12-measure.js`
- **Проверка:** повторный снимок дал `maskLayers` 2 на 1440 и 0 на 390

**2. [Rule 3 — Blocker] Полотно частиц оригинала не находилось**
- **Found during:** Task 2, первый снимок оригинала на 1440
- **Issue:** `canvas` внутри секции видео у оригинала нет, снимок вернул `particles.found` false и `drawsPerSecond` null
- **Fix:** запасной поиск по документу — первое широкое полотно, перекрывающее полосу hero
- **Files modified:** `qa/v12-measure.js`
- **Проверка:** оригинал отдал 1440×600 с `opacity` .72, `screen` и 25,0 кадра/с

**3. [Rule 3 — Blocker] Перезагрузка challenge роняла навигацию**
- **Found during:** Task 2, снимок оригинала на 390 (два запуска подряд с кодом 3)
- **Issue:** `page.goto` падает с «interrupted by another navigation», когда Vercel Security Checkpoint перезагружает страницу в момент навигации; попытка считалась провальной
- **Fix:** эта ошибка пропускается, драйвер продолжает ждать якорь `#ov-main-header`
- **Files modified:** `qa/v12-run.mjs`
- **Проверка:** следующий запуск открыл оригинал на 390 с первой попытки

Уточнения ожиданий плана, дефектами не являются:

- `a.skip-link` не попадает в список визуально скрытых 1×1: она спрятана через `clip-path: inset(50%)` при боксе больше 44px, поэтому проходит аудит как обычная цель касания.
- На 1440 в списке целей ниже 44px стоят тринадцать кнопок фильтра карты (40px высотой). На 390 те же кнопки не ниже 44px, а бюджет MOB закрывает мобильный вьюпорт.
- Скриншоты hero оригинала (`v12-orig-hero-*.jpeg`) сняты и удалены: те же кадры лежат в `docs/research/v1.2/`. В `docs/qa/` осталась карта оригинала на двух вьюпортах.

## Assumption Drift (advisory)

- **Планировалось:** оригинал за Vercel Security Checkpoint может не открыться, и тогда его значения берутся из `docs/research/v1.2/measurements.md` (hero 116,8 при CPU×4).
- **Фактически:** оригинал открылся на обоих вьюпортах, и его собственный замер дал в hero 95,8 против 116,8 в `measurements.md`.
- **Почему:** соседняя вкладка с Mapbox делит GPU со стендом. Числа записаны как есть, ограничение отмечено в «Замечаниях к методике».

## Issues Encountered

- Оригинал на 390 дважды упал в `net::ERR_TIMED_OUT` до сети Vercel. Лечится повторным запуском, как и в фазе 13.
- Замеры прода шли при открытой вкладке оригинала с Mapbox у оркестратора. На прод это не повлияло: все медианы 120,1–120,4 при потолке стенда 120 Гц, повторять серию не понадобилось.

## Deferred Issues

Нет.

## Known Stubs

Нет.

## Next Phase Readiness

Оркестратору по разделу `<orchestrator>` плана:

1. Стадировать поимённо: `docs/qa/SMOKE.md`, `README.md`, шесть `docs/qa/v12-*.jpeg`, `.planning/phases/17-integration-qa/qa/v12-measure.js`, `qa/v12-run.mjs`, восемь `qa/results/*.json`, `.planning/phases/17-integration-qa/17-02-SUMMARY.md`. Коммит `docs(17): приёмка v1.2 на проде, SMOKE, скриншоты, README и скрипты замеров`, затем `git push origin main`.
2. Дождаться прогона deploy.yml и перепроверить хэши: `node .planning/phases/17-integration-qa/qa/prod-hashes.mjs --retries 2 --out /dev/null` → код 0, имена ассетов те же (`index-D5PMozSR.js`, `index-BrMtUpqK.css`, `vendor-map-BjCgd77U.js`).
3. Верификация фазы 17 и закрытие milestone: аудит `v1.2-MILESTONE-AUDIT.md`, архив фаз 14–17 в `.planning/milestones/v1.2-phases/`, `v1.2-REQUIREMENTS.md`, `v1.2-ROADMAP.md`, обновление `MILESTONES.md`, `PROJECT.md`, `STATE.md`, `REQUIREMENTS.md` (SHIP-01…04 и LIGHT-07 в Complete), тег `git tag v1.2` и `git push origin v1.2`.

`prod-hashes.txt` плана 17-01 уже в коммите `eb16546`, стадировать его повторно не нужно.

## Self-Check: PASSED

- `/Users/thevladoss/devs/web/esd_cringe/.planning/phases/17-integration-qa/qa/v12-measure.js` — FOUND (379 строк)
- `/Users/thevladoss/devs/web/esd_cringe/.planning/phases/17-integration-qa/qa/v12-run.mjs` — FOUND (487 строк)
- Восемь JSON в `qa/results/` — FOUND, verify Task 2 прошёл: `matrix OK { hero4: 120.2, map4: 120.3, form4: 120.3, hero: 120.2, ceiling: 120.2, svg: [282, 282] }`
- Шесть JPEG в `docs/qa/` — FOUND, каждый больше 18 КБ
- `/Users/thevladoss/devs/web/esd_cringe/docs/qa/SMOKE.md` — FOUND, раздел «Фаза 17 / v1.2» на 174 строки, девять подразделов, пустых ячеек 0
- `/Users/thevladoss/devs/web/esd_cringe/README.md` — FOUND, `OK: 12 проверок` 1 раз, `OK: 11 проверок` 0 раз
- Коммитов исполнитель не делал: `git status --porcelain` показывает ровно файлы плана, корень репозитория чист
