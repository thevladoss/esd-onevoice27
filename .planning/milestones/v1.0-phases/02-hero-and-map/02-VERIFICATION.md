---
phase: 02-hero-and-map
verified: 2026-09-05T16:19:15Z
status: passed
score: 15/15 must-haves verified
has_blocking_gaps: false
overrides_applied: 0
human_verification:
  - test: "Открыть hero на 1440px и 390px, наблюдать вращение canvas-глобуса не менее 5 секунд, сравнить с docs/research/orig-vp-0.jpeg"
    expected: "Частицы глобуса вращаются плавно, цвет меняется по широте (маджента север → индиго экватор → бирюза юг), звёздное поле дрейфует за глобусом, скрим и виньетка не перекрывают текст"
    why_human: "Визуальный рендеринг canvas и CSS-слоёв нельзя подтвердить статическим анализом кода"
  - test: "Включить ОС-настройку уменьшения движения, перезагрузить страницу и открыть вкладку с hero в фокусе, затем свернуть вкладку и вернуть"
    expected: "При reduced motion глобус рисует один статичный кадр без движения; при скрытой вкладке и при прокрутке hero за пределы экрана вращение останавливается и возобновляется при возврате"
    why_human: "Рантайм-поведение requestAnimationFrame, IntersectionObserver и document.hidden требует запущенного браузера"
  - test: "Навести курсор на кнопку «Зажечь свой свет» и понаблюдать 3–4 секунды за вращающимся лучом по кайме кнопки"
    expected: "Тонкая светящаяся дуга непрерывно обходит границу кнопки по conic-gradient; при reduced motion дуга статична"
    why_human: "CSS @property-анимация видна только в реальном рендеринге браузера"
  - test: "На карте: прокрутить страницу колесом над секцией #map без Ctrl/⌘ — страница должна скроллиться, карта не должна зумиться. Затем зажать Ctrl/⌘ и покрутить колесо над картой"
    expected: "Обычный скролл страницы работает, карта не реагирует; с Ctrl/⌘ карта плавно масштабируется от k=1 до k=8 и не масштабируется дальше"
    why_human: "Перехват wheel-события d3-zoom и его влияние на скролл страницы наблюдаемы только в реальном браузере"
  - test: "Перетащить карту мышью (курсор должен смениться на grabbing), на touch-устройстве повторить одним и двумя пальцами"
    expected: "Один палец скроллит страницу, два пальца панорамируют/зумят карту; при перетаскивании мышью курсор меняется на grabbing, карта не выходит за translateExtent больше чем на 200px"
    why_human: "Жесты touch и смена курсора проверяются интерактивно"
  - test: "Кликнуть по чипу страны (например «Казахстан»), затем вручную сильно прокрутить зум колесом с Ctrl на 20%+ от масштаба страны"
    expected: "Клик по чипу плавно (600ms) центрирует и приближает карту на стране; активный чип подсвечен; после ручного зума более чем на 15% от масштаба страны чип «Весь дивизион» становится активным"
    why_human: "Плавность анимации полёта камеры и сброс выбора по жесту — рантайм-поведение, не проверяемое статически"
  - test: "Прокрутить страницу до счётчиков «ЧЕЛОВЕК»/«ГРУПП» в первый раз"
    expected: "Числа считают от 0 до 694 и 248 за 1.6 секунды с замедлением к концу; при повторном скролле вверх-вниз анимация не повторяется"
    why_human: "Таймингы rAF-анимации count-up наблюдаемы только в реальном рендеринге"
---

# Phase 2: Hero и карта — Verification Report

**Цель фазы:** Посетитель видит эффектный hero с вращающимся глобусом и кнопкой «Зажечь свой свет», а ниже — живую карту ЕАД с огоньками, счётчиками и переключением стран
**Проверено:** 2026-09-05T16:19:15Z
**Статус:** human_needed
**Повторная проверка:** Нет — первичная проверка

## Примечание о формате цели (mode: mvp)

