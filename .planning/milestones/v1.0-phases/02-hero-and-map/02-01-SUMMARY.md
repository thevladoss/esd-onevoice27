---
phase: 02-hero-and-map
plan: 01
subsystem: ui
tags: [react, typescript, canvas, requestanimationframe, css-houdini, at-property, accessibility, vitest]

requires:
  - phase: 01-01
    provides: "токены @theme, App.tsx с восемью секциями, jsdom-моки IntersectionObserver/ResizeObserver/matchMedia/getContext"
  - phase: 01-02
    provides: "примитивы Eyebrow, GradientTitle (variant hero), Button (primary, проброс rest), primitives.css"
provides:
  - "Готовая секция #hero: звёздное поле, canvas-глобус, градиентный H1, подзаголовок, CTA с лучом"
  - "src/data/copy.hero.ts с текстами hero (heroCopy)"
  - "src/components/hero/globe.ts: fibonacciSphere, latitudeColor, shouldAnimate, globeLayout, drawGlobe, GLOBE_POINTS, GLOBE_SPEED, GLOBE_TILT"
  - "src/components/hero/GlobeCanvas.tsx: rAF-цикл с паузами по вьюпорту, видимости вкладки и reduced motion"
  - "Классы .hero, .starfield, .globe-canvas в src/components/hero/hero.css"
  - "Луч CTA в global.css: @property --beam-angle, conic-gradient под маской, fallback и статичный угол при reduced motion"
  - "Временный src/components/hero/scrollToSection.ts (заменяется общим хелпером фазы 5)"
affects: [02-02, 03-content-sections, 05-motion-and-polish]

tech-stack:
  added: []
  patterns:
    - "Математика анимации живёт в чистом модуле (globe.ts) и тестируется без DOM; компонент отвечает только за подписки и жизненный цикл rAF"
    - "Тексты секции лежат в отдельном файле src/data/copy.<секция>.ts, чтобы параллельные планы не дрались за copy.ts"
    - "Компонентный CSS секции пишется литералами палитры: tokens.css объявляет @theme без static, --color-* доступны только использованным утилитам"
    - "Декоративные слои секции: aria-hidden=\"true\" + pointer-events: none, порядок задаётся z-index в CSS, а не порядком в JSX"

key-files:
  created:
    - src/data/copy.hero.ts
    - src/components/hero/Hero.test.tsx
    - src/components/hero/Starfield.tsx
    - src/components/hero/hero.css
    - src/components/hero/globe.ts
    - src/components/hero/globe.test.ts
    - src/components/hero/GlobeCanvas.tsx
    - src/components/hero/GlobeCanvas.test.tsx
    - src/components/hero/scrollToSection.ts
  modified:
    - src/components/hero/Hero.tsx
    - src/styles/global.css
    - src/components/placeholders.test.tsx
    - src/App.test.tsx

key-decisions:
  - "Луч навешен селектором .btn[data-beam=\"true\"], а не голым [data-beam=\"true\"]: специфичность 0,2,0 перебивает min-height и hover примитива .btn--primary при любом порядке подключения стилей"
  - "Хелпер скролла временно лежит в src/components/hero/scrollToSection.ts: src/lib/ ещё не существует, план 01-03 делает общий вариант параллельно"
  - "Клик по CTA вызывает preventDefault только когда секция #light-form найдена: без неё якорю остаётся нативное поведение"
  - "Слои звёзд получили разные keyframes (star-drift и star-drift-b): у слоёв разные стартовые и конечные background-position, одним набором кадров их не описать"
  - "Заглушка hero убрана из табличных наборов placeholders.test.tsx и App.test.tsx: секция больше не заглушка, её проверяет собственный Hero.test.tsx"
  - "latitudeColor считается на каждый кадр без кеша: 1800 коротких строк на кадр дешевле, чем инвалидация кеша по квантованной широте"

patterns-established:
  - "TDD-гейты по задачам: отдельный test(02-01) коммит с красным тестом, следом feat(02-01) с реализацией"
  - "Тест canvas-компонента: мок 2d-контекста через vi.spyOn(HTMLCanvasElement.prototype, \"getContext\"), размеры через getBoundingClientRect, reduced motion через vi.spyOn(window, \"matchMedia\"), rAF через vi.spyOn(window, \"requestAnimationFrame\")"
  - "Компонент canvas обязан пережить getContext() === null: эффект выходит до подписок, разметка остаётся"

requirements-completed: [HERO-01, HERO-02, HERO-03]

duration: 14min
completed: 2026-09-05
---

# Phase 2 Plan 01: Hero и глобус Summary

**Hero с canvas-глобусом из 1800 частиц на фибоначчи-сфере, двухслойным звёздным полем, осветлённым брендовым градиентом H1 (контраст 4.1:1) и CTA с лучом на `@property --beam-angle`.**

## Performance

