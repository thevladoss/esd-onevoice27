---
phase: 04-news-resources-quote
reviewed: 2026-09-05T00:00:00Z
depth: standard
files_reviewed: 25
files_reviewed_list:
  - src/components/news/News.tsx
  - src/components/news/News.test.tsx
  - src/components/news/NewsCard.tsx
  - src/components/news/NewsPagination.tsx
  - src/components/quote/Quote.tsx
  - src/components/quote/Quote.test.tsx
  - src/components/quote/WorldSilhouette.tsx
  - src/components/resources/Resources.tsx
  - src/components/resources/Resources.test.tsx
  - src/components/resources/ResourceCard.tsx
  - src/components/resources/ResourcePanel.tsx
  - src/components/resources/MaterialsList.tsx
  - src/components/resources/MusicPlaceholder.tsx
  - src/components/resources/VideoFacade.tsx
  - src/components/resources/VideoFacade.test.tsx
  - src/components/resources/VideoGrid.tsx
  - src/components/resources/resources.css
  - src/data/news.ts
  - src/data/videos.ts
  - src/data/materials.ts
  - src/data/copy.news.ts
  - src/data/copy.resources.ts
  - src/data/copy.quote.ts
  - src/lib/paginate.ts
  - src/lib/paginate.test.ts
findings:
  critical: 0
  warning: 9
  info: 13
  convention: 5
  total: 27
status: issues_found
---

# Фаза 4: отчёт код-ревью

**Дата:** 2026-09-05
**Глубина:** standard
**Файлов просмотрено:** 25
**Статус:** issues_found

## Сводка

Я прочитал все 25 файлов фазы и проверил внешние ссылки, allow-list ютуб-iframe, клавиатуру и фокус
панелей, deep link по хэшу, форматирование дат и данные моков. Дыр в безопасности я не нашёл:
`dangerouslySetInnerHTML`, `eval`, `innerHTML`, хардкод секретов, `as any` и отладочные артефакты в
этих файлах отсутствуют, все внешние ссылки несут `target="_blank" rel="noopener noreferrer"`, плеер
грузится с `youtube-nocookie.com` только после клика. Блокеров нет.

Проблемы лежат в двух местах. Первое: фокус. `VideoFacade` теряет фокус при запуске плеера, стрелка
пагинации гасится под фокусом, и оба случая выкидывают клавиатурного пользователя в начало документа.
Второе: контракты входных данных. `formatNewsDate` роняет рендер целой страницы на битой дате,
`paginate` при `perPage <= 0` отдаёт `totalPages: Infinity`, а `NewsPagination` на этом падает с
`RangeError: Invalid array length`. Оба сценария я проверил в node, они воспроизводятся.

Отдельно: deep link `#resources-materials` не достижим из интерфейса. Комментарий в `Resources.tsx`
утверждает, что хэш приходит из триптиха «Скачать материалы →», но `copy.involve.ts` отдаёт `#resources`
без хэша панели. Слушателя `hashchange` тоже нет, так что даже добавленная ссылка сработает только
после полной перезагрузки.

## Narrative Findings (AI reviewer)

## Critical Issues

Не найдено. Инъекций, обхода авторизации, утечек секретов и потери данных в файлах фазы нет.

## Warnings

### WR-01: VideoFacade роняет фокус при старте плеера

**Файл:** `src/components/resources/VideoFacade.tsx:39-43` (кнопка), `29-37` (iframe)
**Проблема:** Клик по кнопке play переводит `playing` в `true`, кнопка размонтируется, а iframe фокус
не получает. Браузер отдаёт фокус в `document.body`, и следующий Tab начинает обход с начала страницы.
Клавиатурный пользователь запускает ролик и теряет позицию в сетке из 16 фасадов. Соседний компонент
`src/components/about/VideoEmbed.tsx:13-19` эту же задачу решает через `iframeRef.current?.focus()`,
то есть фаза 4 потеряла уже написанное решение.
**Исправление:**
```tsx
const iframeRef = useRef<HTMLIFrameElement>(null);

useEffect(() => {
  if (playing) iframeRef.current?.focus();
}, [playing]);

// ...
<iframe ref={iframeRef} className="absolute inset-0 h-full w-full" ... />
```

