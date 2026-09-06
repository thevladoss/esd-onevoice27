---
phase: 13-integration-qa
plan: 01
subsystem: testing
tags: [integration, vitest, gate, deploy, github-pages, playwright, seams]

# Dependency graph
requires:
  - phase: 08-map-band-and-lights
    provides: лента .map-band, пять корзин огоньков, зонд map-probe.mjs с режимами band/fps/lights
  - phase: 09-form-original
    provides: прозрачная секция формы без .glass-card и своего ::before
  - phase: 07-glass-and-titles
    provides: утилиты glass и glass-resource, варианты gradient-title
  - phase: 10-video-and-news
    provides: VideoEmbed 16:9 с object-fit cover
  - phase: 11-resources-panels
    provides: полноэкранные панели порталом в body, deep link #resources-materials
  - phase: 12-footer
    provides: одноколоночный футер с закреплённым порядком узлов
provides:
  - Тест стыков App.seams.test.tsx на рендере всего приложения (5 сценариев)
  - Снимок стыков seams.evaluate.js и драйвер seams-run.mjs для живой страницы
  - JSON зонда фазы 8 на preview 4173 (band 1440/390, lights, lights --reduced, fps)
  - Таблица побайтной сверки прода с dist (prod-hashes.txt)
  - Уточнённые MAP-06 и MAP-07 в REQUIREMENTS.md
affects: [13-02 приёмка Playwright, docs/qa/SMOKE.md]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Стыки фаз закрепляются тестом на рендере всего приложения, а не в тестах отдельных компонентов"
    - "Один evaluate-файл снимает все вычисленные стили сразу и работает и через MCP, и через Node-драйвер"

key-files:
  created:
    - src/App.seams.test.tsx
    - .planning/phases/13-integration-qa/qa/seams.evaluate.js
    - .planning/phases/13-integration-qa/qa/seams-run.mjs
    - .planning/phases/13-integration-qa/qa/results/preview-band-1440.json
    - .planning/phases/13-integration-qa/qa/results/preview-band-390.json
    - .planning/phases/13-integration-qa/qa/results/preview-lights-1440.json
    - .planning/phases/13-integration-qa/qa/results/preview-lights-reduced-1440.json
    - .planning/phases/13-integration-qa/qa/results/preview-fps-1440.json
    - .planning/phases/13-integration-qa/qa/results/preview-seams-1440.json
    - .planning/phases/13-integration-qa/qa/results/prod-hashes.txt
  modified:
    - .planning/REQUIREMENTS.md

key-decisions:
  - "Правила .map-band .lf-section в map.css оставлены: после фазы 9 они no-op, но MapBand.test.tsx закрепляет их текстом, и удаление потребовало бы правки чужого теста без выигрыша"
  - "Снимок стыков снят Node-драйвером на playwright из кэша npx: Playwright MCP у исполнителя нет, а формат seams.evaluate.js остался пригодным для browser_evaluate плана 13-02"
  - "Тест стыка карты подменяет getBoundingClientRect только у .esd-map: без измеренного контейнера jsdom не строит проекцию и SVG огоньков не рендерится"

patterns-established:
  - "Значения CSS в тестах стыков читаются из текста файлов-владельцев: vitest настроен с css: false"
  - "Приём деплоя — sha256 четырёх живых файлов против локального dist, а не код ответа 200"

requirements-completed: [QA-01, QA-02]

# Metrics
duration: 14 min
completed: 2026-09-06
---

# Phase 13 Plan 01: Стыки, гейт и деплой Summary

**Пять стыков шести слитых фаз закреплены тестом на рендере всего приложения и подтверждены в живом Chrome; гейт из пяти команд зелёный (50 файлов, 503 теста, `OK: 11 проверок`), зонд карты даёт медиану 70,7 fps и статичный ореол .22 при reduce, а прод после деплоя побайтно равен локальному `dist` — 4 файла из 4.**

## Performance

- **Duration:** 14 min
- **Started:** 2026-09-06T09:13:00Z
- **Completed:** 2026-09-06T09:27:00Z
- **Tasks:** 3
- **Files modified:** 11 (10 создано, 1 изменён)

## Accomplishments

