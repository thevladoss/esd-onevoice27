# Phase 6: Точность оригинала: меню, фоны, кнопка - Context

**Gathered:** 2026-09-05
**Status:** Ready for planning
**Mode:** Autonomous, по правкам пользователя после приёмки фазы 5 (пользователь недоступен до утра)

<domain>
## Phase Boundary

Пользователь сравнил прототип с оригиналом https://onevoice27.org/ и просит три вещи, дословно: «главное меню не такое как в оригинале, должно быть точно такое же вплоть до анимаций и цветов»; «фоны не везде распространяются на всю ширину, надо максимально в точности следовать фонам в оригинале»; «кнопка на главной чуть другая: точки на ней вслед за анимацией вокруг проявляются и исчезают». Новых секций и контента фаза не добавляет; тексты остаются русскими, структура секций прежняя.

Требования: FID-01 (шапка и меню), FID-02 (фоны секций на всю ширину), FID-03 (кнопка hero с лучом и точками).

</domain>

<decisions>
## Implementation Decisions

### Источник истины
- Правила берутся из живого CSS оригинала (таблицы стилей страницы, снятые через Playwright 2026-09-05, и `docs/research/orig-custom-styles.css`); цвета переносятся числами RGB из вычисленных значений оригинала, а не по именам наших токенов. Разбор с verbatim-блоками лежит в `docs/research/orig-fidelity-css.md`.
- Figtree в оригинале заменяется на Onest (кириллица), остальное копируется как есть.

### Шапка и меню (FID-01)
- Контейнер `position: fixed; inset-inline: 0; top: 0; width: 100%` (на ≥768 `width: calc(100% - 32px)` с отступом 16px), внутри пилюля `max-width: 72rem; margin-inline: auto; display: grid; grid-template-columns: minmax(0,1fr) auto` (≥1024: `auto minmax(0,1fr)`), min-height 72/88/80px (mobile/tablet/desktop), padding-inline 20/28/32px (+22px компенсации скоса на ≥1280), radius 12px (≥768) и 18px (≥1280).
- Два псевдослоя пилюли: `::before` градиентная рамка `linear-gradient(112deg, rgb(210 142 190 / .82), rgb(105 120 195 / .42) 43%, rgb(255 255 255 / .12) 68%, rgb(84 164 172 / .76))`, `::after` поверхность `linear-gradient(180deg, rgb(255 255 255 / .07), transparent 42%), rgb(7 2 16 / .77)` с `backdrop-filter: blur(18px) saturate(135%)`, inset 1.5px. На ≥1280 оба слоя `transform: skewX(-20deg)`, `::before` с `filter: drop-shadow(0 3px 7px rgb(5 3 20/.28)) drop-shadow(0 18px 30px rgb(5 3 20/.24)) drop-shadow(0 8px 24px rgb(59 77 161/.10))`; на 768–1279 вместо фильтра `box-shadow: 0 3px 7px rgb(5 3 20/.28), 0 18px 42px rgb(5 3 20/.30), 0 8px 34px rgb(59 77 161/.13)`; на мобильном пилюля без радиуса, `::before` превращается в линию 1.5px по нижнему краю, тень `0 12px 28px rgb(5 3 20/.22)`.
- Логотип белый (`rgb(255,255,255)`), ширина 146/169/159px; наш Wordmark «Единый голос 27 / Миссия для всех» остаётся, но окрашивается в белый как в оригинале (без градиента).
- Десктоп-меню (≥1024): `ul` в ряд, `gap: clamp(1.25rem, 2.6vw, 2.75rem)`, ссылки `min-height 2.75rem; padding .5rem 0; font-size 1rem; font-weight 650; letter-spacing -0.015em; uppercase; color rgb(248 247 251 / .9)`; текст внутри `span` с градиентом `linear-gradient(90deg, rgb(210 142 190/.82) 0%, rgb(105 120 195/.42) 18%, rgb(84 164 172/.76) 36%, rgb(248 247 251/.9) 48%, rgb(248 247 251/.9) 100%)`, `background-size 230% 100%; background-position 100% 50%; background-clip text; color transparent`, на hover/focus-visible `background-position 0 50%` за 360ms `cubic-bezier(.22,1,.36,1)`.
- Скрытие при прокрутке: класс `is-header-hidden` → `transform: translateY(calc(-100% - 2rem)); opacity: 0`, переход `transform 420ms cubic-bezier(.32,.72,0,1), opacity 302ms ease`; шапка прячется при прокрутке вниз дальше своей высоты и возвращается при прокрутке вверх; при открытом меню всегда видна.
- Бургер (<1024): кнопка 48×48, иконка SVG 64×28 из трёх `rect` (rx 2, высота 4, y 0/12/24, средний x 6 ширина 52), `fill: currentColor`, цвет rgb(248 247 251), hover rgb(170 217 220); в открытом состоянии верхний `opacity 0; translateY(-8px) scaleX(.72)`, средний `scaleX(1.2308) rotate(45deg)`, нижний `translateY(-12px) rotate(-45deg)`, `transform-box: fill-box; transform-origin: center`, переход 240ms.
- Мобильное меню: `position: fixed; inset 0; height 100svh; display flex; column; center`, padding `calc(72px + 1rem) clamp(24px, 7vw, 56px)`, фон `radial-gradient(circle at 14% 18%, rgb(158 67 154 / .22), transparent 38%), radial-gradient(circle at 88% 78%, rgb(67 139 150 / .18), transparent 42%), linear-gradient(145deg, rgb(7 2 16 / .98), rgb(<unity-950> / .97))`, `backdrop-filter: blur(24px) saturate(125%)`; закрыто: `visibility hidden; opacity 0; translateY(-12px)`, открыто: `opacity 1; translateY(0)` за 240ms; список `width: min(100%, 36rem)`, пункты с разделителями `1px solid rgb(<unity-300> / .18)` (у первого ещё сверху), ссылки `min-height 4.75rem; padding-inline .25rem 2.5rem; font-size clamp(1.65rem, 8vw, 2.6rem); font-weight 750; line-height 1.08; letter-spacing -.035em; color rgb(248 247 251 / .9)`, `::after` линия 1.5rem×1px справа `scaleX(.42)` → hover `scaleX(1)`, hover цвет rgb(231 245 245) и `padding-left .75rem`. Наши a11y-механики (inert, фокус-ловушка, Esc, возврат фокуса, блокировка скролла) сохраняются.
- reduced motion: все переходы шапки `transition-duration: .01ms`.

