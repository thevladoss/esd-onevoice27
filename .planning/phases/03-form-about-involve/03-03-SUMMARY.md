---
phase: 03-form-about-involve
plan: 03
subsystem: ui
tags: [involve, triptych, svg, react, css, tailwind]

requires:
  - phase: 01-scaffold-and-deploy
    provides: примитивы Section, Eyebrow, GradientTitle, GlassCard, токены палитры и шрифтов
provides:
  - секция #involve «От убеждения к действию» вместо заглушки фазы 1
  - триптих из трёх карточек с декоративными SVG и ссылками на #about, #resources, #news
  - три инлайн-SVG PersonalArt, ToolkitArt, SharingArt (каждый меньше 3 КБ)
  - визуальный контракт триптиха в involve.css: три раскладки, швы, свечение, hover, фокус
affects: [04-news-resources-quote, 05-polish-and-release]

tech-stack:
  added: []
  patterns:
    - тексты секции в отдельном модуле src/data/copy.involve.ts вместо общего copy.ts
    - декоративные иллюстрации как React-компоненты с инлайн-SVG в components/<секция>/art/
    - компонентный CSS без cascade layers переопределяет утилиты Tailwind v4

key-files:
  created:
    - src/data/copy.involve.ts
    - src/components/involve/InvolveCard.tsx
    - src/components/involve/art/PersonalArt.tsx
    - src/components/involve/art/ToolkitArt.tsx
    - src/components/involve/art/SharingArt.tsx
    - src/components/involve/involve.css
    - src/components/involve/Involve.test.tsx
  modified:
    - src/components/involve/Involve.tsx

key-decisions:
  - "«Скачать материалы →» ведёт на #resources без хэша панели: фаза 4 сама решает, распознавать ли #resources-materials"
  - "Тексты секции живут в src/data/copy.involve.ts, а не в общем copy.ts: параллельные исполнители фазы 3 не конфликтуют за один файл"
  - "Кликабельна только ссылка-действие; article остаётся некликабельным, чтобы не плодить вложенные цели навигации"
  - "Раскладка 768-1023px вынесена в диапазонный медиазапрос, поэтому базовое aspect-ratio 4 / 3 не приходится восстанавливать на ≥1024px"

patterns-established:
  - "Уникальные префиксы id градиентов (inv-personal-, inv-toolkit-, inv-sharing-) исключают коллизии defs на одной странице"
  - "Стрелка → в ссылке вынесена в span[aria-hidden], поэтому доступное имя ссылки остаётся чистым"

requirements-completed: [INVOLVE-01]

duration: 12min
completed: 2026-09-05
---

# Phase 3 Plan 3: Триптих «От убеждения к действию» Summary

**Секция #involve с тремя карточками в одной стеклянной рамке: инлайн-SVG 4:3 на градиентных фонах, заголовки Onest 800 и ссылки-действия на #about, #resources и #news.**

## Performance

- **Duration:** ~12 мин
- **Started:** 2026-09-05T15:41:00Z
- **Completed:** 2026-09-05T15:54:00Z
- **Tasks:** 3 из 3
- **Files modified:** 8 (7 создано, 1 переписан)

## Accomplishments

- Заглушка `Involve` заменена секцией с надзаголовком «Как включиться», H2 через `GradientTitle variant="section"` и лидом; тексты вынесены в `src/data/copy.involve.ts`.
- Три декоративные SVG-иллюстрации нарисованы примитивами: свеча с конусом света и раскрытой книгой (signal), веер баннеров и телефон (unity), расходящиеся дуги с узлами (horizon). Размеры 2054, 2244 и 1891 байт при лимите 3072.
- Карточка отдаёт клавиатуре ровно одну цель: `article` без обработчиков, ссылка с `min-height: 44px` и кольцом фокуса `#aad9dc`.
- Триптих собран в трёх раскладках: стопка с радиусом 24px до 768px, три строки с медиа слева на планшете, три колонки в общей рамке со швами 1px и световым полем от 1024px.

## Task Commits

1. **Task 1: Красный тест секции** — `ae83bc3` (test)
2. **Task 2: Тексты, SVG, InvolveCard и Involve** — `82ca645` (feat)
3. **Task 3: Визуальный контракт триптиха** — `476a175` (style)

