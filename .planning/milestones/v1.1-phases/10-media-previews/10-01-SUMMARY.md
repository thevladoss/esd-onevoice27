---
phase: 10-media-previews
plan: 01
subsystem: ui
tags: [news-card, video-embed, aspect-ratio, object-fit, tailwind, css]

# Dependency graph
requires:
  - phase: 04-news
    provides: секция новостей, NewsCard с обложкой и пагинацией
  - phase: 03-about
    provides: VideoEmbed — фасад YouTube с постером hqdefault
provides:
  - Карточка новости в кадре 16:9 с обрезкой чёрных полос hqdefault
  - Панель заголовка карточки, оверлей и активное состояние по правилам оригинала
  - Тест-контракты news.css и video-embed.css: значения спецификации проверяются по тексту файлов
affects: [13-merge-accept, 11-video-panel]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Значения оригинала пишутся литералами rgb(r g b / a) в CSS фазы, не токенами проекта"
    - "Контракт CSS проверяется чтением файла с диска (vitest css: false), а не computed style"
    - "Reduced motion остаётся одним блоком в global.css: масштаб выключается утилитой motion-safe:"

key-files:
  created:
    - src/components/news/NewsCard.test.tsx
  modified:
    - src/components/news/NewsCard.tsx
    - src/components/news/news.css
    - src/components/news/News.test.tsx
    - src/components/about/video-embed.css
    - src/components/about/VideoEmbed.test.tsx

key-decisions:
  - "Панель заголовка стоит на inset: auto 4px 4px, а не на inset: 4px: полная заливка закрыла бы обложку на ховере"
  - "Переход задан на свойство scale, а не transform: утилита Tailwind v4 scale-[1.035] пишет именно в scale"
  - "Активное состояние продублировано для :focus-within (без медиа) и :hover (под @media (hover: hover))"
  - "VideoEmbed правится только явным object-position: center — расчёт показал, что 16:9 + cover уже срезает ровно полосы"

patterns-established:
  - "Классы карточки news-card__* связывают разметку, стили и тесты одним именем"
  - "Расчёт кропа записан комментарием рядом с правилом, а не только в плане"

requirements-completed: [MEDIA-01, MEDIA-02, MEDIA-03]

# Metrics
duration: 5 min
completed: 2026-09-06
---

# Phase 10 Plan 01: Превью новостей и видео Summary

**Карточка новости переехала с 4:5 на кадр 16:9 с `object-cover object-center`: полосы `hqdefault.jpg` срезаются контейнером, а панель заголовка, оверлей и ховер повторяют правила `#ov-news-feed article` оригинала.**

## Performance

- **Duration:** 5 min
- **Started:** 2026-09-06T08:05:18Z
- **Completed:** 2026-09-06T08:10:37Z
- **Tasks:** 3
- **Files modified:** 6 (1 создан, 5 изменены)

## Accomplishments

- Обложка новости лежит в `aspect-video` с `object-cover object-center`: при исходнике 480×360 контейнер срезает по 12,5% сверху и снизу — ровно чёрные полосы. Источник `hqdefault.jpg` не менялся.
- Панель заголовка встала внизу карточки (`inset: auto 4px 4px`, padding `clamp(18px, 2.4vw, 28px)`, radius 12px), заголовок 800 `clamp(1.125rem, 1.6vw, 1.375rem)` `-0.03em` lh 1.08 с `line-clamp-3`, дата 700 12px uppercase `rgb(170 217 220)`.
- Ховер и фокус дают одно состояние: картинка растёт до 1.035 за 760ms `cubic-bezier(.16, 1, .3, 1)`, подложка панели светлеет до `rgb(247 239 232 / .96)` с тенью `0 12px 30px rgb(2 2 12 / .24)`, текст темнеет до `rgb(18 12 52)`, рамка становится `rgb(143 157 214 / .38)`.
- `NewsCard.test.tsx` закрывает MEDIA-01 и MEDIA-02 на уровне карточки; контракт `news.css` проверяет каждый литерал спецификации по тексту файла.
- Расчёт кропа постера ролика зафиксирован комментарием в `video-embed.css`, правка свелась к явному `object-position: center`; тест держит 16:9 и `cover` для обычного и компактного фасада.

## Task Commits

1. **Task 1: Карточка новости 16:9 с панелью, оверлеем и ховером** — `4466dad` (feat)
2. **Task 2: Тесты карточки: 16:9, hqdefault, ховер, контракт news.css** — `ff1199f` (test)
3. **Task 3: Проверка кропа VideoEmbed с тест-контрактом** — `28b8894` (feat)

## Files Created/Modified

