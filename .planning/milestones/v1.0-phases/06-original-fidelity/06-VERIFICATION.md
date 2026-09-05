---
phase: 06-original-fidelity
verified: 2026-09-05T21:01:56Z
status: passed
score: 21/21 must-haves verified
has_blocking_gaps: false
overrides_applied: 0
re_verification: null
---

# Фаза 6: Точность оригинала — отчёт о верификации

**Цель фазы:** Посетитель видит шапку, меню, фоны секций и кнопку hero, совпадающие с оригиналом onevoice27.org вплоть до цветов и анимаций: пилюля со скосом и градиентной рамкой, меню с градиентной заливкой текста на ховере и полноэкранным оверлеем на мобильном, полосы секций от края до края, луч с проявляющимися точками на кнопке.

**Проверено:** 2026-09-05T21:01:56Z
**Статус:** passed
**Повторная верификация:** нет, первичная
**Состояние дерева:** HEAD `9e333e5` == `origin/main`, рабочее дерево чистое (кроме нового `06-HUMAN-UAT.md`)

## Достижение цели

### Success Criteria из ROADMAP.md

| # | Критерий | Статус | Доказательство |
|---|----------|--------|----------------|
| SC1 | Шапка на 1440/1920 как в оригинале: параллелограмм 20°, радиус 18px, градиентная рамка, стекло midnight/.77 blur 18px, белый логотип, меню 16px/650/uppercase с градиентной заливкой за 360ms, скрытие за 420ms | ✓ VERIFIED | `Header.css:110-243` — `--radius-header: 18px` (`tokens.css:32`), `::before` рамка `linear-gradient(112deg, …)`, `::after` `rgb(7 2 16 / .77)` + `blur(18px) saturate(135%)`, оба слоя `skewX(calc(-1 * var(--header-skew)))` при `--header-skew: 20deg` с ≥1280; `.site-header__brand { color: rgb(255 255 255) }`; ссылки `1rem/650/-0.015em/uppercase`, span с `background-size: 230% 100%`, hover `0 50%` за `--dur-menu-hover: 360ms` `--ease-ui: cubic-bezier(0.22, 1, 0.36, 1)`; `.is-header-hidden` за `--dur-header: 420ms` `--ease-header: cubic-bezier(0.32, 0.72, 0, 1)`. В `dist/assets/index-CkEPhuiu.css` те же правила: `transform:skewX(calc(-1 * var(--header-skew)))`, `backdrop-filter:blur(18px)saturate(135%)`, `#070210c4`. SMOKE «Фаза 6»: 1152×80 на x=144 (1440) и x=384 (1920), `matrix(1, 0, -0.36397, 1, 0, 0)` = tan 20° |
| SC2 | На 390 бургер складывается в крест за 240ms, оверлей с радиальными пятнами и blur 24px, пункты 750 с разделителями и линией справа; Esc, фокус-ловушка, возврат фокуса | ✓ VERIFIED | `BurgerButton.tsx:27-38` — SVG `viewBox="0 0 64 28"`, три `rect`; `Header.css:263-291` — `transition: transform var(--dur-ui)` при `--dur-ui: 240ms`, три правила `.is-menu-open .burger__icon rect:nth-child(n)`; `Header.css:297-320` — два `radial-gradient` + `linear-gradient(145deg, …)`, `backdrop-filter: blur(24px) saturate(125%)`; `.mobile-menu__link { font-weight: 750 }`, `border-bottom` у `li`, `::after` линия справа `scaleX(.42) → scaleX(1)`; `MobileMenu.tsx:71-97` Esc + Tab-ловушка, `:34-42` inert соседей, `:59-66` возврат фокуса на бургер. Тесты `Header.test.tsx` (25 кейсов, включая «рисует бургер тремя линиями иконки 64×28»), `docs/qa/final-mobile-menu.jpeg` |
| SC3 | На 1920 каждая секция от hero до футера имеет фон от края до края; карта и форма на общей индиго-подложке со скосом, about на rgb(22 29 61), involve на скошенной полосе с линией, news и resources на rgb(18 12 52); карта заливает всю ширину | ✓ VERIFIED | Фон живёт на самих секциях: `map.css:251-287` (`rgb(18 12 52)`, `--map-wedge: clamp(32px, 3.2vw, 52px)`, `margin-top: calc(0px - var(--map-wedge) - 1px)`), `light-form.css:26-53` (`rgb(18 12 52)` + орб `::before`), `about.css:4-28` (`rgb(22 29 61)` + три радиальных + `linear-gradient(162deg, …)`), `involve.css:14-79` (`::before` clip-path `clamp(18px,3.6vw,52px)` / `clamp(16px,3vw,44px)`, `::after` с `mask-composite: exclude`, `opacity: .76`), `news.css:5-21` (`rgb(18 12 52)` + три радиальных), `resources.css:6-108` (`rgb(18 12 52)`, атмосфера `inset: -8%`, пять слоёв точек), `Quote.tsx:11` (градиент на `<section>`), `Footer.css:4-32`. Карта: `.map-shell` без `max-width`, `.map-stage` прямой ребёнок секции (`MapSection.tsx:57-71`). SMOKE: все `main > section` и footer шириной 1920, SVG карты 1920px от left 0; `final-full-1920.jpeg` против `docs/research/orig-full.jpeg` |
| SC4 | Кнопка hero и submit формы: конический луч по рамке 1.5px и сетка точек 7px под маской на той же переменной, период 3s; при reduced motion статичны | ✓ VERIFIED | `global.css:171-252` — `@property --ov-hero-beam { syntax: "<angle>" }`, `@keyframes hero-beam { to { --ov-hero-beam: 360deg } }`, `border: 1.5px solid transparent`, поверхность в `padding-box` + `conic-gradient(from var(--ov-hero-beam), …) border-box`, `animation: hero-beam 3s linear infinite`; `::after` `background-size: 7px 7px`, `opacity: .42`, `mask-image: conic-gradient(from var(--ov-hero-beam), …)` с той же анимацией; `global.css:334-340` reduced motion гасит `animation` у кнопки и `::after`. `Button.tsx:31-32` проставляет `data-beam` и `data-anim="beam"` варианту primary; `LightForm.tsx:282-293` — тот же primary с `size="form"` → `.btn[data-beam][data-size="form"] { width: 100%; min-height: 54px; padding: 14px 28px }`. В dist: `animation:3s linear infinite hero-beam`, `@property --ov-hero-beam`. Тесты `motionPolicy.test.ts` (3 кейса кнопки). `docs/qa/final-cta.jpeg` |
| SC5 | `npm test`, `npm run lint`, `npm run build`, `npm run check:dist` зелёные; Playwright smoke по проду на 1440/1920/390 без ошибок и 404; скриншоты обновлены | ✓ VERIFIED | Прогнал сам: `npm test` — 44 файла / 368 тестов, exit 0, предупреждений `act` нет; `npm run lint` — exit 0, вывод пуст; `npm run build` — exit 0, без предупреждения о чанке (максимум 394.24 kB при пороге 500); `node scripts/check-dist.mjs` — `OK: 11`. Ассеты `dist/index.html` и прода совпадают: `index-CJLwYwlR.js`, `index-CkEPhuiu.css`, `vendor-map-BjCgd77U.js`. SMOKE «Фаза 6»: 0 ошибок консоли, 0 из 60 ответов ≥ 400, 8 секций. Скриншоты `final-header-1920.jpeg`, `final-cta.jpeg`, `final-full-1920.jpeg`, `final-mobile-menu.jpeg` на месте |

