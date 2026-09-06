---
phase: 17-integration-qa
plan: 01
subsystem: testing
tags: [integration, vitest, gate, deploy, github-pages, sha256, seams]

# Dependency graph
requires:
  - phase: 14-hero-video-particles
    provides: видео-глобус с data-anim="globe" и canvas частиц data-anim="stars" в hero, check-dist с проверкой видео
  - phase: 15-lights-canvas
    provides: canvas.map-lights-canvas с data-anim="pulse" и атрибутами счётчиков, SVG без огоньков, new-light вне обязательных значений
  - phase: 16-mobile
    provides: цели касания 44px у label согласия и ссылок футера
provides:
  - Заглушки HTMLMediaElement.play/pause в src/test/setup.ts — прогон без шума jsdom
  - Блок «стыки фаз v1.2» в App.seams.test.tsx на четыре теста поверх пяти тестов v1.1
  - Скрипт qa/prod-hashes.mjs — побайтная сверка живого сайта с dist по sha256
  - Таблицы qa/results/preview-hashes.txt и qa/results/prod-hashes.txt
  - Подтверждённый деплой сборки v1.2 на GitHub Pages (прогон 34046791832)
affects: [17-02 приёмка Playwright, docs/qa/SMOKE.md]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Глобальные заглушки прототипов DOM в setup.ts ставятся обычными функциями: vi.spyOn отдельных тестов кладётся поверх и снимается restoreAllMocks"
    - "Приём прода = sha256 живых файлов против dist одним скриптом, проверенным сначала на preview"

key-files:
  created:
    - .planning/phases/17-integration-qa/qa/prod-hashes.mjs
    - .planning/phases/17-integration-qa/qa/results/preview-hashes.txt
    - .planning/phases/17-integration-qa/qa/results/prod-hashes.txt
  modified:
    - src/test/setup.ts
    - src/components/hero/HeroParticles.test.tsx
    - src/App.seams.test.tsx

key-decisions:
  - "Заглушки play/pause — обычные функции, а не vi.fn: между тестами не копится состояние мока, подсчёт вызовов в Hero.test.tsx не меняется"
  - "Список файлов для сверки берётся из dist/index.html плюс два файла видео: hero-globe.webm и .mp4 подключает бандл, в разметке ссылок на них нет"
  - "Коммит HEAD скрипт читает из .git/HEAD без child_process — только импорты node:*"

patterns-established:
  - "Стыки нового milestone добавляются отдельным describe, блок предыдущего milestone не трогается: диff остаётся чистым добавлением"
  - "Хелпер renderMeasuredApp подменяет getBoundingClientRect только у div.esd-map и возвращает прототип в finally"

requirements-completed: [SHIP-01, SHIP-02]

# Metrics
duration: 12min
completed: 2026-09-06
---

# Phase 17 Plan 01: Интеграция, гейт и деплой v1.2 Summary

**Три ветки v1.2 живут в main без дефектов стыка: гейт из пяти команд зелёный (564 теста), четыре новых теста закрепляют hero, карту, форму и футер вместе, прод отдаёт ровно ту же сборку — 7 из 7 файлов побайтно равны dist.**

## Performance

- **Duration:** 12 мин
- **Started:** 2026-09-06T16:43Z
- **Completed:** 2026-09-06T16:55Z
- **Tasks:** 4 из 4 (Task 3 — чекпоинт оркестратора)
- **Files modified:** 3 изменено, 3 создано

## Accomplishments

- Слияние фаз 14–16 проверено командами: посторонних файлов worktree нет, реестр `data-anim` закрыт, блок reduce единственный.
- Оба хвоста плана 14-02 закрыты: шум jsdom «Not implemented» упал с 19 строк до нуля, комментарий про удалённый `GlobeCanvas.test.tsx` заменён.
- Полный гейт зелёный на слитом коде: 52 файла / 564 теста, `OK: 12 проверок` в `check-dist`.
- Скрипт сверки хэшей проверен дважды: на preview все 7 файлов равны, на старом проде нашёл 5 расхождений.
- Прогон Deploy to GitHub Pages 34046791832 на HEAD `827785c` — success за 1 мин 22 с, живой сайт совпал с `dist/` с первого прохода.

## Task Commits

Коммит и push делал оркестратор на чекпоинте Task 3.

1. **Task 1 и Task 2** — `827785c` (`test(17-01): стыки v1.2, заглушки медиа в setup, скрипт сверки хэшей прода`)
2. **Task 4** — `qa/results/prod-hashes.txt` ждёт коммита оркестратора вместе с документами плана 17-02

