---
phase: 02-hero-and-map
plan: 02
subsystem: ui
tags: [d3-geo, d3-zoom, topojson-client, world-atlas, react-context, vitest, prng, geojson]

requires:
  - phase: 01-scaffold-and-deploy
    provides: "Скаффолд Vite 8 + React 19 + TypeScript + Vitest, jsdom-моки в src/test/setup.ts, tsconfig.app.json с include src"
provides:
  - "Данные 12 стран ЕАД: ESD_COUNTRIES (порядок чипов по убыванию веса), ESD_IDS, countryById"
  - "Геометрия карты: worldFeatures (177 стран), esdFeatures, esdCollection, featureById, isEsd, makeProjection, randomPointIn"
  - "Проекция geoMercator().rotate([-90, 0]).fitExtent(...) без разрыва России на антимеридиане"
  - "Детерминированный генератор огоньков generateLights(seed, people, groups) и allocateByWeight"
  - "mulberry32 как единственный источник случайности моков"
  - "formatCount с узким неразрывным пробелом U+202F без системных форматтеров"
  - "easeOutCubic и easeOutQuint для count-up счётчиков и полёта карты к стране"
  - "usePrefersReducedMotion и синхронный prefersReducedMotion на useSyncExternalStore"
  - "LightsProvider, useLights, lightsReducer, createLight, countLights с контрактом addLight({ type, countryId })"
  - "Типизация импорта world-atlas/countries-110m.json через ambient declare module"
affects: [02-03, 02-04, 02-05, 03-form-about-involve, 05-motion-and-polish]

tech-stack:
  added:
    - "@types/topojson-specification 1.0.5 (остальные пакеты карты пришли из фазы 1)"
  patterns:
    - "d3 считает геометрию, React рендерит: geo.ts не знает про DOM, компоненты не считают проекцию"
    - "world-atlas разбирается один раз на импорте модуля geo.ts, Map<number, feature> строится по Number(f.id)"
    - "Случайность моков только через mulberry32 с фиксированным seed: одинаковая картинка у всех посетителей"
    - "Координата огонька вычисляется внутри редьюсера, снаружи приходят только тип и код страны"
    - "TDD по задачам: сначала коммит test(...) с красными тестами, затем feat(...) с реализацией"
    - "Символ U+202F пишется escape-последовательностью, литерального символа в исходниках нет"

key-files:
  created:
    - src/data/countries.ts
    - src/data/lights.ts
    - src/lib/geo.ts
    - src/lib/rng.ts
    - src/lib/format.ts
    - src/lib/easing.ts
    - src/lib/useReducedMotion.ts
    - src/state/lights.tsx
    - src/types/world-atlas.d.ts
    - src/lib/rng.test.ts
    - src/lib/geo.test.ts
    - src/lib/format.test.ts
    - src/lib/easing.test.ts
    - src/lib/useReducedMotion.test.tsx
    - src/data/lights.test.ts
    - src/state/lights.reducer.test.tsx
  modified:
    - package.json
    - package-lock.json

key-decisions:
  - "resolveJsonModule в tsconfig.app.json не включался: ambient declare module в src/types/world-atlas.d.ts закрывает импорт JSON, tsc -b и vite build зелёные без правки конфига"
  - "featureById строится по всем 177 странам атласа, а не только по 12 ЕАД: планам 02-03 и 02-04 нужны и соседние страны для фона карты"
  - "generateLights бросает ошибку, если страна ЕАД пропала из атласа: молчаливый пропуск сломал бы инварианты 694 и 248"
  - "createLight отвергает страну вне дивизиона (Unknown ESD country), координата берётся из ESD_COUNTRIES, а не из ввода формы"
  - "Свой usePrefersReducedMotion вместо useReducedMotion из motion/react: motion кэширует matchMedia в модульном синглтоне и в jsdom значение не переключается"
  - "d3-transition не ставится: полёт карты к стране делает собственный rAF-интерполятор на easeOutQuint"

patterns-established:
  - "Тесты лежат рядом с исходником, названия на русском, красный прогон коммитится отдельно"
  - "Веса стран нормируются методом наибольших остатков: сумма долей точно равна общему числу огоньков"

requirements-completed: [QA-01]

duration: 12min
completed: 2026-09-05
---

# Phase 2 Plan 02: Движок карты Summary

**Геометрия ЕАД на d3-geo и world-atlas: проекция с поворотом на 90° против разрыва Чукотки, детерминированный генератор 694 человек и 248 групп внутри границ стран, контекст огоньков с addLight и 36 зелёных тестов Vitest.**

## Performance

- **Duration:** 12 min
- **Started:** 2026-09-05T18:26:00Z
- **Completed:** 2026-09-05T18:38:00Z
- **Tasks:** 3
- **Files modified:** 18 (16 создано, 2 изменено)