### Must_haves планов 06-01…06-04

| # | План | Truth | Статус | Доказательство |
|---|------|-------|--------|----------------|
| 1 | 06-01 | Пилюля: fixed на всю ширину с отступом 16px, max-width 72rem, два псевдослоя, на ≥1280 skewX 20° с радиусом 18px и drop-shadow | ✓ VERIFIED | `Header.css:12-18` fixed + `width: 100%`; `:111-114` `width: calc(100% - 32px); margin: 16px` с ≥768; `:41-44` `max-width: 72rem; margin-inline: auto`; `:52-79` два псевдослоя; `:220-243` skew + три `drop-shadow` |
| 2 | 06-01 | Пункты меню ≥1024: 16px/650/-0.015em/uppercase, span с градиентом 230% и позицией 100% 50%, hover и focus-visible → 0 50% за 360ms; aria-current в позиции 0 50% | ✓ VERIFIED | `Header.css:178-217`; `Header.tsx:95-104` заворачивает подпись в `<span>` и ставит `aria-current`; тест «заворачивает подпись пункта в span» |
| 3 | 06-01 | Прокрутка вниз дальше высоты шапки ставит `is-header-hidden`, вверх снимает; при открытом меню шапка видна | ✓ VERIFIED | `useHeaderHide.ts:29-88` (порог 80px, гистерезис 4px, `requestAnimationFrame`, `return menuOpen ? false : hidden`); `Header.tsx:73-79` собирает класс; `useHeaderHide.test.ts` — 7 кейсов; `Header.test.tsx:157` «прячет шапку при прокрутке вниз и возвращает при прокрутке вверх» |
| 4 | 06-01 | Ниже 1024 бургер 48×48 с SVG 64×28 из трёх rect, крест за 240ms; оверлей с радиальными пятнами, linear 145deg и blur 24px, пункты 750 с разделителями и линией справа; Esc, ловушка, inert, возврат фокуса | ✓ VERIFIED | См. SC2. Плюс `Header.css:445-451` прячет бургер и оверлей с ≥1024 |
| 5 | 06-01 | Логотип белый, ширина 146/169/159px по брейкпоинтам | ✓ VERIFIED | `Header.css:82-90` `width: min(146px, 100%)`, `color: rgb(255 255 255)`; `:145-147` 169px; `:166-168` 159px. Тест «красит вордмарк шапки однотонным, без градиента футера» |
| 6 | 06-02 | Поверхность 125deg в padding-box, конический луч в border-box на рамке 1.5px, `--ov-hero-beam` крутится 3s linear infinite | ✓ VERIFIED | `global.css:185-219`, стопы совпадают с `06-02-PLAN.md:59` посимвольно |
| 7 | 06-02 | ::after — точки .8px шагом 7px с opacity .42 под конической маской на той же переменной | ✓ VERIFIED | `global.css:241-252` |
| 8 | 06-02 | ::before — блик radial 20% 12% + linear 110deg | ✓ VERIFIED | `global.css:230-236`, значения дословно из плана |
| 9 | 06-02 | Hover светлее и translateY(-1px); reduced motion гасит луч и маску | ✓ VERIFIED | `global.css:259-270` — `rgb(132 53 127)`, `rgb(79 93 175)`, `rgb(67 139 150)` светлее базовых `rgb(108 44 104)`, `rgb(59 77 161)`, `rgb(57 114 126)`; `:334-340` reduced motion. Тест «останавливает и луч, и маску точек при reduced motion» |
| 10 | 06-02 | Submit формы получает те же правила: width 100%, min-height 54px, padding 14px 28px | ✓ VERIFIED | `global.css:272-276`; `LightForm.tsx:282-293`; тест «даёт submit формы отдельный размер той же кнопки» |
| 11 | 06-03 | Каждая секция шириной окна, подложка на самой секции или её псевдоэлементах; базового rgb(7 2 16) между секциями нет, кроме hero | ✓ VERIFIED | Прошёл цепочку hero → map → light-form → about → involve → news → resources → quote → footer: у каждой краска на `<section>` или на псевдослое `inset: 0`, стыки закрыты отрицательными margin (`map.css:261`, `involve.css:20-21`, `Footer.css:11`) и переходными градиентами (`about.css:20-28`, `map.css:389-404`). SMOKE подтвердил на 1920 и 390 |
| 12 | 06-03 | Карта и форма на общей подложке rgb(18 12 52); скос сверху clamp(32px, 3.2vw, 52px) заходит под hero, SVG на всю ширину, верх закрыт переходом из rgb(7 2 16), форма продолжает подложку без шва | ✓ VERIFIED | `map.css:251-287`, `:377-404`; `light-form.css:26-30`. При 1440 `3.2vw` = 46.08px = 46px оригинала. `MapSection.tsx:66-71` — `.map-shell` вне колонки 72rem |
| 13 | 06-03 | About на rgb(22 29 61) с тремя радиальными и linear 162deg; involve — скошенная полоса с контуром; news rgb(18 12 52) с тремя радиальными без скоса; resources rgb(18 12 52) с атмосферой и пятислойными частицами; hero получает оверлей ::after; футер по значениям оригинала | ✓ VERIFIED | `about.css:11-16`; `involve.css:24-79`; `news.css:5-21`; `resources.css:6-92` (пять `radial-gradient` в `.resources-particles`); `hero.css:105-118`; `Footer.css:4-32`. Отступление: носителем атмосферы остался `<div data-anim="atmosphere">`, а не `::before` — псевдоэлемент на секции спрятал бы её содержимое от скринридера, а статичное reduce-правило погасило бы секцию целиком (`06-03-SUMMARY.md`, отступление 3). Наблюдаемый результат — полноширинный слой с `inset: -8%` — тот же |
| 14 | 06-03 | Тесты карты обновлены под полноширинный контейнер, `npm test` зелёный, единый блок reduced motion и реестр data-anim не нарушены | ✓ VERIFIED | `npm test` 368/368; `motionPolicy.test.ts` — «живёт в единственном блоке единственного файла», «не заводит значений вне закрытого списка», «проставлен на всех декоративных слоях оболочки, hero и карты» |
| 15 | 06-04 | Карточка «Скачать материалы» ведёт на #resources-materials и раскрывает панель материалов | ✓ VERIFIED | `copy.involve.ts:33` `href: "#resources-materials"`; `InvolveCard.tsx:24` рендерит `<a href>`; `Resources.tsx:16-75` — начальное состояние по хэшу + слушатель `hashchange` с прокруткой; тесты `Involve.test.tsx:7`, `Resources.test.tsx:193,205`; SMOKE пункт 8 на проде |
| 16 | 06-04 | Прод равен локальному dist; smoke по preview и проду на 1440/1920/390 без ошибок консоли и ответов ≥ 400; SMOKE.md дополнен разделом фазы 6; скриншоты обновлены | ✓ VERIFIED | Сверил сам: три ассета `dist/index.html` совпадают с `curl` по проду. `docs/qa/SMOKE.md` — раздел «Фаза 6» с таблицей оригинал/прод из 16 строк и вердиктом «принято». Восемь скриншотов фазы на месте |