## Files Created/Modified

- `src/data/copy.involve.ts` — `involveCopy`: надзаголовок, заголовок, лид и три карточки с типизированными якорями
- `src/components/involve/Involve.tsx` — секция `#involve`: текстовый блок и триптих в `GlassCard`
- `src/components/involve/InvolveCard.tsx` — карточка: медиа 4:3, заголовок h3, ссылка-действие со стрелкой в `span[aria-hidden]`
- `src/components/involve/art/PersonalArt.tsx` — свеча, конус света, раскрытая книга, искры
- `src/components/involve/art/ToolkitArt.tsx` — веер из трёх баннеров, телефон с градиентным экраном, пунктирные связи
- `src/components/involve/art/SharingArt.tsx` — узел, четыре дуги, пять узлов сети со свечением
- `src/components/involve/involve.css` — токены триптиха, три раскладки, швы, медиа, hover, фокус, reduced motion
- `src/components/involve/Involve.test.tsx` — 5 тестов: структура секции, три карточки, ссылки и href, декоративность SVG, чистое имя ссылки

## Decisions Made

- `href` карточек типизирован объединением `"#about" | "#resources" | "#news"`, внешние URL и `target` в секции невозможны (T-03-11).
- Иллюстрации собраны из `rect`, `circle`, `ellipse`, `path`, `line` и градиентов; `text`, `image`, `foreignObject` и `script` отсутствуют, `dangerouslySetInnerHTML` не используется (T-03-10).
- `.inv-triptych` переопределяет `padding` и `border-radius` от `GlassCard` без `!important`: компонентный CSS не завёрнут в `@layer`, поэтому выигрывает у утилит Tailwind. Проверено на собранном `dist/assets/*.css`: правило лежит на нулевой глубине вложенности, вне `@layer utilities`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Итерация по NodeList ломала `tsc -b`**

- **Found during:** Task 2 (сборка после реализации)
- **Issue:** `for (const x of container.querySelectorAll(...))` даёт TS2488 при текущем `target`/`lib` проекта, `npm run build` падал с кодом 2
- **Fix:** Обёрнуты обе итерации в `Array.from(...)`
- **Files modified:** `src/components/involve/Involve.test.tsx`
- **Verification:** `npm run build` → код 0; `npx vitest run src/components/involve` → 5 passed
- **Committed in:** `82ca645`

**2. [Rule 2 - Missing Critical] Скрыт стеклянный кант рамки в мобильной раскладке**

- **Issue:** `.glass-card::before` рисует внутреннюю подсветку краёв даже там, где рамка триптиха отключена (< 768px), и кант повисает поверх стопки карточек
- **Fix:** `.inv-triptych::before { display: none }` внутри `@media (max-width: 767px)`
- **Files modified:** `src/components/involve/involve.css`
- **Verification:** `npm run build` → код 0, правило присутствует в собранном CSS
- **Committed in:** `476a175`

### Отклонения от буквы acceptance criteria

- `grep -c 'href="#about"\|href="#resources"\|href="#news"' src/data/copy.involve.ts` = 0, а не 3: критерий написан под JSX-синтаксис, в TS-модуле значения объявлены как `href: "#about"`. Фактическая проверка: `grep -n 'href: "#' src/data/copy.involve.ts` даёт ровно три строки — `#about`, `#resources`, `#news`.
- `grep -c "min-width: 768px"` = 1 внутри диапазонного медиазапроса `@media (min-width: 768px) and (max-width: 1023px)`. Критерий требовал ≥ 1, условие выполнено; диапазон выбран, чтобы `aspect-ratio: 4 / 3` встречалось ровно один раз, как требует соседний критерий.

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 missing critical)
**Impact on plan:** Обе правки локальны, объём плана не расширен.

## Assumption Drift (advisory)

- **Planned:** план и UI-SPEC описывают `.inv-triptych` как переопределение `GlassCard` без уточнения механики каскада.
- **Actual:** `GlassCard` подмешивает утилиты `p-6 md:p-8`, и переопределение работает только потому, что Tailwind v4 держит утилиты в `@layer utilities`, а компонентный CSS остаётся вне слоёв.
- **Why it matters:** если фаза 5 обернёт компонентные стили в `@layer components`, отступы рамки вернутся к `p-6` и триптих разъедется. Проверка на собранном CSS добавлена в этот итог.