### Кнопка hero (FID-03)
- Селектор наш `.btn[data-beam]` (hero CTA и submit формы, как в оригинале). Правила оригинала целиком: `--ov-hero-beam: 0deg; position relative; isolation isolate; min-height 52px; padding 16px 40px; border-radius 999px; border: 1.5px solid transparent; background: linear-gradient(125deg, rgb(108 44 104) 0%, rgb(59 77 161) 50%, rgb(57 114 126) 100%) padding-box, conic-gradient(from var(--ov-hero-beam), transparent 0deg 238deg, rgb(123 194 199) 270deg, rgb(248 234 244) 294deg, white 304deg, rgb(240 211 231) 316deg, transparent 348deg 360deg) border-box; box-shadow: inset 0 0 0 1px rgb(217 222 244 / .34), 0 10px 30px rgb(59 77 161 / .34), 0 2px 10px rgb(3 2 18 / .28); font 700 .875rem/1.2, letter-spacing .08em, uppercase; animation: hero-beam 3s linear infinite; transition: box-shadow 320ms, transform 320ms cubic-bezier(.22,1,.36,1); overflow hidden`.
- `::before` (inset 1px, radius inherit): `radial-gradient(circle at 20% 12%, rgb(248 234 244 / .16), transparent 34%), linear-gradient(110deg, transparent 30%, rgb(255 255 255 / .08) 50%, transparent 70%)`.
- `::after` (inset 2px, radius inherit, z-index 1, opacity .42): точки `radial-gradient(circle, rgb(248 247 251 / .72) .8px, transparent 1.1px)` с `background-size 7px 7px`, `mask-image: conic-gradient(from var(--ov-hero-beam), transparent 0deg 242deg, rgb(0 0 0 / .18) 260deg, black 286deg 316deg, rgb(0 0 0 / .18) 338deg, transparent 356deg 360deg)`, та же анимация `hero-beam 3s linear infinite`. `@property --ov-hero-beam { syntax: "<angle>"; inherits: false; initial-value: 0deg }`, `@keyframes hero-beam { to { --ov-hero-beam: 360deg } }`. Так точки проявляются в секторе луча и гаснут за ним.
- Hover в оригинале меняет поверхность на `linear-gradient(125deg, rgb(<signal-700>), rgb(<unity-600>), rgb(<horizon-600>))` и `transform: translateY(-1px)`; reduced motion останавливает луч и маску (`animation: none`), точки статичны.

