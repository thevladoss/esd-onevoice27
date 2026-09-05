# Phase 4: Новости, Ресурсы, Цитата - Research

**Researched:** 2026-09-05
**Confidence:** HIGH (внешние ресурсы проверены запросами)

## Обложки видео (все 16 роликов ЕАД)

`https://img.youtube.com/vi/{id}/hqdefault.jpg` → 200 для всех 16 id; `maxresdefault.jpg` тоже → 200 для всех 16. Размеры hq 4,8–19,4 КБ. Для сетки 16 фасадов использовать `hqdefault` (480×360) с `loading="lazy"` и `object-fit: cover` в контейнере 16:9; для обложек новостей 4:5 подходит тот же `hqdefault` с `object-position: center`.

| id | Название |
|---|---|
| YpLD6p-z00g | Международный день молитвы – Единый голос27 |
| qQsgK18gKCU | Единый голос-27: Михаил Каминский |
| dnQS3tFmCNU | Единый голос-27: Эртон Келер |
| GK_RXxwZxEc | Единый голос-2027: руководители Адвентистской церкви — о проекте |
| xH3MMwox8cU | Единый голос-2027: что мы ожидаем от этого проекта? |
| gwqe_QH6KX0 | Единый голос-2027: как различные отделы Адвентистской церкви поддерживают проект? |
| 1MN5Gml00QU | Единый голос-2027: как я могу поддержать проект? |
| -Eo--61cx90 | Единый голос-2027: Иван Вельгоша |
| VjwJfHAqIxQ | Единый голос-2027: Даниил Ловска |
| uZ4XxENU0C4 | Единый голос-27: Олег Воронюк |
| OeU68sjhbGY | Единый голос-27: Вячеслав Бучнев |
| S0xNs-LPztg | Единый голос-27: Андрей Качалаба |
| 9BNTd67GNy8 | Единый голос-27: Андрей Молдавану |
| Rvjnk_GGQF4 | Единый голос-27: Александр Жуков |
| gcyRYg-Wc2k | Единый голос-27: Эдуард Булавчик |
| mpymrj-hOec | Единый голос-27: Дмитрий Зубков |

Id `-Eo--61cx90` начинается с дефиса: в URL это допустимо, но в CSS-классах/ключах React использовать как строку, не как идентификатор.

## Ссылки материалов

- `https://hope-documents.fra1.digitaloceanspaces.com/65e8ec8ed9988b1907692c05/mGS1787822852554.docx` → 200 (прямая загрузка DOCX; добавить атрибут `download` не нужно, браузер скачает сам).
- `https://esd.onevoice27.org/materials/banners`, `/materials/desire-of-ages`, `/materials/wallpapers`, `/materials` → страницы существуют (открывались в браузере в этой сессии), на `curl` отдают 429 «Vercel Security Checkpoint». В Playwright-smoke не проверять их статус через `fetch`, только наличие `href`.
- `https://esd.adventist.org` → 403 на `curl` (защита от ботов), в браузере открывается. Тот же подход.
- SharePoint-ссылка на английские материалы из PROJECT.md: открывается в браузере, требует JS.

## Пагинация

`paginate<T>(items: T[], page: number, perPage = 6): { items: T[]; page: number; pages: number }` с клампом `page` в `[1, pages]`. Для 9 новостей: `pages = 2`, вторая страница — 3 элемента. Тест без DOM.

## Силуэт карты мира для цитаты

Из `lib/geo.ts` (фаза 2) взять `world` (все 177 стран) и `geoNaturalEarth1().fitWidth(width, { type: "Sphere" })`, отрисовать один `<path d>` через `geoPath` для `{ type: "FeatureCollection", features: world.features }` (один path на всё, дешевле 177) с `fill="rgb(248 247 251 / .05)"` и `stroke="rgb(248 247 251 / .1)"`, `aria-hidden="true"`, `preserveAspectRatio="xMidYMid slice"`. Импорт `world-atlas` уже в бандле фазы 2, дополнительного веса нет.

## Раскладка ресурсов

Оригинал (`docs/research/orig-vp-6300.jpeg`): карточка «Music» слева сверху (~320×296), центральный блок текста (~525×525), «Materials» справа со сдвигом вниз (~272×336), «Video» внизу слева от центра (~366×256), фон со звёздными точками. CSS grid 12 колонок: `music: col 1 / span 3, row 1 / span 2`, `title: col 4 / span 6, row 1 / span 3`, `materials: col 10 / span 3, row 2 / span 2`, `video: col 3 / span 3, row 3` с `margin-top: -48px`; на мобильном `grid-template-columns: 1fr` и естественный порядок: заголовок, музыка, материалы, видео.
