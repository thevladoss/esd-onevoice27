---
phase: 4
slug: news-resources-quote
status: draft
shadcn_initialized: false
preset: none
created: 2026-09-05
---

# Phase 4 — UI Design Contract

> Визуальный и интерактивный контракт секций «Новости», «Ресурсы», «Цитата». Автор — gsd-ui-researcher, проверяет gsd-ui-checker.
>
> Дизайн-систему задаёт фаза 1. Эта фаза её **использует**, а не переопределяет. Единственное дополнение к токенам — `--color-unity-200` (см. «Color»).

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none — собственные токены Tailwind v4 `@theme` из фазы 1 (`src/styles/tokens.css`) |
| Preset | not applicable |
| Component library | none — примитивы фазы 1: `Section`, `Eyebrow`, `GradientTitle`, `Button`, `GlassCard` |
| Icon library | inline SVG в проекте, 24×24, `stroke="currentColor"`, `stroke-width="1.5"`, `fill="none"`, `aria-hidden="true"` |
| Font | Onest (заголовки, `--font-display`), Noto Sans (текст, `--font-body`) |

**shadcn gate:** проект без `components.json` и без `package.json` (фаза 1 ещё не исполнена). Дизайн-система выбрана в `01-CONTEXT.md`: Tailwind v4 `@theme` плюс собственные примитивы. shadcn не инициализируется — иначе фаза 4 переопределила бы систему соседних фаз. Registry safety gate не применяется.

**Что фаза переиспользует, а не создаёт заново:**

| Актив | Источник | Как используется |
|-------|----------|------------------|
| `Section`, `Eyebrow`, `GradientTitle` | фаза 1 | обёртка и шапки всех трёх секций |
| `GlassCard` | фаза 1 | карточки ресурсов, панель, заглушка музыки |
| Токены цвета, `--radius-card`, `--shadow-card` | фаза 1 | все поверхности |
| `.glass`, `.text-gradient-brand` | фаза 1 | стеклянные поверхности, декоративные кавычки |
| `lib/geo.ts` (`loadWorld`, world-atlas) | фаза 2 | силуэт карты мира в цитате |
| `components/about/VideoEmbed.tsx` | фаза 3 | фасады 16 роликов; если фаза 3 не завершена — локальная копия `components/resources/VideoFacade.tsx` с тем же API |

---

## Spacing Scale

Значения кратны 4. Токены — стандартная шкала Tailwind (`gap-2` = 8px и так далее), отдельные CSS-переменные не заводятся.

| Token | Value | Usage в фазе 4 |
|-------|-------|----------------|
| xs | 4px | сдвиг стрелки в строке материала при hover, offset подчёркивания триггера |
| sm | 8px | зазор пагинации, зазор «заголовок — описание» в карточке ресурса, gap иконки и текста подписи |
| md | 16px | внутренний отступ строки материала, инсет текстовой панели новости, зазор сетки видео, отступ действий карточки |
| lg | 24px | padding карточки ресурса и панели на мобильном, зазор сетки новостей, зазор между абзацами цитаты |
| xl | 32px | padding панели и центрального блока на десктопе, row-gap сетки ресурсов, отрицательный сдвиг карточки «Видео», отступ до `cite` |
| 2xl | 48px | отступ от сетки новостей до пагинации, скос верхней кромки секции новостей на десктопе |
| 3xl | 64px | вертикальный ритм секций (`py-16` мобильный, `py-24` десктоп из `Section`) |

**Exceptions (обоснованные, вне шкалы):**

| Значение | Где | Почему |
|----------|-----|--------|
| 44×44px | кнопки пагинации, кнопка «Свернуть» | минимальная зона касания WCAG 2.5.8, ниже 48px и выше 40px |
| 12px | точка-индикатор карточки ресурса, скругление строки материала и фасада видео | декоративный диаметр и радиус, не отступ |
| 56px | круглая кнопка play на фасаде видео | диаметр элемента управления, не отступ |
| 1px / 1.5px | рамки карточек и разделители | толщина линии, не отступ |

