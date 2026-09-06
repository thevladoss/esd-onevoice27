---
phase: 15-lights-canvas
plan: 03
subsystem: qa
tags: [map, canvas, playwright, performance, fps, light-07]

requires:
  - phase: 15-lights-canvas
    provides: LightsCanvas.tsx — холст огоньков с data-атрибутами и планировщиком 30 fps
  - phase: 15-lights-canvas
    provides: lightsCanvas.ts — MAX_DPR, BREATH_PERIOD_MS, clampDpr
  - phase: 08-map-band-and-lights
    provides: map-probe.mjs — резолв playwright из кэша npx, launchBrowser, замер rAF
provides:
  - qa/lights-probe.mjs — зонд с режимами lights и fps, троттлингом CPU через CDP и записью JSON/PNG
  - Семь JSON и два PNG в qa/results/ — числа LIGHT-07 после переезда огоньков на canvas
  - Команды и стенд для сводной таблицы фазы 17 против оригинала
affects: [17 сводная таблица производительности, 16 замеры формы после редизайна]

tech-stack:
  added: []
  patterns:
    - "Троттлинг CPU снимается перед закрытием страницы: rate 1 и detach, иначе следующий контекст того же браузера наследует нагрузку"
    - "Снимок кадра холста считает зажжённые пиксели и сумму альфы: сравнение двух снимков через 650 мс отличает живое дыхание от статичного кадра"
    - "Контроль стенда перед доверием числам: busy-loop под rate 4 и rAF на about:blank показывают, работает ли троттлинг и где потолок экрана"

key-files:
  created:
    - .planning/phases/15-lights-canvas/qa/lights-probe.mjs
    - .planning/phases/15-lights-canvas/qa/results/lights-1440x900.json
    - .planning/phases/15-lights-canvas/qa/results/lights-1440x900-reduced.json
    - .planning/phases/15-lights-canvas/qa/results/fps-map-390x844-cpu4.json
    - .planning/phases/15-lights-canvas/qa/results/fps-form-390x844-cpu4.json
    - .planning/phases/15-lights-canvas/qa/results/fps-map-1440x900.json
    - .planning/phases/15-lights-canvas/qa/results/fps-form-1440x900.json
    - .planning/phases/15-lights-canvas/qa/results/fps-map-390x844-cpu4-dpr2.json
    - .planning/phases/15-lights-canvas/qa/results/lights-1440x900-map.png
    - .planning/phases/15-lights-canvas/qa/results/lights-1440x900-zoomed.png
  modified: []

key-decisions:
  - "MAX_DPR остаётся 2: прогон на dpr 2 при CPU×4 дал медиану 120,4 против порога 55, снижать плотность холста нечем оправдать"
  - "Дефолт колеса зума -30 вместо -240: при -240 d3-zoom с ctrlKey упирается в ZOOM_MAX = 8, и на скриншоте после зума стран уже нет"
  - "Стенд проверен до чтения чисел: троттлинг замедляет JS ровно в 4,01 раза, пустая страница даёт 120,5 кадра — значит 120 в замерах это потолок экрана"

requirements-completed: [LIGHT-07]

duration: 16 min
completed: 2026-09-06
---

# Phase 15 Plan 03: Зонд fps и бюджет LIGHT-07 Summary

**Карта и форма держат 120 кадров при CPU×4 против 30 до фазы, узлов SVG на странице 282 против 3109, и `MAX_DPR` остаётся 2: прогон на реальной плотности телефона дал ту же медиану 120,4.**

## Performance

- **Duration:** 16 min
- **Started:** 2026-09-06T16:20:00Z
- **Completed:** 2026-09-06T16:36:00Z
- **Tasks:** 2
- **Files modified:** 10 создано, исходники не тронуты

## Accomplishments

