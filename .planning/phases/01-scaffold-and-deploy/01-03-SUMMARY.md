---
phase: 01-scaffold-and-deploy
plan: 03
subsystem: ui
tags: [react, header, navigation, accessibility, focus-trap, intersection-observer, css]

requires:
  - phase: 01-01
    provides: "copy.ts (shell, sectionIds), Wordmark, токены tokens.css и global.css, моки jsdom в setup.ts, композиция App.tsx"
provides:
  - "Header-пилюля со стеклом, световой полосой, скосом 20° и уплотнением при скролле"
  - "Четыре якоря меню с градиентным подчёркиванием и aria-current активной секции"
  - "BurgerButton 48×48 с aria-expanded, aria-controls и крестом при открытии"
  - "MobileMenu: диалог с фокус-трапом, Esc, кликом по фону, блокировкой скролла и закрытием на десктопе"
  - "scrollToSection(hash, headerHeight): прокрутка по формуле offsetTop − headerHeight − 16 с учётом reduced motion"
  - "useActiveSection(ids, enabled): активная секция через IntersectionObserver"
affects: [02-hero-and-map, 03-content-sections, 04-resources-and-quote, 05-motion-and-polish]

tech-stack:
  added: []
  patterns:
    - "Медиазапросы в React читаются через useSyncExternalStore, а не через setState в эффекте: eslint-plugin-react-hooks 7 запрещает set-state-in-effect"
    - "Стекло и скос живут на псевдоэлементах, сама ландмарка остаётся без transform и backdrop-filter, чтобы position: fixed внутри неё считался от вьюпорта"
    - "CSS компонента лежит рядом с ним (Header.css) и импортируется из TSX; vitest собран с css: false, поэтому в тестах стили не мешают"
    - "Тесты подменяют window.matchMedia присваиванием свойства: vi.spyOn поверх мока из setup.ts возвращает тот же мок и затирает его реализацию для остальных тестов файла"

key-files:
  created:
    - src/lib/scrollToSection.ts
    - src/lib/scrollToSection.test.ts
    - src/lib/useActiveSection.ts
    - src/lib/useActiveSection.test.ts
    - src/components/layout/Header.css
    - src/components/layout/BurgerButton.tsx
    - src/components/layout/MobileMenu.tsx
    - src/components/layout/Header.test.tsx
  modified:
    - src/components/layout/Header.tsx

key-decisions:
  - "Скос 20° сделан через skewX на псевдоэлементах пилюли, а не через clip-path на оболочке: clip-path срезает тень и скруглённые углы, а drop-shadow на предке ломает backdrop-filter"
  - "Оверлей меню рендерится соседом пилюли внутри header и получает z-index 1 против z-index 2 у пилюли: порядок слоёв совпадает с таблицей UI-SPEC (50/45), но управляется одним стековым контекстом header"
  - "useMediaQuery построен на useSyncExternalStore вместо useState + useEffect из-за правила react-hooks/set-state-in-effect"
  - "В фокус-трап входит бургер как кнопка закрытия: Tab с последней ссылки оверлея ведёт на него, Shift+Tab с бургера — на последнюю ссылку"

patterns-established:
  - "Прокрутка к якорям: чистая функция scrollToSection, никакого scrollIntoView, отсутствие цели — молчаливый выход без записи в консоль и без правки location.hash"
  - "Диалоги закрываются тремя способами (кнопка, Esc, клик по фону) и восстанавливают document.body.style.overflow к сохранённому значению, а не к пустой строке"
  - "Названия тестов на русском, секции-цели создаются в document.body и убираются в afterEach"

requirements-completed: [SHELL-01, SHELL-02, SHELL-03]

duration: 13min
completed: 2026-09-05
---

# Phase 01 Plan 03: Header-пилюля с меню, бургером и оверлеем Summary

**Плавающий стеклянный header со скосом 20° на псевдоэлементах, четырьмя якорями с aria-current, уплотнением после 24px скролла и мобильным оверлеем с фокус-трапом, Esc и блокировкой скролла.**

## Performance

- **Duration:** 13 мин
- **Started:** 2026-09-05T15:26:30Z
- **Completed:** 2026-09-05T15:39:20Z
- **Tasks:** 3
- **Files modified:** 9 (8 создано, 1 изменён)

## Accomplishments

