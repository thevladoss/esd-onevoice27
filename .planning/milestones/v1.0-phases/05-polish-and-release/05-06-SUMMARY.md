---
phase: 05-polish-and-release
plan: 06
subsystem: infra
tags: [vite, rolldown, code-splitting, node-script, qa, github-pages]

requires:
  - phase: 01-foundation
    provides: base /esd-onevoice27/, метаданные index.html, workflow деплоя на Pages
  - phase: 02-map-and-hero
    provides: карта на d3-geo, topojson-client и world-atlas — содержимое чанка vendor-map
  - phase: 05-polish-and-release
    provides: reveal-обёртки и reduced-motion контракт, по которым построен чеклист smoke
provides:
  - Чанк vendor-map: сборка без предупреждения Vite о размере, главный чанк 393 КБ вместо 576 КБ
  - Продакшн-код без единого console.*
  - scripts/check-dist.mjs и скрипт check:dist: 11 проверок собранного dist без зависимостей
  - Раздел «Проверка» в README
  - docs/qa/SMOKE.md как приёмочный чеклист под заполнение планом 05-07
affects: [05-07, деплой, будущие фазы с новыми внешними хостами или тяжёлыми зависимостями]

tech-stack:
  added: []
  patterns:
    - "Ручное разбиение чанков через build.rolldownOptions.output.codeSplitting.groups (Vite 8 / Rolldown), без manualChunks и без поднятия порога предупреждения"
    - "Проверка артефакта сборки отдельным Node-скриптом на встроенных модулях, без зависимостей и сети"

key-files:
  created:
    - scripts/check-dist.mjs
    - docs/qa/SMOKE.md
  modified:
    - vite.config.ts
    - package.json
    - README.md
    - src/components/layout/ErrorBoundary.tsx
    - src/state/lights.tsx
    - src/state/lights.reducer.test.tsx

key-decisions:
  - "Группа чанков одна: d3-*, topojson-client и world-atlas в vendor-map. Запасные группы vendor-motion и vendor-react из плана не понадобились"
  - "componentDidCatch в ErrorBoundary удалён целиком, а не оставлен пустым: аварийный экран рисует getDerivedStateFromError"
  - "check-dist.mjs ищет id секций в бандле в кавычках любого вида: минификатор Rolldown перекладывает строковые литералы в обратные кавычки"
  - "Прежний раздел README «Проверка деплоя» стал подпунктом «Деплой и живой сайт» внутри нового раздела «Проверка»"

patterns-established:
  - "Порог предупреждения о размере чанка не поднимается: превышение чинится разбиением, а не chunkSizeWarningLimit"
  - "Белый список внешних хостов проверяется автоматически по dist/index.html"

requirements-completed: [MOTION-04, QA-04]

duration: 13min
completed: 2026-09-05
---

# Phase 5 Plan 06: Бандл, чистая консоль и инструменты приёмки Summary

**Карта уехала в чанк vendor-map (главный чанк 393 КБ вместо 576 КБ), продакшн-код остался без console.*, а состав dist проверяется одной командой check:dist по 11 пунктам.**

## Performance

- **Duration:** ~13 мин
- **Started:** 2026-09-05T18:24:00Z
- **Completed:** 2026-09-05T18:37:13Z
- **Tasks:** 3
- **Files modified:** 8

## Accomplishments

- `build.rolldownOptions.output.codeSplitting.groups` вынес d3, topojson-client и world-atlas в `vendor-map` (183 КБ), главный чанк упал до 393 КБ. Сборка проходит без строк `larger than`, `deprecated` и `(!)`, порог предупреждения остался стандартным.
- `console.warn` из `tryCreateLight` и `console.error` из `ErrorBoundary` убраны: поведение прежнее (страна вне дивизиона не зажигает огонёк, аварийный экран рисуется), в консоли посетителя от нашего кода не появляется ничего.
- `scripts/check-dist.mjs` (233 строки, только `node:fs`, `node:path`, `node:process`) проверяет `lang`, заголовок, og-теги, префикс `/esd-onevoice27/assets/` и наличие файлов, отсутствие ссылок от корня, чанк `vendor-map`, потолок 500 КБ на JS-чанк, id восьми секций в бандле, `<noscript>` и белый список хостов.
- README получил раздел «Проверка» с командами и ожиданиями, `docs/qa/SMOKE.md` собрал 10 браузерных проверок, таблицу контраста, четыре скриншота и блок прода с пустыми колонками результатов.

## Task Commits