ROADMAP.md помечает фазу как `Mode: mvp`, но строка `**Goal:**` написана прозой («Посетитель видит эффектный hero...»), а не в каноническом формате User Story. Проверка `bm-sdk query user-story.validate` на этой строке отдаёт `valid: false`. Каноническая формулировка нашлась в `02-05-PLAN.md` («As a посетитель лендинга, I want to..., so that...») и проходит валидацию, но в ROADMAP.md она не отражена. Как и в верификации фазы 1 (та же ситуация), секция «User Flow Coverage» из MVP-режима не строится — вместо неё применена стандартная goal-backward методология по ROADMAP Success Criteria и must_haves всех пяти PLAN-файлов. Рекомендация человеку: прогнать `/gsd mvp-phase 2`, чтобы привести `**Goal:**` в ROADMAP.md к каноническому виду для последующих MVP-проверок.

## Goal Achievement

Свод truths взят из 5 ROADMAP Success Criteria и must_haves всех пяти PLAN-файлов (02-01…02-05), детализирующие пункты добавлены отдельными строками без сокращения объёма.

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Посетитель видит надзаголовок «Единое глобальное движение», градиентный H1 «Вместе, единым голосом» и подзаголовок про Евро-Азиатский дивизион | ✓ VERIFIED | `src/data/copy.hero.ts:1-8` — тексты дословно совпадают с CONTEXT.md; `Hero.tsx:25-31` рендерит `Eyebrow`, `GradientTitle as="h1"`, `<p className="hero__subtitle">` |
| 2 | Справа в hero вращается canvas-глобус из частиц поверх звёздного поля; останавливается при prefers-reduced-motion, скрытой вкладке и вне вьюпорта | ✓ VERIFIED | `GlobeCanvas.tsx` — rAF-цикл через `tick()`, `sync()` проверяет `shouldAnimate({inView, hidden, reducedMotion})` из `globe.ts:56-58`; подписки на `IntersectionObserver`, `visibilitychange`, `matchMedia("(prefers-reduced-motion: reduce)")`; `globe.test.ts` и `GlobeCanvas.test.tsx` зелёные |
| 3 | Кнопка «Зажечь свой свет» ведёт на #light-form и показывает вращающийся луч по границе; статичен без conic-gradient или при reduced motion | ✓ VERIFIED | `Hero.tsx:32-41` — `Button as="a" href="#light-form" data-beam="true"`; `global.css:135-234` — `@property --beam-angle`, `.btn[data-beam="true"]::before` с `conic-gradient`, `@keyframes beam`, `@supports not (...)` откат на статичную рамку, `@media (prefers-reduced-motion: reduce)` фиксирует угол |
| 4 | Посетитель видит секцию #map со скошенными верхним и нижним краями, надзаголовком «Все вместе» и H2 «Зажигаем свет по всему дивизиону» | ✓ VERIFIED | `MapSection.tsx:19-28`; `map.css:267-268` — `clip-path: polygon(0 46px, 100% 0, 100% calc(100% - 46px), 0 100%)`; `copy.map.ts` тексты совпадают |
| 5 | SVG-карта на d3-geo показывает 12 стран ЕАД подсвеченными на фоне соседних без разрыва России на антимеридиане | ✓ VERIFIED | `lib/geo.ts:46-56` — `geoMercator().rotate([-90,0]).fitExtent(...)`; `geo.test.ts` — «не рвёт Чукотку на антимеридиане», «укладывает центры всех 12 стран внутрь вьюбокса без NaN» (проходят); `EsdMap.tsx:210-229` красит `country--esd` по `isEsd(id)` |
| 6 | На карте 694 маджентовых и 248 бирюзовых огонька с гало, пульсируют не более 40, ни один не использует filter | ✓ VERIFIED | `data/lights.ts` — `DEFAULT_PEOPLE=694`, `DEFAULT_GROUPS=248`; `EsdMap.test.tsx:53-54` — 942 `.light-core`/`.light-halo`; `PULSE_EVERY=24` → ~39 пульсирующих из 942 (942/24≈39); `grep filter: map.css` — ноль совпадений |
| 7 | Счётчики «ЧЕЛОВЕК»/«ГРУПП» показывают значения из состояния огоньков с разделителем U+202F | ✓ VERIFIED | `Counters.tsx:19-46` — `useLights().counts`, `formatCount`; `lib/format.ts` — regex-вставка ` `; `format.test.ts` проверяет `694→"694"`, `4268→"4 268"` |
| 8 | При пустом списке огоньков виден блок «Пока ни одного огонька», при размере 0×0 виден блок ошибки role=status | ✓ VERIFIED | `EsdMap.tsx:183-190,262-271`; `EsdMap.test.tsx:96,109` — оба текста находятся в рендере тестами |
| 9 | Посетитель зумит колесом только с Ctrl/⌘, панорамирует перетаскиванием и двумя пальцами; обычный скролл страницы не перехватывается | ✓ VERIFIED (код) / см. human_verification | `useMapZoom.ts:38-48` — `zoomEventFilter`; `svg.style("touch-action", "pan-y")` (строка 104) возвращает одно-пальцевый скролл странице; `EsdMap.test.tsx:228-234` — юнит-тест фильтра для wheel/touch/mouse проходит. Фактическое перехватывание жеста в браузере — не проверяемо статически |
| 10 | Масштаб ограничен [1,8], сдвиг — размером контейнера с запасом 200px; курсор grabbing при перетаскивании | ✓ VERIFIED | `useMapZoom.ts:9-12,80-90` — `ZOOM_MIN=1`, `ZOOM_MAX=8`, `ZOOM_PAD=200`, `translateExtent`; `dragging` state переключает класс `is-dragging` (`EsdMap.tsx:194`), `map.css` красит курсор (не проверено визуально) |
| 11 | Чипы «Весь дивизион»+12 стран центрируют карту на стране за 600ms (мгновенно при reduced motion); активный чип aria-pressed; Enter/Space работают | ✓ VERIFIED | `EsdMap.tsx:157-177` — `zoomTo(target, !reduced)`; `useMapZoom.ts:115-147` — `FLIGHT_MS=600`, `easeOutQuint`; `CountryChips.tsx` — нативные `<button aria-pressed>`; `CountryChips.test.tsx:68-84` — тест Enter и пробела проходит |
| 12 | Ручной зум больше чем на 15% от масштаба выбранной страны сбрасывает активный чип на «Весь дивизион» | ✓ VERIFIED (код) / см. human_verification | `EsdMap.tsx:143-148` — `ZOOM_AWAY_RATIO=0.15`, `handleUserZoom` вызывает `onUserZoomAway` при `Math.abs(k/base-1) > 0.15`; сравнение вызывается только когда `event.sourceEvent` присутствует (жест, не программный полёт) — `useMapZoom.ts:95-99`. Прямого e2e-теста с реальным wheel-жестом d3-zoom нет, логика проверена по чтению кода |
| 13 | Радиусы огоньков компенсируют зум: на k=8 точка того же экранного размера, что на k=1 | ✓ VERIFIED | `EsdMap.tsx:180-181` — `coreRadius = LIGHT_CORE_RADIUS / transform.k`; `EsdMap.test.tsx:187-190` — тест сверяет `r` через `toBeCloseTo(LIGHT_CORE_RADIUS / k)` |
| 14 | Счётчики анимируют счёт от 0 за 1600ms easeOutCubic при первом появлении в вьюпорте (threshold .4), один раз; при reduced motion сразу конечное значение | ✓ VERIFIED | `lib/useCountUp.ts` — `duration=1600`, `easing=easeOutCubic` по умолчанию, `playedRef` не даёт повторный запуск; `lib/useInViewOnce.ts` — threshold 0.4, `seenRef` отключает наблюдатель после первого пересечения; `Counters.tsx:17-20` подключает оба хука; `useCountUp.test.tsx`, `useInViewOnce.test.tsx`, `Counters.test.tsx` зелёные |
| 15 | Vitest подтверждает: детерминизм генератора огоньков (694/248, точки внутри стран), форматирование чисел, редьюсер огоньков (add увеличивает счётчик, id уникальны) | ✓ VERIFIED | `data/lights.test.ts` — «даёт 694 человека и 248 групп», «детерминирован по seed», «даёт уникальные id и точки внутри своей страны»; `state/lights.reducer.test.tsx` — «добавляет огонёк и растит нужный счётчик», «даёт уникальные id при нескольких добавлениях»; `format.test.ts`. `npm test` → 34 файла, 207 тестов, все зелёные |