---

## Typography

Ровно четыре размера и три числовых веса (по два веса на семейство). Onest 900 из фазы 1 в этой фазе не встречается.

| Role | Size | Weight | Line Height | Где применяется |
|------|------|--------|-------------|-----------------|
| Label | 12px | 700 Noto Sans | 1.4 | eyebrow «На каждом канале» и «Ресурсы» и «Слово на дорогу», дата новости, подпись индикатора карточки («МУЗЫКА»), триггер «Открыть материалы», цифры и стрелка пагинации, подписи видео, вторая строка строки материала, `cite` |
| Body | 16px | 400 Noto Sans | 1.5 | абзацы под H2, описания карточек ресурсов, название материала (вес 700), текст заглушки музыки, описание панели |
| Heading | 22px | 800 Onest | 1.15 | заголовок карточки новости, заголовок карточки ресурса, заголовок панели |
| Display | `clamp(1.875rem, 4vw, 2.75rem)` (30→44px) | 800 Onest | 1.05 | H2 «Каждая платформа становится голосом», «Всё, что нужно для старта» |

Дополнительные правила:

- Label: `text-transform: uppercase`, `letter-spacing: 0.08em`. Eyebrow берётся из примитива `Eyebrow` фазы 1 (`letter-spacing: 0.1em`) — это единственное расхождение letter-spacing, оно унаследовано.
- Heading и Display: `letter-spacing: -0.03em`, `text-wrap: balance`.
- Заголовок карточки новости обрезается `-webkit-line-clamp: 4`.
- Цитата: размер Heading (22px), но вес **700 Onest** и `line-height: 1.35` — единственное место, где Onest идёт не в 800.
- Кегли 14px, 20px и 24px из `04-CONTEXT.md` сведены к 16px и 22px, чтобы шкала осталась четырёхступенчатой (см. «Отклонения от CONTEXT»).

---

## Color

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | `--color-midnight-900 #120c34` (новости), `--color-midnight-950 #070210` (ресурсы), `linear-gradient(180deg, #120c34, #211a3e)` (цитата) | фон секций, фон карточки новости под обложкой |
| Secondary (30%) | `linear-gradient(145deg, rgb(48 63 131 / .86), rgb(18 12 52 / .76))` на базе `--color-unity-700 #303f83`, рамка `rgb(184 192 230 / .22)` | стеклянные карточки ресурсов, панель, заглушка музыки, строки материалов, фасады видео |
| Accent (10%) | музыка `--color-unity-200 #8f9dd6`, материалы `--color-horizon-400 #7bc2c7`, видео `--color-signal-300 #d28ebe`, общий `--color-horizon-200 #aad9dc` | список ниже |
| Destructive | не используется | в фазе нет разрушающих действий |

**Accent зарезервирован ровно для:**

1. точка-индикатор 12px в шапке карточки ресурса (свой цвет на карточку);
2. рамка карточки ресурса при hover, focus-visible и в раскрытом состоянии;
3. градиентная линия под триггером «Открыть …» (`linear-gradient(90deg, accent, transparent)`);
4. контур фокуса `outline: 2px solid` на карточках и в панели (`--color-horizon-400`);
5. рамка карточки новости при hover и focus-within (`rgb(123 194 199 / .4)`);
6. активная кнопка пагинации (градиент `125deg #6c2c68 0%, #3b4da1 50%, #39727e 100%`);
7. eyebrow всех трёх секций и `cite` цитаты (`--color-horizon-200`);
8. декоративные кавычки цитаты (градиент `signal-300 → horizon-400` через `background-clip: text`).

Акцент **не** красит: обычный текст, рамки строк материалов в покое, фон панели, неактивные кнопки пагинации, подписи видео.

**Новый токен (единственное дополнение к фазе 1):**

```css
--color-unity-200: #8f9dd6; /* акцент карточки «Музыка»; уже живёт в градиенте GradientTitle фазы 1 */
```

