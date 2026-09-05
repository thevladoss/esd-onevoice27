---
phase: 05-polish-and-release
plan: 01
subsystem: ui
tags: [motion, react, reveal, whileInView, prefers-reduced-motion, tailwind]

requires:
  - phase: 01-foundation
    provides: примитивы Section, Eyebrow, GradientTitle, GlassCard и пакет motion
  - phase: 02-map-and-hero
    provides: hero, карта, счётчики с count-up и useInViewOnce
  - phase: 03-form-and-about
    provides: секции light-form и about
  - phase: 04-involve-news-resources
    provides: секции involve, news, resources, quote
provides:
  - Reveal, RevealGroup и RevealItem на motion/react с единым контрактом появления
  - reveal.constants.ts как единственный источник длительности, кривой, stagger и сдвигов
  - обёртки появления в семи секциях и fade текста hero
  - политику prefers-reduced-motion для JS-анимаций: обёртки рендерят обычные элементы
affects: [05-02-tokens-and-shell, 05-07-smoke, любые будущие секции лендинга]

tech-stack:
  added: []
  patterns:
    - "Обёртка появления заменяет собой существующий элемент через as/className: лишних узлов в DOM нет"
    - "Каскад карточек делает RevealGroup через variants, а не delay на каждой карточке"
    - "Длительности и кривые движения приходят только из reveal.constants.ts"

key-files:
  created:
    - src/components/layout/reveal.constants.ts
    - src/components/layout/Reveal.tsx
    - src/components/layout/Reveal.test.tsx
    - src/components/layout/Reveal.motion.test.tsx
  modified:
    - src/components/hero/Hero.tsx
    - src/components/map/MapSection.tsx
    - src/components/map/Counters.tsx
    - src/components/form/LightForm.tsx
    - src/components/about/About.tsx
    - src/components/involve/Involve.tsx
    - src/components/involve/involve.css
    - src/components/news/News.tsx
    - src/components/resources/Resources.tsx
    - src/components/quote/Quote.tsx

key-decisions:
  - "Тег обёртки выбирается из закрытого списка (div, section, article, figure, ul, li, p): готовые motion-компоненты лежат в модуле, потому что eslint-правило react-hooks/static-components запрещает motion.create(as) в рендере"
  - "REVEAL_EASE объявлена изменяемым кортежем [number, number, number, number]: тип ease у motion не принимает readonly-кортеж от as const"
  - "Каскад пары счётчиков живёт в Counters.tsx, а не в MapSection.tsx: контейнер .counters позиционируется поверх карты, обёртка вокруг него схлопнулась бы в нулевую высоту и порог IntersectionObserver не сработал бы"
  - "Reveal, RevealGroup и RevealItem пропускают ref и aria-атрибуты: живой регион счётчиков и его измерение остались на том же узле"
  - "Швы рамки триптиха переехали с .inv-card на .inv-slot: обёртка появления стала элементом сетки вместо карточки"

patterns-established:
  - "Заголовочный блок секции = <Reveal className=\"…\">, соседний медиа-блок = <Reveal delay={0.1}>"
  - "Сетка карточек = <RevealGroup as=\"ul\"> + <RevealItem as=\"li\">, ключ по id элемента"
  - "Hero не участвует в reveal: текст проявляется при монтировании только по opacity"

requirements-completed: [MOTION-01]

duration: 15min
completed: 2026-09-05
---

# Phase 5 Plan 01: Контракт движения Summary

**Reveal/RevealGroup/RevealItem на motion/react: семь секций появляются при скролле один раз (0.7s, cubic-bezier(0.22, 1, 0.36, 1), каскад 0.08s), текст hero проявляется fade 0.6s, при prefers-reduced-motion обёртки рендерят обычные элементы.**

## Performance

- **Duration:** ~15 мин
- **Started:** 2026-09-05T17:36:00Z
- **Completed:** 2026-09-05T17:50:00Z
- **Tasks:** 3
- **Files modified:** 14 (4 создано, 10 изменено)

## Accomplishments

