---
phase: 05-polish-and-release
plan: 07
subsystem: infra
tags: [github-pages, github-actions, deploy, qa, smoke, curl, sha256]

requires:
  - phase: 01-scaffold-and-deploy
    provides: workflow deploy.yml с разделёнными правами джоб, base /esd-onevoice27/, приём деплоя сверкой sha256
  - phase: 05-polish-and-release
    provides: check:dist на 11 проверок, чеклист docs/qa/SMOKE.md, продакшн-код без console.*
provides:
  - Зелёный прогон Deploy to GitHub Pages на HEAD ветки main
  - Побайтное доказательство совпадения прода и локального dist: index.html и три ассета по sha256
  - Заполненные шапка и раздел «Прод» в docs/qa/SMOKE.md со ссылкой на прогон workflow
  - Поднятый preview на 4173 для браузерной части приёмки
affects: [верификатор фазы 05, закрытие milestone v1.0]

tech-stack:
  added: []
  patterns:
    - "Приём деплоя Pages сверкой sha256 живых файлов и локального dist на одном коммите, а не только кодом 200"
    - "Ожидание прогона Actions циклом gh run view --json status,conclusion с паузой: timeout для обёртки gh run watch на macOS недоступен"

key-files:
  created: []
  modified:
    - docs/qa/SMOKE.md

key-decisions:
  - "Права workflow оставлены как есть: разделение по джобам строже, чем единый блок из плана, и не отдаёт OIDC-токен джобе с npm ci"
  - "В шапке SMOKE.md записан коммит деплоя b3a7009 с пометкой, что сборка идентична c8915d4: коммит документа физически не может ссылаться на самого себя"

patterns-established:
  - "Сверка прода: код ответа, число совпадений title, diff списка ассетов, код ответа и sha256 каждого ассета"

requirements-completed: [QA-04, MOTION-04]

duration: 12min
completed: 2026-09-05
---

# Phase 5 Plan 07: Финальный деплой и приёмка Summary

**Прод на GitHub Pages отдаёт побайтно ту же сборку, что локальный `dist`: index.html и три ассета совпали по sha256, прогон Deploy to GitHub Pages зелёный, шапка и раздел «Прод» в SMOKE.md заполнены.**

## Performance

- **Duration:** 12 min
- **Started:** 2026-09-05T18:35:00Z
- **Completed:** 2026-09-05T18:47:34Z
- **Tasks:** 1 из 2 выполнена исполнителем, задача 2 передана оркестратору как auto-approved чекпоинт
- **Files modified:** 1

## Accomplishments