### WR-02: стрелка пагинации гаснет под фокусом и теряет его

**Файл:** `src/components/news/NewsPagination.tsx:62-73`
**Проблема:** На странице 1 из 2 пользователь нажимает «Следующая страница» с клавиатуры, `isLast`
становится `true`, кнопка получает `disabled`, браузер снимает с неё фокус и отдаёт его в `body`.
Тест `News.test.tsx:60-70` проверяет только `toBeDisabled()` и этот разрыв не ловит. Тот же тест-файл
на строках 55-57 фиксирует правильное поведение для цифр, где фокус сохраняется.
**Исправление:** держать кнопку в дереве фокуса и гасить действие через `aria-disabled`, либо
переводить фокус на кнопку текущей страницы:
```tsx
<button
  type="button"
  aria-label={newsCopy.nextPage}
  aria-disabled={isLast}
  onClick={() => { if (!isLast) onChange(page + 1); }}
  className={BUTTON_BASE + " aria-disabled:cursor-not-allowed aria-disabled:opacity-[.38] ..."}
>
```

### WR-03: allow-list стороннего iframe шире, чем нужно для воспроизведения

**Файл:** `src/components/resources/VideoFacade.tsx:33`
**Проблема:** `allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture;
web-share"` делегирует стороннему фрейму запись в буфер обмена, системный шэринг и акселерометр.
Для проигрывания ролика нужны `autoplay`, `encrypted-media` и `picture-in-picture`. `clipboard-write`
открывает фрейму подмену содержимого буфера обмена без жеста в верхнем документе, `web-share`
поднимает системный лист шаринга от имени страницы. Проект уже задал узкий список в
`src/components/about/VideoEmbed.tsx:33`: `allow="autoplay; encrypted-media; picture-in-picture"`.
Плюс на iframe нет `sandbox`.
**Исправление:**
```tsx
allow="autoplay; encrypted-media; picture-in-picture"
sandbox="allow-scripts allow-same-origin allow-presentation"
```

### WR-04: formatNewsDate роняет рендер всей страницы на некорректной дате

**Файл:** `src/components/news/NewsCard.tsx:20-22`, тип поля `src/data/news.ts:5`
**Проблема:** `dateFormatter.format(new Date(iso))` на непарсимой строке бросает
`RangeError: Invalid time value` (проверено в node на `"2026-13-45"`). `NewsItem.date` типизирован как
обычный `string`, ErrorBoundary в приложении нет (`src/App.tsx`, `src/main.tsx`), поэтому одна опечатка
в моках гасит весь лендинг белым экраном. `News` к тому же принимает произвольный `items` через проп.
**Исправление:**
```tsx
export function formatNewsDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return dateFormatter.format(date).replace(/\s?г\.$/u, "");
}
```
и в `NewsCard` рендерить `<time>` только при непустой строке.

### WR-05: paginate не проверяет perPage, а NewsPagination на этом падает

**Файл:** `src/lib/paginate.ts:12-21`, потребитель `src/components/news/NewsPagination.tsx:34`
**Проблема:** При `perPage = 0` выражение `Math.ceil(items.length / 0)` даёт `Infinity`, функция
возвращает `totalPages: Infinity`, и `Array.from({ length: totalPages })` бросает
`RangeError: Invalid array length` (оба шага проверены в node). При отрицательном `perPage` падения
нет, зато `slice(0, -2)` тихо выбрасывает хвост списка: три элемента превращаются в один без единого
сигнала. Docblock обещает «вызывающему коду не нужно сторожить границы», но границу `perPage` функция
не сторожит. Тесты `paginate.test.ts` гоняют только 4 и 6.
**Исправление:**
```ts
export function paginate<T>(items: T[], page: number, perPage = 6): PaginationResult<T> {
  const size = Math.max(1, Math.trunc(perPage) || 1);
  const totalPages = Math.max(1, Math.ceil(items.length / size));
  const safePage = Math.min(Math.max(1, Math.trunc(page) || 1), totalPages);
  const start = (safePage - 1) * size;
  return { items: items.slice(start, start + size), page: safePage, totalPages };
}
```
плюс тест на `perPage = 0` и `perPage = -2`.