- Все пять стыков проверены статически, тестом и в браузере: форма внутри `.map-band` прозрачна (`rgba(0, 0, 0, 0)`, `::before` `none`), карточки ресурсов получают `blur(14px) saturate(1.25)`, заголовок формы плоский `rgb(239, 237, 245)` против градиентного About с `104deg`, панель «Видео» показывает 16 превью с отношением 1.7778, вход по `#resources-materials` открывает материалы с раскрытой группой ЕАД.
- Инвентарь QA-01 подтверждён по каждому пункту: состояния формы и `orgName`, фокус на «Назад», Escape и scroll lock панели, deep link, пять корзин без `.light.pulse`, карточка новости 16:9, порядок узлов футера. Дописывать не пришлось ничего — весь список уже был в `main`.
- Гейт пройден целиком без обходных правок: `npx tsc -b` → `npm test` → `npm run lint` → `npm run build` → `node scripts/check-dist.mjs`, каждый шаг код 0.
- Зонд фазы 8 перемерен на этой машине: медиана 70,7 fps против 50,9 в 08-02-SUMMARY — fallback MAP-06 снял риск, о котором предупреждал план 08-02 («на более слабом GPU медиана может уйти под 50»).
- Деплой доведён до конца: прогон 34024511478 на `3d31693` — success, живой `index.html` и три ассета совпали с локальным `dist` по sha256 с первой попытки, без ожидания кэша Pages.

## Task Commits

1. **Task 1: Проверка стыков, инвентарь QA-01, App.seams.test.tsx** — `6609c54` (test)
2. **Task 2: Гейт, зонд и снимок стыков на preview** — `9023b89` (test)
3. **Task 2: Уточнение MAP-06 и MAP-07** — `3d31693` (docs)
4. **Task 3: Сверка хэшей прода после деплоя** — `c725210` (docs)

## Files Created/Modified

- `src/App.seams.test.tsx` — пять тестов стыков на рендере `<App />` под `LightsProvider`: лента карты и прозрачная форма (8 + 9), стекло карточек ресурсов (7 + 11), варианты заголовков (7 + 9), превью 16:9 в панели «Видео» (10 + 11), скос карты и пять корзин (8)
- `.planning/phases/13-integration-qa/qa/seams.evaluate.js` — одна стрелочная функция для `browser_evaluate`: `band`, `bandBefore`, `shellClip`, `resourceCard`, `titles`, `buckets`, `pulse` (имена `CSSKeyframesRule`), `videoPanel`, `deepLink`
- `.planning/phases/13-integration-qa/qa/seams-run.mjs` — драйвер: резолв playwright из кэша npx, три захода за один запуск браузера, слияние ответов в один JSON
- `.planning/phases/13-integration-qa/qa/results/preview-*.json` — шесть снимков на preview 4173
- `.planning/phases/13-integration-qa/qa/results/prod-hashes.txt` — таблица сверки прода и `dist`, отсюда её берёт план 13-02 в `docs/qa/SMOKE.md`
- `.planning/REQUIREMENTS.md` — MAP-06 с пометкой применённого fallback, MAP-07 со статичным ореолом 9px и opacity .22

## Гейт

| Команда | Результат |
|---|---|
| `npx tsc -b` | код 0, вывод пуст |
| `npm test` (`vitest run`) | код 0, **50 файлов, 503 теста**, 0 failed, 0 skipped; в выводе нет `act(`, `console.error`, `Warning: An update` |
| `npm run lint` (`eslint .`) | код 0, без предупреждений |
| `npm run build` | код 0, без предупреждений о размере чанков: `index-BEFObVAO.js` 399,30 КБ, `vendor-map-BjCgd77U.js` 182,70 КБ, `index-2NnJ3z1D.css` 100,93 КБ, `index.html` 2,65 КБ |
| `node scripts/check-dist.mjs` | `OK: 11 проверок` |

Инварианты D «Гейт и деплой»: `@media (prefers-reduced-motion: reduce)` встречается ровно один раз и только в `global.css`; реестр `data-anim` закрыт (`motionPolicy.test.ts` в составе набора).

## Зонд фазы 8 на preview 4173

Headed Chrome, playwright 1.63.0-alpha-2026-08-31 из `~/.npm/_npx/9833c18b2d85bc59`. Во время замера fps параллельных `npm test`/`npm run build` не было, WebGL-вкладок в этом Chrome нет.

