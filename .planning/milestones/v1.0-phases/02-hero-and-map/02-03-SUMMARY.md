---
phase: 02-hero-and-map
plan: 03
subsystem: ui
tags: [d3-geo, svg, react-context, css-animations, accessibility, vitest, testing-library]

requires:
  - phase: 01-scaffold-and-deploy
    provides: "Примитивы Eyebrow и GradientTitle (variant section), tailwind-утилита sr-only, jsdom-моки ResizeObserver и matchMedia"
  - phase: 02-hero-and-map
    provides: "02-02: makeProjection, worldFeatures, isEsd, generateLights, LightsProvider/useLights, formatCount"
provides:
  - "EsdMap: SVG-карта дивизиона на d3-geo с 177 странами, 12 подсвеченными, 942 огоньками, пустым и ошибочным состояниями"
  - "Контракт EsdMapProps: lights, selectedCountryId, onUserZoomAway, onError, size (пропс size задаёт вьюбокс в обход ResizeObserver)"
  - "Константы LIGHT_CORE_RADIUS, LIGHT_HALO_RADIUS, PULSE_EVERY и деление радиусов на масштаб вьюпорта"
  - "Counters: две карточки со значениями из useLights через formatCount, aria-live на числе"
  - "MapSection: секция #map со скосами 46px, заголовком, счётчиками и картой вместо заглушки"
  - "map.css: стили секции, карты, огоньков, счётчиков, keyframes light-pulse и light-arrive, ветка prefers-reduced-motion"
  - "mapCopy: все тексты секции карты, включая чипы и подсказки о жестах для следующих планов"
  - "LightsProvider оборачивает App в main.tsx"
affects: [02-04, 02-05, 03-form-about-involve, 05-motion-and-polish]

tech-stack:
  added: []
  patterns:
    - "Секция карты держит свои стили в map.css рядом с компонентами, а не в global.css"
    - "Свечение огонька рисуется вторым кругом с низкой непрозрачностью: filter в карте не используется нигде"
    - "Радиусы огоньков делятся на масштаб вьюпорта, поэтому зум не раздувает точки"
    - "Тесты компонентов карты передают size вместо измерения контейнера: в jsdom getBoundingClientRect отдаёт 0x0"
    - "Размер 0x0 это состояние ошибки карты, а не пустой рендер: role=status плюс onError(true)"

key-files:
  created:
    - src/data/copy.map.ts
    - src/components/map/EsdMap.tsx
    - src/components/map/EsdMap.test.tsx
    - src/components/map/Counters.tsx
    - src/components/map/Counters.test.tsx
    - src/components/map/MapSection.test.tsx
    - src/components/map/map.css
  modified:
    - src/components/map/MapSection.tsx
    - src/main.tsx
    - src/App.test.tsx
    - src/components/placeholders.test.tsx

key-decisions:
  - "Доступное имя карты держится на aria-labelledby, указывающем на <title>: чтение svg > title зависит от версии dom-accessibility-api, явная связь надёжнее"
  - "Заголовок секции лежит в div, а не в header: header внутри секции читался вторым баннером страницы и ломал проверку ландмарок"
  - "Ошибка карты решается по проверочной точке (Москва): проекция считается один раз, NaN и нулевой контейнер отсекаются одной веткой"
  - "Пустое состояние рисуется поверх карты, а не вместо неё: страны остаются видимыми, огоньков нет"
  - "Заглушка карты убрана из placeholders.test.tsx, проверка стеклянных карточек в App.test.tsx сужена до оставшихся заглушек"

patterns-established:
  - "TDD по задачам: коммит test(...) с красными тестами, затем feat(...) с реализацией"
  - "Тексты секции живут в отдельном модуле copy.map.ts, разметка не содержит русских литералов"
  - "Символ U+202F в тестах пишется escape-последовательностью, литерального символа в исходниках нет"

requirements-completed: [MAP-01, MAP-02, MAP-03, MAP-04]

