# Оригинал onevoice27.org: CSS шапки, фонов секций и CTA-кнопки

Источник: `docs/research/orig-custom-styles.css` (87 КБ, 2991 строка), скриншоты `orig-vp-*.jpeg`,
DOM-снапшот `orig-snapshot.md`.

## Оговорка про дамп

Файл собран из девяти `<style>`-блоков страницы, три из них обрезаны на 12003 символах:

| Блок | Строки | Содержимое | Состояние |
|---|---|---|---|
| 0 | 1-440 | шапка и мобильное меню | целый |
| 1 | 441-715 | `:root` с переменными | **обрезан** на `--ov-ma` |
| 2 | 716-1138 | карта + форма огонька | **обрезан** внутри `label[for^="LIGHT_TYPE-"]::before` |
| 3 | 1139-1551 | about | целый |
| 4 | 1552-1881 | involve | целый |
| 5 | 1882-2116 | news | целый |
| 6 | 2117-2480 | resources | **обрезан** внутри `@media (min-width: 64rem)` |
| 7 | 2481-2683 | footer | целый |
| 8 | 2684-2991 | hero и CTA | целый |

Из-за обрезки блока 1 переменные `--ov-about-*`, `--ov-involve-*`, `--ov-news-*`, `--ov-resources-*`,
`--ov-footer-*` в дампе не объявлены. Правила footer несут inline-фолбэки, поэтому его цвета
восстановились точно. Для about, involve, news и resources базовые цвета я снял пипеткой со
скриншота `orig-full.jpeg`.

## Палитра оригинала

Оригинал строит цвета из CMS-переменных `--color_bf0jyrdd-*` (signal), `--color_jpfshcvb-*` (unity),
`--color_a7a2ya3x-*` (horizon), `--color_bolhbrje-*` (midnight). Их значения в дамп не попали, но
фолбэки footer раскрывают средние ступени:

```css
--ov-footer-signal-halo:  rgb(224 81 177 / 0.14)   /* signal  ≈ #e051b1 */
--ov-footer-unity-halo:   rgb(91 90 214 / 0.13)    /* unity   ≈ #5b5ad6 */
--ov-footer-horizon-halo: rgb(67 184 208 / 0.10)   /* horizon ≈ #43b8d0 */
--ov-footer-wave:         rgb(54 61 116 / 0.16)
--ov-footer-surface:      rgb(12 11 38)            /* #0c0b26 */
--ov-footer-surface-deep: rgb(5 5 18)              /* #050512 */
--ov-hero-video-background: rgb(7 2 16)            /* #070210 */
```

Наши токены заметно приглушены: `signal-400 #bb6cae` против `#e051b1`, `unity-500 #3b4da1` против
`#5b5ad6`, `horizon-600 #54a4ac` против `#43b8d0`. Пипетка по скриншоту подтверждает базовые
поверхности:

| Секция | Пиксель оригинала | Наш аналог |
|---|---|---|
| hero, map | `rgb(7 5 18)` | `--color-midnight-950 #070210` ✅ |
| about (`rgb(unity-950)`) | `rgb(18 11 52)` | `--color-midnight-900 #120c34` ✅ |
| involve | `rgb(37 23 58)` … `rgb(65 27 66)` слева | `--color-midnight-900` без розового ореола |
| news | `rgb(20 25 57)` | `--color-midnight-900` (у нас темнее и фиолетовее) |
| resources | `rgb(19 15 52)` | `--color-midnight-950` (у нас темнее) |
| footer | `rgb(24 18 56)` | `#211a3e → #120c34` (у нас светлее) |

---

# 1. Шапка и главное меню

## 1.1 Каркас, стекло и градиентная рамка

```css
#ov-main-header {
  position: fixed;
  inset-inline: 0;
  top: 0;
  width: 100%;
  z-index: 40;
  transform: none;
  opacity: 1;
  transition:
    transform var(--ov-header-scroll-duration) var(--ov-header-scroll-easing),
    opacity calc(var(--ov-header-scroll-duration) * 0.72) ease;
}

#ov-main-header.is-header-hidden {
  transform: translateY(calc(-100% - 2rem));
  opacity: 0;
}

#ov-main-header.is-menu-open{
  transform: none;
  opacity: 1;
}

#ov-main-header-content {
  position: relative;
  isolation: isolate;
  display: grid;
  width: 100%;
  max-width: 72rem;
  margin-inline: auto;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  min-height: var(--ov-header-min-height-mobile);
  padding-inline: var(--ov-header-content-padding-mobile);
  border-radius: 0;
  box-shadow: var(--ov-header-shadow-mobile);
}

#ov-main-header-content::before,
#ov-main-header-content::after {
  content: "";
  position: absolute;
  pointer-events: none;
}

#ov-main-header-content::before {
  z-index: 0;
  inset: auto 0 0;
  height: var(--ov-header-mobile-line-width);
  background: linear-gradient(
    90deg,
    var(--ov-header-light-start),
    var(--ov-header-light-middle) 43%,
    rgb(255 255 255 / 0.12) 68%,
    var(--ov-header-light-end)
  );
}

#ov-main-header-content::after {
  z-index: -1;
  inset: 0;
  background:
    linear-gradient(180deg, var(--ov-header-inner-highlight), transparent 42%),
    var(--ov-header-surface);
  -webkit-backdrop-filter: blur(var(--ov-header-blur)) saturate(var(--ov-header-saturation));
  backdrop-filter: blur(var(--ov-header-blur)) saturate(var(--ov-header-saturation));
}
```

Переменные:

```css
:root {
  --ov-header-surface-rgb: var(--ov-midnight-950-rgb);
  --ov-header-surface-opacity: 0.77;
  --ov-header-surface: rgb(var(--ov-header-surface-rgb) / var(--ov-header-surface-opacity));

  --ov-header-blur: 18px;
  --ov-header-saturation: 135%;
  --ov-header-border-width: 1.5px;
  --ov-header-mobile-line-width: 1.5px;
  --ov-header-light-start: rgb(var(--ov-signal-400-rgb) / 0.82);
  --ov-header-light-middle: rgb(var(--ov-unity-500-rgb) / 0.42);
  --ov-header-light-end: rgb(var(--ov-horizon-500-rgb) / 0.76);
  --ov-header-inner-highlight: rgb(255 255 255 / 0.07);

  --ov-header-min-height-mobile: 72px;
  --ov-header-min-height-tablet: 88px;
  --ov-header-min-height-desktop: 80px;
  --ov-header-content-padding-mobile: 20px;
  --ov-header-content-padding-tablet: 28px;
  --ov-header-content-padding-desktop: 32px;
  --ov-header-logo-width-mobile: 146px;
  --ov-header-logo-width-tablet: 169px;
  --ov-header-logo-width-desktop: 159px;
  --ov-header-toggle-size: 48px;
  --ov-header-toggle-icon-width: 28px;
  --ov-header-toggle-color: rgb(var(--ov-midnight-50-rgb));
  --ov-header-toggle-color-hover: rgb(var(--ov-horizon-200-rgb));
  --ov-header-focus-color: rgb(var(--ov-horizon-300-rgb));
  --ov-header-overlay-padding: clamp(24px, 7vw, 56px);
  --ov-header-overlay-blur: 24px;
  --ov-header-overlay-start: rgb(var(--ov-midnight-950-rgb) / 0.98);
  --ov-header-overlay-end: rgb(var(--ov-unity-950-rgb) / 0.97);
  --ov-header-overlay-signal: rgb(var(--ov-signal-600-rgb) / 0.22);
  --ov-header-overlay-horizon: rgb(var(--ov-horizon-600-rgb) / 0.18);
  --ov-header-menu-copy: rgb(var(--ov-midnight-50-rgb) / 0.90);
  --ov-header-menu-copy-hover: rgb(var(--ov-horizon-100-rgb));
  --ov-header-menu-divider: rgb(var(--ov-unity-300-rgb) / 0.18);
  --ov-header-menu-size-desktop: 1rem;
  --ov-header-font-display: "Figtree", sans-serif;
  --ov-header-radius-tablet: 12px;
  --ov-header-radius-desktop: 18px;
  --ov-header-angle: 20deg;
  --ov-header-skew-projection: 44px;
  --ov-header-skew-compensation: 22px;

  --ov-header-shadow-mobile: 0 12px 28px rgb(5 3 20 / 0.22);
  --ov-header-shadow-contact: 0 3px 7px rgb(5 3 20 / 0.28);
  --ov-header-shadow-depth: 0 18px 42px rgb(5 3 20 / 0.30);
  --ov-header-shadow-ambient: 0 8px 34px rgb(var(--ov-unity-600-rgb) / 0.13);
  --ov-header-shadow-skewed:
    drop-shadow(0 3px 7px rgb(5 3 20 / 0.28))
    drop-shadow(0 18px 30px rgb(5 3 20 / 0.24))
    drop-shadow(0 8px 24px rgb(var(--ov-unity-600-rgb) / 0.10));

  --ov-header-transition-duration: 240ms;
  --ov-header-transition-easing: cubic-bezier(0.22, 1, 0.36, 1);
  --ov-header-scroll-duration: 420ms;
  --ov-header-scroll-easing: cubic-bezier(0.32, 0.72, 0, 1);
  --ov-header-menu-hover-duration: 360ms;
}
```

Брейкпоинты:

```css
@media (min-width: 768px) {
  #ov-main-header {
    width: calc(100% - 32px);
  }

  #ov-main-header-content {
    min-height: var(--ov-header-min-height-tablet);
    padding-inline: var(--ov-header-content-padding-tablet);
    border-radius: var(--ov-header-radius-tablet);
    box-shadow: var(--ov-header-shadow-contact), var(--ov-header-shadow-depth), var(--ov-header-shadow-ambient);
  }

  #ov-main-header-content::before {
    z-index: -2;
    inset: 0;
    height: auto;
    border-radius: inherit;
    background: linear-gradient(
      112deg,
      var(--ov-header-light-start),
      var(--ov-header-light-middle) 43%,
      rgb(255 255 255 / 0.12) 68%,
      var(--ov-header-light-end)
    );
  }

  #ov-main-header-content::after {
    inset: var(--ov-header-border-width);
    border-radius: calc(var(--ov-header-radius-tablet) - var(--ov-header-border-width));
  }

  #ov-main-header-logo {
    width: var(--ov-header-logo-width-tablet);
  }

  #ov-main-menu-items {
    padding-block: calc(var(--ov-header-min-height-tablet) + 1rem);
  }
}

@media (min-width: 1280px) {
  #ov-main-header-content {
    min-height: var(--ov-header-min-height-desktop);
    padding-inline: calc(var(--ov-header-content-padding-desktop) + var(--ov-header-skew-compensation));
    border-radius: var(--ov-header-radius-desktop);
    box-shadow: none;
  }

  #ov-main-header-content::before {
    inset-inline: var(--ov-header-skew-compensation);
    transform: skewX(calc(-1 * var(--ov-header-angle)));
    filter: var(--ov-header-shadow-skewed);
  }

  #ov-main-header-content::after {
    inset-block: var(--ov-header-border-width);
    inset-inline: calc(var(--ov-header-skew-compensation) + var(--ov-header-border-width));
    border-radius: calc(var(--ov-header-radius-desktop) - var(--ov-header-border-width));
    transform: skewX(calc(-1 * var(--ov-header-angle)));
  }
}
```

### Как это работает

До 768px шапка занимает всю ширину без радиуса и без боковых отступов: прямоугольная планка,
у которой из декора остаётся розово-бирюзовая линия 1.5px по нижней кромке (`::before`,
`inset: auto 0 0`).

С 768px `::before` переезжает под `::after` (`z-index: -2` против `-1`) и разворачивается на весь
бокс. `::after` поджимается внутрь на `--ov-header-border-width: 1.5px` и красит стекло. Между
краями двух слоёв остаётся кольцо ровно в 1.5px, и там видно градиент `112deg` от signal через
unity и белый блик 12% к horizon. Это и есть градиентная рамка по всему периметру пилюли, которую
видно на скриншоте. `border` в оригинале не используется вообще.

С 1280px оба слоя скашиваются на `skewX(-20deg)`, контент остаётся прямым. Ширина, съеденная
скосом, возвращается через `padding-inline: calc(32px + 22px)` и `inset-inline: 22px`. Тень с
`box-shadow` снимается и заменяется тремя `drop-shadow` в `filter` на скошенном `::before`: иначе
тень легла бы по прямоугольнику, а не по параллелограмму.

Скролл-состояние здесь одно и оно противоположно нашему: класс `.is-header-hidden` уводит шапку
за верхний край (`translateY(calc(-100% - 2rem))`, `opacity: 0`) за 420ms по
`cubic-bezier(0.32, 0.72, 0, 1)`. Уплотнения по скроллу в оригинале нет.

## 1.2 Логотип, бургер, десктопное меню

```css
#ov-main-header-logo {
  position: relative;
  z-index: 2;
  display: block;
  width: min(var(--ov-header-logo-width-mobile), 100%);
  min-width: 0;
  line-height: 0;
  overflow: visible;
}

#ov-main-header-toggler {
  position: relative;
  z-index: 42;
  grid-column: 2;
  justify-self: end;
  width: var(--ov-header-toggle-size);
}

#ov-main-header-toggler > a {
  display: grid;
  width: var(--ov-header-toggle-size);
  height: var(--ov-header-toggle-size);
  place-items: center;
  border: 0;
  border-radius: 0;
  color: var(--ov-header-toggle-color);
  background: transparent;
  -webkit-tap-highlight-color: transparent;
  transition:
    color var(--ov-header-transition-duration) var(--ov-header-transition-easing),
    opacity var(--ov-header-transition-duration) ease;
}

#ov-main-header-toggler > a:hover {
  color: var(--ov-header-toggle-color-hover);
  background: transparent;
}

#ov-main-header-toggler > a:focus-visible {
  outline: 2px solid var(--ov-header-focus-color);
  outline-offset: 3px;
}

.ov-burger-icon {
  display: block;
  width: var(--ov-header-toggle-icon-width) !important;
  height: auto;
  overflow: visible;
}

.ov-burger-icon rect {
  fill: currentColor;
  transform-box: fill-box;
  transform-origin: center;
  transition:
    transform var(--ov-header-transition-duration) var(--ov-header-transition-easing),
    opacity calc(var(--ov-header-transition-duration) * 0.7) ease;
}

#ov-main-header.is-menu-open .ov-burger-line--top,
#ov-main-header.is-menu-open .ov-burger-icon rect:first-child {
  opacity: 0;
  transform: translateY(-8px) scaleX(0.72);
}

#ov-main-header.is-menu-open .ov-burger-line--middle,
#ov-main-header.is-menu-open .ov-burger-icon rect:nth-child(2) {
  transform: scaleX(1.2308) rotate(45deg);
}

#ov-main-header.is-menu-open .ov-burger-line--bottom,
#ov-main-header.is-menu-open .ov-burger-icon rect:nth-child(3) {
  transform: translateY(-12px) rotate(-45deg);
}
```

Десктопная строка меню (с 1024px):

```css
@media (min-width: 1024px) {
  #ov-main-header-content {
    grid-template-columns: auto minmax(0, 1fr);
  }

  #ov-main-header-logo {
    grid-column: 1;
    width: var(--ov-header-logo-width-desktop);
  }

  #ov-main-menu-header {
    display: block;
    grid-column: 2;
    min-width: 0;
  }

  #ov-main-header-toggler {
    display: none;
  }

  #ov-main-menu-items {
    position: static;
    display: block;
    height: auto;
    min-height: 0;
    padding: 0;
    overflow: visible;
    color: inherit;
    background: transparent;
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
    visibility: visible;
    opacity: 1;
    pointer-events: auto;
    transform: none;
    transition: none;
  }

  #ov-main-menu-items-list {
    flex-direction: row;
    justify-content: flex-end;
    align-items: center;
    width: auto;
    gap: clamp(1.25rem, 2.6vw, 2.75rem);
  }

  #ov-main-menu-items-list > li,
  #ov-main-menu-items-list > li:first-child {
    border: 0;
  }

  #ov-main-menu-items-list a {
    min-height: 2.75rem;
    padding: 0.5rem 0;
    font-size: var(--ov-header-menu-size-desktop);
    font-weight: 650;
    letter-spacing: -0.015em;
    text-transform: uppercase;
  }

  #ov-main-menu-items-list a span {
    color: transparent !important;
    background: linear-gradient(
      90deg,
      var(--ov-header-light-start) 0%,
      var(--ov-header-light-middle) 18%,
      var(--ov-header-light-end) 36%,
      var(--ov-header-menu-copy) 48%,
      var(--ov-header-menu-copy) 100%
    );
    background-size: 230% 100%;
    background-position: 100% 50%;
    -webkit-background-clip: text;
    background-clip: text;
    transition: background-position var(--ov-header-menu-hover-duration) var(--ov-header-transition-easing);
  }

  #ov-main-menu-items-list a::after {
    display: none;
  }

  #ov-main-menu-items-list a:hover,
  #ov-main-menu-items-list a:focus-visible {
    padding-inline: 0;
  }

  #ov-main-menu-items-list a:hover span,
  #ov-main-menu-items-list a:focus-visible span {
    background-position: 0 50%;
  }
}
```

### Как это работает

Подчёркивания на десктопе нет: `a::after { display: none }` гасит мобильную чёрточку. Ховер красит
сам текст. Внутренний `<span>` получает градиент шириной 230%, поставленный правым краем
(`background-position: 100% 50%`), где лежит нейтральный `--ov-header-menu-copy`. При ховере позиция
уезжает в `0 50%`, и через букву слева направо проходит волна signal → unity → horizon за 360ms.
`background-clip: text` вместе с `color: transparent` показывает градиент только в глифах.

Бургер в оригинале рисуется тремя `<rect>` внутри SVG, и раскрытие идёт по нестандартной схеме:
верхняя палочка гаснет и уезжает вверх со сжатием по X, средняя растягивается на 1.2308 и
поворачивается на +45°, нижняя поднимается на 12px и поворачивается на -45°. У кнопки нет ни фона,
ни рамки, ни радиуса.

## 1.3 Мобильный оверлей