- Предполёт прошёл вчистую: `npm test` — 333 теста в 42 файлах, `npm run lint` — 0, `npm run build` — 0, `npm run check:dist` — 11 из 11
- `origin/main` догнан до локального HEAD, прогон [33985010587](https://github.com/thevladoss/esd-onevoice27/actions/runs/33985010587) завершился `success`
- Прод сверен с локальной сборкой на двух уровнях: пустой `diff` списка `/esd-onevoice27/assets/*` и совпадение sha256 по каждому из четырёх файлов
- Preview поднят на `http://localhost:4173/esd-onevoice27/` для браузерного захода оркестратора

## Task Commits

1. **Task 1: Предполётные проверки, деплой, сверка прода с локальной сборкой** — `b3a7009` (docs) и `c37ae70` (docs)
2. **Task 2: Браузерный smoke через Playwright MCP** — ⚡ auto-approved чекпоинт, выполняет оркестратор

## Files Created/Modified

- `docs/qa/SMOKE.md` — шапка (дата, коммит деплоя, ссылка на прогон workflow), раздел «Прод»: код ответа, title, список ассетов, таблица sha256

## Что проверено фактически

Каждая строка ниже — наблюдённый вывод команды, а не пересказ плана.

| Проверка | Команда | Результат |
|---|---|---|
| Тесты | `npm test` | 42 файла, 333 теста, все зелёные, 6.46s |
| Линт | `npm run lint` | выход 0, вывод пуст |
| Сборка | `npm run build` | выход 0, без предупреждений о размере чанков |
| Артефакт | `npm run check:dist` | `OK: 11 проверок` |
| Права workflow | `grep -cE 'write-all|contents: write'` | 0 |
| Concurrency | `grep -c 'group: pages'` | 1 |
| Синхронизация | `git rev-parse HEAD` vs `origin/main` | совпали на `b3a7009` после пуша |
| Прогон | `gh run view 33985010587 --json conclusion` | `success` |
| Код ответа прода | `curl -sI … \| head -1` | `HTTP/2 200` |
| Title | `curl -s … \| grep -c '<title>…'` | 1 |
| Список ассетов | `diff` прода и `dist/index.html` | пуст |
| Ассеты | `curl -s -o /dev/null -w '%{http_code}'` по трём файлам | 200, 200, 200 |
| sha256 | живой файл vs локальный `dist` | совпал у `index.html` и у всех трёх ассетов |
| Повтор после редеплоя | те же `diff` и sha256 на `b3a7009` | результат не изменился |

## Что НЕ проверено исполнителем

Браузерная часть приёмки (задача 2) требует Playwright, которого у исполнителя плана нет; чекпоинт передан оркестратору. Строки чеклиста «Секции», «Консоль», «Сеть», «Горизонтальный скролл», «Reveal», «Reduced motion», «Якоря», «Фокус», «Мобильное меню», «FPS», блок «Контраст», таблица «Скриншоты» и поле «Вердикт» в `docs/qa/SMOKE.md` оставлены пустыми под заполнение оркестратором. Строки «Число секций», «Консоль» и «Сеть» в разделе «Прод» тоже пустые по той же причине — об этом в файле стоит явная оговорка.

Требования QA-04 и MOTION-04 закрыты в CLI-части (прод доступен и совпадает с локальной сборкой, собранный `dist` проходит 11 проверок артефакта). Подтверждение чистой консоли и отсутствия 404 в живом браузере на 1440 и 390 даёт заход оркестратора; его провалы уходят в верификатор фазы как gaps.

## Decisions Made

- **Права workflow не тронуты.** План требовал единый блок `permissions` с `contents: read`, `pages: write`, `id-token: write`. В репозитории права разложены по джобам: `build` получает `contents: read` и `pages: read`, `deploy` — только `pages: write` и `id-token: write`. Это строже требования плана: джоба, которая крутит `npm ci` с install-скриптами зависимостей, вообще не видит OIDC-токен. Приведение к плану было бы ослаблением T-05-16.
- **Коммит в шапке SMOKE.md — `b3a7009` с пометкой про идентичность сборки.** Коммит, который вносит запись, не может содержать собственный sha. Записан деплой-коммит и оговорка, что последующие коммиты фазы меняют только `.planning/` и `docs/`, поэтому имена и sha256 ассетов не двигаются.
- **Скриншоты и колонки чеклиста не заполнялись.** Фабриковать результаты браузерного прогона нельзя; файлы `docs/qa/final-*.jpeg` в рабочем дереве появились от оркестратора и коммитятся его коммитом задачи 2.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Гейт прав workflow оставлен строже требования плана**

- **Found during:** Task 1 (предполётные проверки)
- **Issue:** `grep -cE "^\s*(contents: read|pages: write|id-token: write)$" .github/workflows/deploy.yml` выводит 4, а не 3, как ждал критерий приёмки: `contents: read` стоит и на верхнем уровне, и в джобе `build`
- **Fix:** Файл не менялся. Разбор показал, что расхождение идёт от более строгой схемы: права выданы по джобам, а не одним блоком на весь workflow, и джоба `build` физически не может опубликовать Pages. Смысл гейта («права минимальны, нет `write-all` и `contents: write`») выполнен: соответствующий grep выводит 0, `group: pages` — 1
- **Files modified:** нет
- **Verification:** `grep -cE 'write-all|contents: write'` → 0; `grep -c 'group: pages'` → 1; прогон деплоя зелёный на текущих правах
- **Committed in:** —

**2. [Rule 3 - Blocking] Критерий с коротким sha в SMOKE.md заменён на sha деплой-коммита**

- **Found during:** Task 1 (запись результатов)
- **Issue:** Критерий `grep -c "$(git rev-parse --short HEAD)" docs/qa/SMOKE.md` не меньше 1 невыполним буквально: после коммита документа HEAD становится новым sha, которого в тексте быть не может
- **Fix:** В шапку записан sha задеплоенного коммита `b3a7009` со ссылкой на его зелёный прогон и оговоркой про идентичность сборки с `c8915d4`
- **Files modified:** docs/qa/SMOKE.md
- **Verification:** `grep -c b3a7009 docs/qa/SMOKE.md` → 2; прогон 33985010587 на b3a7009 — `success`
- **Committed in:** `c37ae70`

**3. [CLAUDE.md] Сообщения коммитов на русском вместо английских из плана**

- **Found during:** Task 1 (коммит)
- **Issue:** План диктовал `docs(05): deploy verified`; глобальные правила проекта требуют весь текст для пользователя, включая коммиты, на русском, и остальная история фазы держит русский
- **Fix:** `docs(05-07): деплой подтверждён сверкой прода с локальной сборкой` и `docs(05-07): коммит деплоя и ссылка на зелёный прогон в шапке SMOKE.md`
- **Files modified:** нет
- **Verification:** `git log --oneline -3` — префиксы conventional commits сохранены
- **Committed in:** `b3a7009`, `c37ae70`

---

**Total deviations:** 3 (1 отказ ослаблять безопасность, 1 блокирующий критерий, 1 правило проекта)
**Impact on plan:** Расширения объёма нет; ни одна строка `src/**` не тронута.

## Assumption Drift (advisory)

**1. Прогон workflow уже был зелёным до пуша**

- **Found during:** Task 1
- **Planned:** План строил задачу вокруг `git push origin main` как события, запускающего деплой, и ожидания появления run по коммиту в цикле до 12 попыток
- **Actual:** `origin/main` уже стоял на `c8915d4`, прогон [33984796698](https://github.com/thevladoss/esd-onevoice27/actions/runs/33984796698) отработал `success`, прод уже отдавал финальную сборку. Пуш стал no-op, реальный деплой запустил мой собственный коммит документа
- **Why:** Предыдущий шаг фазы («update tracking after wave 3») запушил `c8915d4` до старта этого плана

**2. Задача 2 идёт параллельно, а не после задачи 1**

- **Found during:** Task 1
- **Planned:** Исполнитель поднимает preview и передаёт управление, оркестратор снимает скриншоты после
- **Actual:** Файлы `docs/qa/final-desktop.jpeg`, `final-full.jpeg`, `final-mobile.jpeg` появились в рабочем дереве во время предполёта — оркестратор снимал их одновременно
- **Why:** Оркестратор ведёт браузерный заход своим циклом; на коммиты задачи 1 это не повлияло, стейджилась только `docs/qa/SMOKE.md`

## Issues Encountered

Порт 4173 при старте был свободен, `npx vite preview --port 4173 --strictPort` поднялся, `curl` по `http://localhost:4173/esd-onevoice27/` вернул 200. Процесс остаётся жить для браузерной части.

## User Setup Required

Не требуется.

## Next Phase Readiness

- Прод и локальная сборка совпадают побайтно, все автоматические гейты фазы зелёные
- Для закрытия фазы верификатору нужен результат браузерного захода оркестратора: колонки «Preview» и «Прод» в `docs/qa/SMOKE.md`, поле «Вердикт», четыре файла `docs/qa/final-*.jpeg` и их коммит
- Открытых блокеров нет

---
*Phase: 05-polish-and-release*
*Completed: 2026-09-05*

## Self-Check: PASSED

- `docs/qa/SMOKE.md` и `05-07-SUMMARY.md` на диске
- Коммиты `b3a7009` и `c37ae70` в истории
- `grep -c b3a7009 docs/qa/SMOKE.md` → 2; `grep -cE 'write-all|contents: write'` → 0; `grep -c 'group: pages'` → 1
