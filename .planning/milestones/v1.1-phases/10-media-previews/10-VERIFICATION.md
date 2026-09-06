---
phase: 10-media-previews
verified: 2026-09-06T08:17:36Z
status: passed
score: 5/5 must-haves verified
has_blocking_gaps: false
overrides_applied: 0
deferred:
  - truth: "MEDIA-01: средняя яркость 6px-полос у краёв обложки > 12 (замер пикселей)"
    addressed_in: "Phase 13"
    evidence: "ROADMAP Phase 13 SC3: docs/qa/SMOKE.md содержит таблицу «оригинал / прод» по пункту MEDIA (16:9, полосы); QA-03 — Playwright на проде 1440×900 и 390×844"
  - truth: "Визуальный smoke карточки новости и превью роликов на 1440×900 и 390×844 (ховер, панель, рамка)"
    addressed_in: "Phase 13"
    evidence: "ROADMAP Phase 13: «сверяет прод с оригиналом через Playwright»; SUMMARY фазы 10 прямо фиксирует, что visual smoke не запускался — сборка/preview запрещены правилами параллельного worktree"
---

# Phase 10: Превью новостей и видео — Verification Report

**Phase Goal:** Посетитель видит карточки новостей 16:9 без чёрных полос YouTube с панелью заголовка и ховером оригинала, а превью роликов в About и панели «Видео» без полос и лишней обрезки
**Verified:** 2026-09-06T08:17:36Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | MEDIA-01 — обложка новости в контейнере 16:9 с `object-fit: cover; object-position: center`, чёрных полос нет | ✓ VERIFIED | `NewsCard.tsx:45,65` — `aspect-video`, `object-cover object-center`; источник `hqdefault.jpg` (480×360) не менялся (`src/data/news.ts`). Расчёт кропа (комментарий `video-embed.css:48-53`) и независимая проверка: 16:9-контейнер даёт крап 0.09375·W с каждой стороны = ровно 45px полосы при масштабировании 480×360 — математически кроп точный. Пиксельный замер яркости (>12) — см. Deferred |
| 2 | MEDIA-02 — панель заголовка снизу карточки: `inset`, padding, radius, типографика заголовка/даты; оверлей обложки | ✓ VERIFIED | `news.css:76-91` (`inset: auto 4px 4px`, `padding: clamp(18px, 2.4vw, 28px)`, `border-radius: 12px`), `news.css:113-133` (заголовок 800 `clamp(1.125rem,1.6vw,1.375rem)` `-0.03em` lh 1.08, дата 700 12px uppercase `rgb(170 217 220)`), оверлей `news.css:57-64` буквально совпадает со спецификацией. См. примечание про `inset` ниже |
| 3 | MEDIA-02 — ховер/фокус: scale картинки, панель светлеет, текст темнеет, рамка карточки | ✓ VERIFIED | `news.css:69-74` (`scale: 1.001` → переход `scale 760ms cubic-bezier(.16,1,.3,1)`, класс `motion-safe:group-hover:scale-[1.035]` в `NewsCard.tsx:65`); `news.css:137-165` (`:focus-within` и `@media (hover: hover)` дают `rgb(247 239 232/.96)`, тень `0 12px 30px rgb(2 2 12/.24)`, текст `rgb(18 12 52)`, рамка `rgb(143 157 214/.38)`); reduced motion — утилита `motion-safe:` не активируется, глобальный блок `global.css:298-306` гасит переходы; `news.css` не содержит строку `prefers-reduced-motion` (подтверждено тестом и `grep`) |
| 4 | MEDIA-03 — превью `VideoEmbed` (About и панель «Видео») держит 16:9 с `object-fit: cover`, без полос и лишней обрезки, lite-embed работает как раньше | ✓ VERIFIED | `video-embed.css:54-62` (`.ve-poster`: `object-fit: cover; object-position: center` внутри `.ve { aspect-ratio: 16/9 }`); `.ve--compact` (строки 21-26) не переопределяет `aspect-ratio`/`object-fit` — тот же кроп в `VideoGrid.tsx` (панель «Видео», `size="compact"`); публичный API `VideoEmbed` (`videoId, title, className, size`) не менялся — `About.tsx` и `VideoGrid.tsx` вызывают компонент без правок; клик → iframe `youtube-nocookie` подтверждён тестами `VideoEmbed.test.tsx` |
| 5 | Упавшая обложка новости заменяется плашкой, ссылка и заголовок остаются | ✓ VERIFIED | `NewsCard.tsx:46-57` (`coverFailed` → `news-card__fallback`), тест `NewsCard.test.tsx:125-143` и `News.test.tsx:153-170` воспроизводят `fireEvent.error` и проверяют, что заголовок/ссылка на месте |