```css
#ov-main-menu-items {
  position: fixed;
  z-index: 40;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100svh;
  min-height: 0;
  padding:
    calc(var(--ov-header-min-height-mobile) + 1rem)
    var(--ov-header-overlay-padding)
    calc(var(--ov-header-min-height-mobile) + 1rem);
  overflow-y: auto;
  overscroll-behavior: contain;
  color: var(--ov-header-menu-copy);
  background:
    radial-gradient(circle at 14% 18%, var(--ov-header-overlay-signal), transparent 38%),
    radial-gradient(circle at 88% 78%, var(--ov-header-overlay-horizon), transparent 42%),
    linear-gradient(145deg, var(--ov-header-overlay-start), var(--ov-header-overlay-end));
  -webkit-backdrop-filter: blur(var(--ov-header-overlay-blur)) saturate(125%);
  backdrop-filter: blur(var(--ov-header-overlay-blur)) saturate(125%);
  visibility: hidden;
  opacity: 0;
  pointer-events: none;
  transform: translateY(-12px);
  transition:
    opacity var(--ov-header-transition-duration) ease,
    transform var(--ov-header-transition-duration) var(--ov-header-transition-easing),
    visibility 0s linear var(--ov-header-transition-duration);
}

#ov-main-header.is-menu-open #ov-main-menu-items {
  visibility: visible;
  opacity: 1;
  pointer-events: auto;
  transform: translateY(0);
  transition-delay: 0s;
}

#ov-main-menu-items-list {
  display: flex;
  flex-direction: column;
  width: min(100%, 36rem);
  margin: 0 auto;
  padding: 0;
  gap: 0;
  list-style: none;
}

#ov-main-menu-items-list > li {
  border-bottom: 1px solid var(--ov-header-menu-divider);
}

#ov-main-menu-items-list > li:first-child {
  border-top: 1px solid var(--ov-header-menu-divider);
}

#ov-main-menu-items-list a {
  position: relative;
  display: flex;
  align-items: center;
  min-height: 4.75rem;
  padding-inline: 0.25rem 2.5rem;
  color: var(--ov-header-menu-copy);
  font-family: var(--ov-header-font-display);
  font-size: clamp(1.65rem, 8vw, 2.6rem);
  font-weight: 750;
  line-height: 1.08;
  letter-spacing: -0.035em;
  text-decoration: none;
  transition:
    color var(--ov-header-transition-duration) ease,
    padding var(--ov-header-transition-duration) var(--ov-header-transition-easing);
}

#ov-main-menu-items-list a::after {
  content: "";
  position: absolute;
  right: 0.25rem;
  width: 1.5rem;
  height: 1px;
  background: linear-gradient(90deg, var(--ov-header-light-start), var(--ov-header-light-end));
  transform: scaleX(0.42);
  transform-origin: right;
  transition: transform var(--ov-header-transition-duration) var(--ov-header-transition-easing);
}

#ov-main-menu-items-list a:hover,
#ov-main-menu-items-list a:focus-visible {
  color: var(--ov-header-menu-copy-hover);
  padding-left: 0.75rem;
  outline: none;
}

#ov-main-menu-items-list a:hover::after,
#ov-main-menu-items-list a:focus-visible::after {
  transform: scaleX(1);
}

html.ov-menu-open,
body.ov-menu-open {
  overflow: hidden;
}

body.ov-menu-open {
  position: fixed;
  inset-inline: 0;
  top: var(--ov-menu-scroll-offset, 0);
  width: 100%;
}
```

### Как это работает

Оверлей открывается одним переходом: `opacity 0→1` и `translateY(-12px)→0` за 240ms.
**Ступенчатого появления пунктов в оригинале нет**, `@keyframes` для меню тоже нет. `visibility`
переключается через `transition: visibility 0s linear 240ms`, поэтому закрытый оверлей выпадает из
дерева доступности только после того, как прозрачность дошла до нуля.

Список центрируется по вертикали и горизонтали (`justify-content: center`, `width: min(100%, 36rem)`),
пункты разделены линиями 1px сверху и снизу. Ссылки крупные (до 2.6rem), вес 750, трекинг -0.035em,
**без uppercase**. Справа у каждой висит градиентная чёрточка 1.5rem, сжатая до 0.42 по X; на
ховере она разжимается до полной длины, а текст сдвигается вправо на 0.75rem.

Прокрутка страницы блокируется через `body.ov-menu-open { position: fixed; top: var(--ov-menu-scroll-offset) }`.

## 1.4 Reduced motion

```css
@media (prefers-reduced-motion: reduce) {
  #ov-main-header *,
  #ov-main-header *::before,
  #ov-main-header *::after {
    transition-duration: 0.01ms !important;
  }
}
```

## 1.5 Расхождения с `src/components/layout/Header.tsx` + `Header.css`

| Что | Оригинал | У нас | Насколько заметно |
|---|---|---|---|
| Позиция | `top: 0; inset-inline: 0`, с 768px `width: calc(100% - 32px)` | `top: 12px; inset-inline: 12px`, с 768px `top/inset: 16px` | среднее |
| Радиус на мобильном | `border-radius: 0`, планка во всю ширину | `--radius-header-compact: 12px` | **высокое** |
| Световая линия на мобильном | `::before` внизу (`inset: auto 0 0`), 1.5px | `::after` вверху (`top: 1.5px`) | **высокое** |
| Рамка на планшете и десктопе | градиент по всему периметру через двухслойную схему `::before` (`inset: 0`, z -2) + `::after` (`inset: 1.5px`, z -1) | `border: 1.5px solid var(--glass-border)` — ровный серо-голубой контур | **высокое** |
| Угол градиента рамки | `112deg` | `90deg`, и только сверху | **высокое** |
| Стекло | `blur(18px) saturate(135%)`, `rgb(midnight-950 / 0.77)` + `linear-gradient(180deg, rgb(255 255 255 / .07), transparent 42%)` | то же самое ✅ | — |
| Высота пилюли | 72 / 88 / 80px | `min-height: 48px` + padding 20px = 88px, при скролле 72px | среднее |
| Порог десктопной раскладки | 1024px | 768px (`--breakpoint-desktop`) | среднее |
| Порог скоса | 1280px | 1024px | среднее |
| Компенсация скоса | `--ov-header-skew-compensation: 22px` (проекция 44px) | `--header-skew-inset: 16px` | низкое |
| Тень на скошенной пилюле | `box-shadow: none` + три `drop-shadow` в `filter` на `::before` | `box-shadow: var(--shadow-header)` на прямоугольном `::before` — тень не следует за параллелограммом | **высокое** |
| Ссылки: вес и трекинг | `font-weight: 650`, `letter-spacing: -0.015em`, `font-size: 1rem` | `font-weight: 700`, `letter-spacing: 0.02em` | низкое |
| Промежуток между ссылками | `clamp(1.25rem, 2.6vw, 2.75rem)` | `gap: 24px` | низкое |
| Ховер ссылки | градиентная волна по тексту, `background-size: 230% 100%`, позиция `100% 50% → 0 50%`, 360ms; подчёркивания нет | смена цвета на `horizon-200` + подчёркивание `scaleX(0→1)` | **высокое** |
| Бургер: оформление | без фона, без рамки, без радиуса, 48×48, иконка 28px | фон `rgb(7 2 16 / .28)`, рамка 1.5px, радиус 12px | среднее |
| Бургер: раскрытие | гаснет **верхняя** палочка (`translateY(-8px) scaleX(0.72)`), средняя `scaleX(1.2308) rotate(45deg)`, нижняя `translateY(-12px) rotate(-45deg)` | гаснет **средняя**, крайние сходятся на ±5.5px и ±45° | низкое |
| Оверлей: выравнивание | `justify-content: center`, список `min(100%, 36rem)` по центру | контент прижат к верху, `padding-top: calc(88px + 16px)` | среднее |
| Оверлей: сдвиг при открытии | `translateY(-12px)` | `translateY(-8px)` | низкое |
| Оверлей: типографика ссылок | `clamp(1.65rem, 8vw, 2.6rem)`, вес 750, трекинг -0.035em, без uppercase, `min-height: 4.75rem` | `clamp(1.25rem, 6vw, 1.75rem)`, вес 700, uppercase, `min-height: 48px` | **высокое** |
| Оверлей: разделители | сверху и снизу у каждого `li` (`border-top` у первого) | только `border-top` между соседями | низкое |
| Оверлей: чёрточка справа | `::after` 1.5rem, `scaleX(0.42 → 1)` + сдвиг текста `padding-left: 0.75rem` | нет | среднее |
| Оверлей: ореолы | radial 14%/18% signal-600 .22 + 88%/78% horizon-600 .18 + `linear-gradient(145deg, midnight-950/.98, unity-950/.97)` | те же координаты и стопы ✅ | — |
| Скролл-состояние | `.is-header-hidden`: уезжает вверх на `-100% - 2rem`, `opacity: 0`, 420ms | `data-scrolled`: уплотняет padding и усиливает тень | **высокое** (разное поведение) |
| Stagger пунктов меню | нет | нет ✅ | — |

---

# 2. Фоны секций

## 2.1 Hero (`.ov-hero`)

```css
.ov-hero {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  color: var(--ov-hero-copy);
  background-color: var(--ov-hero-video-background, rgb(7 2 16));
}

/* Contrast layer: quiet at the top, strongest behind the copy. */
.ov-hero::after {
  content: "";
  position: absolute;
  z-index: 15;
  inset: 0;
  pointer-events: none;
  background:
    linear-gradient(to top, rgb(8, 3, 19) 5.88%, transparent 28.15%),
    radial-gradient(circle at 99% -64%, var(--ov-hero-atmosphere-indigo) 57%, transparent 72.05%),
    radial-gradient(circle at 27% 84%, var(--ov-hero-atmosphere-violet) 41%, transparent 60.05%),
    radial-gradient(circle at -67% 95%, var(--ov-hero-atmosphere-signal) 46%, transparent 57.05%),
    linear-gradient(140deg, rgb(7 2 16 / 0.14) 32%, transparent 40.05%),
    linear-gradient(180deg, transparent 55%, rgb(7 2 16 / 0.34) 100%);
}

.ov-hero .ov-hero-video-particles canvas {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  opacity: var(--ov-hero-particles-opacity, 0.72);
  pointer-events: none;
  mix-blend-mode: screen;
}
```

