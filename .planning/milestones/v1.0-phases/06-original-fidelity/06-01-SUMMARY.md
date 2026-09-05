---
phase: 06-original-fidelity
plan: 01
subsystem: ui
tags: [css, header, navigation, skew, backdrop-filter, background-clip, react, a11y]

requires:
  - phase: 01-foundation
    provides: шапка с пилюлей, бургер, мобильный оверлей, useActiveSection, scrollLock, headerOffset
  - phase: 05-polish-and-release
    provides: единый блок prefers-reduced-motion в global.css и реестр data-anim
provides:
  - пилюля шапки из двух псевдослоёв со скосом 20° с 1280px, как в оригинале onevoice27.org
  - десктоп-меню с градиентом по тексту, который проезжает на hover и focus-visible
  - useHeaderHide: шапка прячется при прокрутке вниз и возвращается при прокрутке вверх
  - бургер-крест из SVG 64×28 и полноэкранный оверлей меню по CSS оригинала
  - --breakpoint-nav как единый источник границы строчного меню для CSS и JS
affects: [06-02-hero-button, 06-03-section-backgrounds, 06-smoke, любые будущие правки оболочки]

tech-stack:
  added: []
  patterns:
    - "Скос пилюли живёт на псевдослоях через skewX и компенсацию padding, без clip-path"
    - "Градиент по тексту пункта меню клипается на своём span, а не на всей ссылке"
    - "Состояния оболочки — классы is-header-hidden, is-menu-open, is-open, а не data-атрибуты"
    - "Границу, на которой сходятся CSS и JS, задаёт токен --breakpoint-nav"

key-files:
  created:
    - src/lib/useHeaderHide.ts
    - src/lib/useHeaderHide.test.ts
  modified:
    - src/components/layout/Header.css
    - src/components/layout/Header.tsx
    - src/components/layout/Header.test.tsx
    - src/components/layout/BurgerButton.tsx
    - src/components/layout/MobileMenu.tsx
    - src/components/layout/Wordmark.tsx
    - src/components/layout/Wordmark.test.tsx
    - src/lib/breakpoints.ts
    - src/lib/breakpoints.test.ts
    - src/lib/headerOffset.ts
    - src/styles/tokens.css
    - src/styles/global.css

key-decisions:
  - "Граница строчного меню вынесена в --breakpoint-nav 1024px: CSS оригинала разворачивает меню с 1024px, а наш JS закрывал оверлей с 768px"
  - "Вордмарк получил вариант tone=solid: в шапке он белый, градиент остаётся футеру"
  - "Ширины логотипа 146/169/159px перенесены на текстовый вордмарк вместе с header-локальным кеглем, иначе название переносится на вторую строку"
  - "Скос записан через --header-skew и --header-skew-comp: от угла считается компенсация padding"
  - "data-anim=header не заводили: у шапки только переходы, петель нет, и реестр motionPolicy остаётся закрытым"

patterns-established:
  - "Классы состояния оболочки вешает React, а всю анимацию ведёт CSS"
  - "Обработчик скролла складывает работу в кадр анимации через отдельный флаг scheduled"

requirements-completed: [FID-01]

duration: 22min
completed: 2026-09-05
---

# Phase 6 Plan 01: Шапка и главное меню по оригиналу Summary

**Пилюля шапки со скосом 20°, градиентной рамкой и стеклом, десктоп-меню с градиентом по буквам, скрытие при прокрутке и бургер-крест с полноэкранным оверлеем — всё по CSS живого onevoice27.org.**

## Performance

- **Duration:** 22 мин
- **Started:** 2026-09-05T20:15:00Z
- **Completed:** 2026-09-05T20:37:00Z
- **Tasks:** 3
- **Files modified:** 14 (12 изменено, 2 создано)

## Accomplishments

- Пилюля собрана из двух псевдослоёв: рамка `linear-gradient(112deg, ...)` и стекло `rgb(7 2 16 / .77)` с `blur(18px) saturate(135%)`. На мобильном от рамки остаётся линия 1.5px по нижнему краю, с 768px она уходит под стекло целиком, с 1280px оба слоя скошены и тень рисует `drop-shadow`.
- Пункты меню обёрнуты в `span` с градиентом `background-size: 230%`, который на hover и focus-visible проезжает справа налево за 360ms. Активный пункт (`aria-current`) стоит в той же позиции.
- `useHeaderHide` прячет шапку при уходе вниз дальше 80px и возвращает при движении вверх; при открытом меню шапка всегда видна.
- Бургер стал иконкой 64×28 из трёх `rect`, которые складываются в крест по классу `is-menu-open` на ландмарке; оверлей растянут на `100svh` с радиальными пятнами и пунктами 750 веса.
- A11y-механики сохранены целиком: `inert`, фокус-ловушка, Esc, возврат фокуса на бургер, блокировка скролла, кольцо `focus-visible`.

## Task Commits

1. **Task 1: Пилюля, логотип и десктоп-меню по CSS оригинала** — `e077093` (feat)
2. **Task 2: Скрытие шапки при прокрутке** — `09719e6` (feat)
3. **Task 3: Бургер-крест и мобильный оверлей по оригиналу** — `22c8db0` (feat)

