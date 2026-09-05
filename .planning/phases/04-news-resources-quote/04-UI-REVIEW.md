# Phase 4 — UI Review

**Audited:** 2026-09-05
**Baseline:** `04-UI-SPEC.md` (design contract)
**Screenshots:** предоставлены оркестратором (живой сайт, Playwright): `docs/qa/phase4-live-news.jpeg`, `phase4-live-resources.jpeg`, `phase4-live-resources-materials.jpeg`, `phase4-live-resources-video.jpeg`, `phase4-live-quote.jpeg`. Dev-сервер в этой сессии не поднимался — новых скриншотов не снимал, аудит опирается на присланные снимки и код в основном чекауте.

---

## Pillar Scores

| Pillar | Score | Key Finding |
|--------|-------|-------------|
| 1. Copywriting | 4/4 | Все строки совпадают с Copywriting Contract дословно, generic-паттернов нет |
| 2. Visuals | 3/4 | Иерархия и раскладка держат контракт; `<h3>` внутри `<button>` в ResourceCard — невалидная вложенность |
| 3. Color | 2/4 | `--color-unity-200` не добавлен в `tokens.css` как того требует контракт; hex дублируется в трёх местах; вторичный/третичный текст съехал с `.78`/`.62` на `.80`/`.60` |
| 4. Typography | 4/4 | Ровно четыре роли кеглей и оба веса выдержаны, обе документированные шкала-исключения (кавычка 96px, цитата 700) на месте |
| 5. Spacing | 3/4 | Сетка ресурсов и токены отступов совпадают с Layout Contract вплоть до пикселя; `pb-20` в fallback-обложке новости — недокументированное исключение |
| 6. Experience Design | 3/4 | Пустое/error-состояния, disabled-стрелка, Esc и deep link работают; `aria-controls` указывает на постоянную обёртку, а не на сам `role="region"` |

**Overall: 19/24**

---

## Top 3 Priority Fixes

1. **Токен `--color-unity-200` живёт не там, где велит контракт** — риск рассинхронизации цвета карточки «Музыка»: значение `#8f9dd6` продублировано в `src/components/resources/resources.css:6` (scoped к `.resources`), в `src/data/copy.resources.ts:33` (`accent: "#8f9dd6"`) и как `text-[#8f9dd6]` в `src/components/resources/MusicPlaceholder.tsx:18`. Контракт («Color» → «Новый токен») требует ровно одно добавление в `src/styles/tokens.css` внутри `@theme`. Фикс: перенести объявление в `tokens.css`, заменить `text-[#8f9dd6]` на `text-unity-200`, убрать локальное `--color-unity-200` из `resources.css`.
2. **Прозрачность вторичного/третичного текста разошлась с контрактом** — «Color» задаёт ровно два уровня: вторичный `rgb(248 247 251 / .78)`, третичный `rgb(248 247 251 / .62)`. Секция новостей и `Quote` держат `.62` точно (`NewsCard.tsx:41`, `NewsPagination.tsx`), а вся секция ресурсов — `ResourceCard.tsx:35`, `ResourcePanel.tsx:37`, `MaterialsList.tsx:93`, `News.tsx:33` — использует `/60` и `/80` вместо `/62` и `/78`. Визуально разница на грани заметности, но это расхождение с зафиксированной шкалой и несогласованность между секциями одной фазы. Фикс: заменить `text-paper/60` → `text-paper/62`, `text-paper/80` → `text-paper/78` во всех перечисленных файлах.
3. **`aria-controls="resources-panel"` указывает не на `role="region"`** — id `resources-panel` висит на постоянной обёртке `Resources.tsx` (`<div id="resources-panel" data-open=...>`), а сам раскрывающийся `role="region"` в `ResourcePanel.tsx` id вообще не получает. Скринридер по `aria-controls` не находит региона, на который формально указывает кнопка. Фикс: прокинуть `id="resources-panel"` пропом в `ResourcePanel` и повесить его на корневой `div` с `role="region"`, id обёртки переименовать (например, `resources-panel-wrap`).

---

## Detailed Findings