```css
--ov-hero-atmosphere-violet: rgb(var(--ov-unity-800-rgb) / 0.15);
--ov-hero-atmosphere-indigo: rgb(var(--ov-unity-950-rgb) / 0.18);
--ov-hero-atmosphere-signal: rgb(var(--ov-signal-900-rgb) / 0.25);
--ov-hero-scrim-top: rgb(var(--ov-midnight-950-rgb) / 0.20);
--ov-hero-scrim-bottom: rgb(var(--ov-midnight-950-rgb) / 0.92);
--ov-hero-vignette: rgb(4 3 18 / 0.48);
--ov-hero-video-filter: saturate(1.18) contrast(1.28) brightness(0.96);
--ov-hero-particles-opacity: 0.72;
--ov-hero-content-width: 72rem;
--ov-hero-content-padding-inline: clamp(20px, 4vw, 48px);
--ov-hero-content-padding-bottom: clamp(48px, 9vh, 104px);
```

**Ширина:** во всю ширину окна. Один `::after` поверх видео несёт шесть слоёв, три из них с
центрами за границей элемента (`99% -64%`, `-67% 95%`), поэтому от углов внутрь заходят широкие
мягкие ореолы.

**Что у нас** (`src/components/hero/hero.css`): вместо одного `::after` четыре отдельных узла —
`.starfield` (два слоя точек 180px и 320px плюс три `.starfield__glow`), `.globe-canvas`,
`.hero__scrim` (`linear-gradient(180deg, rgb(7 2 16 / .2), rgb(7 2 16 / .92))` с маской справа
с 768px) и `.hero__vignette` (`radial-gradient(ellipse at 50% 50%, transparent 42%, rgb(4 3 18 / .48))`).
Наши `--ov-hero-scrim-top/bottom` и `--ov-hero-vignette` совпали с оригиналом до цифры. Отличие:
у оригинала верхний край гасится жёстче (`linear-gradient(to top, rgb(8 3 19) 5.88%, transparent 28.15%)`
даёт плотную полосу у **нижней** кромки), плюс он подмешивает `linear-gradient(140deg, …)` для
диагональной тени слева. Звёздное поле у оригинала рисует canvas с `mix-blend-mode: screen` и
`opacity: 0.72`, у нас — два CSS-слоя без blend-режима.

## 2.2 Карта (`#ov-map`)

```css
#ov-map {
  position: relative;
  isolation: isolate;
  /* The divider atmosphere intentionally reaches into the preceding hero. */
  overflow: visible;
  margin-top: calc(0px - var(--ov-map-wedge-depth) - 1px);
}

#ov-map::before {
  content: "";
  position: absolute;
  inset: 0 0 auto;
  z-index: 0;
  height: clamp(260px, 38vw, 560px);
  pointer-events: none;
  background:
    radial-gradient(circle at 12% -18%, rgb(var(--ov-signal-700-rgb) / 0.22) 0, transparent 42%),
    radial-gradient(circle at 50% -42%, rgb(var(--ov-unity-700-rgb) / 0.24) 0, transparent 46%),
    radial-gradient(circle at 88% -22%, rgb(var(--ov-horizon-700-rgb) / 0.2) 0, transparent 40%);
  clip-path: polygon(0 var(--ov-map-wedge-depth), 100% 0, 100% 100%, 0 100%);
}

#ov-map > .ov-map-skew-mask {
  z-index: 9;
  display: block;
  width: 100%;
  height: var(--ov-map-wedge-depth);
  padding: 0;
  overflow: visible;
  pointer-events: none;
}

#ov-map > .ov-map-skew-mask--top { position: absolute; inset: 0 0 auto; }
#ov-map > .ov-map-skew-mask--bottom { position: relative; margin-top: calc(0px - var(--ov-map-wedge-depth)); }

/* Static transition light: one gradient layer, no blur/filter or animation. */
#ov-map > .ov-map-skew-mask--top::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  z-index: -1;
  width: var(--ov-map-transition-orb-size);
  aspect-ratio: 1;
  transform: translate(-38%, -72%);
  border-radius: 50%;
  pointer-events: none;
  background: radial-gradient(
    circle,
    rgb(var(--ov-unity-950-rgb) / 0.7) 0,
    rgb(var(--ov-unity-950-rgb) / 0.34) 34%,
    transparent 68%
  );
}

/* Large boundary atmosphere spanning the map and the top of the form. */
#ov-map > .ov-map-skew-mask--bottom::after {
  content: "";
  position: absolute;
  top: 50%;
  right: 0;
  z-index: -1;
  width: var(--ov-map-bottom-orb-size);
  aspect-ratio: 1;
  transform: translate(38%, -50%);
  border-radius: 50%;
  pointer-events: none;
  background: radial-gradient(
    circle,
    rgb(var(--ov-signal-700-rgb) / 0.15) 0,
    rgb(var(--ov-unity-900-rgb) / 0.22) 30%,
    rgb(var(--ov-unity-950-rgb) / 0.34) 48%,
    transparent 70%
  );
}

@media (max-width: 767px) {
  #ov-map > .ov-map-skew-mask--bottom::after {
    right: 0;
    width: 100%;
    height: min(var(--ov-map-bottom-orb-size), 135vw);
    aspect-ratio: auto;
    transform: translateY(-50%);
    border-radius: 0;
    background: radial-gradient(
      circle at 112% 50%,
      rgb(var(--ov-signal-700-rgb) / 0.15) 0,
      rgb(var(--ov-unity-900-rgb) / 0.22) 30%,
      rgb(var(--ov-unity-950-rgb) / 0.34) 48%,
      transparent 70%
    );
  }
}

#ov-map-element {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  clip-path: polygon(
    0 var(--ov-map-wedge-depth),
    100% 0,
    100% calc(100% - var(--ov-map-wedge-depth)),
    0 100%
  );
}

#ov-map-element::before {
  content: "";
  position: absolute;
  inset-inline: 0;
  z-index: 5;
  pointer-events: none;
  top: -3px;
  height: calc(var(--ov-map-transition-depth) + 4px);
  background:
    linear-gradient(
      to bottom,
      var(--ov-hero-video-background) 0,
      rgb(var(--ov-midnight-950-rgb) / 0.94) 18%,
      transparent 62%
    ),
    radial-gradient(circle at 10% -16%, rgb(var(--ov-signal-600-rgb) / 0.25) 0, transparent 18%),
    radial-gradient(circle at 48% -38%, rgb(var(--ov-unity-600-rgb) / 0.3) 0, transparent 44%),
    radial-gradient(circle at 90% -18%, rgb(var(--ov-horizon-600-rgb) / 0.22) 0, transparent 18%),
    linear-gradient(to bottom, var(--ov-hero-video-background) 0%, rgb(var(--ov-midnight-950-rgb) / 0.72) 32%, transparent 100%);
}

#ov-map-copy {
  text-shadow:
    0 2px 2px rgb(var(--ov-midnight-950-rgb) / 0.96),
    0 7px 18px rgb(var(--ov-midnight-950-rgb) / 0.78);
}
```

```css
--ov-map-section-surface: rgb(var(--ov-midnight-950-rgb));
--ov-map-wedge-depth: clamp(32px, 3.2vw, 52px);
--ov-map-transition-depth: clamp(150px, 34vw, 340px);
--ov-map-transition-orb-size: clamp(220px, 45svh, 520px);
--ov-map-bottom-orb-size: clamp(520px, 72vw, 1100px);
--ov-map-form-tail-depth: clamp(140px, 18vw, 280px);
--ov-map-counters-top: clamp(152px, 21svh, 236px);
--ov-map-content-width: 72rem;
--ov-map-copy-width: 42rem;
```

**Ширина:** всё во всю ширину. Клин `--ov-map-wedge-depth` резко отличает нашу реализацию: у
оригинала он адаптивный, `clamp(32px, 3.2vw, 52px)`, и применяется трижды — к `#ov-map::before`,
к CMS-подложке секции и к самому `#ov-map-element` (сверху и снизу). Секция подтягивается под hero
через `margin-top: calc(0px - wedge - 1px)`.

Два «шара» живут на служебных элементах `.ov-map-skew-mask--top/--bottom`, но выезжают далеко за
их границы (`transform: translate(-38%, -72%)` и `translate(38%, -50%)`), поэтому визуально это
полноэкранные ореолы. Нижний шар подсвечивает границу карты и верх формы одновременно. На мобильном
он превращается в прямоугольник во всю ширину с центром градиента за правым краем (`circle at 112% 50%`),
чтобы не расширять вьюпорт.

## 2.3 Форма «зажечь свет»

Отдельного фона у формы нет. По DOM-снапшоту она лежит внутри той же секции, что карта, и получает
её базовую поверхность плюс нижний шар. Из оформления в дампе есть только карточки выбора типа:

```css
#ov-light-form-container label[for^="LIGHT_TYPE-"] {
  position: relative;
  isolation: isolate;
  display: flex;
  flex-direction: column;
  min-height: 150px;
  padding: 24px;
  align-items: stretch;
  justify-content: flex-start;
  gap: 10px;
  overflow: hidden;
  border: 1px solid var(--ov-map-option-border);
  border-radius: var(--ov-map-form-radius);
  background: var(--ov-map-option-surface);
  box-shadow:
    inset 0 1px 0 rgb(var(--ov-midnight-50-rgb) / 0.04),
    0 16px 38px rgb(var(--ov-midnight-950-rgb) / 0.16);
  cursor: pointer;
  transition:
    border-color 240ms ease,
    background-color 240ms ease,
    box-shadow 240ms ease,
    transform 240ms ease;
}
```