Добавляется в `src/styles/tokens.css` в существующий блок `@theme`. Другие токены фаза 4 не трогает.

**Прозрачности текста:** основной `--color-paper #f8f7fb`; вторичный `rgb(248 247 251 / .78)` (описания, подписи); третичный `rgb(248 247 251 / .62)` (подпись индикатора, неактивная пагинация). Контраст вторичного на `#070210` — около 12:1, третичного — около 8:1, оба выше 4.5:1.

---

## Copywriting Contract

| Element | Copy |
|---------|------|
| Primary CTA (материалы) | «Открыть материалы» |
| Secondary CTA (музыка) | «Открыть музыку» |
| Secondary CTA (видео) | «Открыть видео» |
| Empty state heading (панель «Музыка») | «Песня ещё в работе» *(принято по умолчанию)* |
| Empty state body (панель «Музыка») | «Официальная песня «Единого голоса 27» скоро появится здесь. Следите за новостями дивизиона.» |
| Empty state (пустая страница новостей) | «На этой странице новостей нет» + кнопка «Вернуться к первой странице» *(принято по умолчанию, защитный случай)* |
| Error state (обложка новости не загрузилась) | Плашка-градиент вместо картинки, надпись «Обложка недоступна» и подпись «Заголовок и ссылка на месте — откройте новость» *(принято по умолчанию)* |
| Error state (превью видео не загрузилось) | Плашка-градиент, кнопка play на месте, `aria-label` остаётся «Смотреть видео: {title}» *(принято по умолчанию)* |
| Destructive confirmation | нет разрушающих действий: «Свернуть» закрывает панель обратимо, подтверждение не нужно |

Полный набор строк секций:

| Ключ `data/copy.ts` | Текст |
|---------------------|-------|
| `news.eyebrow` | «На каждом канале» |
| `news.title` | «Каждая платформа становится голосом» |
| `news.body` | «Единый голос 27 встречает людей там, где они уже есть: на каждом экране и каждой частоте.» |
| `news.paginationLabel` | «Пагинация новостей» |
| `news.nextPage` | «Следующая страница» |
| `news.pageStatus` | «Страница {page} из {total}» (скрытый `role="status"`) |
| `resources.eyebrow` | «Ресурсы» |
| `resources.title` | «Всё, что нужно для старта» |
| `resources.body` | «Музыка, видео и материалы, которые помогут рассказать об инициативе в вашей церкви и городе.» |
| `resources.music.label` / `.title` / `.description` | «МУЗЫКА» / «Пойте вместе» / «Официальная песня и версии для общинного пения.» |
| `resources.materials.label` / `.title` / `.description` | «МАТЕРИАЛЫ» / «Будьте готовы» / «Скачайте материалы для церкви, малых групп и соцсетей.» |
| `resources.video.label` / `.title` / `.description` | «ВИДЕО» / «Смотрите и делитесь» / «16 роликов дивизиона: от приветствий руководителей до свидетельств.» |
| `resources.panel.close` | «Свернуть» (`aria-label="Свернуть панель"`) |
| `quote.eyebrow` | «Слово на дорогу» |
| `quote.paragraphs[0]` | «Пусть каждый работник в винограднике Господа исследует, планирует, разрабатывает методы работы с людьми. Нам необходимо предпринимать нечто выходящее за рамки обычного порядка вещей.» |
| `quote.paragraphs[1]` | «Мы обязаны приковывать внимание людей. Нам следует быть чрезвычайно серьезными. Мы стоим на самом пороге времени бедствий и смут, которые трудно вообразить.» |
| `quote.cite` | «Эллен Уайт, «Евангелизм», стр. 122» |

Описания карточек ресурсов помечены «принято по умолчанию»: `04-CONTEXT.md` зафиксировал заголовки и триггеры, тексты описаний оставлены на усмотрение и написаны по смыслу оригинала.

---

## Layout Contract

