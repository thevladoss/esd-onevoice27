---
phase: 04-news-resources-quote
plan: 01
subsystem: ui
tags: [news, pagination, react, typescript, vitest, testing-library, accessibility, tailwindcss-v4]

requires:
  - phase: 01-01
    provides: "токены @theme, утилита glass, App.tsx с восемью секциями, setup.ts с jsdom-моками"
  - phase: 01-02
    provides: "примитивы Eyebrow, GradientTitle, Button и классы .btn из primitives.css"
provides:
  - "Чистая функция paginate<T> в src/lib/paginate.ts с клампом страницы и perPage по умолчанию 6"
  - "Данные src/data/news.ts: девять новостей ЕАД с обложками img.youtube.com и внешними ссылками"
  - "Строки секции в src/data/copy.news.ts (newsCopy) отдельно от copy.ts фазы 1"
  - "Секция #news: скошенный верх, шапка, сетка 1/2/3 колонки, пагинация на useState"
  - "NewsCard с fallback обложки по onError и NewsPagination с aria-current и стрелкой"
  - "17 тестов: paginate.test.ts (8) и News.test.tsx (9)"
affects: [04-02, 04-03, 05-motion-and-polish]

tech-stack:
  added: []
  patterns:
    - "Копирайт секции живёт в отдельном модуле data/copy.{section}.ts, пока фазы идут параллельно по copy.ts"
    - "Пагинация: чистая функция в lib/ считает срез и границы, компонент держит только номер страницы в useState"
    - "Секция со своим фоном рендерит собственный <section>, а не примитив Section: clip-path и градиенты нужны во всю ширину"
    - "Сетевой ресурс (обложка) деградирует через onError в локальную плашку, ссылка и заголовок не зависят от картинки"

key-files:
  created:
    - src/lib/paginate.ts
    - src/lib/paginate.test.ts
    - src/data/news.ts
    - src/data/copy.news.ts
    - src/components/news/NewsCard.tsx
    - src/components/news/NewsPagination.tsx
    - src/components/news/News.test.tsx
  modified:
    - src/components/news/News.tsx

key-decisions:
  - "Пропс items у News объявлен с дефолтом всего объекта props (= {}), иначе сигнатура (props) => Element не присваивается типу () => ReactElement из placeholders.test.tsx и падает tsc -b"
  - "formatNewsDate остался в NewsCard.tsx под точечным eslint-disable react-refresh/only-export-components: вынос в отдельный модуль с ре-экспортом правило не снимает, а контракт теста и плана требует импорт из ./NewsCard"
  - "Intl.DateTimeFormat создаётся один раз на модуль с timeZone: \"UTC\": дата без времени разбирается как UTC-полночь и в западных зонах уехала бы на сутки назад"
  - "Плашка упавшей обложки центрирована с нижним отступом pb-20, чтобы не оказаться под скримом и блоком «дата + заголовок»"
  - "Тесты паузы скролла сравнивают моки window.scrollTo и Element.prototype.scrollIntoView из setup.ts, очищая их в beforeEach"

patterns-established:
  - "Кнопка пагинации: min-h-11 min-w-11, aria-label «Страница N», активная несёт aria-current=\"page\" и градиент --gradient-action"
  - "Скрытый <p role=\"status\" class=\"sr-only\"> под сеткой объявляет «Страница N из M» без перевода фокуса"
  - "Карточка-ссылка: <article> оборачивает единственную <a target=\"_blank\" rel=\"noopener noreferrer\">, покрывающую всю площадь"

requirements-completed: [NEWS-01, NEWS-02]

duration: 15min
completed: 2026-09-05
---

# Phase 4 Plan 01: Новости Summary

**Секция #news с девятью новостями ЕАД, обложками YouTube-превью, клиентской пагинацией по 6 на страницу через чистую функцию `paginate` и деградацией карточки при 404 обложки.**

## Performance

- **Duration:** ~15 мин
- **Started:** 2026-09-05T15:53:00Z
- **Completed:** 2026-09-05T16:06:00Z
- **Tasks:** 3
- **Files modified:** 8 (7 создано, 1 изменён)

## Accomplishments