```css
--ov-map-form-width: 62rem;
--ov-map-form-gap: 16px;
--ov-map-form-radius: 16px;
--ov-map-field-height: 54px;
--ov-map-field-surface: rgb(var(--ov-midnight-900-rgb) / 0.58);
--ov-map-field-surface-focus: rgb(var(--ov-midnight-800-rgb) / 0.7);
--ov-map-field-border: rgb(var(--ov-midnight-100-rgb) / 0.18);
--ov-map-field-border-hover: rgb(var(--ov-horizon-400-rgb) / 0.46);
--ov-map-field-copy: rgb(var(--ov-midnight-50-rgb) / 0.94);
--ov-map-field-placeholder: rgb(var(--ov-midnight-200-rgb) / 0.56);
--ov-map-option-surface: rgb(var(--ov-midnight-900-rgb) / 0.42);
--ov-map-option-surface-active: rgb(var(--ov-horizon-800-rgb) / 0.16);
--ov-map-option-border: rgb(var(--ov-midnight-100-rgb) / 0.16);
--ov-map-option-border-active: rgb(var(--ov-horizon-400-rgb) / 0.72);
--ov-map-form-focus: rgb(var(--ov-horizon-300-rgb));
```

Наш `light-form.css` перенёс эти переменные один в один (`--field-height: 54px`,
`--option-surface: rgb(18 12 52 / .42)`, `--option-border-active: rgb(123 194 199 / .72)`). Разница:
у оригинала карточка типа `min-height: 150px`, `padding: 24px`, `gap: 10px` и двойная тень; у нас
`padding: 16px`, `min-height: 44px`, тени нет.

## 2.4 About (`#ov-about`)

```css
#ov-about {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  color: var(--ov-about-copy);
  background: radial-gradient(circle at 19% -3%, rgb(var(--ov-signal-950-rgb) / .3) 60%, transparent 66.05%),
    radial-gradient(circle at -34% -41%, rgb(var(--ov-horizon-950-rgb) / .9) 42%, transparent 54.05%),
    radial-gradient(circle at -89% 47%, rgb(var(--ov-signal-900-rgb) / .9) 47%, transparent 52.05%),
    linear-gradient(162deg,  rgb(var(--ov-midnight-900-rgb) / .9) 46%, transparent 50.05%),
    rgb(var(--ov-unity-950-rgb));
}

/* The map finishes cleanly; About introduces its own atmosphere from the top. */
#ov-about::before {
  content: "";
  position: absolute;
  z-index: 0;
  inset: 0 0 auto;
  height: var(--ov-about-transition-height);
  pointer-events: none;
}
```

Карточка шага:

```css
#ov-about .ov-about-step-card {
  isolation: isolate;
  border-color: var(--ov-about-card-border);
  border-radius: var(--ov-about-card-radius);
  background:
    linear-gradient(145deg, rgb(255 255 255 / 0.045), transparent 30%),
    linear-gradient(
      180deg,
      var(--ov-about-card-surface-top),
      var(--ov-about-card-surface-bottom)
    );
  box-shadow: var(--ov-about-card-shadow);
  -webkit-backdrop-filter: blur(var(--ov-about-card-blur)) saturate(112%);
  backdrop-filter: blur(var(--ov-about-card-blur)) saturate(112%);
  transition:
    box-shadow var(--ov-about-transition-duration) var(--ov-about-transition-easing),
    border-color var(--ov-about-transition-duration) var(--ov-about-transition-easing);
}

#ov-about .ov-about-step-card::before {
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(145deg, rgb(255 255 255 / 0.035), transparent 36%);
  box-shadow:
    inset 1px 1px 0 var(--ov-about-card-inner-highlight),
    inset -1px -1px 0 var(--ov-about-card-inner-shadow);
  opacity: 0.58;
}

/* One restrained OneVoice27 signature instead of full-perimeter neon. */
#ov-about .ov-about-step-card::after {
  top: 0;
  left: 24px;
  width: var(--ov-about-card-registration-width);
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    var(--ov-about-card-accent-start) 28%,
    var(--ov-about-card-accent-end) 62%,
    transparent 100%
  );
  box-shadow: 0 1px 8px var(--ov-about-card-accent-shadow);
  opacity: 0.76;
  transition: opacity var(--ov-about-transition-duration) ease;
}
```

**Ширина:** фон висит на самой `<section>`, поэтому тянется на все 100% ширины. Три ореола имеют
центры за левым краем (`-34% -41%`, `-89% 47%`) и один в верхней трети слева.

**Что у нас** (`about.css`): база `--color-midnight-900` (совпадает с оригинальным `unity-950` =
`rgb(18 11 52)` ✅). Ореолы отличаются: у нас `circle at 8% -10%` signal .3 и `circle at 104% 30%`
unity .9 — второй уехал направо, у оригинала оба слева. Пятого слоя `linear-gradient(162deg, midnight-900/.9 46%, transparent 50.05%)`
у нас нет: именно он даёт мягкую диагональ по левому краю. Карточка: наш `.ab-step::after` повторил
акцентную линию (`left: 24px`, `height: 1px`, `opacity: .76`, стопы 28%/62%) ✅, но у нас `width: 96px`
вместо переменной и нет `box-shadow: 0 1px 8px` под линией.

## 2.5 Involve (`#ov-involve`)

```css
#ov-involve {
  position: relative;
  z-index: 2;
  isolation: isolate;
  overflow: hidden;
  margin-top: calc(
    0px - var(--ov-involve-wedge-top-depth) - var(--ov-involve-overlap-guard)
  );
  margin-bottom: calc(
    0px - var(--ov-involve-wedge-bottom-depth) - var(--ov-involve-overlap-guard)
  );
  color: var(--ov-involve-copy);
  background: transparent;
}

/* Angled section silhouette; content and interactive geometry remain straight. */
#ov-involve::before {
  content: "";
  position: absolute;
  z-index: 0;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(circle at -25% 50%, rgb(var(--ov-midnight-900-rgb) / 0.28) 49%, transparent 59.05%),
    radial-gradient(circle at 66% 23%, rgb(var(--ov-unity-950-rgb) / 0.78) 45%, transparent 55.05%),
    radial-gradient(circle at -78% 85%, rgb(var(--ov-horizon-700-rgb) / 0.18) 47%, transparent 57.05%),
    linear-gradient(-282deg, rgb(var(--ov-midnight-900-rgb) / 0.78) 49%, transparent 59.05%),
    linear-gradient(180deg, var(--ov-involve-surface), var(--ov-involve-surface-deep));
  clip-path: polygon(
    0 var(--ov-involve-wedge-top-depth),
    100% 0,
    100% 100%,
    0 calc(100% - var(--ov-involve-wedge-bottom-depth))
  );
}

/* Quiet structural edge: gradient color, no glow and no transformed content. */
#ov-involve::after {
  content: "";
  position: absolute;
  z-index: 1;
  inset: 0;
  padding: 1px;
  pointer-events: none;
  background: linear-gradient(
    90deg,
    transparent 0%,
    var(--ov-involve-edge-start) 28%,
    var(--ov-involve-edge-end) 62%,
    transparent 100%
  );
  clip-path: polygon(
    0 var(--ov-involve-wedge-top-depth),
    100% 0,
    100% 100%,
    0 calc(100% - var(--ov-involve-wedge-bottom-depth))
  );
  -webkit-mask:
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask:
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);
  mask-composite: exclude;
  filter: drop-shadow(0 1px 5px var(--ov-involve-edge-shadow));
  opacity: 0.76;
}

/* A borderless, directional light field arrives only after assembly. */
#ov-involve .ov-involve-triptych::before {
  content: "";
  position: absolute;
  z-index: -1;
  inset: -18px;
  border-radius: calc(var(--ov-involve-frame-radius) + 18px);
  pointer-events: none;
  background:
    radial-gradient(circle at 8% 14%, var(--ov-involve-frame-glow-signal), transparent 38%),
    radial-gradient(circle at 52% 104%, var(--ov-involve-frame-glow-unity), transparent 48%),
    radial-gradient(circle at 94% 72%, var(--ov-involve-frame-glow-horizon), transparent 40%);
  box-shadow: var(--ov-involve-frame-shadow);
  filter: blur(var(--ov-involve-frame-glow-blur));
  opacity: var(--ov-involve-frame-opacity);
  transition: opacity 180ms linear;
}
```

### Как это работает

Сама секция прозрачная. Всю краску несёт `::before` во всю ширину, обрезанный **двойным** клином:
срез сверху справа налево и снизу слева направо, из-за чего блок читается как наклонённый
параллелограмм. Секция при этом заезжает на соседей отрицательными `margin-top` и `margin-bottom`.

`::after` рисует 1px-контур по тому же силуэту: слой с `padding: 1px` маскируется двумя градиентами
с `mask-composite: exclude`, остаётся только рамка, а `drop-shadow` даёт ей мягкое свечение.

**Что у нас** (`involve.css`): `.inv-section` красится плоским `--color-midnight-900`, клина нет,
контура по силуэту нет, отрицательных полей нет. Световое поле под триптихом мы повторили
(`.inv-triptych-wrap::before`, `inset: -18px`, три radial, `blur(28px)`), но координаты и цвета
чуть иные: у нас `12% 8%` / `50% 110%` / `92% 30%` против `8% 14%` / `52% 104%` / `94% 72%`.

## 2.6 News (`#ov-news`)

```css
#ov-news {
  position: relative;
  isolation: isolate;
  color: var(--ov-news-copy);
  background: var(--ov-news-surface);
  scroll-margin-top: calc(var(--ov-header-min-height-desktop) + 24px);
}

/* Dark blue atmosphere only; cards and text retain editorial priority. */
#ov-news::before {
  content: "";
  position: absolute;
  z-index: 0;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(circle at 88% 18%, var(--ov-news-atmosphere-horizon), transparent 38%),
    radial-gradient(circle at 8% 72%, var(--ov-news-atmosphere-unity), transparent 42%),
    radial-gradient(circle at 62% 106%, rgb(var(--ov-horizon-950-rgb) / 0.18), transparent 36%);
}

#ov-news-content {
  position: relative;
  z-index: 1;
  color: var(--ov-news-copy);
}
```