Брейкпоинты Tailwind: `md` = 768px, `lg` = 1024px. Контейнер — `max-width: 72rem`, отступы `px-4 md:px-8` из `Section`.

### Новости `#news`

- Скошенная верхняя кромка: `clip-path: polygon(0 48px, 100% 0, 100% 100%, 0 100%)` и `margin-top: -48px`, `padding-top: calc(4rem + 48px)`; на `< 768px` скос 24px. Фон `--color-midnight-900` плюс атмосфера `radial-gradient(circle at 88% 18%, rgb(84 164 172 / .14), transparent 38%), radial-gradient(circle at 8% 72%, rgb(48 63 131 / .22), transparent 42%)`.
- Шапка выровнена по левому краю, ширина текста `max-width: 34rem`, зазор eyebrow → H2 → абзац: 8px и 16px.
- Сетка: `grid`, `gap: 24px`; 1 колонка `< 768px`, 2 колонки `768–1023px`, 3 колонки `≥ 1024px`, `gap: 32px` на `lg`.
- Пагинация: `nav` по центру, `margin-top: 48px`.

### Ресурсы `#resources`

Десктоп `≥ 1024px` — `grid-template-columns: repeat(12, minmax(0, 1fr))`, три ряда `auto`, `column-gap: 24px`, `row-gap: 32px`:

| Элемент | grid-column | grid-row | Размер |
|---------|-------------|----------|--------|
| Карточка «Музыка» | `1 / 5` | `1 / 3` | `max-width: 320px`, `aspect-ratio: 320 / 296`, `align-self: start` |
| Центральный текстовый блок | `5 / 10` | `1 / 3` | `max-width: 528px`, `padding: 32px`, `text-align: center`, `align-self: center` |
| Карточка «Материалы» | `10 / 13` | `2 / 4` | `max-width: 272px`, `aspect-ratio: 272 / 336`, `align-self: end` |
| Карточка «Видео» | `4 / 8` | `3 / 4` | `max-width: 344px`, `aspect-ratio: 344 / 256`, `margin-top: -32px` |

Границы колонок «материалы» сдвинуты с 9–12 на 10–12 против `04-CONTEXT.md`: при 9–12 карточка накладывалась на текстовый блок в рядах 2–3.

Центральный блок повторяет оригинал: `border: 1px dotted rgb(84 164 172 / .25)`, `border-radius: var(--radius-card)`, `background: rgb(84 164 172 / .05)`.

Планшет `768–1023px` — `grid-template-columns: repeat(6, minmax(0, 1fr))`, `gap: 24px`: текстовый блок `1 / 7` ряд 1; «Музыка» `1 / 4` ряд 2; «Материалы» `4 / 7` ряд 2 с `margin-top: 24px`; «Видео» `2 / 6` ряд 3 с `margin-top: -16px`.

Мобильный `< 768px` — вертикальный стек `gap: 24px`: текстовый блок (по центру), затем «Музыка», «Материалы», «Видео»; каждая карточка `width: 100%`, `max-width: 360px`, `margin-inline: auto`, `min-height: 256px`.

Панель раскрывается **под сеткой**, во всю ширину контейнера, `margin-top: 32px`.

### Цитата `#quote`

- Фон `linear-gradient(180deg, #120c34, #211a3e)`; поверх пятна `radial-gradient(circle at 22% 30%, rgb(158 67 154 / .18), transparent 42%)` и `radial-gradient(circle at 78% 68%, rgb(84 164 172 / .16), transparent 44%)`.
- Силуэт карты: `<svg aria-hidden="true" focusable="false">` абсолютом `inset: 0`, `width/height: 100%`, `preserveAspectRatio="xMidYMid slice"`; проекция `geoNaturalEarth1().fitSize([w, h], world)` из `lib/geo.ts`; страны `fill: rgb(248 247 251 / .05)`, `stroke: rgb(248 247 251 / .1)`, `stroke-width: .5`; края гасятся `mask-image: radial-gradient(ellipse at center, black 55%, transparent 100%)`.
- Контент: `max-width: 48rem`, по центру, `text-align: center`, `z-index: 1`.