- Контракт движения фазы 5 закрыт одним модулем: `reveal.constants.ts` держит длительность 0.7s, кривую `[0.22, 1, 0.36, 1]`, stagger 0.08s, `delayChildren` 0.05s, сдвиги 24/16px и параметры fade hero; других длительностей в JSX проекта нет (проверено `grep`).
- `Reveal` появляется по `whileInView` с `once: true` и порогами из UI-SPEC: `amount: 0.2` и `margin: "0px 0px -10% 0px"` от 768px, `amount: 0.15` и `-6%` ниже. Ширина читается один раз при монтировании, ресайз reveal не перезапускает.
- Каскады идут через `variants`: пара счётчиков, тройка `StepCard`, триптих, шесть карточек новостей, три карточки ресурсов.
- При `prefers-reduced-motion: reduce` все три обёртки рендерят обычные элементы: ни inline `opacity: 0`, ни `transform` на узлы не попадает. Это доказывают тесты `Reveal.test.tsx`.
- Обёртки почти нигде не добавили узлов в DOM: они заменили собой существующие элементы через `as`/`className` (ul/li новостей, `figure` цитаты, карточки ресурсов в 12-колоночной сетке, `.counters`, `.inv-triptych-wrap`).
- Hero остался вне reveal: eyebrow, H1 и подзаголовок проявляются с задержками 0 / 0.08 / 0.16s и двигают только прозрачность, поэтому градиент по тексту H1 не попадает в transform-контекст.

## Task Commits

1. **Task 1 (RED): падающие тесты контракта Reveal** — `0c25224` (test)
2. **Task 1 (GREEN): Reveal, RevealGroup, RevealItem и константы** — `dd9380d` (feat)
3. **Task 2: обёртки в map, light-form, about, involve и fade hero** — `2228fd8` (feat)
4. **Task 3: обёртки в news, resources и quote** — `9c2c2a0` (feat)

Рефакторинг отдельным коммитом не понадобился: правки после RED уложились в шаг GREEN.

## Files Created/Modified

- `src/components/layout/reveal.constants.ts` — восемь констант движения, единственный источник для JSX
- `src/components/layout/Reveal.tsx` — три обёртки, закрытый список тегов, ветка reduce без motion
- `src/components/layout/Reveal.test.tsx` — три теста при reduce: контент виден, стилей нет, `as`/`className` работают
- `src/components/layout/Reveal.motion.test.tsx` — два теста без reduce: начальное `opacity: 0` у блока и у детей группы
- `src/components/hero/Hero.tsx` — fade текста при монтировании, при reduce обычная разметка
- `src/components/map/MapSection.tsx` — `Reveal` на заголовочном блоке и на контейнере карты (`delay: 0.1`)
- `src/components/map/Counters.tsx` — `.counters` стал `RevealGroup`, карточки — `RevealItem`
- `src/components/form/LightForm.tsx` — `Reveal` на заголовочном блоке и на `GlassCard` формы (`delay: 0.1`); тост не тронут
- `src/components/about/About.tsx` — заголовочный блок, видео-фасад и каскад трёх `StepCard`
- `src/components/involve/Involve.tsx` — заголовочный блок и каскад триптиха
- `src/components/involve/involve.css` — правило `.inv-slot` и швы рамки на обёртке
- `src/components/news/News.tsx` — заголовочный блок, каскад сетки на `ul`/`li`, пагинация с `delay: 0.1`
- `src/components/resources/Resources.tsx` — центральный блок и каскад трёх карточек в сетке
- `src/components/quote/Quote.tsx` — `figure` целиком одной обёрткой

## Decisions Made

- **Закрытый список тегов вместо `motion.create(as)`.** Правило `react-hooks/static-components` (eslint-plugin-react-hooks 7) считает ошибкой компонент, полученный вызовом в рендере, и `npm run lint` падал на всех трёх обёртках. Готовые `motion.div`, `motion.section`, `motion.article`, `motion.figure`, `motion.ul`, `motion.li`, `motion.p` лежат в модульной константе, проп `as` сузился с `React.ElementType` до объединения этих семи тегов. Каскады и обёртки фазы 5 в этот список укладываются.
- **`REVEAL_EASE` — изменяемый кортеж.** `as const` даёт readonly-кортеж, а `ease` у motion объявлен как `[number, number, number, number]`; со спредом внутри `useMemo` тип разъезжался до `(0.22 | 1 | 0.36)[]` и `tsc` падал. Значение то же, аннотация типа снимает вопрос.
- **Счётчики оживают внутри `Counters.tsx`.** Контейнер `.counters` от 768px абсолютно позиционирован поверх карты, поэтому обёртка вокруг него в `MapSection` имела бы нулевую высоту: `IntersectionObserver` не набрал бы `amount: 0.2`, и счётчики остались бы на `opacity: 0` навсегда (угроза T-05-01). Группой стал сам `.counters`, карточки — её детьми, как и предписывает UI-SPEC («RevealGroup получает тот же позиционирующий класс»).
- **`ref` и aria-атрибуты проходят сквозь обёртки.** Иначе `.counters` потерял бы `aria-live="polite"` и `ref` для `useInViewOnce`, а count-up перестал бы запускаться. На месте передачи `ref` приводится к `never`: объединение тегов пересекает типы ref, общего надтипа у них нет.
- **`Section.tsx` не изменён.** Инструкция плана была условной («если заголовочный блок рендерится примитивом `Section` по пропам `eyebrow`/`title`»), но ни одна секция эти пропы не передаёт: каждая рисует заголовочный блок сама. Проп `reveal` остался бы мёртвым кодом.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `motion.create(as)` в рендере не проходит lint**