- Заглушка `<header />` заменена на пилюлю оригинала: стекло `blur(18px) saturate(135%)`, поверхность `rgb(7 2 16 / .77)`, световая полоса по верхней грани, скос 20° от 1024px, уплотнение padding-block 20px → 12px после 24px скролла.
- Навигация закрывает SHELL-01: вордмарк-ссылка на `#top`, четыре якоря «Что это?», «Участвовать», «Новости», «Материалы» с градиентным подчёркиванием на hover, focus-visible и `aria-current="true"` у активной секции.
- Мобильный оверлей закрывает SHELL-02: открывается бургером, закрывается кнопкой, Esc, кликом по фону и переходом на десктопную ширину; блокирует скролл body, держит фокус по кругу и возвращает его на бургер.
- Прокрутка закрывает SHELL-03: `offsetTop − headerHeight − 16`, `behavior` переключается на `auto` при `prefers-reduced-motion`, `scrollIntoView` в исходниках отсутствует.
- Прогоны наблюдал лично: `npm test` — 5 файлов, 31 тест, код 0; `npm run build` код 0; `npm run lint` код 0. В собранном CSS (`dist/assets/index-*.css`) присутствуют `skewX`, `mobile-menu` и `site-header`.

## Task Commits

Каждая задача шла по циклу RED → GREEN:

1. **Task 1: scrollToSection и useActiveSection с unit-тестами** — `845a012` (test), `47b9649` (feat)
2. **Task 2: Header-пилюля с вордмарком, меню, уплотнением и активным пунктом** — `b7bb256` (test), `f98d5e4` (feat)
3. **Task 3: Мобильный оверлей меню с фокус-трапом, Esc и блокировкой скролла** — `fc809ac` (test), `d370570` (feat), `70fac7a` (test, проверка снятия `inert`)

## Files Created/Modified

- `src/lib/scrollToSection.ts` — чистая функция прокрутки: `#top` в ноль, `getElementById` без интерполяции селекторов, `Math.max(0, offsetTop − headerHeight − 16)`, `behavior` от `prefers-reduced-motion`
- `src/lib/scrollToSection.test.ts` — 6 тестов: формула, обрезка до нуля, молчание без цели, `#top`, reduced motion, якорь без решётки
- `src/lib/useActiveSection.ts` — `IntersectionObserver` с `rootMargin: "-40% 0px -55% 0px"`, выбор записи с наибольшим `intersectionRatio`, `disconnect` в cleanup
- `src/lib/useActiveSection.test.ts` — 3 теста: выключенный хук не создаёт наблюдателя, включённый наблюдает каждую секцию и отключается при размонтировании
- `src/components/layout/Header.tsx` — ландмарка с `data-scrolled`, слушателем скролла `{ passive: true }`, `useMediaQuery` на `useSyncExternalStore`, вордмарком, меню, бургером и оверлеем
- `src/components/layout/Header.css` — стекло и световая полоса на псевдоэлементах, скос от 1024px, уплотнение, подчёркивание пунктов, бургер 48×48 с линиями 28px, оверлей меню
- `src/components/layout/BurgerButton.tsx` — кнопка с `aria-expanded`, `aria-controls="mobile-menu"` и подписью «Открыть меню» / «Закрыть меню»
- `src/components/layout/MobileMenu.tsx` — `div#mobile-menu` с `role="dialog"`, `aria-modal="true"`, `inert` и `aria-hidden` в закрытом виде, четырьмя эффектами (скролл, фокус, клавиатура, ширина экрана)
- `src/components/layout/Header.test.tsx` — 16 тестов: восемь на десктопный header, восемь на оверлей

## Decisions Made

