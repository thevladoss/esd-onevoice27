---
phase: 04-news-resources-quote
plan: 03
subsystem: ui
tags: [react, typescript, youtube, lite-embed, privacy, vitest, testing-library, tailwindcss-v4]

requires:
  - phase: 01-01
    provides: "токены @theme (midnight-950, paper, horizon-400), стиль типизированных данных в src/data/"
  - phase: 01-02
    provides: "примитивы layout и приём склейки className через конкатенацию строки"
provides:
  - "src/data/videos.ts: 16 роликов ЕАД { id, title } с типом VideoItem"
  - "src/data/materials.ts: 5 материалов { id, title, caption, href, kind } с реальными ссылками ЕАД"
  - "src/data/copy.resources.ts: строки секции ресурсов, карточек, панели, заглушки музыки и watchLabel"
  - "src/components/resources/VideoFacade.tsx: фасад YouTube с API { videoId, title, className? }"
  - "src/components/resources/VideoGrid.tsx: сетка 2/3/4 колонки из 16 фасадов с подписями"
affects: [04-04, 05-motion-and-polish]

tech-stack:
  added: []
  patterns:
    - "Lite-embed: постер img.youtube.com грузится сразу, iframe youtube-nocookie монтируется только по клику"
    - "Ошибку внешней картинки обрабатывает onError с переключением на градиентную плашку, кнопка и aria-label остаются"
    - "Копирайт секции живёт в отдельном модуле data/copy.{section}.ts, чтобы параллельные worktree не конфликтовали в copy.ts"
    - "Акцентные hex-цвета карточек хранятся в данных до фазы 5, которая поднимет их в @theme"

key-files:
  created:
    - src/data/videos.ts
    - src/data/materials.ts
    - src/data/copy.resources.ts
    - src/components/resources/VideoFacade.tsx
    - src/components/resources/VideoGrid.tsx
    - src/components/resources/VideoFacade.test.tsx
  modified: []

key-decisions:
  - "Постер hqdefault (480×360) вместо maxresdefault: доступен у всех 16 роликов, вес 5–20 КБ"
  - "Коммиты на русском по глобальному CLAUDE.md, а не английские строки из плана"
  - "resourceKeys и accent-цвета лежат в copy.resources.ts, чтобы план 04-04 собрал карточки без новых данных"

patterns-established:
  - "VideoFacade: API { videoId, title, className? } совпадает с VideoEmbed фазы 3, фаза 5 сведёт их в один компонент"
  - "data-cover=\"ok|failed\" на корне фасада как проверяемый маркер состояния обложки"

requirements-completed: [RES-02, RES-03]

duration: 8min
completed: 2026-09-05
---

# Phase 04 Plan 03: Фасад видео и данные ресурсов Summary

**Фасад YouTube с lite-embed (постер hqdefault → iframe youtube-nocookie по клику), сетка на 16 роликов ЕАД и три типизированных модуля данных для секции ресурсов**

## Performance

- **Duration:** 8 мин
- **Started:** 2026-09-05T15:51:00Z
- **Completed:** 2026-09-05T15:59:08Z
- **Tasks:** 2
- **Files modified:** 6 (все созданы)

## Accomplishments

- `VideoFacade` не трогает сеть YouTube-плеера до клика: до взаимодействия в DOM только `img` с `img.youtube.com` и кнопка, `iframe` появляется после `onClick` с `autoplay=1&rel=0`, `referrerPolicy="strict-origin-when-cross-origin"` и явным списком `allow`
- `VideoGrid` разворачивает `data/videos.ts` в 16 `li` с фасадами и подписями, колонок 2/3/4 по брейкпоинтам
- Данные ресурсов готовы для плана 04-04: 16 роликов, 5 материалов с реальными адресами (DOCX, три страницы esd.onevoice27.org, SharePoint) и полный набор строк карточек, панели и заглушки музыки
- Сбой обложки не ломает доступность: `onError` прячет картинку, ставит `data-cover="failed"`, кнопка с `aria-label="Смотреть видео: {title}"` остаётся кликабельной

## Task Commits

1. **Task 1: падающие тесты фасада, сетки и данных (RED)** — `eb7a9f2` (test)
2. **Task 2: данные ресурсов, VideoFacade и VideoGrid (GREEN)** — `92cb65d` (feat)

## Files Created/Modified

- `src/data/videos.ts` — 16 роликов ЕАД `{ id, title }`, порядок из RESEARCH, id строками (первый начинается с дефиса)
- `src/data/materials.ts` — 5 материалов с `kind` для иконки, `caption` формата и внешним `href`
- `src/data/copy.resources.ts` — `resourceKeys`, `resourcesCopy` (eyebrow/title/body, три карточки с accent, панель, заглушка музыки, `video.watchLabel`)
- `src/components/resources/VideoFacade.tsx` — постер, слой затемнения, круг play с SVG-треугольником, переключение на `iframe` по клику
- `src/components/resources/VideoGrid.tsx` — `ul` 2/3/4 колонки, подпись `line-clamp-2` под каждым фасадом
- `src/components/resources/VideoFacade.test.tsx` — 8 проверок: фасад (4), данные (3), сетка (1)