## Files Created/Modified

- `src/test/setup.ts` — заглушки `HTMLMediaElement.prototype.play` и `pause` после подмены `getContext`
- `src/components/hero/HeroParticles.test.tsx` — комментарий о локальных моках вместо ссылки на удалённый файл
- `src/App.seams.test.tsx` — чтения `hero.css` и `Footer.css`, хелпер `renderMeasuredApp`, блок «стыки фаз v1.2» (136 строк добавлено, ни одной удалено)
- `.planning/phases/17-integration-qa/qa/prod-hashes.mjs` — сверка sha256 живого сайта с `dist` (254 строки)
- `.planning/phases/17-integration-qa/qa/results/preview-hashes.txt` — таблица сверки с preview
- `.planning/phases/17-integration-qa/qa/results/prod-hashes.txt` — таблица сверки с продом, переносится в SMOKE планом 17-02

## Проверка слияния

Дефектов слияния нет.

| Проверка | Ожидание | Факт |
|---|---|---|
| `git branch --show-current` | main | main |
| `git worktree list \| wc -l` | 1 | 1 |
| `git status --porcelain` без HANDOFF | пусто | пусто |
| `src/components/map/dbg.test.tsx` | нет | нет |
| `git ls-files node_modules \| wc -l` | 0 | 0 |
| `GlobeCanvas.tsx`, `globe.ts`, `Starfield.tsx` | удалены | 3 «No such file» |
| блоков `prefers-reduced-motion` в `global.css` | 1 | 1 |
| CSS-файлов с `prefers-reduced-motion` | 1 | 1 (`global.css`) |
| `data-anim` в `.tsx` | только реестр | 9 значений реестра, `new-light` лишь в селекторе `EsdMap.test.tsx` |
| остатки огоньков в `EsdMap.tsx` и `map.css` | 0 | 0 |
| `motionPolicy.test.ts` | `pulse` и `stars` обязательны, `new-light` только в реестре | так и есть |

## Гейт

| Шаг | Код | Числа |
|---|---|---|
| `npx tsc -b` | 0 | вывод пуст |
| `npm test` | 0 | 52 файла, 564 теста passed, 0 failed, 0 skipped; `Not implemented` 0, `act(` 0, `console.error` 0 |
| `npm run lint` | 0 | предупреждений нет |
| `npm run build` | 0 | 793 модуля, без предупреждений о размере чанков |
| `node scripts/check-dist.mjs` | 0 | `OK: 12 проверок`, среди них `OK видео глобуса` |

Сборка: `index.html` 2,65 КБ, `assets/index-BrMtUpqK.css` 75,26 КБ (gzip 16,85), `assets/vendor-map-BjCgd77U.js` 182,70 КБ (gzip 66,82), `assets/index-D5PMozSR.js` 407,52 КБ (gzip 130,33). Видео в `dist`: `hero-globe.webm` 1869,8 КБ, `hero-globe.mp4` 2789,3 КБ.

Повторная сборка после коммита дала те же хэши — билд детерминирован по коммиту.

## Числа стыков

- Шум jsdom до правки `setup.ts`: **19 строк** «Not implemented: HTMLMediaElement's play() method» в прогоне по `App`, `hero`, `map`. После — 0.
- Тестов в этом подмножестве: 184 → 188 (четыре новых сценария).
- Узлов SVG на рендере всего приложения: **282** при пороге 1300 (13 элементов `<svg>`, из них карта — 177 путей стран). Структурная половина LIGHT-07 подтверждена.
- Набор `data-anim` в DOM: **8 значений** — `atmosphere`, `beam`, `globe`, `halo`, `particles`, `pulse`, `stars`, `wave`. Узла `new-light` нет: кольцо нового огонька рисует canvas. По одному узлу на `stars` (CANVAS), `globe` (VIDEO), `pulse` (CANVAS).
- `App.seams.test.tsx`: 9 тестов (5 v1.1 + 4 v1.2), диф — 136 добавленных строк без единой удалённой.

## Сверка хэшей

Скрипт на preview (порт 4173, `--retries 1`): код 0, **7 из 7 равны**, «список ассетов совпал, файлов: 3».

Прогон против прода до деплоя (`--retries 1 --out /dev/null`): код **1**, 2 из 7 равны. Разошлись `index.html` (живой `9a0d038dd0cf` против `9d16d6270348`) и оба новых ассета (404 на проде v1.1); `hero-globe.webm` и `hero-globe.mp4` тоже отдавали 404 — в сборку v1.1 видео не попало. Совпали `favicon.svg` и `vendor-map-BjCgd77U.js`. Скрипт различает равные и неравные файлы.