---

## Component Inventory

### `NewsCard`

`<article>` → `<a href={href} target="_blank" rel="noopener noreferrer">`, ссылка покрывает всю карточку.

- `position: relative`, `overflow: hidden`, `border-radius: var(--radius-card)`, `border: 1px solid rgb(184 192 230 / .22)`, фон `--color-midnight-900`.
- Обложка: `aspect-ratio: 4 / 5`, `<img>` `object-fit: cover`, `loading="lazy"`, `decoding="async"`, `alt=""` (заголовок уже в ссылке).
- Скрим: `linear-gradient(180deg, transparent 38%, rgb(7 2 16 / .82) 100%)`, `pointer-events: none`.
- Текстовый блок: абсолют `inset: auto 16px 16px 16px`, дата (Label, `--color-horizon-200`) над заголовком с зазором 8px, заголовок Heading 22px, `line-clamp: 4`.
- Дата: `<time dateTime={iso}>` + `Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric" })`.
- Hover (`@media (hover: hover) and (pointer: fine)`): `img { transform: scale(1.04) }` 520ms `cubic-bezier(0.32, 0.72, 0, 1)`, рамка `rgb(123 194 199 / .4)`.
- Focus-within: та же рамка плюс `outline: 2px solid var(--color-horizon-400); outline-offset: 3px`.

### `NewsPagination`

`<nav aria-label="Пагинация новостей">` → `<ul>` с `gap: 8px`, по центру.

- Кнопка: `<button type="button">`, `min-width: 44px`, `min-height: 44px`, `border-radius: 8px`, Label 12px 700.
- Неактивная: цвет `rgb(248 247 251 / .62)`; hover — фон `rgb(33 26 62 / .44)`, цвет `--color-paper`.
- Активная: `aria-current="page"`, фон `linear-gradient(125deg, #6c2c68 0%, #3b4da1 50%, #39727e 100%)`, цвет `--color-paper`, тень `0 10px 24px rgb(59 77 161 / .34)`.
- `aria-label="Страница 2"` на каждой цифре; стрелка «→» — chevron SVG 20px, `aria-label="Следующая страница"`, на последней странице `disabled` и `opacity: .38`.
- Смена страницы: `useState`, без роутинга и без `scrollIntoView`; фокус остаётся на нажатой кнопке; скрытый `<p role="status" class="sr-only">Страница 2 из 2</p>` объявляет результат.
- `lib/paginate.ts`: `paginate<T>(items: T[], page: number, perPage = 6): { items: T[]; page: number; totalPages: number }`, `page` зажимается в `[1, totalPages]`.

### `ResourceCard`

`<button type="button" aria-expanded={isOpen} aria-controls="resources-panel">` — вся карточка кликабельна, вложенных ссылок и кнопок внутри **нет**.

- `display: flex; flex-direction: column; justify-content: space-between; text-align: left`, `padding: 24px`, `min-height: 256px`.
- Поверхность: `linear-gradient(180deg, rgb(248 247 251 / .06), transparent 34%), linear-gradient(145deg, rgb(48 63 131 / .86), rgb(18 12 52 / .76))`, `border: 1px solid rgb(184 192 230 / .22)`, `border-radius: var(--radius-card)`, `box-shadow: var(--shadow-card)`, `backdrop-filter: blur(18px) saturate(125%)`.
- Верхняя строка: подпись Label 12px `rgb(248 247 251 / .62)` слева, точка `12px` круг цвета акцента справа.
- Низ: заголовок Heading 22px, описание Body 16px `rgb(248 247 251 / .78)`, зазор 8px; триггер через 16px.
- Триггер: `<span>` Label 12px 700 плюс `::after` — линия 1px `linear-gradient(90deg, accent, transparent)`, `transform: scaleX(.34)`, при hover и focus-visible карточки `scaleX(1)`, переход 420ms.
- Hover: `transform: translateY(-4px)`, `border-color: accent`.
- Focus-visible: `outline: 2px solid accent; outline-offset: 4px`.
- Раскрытая: `border-color: accent` держится, точка получает `box-shadow: 0 0 0 6px color-mix(in oklab, accent 18%, transparent)`.

