---
phase: 02-hero-and-map
plan: 04
subsystem: ui
tags: [d3-zoom, d3-selection, react-hooks, requestAnimationFrame, accessibility, vitest, testing-library]

requires:
  - phase: 02-hero-and-map
    provides: "02-02: makeProjection, featureById, easeOutQuint, usePrefersReducedMotion, ESD_COUNTRIES"
  - phase: 02-hero-and-map
    provides: "02-03: EsdMap с группой map-viewport и константами радиусов, MapSection, map.css, mapCopy"
provides:
  - "useMapZoom: d3-zoom на svg с пределами [1, 8], запасом 200px, фильтром жестов и rAF-полётом камеры"
  - "zoomEventFilter: чистая функция фильтра колеса и касаний, тестируется без layout"
  - "EsdMap: transform из состояния двигает вьюпорт, радиусы огоньков делятся на масштаб, полёт к bbox страны"
  - "CountryChips: 13 пилюль с aria-pressed и режимом aria-disabled"
  - "ZoomHint: подсказка о жестах, текст переключается по ширине через CSS"
  - "MapSection: состояние выбранной страны и ошибки карты, связка чипов, карты и подсказки"
affects: [02-05, 05-motion-and-polish]

tech-stack:
  added: []
  patterns:
    - "Полёт камеры собран на requestAnimationFrame с easeOutQuint: d3-transition в зависимости не добавляется"
    - "Программный transform d3-zoom не создаёт sourceEvent, поэтому полёт не путается с жестом посетителя"
    - "extent зума задаётся явно из измеренного размера: в jsdom getBoundingClientRect отдаёт нули"
    - "Коллбэки в хуках зума живут в ref, чтобы эффект не переподписывался на каждый рендер"
    - "Недоступный элемент управления помечается aria-disabled, а не нативным disabled: чип остаётся в таб-порядке"

key-files:
  created:
    - src/components/map/useMapZoom.ts
    - src/components/map/CountryChips.tsx
    - src/components/map/CountryChips.test.tsx
    - src/components/map/ZoomHint.tsx
  modified:
    - src/components/map/EsdMap.tsx
    - src/components/map/EsdMap.test.tsx
    - src/components/map/MapSection.tsx
    - src/components/map/MapSection.test.tsx
    - src/components/map/map.css

key-decisions:
  - "Целевой масштаб страны зажимается снизу ZOOM_MIN: d3-zoom не ограничивает программный transform, а у России вписывание даёт 0.98"
  - "Фильтр событий вынесен в экспортируемую чистую функцию zoomEventFilter: в jsdom нет layout, а поведение колеса и касаний проверять надо"
  - "touch-action: pan-y ставится явно после svg.call(zoom): d3 вешает none только на тач-устройствах, а один палец должен скроллить страницу"
  - "Класс is-dragging ставится на корневой div карты, селектор курсора в map.css переписан с .map-container на .esd-map"
  - "Радиусы огоньков делятся на transform.k без нижнего порога: экранный размер точки одинаков на k = 1 и k = 8"

patterns-established:
  - "TDD по задачам: красные тесты пишутся первыми в том же файле, реализация коммитится вместе с ними"
  - "Тесты карты подменяют matchMedia на prefers-reduced-motion: полёт применяется мгновенно и не зависит от кадров rAF"

requirements-completed: [MAP-05, MAP-06]

duration: 10min
completed: 2026-09-05
---

# Phase 02 Plan 04: Зум карты и чипы стран Summary

**d3-zoom на SVG-карте с фильтром колеса по Ctrl/⌘ и касаний от двух пальцев, полёт камеры к bbox страны за 600ms на rAF и ряд из 13 чипов с aria-pressed.**

## Performance

- **Duration:** 10 мин
- **Started:** 2026-09-05T16:02:00Z
- **Completed:** 2026-09-05T16:12:00Z
- **Tasks:** 3
- **Files modified:** 9 (4 создано, 5 изменено)

## Accomplishments
- Посетитель масштабирует карту колесом только с Ctrl или ⌘ и двумя пальцами на тач, обычный скролл страницы над картой остаётся страницей.
- Клик по чипу уводит камеру к стране за 600ms с easeOutQuint, при reduced motion переход мгновенный; «Весь дивизион» возвращает `zoomIdentity`.
- Ручное изменение масштаба больше чем на 15% от масштаба выбранной страны сбрасывает чип на «Весь дивизион».
- Радиусы огоньков делятся на текущий масштаб, поэтому точка на k = 8 того же экранного размера, что на k = 1.
- Ошибка карты гасит все 13 чипов через `aria-disabled`, не выбрасывая их из таб-порядка.