- `lights-probe.mjs` (550 строк) повторяет резолв playwright из фазы 8 и добавляет то, чего там не было: троттлинг CPU через `Emulation.setCPUThrottlingRate`, снимок кадра холста через `getImageData`, зум Ctrl+колесом и запись каждого прогона в JSON рядом со скриншотами.
- Семь прогонов записаны, все PASS. Четыре гейтовых (карта и форма на 390×844 при CPU×4 и на 1440×900) прошли пороги LIGHT-07 с четырёхкратным запасом.
- Структура подтверждена браузером, а не тестом в jsdom: холст стоит сразу за `<svg>` внутри `.esd-map`, несёт 942/694/248/0, `position: absolute`, `pointer-events: none`, `inset` из четырёх нулей, битмап 1440×630 при dpr 1.
- Дыхание живое без reduce (сумма альфы за 650 мс сдвинулась с 9 299 718 на 9 265 886) и замирает под `reducedMotion: "reduce"` (оба снимка 5 587 891, зажжено 114 037 пикселей).
- Зум синхронен: после Ctrl+колеса вьюпорт получил `scale(2.2974)`, холст перерисован, оба скриншота лежат в `qa/results/`.

## Замеры LIGHT-07

### Стенд

| Параметр | Значение |
|---|---|
| Браузер | канал `chrome`, окно (не headless) |
| Playwright | 1.63.0-alpha-2026-08-31, `/Users/thevladoss/.npm/_npx/9833c18b2d85bc59/node_modules/playwright/index.js` |
| Сборка | `npm run build` в worktree `agent-15`, `dist/assets/index-DTo7azmo.js` 394,6 КБ (порог 500), предупреждений о чанках нет |
| Preview | `npx vite preview --port 4175 --strictPort`, порт был свободен |
| Мобильный вьюпорт | 390×844, `isMobile: true`, `hasTouch: true`, CPU×4 через CDP |
| Десктопный вьюпорт | 1440×900, без троттлинга |
| Замер | три прогона по 2000 мс rAF после `scrollIntoView({ block: "center" })` и паузы 2500 мс, медиана |

Команды (из корня worktree, зонд лежит в основном репозитории):

```
P=/Users/thevladoss/devs/web/esd_cringe/.planning/phases/15-lights-canvas/qa/lights-probe.mjs
U=http://localhost:4175/esd-onevoice27/
node $P lights --url $U --width 1440 --height 900
node $P lights --url $U --width 1440 --height 900 --reduced
node $P fps --url $U --width 390 --height 844 --cpu 4 --section map  --runs 3
node $P fps --url $U --width 390 --height 844 --cpu 4 --section form --runs 3
node $P fps --url $U --width 1440 --height 900 --section map  --runs 3
node $P fps --url $U --width 1440 --height 900 --section form --runs 3
node $P fps --url $U --width 390 --height 844 --cpu 4 --dpr 2 --section map --runs 3
```

### Таблица прогонов

| Секция | Вьюпорт | CPU | dpr | Три прогона | Медиана | maxGap, мс | Порог | Вердикт | Было (measurements.md) |
|---|---|---|---|---|---|---|---|---|---|
| карта | 390×844 | ×4 | 1 | 120,4 / 120,2 / 119,7 | **120,2** | 16,2 | 55 | PASS | 30 |
| форма | 390×844 | ×4 | 1 | 120,3 / 120,5 / 120,2 | **120,3** | 10,4 | 55 | PASS | 30 |
| карта | 1440×900 | — | 1 | 120,5 / 120,3 / 120,2 | **120,3** | 10,3 | 100 | PASS | 66 |
| форма | 1440×900 | — | 1 | 120,3 / 120,2 / 120,3 | **120,3** | 10,4 | 100 | PASS | 69 |
| карта (информационный) | 390×844 | ×4 | 2 | 120,5 / 120,3 / 120,4 | **120,4** | 10,4 | 55 | PASS | — |
| lights | 1440×900 | — | 1 | структура, дыхание, зум | — | — | все проверки | PASS | — |
| lights --reduced | 1440×900 | — | 1 | статичный кадр | — | — | все проверки | PASS | — |