### `ResourcePanel`

- Обёртка анимации высоты: `display: grid; grid-template-rows: 0fr` → `1fr`, переход 420ms `cubic-bezier(0.32, 0.72, 0, 1)`, внутренний блок `overflow: hidden`.
- Панель: `id="resources-panel"`, `role="region"`, `aria-labelledby="resources-panel-title"`, `tabIndex={-1}`, `GlassCard`, `padding: 24px` (`32px` на `md`), фон `radial-gradient(circle at 15% 12%, rgb(79 93 175 / .2), transparent 38%)` поверх стекла.
- Шапка панели: слева Label-подпись раздела и заголовок `<h3 id="resources-panel-title">` Heading 22px; справа кнопка «Свернуть» — 44×44, иконка `×` 20px плюс текст на `≥ 768px`, `aria-label="Свернуть панель"`.
- Состояние: `useState<"music" | "materials" | "video" | null>(null)`; повторный клик по активной карточке закрывает; Esc закрывает и возвращает фокус на карточку-триггер; при открытии фокус уходит на панель.
- Глубокая ссылка: при монтировании `location.hash === "#resources-materials"` открывает панель материалов, скроллит к секции (`behavior: "auto"` при reduced motion) и фокусирует панель.

### `MaterialsList`

`<ul>` с `gap: 8px`; строка — `<li><a href target="_blank" rel="noopener noreferrer">`.

- `display: flex; align-items: center; gap: 16px; padding: 16px`, `border-radius: 12px`, `border: 1px solid rgb(248 247 251 / .08)`, фон `rgb(248 247 251 / .04)`.
- Иконка 24px `--color-horizon-200` по типу: документ (описание проекта), изображение (баннеры), книга (Желание веков), телефон (заставка), папка (материалы на английском).
- Название Body 16px вес 700; подпись под ним Label 12px `rgb(248 247 251 / .78)` — формат и язык («DOCX», «Страница ЕАД», «SharePoint, английский»).
- Стрелка `→` 16px справа, `margin-left: auto`; hover — `translateX(4px)`, рамка `rgb(123 194 199 / .4)`, фон `rgb(248 247 251 / .06)`.
- Focus-visible: `outline: 2px solid var(--color-horizon-400); outline-offset: 2px`.
- Пять позиций и адреса — из `04-CONTEXT.md` (`data/materials.ts`).

### `VideoFacade` (или `VideoEmbed` фазы 3)

- Сетка: 2 колонки `< 768px`, 3 колонки `768–1023px`, 4 колонки `≥ 1024px`, `gap: 16px`, 16 элементов.
- Фасад: `<button type="button" aria-label="Смотреть видео: {title}">`, `aspect-ratio: 16 / 9`, `border-radius: 12px`, `overflow: hidden`.
- Постер `https://img.youtube.com/vi/{id}/hqdefault.jpg`, `object-fit: cover`, `loading="lazy"`, `alt=""`; поверх слой `rgb(7 2 16 / .28)`.
- Кнопка play: круг 56px, `background: rgb(248 247 251 / .14)`, `backdrop-filter: blur(8px)`, треугольник 20px `--color-paper`; hover — `scale(1.08)` и слой `rgb(7 2 16 / .16)`.
- Клик заменяет фасад на `<iframe src="https://www.youtube-nocookie.com/embed/{id}?autoplay=1&rel=0" title={title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share" allowFullScreen loading="lazy">`.
- Подпись под фасадом: Label 12px `rgb(248 247 251 / .78)`, `line-clamp: 2`, `margin-top: 8px`.

### `MusicPlaceholder`