## Task Commits

1. **Task 1: d3-zoom в EsdMap, полёт к стране, компенсация радиусов** - `d6e0747` (feat)
2. **Task 2: чипы стран и подсказка о жестах** - `f25427e` (feat)
3. **Task 3: связка в MapSection и интеграционные тесты** - `793803f` (feat)
4. **Правка формулировок под acceptance criteria плана** - `6d9e667` (refactor)

## Files Created/Modified
- `src/components/map/useMapZoom.ts` — привязка d3-zoom к svg, transform в состоянии, rAF-полёт, экспорт `zoomEventFilter`, `ZOOM_MIN/MAX/PAD`, `FLIGHT_MS`
- `src/components/map/CountryChips.tsx` — группа с `aria-label`, 13 кнопок с `aria-pressed` и `aria-disabled`
- `src/components/map/ZoomHint.tsx` — два варианта подсказки о жестах в одном абзаце
- `src/components/map/CountryChips.test.tsx` — 7 тестов: порядок, отметка, клавиатура, погашенный режим, подсказка
- `src/components/map/EsdMap.tsx` — `useMapZoom`, полёт к bbox страны, деление радиусов на `transform.k`, класс `is-dragging`
- `src/components/map/EsdMap.test.tsx` — 16 тестов (9 из 02-03 плюс 7 новых про зум и фильтр)
- `src/components/map/MapSection.tsx` — состояние `selectedId` и `mapError`, чипы и подсказка в разметке
- `src/components/map/MapSection.test.tsx` — 10 тестов, из них 6 новых интеграционных
- `src/components/map/map.css` — стили чипов и подсказки, курсор `grabbing` перенесён на `.esd-map`

## Decisions Made
- **Нижний предел масштаба.** Формула плана `min(8, 0.8 / max(dx/w, dy/h))` для России даёт 0.98: страна занимает почти весь вьюбокс. `zoom.transform` применяет значение без оглядки на `scaleExtent`, так что карта уехала бы мельче обзора дивизиона. Добавлено зажатие снизу: `min(ZOOM_MAX, max(ZOOM_MIN, fit))`.
- **Фильтр как чистая функция.** `zoomEventFilter` экспортируется и проверяется напрямую: в jsdom нет layout и настоящих жестов, а поведение колеса и касаний относится к MAP-05.
- **d3-transition не добавлен.** Полёт собран на `requestAnimationFrame` с `easeOutQuint`, как решено в 02-CONTEXT; одновременно активен только один полёт, предыдущий отменяется.
- **Курсор перетаскивания.** Класс `is-dragging` ставит `EsdMap` на свой корень, поэтому селектор в `map.css` переписан с `.map-container.is-dragging` на `.esd-map.is-dragging`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Масштаб выбранной страны мог уйти ниже нижнего предела зума**
- **Found during:** Task 1 (d3-zoom и полёт к стране)
- **Issue:** План считал `k = Math.min(ZOOM_MAX, fit)`. Замер на реальной проекции 1200×700: у России `fit = 0.981`, у Казахстана 4.198, у Армении 30.597. Программный `zoom.transform` не ограничивается `scaleExtent`, поэтому выбор России отдалял карту мельче обзора дивизиона и рассинхронизировал состояние с последующими жестами.
- **Fix:** `k = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, fit))`.
- **Files modified:** src/components/map/EsdMap.tsx
- **Verification:** `npx vitest run src/components/map/EsdMap.test.tsx` — 16 тестов зелёные; тест «приближает выбранную страну в пределах масштаба» проверяет Россию (k = 1), Казахстан (1 < k ≤ 8) и Армению (k = 8).
- **Committed in:** `d6e0747`