## Accomplishments

- Проекция `geoMercator().rotate([-90, 0]).fitExtent(...)` укладывает центры всех 12 стран внутрь вьюбокса 1200×700, а точки 179.5°E и 179°W расходятся меньше чем на 40px: разрыв ушёл в Атлантику, Россия целая.
- `generateLights()` даёт ровно 694 огонька `person` и 248 `group`; повторный вызов с seed 27 даёт `toEqual`-равный массив, seed 28 отличается, каждая из 942 точек проходит `geoContains` для своей страны.
- `LightsProvider` отдаёт форме фазы 3 готовый контракт `addLight({ type, countryId })`: координата считается от центра страны по золотому углу, наружу геометрия не протекает.
- `formatCount` группирует тысячи узким неразрывным пробелом (`4 268`) без системных форматтеров, поэтому результат одинаков во всех браузерах.
- 36 тестов в 9 файлах, `npm run build` и `npx tsc -p tsconfig.app.json --noEmit` зелёные.

## Task Commits

1. **Task 1: зависимости, тип JSON-импорта, страны ЕАД и PRNG** — `d8ebc73` (test, RED), `f663001` (chore, зависимости и типы), `096734e` (feat, GREEN)
2. **Task 2: геометрия и генератор огоньков** — `c4c2b18` (test, RED), `eb62d24` (feat, GREEN)
3. **Task 3: formatCount, easing, reduced motion, LightsProvider** — `60b9cf6` (test, RED), `cc384ef` (feat, GREEN)

## Files Created/Modified

- `src/data/countries.ts` — 12 стран ЕАД по убыванию веса: id, код, русское название, вес, опорная точка; `ESD_IDS` и `countryById`
- `src/data/lights.ts` — `allocateByWeight` методом наибольших остатков и `generateLights` с фиксированным порядком обхода стран
- `src/lib/geo.ts` — разбор world-atlas в GeoJSON, `esdFeatures`/`esdCollection`, `makeProjection`, `randomPointIn` с rejection sampling
- `src/lib/rng.ts` — `mulberry32`
- `src/lib/format.ts` — `formatCount`
- `src/lib/easing.ts` — `easeOutCubic`, `easeOutQuint` с клампингом входа
- `src/lib/useReducedMotion.ts` — `REDUCED_MOTION_QUERY`, `prefersReducedMotion`, `usePrefersReducedMotion`
- `src/state/lights.tsx` — `countLights`, `createLight`, `lightsReducer`, `LightsProvider`, `useLights`
- `src/types/world-atlas.d.ts` — `declare module "world-atlas/countries-110m.json"`
- 7 тестовых файлов рядом с исходниками
- `package.json`, `package-lock.json` — добавлен `@types/topojson-specification`

## Requirements

- **QA-01** закрыт полностью: детерминизм генератора, форматирование чисел и редьюсер огоньков покрыты зелёными тестами.
- **MAP-02, MAP-03, MAP-04** закрыты на уровне фундамента (проекция, генератор, `formatCount`); визуальная часть требований остаётся за планами 02-03 и 02-04, поэтому в `requirements-completed` они не вынесены.

## Decisions Made

Все решения перечислены в `key-decisions` фронтматтера. Главные:

- Гейт легитимности пакетов пройден до установки: `d3-geo`, `d3-zoom`, `d3-selection`, `topojson-client`, `world-atlas` числятся за `mbostock`, все шесть `@types/*` за `types`. `d3-transition` в проект не попал.
- `featureById` покрывает весь атлас, а не только ЕАД: соседние страны нужны как фон карты в плане 02-04.
- Отказ от `useReducedMotion` из `motion/react` в пользу своего хука на `useSyncExternalStore`: контракт тот же (boolean), но значение проверяется в jsdom.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] ESLint падал на `react-refresh/only-export-components` в `src/state/lights.tsx`**

- **Found during:** Task 3 (LightsProvider)
- **Issue:** Контракт плана требует экспортировать из одного модуля и компонент `LightsProvider`, и хук `useLights`, и чистые функции. Правило `react-refresh/only-export-components` считает это ошибкой, `npm run lint` выходил с кодом 1 (4 ошибки).
- **Fix:** Файловая директива `/* eslint-disable react-refresh/only-export-components -- ... */` с объяснением: у модуля контекста fast refresh делает полную перезагрузку вместо горячей замены. Дробить модуль нельзя, контракт `<interfaces>` фиксирует состав экспортов.
- **Files modified:** `src/state/lights.tsx`
- **Verification:** `npm run lint` завершился с кодом 0; `npm test` (36 тестов) и `npm run build` зелёные.
- **Committed in:** `cc384ef` (коммит Task 3)

**2. [Rule 3 - Blocking] Комментарий в `format.ts` ломал критерий приёмки**