`GlassCard`, `padding: 32px`, по центру: иконка ноты 32px `--color-unity-200`, заголовок Heading 22px «Песня ещё в работе», текст Body 16px `rgb(248 247 251 / .78)` — строка из копирайт-контракта. Никаких кнопок.

### `Quote`

`<figure>` → `<blockquote>` с двумя `<p>` (`gap: 24px`) → `<figcaption><cite>`.

- Декоративные кавычки: `<span aria-hidden="true">“</span>`, Onest 800, 96px, `line-height: 1`, градиент `signal-300 → horizon-400` через `.text-gradient-brand`, `opacity: .5`, `margin-bottom: 16px`.
- Текст: Onest 700, 22px, `line-height: 1.35`, `--color-paper`.
- `cite`: `font-style: normal`, Label 12px, `--color-horizon-200`, `margin-top: 32px`, `display: block`.

---

## Interaction States

| Компонент | Default | Hover | Focus-visible | Active / Open | Disabled |
|-----------|---------|-------|---------------|---------------|----------|
| Карточка новости | рамка `rgb(184 192 230 / .22)` | обложка `scale(1.04)`, рамка `rgb(123 194 199 / .4)` | `outline: 2px horizon-400`, offset 3px | — | — |
| Кнопка пагинации | текст `paper/.62` | фон `rgb(33 26 62 / .44)`, текст `paper` | `outline: 2px horizon-400`, offset 2px | градиент бренда, `aria-current="page"` | стрелка на последней странице: `opacity: .38`, `disabled` |
| Карточка ресурса | рамка `rgb(184 192 230 / .22)`, линия триггера `scaleX(.34)` | `translateY(-4px)`, рамка акцента, линия `scaleX(1)` | `outline: 2px accent`, offset 4px | рамка акцента держится, ореол вокруг точки, `aria-expanded="true"` | — |
| Строка материала | рамка `paper/.08` | `translateX(4px)`, рамка `horizon-400/.4` | `outline: 2px horizon-400`, offset 2px | — | — |
| Фасад видео | слой `rgb(7 2 16 / .28)` | play `scale(1.08)`, слой светлее | `outline: 2px horizon-400`, offset 2px | заменён на iframe | — |
| Кнопка «Свернуть» | текст `paper/.78` | текст `paper`, фон `paper/.06` | `outline: 2px horizon-400`, offset 2px | — | — |

`outline: none` без замены запрещён в любом состоянии.

---

## Motion Contract

| Анимация | Значения |
|----------|----------|
| Токены длительности | fast 200ms, base 420ms, slow 520ms |
| Токен easing | `cubic-bezier(0.32, 0.72, 0, 1)` (из фазы 1) |
| Раскрытие панели | `grid-template-rows: 0fr → 1fr`, base 420ms |
| Hover карточки ресурса | `transform`, `border-color`, base 420ms |
| Зум обложки новости | `transform`, slow 520ms |
| Линия триггера | `transform: scaleX`, base 420ms |
| Частицы ресурсов | `@keyframes resources-particles` — `0%` `opacity: .2`, `translate3d(0,0,0)`; `48%` `opacity: .6`, `translate3d(-18px, -24px, 0)`; `100%` `opacity: .22`, `translate3d(12px, -46px, 0)`; `ease-in-out infinite alternate` |
| Слои частиц | три `<span aria-hidden="true">` внутри секции: 18s, 22s, 26s; фоны — повторяющиеся `radial-gradient` точек 0.7–1.8px цветов `horizon-200`, `unity-200`, `signal-300` с шагами `97×113`, `139×157`, `179×193`, `257×233` |
| Звёздный фон (статичный) | отдельный слой `radial-gradient` точек без анимации, `opacity: .28` |

`@media (prefers-reduced-motion: reduce)`: частицы — `animation: none`, `opacity: .28`; панель раскрывается мгновенно (`transition: none`); обложка новости не масштабируется; карточка ресурса не сдвигается; скролл к секции `behavior: "auto"`. Reveal-анимации `motion` добавит фаза 5 — фаза 4 их не ставит.