## Деплой и прод

- Прогон: **34046791832** — «Deploy to GitHub Pages», headSha `827785cb7a18fd1ec950577bddbfc1ebc1076808`, conclusion **success**.
- URL: https://github.com/thevladoss/esd-onevoice27/actions/runs/34046791832
- Длительность: 16:51:43Z → 16:53:05Z, **1 мин 22 с**.
- `curl -sI https://thevladoss.github.io/esd-onevoice27/` → `HTTP/2 200`.
- Сверка: **1 проход**, повторов не понадобилось — кэш Pages отдал свежую сборку сразу.

| путь | код | sha256 живого (первые 12) | sha256 dist (первые 12) | равен |
|---|---|---|---|---|
| /esd-onevoice27/ (index.html) | 200 | 9d16d6270348 | 9d16d6270348 | да |
| /esd-onevoice27/favicon.svg | 200 | 92fa3607592f | 92fa3607592f | да |
| /esd-onevoice27/assets/index-D5PMozSR.js | 200 | cda4264a1a5c | cda4264a1a5c | да |
| /esd-onevoice27/assets/vendor-map-BjCgd77U.js | 200 | ce8d2c48c97b | ce8d2c48c97b | да |
| /esd-onevoice27/assets/index-BrMtUpqK.css | 200 | 49e780ab0553 | 49e780ab0553 | да |
| /esd-onevoice27/hero-globe.webm | 200 | 854bc2915f17 | 854bc2915f17 | да |
| /esd-onevoice27/hero-globe.mp4 | 200 | a43ac08a8d83 | a43ac08a8d83 | да |

Итог: **7 из 7 равны**, список ассетов живого `index.html` совпал с `dist/index.html`.

## Deviations from Plan

Отклонений нет — план выполнен как написан.

Одно уточнение внутри Task 1: проверка canvas частиц в тесте 1 записана селектором `canvas.hero__particles[data-anim="stars"][aria-hidden="true"]` вместо трёх отдельных `toHaveAttribute`. Так файл содержит литерал `data-anim="stars"`, которого требуют `key_links` и критерии приёмки плана, а смысл проверки прежний.

## Issues Encountered

- В `src/styles/global.css` селекторы `[data-anim="pulse"] circle`, `[data-anim="pulse"] .light-halo` и `[data-anim="new-light"]` в блоке reduce стали no-op после переезда огоньков на canvas: узлов под них в DOM больше нет. По решению roadmap v1.2 они остаются как страховка каскада, их наличие проверяет `motionPolicy.test.ts`. Файл не трогался.
- Прод v1.1 отдавал 404 на `hero-globe.webm` и `hero-globe.mp4`: видео легло в `public/` уже после последнего деплоя v1.1. Деплоем v1.2 оба файла опубликованы и совпали с `dist/`.

## Deferred Issues

Нет.

## Known Stubs

Нет.

## Next Phase Readiness

- План 17-02 меряет ровно ту сборку, что проверена: прод и `dist/` побайтно равны, имена ассетов `index-D5PMozSR.js`, `index-BrMtUpqK.css`, `vendor-map-BjCgd77U.js`.
- Таблицу из `qa/results/prod-hashes.txt` план 17-02 переносит в раздел «Фаза 17 / v1.2» файла `docs/qa/SMOKE.md`.
- Коммит `qa/results/prod-hashes.txt` — за оркестратором, вместе с документами плана 17-02.
- Порт 4173 свободен, preview остановлен, посторонних файлов в рабочем дереве нет.

## Self-Check: PASSED

- `/Users/thevladoss/devs/web/esd_cringe/src/test/setup.ts` — FOUND
- `/Users/thevladoss/devs/web/esd_cringe/src/components/hero/HeroParticles.test.tsx` — FOUND (210 строк)
- `/Users/thevladoss/devs/web/esd_cringe/src/App.seams.test.tsx` — FOUND (333 строки, 9 тестов)
- `/Users/thevladoss/devs/web/esd_cringe/.planning/phases/17-integration-qa/qa/prod-hashes.mjs` — FOUND (254 строки)
- `/Users/thevladoss/devs/web/esd_cringe/.planning/phases/17-integration-qa/qa/results/preview-hashes.txt` — FOUND (7 строк «да»)
- `/Users/thevladoss/devs/web/esd_cringe/.planning/phases/17-integration-qa/qa/results/prod-hashes.txt` — FOUND (7 строк «да», 0 «нет»)
- Коммит `827785c` — FOUND в `origin/main`