## Files Created/Modified

- `src/components/layout/Header.css` — пилюля, логотип, десктоп-меню, бургер и оверлей по правилам оригинала; `clip-path` заменён на `skewX` с компенсацией padding
- `src/components/layout/Header.tsx` — разметка `site-header__content` / `site-nav` / `site-header__toggler`, классы состояния, подключение `useHeaderHide`
- `src/components/layout/BurgerButton.tsx` — SVG 64×28 из трёх `rect` вместо трёх span
- `src/components/layout/MobileMenu.tsx` — класс `is-open` вместо `data-open`, границы на `li`, `navQuery` вместо `desktopQuery`
- `src/components/layout/Wordmark.tsx` — проп `tone`: `solid` снимает градиент с названия
- `src/lib/useHeaderHide.ts` — хук скрытия шапки при прокрутке
- `src/lib/useHeaderHide.test.ts` — 7 кейсов: вниз, вверх, порог, дрожание, открытое меню, закрытие меню, размонтирование
- `src/lib/breakpoints.ts` — `navMinPx`/`navQuery` читают `--breakpoint-nav`
- `src/lib/headerOffset.ts` — запасное значение 88px под новую высоту пилюли
- `src/styles/tokens.css` — токены `--breakpoint-nav`, `--breakpoint-wide`; ambient-тень шапки переведена на unity-600
- `src/styles/global.css` — `--header-offset` 88/120/112px, `--dur-menu-hover`, правило reduced motion для шапки и оверлея
- `src/components/layout/Header.test.tsx`, `Wordmark.test.tsx`, `src/lib/breakpoints.test.ts` — тесты под новую разметку и границу

## Decisions Made

- **Граница строчного меню = 1024px и для CSS, и для JS.** CSS оригинала разворачивает меню в строку с 1024px, а наш `desktopQuery()` закрывал оверлей с 768px. Значение вынесено в токен `--breakpoint-nav`, который читают и `@media` в Header.css, и `navQuery()`.
- **Логотип: вариант `tone="solid"` вместо переопределения градиента в CSS.** Footer продолжает показывать градиентный вордмарк, шапка — белый, как в оригинале.
- **Ширины логотипа применены к текстовому вордмарку вместе с кеглем.** В оригинале логотип — картинка 146/169/159px; наш вордмарк набран текстом, поэтому в шапке ему заданы свои размеры шрифта и `white-space: nowrap`.
- **`data-anim="header"` не заводили.** У шапки только переходы, анимационных петель нет, а реестр `data-anim` в `motionPolicy.test.ts` остаётся закрытым списком из 05-UI-SPEC.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Разъезд границ CSS и JS между 768px и 1023px**
- **Found during:** Task 1 (пилюля и десктоп-меню)
- **Issue:** Правила оригинала показывают строчное меню с 1024px и прячут бургер там же, а `desktopQuery()` отдавал 768px: `MobileMenu` закрывал оверлей при переходе через 768px, когда пунктов в пилюле ещё нет. На ширине 768–1023px посетитель оставался без навигации.
- **Fix:** Добавлен токен `--breakpoint-nav: 1024px`; `desktopMinPx`/`desktopQuery` переименованы в `navMinPx`/`navQuery` и читают его; `@media` шапки берут значение через `theme(--breakpoint-nav)`.
- **Files modified:** src/styles/tokens.css, src/lib/breakpoints.ts, src/lib/breakpoints.test.ts, src/components/layout/Header.tsx, src/components/layout/MobileMenu.tsx, src/components/layout/Header.css, src/components/layout/Header.test.tsx
- **Verification:** `npx vitest run src/lib/breakpoints.test.ts src/components/layout` — зелёно; в собранном CSS присутствуют `@media (width>=1024px)` и `@media (width>=1280px)`
- **Committed in:** `e077093`

**2. [Rule 1 - Bug] Троттлинг скролла блокировался после первого кадра**
- **Found during:** Task 2 (скрытие шапки)
- **Issue:** Флагом «кадр запрошен» служил номер из `requestAnimationFrame`. Колбэк, вызванный до возврата номера, обнулял переменную, после чего присваивание записывало в неё номер кадра, и следующий скролл уже не обрабатывался. Тест хука поймал это на подмене `requestAnimationFrame`.
- **Fix:** Заведён отдельный флаг `scheduled`, который снимает сам колбэк; номер кадра нужен только для `cancelAnimationFrame`.
- **Files modified:** src/lib/useHeaderHide.ts
- **Verification:** `npx vitest run src/lib/useHeaderHide.test.ts` — 7 кейсов зелёные, включая возврат шапки при прокрутке вверх
- **Committed in:** `09719e6`