Узлы SVG на странице: **3109 до фазы** (замер прода в `measurements.md`, из них 1884 круга огоньков) → **282 после**, потолок LIGHT-07 равен 1300. Кругов внутри карты 0, узлов `.map-lights`, `.light-bucket`, `.light-core`, `.light-ring`, `defs`, `radialGradient` тоже 0, стран 177.

### Контроль стенда

Медиана 120 под четырёхкратным троттлингом выглядит слишком хорошо, поэтому стенд проверен двумя замерами вне репозитория (скрипты остались в scratchpad сессии):

| Проверка | Результат | Вывод |
|---|---|---|
| Busy-loop 40 млн итераций на той же странице | 26 мс без троттлинга, 104 мс под rate 4, отношение 4,01 | `Emulation.setCPUThrottlingRate` работает |
| rAF 2 с на `about:blank` | 120,5 кадра без троттлинга, 121,0 под rate 4 | потолок экрана 120 Гц, и обе цифры замеров в него упираются |

Значит числа в таблице читаются так: карта и форма перестали ронять кадры и держат частоту экрана, а не «дают ровно 120». Разница между 120,2 и 120,4 внутри шума. Тонкий сигнал остался в `maxGapMs`: у карты на телефоне один кадр занял 16,2 мс (два интервала при 8,3 мс на кадр), у остальных прогонов пропусков нет вообще. До фазы карта на том же стенде давала 30 кадров, а hero — паузы до 133 мс.

### JSON режима lights

`lights-1440x900.json` (сокращён до содержательных полей):

```json
{
  "structure": {
    "anim": "pulse", "ariaHidden": "true",
    "lightCount": "942", "people": "694", "groups": "248", "fresh": "0",
    "position": "absolute", "pointerEvents": "none",
    "inset": ["0px", "0px", "0px", "0px"],
    "cssSize": { "width": 1440, "height": 630 },
    "bitmap": { "width": 1440, "height": 630 },
    "devicePixelRatio": 1,
    "expectedBitmap": { "width": 1440, "height": 630 },
    "previousSibling": "svg"
  },
  "svgNodes": 282, "svgNodeLimit": 1300,
  "mapCircles": 0, "legacyNodes": 0, "countries": 177,
  "breath": {
    "before": { "lit": 126098, "sum": 9299718 },
    "after":  { "lit": 125368, "sum": 9265886 },
    "gapMs": 650, "alive": true, "static": false
  },
  "zoom": {
    "wheel": -30,
    "transform": "translate(-934.1256311957302,-408.55833270657) scale(2.2973967099940698)",
    "k": 2.297, "litAfter": 111981, "changed": true
  },
  "failed": []
}
```

`lights-1440x900-reduced.json`: та же структура, `breath.before` и `breath.after` совпадают до байта (`lit` 114037, `sum` 5587891), `alive: false`, `static: true`, `zoom: null`, `failed: []`. Сумма альфы под reduce ниже дневной (5,59 млн против 9,3 млн), потому что статичный кадр рисует ореол радиусом 9 с alpha .22 вместо дышащего.

Битмап на dpr 2 в информационном прогоне: 780×1182 при CSS-размере 390×591, то есть `clampDpr(2)` вернул 2 и холст рисовал вчетверо больше пикселей.

### Решение по MAX_DPR

`MAX_DPR = 2` остаётся. Правило плана требовало снижения до 1,5, только если информационный прогон на dpr 2 даёт медиану ниже 55; он дал **120,4**. `src/components/map/lightsCanvas.ts` и `lightsCanvas.test.ts` не тронуты, `git status --short` в worktree показывает только симлинк `node_modules`.

### Скриншоты

| Файл | Что на нём |
|---|---|
| `lights-1440x900-map.png` | лента карты целиком: 942 огонька на странах ЕАД, счётчики 694 и 248 |
| `lights-1440x900-zoomed.png` | та же лента после Ctrl+колеса: масштаб 2,3×, побережье и огоньки сдвинулись вместе |

## Task Commits

