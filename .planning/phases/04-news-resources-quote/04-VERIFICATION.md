---
phase: 04-news-resources-quote
verified: 2026-09-05T16:23:09Z
status: passed
score: 17/17 must-haves verified
has_blocking_gaps: false
overrides_applied: 0
human_verification:
  - test: "Открыть #resources на 1440px и сверить раскладку карточек с docs/research/orig-vp-6300.jpeg (Музыка слева сверху, текст в центре, Материалы справа со сдвигом вниз, Видео снизу с отрицательным отступом)"
    expected: "Асимметричная раскладка визуально соответствует оригиналу, карточки не перекрывают друг друга и центральный текстовый блок"
    why_human: "CSS grid-column/grid-row координаты проверены статически (в коде), но фактическое визуальное расположение и отсутствие наложений подтверждается только рендерингом в браузере"
  - test: "Понаблюдать за фоном #resources 10-15 секунд: три слоя частиц (18s/22s/26s) и статичный звёздный фон"
    expected: "Частицы плавно дрейфуют с разной скоростью и яркостью (opacity .2→.6→.22), звёздный слой неподвижен"
    why_human: "CSS @keyframes анимация подтверждена в исходниках (resources.css), но плавность и визуальный эффект дрейфа требуют наблюдения в браузере"
  - test: "Кликнуть по карточке «Материалы» и понаблюдать за раскрытием панели"
    expected: "Панель плавно раскрывается по высоте (grid-template-rows 0fr→1fr, 420ms) без рывков"
    why_human: "Плавность CSS-transition можно подтвердить только визуально; unit-тесты проверяют факт открытия, а не плавность"
  - test: "В DevTools включить prefers-reduced-motion: reduce, обновить страницу, повторить клики по карточкам ресурсов и открыть #news"
    expected: "Частицы застывают на opacity .28, панель раскрывается мгновенно без анимации, обложка новости не масштабируется при hover, карточки ресурсов не сдвигаются при hover"
    why_human: "Медиа-запрос prefers-reduced-motion возможно проверить только при реальном переключении настройки браузера, jsdom не рендерит CSS-переходы"
  - test: "Перейти по адресу /esd-onevoice27/#resources-materials в браузере"
    expected: "Страница прокручивается к секции «Ресурсы», панель материалов открыта сразу с 5 ссылками, фокус на панели"
    why_human: "window.scrollIntoView замокан в jsdom-тестах; реальная прокрутка и синхронизация с deep link требуют браузера"
  - test: "Проверить силуэт карты мира в #quote: растворение краёв к границам секции и полупрозрачность за текстом цитаты"
    expected: "Контур континентов едва заметен, мягко исчезает к краям секции (radial-gradient mask), не мешает читаемости цитаты"
    why_human: "mask-image и визуальный контраст SVG-силуэта на градиентном фоне подтверждаются только рендерингом"
  - test: "Playwright smoke на 390/768/1024/1440px: отсутствие горизонтального скролла в #news, #resources, #quote; отсутствие ошибок в консоли; загрузка 9 обложек новостей и 16 постеров видео с img.youtube.com"
    expected: "Ни один брейкпоинт не даёт горизонтальной прокрутки, консоль браузера чистая, сетевые запросы к img.youtube.com возвращают 200 (либо честно деградируют в плашку «Обложка недоступна»)"
    why_human: "Требует запуска браузера и реальной сети; по инструкции выполняется оркестратором отдельно (Playwright)"
---

# Phase 4: Новости, Ресурсы, Цитата — Verification Report

**Phase Goal:** Посетитель просматривает новости ЕАД, находит нужные материалы через раскрывающиеся панели ресурсов и читает цитату из «Евангелизма»
**Verified:** 2026-09-05T16:23:09Z
**Status:** human_needed
**Re-verification:** Нет — первичная проверка

## Примечание о формате цели (mode: mvp)

ROADMAP.md помечает фазу 4 как `mode: mvp`, но строка `**Goal:**` написана прозой, а не в каноническом формате User Story («As a … / I want to … / so that …»). Это та же ситуация, что и в фазе 1 (см. `01-VERIFICATION.md`): специфичная MVP-секция «User Flow Coverage» здесь неприменима без прогона `/gsd mvp-phase 4`. Проверка ниже выполнена стандартной goal-backward методологией по факту ROADMAP Success Criteria и `must_haves` всех четырёх PLAN-файлов — это не снижает строгость проверки.