## Verification (что реально прогонялось)

| Команда | Результат |
|---|---|
| `npx vitest run src/components/resources/VideoFacade.test.tsx` (после Task 1) | FAIL: `Failed to resolve import "./VideoFacade"` — RED подтверждён |
| `npx vitest run src/components/resources/VideoFacade.test.tsx` (после Task 2) | 8 passed, exit 0 |
| `npm test` | 16 файлов, 119 тестов passed, exit 0 |
| `npm run build` | `tsc -b && vite build` exit 0, бандл 203.44 kB / gzip 63.99 kB |
| `npx eslint` по файлам плана | exit 0 |
| `git diff --name-only {base} HEAD -- src` минус разрешённый список | пусто; `package.json` не изменён |

Ручной smoke в браузере (16 постеров, отсутствие запросов к youtube-nocookie до клика) не выполнялся: компоненты пока никуда не подключены, интеграция и smoke — в плане 04-04.

## Decisions Made

- Постер `hqdefault` вместо `maxresdefault`: по RESEARCH доступен у всех 16 роликов и весит 5–20 КБ.
- `data-cover` держится на корневом `div` фасада, а не на кнопке: маркер переживает переключение в режим плеера и удобен для теста.
- Акцент музыки `#8f9dd6` записан hex-строкой в `copy.resources.ts`: `tokens.css` принадлежит фазе 1 и параллельным исполнителям, фаза 5 поднимет цвет в `@theme`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Соответствие CLAUDE.md] Коммиты написаны по-русски**
- **Found during:** Task 1 (коммит RED)
- **Issue:** План диктует английские сообщения (`test(04-03): add failing tests ...`), глобальный CLAUDE.md требует русский текст, и история репозитория уже русская (`docs(01-05): раздел «Проверка деплоя» в README`)
- **Fix:** Сообщения переведены с сохранением типа и скоупа: `test(04-03): падающие тесты ...`, `feat(04-03): данные ресурсов ...`
- **Files modified:** нет (только сообщения коммитов)
- **Verification:** `git log -2 --format='%h %s'`
- **Committed in:** `eb7a9f2`, `92cb65d`

**2. [Косметика] Порядок классов focus-visible в VideoFacade**
- **Found during:** Task 2
- **Issue:** План даёт `focus-visible:outline-2 focus-visible:outline-horizon-400 focus-visible:outline-offset-2`
- **Fix:** Записал ширину, offset, цвет подряд: `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-horizon-400`. Классы задают разные свойства, поведение то же; порядок выбран для читаемости
- **Files modified:** src/components/resources/VideoFacade.tsx
- **Verification:** `npm run build` exit 0; визуально фокус не проверялся (компонент ещё не смонтирован в страницу)
- **Committed in:** `92cb65d`

---

**Total deviations:** 2 auto-fixed (1 соответствие CLAUDE.md, 1 косметическая)
**Impact on plan:** Контракты `<interfaces>` не изменились, план 04-04 реализуется против них без правок. Расширения объёма нет.

## Assumption Drift (advisory)

**1. Проверка «до клика нет запросов к youtube-nocookie» осталась на уровне DOM**
- **Found during:** Task 2
- **Planned:** verification плана упоминает smoke в DevTools Network
- **Actual:** тест проверяет отсутствие `iframe` в DOM; сетевого наблюдения в jsdom нет
- **Why:** компоненты ещё не смонтированы ни в одну секцию, браузерный smoke возможен только после интеграции в плане 04-04

## Issues Encountered

Нет. RED упал ровно на нерезолвящемся импорте, GREEN прошёл с первого запуска.

## Known Stubs

Нет. `resourcesCopy.music.emptyBody` — плановая заглушка секции музыки (официальной песни пока не существует), а не незаполненный код.

## Threat Flags

Нет новых поверхностей сверх `<threat_model>` плана: сетевые обращения только к `img.youtube.com` (постер) и `www.youtube-nocookie.com` (плеер по клику), оба покрыты T-04-08…T-04-11.

## User Setup Required

Нет — внешних сервисов и ключей план не добавляет.

## Next Phase Readiness

- План 04-04 может импортировать `resourcesCopy`, `resourceKeys`, `materials`, `videos` и `VideoGrid` без правок в этом коде.
- `src/components/resources/Resources.tsx` намеренно не тронут: заглушку фазы 1 заменяет план 04-04.
- Фаза 5 сводит `VideoFacade` и `components/about/VideoEmbed.tsx` фазы 3 в один компонент (API совпадает) и поднимает `#8f9dd6` в `@theme` как `--color-unity-200`.

---
*Phase: 04-news-resources-quote*
*Completed: 2026-09-05*

## Self-Check: PASSED

Все шесть файлов на диске, оба коммита (`eb7a9f2`, `92cb65d`) в истории ветки `agent-04-03`.
