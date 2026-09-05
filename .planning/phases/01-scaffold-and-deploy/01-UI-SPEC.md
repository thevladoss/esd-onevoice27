---
phase: 1
slug: scaffold-and-deploy
status: draft
shadcn_initialized: false
preset: none
created: 2026-09-05
---

# Phase 1 — UI Design Contract

> Визуальный и интеракционный контракт фазы 1. Фаза задаёт дизайн-систему всего лендинга: токены, типографику, ритм отступов, примитивы, стеклянный header со скосом, footer с волнами и восемь секций-заглушек. Фазы 2–5 наследуют этот контракт и не переопределяют токены.

---

## Источники контракта

| Источник | Что взято |
|----------|-----------|
| `01-CONTEXT.md` | Все решения по header, footer, токенам, примитивам, структуре секций. Заблокированы, переопределению не подлежат |
| `REQUIREMENTS.md` (SHELL-01…SHELL-06) | Тексты меню, состав footer, обязательные атрибуты `index.html` |
| `docs/research/orig-custom-styles.css` | Значения оригинала: `--ov-header-*` (строки 503–585), footer и keyframes (2486–2680), градиент заголовка секции (1329–1339), стеклянная карточка (1355–1400), кнопка hero (2839–2900) |
| `.planning/research/FEATURES.md` | Стекло, скосы, градиенты, дрейф волн отмечены как обязательные дифференциаторы |
| Умолчания | Отмечены пометкой «принято по умолчанию» прямо у значения |

**Пользователь недоступен, вопросы не задавались.** Каждое незакрытое значение закрыто из оригинала или разумным умолчанием.

### Умолчания, принятые в этом документе

| Значение | Почему |
|----------|--------|
| `--color-unity-950: #141833` | CONTEXT ссылается на `unity-950` в градиенте оверлея, но hex не задаёт. Взят тёмный конец индиго-семейства между `#3b4da1` и `#120c34` |
| Onest 700 вместо «Onest 650» в пунктах меню | Подключены статические начертания `400;700;800;900`, 650 отрисуется как 700. Фиксируем 700 явно |
| Скос header только на `≥1024px` | В оригинале `skewX` живёт в desktop-медиазапросе (строка 412–428), на планшете пилюля прямая с radius 12px |
| Клиновидный верх footer `clamp(24px, 3vw, 44px)` | Оригинал, строки 2504–2509. CONTEXT его не упоминает, но без него footer прилипает к секции цитаты |
| Skip-link «Перейти к содержимому» | Обязательная доступность для фиксированного header, в CONTEXT не описан |
| CTA «Зажечь свой свет» в заглушке `#hero` | Примитив `Button variant="primary"` иначе не отрисуется ни разу в фазе 1 и уедет в фазу 2 непроверенным |
| Насыщенности 400 / 700 как рабочая пара, 900 только для вордмарка и H1 | Требование «две насыщенности» соблюдено, 900 вынесена в явный reserved-for список |

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none (собственные токены в `@theme`, без shadcn) |
| Preset | not applicable |
| Component library | none (собственные примитивы в `src/components/layout/`) |
| Icon library | none (бургер и стрелки рисуются инлайн-SVG и CSS, внешних иконок фаза 1 не тянет) |
| Font | Onest (display, 400/700/900) + Noto Sans (body, 400/700), Google Fonts |
| Styling | Tailwind CSS v4, конфигурация в CSS через `@theme`, без `tailwind.config.js` |

**Почему не shadcn.** CONTEXT зафиксировал собственные примитивы и палитру оригинала onevoice27.org. shadcn привёл бы вторую систему токенов (`--background`, `--foreground`, нейтральный radius) поверх уже описанной и создал бы конфликт источников правды. Гейт инициализации отработан, решение: `Tool: none`. Раздел Registry Safety ниже это фиксирует.