---

## Accessibility Contract

- Зона касания любого управляющего элемента ≥ 44×44px; карточка новости и карточка ресурса кликабельны целиком.
- Карточка ресурса: `aria-expanded`, `aria-controls="resources-panel"`; панель: `role="region"`, `aria-labelledby`, `tabIndex={-1}`; Esc закрывает и возвращает фокус на карточку.
- Пагинация: `nav[aria-label]`, `aria-current="page"`, `aria-label="Страница N"`, `aria-label="Следующая страница"`, скрытый `role="status"` со строкой «Страница N из M».
- Внешние ссылки: `target="_blank" rel="noopener noreferrer"`.
- Декоративная графика (карта мира, частицы, скрим, постеры) — `aria-hidden="true"` или `alt=""`.
- Порядок заголовков: `h2` секции → `h3` заголовки карточек новостей, карточек ресурсов и панели.
- Контраст текста на фоне не ниже 4.5:1; цветные акценты несут только декоративную нагрузку, состояние дублируется рамкой, ореолом и ARIA.
- Ни одна секция не даёт горизонтального скролла на 390, 768, 1024 и 1440px.

---

## Asset Contract

| Актив | Источник | Правило |
|-------|----------|---------|
| Обложки новостей | `https://img.youtube.com/vi/{id}/hqdefault.jpg` | 9 роликов ЕАД, `loading="lazy"`, при ошибке — градиентная плашка с текстом «Обложка недоступна» |
| Постеры видео | `https://img.youtube.com/vi/{id}/hqdefault.jpg` | 16 роликов из `data/videos.ts` |
| Плеер | `https://www.youtube-nocookie.com/embed/{id}` | только после клика |
| Силуэт карты | `world-atlas/countries-110m.json` через `lib/geo.ts` | статичный SVG, без интерактива |
| Иконки | inline SVG в репозитории | внешних иконочных пакетов нет |

Хотлинк с `images.hopesoftware.org` и любых других CDN запрещён (ограничение PROJECT.md).

---

## Отклонения от CONTEXT

| Пункт CONTEXT | Контракт | Причина |
|---------------|----------|---------|
| Описания карточек и подписи 14px | 16px (Body) | четырёхступенчатая шкала кеглей; 14px читается хуже на тёмном фоне |
| Цитата `text-xl md:text-2xl` (20/24px) | 22px (Heading), вес Onest 700 сохранён | тот же аргумент; шкала остаётся из четырёх размеров |
| «Материалы» в колонках 9–12 | колонки 10–12 | при 9–12 карточка накладывалась на центральный блок (колонки 5–9) в рядах 2–3 |
| Триггер «Открыть …» описан как ссылка | `<span>` внутри карточки-кнопки | вложенный интерактивный элемент внутри `<button>` невалиден и ломает клавиатуру |

Всё остальное из `04-CONTEXT.md` перенесено без изменений.

---

## Contract Checks

Что подтверждают тесты фазы (`Vitest` + Testing Library):

- `paginate.test.ts`: 9 элементов и `perPage = 6` дают 2 страницы, вторая содержит 3; `page` вне диапазона зажимается.
- `News.test.tsx`: 6 карточек на первой странице, 3 на второй; активная кнопка несёт `aria-current="page"`; все ссылки с `rel="noopener noreferrer"`.
- `Resources.test.tsx`: клик по «Материалы» ставит `aria-expanded="true"` и показывает 5 ссылок; повторный клик закрывает; клик по «Видео» переключает панель и рендерит 16 фасадов.
- `Quote.test.tsx` *(принято по умолчанию)*: два абзаца и подпись «Эллен Уайт, «Евангелизм», стр. 122»; SVG карты `aria-hidden`.

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | не используется | not applicable — shadcn в проекте не инициализирован |
| third-party | нет | not applicable — сторонние реестры не объявлены |

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS

**Approval:** pending