| Прогон | Итог | Числа |
|---|---|---|
| `band --width 1440 --height 900` | PASS | `jumps: []` на x = 200 и x = 1240; `skewStep` 2.49 / 19.6, `skewJump` 1.99 / 19.51, `maxJumpOutsideSkew` 0 / 0.93 при пороге 6; `scrollWidth` 1440 = `innerWidth`; первый кадр: 942 огонька |
| `band --width 390 --height 844` | PASS | `jumps: []` на x = 20 и x = 370; `skewStep` 11.16 / 19.44; `scrollWidth` 390 = `innerWidth` |
| `lights --width 1440` | PASS | `buckets` 5, `halos` 942, `cores` 942, `firstFrame` true, `pulseClass` 0, `gradients` 2, `radiusStatic` true, `animationDuration` 2.6s, `animationDelay3` −1.56s; прозрачность корзины за 650 мс 0.578916 → 0.530459 |
| `lights --width 1440 --reduced` | PASS | анимаций нет ни на одной корзине, ореол `0.22` и `9px`, за 650 мс не двинулся |
| `fps --width 1440 --runs 3` | PASS | 70,7 / 69,9 / 71,1, **медиана 70,7** при пороге 50, худший интервал 18,3 мс |

Медиана 70,7 против 50,9 из 08-02-SUMMARY: это ровно тот выигрыш, ради которого координатор фазы 8 применил fallback MAP-06 (там же замерено 71,0 на opacity-only). Открытый вопрос 08-02 «перемерить fps на машине приёмки» закрыт: запас 1,41× вместо 1,8 %.

## Снимок стыков на preview (`preview-seams-1440.json`)

| Ключ | Значение | Ожидание плана |
|---|---|---|
| `band.childIds` | `["map", "light-form"]` | совпало |
| `band.formBackgroundColor` / `formBeforeContent` | `rgba(0, 0, 0, 0)` / `none` | совпало |
| `bandBefore` | `rgb(18, 12, 52)`, `polygon(0px 46.08px, 100% 0px, 100% 100%, 0px 100%)` | совпало |
| `shellClip` | `polygon(0px 46.08px, 100% 0px, 100% calc(100% - 46.08px), 0px 100%)` | совпало |
| `resourceCard.backdropFilter` | `blur(14px) saturate(1.25)` | совпало |
| `resourceCard.backgroundImage` | содержит `rgba(255, 255, 255, 0.075)` и `34%` | совпало |
| `titles["about-title"].backgroundImage` | `linear-gradient(104deg, …)`, `webkitTextFillColor` прозрачный | совпало |
| `titles["form-title"|"map-title"|"involve-title"]` | `backgroundImage` `none`, `color` `rgb(239, 237, 245)` | совпало |
| `buckets` | 5, порядок 0…4, `light-breathe`, `2.6s` | совпало |
| `pulse` | `count` 0, `light-breathe` в keyframes, `light-pulse` отсутствует | совпало |
| `videoPanel` | `zIndex` 10000, `position` fixed, 16 `.ve`, отношение 1.7778, `cover`, `50% 50%` | совпало (диапазон 1.767…1.789) |
| `deepLink` | `materials`, `aria-expanded` true, 5 групп, `esdOpen` true | совпало |

## Деплой и прод