### Подключение шрифтов

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Onest:wght@400;700;800;900&family=Noto+Sans:wght@400;700&display=swap" rel="stylesheet">
```

Начертание Onest 800 подключено про запас для H1 фазы 2. В фазе 1 не используется.
Fallback при недоступности Google Fonts: `sans-serif` системного стека, вёрстка не должна ломаться (`font-display: swap` уже в URL).

---

## Токены

Файл `src/styles/tokens.css`, импортируется из `global.css` после `@import "tailwindcss"`.

```css
@theme {
  /* Палитра */
  --color-midnight-950: #070210;   /* фон страницы */
  --color-midnight-900: #120c34;   /* нижняя грань стекла, низ футера */
  --color-midnight-800: #211a3e;   /* верх футера, приподнятые поверхности */
  --color-unity-950:    #141833;   /* принято по умолчанию: низ градиента оверлея меню */
  --color-unity-700:    #303f83;   /* верхняя грань стекла */
  --color-unity-500:    #3b4da1;   /* середина брендового градиента */
  --color-signal-600:   #9e439a;
  --color-signal-400:   #bb6cae;
  --color-signal-300:   #d28ebe;   /* начало брендового градиента */
  --color-horizon-600:  #54a4ac;
  --color-horizon-400:  #7bc2c7;   /* конец брендового градиента */
  --color-horizon-200:  #aad9dc;   /* eyebrow, hover меню, кольцо фокуса */
  --color-paper:        #f8f7fb;   /* весь текст */

  /* Шрифты */
  --font-display: "Onest", "Noto Sans", sans-serif;
  --font-body: "Noto Sans", sans-serif;

  /* Размеры текста */
  --text-xs: 0.75rem;                                 /* 12px */
  --text-sm: 0.875rem;                                /* 14px */
  --text-base: 1rem;                                  /* 16px */
  --text-section: clamp(1.875rem, 4vw, 3rem);         /* 30 → 48px, как H2 оригинала (48px) */
  --text-wordmark: clamp(1.125rem, 2.2vw, 1.375rem);  /* 18 → 22px, только вордмарк */
  --text-tagline: 0.625rem;                           /* 10px, только «МИССИЯ ДЛЯ ВСЕХ» */

  /* Радиусы */
  --radius-card: 16px;
  --radius-header: 18px;          /* пилюля ≥768px */
  --radius-header-compact: 12px;  /* пилюля <768px */
  --radius-pill: 999px;

  /* Тени */
  --shadow-card:
    0 30px 72px rgb(18 12 52 / .62),
    0 10px 24px rgb(18 12 52 / .42),
    inset 0 1px 0 rgb(248 247 251 / .08);
  --shadow-header:
    0 3px 7px rgb(5 3 20 / .28),
    0 18px 42px rgb(5 3 20 / .30),
    0 8px 34px rgb(48 63 131 / .13);
  --shadow-header-mobile: 0 12px 28px rgb(5 3 20 / .22);
  --shadow-button: 0 10px 30px rgb(59 77 161 / .34);

  /* Движение */
  --ease-ui: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-header: cubic-bezier(0.32, 0.72, 0, 1);
}