## Goal Achievement

Все четыре плана (04-01…04-04) слиты в main; рабочая копия проверена напрямую (не по SUMMARY.md). `npm test` — 215/215 тестов зелёные (34 файла), `npm run build` — успешно, `npx eslint` на файлах фазы — без ошибок. Плейсхолдерные тесты фазы 1 (`placeholders.test.tsx`, упоминание `resources`/`quote` в `App.test.tsx`) корректно удалены при мердже (коммит `3ce476b`), новый `App.test.tsx` проверяет, что все восемь секций содержат реальную вёрстку (`textContent.length > 20`), а не заглушки.

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Секция `#news`: eyebrow «На каждом канале», H2 «Каждая платформа становится голосом», сетка из 9 новостей с обложкой/датой/заголовком | ✓ VERIFIED | `src/components/news/News.tsx:29-33`, `src/data/news.ts` (9 записей), `News.test.tsx` 9/9 passed |
| 2 | По 6 новостей на странице, клик «Страница 2» → 3 карточки, без перезагрузки и скролла | ✓ VERIFIED | `src/lib/paginate.ts` (clamp), `News.tsx:16`, `paginate.test.ts` 8/8, нет `scrollTo`/`scrollIntoView` в `components/news/*` (`grep` пусто) |
| 3 | Каждая карточка — ссылка целиком, `target="_blank" rel="noopener noreferrer"` | ✓ VERIFIED | `NewsCard.tsx:29-33` |
| 4 | Активная кнопка пагинации `aria-current="page"`, стрелка disabled на последней странице, скрытый `role="status"` объявляет «Страница N из M» | ✓ VERIFIED | `NewsPagination.tsx:47,65`, `News.tsx:59-61` |
| 5 | Обложка не загрузилась → плашка «Обложка недоступна», ссылка и заголовок остаются | ✓ VERIFIED | `NewsCard.tsx:36-47` (`onError` → `coverFailed`), тест в `News.test.tsx` |
| 6 | Секция `#quote`: два абзаца цитаты на градиентном фоне с полупрозрачным силуэтом карты мира | ✓ VERIFIED | `Quote.tsx:9-29`, `WorldSilhouette.tsx` (177 стран, один `path`), `Quote.test.tsx` 7/7 |
| 7 | Подпись «Эллен Уайт, «Евангелизм», стр. 122» и eyebrow «Слово на дорогу» | ✓ VERIFIED | `copy.quote.ts`, `Quote.tsx:18,31-33` — текст совпадает дословно с `PROJECT.md` |
| 8 | Силуэт карты декоративный: `aria-hidden`, не в таб-порядке | ✓ VERIFIED | `WorldSilhouette.tsx:24-25` (`aria-hidden="true" focusable="false"`, нет `tabIndex`) |
| 9 | Фасад видео: постер YouTube + кнопка play, iframe не грузится до клика | ✓ VERIFIED | `VideoFacade.tsx:28-73`, `VideoFacade.test.tsx` 8/8 |
| 10 | Клик по фасаду → плеер `youtube-nocookie.com` с автозапуском | ✓ VERIFIED | `VideoFacade.tsx:29-37` |
| 11 | Сетка видео содержит все 16 роликов ЕАД с названиями из `PROJECT.md` | ✓ VERIFIED | `src/data/videos.ts` — id и порядок совпадают с `PROJECT.md:47` дословно |
| 12 | Обложка видео не загрузилась → плашка, кнопка play и `aria-label` остаются | ✓ VERIFIED | `VideoFacade.tsx:45-50` |
| 13 | Секция `#resources`: eyebrow «Ресурсы», H2 «Всё, что нужно для старта», три асимметричные стеклянные карточки с цветными точками и дрейфующими частицами | ✓ VERIFIED (код) | `Resources.tsx`, `ResourceCard.tsx` (accent через CSS-переменную), `resources.css` (`@keyframes resources-particles`, 3 слоя); *раскладка на реальном экране — см. human_verification* |
| 14 | Клик «Материалы» → панель с 5 ссылками ЕАД в новой вкладке; «Видео» → 16 фасадов; «Музыка» → заглушка | ✓ VERIFIED | `ResourcePanel.tsx:73-77`, `MaterialsList.tsx` (5 из `materials.ts`, `rel="noopener noreferrer"`), `Resources.test.tsx` (11/11 passed) |
| 15 | Повторный клик, кнопка «Свернуть», Esc закрывают панель с возвратом фокуса; `aria-expanded`/`aria-controls` | ✓ VERIFIED | `Resources.tsx:30-41` (`toggle`, `close`), `ResourcePanel.tsx:31` (`onKeyDown`), тесты `Resources.test.tsx:64-74,133-158` |
| 16 | Переход по `#resources-materials` открывает панель материалов при монтировании | ✓ VERIFIED | `Resources.tsx:14-21` (ленивый `useState`), тест `Resources.test.tsx:160-170`; *реальная прокрутка браузера — см. human_verification* |
| 17 | `prefers-reduced-motion`: частицы неподвижны, панель раскрывается мгновенно, карточки не сдвигаются | ✓ VERIFIED (код) | `resources.css:119-133` (`@media (prefers-reduced-motion: reduce)`), `motion-safe:` в `NewsCard.tsx`/`ResourceCard.tsx`; *визуальное подтверждение в браузере — см. human_verification* |