**Score:** 5/5 truths verified

**Примечание по `inset` в MEDIA-02:** спецификация (`docs/superpowers/specs/2026-09-06-design-fixes-v1.1-design.md:148`) формулирует значение как «inset 4px», а реализация использует `inset: auto 4px 4px` (SUMMARY фиксирует это явным решением). Проверка по первоисточнику — дампу реального CSS оригинала `docs/research/v1.1/orig-rules.css:251` — показывает, что панель `#ov-news-feed article > div:last-child` в оригинале задаёт только `right/bottom/left`, без `top` (то есть `top: auto` по умолчанию). Реализация `inset: auto 4px 4px` — точное совпадение с оригиналом; расхождение в тексте спецификации — неточность её обобщённой формулировки, а не дефект кода. Ошибки не считаю: приоритет дан фактическому CSS оригинала, лежащему в основе задания.

### Deferred Items

Пункты, явно закреплённые за фазой 13 (Интеграция, гейт и приёмка) правилами роадмапа.

| # | Item | Addressed In | Evidence |
|---|------|-------------|----------|
| 1 | MEDIA-01: пиксельный замер средней яркости 6px-полос у краёв обложки (> 12) | Phase 13 | ROADMAP Phase 13, SC3 — таблица «оригинал / прод» по MEDIA (16:9, полосы), QA-03; в jsdom (vitest) замер яркости пикселей невозможен, инструмент — Playwright |
| 2 | Визуальный smoke карточки/превью на 1440×900 и 390×844 (ховер, панель, рамка вживую) | Phase 13 | ROADMAP Phase 13 — «деплоит на GitHub Pages и сверяет прод с оригиналом через Playwright»; SUMMARY фазы 10 фиксирует, что `vite build && vite preview` не запускался — правила параллельного worktree это запрещают |

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/components/news/NewsCard.tsx` | Разметка карточки 16:9: обложка, панель заголовка, ховер через motion-safe | ✓ VERIFIED | Содержит `aspect-video`, `news-card__panel`, `motion-safe:group-hover:scale-[1.035]` |
| `src/components/news/news.css` | Стили карточки: рамка, оверлей, панель, ховер/фокус, transition на scale | ✓ VERIFIED | Содержит `inset: auto 4px 4px` и все 17 литералов спецификации (проверено тестом-контрактом) |
| `src/components/news/NewsCard.test.tsx` | Тесты MEDIA-01/02: className, hqdefault, контракт CSS | ✓ VERIFIED | 144 строки (≥ 60), 9 тестов, все зелёные |
| `src/components/news/News.test.tsx` | Обновлённый тест пропорции обложки (16:9 вместо 4:5) | ✓ VERIFIED | Содержит `div.aspect-video`, старый `aspect-[4/5]` отсутствует |
| `src/components/about/video-embed.css` | Постер 16:9 с cover и явным `object-position: center` | ✓ VERIFIED | `.ve-poster { object-position: center }` присутствует |
| `src/components/about/VideoEmbed.test.tsx` | Тест MEDIA-03: контракт CSS на aspect-ratio/object-fit | ✓ VERIFIED | Содержит `aspect-ratio: 16 / 9`, новый `describe` «кроп постера 16:9» |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `NewsCard.tsx` | `news.css` | классы `news-card__panel` и импорт CSS | ✓ WIRED | Класс использован в разметке (`NewsCard.tsx:71`) и стилизован (`news.css:76`) |
| `NewsCard.tsx` | `src/data/news.ts` | `item.cover → img src` | ✓ WIRED | `src={item.cover}` (`NewsCard.tsx:60`), `news.ts` отдаёт `hqdefault.jpg` для всех 9 записей |
| `NewsCard.tsx` | Tailwind motion-safe variant | `motion-safe:group-hover:scale-[1.035]` | ✓ WIRED | Класс на `<img>` (`NewsCard.tsx:65`); паттерн уже использован раньше в `VideoEmbed.tsx:103` — подтверждённая рабочая связка Tailwind v4 |
| `VideoEmbed.tsx` | `video-embed.css` | класс `ve-poster` | ✓ WIRED | `className="ve-poster"` (`VideoEmbed.tsx:92`), правило есть в CSS |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|---------------------|--------|
| `NewsCard.tsx` | `item.cover`, `item.title`, `item.date` | `src/data/news.ts` (проп из `News.tsx`) | Да — 9 реальных записей с реальными YouTube ID и внешними ссылками (моки проекта, не изменялись этой фазой) | ✓ FLOWING |
| `VideoEmbed.tsx` | `videoId`, `title` | Проп от `About.tsx` (`aboutCopy.video`) и `VideoGrid.tsx` (`src/data/videos.ts`) | Да — реальные ID роликов | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Компиляция типов проекта | `npx tsc -b` | без ошибок | ✓ PASS |
| Тесты фазы (news + about + motionPolicy) | `npx vitest run src/components/news src/components/about src/styles/motionPolicy.test.ts` | 5 файлов, 59 тестов, все зелёные | ✓ PASS |
| Регрессия в потребителях `VideoEmbed` (About, VideoGrid) | `npx vitest run src/components/resources/VideoGrid.test.tsx src/components/about/About.test.tsx` | 2 файла, 11 тестов, все зелёные | ✓ PASS |
| Lint по файлам фазы | `npx eslint src/components/news src/components/about` | без ошибок и предупреждений | ✓ PASS |
| Пиксельная яркость полос обложки | — | не запускалось (jsdom не считает пиксели) | ? SKIP → deferred в Phase 13 |

### Probe Execution

Не применимо: фаза не мигрирует и не вводит инструментальные скрипты; probe-скриптов в `scripts/*/tests/probe-*.sh`, относящихся к фазе, не найдено.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| MEDIA-01 | 10-01 | Карточки новостей 16:9 с `object-fit: cover`, полос YouTube нет | ✓ SATISFIED | `NewsCard.tsx`, `news.css`; пиксельный порог >12 — deferred в Phase 13 |
| MEDIA-02 | 10-01 | Панель заголовка, оверлей, ховер/фокус по правилам оригинала | ✓ SATISFIED | `news.css` — все литералы спецификации совпадают буквально (кроме уточнённого `inset`, см. примечание) |
| MEDIA-03 | 10-01 | `VideoEmbed` держит 16:9 с `object-fit: cover` в About и в панели «Видео» | ✓ SATISFIED | `video-embed.css`, `VideoEmbed.test.tsx`; API не менялся, `VideoGrid.tsx` (панель «Видео») использует тот же компонент без правок |

Orphaned requirements для фазы 10 не найдены — REQUIREMENTS.md сопоставляет фазе 10 ровно MEDIA-01/02/03, и все три заявлены в `10-01-PLAN.md`.

### Anti-Patterns Found

Нет находок. По всем шести файлам фазы (`NewsCard.tsx`, `news.css`, `NewsCard.test.tsx`, `News.test.tsx`, `video-embed.css`, `VideoEmbed.test.tsx`) не найдено `TBD`/`FIXME`/`XXX`/`TODO`/`HACK`/`PLACEHOLDER`, заглушек `return null`/пустых обработчиков, хардкода пустых данных или проп-заглушек.

### Owned-File Boundary Check

`git diff --stat 4bd6cf7..572cf87` (main до слияния → merge-коммит фазы 10) показывает ровно 6 файлов кода + `10-01-SUMMARY.md` — точное совпадение со списком `files_modified` плана. Файлы вне владения фазы (`News.tsx`, `NewsPagination.tsx`, `about.css`, `About.tsx`, `resources/*`, `global.css`) не тронуты.

### Human Verification Required

Пункты отсутствуют для фазы 10: визуальная и пиксельная приёмка структурно закреплена за фазой 13 (Playwright-сравнение с оригиналом), а не за фазой 10 — это заложено в архитектуре роадмапа v1.1, а не пробел этой фазы.

### Gaps Summary

Пробелов, блокирующих цель фазы, не найдено. Все три требования (MEDIA-01, MEDIA-02, MEDIA-03) подтверждены кодом и 59 зелёными тестами; `tsc -b` и `eslint` без ошибок; владение файлами не нарушено. Два пункта (пиксельный замер яркости и визуальный smoke на реальных вьюпортах) намеренно вынесены в фазу 13 по замыслу роадмапа и отмечены как deferred, а не как пробелы.

---

*Verified: 2026-09-06T08:17:36Z*
*Verifier: Claude (gsd-verifier)*