1. **Task 1: чанк vendor-map** — `4acb7e3` (chore)
2. **Task 1: зачистка console.*** — `9ad1b94` (refactor)
3. **Task 2: scripts/check-dist.mjs и скрипт check:dist** — `a001b1c` (feat)
4. **Task 3: README «Проверка» и docs/qa/SMOKE.md** — `9100895` (docs)

Задача 1 разбита на два коммита: конфигурация сборки и зачистка консоли независимы и проверяются разными командами.

## Files Created/Modified

- `vite.config.ts` — блок `build.rolldownOptions.output.codeSplitting.groups` с группой `vendor-map` по маске `/node_modules[\\/](d3-[a-z-]+|topojson-client|world-atlas)[\\/]/`
- `scripts/check-dist.mjs` — 11 проверок собранного `dist`, вывод `OK`/`FAIL` по строке на проверку, код выхода 1 при любой неудаче
- `package.json` — скрипт `check:dist`
- `README.md` — раздел «Проверка»: тесты, сборка, `check:dist`, preview на 4173, браузерный smoke, деплой
- `docs/qa/SMOKE.md` — приёмочный чеклист с колонками «Preview» и «Прод»
- `src/components/layout/ErrorBoundary.tsx` — `componentDidCatch` удалён вместе с импортом `ErrorInfo`
- `src/state/lights.tsx` — ветка «страна вне дивизиона» возвращает `null` молча
- `src/state/lights.reducer.test.tsx` — тест проверяет неизменность состояния вместо вызова `console.warn`

## Decisions Made

- Vite 8.2.2 принял `build.rolldownOptions.output.codeSplitting.groups`, тип подтверждён по `node_modules/rolldown/dist/shared/define-config-*.d.mts`. Запасной путь через `manualChunks` не понадобился: `manualChunks` и `advancedChunks` в Rolldown 1.2.7 помечены deprecated и игнорируются, если задан `codeSplitting`.
- Одной группы хватило: `vendor-map` 182.7 КБ (gzip 66.8), `index` 393.3 КБ (gzip 124.6). Обе цифры ниже порога 500 КБ, поэтому группы `vendor-motion` и `vendor-react` из плана не заводились.
- `ErrorBoundary` потерял `componentDidCatch` целиком: без вывода в консоль метод стал пустым, а фоллбэк-экран держится на `getDerivedStateFromError`. React 19 сам логирует пойманное исключение через `onCaughtError`, поэтому существующий тест на аварийный экран остался зелёным без правок.
- Файл `scripts/smoke.md` из CONTEXT не создавался: единый документ живёт в `docs/qa/SMOKE.md`, как требует UI-SPEC.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Тест редьюсера проверял вызов console.warn, который требовалось удалить**
- **Found during:** Задача 1 (зачистка `console.*`)
- **Issue:** `src/state/lights.reducer.test.tsx` спаил `console.warn` и требовал `toHaveBeenCalledWith(stringContaining("840"))`. После удаления вызова из `tryCreateLight` тест падал, а критерий задачи требует зелёный `npm test`.
- **Fix:** Тест переписан на наблюдаемое поведение: состояние возвращается тем же объектом и огоньков не прибавилось.
- **Files modified:** `src/state/lights.reducer.test.tsx`
- **Verification:** `npm test` — 42 файла, 317 тестов, всё зелёное
- **Committed in:** `9ad1b94`
- **Конфликта с планом 05-05 нет:** этот файл не входит в его `files_modified` (там `App.test.tsx`, `Header.test.tsx`, `CountryChips.test.tsx`, `LightForm.test.tsx`, `Resources.test.tsx`, `src/test/setup.ts`).

**2. [Rule 1 - Bug] Проверка id секций по двойным кавычкам не находила ничего в реальном бандле**
- **Found during:** Задача 2 (`check-dist.mjs`)
- **Issue:** Поведение в плане описано как поиск строк `"hero"`, `"map"` и так далее в двойных кавычках. Минификатор Rolldown перекладывает строковые литералы в обратные кавычки: `grep -o '"hero"' dist/assets/*.js` даёт 0 совпадений на всех восьми id, проверка была бы ложноотрицательной.
- **Fix:** Скрипт ищет `id` в кавычках любого вида: двойных, одинарных и обратных.
- **Files modified:** `scripts/check-dist.mjs`
- **Verification:** `node scripts/check-dist.mjs` — `OK id секций в бандле, всего 8`; на копии dist с подменённым `lang`, ссылками от корня и лишним хостом скрипт вернул 4 `FAIL` и код 1
- **Committed in:** `a001b1c`