- **Скос через `skewX` на псевдоэлементах.** `clip-path: polygon(...)` на оболочке срезал бы тень и скруглённые углы, а `filter: drop-shadow` на предке сделал бы его backdrop root и убил стекло. Оригинал (`docs/research/orig-custom-styles.css`, строки 405–428) режет угол теми же `skewX` на `::before` и `::after`, горизонтальный padding компенсирует срезанные углы через `--header-skew-inset`. Визуальный результат тот же параллелограмм 20°.
- **Оверлей внутри `header`, а не соседом.** У пилюли есть `backdrop-filter` и `transform`, любой `position: fixed` внутри неё считался бы от неё, а не от вьюпорта. Поэтому `MobileMenu` рендерится соседом `.site-header__pill` внутри ландмарки, а на самой ландмарке запрещены `transform`, `filter`, `backdrop-filter`, `clip-path` и `contain`.
- **`useSyncExternalStore` вместо пары `useState` + `useEffect`** для чтения медиазапроса: правило `react-hooks/set-state-in-effect` из eslint-plugin-react-hooks 7 роняет `npm run lint` на синхронном `setMatches` в эффекте.
- **Подмена `window.matchMedia` присваиванием, а не `vi.spyOn`.** `setup.ts` уже кладёт в свойство мок, `vi.spyOn` возвращает тот же объект и `mockImplementation` затирает его реализацию до конца файла — reduced motion протекал в следующий тест.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `useMediaQuery` переписан на `useSyncExternalStore`**
- **Found during:** Task 2 (первый прогон `npm run lint`)
- **Issue:** План предписывал «маленький хук на `window.matchMedia` с подпиской на `change`». Прямая реализация через `useState` + `useEffect` с `setMatches(list.matches)` роняет `npm run lint`: `react-hooks/set-state-in-effect` (eslint-plugin-react-hooks 7.1.1) считает синхронный setState в эффекте ошибкой.
- **Fix:** Хук построен на `useSyncExternalStore`: `subscribe` вешает `change` на `MediaQueryList`, `getSnapshot` читает `matches`, серверный снимок — `false`. Контракт и поведение прежние.
- **Files modified:** src/components/layout/Header.tsx
- **Verification:** `npm run lint` код 0, все 16 тестов `Header.test.tsx` зелёные
- **Committed in:** `f98d5e4`

**2. [Rule 3 - Blocking] Подмена `matchMedia` в тесте вместо `vi.spyOn`**
- **Found during:** Task 1 (прогон `scrollToSection.test.ts`)
- **Issue:** План предлагал `vi.spyOn(window, "matchMedia").mockImplementation(...)` с восстановлением в `afterEach`. Vitest 4 отдаёт существующий мок из `setup.ts` вместо нового спая, `mockImplementation` затирает его реализацию навсегда, и `vi.restoreAllMocks()` восстановить её не может: следующий тест получал `behavior: "auto"` вместо `"smooth"`.
- **Fix:** Тест присваивает `window.matchMedia` собственную функцию и возвращает сохранённое значение в `afterEach`, реализация мока из `setup.ts` остаётся нетронутой.
- **Files modified:** src/lib/scrollToSection.test.ts
- **Verification:** `npm test -- src/lib` — 9 тестов зелёные при любом порядке
- **Committed in:** `845a012`

### Documented deviations (заложены планом)

**3. Скос `skewX` вместо `clip-path: polygon(...)` из CONTEXT.md**
- Механизм заменён осознанно, разрешение дал сам план (Task 2, п. 2). `clip-path` на оболочке срезает `box-shadow` и скругления, `filter: drop-shadow` на предке ломает `backdrop-filter`. Оригинал использует `skewX` на псевдоэлементах. `grep -c clip-path src/components/layout/Header.css` = 0, `skewX(calc(-1 * var(--header-skew-angle)))` на месте.

**4. z-index 50/2 и 50/1 вместо соседних 50 и 45 из таблицы UI-SPEC**
- Оверлей вложен в `header`, поэтому таблица «Header 50, оверлей 45» применима только к соседним элементам. `header.site-header` создаёт стековый контекст с `z-index: 50`, внутри пилюля получает 2, оверлей — 1. Порядок слоёв тот же: оверлей выше любого контента страницы (секции ≤ 1) и ниже `.skip-link` (60 в `global.css`). Проверено: `grep -c 'z-index: 50'` = 1, правил с `z-index` больше 50 в `Header.css` нет, `z-index: 60` у skip-link на месте.

### Additions

**5. `src/lib/useActiveSection.test.ts` (3 теста)**
- План перечислял хук в файлах Task 1, но тестов для него не требовал. Глобальное правило проекта (test-as-you-go) требует покрывать реализованную функциональность, поэтому добавлены три теста на контракт `enabled`: без флага наблюдатель не создаётся, с флагом наблюдаются все секции, при размонтировании вызывается `disconnect`. Файл лежит в `src/lib/`, который принадлежит этому плану, конфликта с параллельными планами нет.

---

**Total deviations:** 2 auto-fixed (обе Rule 3, блокирующие), 2 отступления, заложенные планом, 1 добавленный тестовый файл
**Impact on plan:** Объём не расширен. Обе правки вынужденные: без первой не проходит `npm run lint`, без второй тесты зависят от порядка выполнения. Контракты `scrollToSection`, `useActiveSection`, `BurgerButton`, `MobileMenu` совпадают с `<interfaces>` плана.