### WR-06: deep link #resources-materials не достижим из интерфейса

**Файл:** `src/components/resources/Resources.tsx:10-16, 49-53`; источник ссылки
`src/data/copy.involve.ts:31-32`
**Проблема:** Комментарий в коде заявляет: «Переход из триптиха „Скачать материалы →“ приходит с
готовым хэшем». Триптих отдаёт `href: "#resources"` без хэша панели, других источников хэша в
`src/` нет (grep по `resources-materials` находит только сам `Resources.tsx` и его тест). Сценарий
«клик по „Скачать материалы“ открывает панель материалов» не работает: пользователь попадает на
секцию с тремя закрытыми карточками. Второй разрыв: обработчик читает `location.hash` один раз при
монтировании (`useEffect` с пустым списком зависимостей), слушателя `hashchange` нет, поэтому
переход по такой ссылке внутри уже открытой страницы ничего не откроет. Третий: элемента с
`id="resources-materials"` в DOM нет, так что нативный якорный скролл браузера тоже промахивается,
и работает только ручной `scrollIntoView`.
**Исправление:** либо перевести триптих на `href: "#resources-materials"` и добавить слушателя:
```tsx
useEffect(() => {
  const onHashChange = () => { if (hashOpensMaterials()) setActive("materials"); };
  window.addEventListener("hashchange", onHashChange);
  return () => window.removeEventListener("hashchange", onHashChange);
}, []);
```
либо убрать мёртвую ветку и поправить комментарий, который сейчас вводит в заблуждение.

### WR-07: id="resources-panel" висит на обёртке, а не на панели с role="region"

**Файл:** `src/components/resources/Resources.tsx:113`, `src/components/resources/ResourcePanel.tsx:26-33`,
`src/components/resources/ResourceCard.tsx:29`
**Проблема:** `04-UI-SPEC.md:244` требует `id="resources-panel"` на самой панели: «Панель:
`id="resources-panel"`, `role="region"`, `aria-labelledby="resources-panel-title"`». В коде id стоит
на служебной обёртке анимации, а панель с `role="region"` идёт вложенным элементом без id. В итоге
`aria-controls` всех трёх карточек указывает на безролевой div. Вторая часть: три кнопки указывают на
один и тот же контейнер, причём при открытой панели «Материалы» карточки «Музыка» и «Видео» держат
`aria-expanded="false"` на контейнере, который развёрнут. Скринридер получает противоречивое описание
состояния.
**Исправление:** перенести `id="resources-panel"` на `<div role="region">` в `ResourcePanel`, обёртке
оставить только `data-open`. Для конфликта `aria-expanded` выставлять `aria-controls` лишь на активной
карточке либо дать каждой карточке собственный id панели (`aria-controls={`resources-panel-${kind}`}`).

### WR-08: кнопка «Вернуться к первой странице» гарантированно ничего не делает

**Файл:** `src/components/news/News.tsx:36-48`
**Проблема:** Ветка пустого состояния показывается при `result.items.length === 0`. `paginate` уже
зажимает страницу в `[1, totalPages]`, поэтому пустой результат достижим единственным способом: пустой
`items`, и тогда `result.page` всегда равен 1. Клик по `setPage(1)` меняет состояние с 1 на 1,
интерфейс остаётся тем же. Пользователю показывают активную кнопку, которая не даёт отклика. Тест
`News.test.tsx:114-127` проверяет наличие кнопки и не проверяет поведение, поэтому мёртвую ветку не
ловит.
**Исправление:** заменить кнопку на текст, либо снять зажим страницы в `News` (хранить сырое `page` и
показывать пустое состояние при выходе за границы), тогда возврат на первую страницу получит смысл:
```tsx
const outOfRange = page > result.totalPages;
// пустое состояние показывать при outOfRange || items.length === 0
```

### WR-09: videoId подставляется в URL без экранирования

