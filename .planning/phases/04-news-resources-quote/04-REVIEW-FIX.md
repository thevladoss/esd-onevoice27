---
phase: 04-news-resources-quote
fixed_at: 2026-09-05T17:04:58Z
review_path: .planning/phases/04-news-resources-quote/04-REVIEW.md
iteration: 1
findings_in_scope: 9
fixed: 9
skipped: 0
status: all_fixed
---

# Фаза 4: отчёт о правках код-ревью

**Дата:** 2026-09-05
**Источник:** `.planning/phases/04-news-resources-quote/04-REVIEW.md`
**Итерация:** 1
**Ветка:** `agent-fix-04` (worktree `esd_cringe-wt/fix-04`, база `4f256cf`)

**Сводка:**

- Находок в скоупе (Critical + Warning): 9
- Исправлено: 9
- Пропущено: 0
- Тестов было 235, стало 248; `npx tsc -b`, `npm test`, `npm run build`, `npm run lint` проходят после каждого коммита.

Critical в ревью нет. Info (13) и Convention (5) в скоуп не входили и остались нетронутыми, кроме
случаев, где они лежали в том же коде: IN-01 (дубль `VideoFacade`/`VideoEmbed`) сознательно оставлен
фазе 5, но `VideoFacade` получил из `VideoEmbed` фокус-эффект и узкий allow-list.

## Исправленные находки

### WR-01: VideoFacade роняет фокус при старте плеера

**Файлы:** `src/components/resources/VideoFacade.tsx`, `src/components/resources/VideoFacade.test.tsx`
**Коммит:** `7e17336`
**Что сделал:** добавил `iframeRef` и эффект `useEffect(() => { if (playing) iframeRef.current?.focus(); }, [playing])`
по образцу `about/VideoEmbed.tsx`. Тест «после старта плеера отдаёт фокус iframe» проверяет
`document.activeElement === iframe`; до правки фокус уходил в `body`.

### WR-02: стрелка пагинации гаснет под фокусом и теряет его

**Файлы:** `src/components/news/NewsPagination.tsx`, `src/components/news/News.test.tsx`
**Коммит:** `69fc977`
**Что сделал:** заменил нативный `disabled` на `aria-disabled={isLast}`, действие гасится в самом
`onClick`, классы переведены с `disabled:*` на `aria-disabled:*` (Tailwind v4 генерирует их, проверил
в собранном CSS). Кнопка остаётся в дереве фокуса.
**Побочная правка тестов:** матчер `toBeDisabled()` не учитывает `aria-disabled`, поэтому три
проверки в `News.test.tsx` переведены на `toHaveAttribute("aria-disabled", …)`. Добавил тест на
удержание фокуса и на то, что погашенная стрелка не листает дальше последней страницы.

### WR-03: allow-list стороннего iframe шире, чем нужно

**Файлы:** `src/components/resources/VideoFacade.tsx`, `src/components/resources/VideoFacade.test.tsx`
**Коммит:** `15a2465`
**Что сделал:** вынес константы `PLAYER_ALLOW = "autoplay; encrypted-media; picture-in-picture"` и
`PLAYER_SANDBOX`, убрал `accelerometer`, `clipboard-write`, `web-share`. Тест сверяет `allow` целиком
и отсутствие снятых прав.
**Отступление от текста ревью:** в `sandbox` кроме предложенных `allow-scripts allow-same-origin
allow-presentation` оставил `allow-popups allow-popups-to-escape-sandbox` — без них ссылка «Смотреть
на YouTube» внутри плеера перестаёт открывать новую вкладку.
**Требует проверки человеком:** песочница проверена только юнит-тестом на атрибуты; воспроизведение в
настоящем браузере под `sandbox` стоит прогнать визуальным smoke в фазе 5.

### WR-04: formatNewsDate роняет рендер всей страницы на некорректной дате

**Файлы:** `src/components/news/NewsCard.tsx`, `src/components/news/News.test.tsx`
**Коммит:** `a9caae5`
**Что сделал:** `formatNewsDate` проверяет `Number.isNaN(date.getTime())` и отдаёт пустую строку,
`NewsCard` рисует `<time>` только при непустой дате. Тесты: три непарсимые строки в `formatNewsDate`
и карточка с датой `2026-13-45`, которая рендерится без `<time>`, но с заголовком и ссылкой.

### WR-05: paginate не проверяет perPage, а NewsPagination на этом падает