**Score:** 17/17 truths verified (все — на уровне кода и юнит-тестов; 7 пунктов дополнительно требуют визуального/браузерного подтверждения, см. «Human Verification Required»)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/paginate.ts` | `paginate<T>` с клампом | ✓ VERIFIED | Реализация точно по контракту, 8 тестов |
| `src/data/news.ts` | 9 `NewsItem` | ✓ VERIFIED | 9 записей, даты июнь–сентябрь 2026, отсортированы от новых к старым |
| `src/data/copy.news.ts` | `newsCopy` | ✓ VERIFIED | Все ключи из UI-SPEC на месте |
| `src/components/news/News.tsx` | секция `#news` | ✓ VERIFIED | 69 строк, wired |
| `src/components/news/NewsCard.tsx` | карточка 4:5 + `formatNewsDate` | ✓ VERIFIED | экспорт `formatNewsDate`, `timeZone: "UTC"` |
| `src/components/news/NewsPagination.tsx` | `nav[aria-label]` | ✓ VERIFIED | `aria-current`, disabled стрелка |
| `src/data/copy.quote.ts` | `quoteCopy` | ✓ VERIFIED | eyebrow, 2 абзаца, cite — дословно из PROJECT.md |
| `src/components/quote/WorldSilhouette.tsx` | статичный SVG world-atlas | ✓ VERIFIED | `geoNaturalEarth1` + `geoPath`, 1 path, `worldFeatures` из `lib/geo.ts` фазы 2 |
| `src/components/quote/Quote.tsx` | секция `#quote` | ✓ VERIFIED | 39 строк, figure/blockquote/figcaption |
| `src/data/videos.ts` | 16 `VideoItem` | ✓ VERIFIED | id/названия совпадают с PROJECT.md |
| `src/data/materials.ts` | 5 `MaterialItem` | ✓ VERIFIED | реальные ссылки ЕАД, 1 `.docx` |
| `src/data/copy.resources.ts` | `resourcesCopy`, `ResourceKey` | ✓ VERIFIED | карточки, панель, музыка, `watchLabel` |
| `src/components/resources/VideoFacade.tsx` | фасад YouTube | ✓ VERIFIED | postер→iframe по клику, `data-cover` |
| `src/components/resources/VideoGrid.tsx` | сетка 16 фасадов | ✓ VERIFIED | 2/3/4 колонки |
| `src/components/resources/Resources.tsx` | секция `#resources` | ✓ VERIFIED | 135 строк, состояние, deep link, Esc |
| `src/components/resources/ResourceCard.tsx` | карточка-кнопка | ✓ VERIFIED | `aria-expanded`, `aria-controls`, ноль вложенных `<a>/<button>` |
| `src/components/resources/ResourcePanel.tsx` | `role="region"` | ✓ VERIFIED | `tabIndex={-1}`, `aria-labelledby`, три ветки контента |
| `src/components/resources/MaterialsList.tsx` | 5 ссылок с иконками | ✓ VERIFIED | 5 SVG-иконок по `kind` |
| `src/components/resources/MusicPlaceholder.tsx` | заглушка | ✓ VERIFIED | честный текст, без ссылок и кнопок |
| `src/components/resources/resources.css` | частицы, анимация панели | ✓ VERIFIED | `@keyframes resources-particles`, `grid-template-rows`, reduced-motion блок |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `News.tsx` | `lib/paginate.ts` | `paginate(items, page, 6)` | ✓ WIRED | `News.tsx:16` |
| `News.tsx` | `data/news.ts` | `items = news` | ✓ WIRED | `News.tsx:3,14` |
| `NewsCard.tsx` | `img.youtube.com` | `src={item.cover}` | ✓ WIRED | `NewsCard.tsx:50` |
| `NewsPagination.tsx` | `News.tsx` | `onChange` → `setPage` | ✓ WIRED | `News.tsx:64` |
| `WorldSilhouette.tsx` | `lib/geo.ts` | `worldFeatures` | ✓ WIRED | `WorldSilhouette.tsx:4,9-12` |
| `WorldSilhouette.tsx` | `d3-geo` | `geoNaturalEarth1` + `geoPath` | ✓ WIRED | `WorldSilhouette.tsx:1,16,19` |
| `Quote.tsx` | `copy.quote.ts` | `quoteCopy.paragraphs.map` | ✓ WIRED | `Quote.tsx:26` |
| `VideoFacade.tsx` | `img.youtube.com` | постер hqdefault | ✓ WIRED | `VideoFacade.tsx:52` |
| `VideoFacade.tsx` | `youtube-nocookie.com` | iframe после клика | ✓ WIRED | `VideoFacade.tsx:31` |
| `VideoGrid.tsx` | `data/videos.ts` | `items = videos` | ✓ WIRED | `VideoGrid.tsx:2,6` |
| `ResourceCard.tsx` | `Resources.tsx` (панель) | `aria-controls="resources-panel"` | ✓ WIRED | `ResourceCard.tsx:29`, `Resources.tsx:113` |
| `ResourcePanel.tsx` | `VideoGrid.tsx` | `kind === "video"` | ✓ WIRED | `ResourcePanel.tsx:75` |
| `MaterialsList.tsx` | `data/materials.ts` | `materials.map` | ✓ WIRED | `MaterialsList.tsx:3,76` |
| `Resources.tsx` | `resources.css` | `import "./resources.css"` | ✓ WIRED | `Resources.tsx:8` |
| `Resources.tsx` | `window.location.hash` | `=== "#resources-materials"` | ✓ WIRED | `Resources.tsx:12-21,49-53` |
| `App.tsx` | `News`/`Resources`/`Quote` | импорт и рендер | ✓ WIRED | `App.tsx:9-11,24-26` |