/* Переменные без утилит Tailwind, объявляются в :root внутри global.css */
:root {
  --glass-border: rgb(184 192 230 / .22);
  --glass-surface: linear-gradient(145deg, rgb(48 63 131 / .86), rgb(18 12 52 / .76));
  --gradient-brand: linear-gradient(104deg, #d28ebe 0%, #3b4da1 52%, #7bc2c7 100%);
  --gradient-title: linear-gradient(104deg, #e3afd2 2%, #8f9dd6 52%, #7bc2c7 98%);
  --gradient-action: linear-gradient(125deg, #6c2c68 0%, #3b4da1 50%, #39727e 100%);
  --header-skew-inset: 16px;
  --footer-wedge: clamp(24px, 3vw, 44px);
  --dur-ui: 240ms;
  --dur-header: 420ms;
  --dur-underline: 360ms;
}
```

Namespace `--color-*`, `--font-*`, `--text-*`, `--radius-*`, `--shadow-*`, `--ease-*` порождают утилиты Tailwind v4 (`bg-midnight-950`, `text-section`, `rounded-card`, `shadow-card`, `ease-ui`). Переменные из `:root` утилит не порождают и вставляются через `var()` в `@utility` и в стили компонентов.

---

## Spacing Scale

Все значения кратны 4. Базовый шаг Tailwind v4 (`--spacing: 0.25rem`) не переопределяем.

| Токен | Значение | Tailwind | Usage |
|-------|----------|----------|-------|
| xs | 4px | `1` | Зазор между линиями бургера, offset кольца фокуса |
| sm | 8px | `2` | Вордмарк: заголовок ↔ подпись; внутренний зазор чипов |
| md | 16px | `4` | Базовый зазор; отступ пилюли от краёв ≥768px; горизонтальный padding `Section` на мобильном; поправка `-16px` в формуле скролла |
| lg | 24px | `6` | Внутренние отступы `GlassCard`; зазор между пунктами меню; порог скролла для уплотнения пилюли |
| xl | 32px | `8` | Горизонтальный padding пилюли на десктопе; горизонтальный padding `Section` ≥768px; зазор колонок footer |
| 2xl | 48px | `12` | Вертикальные отступы внутри footer; размер кнопки-бургера 48×48 |
| 3xl | 64px | `16` | Вертикальный ритм `Section` на мобильном (`py-16`) |
| 4xl | 96px | `24` | Вертикальный ритм `Section` ≥768px (`py-24`); `scroll-padding-top: 96px` |

**Дополнительные кратные 4 значения в фазе 1:** 12px (отступ пилюли от краёв <768px, вертикальный padding пилюли в уплотнённом состоянии), 20px (вертикальный padding пилюли в покое), 28px (внутренняя ширина линии бургера), 40px (горизонтальный padding `Button`).

**Exceptions (не отступы, кратности 4 не требуют):**

| Значение | Где |
|----------|-----|
| 1.5px | Толщина рамки пилюли и линий бургера (`--ov-header-border-width` оригинала) |
| 18px / 12px / 999px | Радиусы пилюли и кнопки |
| 10px | `--text-tagline`, размер подписи «МИССИЯ ДЛЯ ВСЕХ» (заблокировано в CONTEXT) |
| `clamp(24px, 3vw, 44px)` | Глубина клина в верхней грани footer |

---

## Typography

Два семейства, рабочая пара насыщенностей **400 / 700**. Насыщенность **900** зарезервирована и применяется только к двум элементам (список ниже).

| Role | Token | Size | Family | Weight | Line Height | Letter Spacing |
|------|-------|------|--------|--------|-------------|----------------|
| Body | `--text-base` | 16px | Noto Sans | 400 | 1.6 | 0 |
| Label | `--text-sm` | 14px | Noto Sans | 700 | 1.2 | 0.08em, uppercase |
| Heading | `--text-section` | clamp 30 → 48px | Onest | 900 | 1.05 | -0.035em |
| Display | `--text-wordmark` | clamp 18 → 22px | Onest | 900 | 1.05 | -0.02em |

**Микротекст** (`--text-xs`, 12px, Noto Sans 700, line-height 1.4, letter-spacing 0.1em, uppercase) обслуживает `Eyebrow` и юридическую строку footer (у неё letter-spacing 0, line-height 1.7, насыщенность 400).

**Насыщенность 900 разрешена только здесь:**
1. Вордмарк «Единый голос 27» в header.
2. Вордмарк «Единый голос 27» в footer.
3. (фаза 2) H1 hero «Вместе, единым голосом».
4. H2 секций через `GradientTitle variant="section"` (`--text-section`) — как в оригинале onevoice27.org (замерено: h2 font-weight 900, 48px).
5. (фаза 2) Числа счётчиков «Человек» / «Групп» (в оригинале 900, 72px).
6. (фаза 3) Номера карточек 1/2/3 в «О проекте».

**Насыщенность 900 запрещена** в кнопках, пунктах меню, заголовках карточек, тексте. Решение принято оркестратором 2026-09-05 при сведении контрактов фаз 1–3 (ранее было 700 для H2).

### Раскладка по элементам фазы 1

| Элемент | Токен | Family / Weight | Детали |
|---------|-------|-----------------|--------|
| Вордмарк | `--text-wordmark` | Onest 900 | `background: var(--gradient-brand)`, `background-clip: text`, `-webkit-text-fill-color: transparent` |
| Подпись «МИССИЯ ДЛЯ ВСЕХ» | `--text-tagline` (10px) | Noto Sans 700 | uppercase, letter-spacing 0.2em, цвет `rgb(248 247 251 / .8)` |
| Пункт меню | `--text-base` | Onest 700 | uppercase, letter-spacing 0.02em, цвет `rgb(248 247 251 / .9)` |
| Пункт меню в оверлее | `clamp(1.25rem, 6vw, 1.75rem)` | Onest 700 | uppercase, letter-spacing 0.02em, line-height 1.2 |
| `Eyebrow` | `--text-xs` | Noto Sans 700 | uppercase, letter-spacing 0.1em, цвет `horizon-200` |
| `GradientTitle` (h2) | `--text-section` | Onest 900 | `var(--gradient-title)` через `background-clip: text`, `text-wrap: balance`, letter-spacing -0.035em, line-height 1.05, `padding-bottom: .12em` |
| Текст заглушки секции | `--text-base` | Noto Sans 400 | line-height 1.6, `max-width: 54ch`, цвет `rgb(248 247 251 / .72)` |
| `Button` (обе вариации) | `--text-sm` | Noto Sans 700 | uppercase, letter-spacing 0.08em, line-height 1.2 |
| Подпись footer | `--text-sm` | Noto Sans 400 | line-height 1.6, цвет `rgb(248 247 251 / .82)` |
| Ссылки footer | `--text-sm` | Noto Sans 700 | line-height 1.6, цвет `paper`, hover `horizon-200` |
| Юридическая строка | `--text-xs` | Noto Sans 400 | line-height 1.7, цвет `rgb(248 247 251 / .72)`, `text-wrap: balance` |

Минимальная непрозрачность текста на фоне midnight: **0.72**. Ниже контраст падает под 4.5:1.

---

## Color

Тёмная тема, одна и единственная. Светлой темы в проекте нет.

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | `--color-midnight-950` `#070210` | Фон `body`, поверхность пилюли (`rgb(7 2 16 / .77)`), верх оверлея меню |
| Secondary (30%) | `--color-unity-700` `#303f83` → `--color-midnight-900` `#120c34` | Стеклянные поверхности (`--glass-surface`), фон footer (`180deg #211a3e → #120c34`), поверхность оверлея |
| Accent (10%) | `--color-signal-400` `#bb6cae` (маджента) с переходом в `--color-horizon-400` `#7bc2c7` (бирюза) через `--color-unity-500` | Только список ниже |
| Focus / hover сигнал | `--color-horizon-200` `#aad9dc` | Кольцо `:focus-visible`, hover пунктов меню и ссылок footer, цвет `Eyebrow` |
| Destructive | не используется | В фазе 1 нет ни одного разрушающего действия |
| Текст | `--color-paper` `#f8f7fb` | Весь текст, непрозрачность 0.72–1.0 |

### Accent reserved for

Акцент занимает не больше 10% площади экрана. Разрешён ровно в семи местах:

1. Градиент вордмарка в header и footer (`--gradient-brand` через `background-clip: text`).
2. Световая полоса по верхней грани пилюли: `linear-gradient(90deg, rgb(187 108 174 / .82), rgb(59 77 161 / .42) 43%, rgb(84 164 172 / .76))`, высота 1.5px.
3. Подчёркивание пункта меню при `:hover` и при `aria-current="true"`: `linear-gradient(90deg, var(--color-signal-400), var(--color-horizon-400))`, высота 1.5px, `transform: scaleX()` от 0 до 1 за `--dur-underline`.
4. Заливка `Button variant="primary"`: `--gradient-action`.
5. Градиент `GradientTitle`: `--gradient-title`.
6. Гало и волны footer (непрозрачность 0.10–0.25, декоративный фон).
7. Радиальные пятна в оверлее мобильного меню: signal-600 / .22 в точке 14% 18%, horizon-600 / .18 в точке 88% 78%.

**Акцент запрещён** на: обычном тексте, границах карточек, фонах секций, иконке бургера, разделителях, юридической строке. Границы стеклянных поверхностей всегда `--glass-border`, никогда не цветные.

### Контраст

| Пара | Ratio | Статус |
|------|-------|--------|
| `paper` на `midnight-950` | ~18.9:1 | AAA |
| `paper / .9` на пилюле `midnight-950 / .77` | ~15:1 | AAA |
| `paper / .72` на `midnight-900` | ~8.9:1 | AAA |
| `horizon-200` на `midnight-950` | ~11.4:1 | AAA |
| `horizon-200` (кольцо фокуса) на `midnight-950` | ~11.4:1 | Нетекстовый контраст пройден |
| Белый текст на `--gradient-action` (тёмная точка `#6c2c68`) | ~7.6:1 | AAA |

---

## Layout

| Параметр | Значение |
|----------|----------|
| Контентная ширина | `max-width: 72rem` (1152px), центрирование `margin-inline: auto` |
| Padding `Section` | `py-16 px-4` на мобильном, `py-24 px-8` от 768px |
| Заглушка секции | `min-height: 40vh` |
| `scroll-padding-top` | 96px на `html` |
| Целевые ширины | 390, 768, 1024, 1440. Горизонтального скролла быть не должно ни на одной |

### Брейкпоинты

| Имя | Ширина | Что меняется |
|-----|--------|--------------|
| base | < 768px | Бургер и оверлей, пилюля 12px от краёв, radius 12px, без скоса, footer в стек |
| `md` | ≥ 768px | Горизонтальное меню, пилюля 16px от краёв, radius 18px, footer в две колонки, `Section` `py-24 px-8` |
| `lg` | ≥ 1024px | Скос пилюли 20° через `clip-path`, горизонтальный padding пилюли 32px |

### Z-index

| Слой | Значение |
|------|----------|
| Skip-link при фокусе | 60 |
| Header | 50 |
| Оверлей мобильного меню | 45 |
| Контент секций | 1 |
| Гало и волны footer | -1 и -2 внутри `isolation: isolate` |

---

## Motion

| Что | Длительность | Кривая | Свойства |
|-----|--------------|--------|----------|
| Уплотнение пилюли при скролле > 24px | `--dur-header` 420ms | `--ease-header` | `padding-block`, `box-shadow` |
| Наведение и фокус UI (ссылки, кнопки, бургер) | `--dur-ui` 240ms | `--ease-ui` | `color`, `border-color`, `box-shadow`, `transform` |
| Подчёркивание пункта меню | `--dur-underline` 360ms | `--ease-ui` | `transform: scaleX()` |
| Открытие и закрытие оверлея | 240ms | `--ease-ui` | `opacity`, `transform: translateY(-8px) → 0`, `visibility` с задержкой на закрытии |
| Дрейф волн footer | 28s, `infinite alternate` | `linear` (по CONTEXT; в оригинале `ease-in-out`, строка 2533) | `background-position` |
| Дрейф гало footer | 22s, `infinite alternate` | `ease-in-out` | `transform: translate3d + scale` |
| Плавная прокрутка к якорю | нативная | нативная | `window.scrollTo({ behavior: "smooth" })` |

### Reduced motion

Блок `@media (prefers-reduced-motion: reduce)` в `global.css` обязан выключить:

- `footer-wave-drift` и `footer-halo-drift` (`animation: none`), гало возвращается в `transform: translateX(-50%)`.
- Плавный скролл: `behavior: "auto"` в `scrollToSection` (флаг читается через `window.matchMedia("(prefers-reduced-motion: reduce)")`).
- Переходы уплотнения пилюли и оверлея сокращаются до 1ms, конечные состояния сохраняются.

Наведение и фокус (смена цвета) остаются: это не движение.

---

## Component Inventory

Восемь компонентов фазы 1. Каждый в своём файле, один экспорт.

### `Header` (`src/components/layout/Header.tsx`)

**Визуальный контракт**

| Свойство | Значение |
|----------|----------|
| Позиция | `position: fixed`, `inset-inline: 12px` (<768px) / `16px` (≥768px), `top` тот же, `max-width: 72rem`, `margin-inline: auto`, `z-index: 50` |
| Поверхность | `background: linear-gradient(180deg, rgb(255 255 255 / .07), transparent 42%), rgb(7 2 16 / .77)` |
| Стекло | `backdrop-filter: blur(18px) saturate(135%)` плюс `-webkit-` префикс |
| Рамка | `1.5px solid var(--glass-border)` |
| Радиус | `--radius-header-compact` (<768px), `--radius-header` (≥768px) |
| Тень | `--shadow-header-mobile` (<768px), `--shadow-header` (≥768px) |
| Скос | Только `≥1024px`: `clip-path: polygon(var(--header-skew-inset) 0, 100% 0, calc(100% - var(--header-skew-inset)) 100%, 0 100%)` у внешней оболочки, `--header-skew-inset: 16px` (≈ 20° при высоте пилюли 88px). Внутренний контент не скошен, горизонтальный padding увеличивается на `--header-skew-inset` |
| Высота ряда | Внутренний ряд `min-height: 48px` |
| Padding | `padding-block: 20px` в покое, `12px` после скролла > 24px; `padding-inline: 20px` (<768px), `32px` (≥1024px, плюс компенсация скоса) |
| Верхняя световая полоса | `::before`, высота 1.5px, градиент из пункта 2 списка Accent reserved for |

**Интеракционный контракт**

| Событие | Поведение |
|---------|-----------|
| Скролл > 24px | `padding-block` 20 → 12px, тень усиливается. Слушатель на `scroll` с `{ passive: true }` |
| Клик по пункту меню | `event.preventDefault()`; `top = el.offsetTop - headerHeight - 16`; `window.scrollTo({ top, behavior: reducedMotion ? "auto" : "smooth" })`. `scrollIntoView` не использовать. На мобильном оверлей закрывается перед прокруткой |
| Цель якоря отсутствует | Ничего не делать, ошибку в консоль не писать, `location.hash` не менять |
| Активная секция | `IntersectionObserver` по восьми секциям, `aria-current="true"` у соответствующего пункта. Только `≥768px` |
| Клик по вордмарку | Переход на `#top`, прокрутка в 0 по той же формуле |

**Разметка и доступность**

- `<header>` содержит `<nav aria-label="Основная навигация">`.
- Пункты: `Что это?` → `#about`, `Участвовать` → `#involve`, `Новости` → `#news`, `Материалы` → `#resources`.
- Вордмарк: `<a href="#top">` с `aria-label="Единый голос 27, на главную"`.
- `:focus-visible` на всех интерактивных элементах: `outline: 2px solid var(--color-horizon-200); outline-offset: 4px`.

### `BurgerButton` (внутри Header)

| Свойство | Значение |
|----------|----------|
| Размер | 48×48px, видна только `<768px` |
| Линии | Три полосы шириной 28px, высотой 1.5px, зазор 4px, цвет `paper`, `border-radius: 999px` |
| Поверхность | `rgb(7 2 16 / .28)`, рамка `rgb(248 247 251 / .2)`, радиус 12px |
| Hover | Цвет линий `horizon-200`, рамка `rgb(170 217 220 / .58)`, поверхность `rgb(48 63 131 / .34)` |
| Анимация | Открытие: верхняя и нижняя линии сходятся в крест, средняя гаснет, 240ms `--ease-ui` |
| ARIA | `aria-expanded`, `aria-controls="mobile-menu"`, `aria-label` переключается: `Открыть меню` / `Закрыть меню` |

### `MobileMenu` (оверлей, внутри Header)

| Свойство | Значение |
|----------|----------|
| Геометрия | `position: fixed; inset: 0; z-index: 45`, padding `clamp(24px, 7vw, 56px)`, верхний padding `calc(88px + 16px)` |
| Фон | `radial-gradient(circle at 14% 18%, rgb(158 67 154 / .22), transparent 38%), radial-gradient(circle at 88% 78%, rgb(84 164 172 / .18), transparent 42%), linear-gradient(145deg, rgb(7 2 16 / .98), rgb(20 24 51 / .97))` |
| Стекло | `backdrop-filter: blur(24px) saturate(125%)` |
| Пункты | Вертикальный стек, разделители `1px solid rgb(248 247 251 / .12)`, высота строки не меньше 48px |
| Переход | `opacity` и `translateY(-8px)`, 240ms `--ease-ui`; `visibility: hidden` с задержкой 240ms на закрытии |

**Интеракционный контракт**

| Событие | Поведение |
|---------|-----------|
| Открытие | `document.body.style.overflow = "hidden"`, фокус переходит на первый пункт |
| Esc | Закрывает, фокус возвращается на бургер |
| Клик по фону | Закрывает |
| Клик по пункту | Закрывает, затем прокручивает |
| Tab / Shift+Tab | Фокус-трап по кругу внутри оверлея, включая кнопку закрытия |
| Закрытие | `document.body.style.overflow` восстанавливается в исходное значение, а не в пустую строку вслепую |
| Ресайз ≥768px при открытом меню | Меню закрывается, скролл разблокируется |

Разметка: `<div id="mobile-menu" role="dialog" aria-modal="true" aria-label="Меню">`.

### `Footer` (`src/components/layout/Footer.tsx`)

| Свойство | Значение |
|----------|----------|
| Верхняя грань | `clip-path: polygon(0 var(--footer-wedge), 100% 0, 100% 100%, 0 100%)`, `margin-top: calc(-1 * var(--footer-wedge))`, `--footer-wedge: clamp(24px, 3vw, 44px)` (принято по умолчанию, оригинал строки 2494–2509) |
| Фон | `linear-gradient(180deg, #211a3e, #120c34)` |
| Волны | Четыре слоя на фоне элемента: два радиальных гало (`circle at 18% 12%` signal-600 / .14, `circle at 82% 24%` unity-500 / .13) и две эллиптические волны (`ellipse at 50% 100%` и `ellipse at 54% 106%`, `rgb(48 63 131 / .16)`, размеры 108% и 112%). Анимация `footer-wave-drift 28s linear infinite alternate` по `background-position` |
| Гало | `::before`, `width: min(760px, 92vw)`, `aspect-ratio: 1.8`, `radial-gradient(circle at 34% 46%, rgb(158 67 154 / .25), transparent 38%)` плюс horizon-600 / .10, `filter: blur(32px)`, `opacity: .78`, `transform: translateX(-50%)`, анимация `footer-halo-drift 22s ease-in-out infinite alternate` |
| Изоляция | `position: relative; isolation: isolate; overflow: hidden`, слои на `z-index: -1` и `-2` |
| Padding | `padding-block: clamp(72px, 10vw, 124px)`, контент `max-width: 72rem`, `padding-inline: 16px` / `32px` от 768px |
| Раскладка | `<768px` стек с зазором 32px; `≥768px` две колонки: вордмарк с подписью слева, ссылки справа, зазор 32px |
| Разделитель | `border-top: 1px solid rgb(248 247 251 / .12)`, отступ сверху 48px, под ним юридическая строка |

```css
@keyframes footer-wave-drift {
  from { background-position: 0 0, 0 0, -2vw 0, 2vw 0; }
  to   { background-position: 2vw 1vw, -2vw 1vw, 2vw -1vw, -2vw 1vw; }
}
@keyframes footer-halo-drift {
  from { transform: translate3d(-52%, 0, 0) scale(0.98); }
  to   { transform: translate3d(-48%, 7%, 0) scale(1.06); }
}
```

Внешние ссылки: `target="_blank" rel="noopener noreferrer"` плюс визуально скрытый текст «(откроется в новой вкладке)». Обёртка `<nav aria-label="Внешние ссылки">`.

### `Section` (`src/components/layout/Section.tsx`)

Props: `id`, `eyebrow?`, `title?`, `children`, `className?`.
Рендерит `<section id>` с `max-width: 72rem`, `margin-inline: auto`, `py-16 md:py-24 px-4 md:px-8`. При наличии `eyebrow` рендерит `Eyebrow`, при наличии `title` — `GradientTitle as="h2"`. Зазор eyebrow → title 8px, title → контент 24px. `scroll-margin-top` не нужен, прокрутку считает Header.

### `Eyebrow` (`src/components/layout/Eyebrow.tsx`)

`<p>` с `--text-xs`, Noto Sans 700, uppercase, letter-spacing 0.1em, line-height 1.4, цвет `horizon-200`.

### `GradientTitle` (`src/components/layout/GradientTitle.tsx`)

Props: `as: "h1" | "h2"`, `variant: "hero" | "section"`, `children`.
`section`: `--gradient-title`, `--text-section`, Onest 900, letter-spacing -0.035em, line-height 1.05, `padding-bottom: .12em` (защита выносных при `background-clip: text`).
`hero`: градиент оригинала (`--ov-hero-title-gradient`, строки 617–632), Onest 900, `clamp(2.75rem, 8vw, 4.5rem)`, letter-spacing -0.055em, line-height 0.94. В фазе 1 объявлен, но не используется — фаза 2 берёт готовым.
Обе вариации: `background-clip: text`, `-webkit-text-fill-color: transparent`, `box-decoration-break: clone`, `text-wrap: balance`, `padding: 0.08em 0 0.12em` и компенсирующие отрицательные `margin`, чтобы выносные элементы кириллицы не срезались.

### `Button` (`src/components/layout/Button.tsx`)

Props: `variant: "primary" | "ghost"`, `as: "a" | "button"`, остальные пробрасываются.

| Свойство | primary | ghost |
|----------|---------|-------|
| Фон | `--gradient-action` | `transparent` |
| Рамка | нет | `1.5px solid var(--glass-border)` |
| Цвет | `paper` | `rgb(248 247 251 / .9)` |
| Радиус | `--radius-pill` | `--radius-pill` |
| Padding | `16px 40px` | `16px 32px` |
| Тень | `--shadow-button` плюс `inset 0 0 0 1px rgb(255 255 255 / .12)` | нет |
| Минимальная высота | 52px | 48px |
| Типографика | `--text-sm`, Noto Sans 700, uppercase, letter-spacing 0.08em | то же |
| Hover | `transform: translateY(-2px)`, тень усиливается | рамка `rgb(170 217 220 / .58)`, цвет `horizon-200` |
| Active | `transform: translateY(0)` | то же |
| Focus | `outline: 2px solid var(--color-horizon-200); outline-offset: 4px` | то же |
| Disabled | `opacity: .5; cursor: not-allowed`, hover не срабатывает | то же |

Вращающийся луч по границе (conic-gradient плюс `@property --beam`) добавляет фаза 2. В фазе 1 у primary статичная заливка.

### `GlassCard` (`src/components/layout/GlassCard.tsx`)

| Свойство | Значение |
|----------|----------|
| Фон | `linear-gradient(145deg, rgb(255 255 255 / .045), transparent 30%), var(--glass-surface)` |
| Рамка | `1px solid var(--glass-border)` |
| Радиус | `--radius-card` (16px) |
| Тень | `--shadow-card` |
| Стекло | `backdrop-filter: blur(14px) saturate(112%)` |
| Padding | 24px, `32px` от 768px |
| Внутренний свет | `::before` с `inset 1px 1px 0 rgb(255 255 255 / .06)` и `inset -1px -1px 0 rgb(7 2 16 / .35)`, `opacity: .58` |
| Hover | Рамка `rgb(184 192 230 / .34)`, тень усиливается, 240ms `--ease-ui`. Только когда карточка интерактивна |

### `SkipLink` (принято по умолчанию, `src/components/layout/SkipLink.tsx`)

Первый фокусируемый элемент документа. Визуально скрыт до фокуса (`clip-path: inset(50%)`), при `:focus-visible` появляется в левом верхнем углу с `z-index: 60`, поверхностью `midnight-900`, рамкой `horizon-200`, padding 12px 24px, радиусом 12px. Ведёт на `#main`.

### Утилиты в `global.css`

```css
@utility glass { /* фон, рамка, радиус, тень, backdrop-filter из таблицы GlassCard */ }
@utility text-gradient-brand { /* --gradient-brand + background-clip: text */ }
@utility focus-ring { /* outline: 2px solid var(--color-horizon-200); outline-offset: 4px */ }
```

---

## Copywriting Contract

Весь текст живёт в `src/data/copy.ts`. Фазы 2–4 дописывают свои ключи и не трогают чужие.

### Оболочка

| Элемент | Copy |
|---------|------|
| Вордмарк | `Единый голос 27` |
| Подпись вордмарка | `МИССИЯ ДЛЯ ВСЕХ` |
| Меню | `Что это?` · `Участвовать` · `Новости` · `Материалы` |
| Skip-link | `Перейти к содержимому` |
| Бургер закрыт | `Открыть меню` |
| Бургер открыт | `Закрыть меню` |
| Подпись footer | `Официальный сайт Церкви христиан адвентистов седьмого дня` |
| Ссылка 1 | `Евро-Азиатский дивизион` → `https://esd.adventist.org` |
| Ссылка 2 | `OneVoice27 (глобальный сайт)` → `https://onevoice27.org` |
| Юридическая строка | `© 2026 Евро-Азиатский дивизион Церкви христиан-адвентистов седьмого дня` |

### Primary CTA

| Элемент | Copy |
|---------|------|
| Primary CTA | `Зажечь свой свет` → `#light-form` |

Стоит в заглушке `#hero` (принято по умолчанию), чтобы `Button variant="primary"` отрисовался и попал под тест уже в фазе 1. Фаза 2 переносит эту же кнопку в готовый hero без изменения текста.

### Заглушки секций (empty state фазы 1)

Каждая секция получает eyebrow, заголовок и одну строку о том, что появится. Eyebrow и заголовки финальные, фазы 2–4 заменяют только тело.

| id | Eyebrow | Заголовок | Тело |
|----|---------|-----------|------|
| `hero` | `Единое глобальное движение` | `Вместе, единым голосом` | `Единая весть. Евро-Азиатский дивизион присоединяется к этому движению.` плюс кнопка `Зажечь свой свет` |
| `map` | `Все вместе` | `Зажигаем свет по всему дивизиону` | `Здесь загорится карта двенадцати стран дивизиона со счётчиками участников.` |
| `light-form` | `Участвуйте с нами` | `Зажгите свет` | `Здесь появится форма: выбрать индивидуальный свет или групповой маяк и отметить себя на карте.` |
| `about` | `Глобальное влияние` | `Что такое Единый голос 27?` | `Здесь появится рассказ о сентябре 2027 года и видео о проекте.` |
| `involve` | `Как включиться` | `От убеждения к действию` | `Здесь появятся три пути участия: личное преображение, материалы для церкви и то, чем делиться с другими.` |
| `news` | `На каждом канале` | `Каждая платформа становится голосом` | `Здесь появится лента новостей Евро-Азиатского дивизиона.` |
| `resources` | `Ресурсы` | `Всё, что нужно для старта` | `Здесь появятся музыка, материалы и видео для церквей и групп.` |
| `quote` | `Вдохновение` | `Слово, с которого всё начинается` | `Здесь появится цитата из книги «Евангелизм».` |

Формулировки «в разработке», «coming soon», «TODO» и «lorem ipsum» запрещены. Заглушка говорит, что именно появится, а не извиняется.

### Error state

| Ситуация | Copy |
|----------|------|
| JavaScript отключён (`<noscript>` в `index.html`) | `Для работы сайта нужен JavaScript. Включите его в настройках браузера и обновите страницу.` |
| Google Fonts недоступны | Копии нет. Текст рендерится системным `sans-serif`, вёрстка не смещается (`font-display: swap`) |
| Якорь не найден при клике по меню | Копии нет. Обработчик молча выходит, страница не дёргается, ошибка в консоль не пишется |

Фаза 1 не грузит данные и не отправляет запросы, поэтому сетевых ошибок и состояний загрузки у неё нет.

### Destructive actions

Нет ни одного. Ни удаления, ни сброса, ни необратимых действий. Диалоги подтверждения не нужны.

### Метаданные `index.html`

| Тег | Значение |
|-----|----------|
| `lang` | `ru` |
| `title` | `Единый голос 27 — Евро-Азиатский дивизион` |
| `description` | `Празднование 2000-летия крещения Иисуса и начала Его служения в сентябре 2027 года. Евро-Азиатский дивизион присоединяется к всемирному движению «Единый голос 27».` |
| `theme-color` | `#070210` |
| `og:title` / `og:description` | Совпадают с `title` и `description` |
| `og:type` / `og:url` / `og:locale` | `website` / `https://thevladoss.github.io/esd-onevoice27/` / `ru_RU` |

---

## Accessibility Contract

| Правило | Проверка |
|---------|----------|
| Кольцо фокуса видно на каждом интерактивном элементе | `outline: 2px solid var(--color-horizon-200); outline-offset: 4px`, `outline: none` без замены запрещён |
| Порядок табуляции: skip-link → вордмарк → меню (или бургер) → контент → footer | Ручная проверка на 390 и 1440 |
| Минимальная область нажатия 44×44px | Бургер 48×48, пункты оверлея 48px по высоте, ссылки footer с `padding-block: 8px` |
| Оверлей меню изолирует фокус | `role="dialog"`, `aria-modal="true"`, трап по Tab, возврат фокуса на бургер |
| Один `<h1>` на страницу | В фазе 1 `<h1>` держит заглушка `#hero`, остальные секции используют `<h2>` |
| Ландмарки | `<header>`, `<nav aria-label>`, `<main id="main">`, `<footer>` |
| Декоративные слои не читаются скринридером | Волны, гало, световая полоса рисуются в `::before` / `::after`, у них нет текста и `aria-hidden` не нужен |
| `prefers-reduced-motion` уважается | Волны, гало и плавный скролл выключаются |
| Контраст текста не ниже 4.5:1 | Таблица контраста выше |

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | не используется | not applicable (проект без shadcn) |
| сторонние реестры | не объявлены | not applicable |

Гейт инициализации shadcn отработан 2026-09-05: `components.json` отсутствует, стек Vite + React, дизайн-система зафиксирована в CONTEXT как собственная. Решение `Tool: none`. Сторонние реестры и блоки в фазу не заводятся, поэтому вычитка `shadcn view` не требуется. Единственные внешние ресурсы рантайма: Google Fonts (Onest, Noto Sans) и, начиная с фазы 3, `img.youtube.com` и `youtube-nocookie.com`.

---

## Verification

Что проверяет фаза 1 перед сдачей:

- [ ] На 390, 768, 1024 и 1440px нет горизонтального скролла
- [ ] Пилюля уплотняется при скролле и возвращается обратно
- [ ] Скос пилюли виден на 1440px и отсутствует на 768px
- [ ] Бургер открывает оверлей, Esc и клик по фону закрывают, фокус возвращается на бургер, скролл под оверлеем заблокирован
- [ ] Клик по каждому из четырёх пунктов прокручивает к своей секции, заголовок не уезжает под header
- [ ] Волны и гало footer дрейфуют, при `prefers-reduced-motion: reduce` замирают
- [ ] Кольцо фокуса видно на вордмарке, каждом пункте меню, бургере, кнопке и обеих ссылках footer
- [ ] Все восемь секций присутствуют в DOM с ожидаемыми `id`
- [ ] В консоли собранного билда нет ошибок и 404

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS

**Approval:** pending