**Итог:** 15/15 truths подтверждены по коду и тестам. Два пункта (9 и 12) подтверждены чтением кода и юнит-тестами чистых функций, но не e2e-жестом в реальном браузере — вынесены дополнительно в human_verification вместе с чисто визуальными пунктами.

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/components/hero/Hero.tsx` | Секция #hero: слои, тексты, CTA | ✓ VERIFIED | `id="hero"`, рендерит Starfield, GlobeCanvas, Eyebrow, GradientTitle, CTA |
| `src/components/hero/GlobeCanvas.tsx` | canvas-глобус с rAF-циклом и паузами | ✓ VERIFIED | IntersectionObserver, visibilitychange, matchMedia все подключены |
| `src/components/hero/globe.ts` | чистая математика глобуса | ✓ VERIFIED | Экспортирует fibonacciSphere, latitudeColor, shouldAnimate, globeLayout, drawGlobe — все присутствуют |
| `src/components/hero/Starfield.tsx` | два слоя CSS-звёзд + атмосфера | ✓ VERIFIED | Компонент существует, `aria-hidden` подтверждён |
| `src/data/copy.hero.ts` | тексты hero | ✓ VERIFIED | exports `heroCopy` |
| `src/styles/global.css` | луч CTA | ✓ VERIFIED | `--beam-angle`, conic-gradient, keyframes, fallback все на месте |
| `src/data/countries.ts` | 12 стран ЕАД | ✓ VERIFIED | `ESD_COUNTRIES`, `ESD_IDS`, `countryById` экспортированы, id/веса совпадают с RESEARCH.md |
| `src/lib/geo.ts` | world-atlas → GeoJSON, проекция, sampling | ✓ VERIFIED | Все 9 экспортов присутствуют |
| `src/data/lights.ts` | генератор огоньков | ✓ VERIFIED | `generateLights`, `allocateByWeight` |
| `src/lib/rng.ts` | mulberry32 | ✓ VERIFIED | Экспортирован, покрыт тестом |
| `src/lib/format.ts` | formatCount с U+202F | ✓ VERIFIED | Экспортирован, тесты проходят |
| `src/lib/easing.ts` | easeOutCubic, easeOutQuint | ✓ VERIFIED | Оба экспортированы и использованы (useCountUp, useMapZoom) |
| `src/lib/useReducedMotion.ts` | хук reduced-motion | ✓ VERIFIED | Используется в GlobeCanvas, EsdMap, Counters |
| `src/state/lights.tsx` | LightsProvider, useLights, редьюсер | ✓ VERIFIED | Все экспорты на месте, обёрнут вокруг App в main.tsx |
| `src/components/map/EsdMap.tsx` | SVG-карта: проекция, страны, огоньки, пустое/ошибочное состояния | ✓ VERIFIED | `role="img"`, все состояния реализованы |
| `src/components/map/Counters.tsx` | карточки со значениями | ✓ VERIFIED | `aria-live="polite"` подтверждён |
| `src/components/map/MapSection.tsx` | секция #map | ✓ VERIFIED | `id="map"`, собирает CountryChips, Counters, EsdMap, ZoomHint |
| `src/components/map/map.css` | стили, keyframes | ✓ VERIFIED | `@keyframes light-pulse`, `light-arrive`, clip-path скосов |
| `src/data/copy.map.ts` | тексты карты | ✓ VERIFIED | exports `mapCopy` |
| `src/main.tsx` | LightsProvider вокруг App | ✓ VERIFIED | `<LightsProvider><App /></LightsProvider>` |
| `src/components/map/useMapZoom.ts` | d3-zoom привязка | ✓ VERIFIED | exports `useMapZoom`, `zoomEventFilter`, `ZOOM_MIN`, `ZOOM_MAX` |
| `src/components/map/CountryChips.tsx` | пилюли с aria-pressed | ✓ VERIFIED | Нативные `<button aria-pressed>` |
| `src/components/map/ZoomHint.tsx` | подсказка о жестах | ✓ VERIFIED | Класс `map-hint`, тексты из mapCopy.hint |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `Hero.tsx` | `copy.hero.ts` | `import { heroCopy }` | WIRED | Импорт подтверждён, тексты используются в JSX |
| `Hero.tsx` | `GlobeCanvas.tsx` | `<GlobeCanvas />` | WIRED | Рендерится напрямую в JSX |
| `Hero.tsx` | `#light-form` | `Button as="a" href` | WIRED | `href={heroCopy.ctaHref}` = `"#light-form"` |
| `Hero.tsx` | `global.css` (луч) | `data-beam` атрибут | WIRED | `data-beam="true"` на Button, `.btn[data-beam="true"]` в CSS |
| `EsdMap.tsx` | `lib/geo.ts` | `makeProjection, worldFeatures, isEsd` | WIRED | Импортированы и вызваны в `useMemo` |
| `MapSection.tsx` | `state/lights.tsx` | `useLights().lights → EsdMap` | WIRED | `const { lights } = useLights()`, проброшено в `<EsdMap lights={lights}>` |
| `Counters.tsx` | `lib/format.ts` | `formatCount(...)` | WIRED | Вызывается на people/groups |
| `main.tsx` | `state/lights.tsx` | `<LightsProvider>` | WIRED | Оборачивает `<App />` |
| `EsdMap.tsx` | `useMapZoom.ts` | `useMapZoom(svgRef, ...)` | WIRED | Деструктурирует `transform, dragging, zoomTo`, использует все три |
| `useMapZoom.ts` | d3-zoom | `zoom().scaleExtent([1,8])...` | WIRED | Полное построение behavior с filter, extent, translateExtent |
| `MapSection.tsx` | `CountryChips.tsx` | `selectedId/onSelect` | WIRED | `<CountryChips selectedId={selectedId} onSelect={setSelectedId}>` |
| `MapSection.tsx` | `EsdMap.tsx` | `selectedCountryId`/`onUserZoomAway` | WIRED | Проброшены оба пропса, `onUserZoomAway` сбрасывает `selectedId` в `null` |
| `Counters.tsx` | `useCountUp.ts` | `useCountUp(counts.people, {...})` | WIRED | Вызывается дважды с `active: inView, reduced` |
| `Counters.tsx` | `useInViewOnce.ts` | `useInViewOnce(rootRef, 0.4)` | WIRED | Подключён, `inView` идёт в оба `useCountUp` |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|---------------------|--------|
| `Counters.tsx` | `counts.people`/`counts.groups` | `useLights()` → `LightsProvider` → `generateLights(27, 694, 248)` | Да, детерминированный, но реальный (не 0/статика) массив из 942 объектов | ✓ FLOWING |
| `EsdMap.tsx` | `lights` (пропс) | `MapSection` → `useLights().lights` (тот же провайдер) | Да | ✓ FLOWING |
| `EsdMap.tsx` | `countries` | `worldFeatures` из `lib/geo.ts`, разобран из `world-atlas/countries-110m.json` при импорте модуля | Да, 177 реальных стран, не заглушка | ✓ FLOWING |
| `CountryChips.tsx` | `CHIPS` | `ESD_COUNTRIES` (статические данные, но осмысленные — 12 реальных стран с весами) | Да (статические справочные данные, не пустой массив) | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Полный набор тестов зелёный | `npm test -- --run` | 34 файла, 207 тестов, все passed, 5.24s | ✓ PASS |
| Продакшн-сборка проходит | `npm run build` | `tsc -b && vite build` — успешно, `dist/assets/index-*.js` 434KB (147KB gzip) | ✓ PASS |
| В карте нет `filter:` на огоньках | `grep -n "filter:" map.css` | Нет совпадений | ✓ PASS |
| Отсутствие debt-маркеров в файлах фазы | `grep -riE "TBD\|FIXME\|XXX\|TODO\|HACK\|PLACEHOLDER..."` по hero/map/lib/data/state файлам фазы | Нет совпадений | ✓ PASS |