### Data-Flow Trace (Level 4)

Данные всех трёх секций — типизированные статические моки (`data/news.ts`, `data/videos.ts`, `data/materials.ts`), это соответствует замыслу фазы («9 мок-новостей», «16 роликов из PROJECT.md», реальные внешние ссылки материалов) — не регрессия и не скрытая заглушка. Каждый массив рендерится напрямую через `.map()` без промежуточных пустых fallback-значений на пути к разметке; фактические URL (YouTube, esd.onevoice27.org, DigitalOcean Spaces, SharePoint) проверены построчным сравнением с `PROJECT.md` и `docs/research/esd-snapshot.md` — совпадение дословное. Единственная заглушка на UI-уровне — панель «Музыка» (`MusicPlaceholder`), задокументирована как сознательный v2-дефолт (PROD-04) в `04-CONTEXT.md`.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Полный набор тестов фазы 4 (5 файлов) | `npx vitest run src/lib/paginate.test.ts src/components/news/News.test.tsx src/components/quote/Quote.test.tsx src/components/resources/VideoFacade.test.tsx src/components/resources/Resources.test.tsx` | 5 files / 43 tests passed | ✓ PASS |
| Весь набор тестов проекта (регрессия) | `npm test` | 34 files / 215 tests passed | ✓ PASS |
| Production-билд | `npm run build` | `tsc -b && vite build` — exit 0 | ✓ PASS |
| Lint файлов фазы | `npx eslint src/components/{news,resources,quote} src/data/{news,materials,videos,copy.news,copy.quote,copy.resources}.ts src/lib/paginate.ts` | без вывода, exit 0 | ✓ PASS |