Коммитов исполнитель не делал по указанию оркестратора: зонд и результаты лежат в рабочем дереве основного репозитория, слияние ветки `agent-15` за оркестратором.

1. **Task 1: `qa/lights-probe.mjs`** — режимы `lights` и `fps`, флаги `--url/--width/--height/--dpr/--cpu/--section/--runs/--wheel/--reduced/--out`, резолв playwright из кэша npx, CDP-троттлинг, запись JSON и PNG
2. **Task 2: матрица замеров** — сборка, preview 4175, семь прогонов, контроль стенда, решение по `MAX_DPR`

## Проверки

| Команда | Результат |
|---|---|
| `node --check .../lights-probe.mjs` | код 0 |
| `node .../lights-probe.mjs` без аргументов | подсказка по режимам, код 2 |
| `npm run build` (worktree) | код 0, предупреждений о чанках нет, самый большой чанк 394,6 КБ |
| `node scripts/check-dist.mjs` | код 0, 11 проверок PASS |
| `node $P lights ...` | PASS, `failed: []` |
| `node $P lights ... --reduced` | PASS, `failed: []` |
| Четыре гейтовых `fps` | PASS, медианы 120,2–120,3 |
| `node $P fps ... --dpr 2` | PASS, медиана 120,4 |
| `git status --short` в worktree | только `?? node_modules` (симлинк) |

## Decisions Made

- **Стенд проверяется до чисел.** Сто двадцать кадров под четырёхкратным троттлингом — это либо честный результат фазы, либо неработающий CDP. Отличить одно от другого можно только контрольным замером, поэтому в SUMMARY стоят и отношение busy-loop 4,01, и потолок `about:blank` 120,5.
- **Колесо зума мягче, чем в плане.** У d3-zoom `wheelDelta` умножается на 10 при `ctrlKey`, поэтому -240 и даже -100 сразу выбрасывают камеру на `ZOOM_MAX = 8`, а на скриншоте остаётся океан без единой страны. При -30 масштаб 2,297, и кадр показывает ровно то, ради чего он снимается: огоньки уехали вместе с побережьем.
- **Троттлинг снимается перед `page.close()`.** Контекст в зонде переиспользуется между режимами, и оставленный `rate: 4` испортил бы любой следующий замер в том же браузере.
- **Порог выбирается по троттлингу, а не по ширине окна.** `floor` равен 55 при `--cpu > 1` и 100 иначе: замер на 390×844 без троттлинга (такой в плане не значится, но фазе 17 пригодится) не должен проходить по мобильному порогу.

## Deviations from Plan

**1. [Rule 3 — Blocking] Зонд и результаты лежат в основном репозитории, а не в worktree**
- **Найдено:** Task 1, до написания файла
- **Причина:** worktree `agent-15` создан от коммита, где каталога `.planning/phases/15-lights-canvas/` ещё нет; писать туда значит плодить конфликт при слиянии
- **Фикс:** зонд, JSON и PNG созданы в `/Users/thevladoss/devs/web/esd_cringe/.planning/phases/15-lights-canvas/qa/`, сборка и preview подняты из worktree — указание оркестратора
- **Файлы:** все артефакты плана

**2. [Rule 2 — Missing] Флаг `--wheel` с дефолтом -30 вместо жёстко зашитого -240**
- **Найдено:** Task 2, после первого прогона `lights`
- **Причина:** план фиксировал `page.mouse.wheel(0, -240)`. При `ctrlKey` d3-zoom умножает дельту на 10, поэтому и -240, и -100 дают `scale(8)` — потолок зума. Скриншот «после» получался пустым океаном: стран в кадре нет, доказать синхронность огоньков со странами нечем
- **Фикс:** значение колеса вынесено во флаг `--wheel` (дефолт -30), попало в JSON как `zoom.wheel`; итоговый прогон сделан на дефолтах, чтобы команда без флагов в фазе 17 воспроизвела тот же артефакт
- **Файл:** `.planning/phases/15-lights-canvas/qa/lights-probe.mjs`
- **Проверка:** `zoom.k` 2,297, `litAfter` 111 981, на `lights-1440x900-zoomed.png` видны и побережье, и огоньки