- Push `2f44a7b..3d31693` в `origin main`.
- Прогон [34024511478](https://github.com/thevladoss/esd-onevoice27/actions/runs/34024511478) на `3d31693` — **success** за ~2 минуты (lint → test → build → check:dist → upload → deploy).
- `curl -sI https://thevladoss.github.io/esd-onevoice27/` → `HTTP/2 200`; `diff` списков `/esd-onevoice27/assets/*` живого и локального `index.html` пуст, ассетов три.

| Путь | Код | sha256 (первые 12) | Равен `dist` |
|---|---|---|---|
| `/esd-onevoice27/` (`index.html`) | 200 | `5f244dfe0260` | да |
| `/esd-onevoice27/assets/index-BEFObVAO.js` | 200 | `7ec892292a81` | да |
| `/esd-onevoice27/assets/index-2NnJ3z1D.css` | 200 | `312241b95ca0` | да |
| `/esd-onevoice27/assets/vendor-map-BjCgd77U.js` | 200 | `ce8d2c48c97b` | да |

**4 из 4 равны с первой попытки**, повторные заходы с паузой не понадобились. Коммит `c725210` (таблица хэшей) не пушился: по плану его отправляет 13-02 вместе с приёмкой, сборку он не меняет.

## Decisions Made

- **Правила `.map-band .lf-section` в `map.css` оставлены.** После фазы 9 они no-op: `light-form.css` больше не объявляет ни фона, ни `::before`. Но `MapBand.test.tsx` закрепляет оба правила текстом, и удаление потребовало бы правки теста чужой фазы ради двух строк CSS, которые страхуют каскад, если форма когда-нибудь вернёт себе подложку. Дискреция CONTEXT использована в пользу «оставить».
- **Снимок стыков снят Node-драйвером, а не Playwright MCP.** Формат `seams.evaluate.js` от этого не пострадал: файл остался одним выражением-функцией и уедет в `browser_evaluate` плана 13-02 как есть.
- **Стык 8 в тесте требует измеренного контейнера карты.** Подмена `getBoundingClientRect` сужена до узлов с классом `esd-map`: canvas глобуса, мок IntersectionObserver и прокрутка секций её не видят.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Снимок стыков нечем было выполнить: Playwright MCP недоступен**

- **Found during:** Task 2 (снимок стыков на preview)
- **Issue:** План предписывает `browser_resize` и `browser_evaluate` через Playwright MCP. У этого исполнителя MCP-инструментов нет, а без снимка стыков нельзя ни подтвердить `backdrop-filter` карточек, ни отдать числа плану 13-02.
- **Fix:** Добавлен драйвер `.planning/phases/13-integration-qa/qa/seams-run.mjs` (вне `files_modified` плана): резолв playwright из кэша npx повторяет `map-probe.mjs` фазы 8, три захода за один запуск браузера, слияние в один JSON. Сам `seams.evaluate.js` написан ровно как требует план — одно выражение-функция, пригодное для `browser_evaluate`.
- **Files modified:** `.planning/phases/13-integration-qa/qa/seams-run.mjs`
- **Verification:** `preview-seams-1440.json` получен, все двенадцать ожидаемых значений совпали; `npm run lint` после добавления файла код 0
- **Committed in:** `9023b89`

**2. [Rule 3 - Blocking] jsdom не измеряет контейнер карты, и SVG огоньков не рендерился**

- **Found during:** Task 1 (первый прогон `App.seams.test.tsx`)
- **Issue:** `EsdMap` строит проекцию только при `width >= 1 && height >= 1`, размер читается из `getBoundingClientRect`. В jsdom он нулевой, `ResizeObserver` замокан пустышкой, поэтому на рендере всего приложения `.map-lights` не существует и стык 8 проверять не на чем (`.light-bucket` найдено 0 из 5).
- **Fix:** В тесте стыка 8 `HTMLDivElement.prototype.getBoundingClientRect` подменяется на время рендера и только для узлов с классом `esd-map` (возвращает `DOMRect` 1200×700), после рендера восстанавливается в `finally`.
- **Files modified:** `src/App.seams.test.tsx`
- **Verification:** тест видит пять корзин с `data-bucket` 0…4 и ноль `.light.pulse`; `npx vitest run src/App.seams.test.tsx src/App.test.tsx src/styles/motionPolicy.test.ts` — 32 теста passed, без `console.error`
- **Committed in:** `6609c54`

### Уточнения критериев приёмки (кода не касаются)

**3. Два grep-критерия Task 1 дают другое число при верном коде**

- `awk '/^@utility glass-resource \{/,/\}/' src/styles/global.css | grep -c "blur(14px) saturate(125%)"` даёт **2**, а не 1: в блоке две строки, `-webkit-backdrop-filter` и `backdrop-filter`. Стык 7 + 11 выполнен, критерий просто не учитывал вендорный префикс.
- `grep -c "resources-materials" src/components/resources/Resources.tsx` даёт **1**, а не ≥ 2: литерал живёт в константе `MATERIALS_HASH`, а оба потребителя (чтение `window.location.hash` и селектор делегированного клика `a[href="${MATERIALS_HASH}"]`) берут её через интерполяцию. Смысл критерия — «константа и селектор» — выполнен, `grep -c "resources-materials\|MATERIALS_HASH"` даёт 3.

Ни одна из двух строк не потребовала правки исходников: снимок в браузере подтверждает и `blur(14px) saturate(1.25)` на карточке, и открытие панели материалов по deep link.

**4. Task 1 закоммичен отдельно от Task 2**

План складывал `App.seams.test.tsx` и артефакты зонда в один коммит `test(13-01)`. Задачи коммитятся атомарно, поэтому коммитов два: `6609c54` (тест стыков) и `9023b89` (снимок и зонд). Критерий «`git log --oneline -3` содержит `test(13-01)` и `docs(13-01)`» выполняется.

---

**Total deviations:** 2 auto-fixed (оба Rule 3, блокирующие) + 2 уточнения критериев без правок кода
**Impact on plan:** Ни одного дефекта стыка не найдено: исходники фаз 7–12 не правились вовсе. Оба отклонения касаются инструментов приёмки (драйвер вместо MCP, измерение контейнера в jsdom), объём плана не расширен.

## Assumption Drift (advisory)

**1. Ступенька скоса на x = 200 ниже порога, который план назвал для 1440**

- **Found during:** Task 2 (`band --width 1440`)
- **Planned:** план 13-01 ждал `skewJump > 6` на 1440 как признак видимого скоса.
- **Actual:** на x = 200 `skewJump` 1.99 (`skewStep` 2.49), на x = 1240 — 19.51 (`skewStep` 19.6). Зонд ставит PASS по `skewVisible`, который считает `skewStep` хотя бы на одной абсциссе.
- **Why:** после тёмного полотна `rgb(5 4 15)` (фаза 8, коммит `6bf208c`) страна под кромкой на x = 200 стала чуть темнее подложки ленты, контраст прошёл через ноль и поменял знак — это ровно тот эффект, который 08-02-SUMMARY записал в свой Assumption Drift. Критерий MAP-03 («второй линии нет нигде») не задет: `jumps` пусты на всех четырёх выборках. Для плана 13-02 контрольной точкой «скос виден» надо брать x = 1240, а не x = 200.

**2. fps вырос втрое сильнее, чем закладывал план**

- **Found during:** Task 2 (`fps --runs 3`)
- **Planned:** порог 50, ориентир «около 70» из замера fallback в 08-02.
- **Actual:** 70,7 / 69,9 / 71,1, медиана 70,7 — совпало с прогнозом почти точно, но это в 1,41 раза выше порога вместо 1,8 %, на которых фаза 8 балансировала до fallback.
- **Why:** дыхание радиуса ореола выключено (`--halo-k` статичен 1.5), и Chrome больше не пересчитывает геометрию 942 кругов каждый кадр. Приёмке 13-02 замер повторять не обязательно: запас теперь не пограничный.

## Issues Encountered

- Первая версия подмены `getBoundingClientRect` собирала результат из `rect.toJSON()`, которого у jsdom-объекта нет; заменено на `new DOMRect(0, 0, 1200, 700)`.
- Функция сверки хэшей объявляла локальную переменную `path`: в zsh это специальный массив, привязанный к `PATH`, и внутри функции пропадали `curl`, `shasum` и `cut`. Переименована в `url_path`.
- Артефактов Playwright в корне репозитория не появилось: драйвер печатает JSON в stdout, файл пишет перенаправление в `qa/results/`.

## User Setup Required

None — внешних сервисов и ключей не нужно, `gh` уже авторизован.

## Next Phase Readiness

- План 13-02 может начинать: сборка прошла гейт, задеплоена и подтверждена побайтно; `seams.evaluate.js` готов к запуску через `browser_evaluate` на проде, `prod-hashes.txt` переносится в `docs/qa/SMOKE.md` как есть.
- Коммит `c725210` лежит локально и уедет вместе с приёмкой 13-02.
- `STATE.md` и `ROADMAP.md` не трогались — их обновляет оркестратор.

## Self-Check: PASSED

- Все десять файлов из `key-files.created` найдены на диске
- Коммиты `6609c54`, `9023b89`, `3d31693`, `c725210` присутствуют в `git log`
- Verify-команды Task 2 и Task 3 перепрогнаны после коммитов: `seams+probe OK {"band":[[],[]],"fps":70.7}` и `verify Task 3: OK`
- `git status --porcelain` показывает только `.planning/HANDOFF.json` оркестратора

---
*Phase: 13-integration-qa*
*Completed: 2026-09-06*