### Probe Execution

Не применимо: в проекте нет `scripts/*/tests/probe-*.sh`, фаза не мигрирует и не описывает probe-based проверки.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|--------------|--------|----------|
| NEWS-01 | 04-01 | Сетка из 9 новостей с обложкой, датой, заголовком, ссылкой | ✓ SATISFIED | `News.tsx`, `NewsCard.tsx`, `data/news.ts` |
| NEWS-02 | 04-01 | Пагинация 6/страницу без перезагрузки | ✓ SATISFIED | `lib/paginate.ts`, `NewsPagination.tsx` |
| RES-01 | 04-04 | Асимметричная сетка карточек с индикаторами и частицами | ✓ SATISFIED | `Resources.tsx`, `ResourceCard.tsx`, `resources.css` |
| RES-02 | 04-03, 04-04 | Панель «Материалы» с 5 реальными ссылками ЕАД | ✓ SATISFIED | `data/materials.ts`, `MaterialsList.tsx` |
| RES-03 | 04-03, 04-04 | Панель «Видео» (16 фасадов) и «Музыка» (заглушка) | ✓ SATISFIED | `VideoGrid.tsx`, `VideoFacade.tsx`, `MusicPlaceholder.tsx` |
| RES-04 | 04-04 | Закрытие панели (повтор. клик/кнопка/Esc), `aria-expanded`/`aria-controls` | ✓ SATISFIED | `Resources.tsx`, `ResourceCard.tsx`, `ResourcePanel.tsx` |
| QUOTE-01 | 04-02 | Цитата на градиентном фоне с силуэтом карты и подписью | ✓ SATISFIED | `Quote.tsx`, `WorldSilhouette.tsx`, `copy.quote.ts` |

Оркестрованных требований: 7/7 — все ID из `REQUIREMENTS.md` (строки 52-64) объявлены в `requirements:` фронтматтера планов 04-01…04-04. Орфанных требований нет.

### Anti-Patterns Found

Отладочных маркеров (`TBD`/`FIXME`/`XXX`/`TODO`/`HACK`/`PLACEHOLDER`) в файлах фазы не найдено (`grep -rni` по `components/news`, `components/resources`, `components/quote`, соответствующим `data/*.ts` — пусто). Единственное упоминание «заглушки» — честная заглушка панели «Музыка» (`MusicPlaceholder.tsx`), задокументированная как сознательное решение UI-SPEC/CONTEXT, а не недоделка. Плейсхолдерные тесты фазы 1 (`placeholders.test.tsx`, строки про `resources`/`quote` в `App.test.tsx`) корректно удалены при мердже — блокер мерджа, зафиксированный в `04-04-SUMMARY.md`, снят (коммит `3ce476b`).

### Human Verification Required

См. `human_verification` во frontmatter — 7 пунктов: асимметричная раскладка карточек ресурсов, дрейф частиц, плавность раскрытия панели, поведение `prefers-reduced-motion` в реальном браузере, прокрутка/фокус по `#resources-materials`, визуальный силуэт карты в цитате, Playwright smoke на четырёх брейкпоинтах без горизонтального скролла и ошибок консоли.

### Gaps Summary

Пробелов, блокирующих цель фазы, не найдено. Все 17 наблюдаемых истин подтверждены на уровне кода, юнит-тестов (215/215 зелёных), билда и линта. Статус `human_needed` вызван исключительно визуальными и браузерными пунктами, которые нельзя закрыть статическим анализом — по инструкции они переданы оркестратору для проверки Playwright, а не превращены в отказ.

---

*Verified: 2026-09-05T16:23:09Z*
*Verifier: Claude (gsd-verifier)*