- `paginate<T>(items, page, perPage = 6)` считает срез и `totalPages`, зажимает страницу в диапазон и переживает пустой список; восемь unit-тестов без DOM.
- Секция `#news` заменила заглушку фазы 1: скошенный верх, шапка слева, сетка 1/2/3 колонки, шесть карточек на первой странице и три на второй.
- Пагинация переключает страницу без роутинга и без скролла, фокус остаётся на нажатой кнопке, `aria-current` переезжает, стрелка гаснет на последней странице, скрытый `role="status"` объявляет «Страница 2 из 2».
- Карточка переживает недоступность `img.youtube.com`: `onError` подменяет картинку градиентной плашкой, ссылка и заголовок остаются на месте.
- Пустой список объясняет себя и возвращает кнопкой на первую страницу.

## Task Commits

1. **Task 1: Падающие тесты пагинации и happy path секции (RED)** — `1ebff91` (test)
2. **Task 2: Данные, paginate и секция с пагинацией (GREEN)** — `11be064` (feat)
3. **Task 3: Состояния ошибки и пустой страницы, доступность** — `4d6402e` (feat)

## Files Created/Modified

- `src/lib/paginate.ts` — чистая пагинация с клампом страницы, `PaginationResult<T>`
- `src/lib/paginate.test.ts` — 8 тестов контракта: две страницы из девяти элементов, кламп, пустой список, `perPage` по умолчанию
- `src/data/news.ts` — тип `NewsItem` и девять новостей от 5 сентября к 26 июня 2026, обложки `img.youtube.com/vi/{id}/hqdefault.jpg`
- `src/data/copy.news.ts` — `newsCopy`: шапка, подписи пагинации, пустое состояние, текст плашки обложки
- `src/components/news/News.tsx` — секция `#news`, `useState` страницы, сетка, пустое состояние, `role="status"`
- `src/components/news/NewsCard.tsx` — `formatNewsDate` и карточка 4:5 со скримом, датой, заголовком и fallback обложки
- `src/components/news/NewsPagination.tsx` — `nav[aria-label]`, кнопки страниц 44×44, chevron-стрелка
- `src/components/news/News.test.tsx` — 9 тестов: шапка, шесть карточек, внешние ссылки, переключение страниц, атрибуты обложки, падение обложки, пустой список

## Decisions Made

См. `key-decisions` во frontmatter. Коротко: дефолт пропсов у `News` спасает типизацию чужого теста, `formatNewsDate` остаётся в `NewsCard.tsx` ради контракта импорта, форматтер даты фиксирован на UTC.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Правило `react-refresh/only-export-components` на экспорте `formatNewsDate`**
- **Found during:** Task 2 (реализация NewsCard)
- **Issue:** `npx eslint` падал: файл компонента экспортирует ещё и функцию. План и тест требуют импорт `formatNewsDate` именно из `./NewsCard`.
- **Fix:** Сначала вынес форматтер в отдельный модуль и ре-экспортировал, но правило продолжало срабатывать и на ре-экспорте. Вернул функцию в `NewsCard.tsx` и поставил точечный `eslint-disable` с объяснением цены (fast refresh этого файла).
- **Files modified:** `src/components/news/NewsCard.tsx`
- **Verification:** `npx eslint src/components/news src/lib/paginate.ts src/data/news.ts src/data/copy.news.ts` — чисто
- **Committed in:** `11be064`

**2. [Rule 2 - Missing Critical] Дефолт пропсов у `News`, чтобы не сломать `tsc -b`**
- **Found during:** Task 2 (добавление пропса `items`)
- **Issue:** `placeholders.test.tsx` (чужой файл, править нельзя) типизирует секции как `() => ReactElement`. Сигнатура с обязательным параметром-объектом такому типу не присваивается, и `npm run build` падал бы на `tsc -b`.
- **Fix:** `export function News({ items = news }: { items?: NewsItem[] } = {})` — параметр стал необязательным.
- **Files modified:** `src/components/news/News.tsx`
- **Verification:** `npm run build` — код 0
- **Committed in:** `11be064`