**3. [Rule 2 - Missing Critical] Сброс скрытия при переключении меню**
- **Found during:** Task 2 (скрытие шапки)
- **Issue:** Шапка, спрятанная перед открытием меню, уезжала вверх сразу после его закрытия — вместе с бургером, на который фокус-ловушка возвращает фокус. Клавиатурный пользователь терял активный элемент из виду.
- **Fix:** Состояние сбрасывается на переключении `menuOpen` во время рендера (правило `react-hooks/set-state-in-effect` запрещает делать это в эффекте).
- **Files modified:** src/lib/useHeaderHide.ts
- **Verification:** тест «после закрытия меню не прячет шапку задним числом»; `npm run lint` чист
- **Committed in:** `09719e6`

**4. [Rule 2 - Missing Critical] `--header-offset` под новую высоту пилюли**
- **Found during:** Task 1 (пилюля)
- **Issue:** Пилюля выросла с 48px до 72/88/80px, а `--header-offset` и запасное значение в `headerOffset.ts` остались от старой высоты: переход по якорю приводил бы заголовок секции под шапку.
- **Fix:** `--header-offset` пересчитан на 88/120/112px по трём границам, `HEADER_OFFSET_FALLBACK` — на 88; ожидания в тестах переведены на константу вместо литералов.
- **Files modified:** src/styles/global.css, src/lib/headerOffset.ts, src/components/layout/Header.test.tsx
- **Verification:** `npx vitest run src/lib src/components/layout` — зелёно
- **Committed in:** `e077093`

---

**Total deviations:** 4 auto-fixed (2 bug, 2 missing critical)
**Impact on plan:** Все четыре правки нужны для корректности навигации и переходов по якорям. Объём плана не расширялся.

## Assumption Drift (advisory)

**1. Ширина логотипа: картинка в оригинале против текста у нас**
- **Found during:** Task 1
- **Planned:** «Логотип белый, ширина 146/169/159px по брейкпоинтам» — как у растрового логотипа оригинала.
- **Actual:** Наш вордмарк набран текстом в две строки. При штатном кегле (`--text-wordmark` до 22px) название не влезает в 146–159px и переносится, распирая пилюлю. Слот сохранён, но в шапке вордмарку заданы свои размеры шрифта (17/19/18px), уменьшенный трекинг подписи и `white-space: nowrap`.
- **Why:** Размеры оригинала описывают картинку фиксированной ширины; текст той же ширины требует своего кегля.

**2. Компенсация скоса 22px против расчётной**
- **Found during:** Task 1
- **Planned:** `--header-skew-comp: 22px` с уточнением через `tan()`.
- **Actual:** Оба значения перенесены дословно, но расходятся: `calc(80px * tan(20deg) / 2)` даёт ≈14.6px. В браузерах с поддержкой `tan()` (все актуальные) работает расчётная величина, 22px остаётся запасной.
- **Why:** Значения сняты с оригинала как есть; сверять их имеет смысл на визуальном smoke.

## Issues Encountered

- Правило `react-hooks/set-state-in-effect` не пропускает сброс состояния в эффекте. Решено штатным приёмом React: состояние подстраивается во время рендера по изменению пропа.
- Оверлей меню держит `<nav>` внутри диалога (в оригинале его нет): ландмарка навигации остаётся, `.mobile-menu__nav { width: 100% }` не мешает центрированию списка.

## Verification

Что прогнано и с каким результатом:

- `npm test` — 44 файла, **359 тестов зелёные** (было 346; добавлено 13)
- `npm run lint` — чисто, ни одного сообщения
- `npm run build` — собрано за 177 мс, предупреждений о размере чанков нет (`index` 394.61 kB, порог Vite 500 kB)
- `npm run check:dist` — 11 проверок OK
- Критерии приёмки грепом: `skewX(calc(-1 * var(--header-skew)))` = 2, `background-clip: text` = 2, `blur(18px) saturate(135%)` = 2, `clip-path` = 0, `viewBox="0 0 64 28"` = 1, `rotate(45deg)` = 1, `blur(24px) saturate(125%)` = 2, `min(100%, 36rem)` = 1, `is-header-hidden` в Header.tsx = 1
- В собранном CSS присутствуют `@media (width>=1024px)`, `@media (width>=1280px)`, `--header-skew-comp` и вложенный `@supports (width:calc(1px * tan(1deg)))`

**Что не проверено:** визуальная сверка с оригиналом на 1440 и 1920, ховер пункта меню, поведение прокрутки в браузере и оверлей на 390px. Playwright в этой сессии недоступен, браузерного прогона не было. Раздел `<verification>` плана остаётся за визуальным smoke фазы.

## User Setup Required

None — внешние сервисы не задействованы.

## Next Phase Readiness

- Файлы шапки развязаны с планом 06-02 (кнопка hero): пересечение только в `src/styles/global.css`, где правки лежат в блоке `:root` и в конце блока reduced motion, а `.btn[data-beam]` не тронут.
- Для 06-03 (фоны секций) шапка задаёт верхний отступ контента: `--header-offset` теперь 88/120/112px.
- Открытый вопрос к визуальному smoke: величина компенсации скоса (22px против расчётных ≈14.6px) и кегль вордмарка в пилюле.

---
*Phase: 06-original-fidelity*
*Completed: 2026-09-05*

## Self-Check: PASSED

Все перечисленные файлы найдены на диске, все три хэша коммитов присутствуют в истории ветки `agent-06-01`.