**Файлы:** `src/lib/paginate.ts`, `src/lib/paginate.test.ts`
**Коммит:** `9400b59`
**Что сделал:** `const size = Math.max(1, Math.trunc(perPage) || 1)` и дальше по тексту вместо сырого
`perPage`; docblock переписан под новую гарантию. Тесты: `perPage = 0` (9 страниц вместо `Infinity`),
`perPage = -2` (хвост списка на месте), `2.7` и `NaN`.

### WR-06: deep link #resources-materials не достижим из интерфейса

**Файлы:** `src/components/resources/Resources.tsx`, `src/components/resources/Resources.test.tsx`
**Коммит:** `9fbdf3b`
**Что сделал:** добавил слушателя `hashchange`, который открывает панель материалов и скроллит к
секции; скролл вынесен в `scrollToResources(section)` и переиспользуется на монтировании. Комментарий
над `MATERIALS_HASH` больше не утверждает, что хэш приходит из триптиха. Тесты: смена хэша на живой
странице открывает панель, размонтирование снимает слушателя.
**Осталось за скоупом фазы 4:** `src/data/copy.involve.ts` правит параллельный фиксер фазы 3, поэтому
триптих «Скачать материалы →» по-прежнему ведёт на `#resources`. Перевод ссылки на
`#resources-materials` — задача фазы 5. Элемента с `id="resources-materials"` в DOM тоже нет, так что
нативный якорный скролл браузера промахивается и работает только ручной `scrollIntoView`.

### WR-07: id="resources-panel" висит на обёртке, а не на панели с role="region"

**Файлы:** `src/components/resources/Resources.tsx`, `src/components/resources/ResourcePanel.tsx`,
`src/components/resources/ResourceCard.tsx`, `src/components/resources/Resources.test.tsx`
**Коммит:** `d06b2ae`
**Что сделал:** `id="resources-panel"` переехал на `<div role="region">` в `ResourcePanel`, обёртка
анимации держит только `data-open` и класс. Конфликт состояний снят через
`aria-controls={isOpen ? "resources-panel" : undefined}`: закрытые карточки больше не ссылаются на
отсутствующий элемент и не спорят с чужой раскрытой панелью. Тест сверяет id на `region` и
`aria-controls` только у раскрытой карточки; селектор карточек в тестах переведён на
`button[data-kind]`.
**Отступление от спеки:** `04-UI-SPEC.md:230` требует `aria-controls="resources-panel"` на всех трёх
карточках. Панель живёт в DOM только раскрытой, поэтому постоянный `aria-controls` указывал бы на
несуществующий id. Требует подтверждения человеком, если формулировка спеки принципиальна.

### WR-08: кнопка «Вернуться к первой странице» гарантированно ничего не делает

**Файлы:** `src/components/news/News.tsx`, `src/components/news/News.test.tsx`
**Коммит:** `8c31448`
**Что сделал:** пустое состояние показывается при `outOfRange || result.items.length === 0`, где
`outOfRange = page > result.totalPages` сравнивает сырое состояние с зажатым результатом. Кнопка
возврата рисуется только при `page > 1`, то есть когда клик действительно меняет экран. Тест
укорачивает список под ногами (`rerender` с тремя новостями на второй странице) и проверяет, что
кнопка появляется и возвращает на первую страницу; пустой список показывает текст без кнопки.
**Отступление от спеки:** `04-UI-SPEC.md:132` описывает пустое состояние как текст плюс кнопку. На
пустом списке кнопка теперь не рисуется — возвращаться некуда. Требует подтверждения человеком.

### WR-09: videoId подставляется в URL без экранирования

**Файлы:** `src/components/resources/VideoFacade.tsx`, `src/data/news.ts`,
`src/components/resources/VideoFacade.test.tsx`
**Коммит:** `2c0e0d4`
**Что сделал:** `const id = encodeURIComponent(videoId)` в `VideoFacade` для адреса плеера и постера,
те же `encodeURIComponent` в хелперах `cover` и `watch` в `src/data/news.ts`. Тесты: `abc?list=PL&x=1`
уезжает в путь экранированным, обычный id и id с ведущим дефисом остаются как есть.

## Пропущенные находки

Нет.

## Что осталось за скоупом

- Info IN-01 … IN-13 и Convention CV-01 … CV-05 не входили в скоуп `critical+warning`.
- Триптих «Скачать материалы →» (`src/data/copy.involve.ts`) и дедупликация `VideoFacade`/`VideoEmbed`
  отданы фазе 5, файлы соседних фаз не тронуты.

---

_Дата правок: 2026-09-05_
_Фиксер: Claude (gsd-code-fixer)_
_Итерация: 1_