**3. [Rule 2 - Missing Critical] Класс `motion-safe:group-hover:scale` поставлен сразу в Task 2**
- **Found during:** Task 2
- **Issue:** План отдавал reduced motion в Task 3, промежуточный вариант `group-hover:scale + motion-reduce:transform-none` жил бы один коммит и был бы переписан.
- **Fix:** Записал финальный `motion-safe:group-hover:scale-[1.04]` сразу.
- **Files modified:** `src/components/news/NewsCard.tsx`
- **Verification:** `grep -n "motion-safe:group-hover:scale" src/components/news/NewsCard.tsx` находит строку
- **Committed in:** `11be064`

### Не исправлено намеренно (чужие файлы)

**Три теста фазы 1 падают, потому что `News` перестал быть заглушкой.**

| Тест | Причина |
|------|---------|
| `src/App.test.tsx > показывает стеклянные карточки во всех секциях` | требует `.glass-card` внутри каждой секции, включая `#news`; сетка новостей стекла не использует |
| `src/components/placeholders.test.tsx > Заглушка News > рендерит секцию ... из copy.ts` | ищет `copy.sections.news.body` («Здесь появится лента новостей...»), секция берёт текст из `newsCopy` |
| `src/components/placeholders.test.tsx > Заглушка News > держит тело в стеклянной карточке` | та же причина, что и у `App.test.tsx` |

`App.test.tsx` и `placeholders.test.tsx` в списке запрещённых для параллельных исполнителей, поэтому строки про News из них не удалялись. Правку делает оркестратор при слиянии: убрать News из таблицы заглушек и ослабить проверку `.glass-card` до секций, где стекло ещё живёт.

---

**Total deviations:** 3 auto-fixed (1 blocking, 2 missing critical) + 1 отложено оркестратору
**Impact on plan:** Отклонения держатся внутри файлов плана, объём не расширялся.

## Issues Encountered

Кроме падающих тестов заглушек (таблица выше), других проблем не было. RED-фазы обеих TDD-задач подтверждены запуском: Task 1 падал на `Failed to resolve import "./NewsCard"`, Task 3 — на отсутствии плашки обложки и пустого состояния.

## Verification (что реально запускалось)

| Команда | Результат |
|---------|-----------|
| `npx vitest run src/lib/paginate.test.ts src/components/news/News.test.tsx` (после Task 1) | код 1, `Failed to resolve import "./paginate"` и `"./NewsCard"` — ожидаемый RED |
| `npx vitest run src/lib/paginate.test.ts src/components/news/News.test.tsx` (после Task 2) | 2 файла, 14 тестов — зелено |
| `npx vitest run src/components/news/News.test.tsx` (после Task 3) | 9 тестов — зелено |
| `npm test` (весь набор) | 128 тестов: 125 passed, 3 failed — все три из `App.test.tsx` и `placeholders.test.tsx` по причине выше |
| `npm run build` (`tsc -b && vite build`) | код 0, бандл 211.16 kB / gzip 66.64 kB |
| `npx eslint` по файлам плана | чисто |

Ручной smoke в браузере (`npm run dev`, реальная загрузка обложек с `img.youtube.com`, поведение скролла при клике) **не проводился**: агент работает в изолированном worktree без браузера. Загрузка обложек и отсутствие прыжка скролла подтверждены только на уровне DOM в jsdom.

## Known Stubs

Нет. Секция работает на девяти реальных записях, заглушек и placeholder-текста не осталось.

## Threat Flags

Нет новой поверхности сверх `<threat_model>` плана: T-04-01 закрыт `rel="noopener noreferrer"` (проверяется тестом), T-04-03 — плашкой по `onError`, T-04-04 — только JSX-интерполяцией, `dangerouslySetInnerHTML` в секции нет. Пакеты не устанавливались (T-04-SC).

## Next Phase Readiness

- `paginate` готова к переиспользованию, если пагинация понадобится ресурсам или видео.
- `newsCopy` ждёт слияния в общий `copy.ts` в фазе 5 (вместе с копирайтом фаз 3 и 4).
- Reveal-анимации секции фаза 4 не ставит: это работа фазы 5.
- Блокер для оркестратора: три теста заглушек по News (таблица выше).

---
*Phase: 04-news-resources-quote*
*Completed: 2026-09-05*

## Self-Check: PASSED

Все восемь файлов плана существуют на диске, все три коммита задач (`1ebff91`, `11be064`, `4d6402e`) есть в `git log` ветки `agent-04-01`.