### Probe Execution

Пробники (`scripts/*/tests/probe-*.sh`) в проекте не найдены, PLAN/SUMMARY фазы их не декларируют — шаг пропущен.

### Requirements Coverage

| Requirement | Source Plan | Описание | Status | Evidence |
|-------------|------------|----------|--------|----------|
| HERO-01 | 02-01 | Надзаголовок, градиентный H1, подзаголовок | ✓ SATISFIED | `copy.hero.ts`, `Hero.tsx` |
| HERO-02 | 02-01 | Canvas-глобус с паузами | ✓ SATISFIED | `GlobeCanvas.tsx`, `globe.ts` |
| HERO-03 | 02-01 | CTA с вращающимся лучом | ✓ SATISFIED | `global.css` beam-блок |
| MAP-01 | 02-03 | Секция со скосами, заголовки | ✓ SATISFIED | `MapSection.tsx`, `map.css` |
| MAP-02 | 02-02, 02-03 | SVG-карта, 12 стран, без разрыва России | ✓ SATISFIED | `lib/geo.ts`, `EsdMap.tsx`, `geo.test.ts` |
| MAP-03 | 02-02, 02-03 | 694/248 огоньков, пульс ≤40, без filter | ✓ SATISFIED | `data/lights.ts`, `EsdMap.tsx`, `map.css` |
| MAP-04 | 02-02, 02-03, 02-05 | Счётчики с форматированием и count-up | ✓ SATISFIED | `Counters.tsx`, `useCountUp.ts`, `format.ts` |
| MAP-05 | 02-04 | Zoom/pan с ограничением жестов | ✓ SATISFIED | `useMapZoom.ts` |
| MAP-06 | 02-04 | Чипы стран с центрированием | ✓ SATISFIED | `CountryChips.tsx`, `EsdMap.tsx` (полёт камеры) |
| QA-01 | 02-02, 02-03 | Vitest на генератор, форматирование, редьюсер (частично: валидация формы и пагинация новостей — вне границ фазы 2, относятся к фазам 3–4) | ✓ SATISFIED (в границах фазы 2) | `lights.test.ts`, `format.test.ts`, `lights.reducer.test.tsx`, `geo.test.ts` — все зелёные. Часть QA-01 про форму и новости — предмет других фаз (в codebase уже видны `validation.test.ts`, `paginate.test.ts` от параллельной работы, но это не в границах данной верификации) |