- **Found during:** Task 1
- **Issue:** План предписывал `motion.create(as ?? "div")` в `useMemo`. Правило `react-hooks/static-components` даёт три ошибки, `npm run lint` не проходит. Модульный кэш через `Map` правило тоже не устроил.
- **Fix:** Константа `MOTION_TAGS` с семью готовыми motion-компонентами, тип `RevealTag = keyof typeof MOTION_TAGS`, проп `as` сузился с `React.ElementType` до этого объединения.
- **Files modified:** `src/components/layout/Reveal.tsx`
- **Verification:** `npx eslint .` завершается 0, `npx tsc -b` без ошибок, пять тестов Reveal зелёные
- **Committed in:** `dd9380d`

**2. [Rule 3 - Blocking] readonly-кортеж кривой не проходит проверку типов**

- **Found during:** Task 1
- **Issue:** `REVEAL_EASE = [...] as const` внутри `variants` терял кортежность и получал тип `(0.22 | 1 | 0.36)[]`, несовместимый с `Easing`. `npx tsc -b` падал на `RevealItem`.
- **Fix:** `export const REVEAL_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];` — значение то же, потребители берут константу без спреда.
- **Files modified:** `src/components/layout/reveal.constants.ts`, `src/components/layout/Reveal.tsx`
- **Verification:** `npx tsc -b` без ошибок
- **Committed in:** `dd9380d`

**3. [Rule 2 - Missing Critical] Обёртка вокруг абсолютных счётчиков оставила бы их невидимыми**

- **Found during:** Task 2
- **Issue:** `.counters` от 768px позиционируется абсолютом поверх карты. `RevealGroup` вокруг `<Counters />` в `MapSection` получил бы нулевую высоту, `IntersectionObserver` никогда не набрал бы `amount: 0.2`, и счётчики застряли бы на `opacity: 0` (T-05-01 из threat model плана).
- **Fix:** Группой стал сам контейнер `.counters` внутри `Counters.tsx`, карточки счётчиков — `RevealItem as="article"`. Обёртки `Reveal`, `RevealGroup` и `RevealItem` научились пропускать `ref` и aria-атрибуты, чтобы живой регион и `useInViewOnce` остались на том же узле.
- **Files modified:** `src/components/map/Counters.tsx`, `src/components/map/MapSection.tsx`, `src/components/layout/Reveal.tsx`
- **Verification:** `npm test` (283 теста, включая `Counters.test.tsx` с живым регионом и count-up) зелёный
- **Committed in:** `dd9380d`, `2228fd8`
- **Последствие для приёмки:** `grep -c "<RevealGroup" src/components/map/MapSection.tsx` и `grep -c "<RevealItem" src/components/map/MapSection.tsx` выводят 0 вместо ожидаемого «не меньше 1». Обе обёртки лежат в `src/components/map/Counters.tsx` (1 и 2 соответственно). Остальные критерии задачи 2 по `MapSection.tsx` выполнены: `<Reveal` — 2, `delay={0.1}` — 1.

**4. [Rule 3 - Blocking] Швы рамки триптиха рвались обёрткой**