**Ширина:** во всю ширину, `::before` с `inset: 0`. **Клина и отрицательных полей у news в
оригинале нет.**

**Что у нас** (`News.tsx`): секция несёт `[clip-path:polygon(0_24px,…)]` и `-mt-6` (на десктопе
48px / `-mt-12`), плюс два ореола из трёх — третьего, `circle at 62% 106%` horizon-950 .18, нет.
Клин здесь наша отсебятина: оригинал скашивает involve и footer, но не news.

## 2.7 Resources (`#ov-resources`)

```css
#ov-resources {
  --ov-resources-card-accent: var(--ov-resources-music-accent);
  position: relative;
  isolation: isolate;
  overflow: hidden;
  color: var(--ov-resources-copy);
  background-color: var(--ov-resources-surface);
  transition: background-color var(--ov-resources-transition-duration) var(--ov-resources-transition-easing);
}

#ov-resources::before {
  content: "";
  position: absolute;
  z-index: 0;
  inset: -8%;
  pointer-events: none;
  background:
    radial-gradient(circle at 16% 18%, rgb(var(--ov-signal-800-rgb) / 0.18), transparent 32%),
    radial-gradient(circle at 82% 28%, rgb(var(--ov-horizon-800-rgb) / 0.16), transparent 38%),
    radial-gradient(circle at 52% 84%, rgb(var(--ov-unity-800-rgb) / 0.22), transparent 42%),
    linear-gradient(145deg, rgb(var(--ov-midnight-900-rgb) / 0.38), transparent 58%);
  transform: scale(1);
  transform-origin: center;
  will-change: transform;
}

#ov-resources::after {
  content: "";
  position: absolute;
  z-index: 0;
  inset: -24px;
  pointer-events: none;
  opacity: var(--ov-resources-particles-opacity-low);
  background:
    radial-gradient(circle at 13px 29px, rgb(var(--ov-horizon-100-rgb) / 0.88) 0 0.7px, transparent 1.35px) 0 0 / 97px 113px repeat,
    radial-gradient(circle at 79px 41px, rgb(var(--ov-unity-200-rgb) / 0.78) 0 0.9px, transparent 1.55px) 17px 31px / 139px 157px repeat,
    radial-gradient(circle at 47px 127px, rgb(var(--ov-signal-200-rgb) / 0.68) 0 1.1px, transparent 1.85px) 53px 11px / 179px 193px repeat,
    radial-gradient(circle at 193px 67px, rgb(var(--ov-horizon-200-rgb) / 0.74) 0 1.45px, transparent 2.35px) 23px 79px / 257px 233px repeat,
    radial-gradient(circle at 271px 181px, rgb(var(--ov-unity-100-rgb) / 0.62) 0 1.8px, transparent 2.9px) 101px 47px / 337px 311px repeat;
  transform: translate3d(0, 0, 0);
  animation: ov-resources-particles var(--ov-resources-particles-duration) ease-in-out infinite alternate;
  will-change: transform, opacity;
}

#ov-resources.is-music-active { background-color: var(--ov-resources-surface-music); }

#ov-resources.is-music-active::before {
  background:
    radial-gradient(circle at 18% 24%, rgb(var(--ov-unity-500-rgb) / 0.42), transparent 34%),
    radial-gradient(circle at 76% 18%, rgb(var(--ov-horizon-800-rgb) / 0.18), transparent 38%),
    radial-gradient(circle at 68% 82%, rgb(var(--ov-signal-800-rgb) / 0.24), transparent 42%),
    linear-gradient(145deg, rgb(var(--ov-midnight-950-rgb) / 0.12), rgb(var(--ov-unity-900-rgb) / 0.46));
  animation: ov-resources-zoom-music var(--ov-resources-atmosphere-duration) var(--ov-resources-transition-easing) forwards;
}

#ov-resources.is-materials-active { background-color: var(--ov-resources-surface-materials); }

#ov-resources.is-materials-active::before {
  background:
    radial-gradient(circle at 82% 24%, rgb(var(--ov-horizon-500-rgb) / 0.40), transparent 34%),
    radial-gradient(circle at 22% 74%, rgb(var(--ov-unity-700-rgb) / 0.32), transparent 40%),
    radial-gradient(circle at 54% 16%, rgb(var(--ov-signal-900-rgb) / 0.18), transparent 36%),
    linear-gradient(155deg, rgb(var(--ov-midnight-950-rgb) / 0.14), rgb(var(--ov-horizon-900-rgb) / 0.44));
  animation: ov-resources-zoom-materials var(--ov-resources-atmosphere-duration) var(--ov-resources-transition-easing) forwards;
}

#ov-resources.is-video-active { background-color: var(--ov-resources-surface-video); }

#ov-resources.is-video-active::before {
  background:
    radial-gradient(circle at 52% 82%, rgb(var(--ov-signal-500-rgb) / 0.42), transparent 34%),
    radial-gradient(circle at 14% 20%, rgb(var(--ov-horizon-700-rgb) / 0.26), transparent 40%),
    radial-gradient(circle at 88% 26%, rgb(var(--ov-unity-800-rgb) / 0.24), transparent 38%),
    linear-gradient(135deg, rgb(var(--ov-midnight-950-rgb) / 0.12), rgb(var(--ov-signal-900-rgb) / 0.44));
  animation: ov-resources-zoom-video var(--ov-resources-atmosphere-duration) var(--ov-resources-transition-easing) forwards;
}

@keyframes ov-resources-zoom-music {
  from { transform: scale(1); }
  to { transform: scale(var(--ov-resources-atmosphere-scale)); }
}

@keyframes ov-resources-zoom-materials {
  from { transform: scale(1); }
  to { transform: scale(var(--ov-resources-atmosphere-scale)); }
}

@keyframes ov-resources-zoom-video {
  from { transform: scale(1); }
  to { transform: scale(var(--ov-resources-atmosphere-scale)); }
}

@keyframes ov-resources-particles {
  0% {
    opacity: var(--ov-resources-particles-opacity-low);
    transform: translate3d(0, 0, 0);
  }
  48% {
    opacity: var(--ov-resources-particles-opacity-high);
    transform: translate3d(var(--ov-resources-particles-drift-x), var(--ov-resources-particles-drift-y-mid), 0);
  }
  100% {
    opacity: 0.22;
    transform: translate3d(var(--ov-resources-particles-drift-x-end), var(--ov-resources-particles-drift-y), 0);
  }
}
```

### Как это работает

Звёздное поле здесь одно, из **пяти** слоёв `radial-gradient` с разными позициями, радиусами точек
(0.7 / 0.9 / 1.1 / 1.45 / 1.8px), смещениями и шагами повтора (97×113, 139×157, 179×193, 257×233,
337×311). Все шаги — простые числа рядом друг с другом, поэтому узор не выдаёт себя решёткой.
Слой дрейфует одной анимацией `ov-resources-particles` с тремя кадрами, `alternate`.

Атмосфера `::before` наезжает (`scale`) при открытии панели и одновременно перекрашивается под
акцент открытой карточки. Три `@keyframes` идентичны и различаются только именами: так браузер
перезапускает анимацию при смене класса.

**Что у нас** (`resources.css`): звёзды разбиты на `.resources::before` (2 слоя, `opacity: .28`,
без анимации) плюс три анимированных span-а `.resources-particles--1/2/3` с разными длительностями
(18s, 22s, 26s). Итого 4 слоя точек из 5 — не хватает пятого (`circle at 271px 181px`,
`rgb(unity-100 / .62)`, шаг `337px 311px`, радиус 1.8px). Наши кадры дрейфа фиксированы
(`-18px -24px`, `12px -46px`), у оригинала они в переменных. Наезд атмосферы у нас `scale(1.06)`,
`inset: -6%` против `-8%`.

## 2.8 Цитата

**В оригинале секции с цитатой нет.** DOM-снапшот `orig-snapshot.md` даёт последовательность
hero → карта с формой → about → involve → news → resources → footer. Наш `Quote.tsx` — добавка ЕАД,
сверять не с чем.

## 2.9 Footer (`#ov-main-footer`)