**3. [Rule 3 - Blocking] В README уже был раздел «Проверка деплоя»**
- **Found during:** Задача 3 (README)
- **Issue:** Критерий задачи требует `grep -c "^## Проверка" README.md` ровно 1. Существующий заголовок «Проверка деплоя» тоже совпадает с этим шаблоном, добавление второго раздела дало бы 2.
- **Fix:** Прежний раздел стал подпунктом `### Деплой и живой сайт` внутри нового `## Проверка`, содержимое сохранено дословно.
- **Files modified:** `README.md`
- **Verification:** `grep -c "^## Проверка" README.md` выводит 1, команды и список «Что смотреть» на месте
- **Committed in:** `9100895`

---

**Total deviations:** 3 auto-fixed (2 blocking, 1 bug)
**Impact on plan:** Все три правки нужны, чтобы критерии плана выполнялись на реальном коде и реальном бандле. Границы плана не расширялись, новых пакетов не ставилось, `git diff -- package.json` меняет только блок `scripts`.

## Assumption Drift (advisory)

**1. Строковые литералы в бандле**
- **Found during:** Задача 2
- **Planned:** План предполагал, что id секций лежат в бандле в двойных кавычках.
- **Actual:** Минификатор Rolldown 1.2.7 использует обратные кавычки для всех строк.
- **Why:** Oxc-минификатор в Vite 8 нормализует кавычки. Проверка теперь не зависит от стиля кавычек и переживёт смену минификатора.

**2. Сколько групп чанков понадобится**
- **Found during:** Задача 1
- **Planned:** План допускал до трёх групп (`vendor-map`, при необходимости `vendor-motion` и `vendor-react`), RESEARCH предлагал запасной путь через `React.lazy` для карты.
- **Actual:** Одной группы хватило с запасом: главный чанк 393 КБ против порога 500 КБ.
- **Why:** world-atlas и d3 весили больше, чем оценивал RESEARCH; их выноса достаточно, ленивая загрузка карты не понадобилась.

## Issues Encountered

- ESLint в проекте настроен только на `**/*.{ts,tsx}`, поэтому `scripts/check-dist.mjs` он не проверяет. Скрипт проверен прогоном: зелёный путь на реальном `dist` (11 `OK`, код 0), красный путь на несуществующей папке (код 1) и на копии `dist` с внесёнными поломками (4 `FAIL`, код 1). Расширение зоны линта — за рамками плана, `eslint.config.js` не входит в `files_modified`.

## Известные заглушки

Пустые ячейки «Preview», «Прод» и «Вердикт» в `docs/qa/SMOKE.md` — не заглушки, а форма под заполнение: браузерный прогон и запись результатов выполняет план 05-07.

## User Setup Required

None — внешних сервисов и переменных окружения план не добавляет.

## Verification

Прогнано в ветке agent-05-06 на коммите `9100895`:

- `npm run build` — код 0, `larger than` 0, `deprecated` 0, `(!)` 0; `dist/assets`: `index-HFIOJlwW.css` 72.2 КБ, `vendor-map-BjCgd77U.js` 182.7 КБ, `index-BkuRj91m.js` 393.3 КБ
- `node scripts/check-dist.mjs` — 11 строк `OK `, итог `OK: 11 проверок`, код 0
- `node scripts/check-dist.mjs --dist /nonexistent-dist-05-06` — `FAIL index.html: файл не найден`, код 1
- `npm test` — 42 файла, 317 тестов, все зелёные
- `npm run lint` — код 0; `npx tsc -b` — код 0
- `grep` по `console.(log|warn|error|info|debug|table|trace|dir)` в `src` вне тестов — 0 совпадений

## Next Phase Readiness

- План 05-07 забирает `docs/qa/SMOKE.md` и прогоняет браузерный smoke по preview и проду, затем вписывает результаты и вердикт.
- `npm run check:dist` встаёт в конвейер приёмки перед пушем; при желании его можно добавить шагом в `deploy.yml` (за рамками этого плана).
- STATE.md и ROADMAP.md этот план не трогал: их обновляет оркестратор.

---
*Phase: 05-polish-and-release*
*Completed: 2026-09-05*

## Self-Check: PASSED

Все файлы на месте (`scripts/check-dist.mjs`, `docs/qa/SMOKE.md`, `vite.config.ts`, `README.md`, `package.json`), все четыре коммита есть в `git log`: `4acb7e3`, `9ad1b94`, `a001b1c`, `9100895`.