### Фоны секций (FID-02)
- Каждая секция получает фон на самом полноширинном `<section>` (100% ширины окна), а не на внутреннем контейнере; контент остаётся в `max-width: 72rem`. Все градиенты, скосы и линии переносятся из оригинала verbatim (см. `docs/research/orig-fidelity-css.md`, раздел 2): hero `::after` (линейный к верху rgb(8 3 19) 5.88% → transparent 28.15% плюс радиальные атмосферы), карта `::before` с тремя радиальными и `clip-path: polygon(0 46px, 100% 0, 100% 100%, 0 100%)` на подложке rgb(18 12 52); форма живёт на той же подложке, что карта (в оригинале форма внутри секции карты); «Что такое» база rgb(22 29 61) с тремя радиальными и линейным 162deg; «От убеждения» полоса `::before` со скосами сверху 51.84px и снизу 43.2px и тонкая линия `::after` `linear-gradient(90deg, transparent, rgb(227 175 210 / .48) 28%, rgb(184 192 230 / .42) 62%, transparent)` opacity .76; новости rgb(18 12 52) с тремя радиальными; ресурсы rgb(18 12 52) с `::before` (радиальные + linear 145deg, inset отрицательный) и частицами `::after`; футер по оригиналу.
- Карта становится полноширинной: контейнер SVG на 100vw (без боковых полей), `fitExtent` под полную ширину, свечение огоньков доходит до краёв, как у Mapbox-карты оригинала; счётчики и чипы остаются в контейнере 72rem поверх карты.
- Цитата (секции нет в оригинале, контент ЕАД) сохраняет свой градиент, но растягивается на всю ширину той же логикой.

### Claude's Discretion
- Точные значения там, где оригинал использует переменные без публичного значения (например `--ov-unity-950`), берутся из вычисленных RGB палитры оригинала (см. RESEARCH).
- Порядок планов: шапка, кнопка и фоны независимы по файлам и исполняются параллельно; smoke и деплой последним.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/layout/Header.tsx`, `BurgerButton.tsx`, `MobileMenu.tsx`, `Header.css` (a11y-механики меню, useActiveSection, scrollLock) — остаются, меняется разметка/стили под оригинал.
- `src/components/layout/Button.tsx` и `.btn[data-beam]` в `src/styles/global.css` — луч уже на `@property`, добавить `::before`/`::after` и точные цвета.
- Секции: `src/components/hero/hero.css`, `map/map.css`, `form/light-form.css`, `about/*`, `involve/*`, `news/News.tsx` (Tailwind-классы фона), `resources/resources.css`, `quote/*`, `layout/Footer.css`.
- Тест-инварианты: `src/styles/motionPolicy.test.ts` (единый блок reduced motion, реестр `data-anim`, запрет `outline: none`), `App.test.tsx` (нет `<p>` в кнопках), `Header.test.tsx`.

### Established Patterns
- Компонент = папка, CSS рядом, токены в `@theme`, reduced motion в едином блоке `global.css` через `[data-anim]`.
- Приёмка: `npm test`, `npm run lint`, `npm run build`, `npm run check:dist`, Playwright smoke по preview и проду с записью в `docs/qa/SMOKE.md`.

### Integration Points
- Новые анимации (`hero-beam` уже есть; появятся переходы шапки) должны попасть в реестр `data-anim`/блок reduced motion, иначе `motionPolicy.test.ts` упадёт.
- Полноширинная карта меняет `EsdMap`/`useMapZoom` расчёт `fitExtent` — тесты карты фазы 2 нужно обновить.

</code_context>

<specifics>
## Specific Ideas

- Скриншоты оригинала для сверки: `docs/research/orig-full.jpeg`, снимки сессии: шапка 1440 (пилюля-параллелограмм со скосом 20°, белый логотип, пункты uppercase), мобильное меню (полноэкранный оверлей с разделителями и линиями справа), кнопка hero (луч и точки).
- Сравнить после правок бок о бок на 1440 и 1920: полосы секций должны идти от края до края без «чёрных» промежутков между ними.

</specifics>

<deferred>
## Deferred Ideas

- Фото-обложки триптиха и новостей как в оригинале (у нас SVG и превью YouTube) — вне запроса.
- Футер оригинала (центрированный логотип) — пользователь не просил, оставить.

</deferred>