### Pillar 1: Copywriting (4/4)

Сверка построчно с «Copywriting Contract» UI-SPEC — расхождений не найдено:

- CTA карточек: «Открыть музыку» / «Открыть материалы» / «Открыть видео» — `src/data/copy.resources.ts:36,43,50` совпадают буква в букву.
- Заглушка музыки: заголовок «Песня ещё в работе» и тело «Официальная песня «Единого голоса 27» скоро появится здесь. Следите за новостями дивизиона.» — `copy.resources.ts:60-63` совпадают дословно.
- Error-состояние обложки новости: «Обложка недоступна» + «Заголовок и ссылка на месте — откройте новость» — `src/data/copy.news.ts:12-13` совпадают дословно.
- Error-состояние превью видео: `aria-label` остаётся `Смотреть видео: {title}` — `copy.resources.ts:65`, подтверждено в `VideoFacade.tsx:38`.
- Пагинация: «Пагинация новостей», «Следующая страница», `Страница {n}`, `Страница {page} из {total}` — `copy.news.ts:7-10` совпадают дословно, включая скрытый `role="status"` в `News.tsx`.
- Пустая страница новостей: «На этой странице новостей нет» + «Вернуться к первой странице» — `copy.news.ts:11-12`.
- Grep на «Submit/Click Here/OK/Cancel», «No data/Nothing/Empty», «went wrong/try again» по `src/components/news`, `resources`, `quote` — ноль совпадений, generic-лексики нет.
- Материалы: подписи «DOCX», «Страница ЕАД», «SharePoint, английский» из `data/materials.ts` совпадают с примерами контракта.

Полное совпадение при сохранённом смысле — редкий случай, оценка максимальная.

### Pillar 2: Visuals (3/4)

Сильные стороны: асимметричная раскладка ресурсов (`Resources.tsx:69-113`) повторяет grid-координаты контракта вплоть до `lg:col-start-5 lg:col-end-10` и `max-w-[528px]`/`[320px]`/`[272px]`/`[344px]` — все четыре размера карточек и центрального блока совпадают с таблицей Layout Contract. Скриншоты подтверждают три акцентные точки разных цветов (фиолетовая/тил/розовая) и читаемую иерархию заголовок → описание → триггер. Иконки-only кнопки везде подписаны: стрелка пагинации (`aria-label="Следующая страница"`), кнопка «Свернуть» (`aria-label="Свернуть панель"` держится даже когда текст скрыт на мобильном), play-кнопка видео (`aria-label` на родительской кнопке).