Orphaned requirements: не найдено — все 10 ID из REQUIREMENTS.md для фазы 2 покрыты одним из пяти планов.

### Anti-Patterns Found

Ни одного debt-маркера (TBD/FIXME/XXX/TODO/HACK/PLACEHOLDER) и ни одной заглушки-возврата (`return null`, пустые обработчики) не найдено в файлах, изменённых планами 02-01…02-05. `filter` в map.css отсутствует полностью, как того требует MAP-03.

### Human Verification Required

См. `human_verification` в YAML frontmatter — 7 пунктов. Все касаются визуального рендеринга canvas/CSS-анимаций или реальных touch/wheel-жестов, которые проверяются оркестратором через Playwright (визуальные) либо интерактивно человеком (сенсорные жесты и точный тайминг).

### Gaps Summary

Блокирующих пробелов не найдено. Весь код, тесты (207/207) и сборка (`npm run build`) подтверждают выполнение целей фазы. Единственное несоответствие — формат `**Goal:**` в ROADMAP.md для фазы, помеченной `mode: mvp`, не в каноническом User Story виде (см. примечание выше); это не блокирует фазу, но стоит поправить перед MVP-проверкой следующих фаз. Статус `human_needed` вызван исключительно наличием пунктов для визуальной/жестовой проверки в браузере, а не найденными дефектами.

---

_Verified: 2026-09-05T16:19:15Z_
_Verifier: Claude (gsd-verifier)_