**Файл:** `src/components/resources/VideoFacade.tsx:31, 52`; те же шаблоны в `src/data/news.ts:11-12`
**Проблема:** `` `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0` `` склеивает
строку без `encodeURIComponent`. Значение `videoId` вида `abc?list=PL...&` или `abc/../live_stream`
меняет путь и параметры встраивания, `#` обрезает хвост запроса. Смены origin добиться нельзя,
поэтому XSS тут нет, но контроль над содержимым фрейма частично уходит к данным. `VideoFacade`
экспортирован и принимает `videoId: string` от любого вызывающего кода, а тест на формат id
(`VideoFacade.test.tsx:69`) проверяет только массив `videos`, не сам компонент.
**Исправление:**
```tsx
const id = encodeURIComponent(videoId);
// src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
// src={`https://img.youtube.com/vi/${id}/hqdefault.jpg`}
```
или ранний выход при `!/^[A-Za-z0-9_-]{11}$/.test(videoId)`.

## Info

### IN-01: VideoFacade дублирует about/VideoEmbed

**Файл:** `src/components/resources/VideoFacade.tsx:1-76`, `src/components/about/VideoEmbed.tsx:1-78`
**Проблема:** Два компонента с одинаковым API (`videoId`, `title`, `className`) и одинаковой логикой
фасада: состояние `playing`/`active`, состояние упавшего постера, тот же URL плеера и постера. Разошлись
они только в оформлении, в allow-list (см. WR-03) и в управлении фокусом (см. WR-01). Дедупликация
запланирована на фазу 5, фиксирую как контекст для неё.
**Исправление:** свести к одному компоненту с пропом оформления, забрав фокус-эффект из `VideoEmbed` и
узкий allow-list.

### IN-02: поле NewsItem.source заполнено и не выводится

**Файл:** `src/data/news.ts:8` (тип), значения на строках 25, 33, 41, 49, 57, 65, 73, 81, 89
**Проблема:** Grep по `.source` в `src/` не находит ни одного чтения. Девять записей несут «YouTube ЕАД»
или «esd.onevoice27.org», карточка их не показывает.
**Исправление:** вывести источник в `NewsCard` рядом с датой либо убрать поле из типа и данных.

### IN-03: неиспользуемый экспорт resourceKeys

**Файл:** `src/data/copy.resources.ts:4`
**Проблема:** `resourceKeys` не импортируется нигде, `Resources.tsx` перечисляет три карточки вручную.
**Исправление:** либо рендерить карточки через `resourceKeys.map(...)`, либо удалить экспорт.

### IN-04: --color-unity-200 объявлен и не используется, а #8f9dd6 продублирован трижды

**Файл:** `src/components/resources/resources.css:4-7`, `src/data/copy.resources.ts:33`,
`src/components/resources/MusicPlaceholder.tsx:18`
**Проблема:** `.resources { --color-unity-200: #8f9dd6 }` не читается ни одним правилом: сами частицы
на строке 41 пишут литерал `rgb(143 157 214 / .62)`. Тот же цвет захардкожен в `accent` карточки
музыки и в классе `text-[#8f9dd6]`. Токена в `src/styles/tokens.css` нет (там есть `unity-950/700/500`).
**Исправление:** поднять `--color-unity-200` в `@theme` файла `tokens.css` и подставить `var(...)` во
все три места, либо удалить мёртвое объявление.

### IN-05: Esc закрывает панель только при фокусе внутри неё

**Файл:** `src/components/resources/Resources.tsx:121-126`
**Проблема:** Обработчик висит на `ResourcePanel`. После Tab из панели наружу (например, на карточку
или на следующую ссылку) Esc уже не работает. При запущенном плеере клавиши остаются в кросс-доменном
iframe и до React не доходят вовсе.
**Исправление:** повесить обработчик на секцию `#resources` либо на `document` через `useEffect` при
`active !== null`.

### IN-06: приватность фасада касается только плеера, постеры уходят в Google сразу

**Файл:** `src/components/resources/VideoFacade.tsx:5-7` (комментарий), `52`; `VideoGrid.tsx:9-16`
**Проблема:** Комментарий обещает: «до взаимодействия страница не обращается к youtube-nocookie.com».
Формально верно, но при открытии панели «Видео» страница отправляет 16 запросов на `img.youtube.com`
(домен Google, полный Referer по умолчанию). `loading="lazy"` откладывает часть, не отменяя. Asset
Contract такие постеры разрешает, но формулировка комментария создаёт ложное впечатление.
**Исправление:** уточнить комментарий и добавить `referrerPolicy="no-referrer"` на `<img>` постера.

### IN-07: панель забирает фокус и при клике мышью

**Файл:** `src/components/resources/Resources.tsx:43-47`
**Проблема:** Эффект переводит фокус на панель при любом открытии. `04-UI-SPEC.md:247` требует фокус
только для сценария deep link. Для мыши это уводит фокус с нажатой карточки, а на загрузке страницы по
хэшу фокус прыгает в середину документа без действия пользователя.
**Исправление:** фокусировать панель только при открытии с клавиатуры или при deep link, отдельным
флагом в состоянии.

### IN-08: обёртка панели держит отступ 32px в закрытом состоянии

**Файл:** `src/components/resources/Resources.tsx:113`, `src/components/resources/resources.css:102-110`
**Проблема:** `mt-8` стоит на обёртке всегда, при `grid-template-rows: 0fr` высота нулевая, но внешний
отступ остаётся. Под сеткой карточек висит 32px пустоты, когда панель закрыта.
**Исправление:** перенести отступ внутрь: `.resources-panel-wrap[data-open="true"] { margin-top: 2rem }`
или задать отступ на самой панели.

### IN-09: обложка новости про баннеры взята из чужого ролика

**Файл:** `src/data/news.ts:76-82`
**Проблема:** Новость «Опубликованы баннеры к 5 сентября 2026» ведёт на страницу материалов, а обложку
берёт из ролика `-Eo--61cx90`, который в `src/data/videos.ts:22` подписан «Единый голос-2027: Иван
Вельгоша». То же у записи `desire-of-ages` (`VjwJfHAqIxQ` = «Даниил Ловска»). Карточка показывает
портрет человека, не связанного с содержанием новости.
**Исправление:** для новостей без ролика ставить градиентную плашку (механизм `coverFailed` уже есть)
либо подобрать релевантный кадр.

### IN-10: DOCX хотлинкается на сторонний бакет с непрозрачным именем

**Файл:** `src/data/materials.ts:19`
**Проблема:** `https://hope-documents.fra1.digitaloceanspaces.com/65e8ec8ed9988b1907692c05/mGS1787822852554.docx`
указывает на чужое хранилище со сгенерированным именем файла. При удалении объекта пользователь получит
403 или XML-ошибку бакета без подсказки. PROJECT.md запрещает хотлинк ассетов со сторонних CDN; ссылка
для скачивания под этот запрет напрямую не подпадает (страница ничего не загружает), но риск протухания
тот же.
**Исправление:** вести на страницу материалов ЕАД, которая сама отдаёт актуальный файл, либо положить
документ в `public/`.

### IN-11: icons[item.kind] без фолбэка

**Файл:** `src/components/resources/MaterialsList.tsx:77`
**Проблема:** При появлении `kind`, которого нет в карте (данные из JSON или новая категория без правки
`icons`), `Icon` окажется `undefined`, и React упадёт с «Element type is invalid», унося панель целиком.
Типы это ловят только внутри репозитория.
**Исправление:** `const Icon = icons[item.kind] ?? FolderIcon;`

### IN-12: заголовок карточки дублируется в панели

**Файл:** `src/components/resources/ResourcePanel.tsx:37-46`, `src/components/resources/ResourceCard.tsx:44-51`
**Проблема:** При открытой панели в DOM одновременно живут два одинаковых `h3` («Будьте готовы») и два
одинаковых описания. Навигация по заголовкам в скринридере показывает дубли.
**Исправление:** оставить в панели заголовок, а описание не повторять, либо связать панель с заголовком
карточки через `aria-labelledby` на её `h3`.

### IN-13: тесты не покрывают найденные разрывы

**Файл:** `src/components/news/News.test.tsx:114-127`, `src/lib/paginate.test.ts:44-54`,
`src/components/resources/VideoFacade.test.tsx:28-43`
**Проблема:** Набор проверяет счастливые пути. Вне покрытия: клик по «Вернуться к первой странице»
(WR-08), `perPage <= 0` (WR-05), фокус после старта плеера (WR-01), фокус после гашения стрелки (WR-02),
невалидная дата (WR-04), Esc вне панели (IN-05).
**Исправление:** добавить эти шесть кейсов вместе с правками.

## Convention

### CV-01: два способа записать text-wrap: balance

**Файл:** `src/components/news/NewsCard.tsx:70` против `src/components/quote/Quote.tsx:25`
**Отклонение:** `NewsCard` пишет произвольное свойство `[text-wrap:balance]`, `Quote` в той же фазе
использует штатную утилиту `text-balance`.
**Конвенция:** штатная утилита Tailwind вместо произвольного свойства, когда утилита существует.
**Рекомендую:** заменить `[text-wrap:balance]` на `text-balance`.

### CV-02: as const поверх явной аннотации типа не работает

**Файл:** `src/data/videos.ts:8, 31`, `src/data/materials.ts:14, 50`, `src/data/copy.resources.ts:15-23`
**Отклонение:** Массивы объявлены как `const videos: readonly VideoItem[] = [...] as const`. Аннотация
типа гасит вывод литеральных типов, `as const` в этой позиции ничего не даёт. Соседние файлы фазы
(`copy.news.ts:17`, `copy.quote.ts:9`) обходятся одним `as const` без аннотации.
**Конвенция:** один способ фиксации: либо аннотация типа, либо `as const`.
**Рекомендую:** убрать `as const` из `videos.ts` и `materials.ts`, а `resourcesCopy` привести к тому же
виду, что и `newsCopy`.

### CV-03: SVG-иконки без focusable="false"

**Файл:** `src/components/resources/MaterialsList.tsx:5-15`, `src/components/resources/ResourcePanel.tsx:55-64`,
`src/components/resources/MusicPlaceholder.tsx:8-17`
**Отклонение:** Декоративные иконки несут только `aria-hidden`. В той же фазе
`NewsPagination.tsx:17-18` и `WorldSilhouette.tsx:24-25` ставят пару `aria-hidden` плюс
`focusable="false"`, и тест `Quote.test.tsx:59` этот атрибут проверяет.
**Конвенция:** декоративный inline SVG получает `aria-hidden="true"` и `focusable="false"`.
**Рекомендую:** добавить `focusable="false"` в `iconProps` и в две оставшиеся иконки.

### CV-04: подпись видео без font-body

**Файл:** `src/components/resources/VideoGrid.tsx:12`
**Отклонение:** `className="mt-2 line-clamp-2 text-xs font-bold uppercase ..."` без `font-body`, тогда
как остальные Label-подписи фазы (`NewsCard.tsx:66`, `ResourceCard.tsx:35`, `MaterialsList.tsx:93`,
`ResourcePanel.tsx:37`) семейство указывают явно.
**Конвенция:** любой body-текст объявляет `font-body`.
**Рекомендую:** добавить `font-body` в класс подписи.

### CV-05: контейнер секции скопирован из Section

**Файл:** `src/components/quote/Quote.tsx:16`, `src/components/resources/Resources.tsx:67` против
`src/components/layout/Section.tsx:21`
**Отклонение:** Строка `mx-auto max-w-[72rem] px-4 py-16 md:px-8 md:py-24` повторена дословно. Обе
секции не могут взять `Section` целиком (нужен декоративный слой соседом контейнера), но сама строка
геометрии остаётся копией.
**Конвенция:** геометрия контейнера живёт в одном месте.
**Рекомендую:** вынести строку в константу или в класс `.section-container` в `primitives.css` и
подставлять её в `Section`, `Quote` и `Resources`.

---

_Дата ревью: 2026-09-05_
_Ревьюер: Claude (gsd-code-reviewer)_
_Глубина: standard_