duration: 11min
completed: 2026-09-05
---

# Phase 2 Plan 03: Секция карты ЕАД Summary

**SVG-карта дивизиона на d3-geo: 177 стран, 12 подсвеченных, 942 огонька с гало и 40 пульсаций без filter, стеклянные счётчики из контекста и секция #map со скосами 46px вместо заглушки.**

## Performance

- **Duration:** 11 мин
- **Started:** 2026-09-05T15:43:00Z
- **Completed:** 2026-09-05T15:54:00Z
- **Tasks:** 3 из 3
- **Files modified:** 11 (7 создано, 4 изменено)

## Accomplishments

- Карта рисует 177 стран одной проекцией, 12 стран ЕАД подсвечены, Россия не рвётся на антимеридиане (проверочная точка и непустые `d` у стран ЕАД покрыты тестом).
- 942 огонька: 694 маджентовых и 248 бирюзовых, гало отдельным кругом, пульсирует ровно 40 групп, `filter` не встречается ни в разметке, ни в стилях; новый огонёк из контекста всегда пульсирует и получает расходящееся кольцо.
- Пустое состояние со ссылкой на форму и блок ошибки `role="status"` при нулевом контейнере, наружу уходит `onError(true)`.
- Счётчики читают `useLights().counts`, показывают `1\u202F150` через `formatCount` с U+202F и объявляют числа через `aria-live="polite"`.
- Секция `#map` со скошенным внутренним слоем заменила заглушку, `App` работает под `LightsProvider`, весь набор из 99 тестов и билд зелёные.

## Task Commits

1. **Task 1: SVG-карта с огоньками и состояниями** — `3249267` (test), `aa0359c` (feat)
2. **Task 2: стеклянные счётчики** — `c19a34c` (test), `ecf6e40` (feat)
3. **Task 3: секция #map и провайдер в main.tsx** — `862cd13` (test), `aabbdb9` (feat)

## Files Created/Modified

- `src/data/copy.map.ts` — тексты секции карты: заголовки, счётчики, чипы, подсказки, пустое и ошибочное состояния
- `src/components/map/EsdMap.tsx` — проекция, пути стран, огоньки, скрытое описание, пустое состояние, блок ошибки, измерение контейнера через ResizeObserver
- `src/components/map/EsdMap.test.tsx` — 9 проверок карты
- `src/components/map/Counters.tsx` — две карточки со значениями из контекста
- `src/components/map/Counters.test.tsx` — 4 проверки счётчиков
- `src/components/map/MapSection.tsx` — секция #map со скосами, заголовком, счётчиками и картой (заглушка заменена целиком)
- `src/components/map/MapSection.test.tsx` — 4 проверки секции
- `src/components/map/map.css` — стили секции, карты, огоньков, счётчиков, keyframes и ветка reduced motion
- `src/main.tsx` — LightsProvider вокруг App внутри StrictMode
- `src/App.test.tsx` — рендер приложения под провайдером, проверка карточек сужена до секций-заглушек
- `src/components/placeholders.test.tsx` — карта убрана из списка заглушек

## Decisions Made