**Счёт:** 21/21

### Требования

| Требование | План | Описание | Статус | Доказательство |
|------------|------|----------|--------|----------------|
| FID-01 | 06-01, 06-04 | Шапка и меню повторяют оригинал: пилюля-параллелограмм 20°, градиентная рамка и стекло, белый логотип, градиентная заливка текста на ховере, скрытие при прокрутке, бургер-крест и полноэкранный оверлей | ✓ SATISFIED | Truths 1–5, SC1, SC2 |
| FID-02 | 06-03, 06-04 | Фоны всех секций растянуты на всю ширину окна и повторяют градиенты, скосы и подложки оригинала; карта заливает всю ширину | ✓ SATISFIED | Truths 11–14, SC3 |
| FID-03 | 06-02, 06-04 | Кнопка hero и submit формы: конический луч по рамке и сетка точек под mask-image на той же переменной угла | ✓ SATISFIED | Truths 6–10, SC4 |

Осиротевших требований нет: `REQUIREMENTS.md` относит к фазе 6 ровно FID-01, FID-02, FID-03, и все три заявлены в планах.

### Артефакты

| Артефакт | Ожидание | Статус | Детали |
|----------|----------|--------|--------|
| `src/components/layout/Header.css` | CSS шапки, меню, бургера и оверлея по оригиналу | ✓ VERIFIED | 451 строка, `skewX` через `--header-skew: 20deg`, импортируется в `Header.tsx:11`, правила доехали до `dist/assets/index-CkEPhuiu.css` |
| `src/lib/useHeaderHide.ts` | Хук скрытия шапки при прокрутке вниз | ⚠️ VERIFIED с замечанием | 91 строка, полная реализация, покрыта семью тестами, вызывается из `Header.tsx:30`. Заявленный во frontmatter паттерн `is-header-hidden` в файле отсутствует: хук возвращает boolean, а имя класса собирает `Header.tsx:73-79`. Наблюдаемая истина 3 от этого не страдает, разделение ответственности чище |
| `src/styles/global.css` | `.btn[data-beam]`, `::before`, `::after`, `@property`, `@keyframes` | ✓ VERIFIED | 374 строки, все пять правил на месте, единый блок reduced motion сохранён |
| `src/components/map/map.css` | Подложка, скос и переходы карты | ✓ VERIFIED | 537 строк, `clamp(32px, 3.2vw, 52px)` присутствует и в исходнике, и в dist |
| `src/components/involve/involve.css` | Скошенная полоса и контур | ✓ VERIFIED | 300 строк, `mask-composite: exclude` в исходнике и в dist |
| `docs/qa/SMOKE.md` | Результаты приёмки фазы 6 | ✓ VERIFIED | Раздел «Фаза 6» с таблицей сравнения и списком сознательных отступлений |