**2. [Rule 1 - Bug] Тесты плана опирались на неверные допущения о геометрии**
- **Found during:** Task 1 и Task 3
- **Issue:** Behavior-спека требовала `1 < k <= 8` для России и рост масштаба при клике по «Россия». Для страны, занимающей весь вьюбокс, это недостижимо.
- **Fix:** Проверка «масштаб больше единицы» перенесена на Казахстан и Армению; для России проверяется зажатие в `ZOOM_MIN` и сдвиг камеры (`transform` отличается от `translate(0,0) scale(1)`). Клик по «Россия» в интеграционном тесте проверяет `aria-pressed` и `data-selected`, отдельный тест кликает «Казахстан» ради масштаба.
- **Files modified:** src/components/map/EsdMap.test.tsx, src/components/map/MapSection.test.tsx
- **Verification:** `npm test` — 171 тест зелёный.
- **Committed in:** `d6e0747`, `793803f`

**3. [Rule 3 - Blocking] Селектор курсора не совпадал с местом, куда ставится класс**
- **Found during:** Task 1
- **Issue:** В `map.css` из 02-03 лежал `.map-container.is-dragging`, а класс перетаскивания ставит `EsdMap` на свой корневой `.esd-map`: курсор не менялся бы никогда.
- **Fix:** Селектор переписан на `.esd-map.is-dragging`, `.map-container` сохраняет `cursor: grab`.
- **Files modified:** src/components/map/map.css
- **Verification:** `npm run build` — CSS собирается; правило видно в `dist/assets/index-*.css`.
- **Committed in:** `d6e0747`

---

**Total deviations:** 3 auto-fixed (2 bug, 1 blocking)
**Impact on plan:** Все правки нужны для корректности: без зажатия масштаба и совпадения селектора функциональность плана не работает. Объём не расширялся.

## Assumption Drift (advisory)

**1. Нижний порог радиуса огонька**
- **Planned:** 02-UI-SPEC, «Компенсация зума»: радиусы делятся на `transform.k`, минимум 1.2px.
- **Actual:** Реализовано чистое деление без порога, как требуют `<behavior>` и success criteria плана (`r = 2.2 / k`, точка одного экранного размера на k = 1 и k = 8).
- **Why:** Порог 1.2 в пользовательских единицах на k = 8 дал бы 9.6px на экране и раздул бы точки вместо компенсации. Порог в 1.2 экранных пикселя недостижим снизу: ядро и так 2.2px на любом масштабе.

**2. Литерал `scaleExtent([1, 8])` в key_links**
- **Planned:** Frontmatter `key_links` ждёт паттерн `scaleExtent\(\[1, 8\]\)`.
- **Actual:** Код содержит `scaleExtent([ZOOM_MIN, ZOOM_MAX])` при `ZOOM_MIN = 1`, `ZOOM_MAX = 8`.
- **Why:** Acceptance criteria задачи 1 прямо требует именованные константы; значения совпадают с паттерном по смыслу.

## Issues Encountered
- Порядок выполнения эффектов: полёт к стране должен идти после привязки поведения зума. Хук `useMapZoom` вызывается выше по телу компонента, поэтому его эффект регистрируется первым и `zoomTo` на первом кадре уже видит привязанное поведение.
- В jsdom `svg.style.getPropertyValue("touch-action")` работает, что подтверждено замером до написания теста; d3 при этом свой `touch-action: none` не ставит вовсе, потому что элемент не тач-способный.

## User Setup Required
None — внешние сервисы не задействованы, новых пакетов не ставилось.

## Next Phase Readiness
- Карта интерактивна: MAP-05 и MAP-06 закрыты, `npm test` (171 тест) и `npm run build` зелёные.
- 02-05 (count-up счётчиков) не пересекается по файлам: `Counters.tsx` и хуки в `src/lib/` не трогались.
- Ручная проверка жестов и курсора в браузере (`npm run preview`) остаётся за фазой 5: в jsdom нет layout и настоящих указательных событий.

## Self-Check: PASSED

- Все заявленные файлы на диске: `useMapZoom.ts`, `CountryChips.tsx`, `CountryChips.test.tsx`, `ZoomHint.tsx`, изменённые `EsdMap.tsx`, `MapSection.tsx`, `map.css` и оба тестовых файла.
- Все заявленные коммиты в истории ветки `agent-02-04`: `d6e0747`, `f25427e`, `793803f`, `6d9e667`.
- Правило `.esd-map.is-dragging` присутствует в собранном `dist/assets/index-*.css`.

---
*Phase: 02-hero-and-map*
*Completed: 2026-09-05*