## Issues Encountered

**`npm test` красный: 2 падения в `src/components/placeholders.test.tsx` (не мой файл).**

`Заглушка Involve > рендерит секцию…` и `> держит тело в стеклянной карточке` проверяют текст `copy.sections.involve.body` («Здесь появятся три пути участия…»), которого в новой секции нет по замыслу. Файл не тронут намеренно: он лежит вне выделенной зоны (`src/components/involve/**`, `src/data/copy.involve.ts`), а исполнители 03-01 и 03-02 удалят из того же массива свои записи `LightForm` и `About`. Три параллельные правки соседних строк одного массива дали бы конфликт на merge.

**Что нужно оркестратору после merge всех трёх веток фазы 3:** удалить из `placeholders.test.tsx` записи `LightForm`, `About`, `Involve` вместе с их импортами (файл остаётся актуальным для `Hero`, `MapSection`, `News`, `Resources`, `Quote`). Одна правка вместо трёх конфликтующих.

Остальное зелёное: 89 из 91 теста, `npm run build` код 0, `npm run lint` код 0.

## Verification Results

| Проверка | Результат |
|----------|-----------|
| `npx vitest run src/components/involve` | код 0, 5 passed |
| `npm run build` | код 0 |
| `npm run lint` | код 0 |
| `npm test` (весь набор) | код 1: 89 passed, 2 failed в `placeholders.test.tsx` (см. выше) |
| `wc -c src/components/involve/art/*.tsx` | 2054 / 2244 / 1891 при лимите 3072 |
| `grep -c -E "<text\|<image\|<foreignObject\|<script"` по art/*.tsx | 0 в каждом |
| `grep -c 'role="presentation"'`, `grep -c 'viewBox="0 0 400 300"'` | по 1 в каждом art-файле |
| `grep -c "onClick" InvolveCard.tsx` | 0 |
| `grep -c "dangerouslySetInnerHTML"` по involve/*.tsx и art/*.tsx | 0 в каждом |
| `grep -c 'import "./involve.css"' Involve.tsx` | 1 |
| involve.css: `prefers-reduced-motion` / `(hover: hover)` / `aspect-ratio: 4 / 3` / `min-height: 44px` / `repeat(3` / `min-width: 1024px` | 1 / 1 / 1 / 1 / 1 / 1 |
| involve.css: `-w h2` / `!important` | 0 / 0 |

**Не проверено машинно:** визуальный `<human-check>` Task 3 (три раскладки на 1440/768/390, hover, кольцо фокуса в браузере). Пользователь недоступен, чекпойнт авто-одобрен по инструкции запуска: ⚡ Auto-approved checkpoint. Вместо браузера сделана структурная проверка собранного CSS: правила триптиха попали в `dist/assets/*.css` вне cascade layers.

## Known Stubs

Нет.

## Threat Flags

Нет: секция не добавляет сетевых запросов, форм и внешних ссылок. `href` ограничен объединением трёх внутренних якорей, `target` не используется.

## Next Phase Readiness

- `#resources` и `#news` пока ведут на секции-заглушки фазы 4; якоря заработают в полную силу после неё. «Скачать материалы →» намеренно ведёт на `#resources` без хэша панели — фаза 4 при желании сама распознает `#resources-materials`.
- Разметка карточек оставлена плоской: каждая `article` — отдельный узел верхнего уровня внутри рамки, поэтому фаза 5 может навесить `whileInView` и stagger без переделки.
- Единственный хвост — 2 падающих теста в `placeholders.test.tsx`, снимаются одной правкой после merge веток 03-01, 03-02, 03-03.

---
*Phase: 03-form-about-involve*
*Completed: 2026-09-05*

## Self-Check: PASSED

Все восемь заявленных файлов на месте, три коммита (`ae83bc3`, `82ca645`, `476a175`) в истории ветки `agent-03-03`. `git diff --name-only main...HEAD` не выходит за пределы `src/components/involve/**` и `src/data/copy.involve.ts`; `STATE.md` и `ROADMAP.md` не тронуты.