### Ключевые связи

| От | К | Через | Статус | Детали |
|----|---|-------|--------|--------|
| `Header.tsx` | `useHeaderHide.ts` | Класс на контейнере | ✓ WIRED | `bm-sdk query verify.key-links`: `verified: true`. Импорт `Header.tsx:7`, вызов `:30`, класс `:73-79` |
| `Button.tsx` | `global.css` | `data-beam` + `data-anim="beam"` | ✓ WIRED | `Button.tsx:31-32, 40-41, 55-56`; тесты `primitives.test.tsx:123,128` |
| `LightForm.tsx` | `Button.tsx` | `variant="primary" size="form"` | ✓ WIRED | `LightForm.tsx:282-293` → `.btn[data-beam][data-size="form"]` |
| `MapSection.tsx` | `map.css` | `.map-shell` вне колонки 72rem | ✓ WIRED | `MapSection.tsx:57-71`, импорт `:12` |
| `copy.involve.ts` | `Resources.tsx` | Хэш `#resources-materials` | ✓ WIRED | `InvolveCard.tsx:24` → `Resources.tsx:16-75`, слушатель `hashchange` |

### Прослеживание потока данных (уровень 4)

Фаза меняет только представление, поэтому «данные» здесь — сами правила CSS: они должны доехать до собранного бандла и до прода.