**3. [Rule 2 — Missing] Контроль стенда двумя замерами вне репозитория**
- **Найдено:** Task 2, после первого прогона `fps`
- **Причина:** без доказательства, что троттлинг применился, таблица из 120-х ничего не подтверждает (T-15-07 требует воспроизводимости)
- **Фикс:** busy-loop под `rate 1` и `rate 4` (26 мс против 104 мс) и rAF на `about:blank` (120,5); скрипты остались в scratchpad сессии, в репозиторий не попали
- **Файлы:** нет, результаты записаны в раздел «Контроль стенда»

## Assumption Drift (advisory)

**План ждал, что fps окажется между порогом и потолком, а прогон на dpr 2 может провалиться.** Отсюда и правило про снижение `MAX_DPR`, и информационный прогон. По факту все пять замеров упёрлись в частоту экрана 120 Гц, и стенд перестал различать конфигурации: карта, форма, dpr 1 и dpr 2 дают 120,2–120,4. Решение по dpr принято, но принято по потолку, а не по нагрузке. Фазе 17 для сравнения с оригиналом одного rAF мало: разницу покажет `PerformanceObserver` по длинным задачам или доля пропущенных кадров, а не медиана fps на 120-герцевом экране.

## Requirements

LIGHT-07 закрыт: пороги 55 и 100 выдержаны четырьмя гейтовыми прогонами, узлов SVG 282 против потолка 1300. `REQUIREMENTS.md`, `STATE.md` и `ROADMAP.md` план не трогал — отметки за оркестратором.

## Known Stubs

Заглушек нет.

## Threat Flags

Нового периметра нет: зависимости в репозиторий не добавлялись, `package.json` и `package-lock.json` не менялись, playwright взят из кэша npx. T-15-07 закрыт сырыми JSON с тремя прогонами, `maxGapMs`, каналом браузера и разделом «Контроль стенда». T-15-08 закрыт тем, что `getImageData` вызывается только в режиме `lights` и никогда во время замера fps. T-15-09 остаётся accept: на скриншотах область карты с localhost без данных посетителей.

## Оговорки для фазы 17

- Стенд ограничен экраном 120 Гц; на машине с 60 Гц те же команды дадут около 60, и порог 100 на десктопе перестанет проходить. Порог писался под 120-герцевый стенд фазы 15.
- Замеры делались при закрытых WebGL-вкладках, без параллельных `npm test` и `npm run build`, окно Chrome выводилось на передний план `bringToFront`.
- Фазы 14 и 16 меняют hero и форму; после их слияния прогоны `fps --section form` стоит повторить теми же командами.
- Зонд не привязан к каталогу фазы: `--out` принимает любой путь, поэтому фаза 17 может складывать свои результаты рядом со своими артефактами.

## Self-Check: PASSED

- `.planning/phases/15-lights-canvas/qa/lights-probe.mjs` — FOUND (550 строк)
- `qa/results/lights-1440x900.json` — FOUND, `failed: []`
- `qa/results/lights-1440x900-reduced.json` — FOUND, `static: true`
- `qa/results/fps-map-390x844-cpu4.json` — FOUND, медиана 120,2
- `qa/results/fps-form-390x844-cpu4.json` — FOUND, медиана 120,3
- `qa/results/fps-map-1440x900.json` — FOUND, медиана 120,3
- `qa/results/fps-form-1440x900.json` — FOUND, медиана 120,3
- `qa/results/fps-map-390x844-cpu4-dpr2.json` — FOUND, медиана 120,4
- `qa/results/lights-1440x900-map.png` — FOUND (411 КБ)
- `qa/results/lights-1440x900-zoomed.png` — FOUND (335 КБ)
- Коммитов нет по указанию оркестратора: артефакты лежат в рабочем дереве основного репозитория, исходники в worktree `agent-15` не менялись