```css
#ov-main-footer {
  --ov-footer-style-loaded: 1;
  position: relative;
  z-index: 2;
  isolation: isolate;
  box-sizing: border-box;
  overflow: hidden;
  width: 100%;
  max-width: none;
  margin-top: calc(
    0px - var(--ov-footer-wedge-top-depth, clamp(24px, 3vw, 44px)) -
    var(--ov-footer-overlap-guard, 1px) - 2px
  );
  color: var(--ov-footer-copy, rgb(247 247 255 / 0.92));
  background: linear-gradient(
    180deg,
    var(--ov-footer-surface, rgb(12 11 38)),
    var(--ov-footer-surface-deep, rgb(5 5 18))
  );
  clip-path: polygon(
    0 var(--ov-footer-wedge-top-depth, clamp(24px, 3vw, 44px)),
    100% 0,
    100% 100%,
    0 100%
  );
}

#ov-main-footer::before {
  content: "";
  position: absolute;
  z-index: -2;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(circle at 18% 12%, var(--ov-footer-signal-halo, rgb(224 81 177 / 0.14)), transparent 32%),
    radial-gradient(circle at 82% 24%, var(--ov-footer-unity-halo, rgb(91 90 214 / 0.13)), transparent 34%),
    radial-gradient(ellipse at 50% 100%, transparent 0 46%, var(--ov-footer-wave, rgb(54 61 116 / 0.16)) 46.4% 47%, transparent 47.4% 100%),
    radial-gradient(ellipse at 54% 106%, transparent 0 56%, var(--ov-footer-wave, rgb(54 61 116 / 0.16)) 56.4% 57%, transparent 57.4% 100%);
  background-position:
    0 0,
    0 0,
    -2vw 0,
    2vw 0;
  background-size:
    auto,
    auto,
    108% 108%,
    112% 112%;
  animation: ov-footer-wave-drift var(--ov-footer-wave-duration, 28s) ease-in-out infinite alternate;
}

#ov-main-footer::after {
  content: "";
  position: absolute;
  z-index: -1;
  top: calc(var(--ov-footer-wedge-top-depth, clamp(24px, 3vw, 44px)) - 34%);
  left: 50%;
  width: min(760px, 92vw);
  aspect-ratio: 1.8;
  pointer-events: none;
  background:
    radial-gradient(circle at 34% 46%, var(--ov-footer-signal-halo, rgb(224 81 177 / 0.14)), transparent 38%),
    radial-gradient(circle at 66% 42%, var(--ov-footer-horizon-halo, rgb(67 184 208 / 0.10)), transparent 40%);
  filter: blur(32px);
  opacity: 0.78;
  transform: translateX(-50%);
  animation: ov-footer-halo-drift var(--ov-footer-halo-duration, 22s) ease-in-out infinite alternate;
}

@keyframes ov-footer-wave-drift {
  from {
    background-position: 0 0, 0 0, -2vw 0, 2vw 0;
  }
  to {
    background-position: 2vw 1vw, -2vw 1vw, 2vw -1vw, -2vw 1vw;
  }
}

@keyframes ov-footer-halo-drift {
  from { transform: translate3d(-52%, 0, 0) scale(0.98); }
  to { transform: translate3d(-48%, 7%, 0) scale(1.06); }
}

@media (prefers-reduced-motion: reduce) {
  #ov-main-footer::before {
    animation: none;
  }

  #ov-main-footer::after {
    animation: none;
    transform: translateX(-50%);
  }
}
```

**Что у нас** (`Footer.css`): геометрия, тайминги и оба `@keyframes` скопированы точно ✅. Разошлись
цвета и одна деталь тайминга:

| | Оригинал | У нас |
|---|---|---|
| Поверхность | `rgb(12 11 38) → rgb(5 5 18)` | `#211a3e → #120c34` — светлее и фиолетовее |
| Ореол signal в `::before` | `rgb(224 81 177 / .14)` | `rgb(158 67 154 / .14)` |
| Ореол unity | `rgb(91 90 214 / .13)` | `rgb(59 77 161 / .13)` |
| Волны | `rgb(54 61 116 / .16)` | `rgb(48 63 131 / .16)` |
| Гало signal в `::after` | `rgb(224 81 177 / .14)` | `rgb(158 67 154 / .25)` |
| Гало horizon | `rgb(67 184 208 / .10)` | `rgb(84 164 172 / .10)` |
| Easing волн | `ease-in-out` | `linear` |

## 2.10 Сводка: что тянется на всю ширину

| Секция | Носитель фона | Полная ширина | Клин | Ореолы за краем |
|---|---|---|---|---|
| hero | `background-color` + `::after` (`inset: 0`, z 15) | да | нет | да, `99% -64%` и `-67% 95%` |
| map | `::before` (полоса `clamp(260px, 38vw, 560px)`) + шары на skew-масках | да | `clamp(32px, 3.2vw, 52px)` сверху и снизу | да, оба шара выезжают за границы |
| форма | своего фона нет, наследует map | да | нет | нижний шар map |
| about | `background` на `<section>` | да | нет | да, `-34% -41%` и `-89% 47%` |
| involve | `::before` (`inset: 0`) с двойным клином + `::after` контур 1px | да | сверху и снизу | да, `-25% 50%` и `-78% 85%` |
| news | `background` + `::before` (`inset: 0`) | да | **нет** | да, `62% 106%` |
| resources | `background-color` + `::before` (`inset: -8%`) + `::after` (`inset: -24px`) | да, с запасом наружу | нет | да |
| footer | `background` + `::before` (`inset: 0`) + `::after` (760px по центру) | да | сверху `clamp(24px, 3vw, 44px)` | да, волны снизу |

Контент во всех секциях зажат в `max-width: 72rem` (`--ov-hero-content-width`,
`--ov-map-content-width`, `#ov-resources-content`), текстовые колонки — в `42rem`.

---

# 3. CTA-кнопка hero

## 3.1 Полный CSS

```css
@property --ov-hero-beam {
  syntax: "<angle>";
  initial-value: 0deg;
  inherits: false;
}

.ov-hero :is(.ov-hero-actions, .ov-hero-primary-action-shell) {
  margin: 12px 0 0;
  padding: 0;
  overflow: visible !important;
  border: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
  clip-path: none !important;
  contain: none !important;
}

.ov-hero :is(#ov-hero-primary-action, .ov-hero-primary-action) {
  --ov-hero-beam: 0deg;
  position: relative;
  z-index: 0;
  isolation: isolate;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 52px;
  padding: 16px 40px;
  overflow: hidden !important;
  border: var(--ov-hero-action-beam-width) solid transparent !important;
  border-radius: 999px;
  color: var(--ov-hero-action-label) !important;
  background:
    var(--ov-hero-action-surface) padding-box,
    conic-gradient(
      from var(--ov-hero-beam),
      transparent 0deg,
      transparent 238deg,
      var(--ov-hero-action-highlight-subtle) 270deg,
      var(--ov-hero-action-highlight) 294deg,
      white 304deg,
      rgb(var(--ov-signal-200-rgb)) 316deg,
      transparent 348deg,
      transparent 360deg
    ) border-box !important;
  box-shadow:
    inset 0 0 0 1px var(--ov-hero-action-inner-edge),
    var(--ov-hero-action-shadow);
  font-family: var(--ov-hero-font-body);
  font-size: 0.875rem;
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: 0.08em;
  text-decoration: none;
  text-transform: uppercase;
  transform: translateY(0);
  animation: ov-hero-beam var(--ov-hero-action-beam-duration) linear infinite;
  transition:
    box-shadow 320ms ease,
    transform 320ms cubic-bezier(0.22, 1, 0.36, 1);
}

.ov-hero :is(#ov-hero-primary-action, .ov-hero-primary-action)::before,
.ov-hero :is(#ov-hero-primary-action, .ov-hero-primary-action)::after {
  content: "";
  position: absolute;
  pointer-events: none;
}

.ov-hero :is(#ov-hero-primary-action, .ov-hero-primary-action)::before {
  z-index: 0;
  inset: 1px;
  border-radius: inherit;
  background:
    radial-gradient(circle at 20% 12%, rgb(var(--ov-signal-100-rgb) / 0.16), transparent 34%),
    linear-gradient(110deg, transparent 30%, rgb(255 255 255 / 0.08) 50%, transparent 70%);
}

.ov-hero :is(#ov-hero-primary-action, .ov-hero-primary-action)::after {
  z-index: 1;
  inset: 2px;
  border-radius: inherit;
  opacity: var(--ov-hero-action-texture-opacity);
  background-image: radial-gradient(
    circle,
    rgb(var(--ov-midnight-50-rgb) / 0.72) var(--ov-hero-action-texture-dot),
    transparent calc(var(--ov-hero-action-texture-dot) + 0.3px)
  );
  background-size:
    var(--ov-hero-action-texture-size)
    var(--ov-hero-action-texture-size);
  -webkit-mask-image: conic-gradient(
    from var(--ov-hero-beam),
    transparent 0deg 242deg,
    rgb(0 0 0 / 0.18) 260deg,
    black 286deg 316deg,
    rgb(0 0 0 / 0.18) 338deg,
    transparent 356deg 360deg
  );
  mask-image: conic-gradient(
    from var(--ov-hero-beam),
    transparent 0deg 242deg,
    rgb(0 0 0 / 0.18) 260deg,
    black 286deg 316deg,
    rgb(0 0 0 / 0.18) 338deg,
    transparent 356deg 360deg
  );
  animation: ov-hero-beam var(--ov-hero-action-beam-duration) linear infinite;
}

.ov-hero :is(#ov-hero-primary-action, .ov-hero-primary-action) > span {
  position: relative;
  z-index: 2;
}

.ov-hero :is(#ov-hero-primary-action, .ov-hero-primary-action):is(:hover, :focus-visible) {
  transform: translateY(-2px);
}

.ov-hero :is(#ov-hero-primary-action, .ov-hero-primary-action):focus-visible {
  outline: 2px solid var(--ov-hero-copy);
  outline-offset: 4px;
}

@keyframes ov-hero-beam {
  to {
    --ov-hero-beam: 360deg;
  }
}

@media (prefers-reduced-motion: reduce) {
  .ov-hero :is(#ov-hero-primary-action, .ov-hero-primary-action),
  .ov-hero :is(#ov-hero-primary-action, .ov-hero-primary-action)::before,
  .ov-hero :is(#ov-hero-primary-action, .ov-hero-primary-action)::after {
    transition: none;
    animation: none;
  }
}
```

Переменные кнопки:

```css
--ov-hero-action-surface: linear-gradient(
  125deg,
  rgb(var(--ov-signal-800-rgb)) 0%,
  rgb(var(--ov-unity-700-rgb)) 50%,
  rgb(var(--ov-horizon-700-rgb)) 100%
);
--ov-hero-action-surface-hover: linear-gradient(
  125deg,
  rgb(var(--ov-signal-700-rgb)) 0%,
  rgb(var(--ov-unity-600-rgb)) 50%,
  rgb(var(--ov-horizon-600-rgb)) 100%
);
--ov-hero-action-label: rgb(var(--ov-midnight-50-rgb));
--ov-hero-action-shadow:
  0 10px 30px rgb(var(--ov-unity-700-rgb) / 0.34),
  0 2px 10px rgb(3 2 18 / 0.28);
--ov-hero-action-inner-edge: rgb(var(--ov-unity-200-rgb) / 0.34);
--ov-hero-action-highlight: rgb(var(--ov-signal-100-rgb));
--ov-hero-action-highlight-subtle: rgb(var(--ov-horizon-300-rgb));
--ov-hero-action-beam-width: 1.5px;
--ov-hero-action-beam-duration: 3s;
--ov-hero-action-texture-size: 7px;
--ov-hero-action-texture-dot: 0.8px;
--ov-hero-action-texture-opacity: 0.42;
--ov-hero-copy: rgb(var(--ov-midnight-50-rgb) / 0.96);
--ov-hero-font-body: "Noto Sans", sans-serif;
```

## 3.2 Как это работает

**Луч по рамке.** Кнопка объявляет прозрачную рамку 1.5px и кладёт два фона в одно свойство:
поверхность в `padding-box`, конический градиент в `border-box`. Браузер рисует конус только там,
где поверхность его не закрывает, то есть в кольце рамки. Ни масок, ни лишних узлов. Конус
начинается от `--ov-hero-beam`, и `@keyframes ov-hero-beam` крутит эту переменную от 0° до 360° за
3s линейно. `@property` с `syntax: "<angle>"` обязателен: без регистрации браузер не умеет
интерполировать угол и анимация просто щёлкнет в конце.

Стопы конуса: мёртвая зона 0–238°, дальше horizon-300 на 270°, signal-100 на 294°, чистый белый на
304°, signal-200 на 316°, затухание к 348°. Ядро луча смещено к 304°, а хвост длиннее носа, поэтому
пятно читается как комета.

**Точки, которые проявляются и гаснут вслед за лучом.** Псевдоэлемент `::after` держит бесконечную
сетку точек: `radial-gradient(circle, rgb(midnight-50 / 0.72) 0.8px, transparent 1.1px)` с шагом
`7px 7px` и общей прозрачностью 0.42. Видимость этой сетки задаёт **маска из конического
градиента, привязанного к той же переменной** `--ov-hero-beam`:

```
transparent   0deg 242deg   ← точек не видно на 2/3 круга
rgb(0 0 0/.18) 260deg       ← 18% альфы: точки едва проступают перед лучом
black         286deg 316deg ← сектор полной видимости, 30° шириной
rgb(0 0 0/.18) 338deg       ← затухание за лучом
transparent   356deg 360deg
```

Сектор `286–316°` перекрывает ядро луча (`294–316°`), поэтому точки светятся ровно под ним и
растворяются в обе стороны через ступень 0.18. `::after` крутит свою копию `ov-hero-beam` с той же
длительностью 3s и той же кривой `linear`, поэтому маска и рамка идут синхронно. Переменная
объявлена `inherits: false`, так что у элемента и у псевдоэлемента свои независимые, но
одинаковые дорожки — важно не менять `animation-delay` ни одной из них.

**Слои по z.** `::before` (z 0) — блик: пятно signal-100 16% в левом верхнем углу плюс диагональная
полоса белого 8%. `::after` (z 1) — точки. `> span` (z 2) — подпись. `isolation: isolate` замыкает
стек внутри кнопки. `overflow: hidden !important` обрезает всё лишнее по радиусу 999px.

Ховер двигает кнопку на 2px вверх за 320ms, тень при этом не меняется. `--ov-hero-action-surface-hover`
объявлена, но в дампе нигде не применяется.

## 3.3 Расхождения с `.btn[data-beam]` в `src/styles/global.css`

| Что | Оригинал | У нас |
|---|---|---|
| Механика рамки | двойной фон `padding-box` + `border-box` на самой кнопке, `border: 1.5px solid transparent`, `overflow: hidden` | отдельный `::before` с `inset: -1.5px`, `padding: 1.5px`, `mask-composite: xor`, `z-index: -1`, `overflow: visible` |
| Стопы конуса | `transparent 0/238`, horizon-300 `270`, signal-100 `294`, `white 304`, signal-200 `316`, `transparent 348/360` | `transparent 0/238`, `#aad9dc 270`, `#f8eaf4 294`, `#fff 304`, `#f0d3e7 316`, `transparent 346` — почти совпало |
| **Маска точек** | `mask-image: conic-gradient(from var(--ov-hero-beam), …)` + собственная анимация 3s | **маски нет**: точки залиты по всей кнопке равномерно и не двигаются |
| Точки: радиус | `0.8px` / прозрачность на `calc(0.8px + 0.3px)` = 1.1px | `0.8px` / `1.1px` ✅ |
| Точки: шаг | `7px 7px` ✅ | `7px 7px` ✅ |
| Точки: прозрачность слоя | `0.42` ✅ | `.42` ✅ |
| Точки: цвет | `rgb(midnight-50 / 0.72)` | `rgb(248 247 251 / .72)` ✅ |
| Точки: положение | `inset: 2px`, `z-index: 1` (над бликом, под текстом) | `inset: 2px`, `z-index: -1` |
| Блик `::before` | `inset: 1px`, signal-100 16% в `20% 12%` + `linear-gradient(110deg, transparent 30%, rgb(255 255 255 / .08) 50%, transparent 70%)` | **нет** |
| Высота | `min-height: 52px` | `min-height: 56px` (переопределяет 52px у `.btn--primary`) |
| Поверхность | `linear-gradient(125deg, signal-800, unity-700 50%, horizon-700)` | `linear-gradient(125deg, #6c2c68, #3b4da1 50%, #39727e)` — середина взята со ступени unity-500, ярче оригинала |
| Внутренняя грань | `inset 0 0 0 1px rgb(unity-200 / 0.34)` | `inset 0 0 0 1px rgb(255 255 255 / .12)` |
| Тень | `0 10px 30px rgb(unity-700 / .34), 0 2px 10px rgb(3 2 18 / .28)` | `0 10px 30px rgb(59 77 161 / .34)` — второй, контактной тени нет |
| Ховер | `translateY(-2px)`, тень не меняется, 320ms | `translateY(-1px)` + усиленная тень |
| Фокус | `outline: 2px solid rgb(midnight-50 / .96)` (почти белый) | `outline: 2px solid #aad9dc` |
| Длительность луча | `3s linear infinite` ✅ | `3s linear infinite` ✅ |
| Reduced motion | `animation: none` и `transition: none` на кнопке и обоих псевдоэлементах | глобальный блок гасит по `[data-anim]`, плюс подменяет фон луча на `--gradient-action` с `opacity: .55` |

### Что править в первую очередь

1. Добавить `mask-image` / `-webkit-mask-image` с коническим градиентом на `.btn[data-beam="true"]::after`
   и повесить на него ту же анимацию `beam 3s linear infinite`. Без этого главный эффект кнопки
   отсутствует: точки должны появляться под лучом и гаснуть за ним.
2. Поднять `::after` из `z-index: -1` в положительный слой (`z-index: 1`) и обернуть подпись
   кнопки в `<span>` с `z-index: 2`, как в оригинале. Сейчас точки лежат под собственным фоном
   кнопки и работают только благодаря `isolation: isolate`.
3. Вернуть `min-height: 52px` и добавить блик `::before` (`inset: 1px`).
4. Заменить `inset 0 0 0 1px rgb(255 255 255 / .12)` на `rgb(143 157 214 / .34)` (unity-200) и
   дописать `0 2px 10px rgb(3 2 18 / .28)` в тень.

Черновик правки для `src/styles/global.css`:

```css
.btn[data-beam="true"]::after {
  content: "";
  position: absolute;
  inset: 2px;
  z-index: 1;
  border-radius: inherit;
  background-image: radial-gradient(circle, rgb(248 247 251 / .72) 0.8px, transparent 1.1px);
  background-size: 7px 7px;
  opacity: .42;
  pointer-events: none;
  -webkit-mask-image: conic-gradient(
    from var(--beam-angle),
    transparent 0deg 242deg,
    rgb(0 0 0 / 0.18) 260deg,
    black 286deg 316deg,
    rgb(0 0 0 / 0.18) 338deg,
    transparent 356deg 360deg
  );
  mask-image: conic-gradient(
    from var(--beam-angle),
    transparent 0deg 242deg,
    rgb(0 0 0 / 0.18) 260deg,
    black 286deg 316deg,
    rgb(0 0 0 / 0.18) 338deg,
    transparent 356deg 360deg
  );
  animation: beam 3s linear infinite;
}
```

Наш `@property --beam-angle` объявлен с `inherits: false`, поэтому анимация на `::after` заведёт
собственную дорожку — ровно как в оригинале. Проверить фолбэк `@supports not (background: conic-gradient(...))`:
там `::before` скрывается, а `::after` останется с маской, которая в таком браузере тоже не
сработает и покажет точки целиком. Это приемлемая деградация.

---

## Что стоит поднять из живой страницы

Переменные `--ov-about-*`, `--ov-involve-*`, `--ov-news-*`, `--ov-resources-*` и ступени палитры
`--color_bf0jyrdd-*` / `--color_jpfshcvb-*` / `--color_a7a2ya3x-*` / `--color_bolhbrje-*` в дамп не
попали. Если нужны точные цвета, снять их с onevoice27.org одной строкой в консоли:

```js
getComputedStyle(document.documentElement).cssText
```