| Артефакт | Что течёт | Источник | Реальные значения | Статус |
|----------|-----------|----------|-------------------|--------|
| `Header.css` | Скос, стекло, рамка | Vite CSS-пайплайн | `dist`: `transform:skewX(calc(-1 * var(--header-skew)))`, `backdrop-filter:blur(18px)saturate(135%)`, `#070210c4` (= rgb 7 2 16 / .77) | ✓ FLOWING |
| `global.css` | Луч и маска точек | Vite CSS-пайплайн | `dist`: `@property --ov-hero-beam`, `@keyframes hero-beam`, `animation:3s linear infinite hero-beam`, `mask-image:conic-gradient(from var(--ov-hero-beam)` | ✓ FLOWING |
| `map.css` | Скос карты | Vite CSS-пайплайн | `dist`: `--map-wedge:clamp(32px, 3.2vw, 52px)` | ✓ FLOWING |
| `involve.css` | Контур силуэта | Vite CSS-пайплайн | `dist`: `mask-composite:exclude` | ✓ FLOWING |
| Весь бандл | Прод отдаёт ту же сборку | GitHub Pages | Ассеты прода и `dist/index.html` совпадают: `index-CJLwYwlR.js`, `index-CkEPhuiu.css`, `vendor-map-BjCgd77U.js` | ✓ FLOWING |

### Поведенческие проверки

| Поведение | Команда | Результат | Статус |
|-----------|---------|-----------|--------|
| Тесты зелёные, без предупреждений act | `npm test` | 44 файла / 368 тестов, exit 0, stderr пуст | ✓ PASS |
| Линтер чист | `npm run lint` | exit 0, вывод пуст | ✓ PASS |
| Билд без предупреждения о чанке | `npm run build` | exit 0; максимум `index-CJLwYwlR.js` 394.24 kB при пороге 500 | ✓ PASS |
| Проверки дистрибутива | `node scripts/check-dist.mjs` | `OK: 11` | ✓ PASS |
| Прод равен dist | `grep 'assets/…' dist/index.html` против `curl` по проду | Три одинаковых ассета | ✓ PASS |
| Артефакты планов | `bm-sdk query verify.artifacts` (4 плана) | 5 из 6 passed; расхождение по `useHeaderHide.ts` разобрано выше | ✓ PASS |
| Ключевая связь 06-01 | `bm-sdk query verify.key-links` | `all_verified: true` | ✓ PASS |
| Тесты шапки существуют | `grep it\\( Header.test.tsx useHeaderHide.test.ts` | 25 + 7 кейсов, включая скрытие, бургер 64×28, ловушку фокуса | ✓ PASS |
| Тесты кнопки существуют | `grep it\\( motionPolicy.test.ts` | Кейсы луча, маски точек, reduce, размера submit | ✓ PASS |