- **Found during:** Task 2
- **Issue:** Триптих — одна `GlassCard` со швами `.inv-card + .inv-card`. `RevealItem` вокруг карточки делает соседями обёртки, а не карточки: границы между колонками пропадали, а карточки переставали растягиваться на высоту рамки.
- **Fix:** Обёртка получила класс `.inv-slot` (`display: grid; min-width: 0`), швы в `involve.css` переехали на `.inv-slot + .inv-slot` в обоих медиазапросах.
- **Files modified:** `src/components/involve/Involve.tsx`, `src/components/involve/involve.css`
- **Verification:** `npm run build` собирает `.inv-slot` в CSS (проверено `grep` по `dist/assets/index-*.css`), `Involve.test.tsx` зелёный (три `article`, по одной ссылке в карточке)
- **Committed in:** `2228fd8`

**5. [Rule 1 - Bug] Карточки шагов теряли общую высоту**

- **Found during:** Task 2
- **Issue:** `.ab-steps` — сетка с `align-items: stretch`; после обёртки элементом сетки становится `RevealItem`, а `.ab-step` внутри получал высоту по содержимому, и тройка карточек переставала выравниваться по нижней грани.
- **Fix:** `RevealItem className="grid"` — карточка занимает всю ячейку обёртки.
- **Files modified:** `src/components/about/About.tsx`
- **Verification:** `npm run build`, `About.test.tsx` зелёный
- **Committed in:** `2228fd8`

---

**Total deviations:** 5 auto-fixed (3 blocking, 1 missing critical, 1 bug)
**Impact on plan:** Ни одна правка не расширяет объём. Две продиктованы правилами lint и типами motion, три сохраняют раскладку и видимость контента, который иначе остался бы скрытым.

## Assumption Drift (advisory)

- **Заголовочные блоки секций.** План допускал, что их рисует примитив `Section` по пропам `eyebrow`/`title`, и тогда обёртку следовало ставить один раз внутри `Section.tsx` плюс проп `reveal`. По факту `Section` вызывают только с `id`, `className` и `children`, а заголовочный блок каждая секция собирает сама. Обёртки поставлены в семи файлах секций, `Section.tsx` не тронут.
- **Полиморфный проп `as`.** План и `<interfaces>` описывали `as?: React.ElementType`. Правило `react-hooks/static-components` в конфиге проекта закрыло путь к динамическому созданию motion-компонента, поэтому `as` принимает объединение из семи тегов. Для секций фазы 5 разницы нет, но следующий план, которому понадобится другой тег, добавит его в `MOTION_TAGS`.
- **Мобильный сдвиг в `RevealItem`.** UI-SPEC записывает его как `y: "var(--reveal-shift)"`. В коде стоит число из `matchMedia` (24/16), как и разрешал план: CSS-токен добавляет параллельный план 05-02, и компонент от порядка их появления не зависит.

## Issues Encountered

- `vite build` предупреждает, что чанк больше 500 КБ (576 КБ raw, 191 КБ gzip). Предупреждение существовало до этого плана и разобрано в `05-RESEARCH.md` («Размер бандла»); разделение бандла в объём 05-01 не входит.

## User Setup Required

None — внешние сервисы не настраиваются.

## Next Phase Readiness

- `reveal.constants.ts` готов для CSS-токенов `--dur-reveal`, `--ease-reveal`, `--stagger-reveal`, `--reveal-shift`, которые добавляет план 05-02: значения совпадают (700ms, `cubic-bezier(0.22, 1, 0.36, 1)`, 80ms, 24/16px).
- Smoke-план 05-07 может проверять, что после прокрутки у каждой обёртки `opacity: 1` и `transform: none`, а при `emulateMedia({ reducedMotion: "reduce" })` все восемь секций видны сразу.
- STATE.md, ROADMAP.md и REQUIREMENTS.md намеренно не тронуты: их обновляет оркестратор после слияния параллельных планов. MOTION-01 закрыт кодом этого плана.

## Self-Check: PASSED

- Четыре созданных файла и `involve.css` на месте, все четыре коммита задач в истории ветки `agent-05-01`.
- `git diff 00589ea..HEAD -- package.json` пуст: зависимости не менялись (T-05-SC).
- Прогнаны и наблюдались: `npx tsc -b` (без вывода), `npx eslint .` (код 0), `npm test` (41 файл, 283 теста, все зелёные), `npm run build` (код 0, `dist` собран), `npx vitest run src/components/layout/Reveal.test.tsx src/components/layout/Reveal.motion.test.tsx` (5 тестов зелёные).
- Проверки браузером не выполнялись: раскладку на 390/768/1024/1440 и `transform: none` после прокрутки снимает smoke-план 05-07.

---
*Phase: 05-polish-and-release*
*Completed: 2026-09-05*