- **Found during:** Task 3 (formatCount)
- **Issue:** Критерий требует `grep -c "Intl.NumberFormat" src/lib/format.ts` равным 0, а объяснение «почему не Intl» упоминало API в комментарии и давало 1.
- **Fix:** Комментарий переписан без имени API, смысл сохранён: «у системных форматтеров чисел результат зависит от версии ICU».
- **Files modified:** `src/lib/format.ts`
- **Verification:** `grep -c "Intl.NumberFormat" src/lib/format.ts` даёт 0, тесты `format.test.ts` (3) зелёные.
- **Committed in:** `cc384ef` (влито в коммит Task 3 через amend до появления следующих коммитов)

### Дополнительные тесты сверх списка `<behavior>`

Плановый список поведения дополнен тремя проверками, без изменения контракта: сумма весов стран равна единице (`geo.test.ts`), клампинг входа у easing-функций (`easing.test.ts`), отказ `lightsReducer` зажигать свет в стране вне дивизиона (`lights.reducer.test.tsx`, закрывает T-02-04 из threat register).

## Assumption Drift (advisory)

**1. Установка зависимостей карты**

- **Found during:** Task 1
- **Planned:** план ставит пять рантайм-пакетов и шесть пакетов типов, «повторная установка идемпотентна»
- **Actual:** фаза 1 уже внесла `d3-geo`, `d3-zoom`, `d3-selection`, `topojson-client`, `world-atlas` и пять из шести `@types/*` в `package.json`; реально добавился только `@types/topojson-specification`
- **Why:** 01-RESEARCH заранее заложил стек карты в скаффолд

**2. Флаг `resolveJsonModule`**

- **Found during:** Task 2
- **Planned:** план и заметки окружения допускали правку `tsconfig.app.json` ради `resolveJsonModule`
- **Actual:** правка не понадобилась, `tsconfig.app.json` не тронут; ambient `declare module` в `src/types/world-atlas.d.ts` перекрывает разрешение модуля, `tsc -b` и `vite build` зелёные
- **Why:** для неотносительного импорта TypeScript берёт ambient-декларацию раньше, чем пытается разрешить файл JSON

## Threat Model Compliance

| Threat ID | Как закрыт |
|-----------|------------|
| T-02-SC | `npm view <pkg> 'maintainers[0].name'` прогнан по всем 11 пакетам до установки: mbostock / types; lockfile закоммичен; `d3-transition` отсутствует в `package.json` |
| T-02-04 | `createLight` бросает `Unknown ESD country: <id>` на чужой код страны, координата берётся из `ESD_COUNTRIES`; покрыто тестом |
| T-02-05 | `randomPointIn` ограничен `maxTries = 50` с fallback на `geoCentroid` |
| T-02-06 | accept: данные огоньков синтетические |

Новых поверхностей за пределами `<threat_model>` план не добавил: сети в рантайме нет, ввод снаружи не доходит до геометрии.

## Issues Encountered

- Символ U+202F дважды попадал в исходник литералом вместо escape-последовательности при записи файлов через heredoc. Обошёл заменой по сентинелу и `perl -pi`, после чего проверил `grep -rlP '\x{202F}' src/` — литеральных символов в дереве нет.

## Verification

Прогнано в рабочем дереве, вывод наблюдался:

- `npm test` — 9 файлов, 36 тестов, код 0
- `npm run build` — `tsc -b && vite build`, код 0, бандл 194.38 kB (gzip 61.62 kB)
- `npx tsc -p tsconfig.app.json --noEmit` — код 0
- `npm run lint` — код 0
- `npm ls d3-geo d3-zoom d3-selection topojson-client world-atlas` — без ошибок

Не проверялось: визуальный рендер карты и огоньков (компонентов в этом плане нет, они появятся в 02-03 и 02-04), поэтому `world-atlas` пока не попадает в бандл — импортёров у `geo.ts` в продакшен-графе ещё нет.

## User Setup Required

None — внешних сервисов и переменных окружения план не добавляет.

## Next Phase Readiness

- Планы 02-03, 02-04, 02-05 получают ровно те имена, что зафиксированы в `<interfaces>`: `makeProjection`, `esdFeatures`, `esdCollection`, `featureById`, `generateLights`, `formatCount`, `easeOutCubic`, `easeOutQuint`, `usePrefersReducedMotion`, `useLights`.
- Фаза 3 вызывает `useLights().addLight({ type, countryId })` без изменений контракта.
- `LightsProvider` пока никуда не подключён: обернуть `App` в `main.tsx` должен план, который собирает секцию карты.
- Блокеров нет.

---
*Phase: 02-hero-and-map*
*Completed: 2026-09-05*

## Self-Check: PASSED

Все 16 созданных исходников и 7 коммитов ветки `agent-02-02` проверены на месте; `STATE.md` и `ROADMAP.md` не тронуты.