### Прогон probe-скриптов

| Probe | Команда | Результат | Статус |
|-------|---------|-----------|--------|
| — | `find scripts -path '*/tests/probe-*.sh'` | Совпадений нет, планы и SMOKE probe-скриптов не объявляют | ? SKIP |

Роль probe в этом проекте играет `scripts/check-dist.mjs`: прогнал сам, `OK: 11`.

### Анти-паттерны

| Файл | Строка | Паттерн | Уровень | Влияние |
|------|--------|---------|---------|---------|
| — | — | `TODO` / `FIXME` / `XXX` / `HACK` / `TBD` / `PLACEHOLDER` в `src/` и `scripts/` | — | Совпадений нет |
| — | — | `outline: none` в `src/` | — | Единственное упоминание живёт в комментарии `motionPolicy.test.ts:146`, который это правило и запрещает |
| `src/state/lights.tsx` | 55 | `console.warn` | ℹ️ Info | Ветка ошибки: страна вне дивизиона. Не фаза 6, оставлено осознанно в фазе 5 |
| `src/components/layout/ErrorBoundary.tsx` | 35 | `console.error` | ℹ️ Info | Обработчик падения рендера. Не фаза 6 |

Пустых реализаций (`return null`, `=> {}`), захардкоженных пустых пропсов и заглушек в файлах фазы нет.

### Проверка человеком

Требований нет. Оркестратор прошёл девять сценариев через Playwright MCP по проду на 1440, 1920 и 390 и записал результаты в `docs/qa/SMOKE.md`, раздел «Фаза 6» (таблица оригинал/прод, 16 строк) и в `06-HUMAN-UAT.md` (`status: complete`, 9 passed, 0 issues). Ни один план фазы не объявлял отложенных `<human-check>`. Скриншоты `final-header-1920.jpeg`, `final-cta.jpeg`, `final-mobile-menu.jpeg` и `final-full-1920.jpeg` открыл и сверил с `docs/research/orig-full.jpeg`: пилюля-параллелограмм с градиентной рамкой, кнопка с лучом и точками, полноэкранный оверлей с крестом, сплошные полосы секций от края до края.

### Сводка

Пропусков нет. Все 21 must-have подтверждены кодом, собранным бандлом и прод-сборкой; отложенных на будущие фазы пунктов тоже нет, фаза 6 закрывает милестоун.

Два расхождения между буквой планов и кодом разобраны и признаны допустимыми:

1. `useHeaderHide.ts` не содержит строку `is-header-hidden` (frontmatter 06-01 её ждал). Хук отдаёт boolean, имя класса собирает `Header.tsx`. Наблюдаемое поведение совпадает с истиной 3, покрыто семью тестами хука и одним тестом компонента, подтверждено на проде.
2. Атмосферу секции ресурсов несёт `<div data-anim="atmosphere">` вместо `::before`. Псевдоэлемент на секции спрятал бы её содержимое от скринридера и попал бы под статичное reduce-правило частиц. Решение записано в `06-03-SUMMARY.md`.

Сознательные отступления от оригинала перечислены в `docs/qa/SMOKE.md`: бургер остаётся `<button>`, кольцо фокуса на пунктах меню сохранено, шрифт Onest вместо Figtree, активный пункт подсвечен как hover, горизонтальный overflow оригинала не скопирован (у нас `scrollWidth` равен `innerWidth` на шести ширинах, у оригинала на 1920 он 2338).

Бухгалтерия для оркестратора: в `REQUIREMENTS.md` FID-01, FID-02 и FID-03 стоят как `Pending`, в `ROADMAP.md` чекбокс фазы 6 не отмечен, хотя таблица прогресса показывает `Complete`. Это закрытие фазы, а не пробел в реализации.

---

_Проверено: 2026-09-05T21:01:56Z_
_Верификатор: Claude (gsd-verifier)_