- `src/components/news/NewsCard.tsx` — разметка карточки: `article.news-card` → `a.news-card__link.group` → кадр `news-card__cover.aspect-video` (картинка или плашка) и панель `news-card__panel` с датой и заголовком; масштаб на утилитах `motion-safe:`.
- `src/components/news/news.css` — блок карточки: рамка и фон ссылки, оверлей `::after` на кадре, подложка панели `::before`, типографика заголовка и даты, активное состояние на `:hover` и `:focus-within`.
- `src/components/news/NewsCard.test.tsx` — новый файл: кадр 16:9, источник `hqdefault`, ховер через `motion-safe:`, панель, контракт `news.css`, плашка при ошибке обложки.
- `src/components/news/News.test.tsx` — тест пропорции переписан с 4:5 на 16:9, добавлена проверка `object-center`.
- `src/components/about/video-embed.css` — `object-position: center` у `.ve-poster` и комментарий с расчётом кропа.
- `src/components/about/VideoEmbed.test.tsx` — новый `describe` на кроп постера: DOM обычного и компактного фасада, контракт CSS по блокам `.ve`, `.ve-poster`, `.ve--compact`, `.ve-frame`.

## Verification

Все команды запускались в worktree, вывод наблюдался:

- `npx tsc -b` — без ошибок.
- `npx vitest run src/components/news src/components/about/VideoEmbed.test.tsx src/styles/motionPolicy.test.ts` — 4 файла, 54 теста, все зелёные, ни одного skip.
- `npm run lint` — без ошибок и предупреждений.
- `git diff --name-only <база> HEAD` — ровно шесть файлов из `files_modified`, чужих файлов нет.
- `git diff --stat -- src/components/about/VideoEmbed.tsx` — пусто, компонент не тронут.
- Литералы спецификации в `news.css` проверены поштучно `grep -F`: все 17 строк из acceptance criteria на месте; `grep -c prefers-reduced-motion` = 0 в `news.css` и в `video-embed.css`.

Не проверялось: яркость 6-пиксельных полос у краёв обложки (MEDIA-01) — замер идёт Playwright-скриптом фазы 13 (QA-03), в jsdom его сделать нечем. Визуальный smoke на 1440×900 и 390×844 не запускался: сборка и preview в worktree запрещены правилами параллельного запуска.

## Decisions Made

- Панель заголовка получила `inset: auto 4px 4px` вместо `inset: 4px` из спецификации: у оригинала верх не задан, а полная заливка закрыла бы обложку кремовой подложкой на ховере (ограничение зафиксировано планом).
- Переход задан на свойство `scale`, а не `transform`: утилита Tailwind v4 `scale-[1.035]` пишет в `scale`, и переход на `transform` не сработал бы. Покой оставлен на `scale: 1.001` — тот же приём против субпиксельного зазора, что `transform: scale(1.001)` у оригинала.
- Активное состояние продублировано двумя группами селекторов: `:focus-within` без медиазапроса и `:hover` под `@media (hover: hover)`, чтобы на сенсорном экране фокус карточку всё равно подсвечивал.
- `VideoEmbed` не потребовал правок разметки: расчёт (480×360 → кадр 480×270 + полосы 45px; `cover` в контейнере 16:9 срезает 0,09375W с каждой стороны = 45/480·W) показал, что полосы уходят ровно. Добавлено только явное `object-position: center` из спецификации.

## Deviations from Plan

None — план выполнен как написан. Значения взяты из раздела 4 (MEDIA) спецификации без импровизации.

## Assumption Drift (advisory)

**Комментарий в CSS ронял тест политики движения.**

- **Найдено:** Task 1, первый прогон.
- **Планировалось:** комментарий к блоку карточки объясняет, что единственный блок `@media (prefers-reduced-motion: reduce)` живёт в global.css.
- **Оказалось:** `motionPolicy.test.ts` ищет подстроку `prefers-reduced-motion` по всему тексту `.css`-файлов, включая комментарии, и упал на упоминании в комментарии.
- **Почему важно:** правило фазы «в news.css строки `prefers-reduced-motion` нет» читается буквально — политику нельзя называть даже в прозе. Комментарий переписан на «единственный блок политики сокращённого движения живёт в global.css»; смысл сохранён, тест зелёный.

## Issues Encountered

- Тест «держит обложку в пропорции 4:5» после Task 1 был красным до Task 2 — ровно тот случай, который план разрешает как временный: Task 2 переписал его на 16:9.
- В worktree `node_modules` подключён симлинком, а `.gitignore` игнорирует только каталог (`node_modules/`), поэтому `git status` показывает симлинк как untracked. В коммиты он не попал: файлы стадились поимённо. Правку `.gitignore` не делал — файл вне `files_modified` плана и принадлежит основному репозиторию.

## User Setup Required

None — внешние сервисы не настраиваются.

## Next Phase Readiness

- MEDIA-01, MEDIA-02, MEDIA-03 закрыты кодом и unit-тестами; приёмка яркости полос и визуальный smoke уходят в фазу 13.
- Публичный API `VideoEmbed` (`videoId`, `title`, `className`, `size`) не менялся — фаза 11 (панель «Видео») собирается на нём без правок.
- Слияние конфликтов не ждёт: ветка трогает только шесть файлов фазы 10.

---
*Phase: 10-media-previews*
*Completed: 2026-09-06*

## Self-Check: PASSED

Все файлы из `key-files` лежат на диске, все четыре коммита есть в `git log`, изменения ветки ограничены шестью файлами плана и SUMMARY.