- **Duration:** 14 мин
- **Started:** 2026-09-05T15:38:00Z
- **Completed:** 2026-09-05T15:52:00Z
- **Tasks:** 3 из 3
- **Files modified:** 13 (9 создано, 4 изменено)

## Accomplishments

- Заглушка hero заменена на полноэкранную секцию: звёзды, глобус, скрим, виньетка, текстовая колонка внизу слева и CTA «Зажечь свой свет» на `#light-form`.
- Глобус рисуется на canvas и останавливается по трём условиям (вне вьюпорта, скрытая вкладка, `prefers-reduced-motion`), DPR ограничен 2, при reduced motion рисуется один статичный кадр.
- Математика глобуса вынесена в чистый модуль и покрыта тестами по числам, а не по пикселям: 1800 точек на единичной сфере, цвета полюсов и экватора, раскладка на 1440 и 390px, ровно 1800 вызовов `arc` и 3 вызова `ellipse` на кадр.
- CTA получил вращающийся луч по кайме 1.5px с fallback без `conic-gradient` и статичным углом 296deg при reduced motion.

## Task Commits

1. **Task 1: Hero с текстами, звёздным полем и CTA** — `aaf9932` (test), `d4f1d6b` (feat)
2. **Task 2: canvas-глобус из частиц с паузами** — `6e904cd` (test), `97670ad` (feat)
3. **Task 3: вращающийся луч по границе CTA** — `7fa088a` (test), `6c32c85` (feat)

## Files Created/Modified

- `src/data/copy.hero.ts` — тексты hero: надзаголовок, H1, подзаголовок, подпись и адрес CTA
- `src/components/hero/Hero.tsx` — секция `#hero`: слои, тексты из `heroCopy`, CTA со скроллом к форме и `data-beam`
- `src/components/hero/Starfield.tsx` — два слоя звёзд и три атмосферных пятна, всё `aria-hidden`
- `src/components/hero/globe.ts` — фибоначчи-сфера, цвет по широте, `shouldAnimate`, раскладка по ширине, отрисовка кадра
- `src/components/hero/GlobeCanvas.tsx` — canvas, rAF-цикл, ResizeObserver, IntersectionObserver, visibilitychange, matchMedia
- `src/components/hero/hero.css` — раскладка секции, звёзды и их дрейф, слои затемнения, осветляющий слой градиента H1, `forced-colors`
- `src/components/hero/scrollToSection.ts` — временный скролл к секции с поправкой 96px на header
- `src/components/hero/Hero.test.tsx` — 9 проверок секции, `globe.test.ts` — 6, `GlobeCanvas.test.tsx` — 3
- `src/styles/global.css` — блок луча CTA: `@property`, `conic-gradient`, маска, keyframes, hover, focus, fallback, reduced motion
- `src/components/placeholders.test.tsx`, `src/App.test.tsx` — hero убран из наборов проверки заглушек

## Decisions Made

- **Селектор луча `.btn[data-beam="true"]`.** План предлагал голый атрибутный селектор, но у него та же специфичность, что у `.btn--primary`: `min-height: 52px` и hover-подъём на 2px победили бы или проиграли в зависимости от порядка подключения `primitives.css` и `global.css`. Добавленный `.btn` снимает зависимость от порядка.
- **Скролл по CTA рвёт якорь только при найденной секции.** Пока `#light-form` заглушка, поведение одинаковое, но при выносе формы в отдельный роут ссылка продолжит работать нативно.
- **Цвет точки считается каждый кадр.** Кеш по широте дал бы неточность на близких значениях ради экономии, которая теряется на фоне 1800 вызовов `arc`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Хелпер скролла отсутствовал**
- **Found during:** Task 1
- **Issue:** План ссылался на `src/lib/scrollToSection.ts` из фазы 1, но каталога `src/lib/` в базе нет: `Header` и общий хелпер делает план 01-03 в параллельном worktree.
- **Fix:** Создан локальный `src/components/hero/scrollToSection.ts` с тем же API (`scrollToSection(hash, offset)`), смещение 96px совпадает со `scroll-padding-top` в `global.css`; при reduced motion скролл мгновенный.
- **Files modified:** src/components/hero/scrollToSection.ts, src/components/hero/Hero.tsx
- **Verification:** тест «по клику по CTA скроллит к форме вместо прыжка по якорю» в `Hero.test.tsx` зелёный
- **Committed in:** `d4f1d6b`
- **Follow-up:** фаза 5 переключает Hero на общий `src/lib/scrollToSection.ts` и удаляет локальную копию.