## Assumption Drift (advisory)

**1. Хук медиазапроса на подписке `change` против внешнего стора**
- **Found during:** Task 2
- **Planned:** План описывал `useMediaQuery` как «маленький хук на `window.matchMedia` с подпиской на `change`», подразумевая пару `useState` + `useEffect`.
- **Actual:** Хук читает медиазапрос через `useSyncExternalStore`; подписка на `change` осталась, но состояние живёт вне React.
- **Why it matters:** Фазы 2–5 будут писать похожие хуки (карта, motion, reduced motion). Тот же лишний `setState` в эффекте уронит их линт, поэтому образцом стоит брать `useMediaQuery` из `Header.tsx`.

**2. Уплотнение пилюли проверено тестом, а не глазами**
- **Found during:** Task 2
- **Planned:** Плавное уплотнение padding-block 20px → 12px за 420ms как визуальный эффект.
- **Actual:** Проверено переключение `data-scrolled` в jsdom; саму анимацию и стекло в браузере никто не смотрел, `css: false` в конфиге vitest вообще не применяет стили в тестах.
- **Why it matters:** Визуальную приёмку header (скос, стекло, световая полоса, крест бургера) закрывает план 01-05 браузерным smoke; до него утверждать «выглядит как оригинал» оснований нет.

## Issues Encountered

- **Протечка мока `matchMedia` между тестами.** `vi.spyOn` поверх мока из `setup.ts` в Vitest 4 не создаёт новый спай. Решено присваиванием свойства и явным восстановлением, детали в отступлении 2.
- **Правило `react-hooks/set-state-in-effect`.** Ошибка появилась только на `npm run lint`, тесты и билд проходили. Решено переходом на `useSyncExternalStore`, детали в отступлении 1.
- **`inert` в jsdom.** jsdom не реализует поведение `inert`, поэтому забытый атрибут на открытом оверлее тесты бы не заметили: фокус в jsdom ставится всё равно. Добавлена явная проверка `not.toHaveAttribute("inert")` и `aria-hidden="false"` на открытом диалоге (`70fac7a`).

## Known Stubs

Нет. Все элементы header рабочие: меню прокручивает к существующим секциям, оверлей открывается и закрывается, активный пункт подсвечивается. Пункты ведут на `#about`, `#involve`, `#news`, `#resources` — эти секции сейчас пустые заглушки из плана 01-01, их наполняет план 01-02 и фазы 2–4, но прокрутка к ним уже работает.

## Threat Flags

Нет. Новых сетевых точек, путей авторизации и файловых операций план не добавил. Обе митигации из `<threat_model>` на месте: T-01-07 — идентификаторы приходят из статического `copy.shell.nav`, используется `getElementById`, `location.hash` не меняется (`grep -c 'location.hash'` = 0); T-01-08 — оверлей закрывается кнопкой, Esc, кликом по фону и переходом на десктоп, `overflow` восстанавливается в cleanup эффекта, всё покрыто тестами.

## User Setup Required

Нет: внешних сервисов, ключей и ручной настройки план не требует.

## Next Phase Readiness

- Контракты для фазы 5 (тесты навигации header, QA-02): `scrollToSection(hash: string, headerHeight: number): boolean`, `useActiveSection(ids: readonly string[], enabled: boolean): string | null`, `BurgerButton({ open, onToggle, controls, ref })`, `MobileMenu({ open, onClose, onNavigate, items, burgerRef })`, `Header()`.
- Плану 01-05 остаётся браузерная приёмка: скос на 1440, стекло и световая полоса, крест бургера на 390, порядок табуляции skip-link → вордмарк → меню/бургер → контент.
- Фазам 2–4: контент секций едет под фиксированной пилюлей, `html { scroll-padding-top: 96px }` уже стоит в `global.css`; высота header читается через `getBoundingClientRect`, поэтому уплотнение прокрутку не ломает.

---
*Phase: 01-scaffold-and-deploy*
*Completed: 2026-09-05*

## Self-Check: PASSED

Все девять заявленных файлов на месте, все семь коммитов (`845a012`, `47b9649`, `b7bb256`, `f98d5e4`, `fc809ac`, `d370570`, `70fac7a`) в истории ветки `agent-01-03`. `Header.tsx` — 108 строк, `Header.test.tsx` — 255 строк (минимумы плана 60 и 60). `.planning/STATE.md` и `.planning/ROADMAP.md` не изменялись.