- **Доступное имя карты через `aria-labelledby`.** `<title>` внутри svg остался по контракту, но имя вычисляется по явной ссылке: поведение `svg > title` в разных версиях `dom-accessibility-api` различается, а тест требует `getByRole("img", { name: ... })`.
- **Ошибка карты определяется по проекции опорной точки.** Одна ветка закрывает и нулевой контейнер, и NaN от проекции; `makeProjection` при этом не вызывается на размере меньше пикселя.
- **Пустое состояние поверх карты.** Страны остаются видимыми, блок с призывом лежит слоем выше и не перехватывает указатель, кроме самой ссылки.
- **Масштаб вьюпорта вынесен в переменную и равен 1.** Радиусы огоньков уже делятся на него, поэтому подключение зума не тронет разметку огоньков.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Карта убрана из тестов заглушек, проверка стеклянных карточек сужена**
- **Found during:** Task 3 (секция #map)
- **Issue:** `placeholders.test.tsx` из фазы каркаса рендерил `MapSection` без провайдера и ждал тело заглушки в `.glass-card`; после замены секции четыре теста падали с `useLights must be used within <LightsProvider>`. В `App.test.tsx` проверка «стеклянная карточка в каждой секции» падала, потому что у карты своя вёрстка без `.glass-card`. Ни один план фазы 2 этот файл не заявляет в `files_modified`.
- **Fix:** Из `placeholders.test.tsx` удалены импорт `MapSection` и его строка в списке заглушек (остальные семь заглушек проверяются как раньше). В `App.test.tsx` заведён список `placeholderSectionIds` без `map`, счётчик карточек сравнивается с длиной этого списка.
- **Files modified:** src/components/placeholders.test.tsx, src/App.test.tsx
- **Verification:** `npx vitest run` — 99 тестов зелёные
- **Committed in:** `aabbdb9`

**2. [Rule 1 - Bug] Заголовок секции переехал из `<header>` в `<div>`**
- **Found during:** Task 3 (секция #map)
- **Issue:** План предписывал `<header className="map-section__header">`. Testing Library и `aria-query` отдают элементу `header` роль `banner` без учёта предков, поэтому `getByRole("banner")` в `App.test.tsx` находил два баннера: шапку страницы и заголовок карты. Для скринридеров со старым маппингом это тот же второй баннер внутри `<main>`.
- **Fix:** `<header>` заменён на `<div>` с тем же классом, комментарий рядом объясняет причину. Семантику секции держит H2.
- **Files modified:** src/components/map/MapSection.tsx
- **Verification:** `npx vitest run src/App.test.tsx` — ландмарки снова единственные
- **Committed in:** `aabbdb9`

**3. [Rule 3 - Blocking] Литеральный U+202F в тестах счётчиков заменён на escape**
- **Found during:** Task 2 (счётчики)
- **Issue:** Первая редакция `Counters.test.tsx` содержала литеральный узкий неразрывный пробел; Copywriting Contract фазы требует escape-последовательности, литеральный символ в исходники не попадает.
- **Fix:** Символы заменены на `\u202F`, проверка `grep` подтверждает отсутствие литерала. Заодно сравнение перенесено с `getByText` на `textContent`: нормализатор Testing Library схлопывает U+202F в обычный пробел.
- **Files modified:** src/components/map/Counters.test.tsx
- **Verification:** `grep -c` по байтам U+202F даёт 0, тесты зелёные
- **Committed in:** `c19a34c`

### Assumption Drift (advisory)

**1. Тесты фазы каркаса переживают замену заглушек**
- **Found during:** Task 3
- **Planned:** План описывал правку только `App.test.tsx` («обернуть рендер в `LightsProvider`») и считал остальные тесты фазы 1 нетронутыми.
- **Actual:** Замена заглушки задевает ещё два места: список заглушек в `placeholders.test.tsx` и проверку `.glass-card` по всем восьми секциям.
- **Why:** Фаза каркаса привязала проверки к тому, что все восемь секций устроены одинаково; первая же настоящая секция ломает это допущение.
- **Note for the merge:** параллельный план 02-01 заменяет `Hero` и упрётся в те же две проверки. Строки Hero и MapSection в списке заглушек соседние, поэтому при слиянии веток вероятен конфликт в `src/components/placeholders.test.tsx` и `src/App.test.tsx` — разрешать объединением обеих правок (обе секции убираются из списков).

---

**Total deviations:** 3 auto-fixed (2 blocking, 1 bug)
**Impact on plan:** Правки держат набор тестов зелёным и убирают дублирующийся баннер. Объём плана не расширился: код секции карты полностью соответствует контракту.

## Issues Encountered

- Замена комментария в `map.css` через `perl -i` с русским текстом дала двойную кодировку и разбила строку. Файл починен скриптом на python3 (чтение и запись в UTF-8), содержимое проверено `grep` по мусорным байтам и повторной сборкой `vite build`. Вывод на будущее: русский текст в файлах правится python3, а не однострочником perl.

## Verification

Выполнено и наблюдалось лично:

- `npx vitest run` — 15 файлов, 99 тестов, все зелёные (в том числе `EsdMap.test.tsx` 9, `Counters.test.tsx` 4, `MapSection.test.tsx` 4, `App.test.tsx` 4).
- `npm run build` — `tsc -b` и `vite build` зелёные, 180 модулей, `index.js` 342.68 kB (gzip 116.65 kB), `index.css` 41.98 kB (gzip 9.44 kB). Прирост около 54 kB gzip к прошлому билду — это JSON world-atlas, попавший в бандл вместе с настоящей картой.
- `npm run lint` — без замечаний.
- `git diff --quiet HEAD -- src/App.tsx` — код 0, файл не изменён.
- Проверки по grep из acceptance criteria всех трёх задач: `filter` в `EsdMap.tsx` — 0, `backdrop-filter` в `map.css` — 0, русских литералов в `MapSection.tsx` — 0, все требуемые строки на месте.

Не выполнено: визуальная проверка в браузере (`npm run preview` на 1440px и 390px). Она помечена в плане как неблокирующая, Playwright-smoke делает фаза 5. Геометрия карты в jsdom проверяется математикой проекции, а не измерением DOM, поэтому «карта заполняет контейнер» и «огоньки внутри границ» на реальном рендере остаются неподтверждёнными.

## Known Stubs

- `EsdMapProps.onUserZoomAway` объявлен в контракте, но не вызывается: ручной зум появляется в плане, который подключает d3-zoom. Пропс намеренно не деструктурируется, чтобы `noUnusedParameters` не ругался.
- `selectedCountryId` только подсвечивает страну; полёт камеры к ней добавляет следующий план.
- Счётчики показывают конечное значение сразу; count-up по `IntersectionObserver` добавляет план анимаций.
- `mapCopy.chips` и `mapCopy.hint` пока не отрисованы: ряд чипов и подсказку о жестах ставит следующий план в ту же разметку.

Все четыре стуба заявлены контрактом плана и не мешают целям MAP-01..MAP-04.

## Threat Flags

Новых поверхностей за пределами `<threat_model>` плана не появилось. Митигации по регистру выполнены: `dangerouslySetInnerHTML` в `src/components/map` отсутствует (T-02-07), анимируется ровно 40 групп и `filter` не используется, при `prefers-reduced-motion` пульсация снимается (T-02-08), нулевой размер контейнера даёт блок ошибки и `onError(true)` (T-02-10). Пакеты не ставились (T-02-SC).

## User Setup Required

Нет: внешние сервисы и ключи в плане не участвуют.

## Next Phase Readiness

- Готово для 02-04: `EsdMap` держит `<g className="map-viewport">` для трансформации d3-zoom, радиусы огоньков уже делятся на масштаб вьюпорта, `onError` отдаёт состояние наружу, `selectedCountryId` подсвечивает страну, `mapCopy.chips` и `mapCopy.hint` ждут разметки, `.map-container.is-dragging` описан в стилях.
- Готово для 02-05: разметка `.counter__value > span[aria-live]` не изменится при подключении count-up.
- Готово для фазы 3: `Counters` читает контекст сам и работает рядом с формой без пропсов.
- Замечание оркестратору: при слиянии веток 02-01 и 02-03 ожидается конфликт в `src/components/placeholders.test.tsx` и `src/App.test.tsx`; обе правки нужно сохранить.

---
*Phase: 02-hero-and-map*
*Completed: 2026-09-05*

## Self-Check: PASSED

Все 12 заявленных файлов на месте, все шесть коммитов задач есть в истории ветки `agent-02-03`.