**2. [Rule 3 - Blocking] Тесты фазы 1 проверяли заглушку hero**
- **Found during:** Task 1
- **Issue:** `placeholders.test.tsx` требовал у `#hero` стеклянную карточку с телом из `copy.ts`, а `App.test.tsx` — карточку в каждой из восьми секций. После замены заглушки 4 теста падали.
- **Fix:** Hero убран из табличного набора и из отдельного блока `describe("Hero")` (его роль взял `Hero.test.tsx`); в `App.test.tsx` появился список `finishedSectionIds`, проверка карточек идёт по оставшимся секциям.
- **Files modified:** src/components/placeholders.test.tsx, src/App.test.tsx
- **Verification:** `npm test` — 8 файлов, 69 тестов, зелёные
- **Committed in:** `d4f1d6b`
- **Note:** план 02-02 сделает то же самое для `#map`; строка `finishedSectionIds` — вероятная точка конфликта при слиянии волны.

**3. [Rule 1 - Bug] Один набор keyframes не описывал оба слоя звёзд**
- **Found during:** Task 1
- **Issue:** План задавал `@keyframes star-drift` сразу с двумя диапазонами `background-position` (слой A от `0 0`, слой B от `90px 40px`), что в CSS невыразимо одним набором кадров.
- **Fix:** Добавлены `star-drift` и `star-drift-b`, слой B переопределяет `animation-name`.
- **Files modified:** src/components/hero/hero.css
- **Verification:** `npm run build` собирает CSS без предупреждений, оба имени присутствуют в `dist/assets/*.css`
- **Committed in:** `d4f1d6b`

**4. [Rule 3 - Blocking] Строка `conic-gradient(from var(--beam-angle),` разъезжалась при переносе**
- **Found during:** Task 3
- **Issue:** Многострочное форматирование градиента разбивало подстроку, по которой проверяется контракт плана.
- **Fix:** `conic-gradient(from var(--beam-angle),` оставлен на одной строке, стопы перенесены ниже.
- **Files modified:** src/styles/global.css
- **Verification:** `grep -c 'conic-gradient(from var(--beam-angle),' src/styles/global.css` → 1; та же подстрока есть в `dist/assets/*.css`
- **Committed in:** `6c32c85`

---

**Total deviations:** 4 auto-fixed (3 blocking, 1 bug)
**Impact on plan:** правки закрывают разрывы между планом и реальным состоянием базы (нет `src/lib/`, тесты фазы 1 держали заглушку) и одну невыразимую в CSS конструкцию. Объём плана не расширялся.

## Assumption Drift (advisory)

- **Assumption drift:** план исходил из того, что фаза 1 уже дала `src/lib/scrollToSection.ts` и `Header.tsx` с известной высотой header → в базе worktree нет ни `src/lib/`, ни Header (их делает 01-03 параллельно), высота header взята константой 96px из `scroll-padding-top`. Читателю SUMMARY это меняет картину: hero сейчас не зависит от Header, связка появится в фазе 5.
- **Assumption drift:** план разрешал править `Button.tsx` ради проброса `{...rest}` → примитив фазы 1 уже пробрасывает остальные пропсы, `data-beam` доходит до DOM без правок, `Button.tsx` не тронут.

## Issues Encountered

- `@testing-library/user-event` кликал по якорю с `href="#light-form"`, а jsdom не умеет скроллить: тест переведён на `vi.spyOn(window, "scrollTo")`, мок из `setup.ts` остаётся для остальных наборов.

## Verification Results

Все команды запускались в worktree `/Users/thevladoss/devs/web/esd_cringe-wt/02-01`:

- `npm test` — 8 файлов, 69 тестов, все зелёные (в hero: 9 + 6 + 3).
- `npm run build` — `tsc -b` и `vite build` без ошибок, `dist/index.html` и `dist/assets/index-*.css` (43.14 kB) созданы; `--beam-angle`, `conic-gradient(from var(--beam-angle)` и `globe-canvas` присутствуют в собранном CSS.
- `npx eslint src` — без замечаний.
- Threat register: `grep -r dangerouslySetInnerHTML src/components/hero` — пусто (T-02-02 закрыт); T-02-01 закрыт `shouldAnimate` и ограничением DPR, оба покрыты тестами.

**Не проверено:** визуальная проверка в браузере (`npm run preview` на 1440 и 390px, эмуляция `prefers-reduced-motion`) не выполнялась — у исполнителя нет браузера. Проверить нужно: положение глобуса (72% ширины на десктопе, центр до 768px), отсутствие обрезки выносных «д» и «у» у H1, вращение луча и его остановку при reduced motion. Playwright-smoke делает фаза 5.

## Next Phase Readiness

- Hero закрывает HERO-01, HERO-02 и HERO-03; `#hero` больше не заглушка.
- План 02-02 (карта, огоньки, состояние) не пересекается по файлам, кроме `placeholders.test.tsx` и `App.test.tsx`: там он тоже убирает свою секцию из наборов.
- Для фазы 5: переключить CTA на общий `src/lib/scrollToSection.ts` и удалить локальную копию из `src/components/hero/`.

---
*Phase: 02-hero-and-map*
*Completed: 2026-09-05*

## Self-Check: PASSED

Все заявленные файлы существуют, все шесть коммитов есть в `git log`.