Находки:
- `ResourceCard.tsx:45` — `<h3>` вложен внутрь `<button>`. HTML5 не разрешает поток-контент типа заголовков внутри `button` (ожидается только phrasing content); сама команда это осознала («Deviations from Plan» в `04-04-SUMMARY.md»), но не исправила. Формально невалидная разметка, часть скринридеров и валидаторов её не одобрит.
- Панель закрытия (`resources-panel-wrap`): содержимое `ResourcePanel` размонтируется в том же рендере, где `data-open` переключается на `false` (`Resources.tsx` — `{active ? <ResourcePanel .../> : null}` в одном `useState`). 420ms CSS-переход `grid-template-rows: 1fr → 0fr` в этот момент схлопывает уже пустой контейнер — визуально закрытие может читаться как резкий «схлоп», а не плавное сворачивание контента. Не проверено вживую (`needs_human_review: true`), но логика кода это подтверждает.

### Pillar 3: Color (2/4)

Основной каркас (60/30/10) соблюдён: `midnight-900`/`midnight-950`/градиент цитаты — доминанта, стеклянные поверхности карточек и панели на `unity-700` — вторичный слой, три акцента (`unity-200`, `horizon-400`, `signal-300`) используются ровно там, где предписано (точка-индикатор, рамка hover/focus/open, линия триггера, рамка карточки новости, активная пагинация, eyebrow/cite, кавычка). Градиенты `--gradient-brand` (`104deg, #d28ebe → #3b4da1 → #7bc2c7`) и `--gradient-action` (`125deg, #6c2c68 → #3b4da1 → #39727e`) совпадают с контрактом до последнего hex.

Находки, которые не позволяют поставить 3-4:

- **Токен вне контракта.** `--color-unity-200: #8f9dd6` должен жить в `src/styles/tokens.css` `@theme` («единственное дополнение к токенам» фазы). Вместо этого: локальный scoped var в `src/components/resources/resources.css:6` (сам комментарий в файле признаёт: «фаза 5 поднимет токен в tokens.css»), сырой hex в `src/data/copy.resources.ts:33`, сырой hex `text-[#8f9dd6]` в `src/components/resources/MusicPlaceholder.tsx:18`. Три источника истины для одного цвета — при следующей правке легко разойдутся.
- **Дублирование существующих токенов сырым hex.** `#7bc2c7` (уже `--color-horizon-400`) и `#d28ebe` (уже `--color-signal-300`) прописаны заново как строки в `copy.resources.ts:40,47`, а не как ссылки на существующие CSS-переменные — при ребрендинге токенов эти значения не сдвинутся вместе с остальными.
- **Дрейф прозрачности текста.** Контракт фиксирует ровно два уровня — вторичный `.78`, третичный `.62`. Секция новостей и цитаты держат `.62` точно (`NewsCard.tsx:41`, `NewsPagination.tsx:53,69`). Секция ресурсов и часть новостей — `News.tsx:33,38`, `ResourceCard.tsx:35,48`, `ResourcePanel.tsx:37,46,53`, `MaterialsList.tsx:93,97`, `MusicPlaceholder.tsx:27`, `VideoGrid.tsx:12` — используют `/60` и `/80` вместо `/62` и `/78`. Расхождение на 2 процентных пункта не ломает контраст (обе группы выше 4.5:1), но нарушает единую шкалу и рассинхронизирует секции одной фазы.

### Pillar 4: Typography (4/4)

Grep по `text-(xs|sm|base|lg|xl|...)` в `news`/`resources`/`quote` даёт ровно три явных класса — `text-xs` (12px, Label), `text-base` (16px, Body), `text-[22px]` (22px, Heading) — плюс задокументированное исключение `text-[96px]` для декоративной кавычки цитаты (контракт прямо разрешает 96px для этого элемента). Веса — только `font-bold` (700) и `font-extrabold` (800), Body нигде не переопределяет вес (наследует normal/400, как того требует роль). Единственная сознательная аномалия веса — блоккотировка цитаты держит `font-bold` (700 Onest) вместо `font-extrabold`, это и есть задокументированное в контракте исключение («Цитата: … вес 700 Onest — единственное место, где Onest идёт не в 800»), реализовано верно (`Quote.tsx:25`).

Letter-spacing и line-height по ролям совпадают построчно: Label `tracking-[0.08em] leading-[1.4]`, Heading `leading-[1.15] tracking-[-0.03em]`, Body `leading-[1.5]`, цитата `leading-[1.35]`. Единственное расхождение letter-spacing — `Eyebrow` примитива фазы 1 на `0.1em` вместо `0.08em` — контракт сам называет это унаследованным исключением, не нарушением фазы 4.

Нарушений не найдено — полный балл оправдан.

### Pillar 5: Spacing (3/4)

Сверка с Layout Contract показывает точное соответствие вплоть до пикселя там, где это проверяемо:

- Скос секции новостей: `-mt-6`/`[clip-path:...0_24px...]` на мобильном и `md:-mt-12`/`md:[clip-path:...0_48px...]` на десктопе — это ровно −24px/−48px и 24px/48px скоса из контракта.
- Сдвиг карточки «Видео»: `md:-mt-4` (−16px) и `lg:-mt-8` (−32px) — точное совпадение с таблицей планшета/десктопа Layout Contract.
- Зоны касания: `min-h-11 min-w-11` (44px) на кнопках пагинации и «Свернуть», `h-14 w-14` (56px) на play-кнопке видео — обе задокументированные шкала-исключения выдержаны буквально.
- `gap-6`/`gap-8` (24/32px), `mt-12` (48px) до пагинации, `p-6`/`md:p-8` (24/32px) на карточках и панели — совпадают с токенами `lg`/`xl`/`2xl`.

Находка: `src/components/news/NewsCard.tsx:39` — `pb-20` (80px) на fallback-плашке упавшей обложки. Это значение не значится ни в шкале, ни в таблице «Exceptions» контракта (там только 44px, 12px, 56px, 1–1.5px). Решение обосновано в `04-01-SUMMARY.md` («чтобы не оказаться под скримом»), но контракт не расширен новым исключением — по букве документа это недокументированное отклонение, пусть и визуально безобидное.

### Pillar 6: Experience Design (3/4)

Полное покрытие состояний, которое требовал контракт: пустая страница новостей отдаёт текст и кнопку возврата (`News.tsx:37-44`); упавшая обложка новости и упавшее превью видео деградируют в градиентную плашку с сохранением кликабельности (`NewsCard.tsx` `coverFailed`, `VideoFacade.tsx` `coverFailed`); стрелка пагинации гасится `disabled`+`opacity-[.38]` на последней странице; закрытие панели работает тремя путями — повторный клик, кнопка «Свернуть», Esc — и возвращает фокус на карточку-триггер (`Resources.tsx: close()`); deep link `#resources-materials` открывает панель материалов и скроллит с уважением к `prefers-reduced-motion`; `@keyframes resources-particles` и переход панели гасятся в `@media (prefers-reduced-motion: reduce)` (`resources.css`, финальный блок). Функциональный QA оркестратора (`docs/qa/SMOKE-phase3-4.md`, `04-HUMAN-UAT.md`) подтверждает всё это вживую — 0 ошибок консоли, 0 запросов ≥400.

Находки, которые удерживают от 4/4:

- `aria-controls="resources-panel"` (три карточки, `ResourceCard.tsx`) указывает на `<div id="resources-panel">` в `Resources.tsx`, который лишь обёртка для CSS grid-анимации. Сам `role="region"` в `ResourcePanel.tsx` не получает `id` вообще — формальная ARIA-связь «кнопка раскрывает регион» не резолвится на регион, только на его контейнер.
- Полный набор тестов в основном чекауте зелёный (`npm test` → 235/235, файл-заглушка `placeholders.test.tsx` уже удалён оркестратором) — интеграционных блокеров на момент аудита нет, но это заслуга мерджа, а не самих планов фазы 4 (каждый план сдавался с 3 красными тестами чужих файлов).

---

## Files Audited

- `src/components/news/News.tsx`, `NewsCard.tsx`, `NewsPagination.tsx`
- `src/components/resources/Resources.tsx`, `ResourceCard.tsx`, `ResourcePanel.tsx`, `MaterialsList.tsx`, `MusicPlaceholder.tsx`, `VideoFacade.tsx`, `VideoGrid.tsx`, `resources.css`
- `src/components/quote/Quote.tsx`, `WorldSilhouette.tsx`
- `src/data/copy.news.ts`, `copy.resources.ts`, `copy.quote.ts`, `news.ts`, `materials.ts`, `videos.ts`
- `src/styles/tokens.css`, `src/styles/global.css` (для сверки токенов `--gradient-brand`, `--gradient-action`, `--color-*`)
- `src/components/layout/GradientTitle.tsx`, `Eyebrow.tsx` (переиспользуемые примитивы фазы 1)
- `.planning/phases/04-news-resources-quote/04-UI-SPEC.md`, `04-CONTEXT.md`, `04-01…04-04-PLAN.md`, `04-01…04-04-SUMMARY.md`, `04-HUMAN-UAT.md`
- `docs/qa/SMOKE-phase3-4.md` и скриншоты `phase4-live-news.jpeg`, `phase4-live-resources.jpeg`, `phase4-live-resources-materials.jpeg`, `phase4-live-resources-video.jpeg`, `phase4-live-quote.jpeg`
- Прогон `npm test` в основном чекауте (235/235 passed) — для проверки, что интеграционные блокеры, о которых предупреждали summary фазы 4, уже сняты оркестратором.
