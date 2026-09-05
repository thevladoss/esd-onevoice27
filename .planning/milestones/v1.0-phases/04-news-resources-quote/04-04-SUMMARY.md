---
phase: 04-news-resources-quote
plan: 04
subsystem: ui
tags: [react, typescript, tailwindcss-v4, css-grid, accessibility, aria, vitest, testing-library]

requires:
  - phase: 01-02
    provides: "примитивы Eyebrow, GradientTitle, GlassCard, утилита .glass, токены @theme"
  - phase: 04-03
    provides: "copy.resources.ts, materials.ts, VideoGrid с 16 фасадами"
provides:
  - "src/components/resources/Resources.tsx: секция #resources с сеткой 12 колонок, состоянием активной панели, Esc и deep link"
  - "src/components/resources/ResourceCard.tsx: карточка-кнопка с aria-expanded и aria-controls"
  - "src/components/resources/ResourcePanel.tsx: region с шапкой, кнопкой «Свернуть» и веткой контента по ключу"
  - "src/components/resources/MaterialsList.tsx: 5 внешних ссылок ЕАД с inline-иконками по kind"
  - "src/components/resources/MusicPlaceholder.tsx: заглушка «Песня ещё в работе»"
  - "src/components/resources/resources.css: частицы, звёздный фон, поверхность карточек и панели, раскрытие 0fr→1fr"
affects: [05-motion-and-polish]

tech-stack:
  added: []
  patterns:
    - "Секционный CSS-файл рядом с компонентом идёт вне слоёв Tailwind, поэтому перекрывает @utility glass без !important"
    - "Раскрытие блока переменной высоты через grid-template-rows: 0fr → 1fr на постоянной обёртке"
    - "id для aria-controls висит на постоянной обёртке, а не на условно смонтированном region"
    - "Deep link читается ленивым инициализатором useState, а не setState в эффекте"

key-files:
  created:
    - src/components/resources/ResourceCard.tsx
    - src/components/resources/ResourcePanel.tsx
    - src/components/resources/MaterialsList.tsx
    - src/components/resources/MusicPlaceholder.tsx
    - src/components/resources/resources.css
    - src/components/resources/Resources.test.tsx
  modified:
    - src/components/resources/Resources.tsx

key-decisions:
  - "Поверхность карточки и панели описана в resources.css, а не Tailwind-классами bg-[...]: утилита .glass задаёт background шорткатом в том же слое utilities, порядок правил внутри слоя не гарантирован"
  - "Deep link открывает панель ленивым инициализатором useState: eslint react-hooks/set-state-in-effect запрещает setState в теле эффекта, эффект оставлен только под scrollIntoView"
  - "Произвольные значения записаны как [color:var(--accent)]: без префикса Tailwind не различает цвет и ширину"
  - "MusicPlaceholder берёт padding у GlassCard (p-6 md:p-8) вместо собственного p-8, чтобы две утилиты padding не спорили за один слой"

patterns-established:
  - "Карточка-кнопка: вся поверхность один <button>, триггер нарисован <span>, вложенных ссылок нет"
  - "Акцент карточки едет через инлайновую переменную --accent, CSS и Tailwind читают её одинаково"

requirements-completed: [RES-01, RES-02, RES-03, RES-04]

duration: 11min
completed: 2026-09-05
---

# Phase 04 Plan 04: Карточки и панели ресурсов Summary

**Секция #resources: три асимметрично расставленные карточки-кнопки над дрейфующими частицами, панель с ветками материалов (5 ссылок ЕАД), видео (16 фасадов) и музыки, закрытие повторным кликом, кнопкой и Esc с возвратом фокуса, deep link `#resources-materials`**

## Performance

- **Duration:** 11 мин
- **Started:** 2026-09-05T16:04:45Z
- **Completed:** 2026-09-05T16:16:00Z
- **Tasks:** 3
- **Files modified:** 7 (6 создано, 1 переписан)

## Accomplishments

- Заглушка фазы 1 заменена секцией на сетке 12 колонок: центральный текстовый блок в пунктирной рамке, карточка «Музыка» слева сверху, «Материалы» справа со сдвигом вниз, «Видео» снизу слева от центра; на планшете сетка 6 колонок, на мобильном вертикальный стек.
- Панель под сеткой переключает три ветки контента: `MaterialsList` с пятью реальными ссылками ЕАД в новой вкладке, `VideoGrid` из плана 04-03 с 16 фасадами, `MusicPlaceholder` без единой кнопки.
- Клавиатура закрыта целиком: `aria-expanded` и `aria-controls` на карточках, `role="region"` с `aria-labelledby` и `tabIndex={-1}` на панели, фокус уходит на панель при открытии и возвращается на карточку-триггер после Esc, кнопки «Свернуть» или повторного клика.
- Адрес с `#resources-materials` открывает панель материалов на первом же рендере и прокручивает к секции; строка сверяется целиком и никуда не подставляется.
- `resources.css` держит звёздный фон, три слоя частиц с разными периодами (18s, 22s, 26s), поверхность карточки и панели, линию под триггером и ореол точки у раскрытой карточки; блок `prefers-reduced-motion` гасит анимации и переход панели.

## Task Commits

1. **Task 1: падающие тесты карточек и панелей** - `faff361` (test)
2. **Task 2: карточки, переключение панелей, материалы и заглушка музыки** - `a7d9503` (feat)
3. **Task 3: частицы, анимация панели, Esc, возврат фокуса и deep link** - `2fb68a4` (feat)

## Files Created/Modified

- `src/components/resources/Resources.tsx` - секция `#resources`, состояние активной панели, фокус, Esc, deep link, сетка карточек (134 строки)
- `src/components/resources/ResourceCard.tsx` - карточка-кнопка: label, точка-индикатор, заголовок, описание, триггер `<span>`
- `src/components/resources/ResourcePanel.tsx` - `role="region"` с шапкой, кнопкой «Свернуть панель» и веткой контента по `kind`
- `src/components/resources/MaterialsList.tsx` - пять строк материалов, пять inline-иконок 24×24 по `kind`, `rel="noopener noreferrer"`
- `src/components/resources/MusicPlaceholder.tsx` - `GlassCard` с нотой, заголовком «Песня ещё в работе» и текстом заглушки
- `src/components/resources/resources.css` - токен `--color-unity-200`, звёздный фон, `@keyframes resources-particles`, три слоя, поверхности, раскрытие `0fr→1fr`, reduced motion
- `src/components/resources/Resources.test.tsx` - 11 проверок: сетка, переключение веток, ссылки, заглушка, Esc, возврат фокуса, deep link, слои частиц

## Decisions Made

- Поверхность карточки и панели переехала из Tailwind-классов `bg-[linear-gradient(...)]` в `resources.css`. Утилита `.glass` объявлена через `@utility` и задаёт `background` шорткатом внутри `@layer utilities`; порядок правил относительно `bg-*` в том же слое не определён, а шорткат стирает `background-image`. Проверено по собранному CSS: `.glass` лежит на позиции 10920 внутри слоя utilities, а `primitives.css` (обычный импорт компонента) на позиции 45968 вне слоёв, то есть импортируемый компонентом CSS выигрывает каскад.
- Тот же ход применён к `backdrop-filter`: `blur(18px) saturate(125%)` из UI-SPEC задан в `resources.css`, Tailwind-утилиты `backdrop-blur-[18px] backdrop-saturate-125` убраны из `ResourceCard`.
- Заголовки карточек оставлены `<h3>`, как требуют план и UI-SPEC («Порядок заголовков: h2 секции → h3 заголовки карточек ресурсов»), несмотря на то что `<h3>` внутри `<button>` не проходит валидатор HTML (кнопка ждёт phrasing content). Ни рендер, ни тесты, ни сборка на это не реагируют; вложенных интерактивных элементов внутри кнопки нет, что и проверяет тест 6.
- Тест 11 (три слоя частиц) позеленел уже после Task 2, потому что разметку `[data-particles]` создаёт Task 2, а стили к ней добавляет Task 3.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `setState` в теле эффекта ломает `eslint`**

- **Found during:** Task 3 (deep link)
- **Issue:** План предписывал `useEffect(() => { ...; setActive("materials"); ... }, [])`. Правило `react-hooks/set-state-in-effect` из `eslint-plugin-react-hooks@7` считает это ошибкой (каскадный рендер), `npx eslint src/` падал с кодом 1.
- **Fix:** Хэш читается ленивым инициализатором `useState(() => hashOpensMaterials() ? "materials" : null)`, в эффекте остался только `scrollIntoView`. Сравнение с литералом `MATERIALS_HASH` сохранено, значение хэша по-прежнему никуда не подставляется (митигация T-04-13 не пострадала).
- **Files modified:** `src/components/resources/Resources.tsx`
- **Verification:** `npx eslint src/` → exit 0; тест «адрес с #resources-materials открывает панель материалов сразу при монтировании» зелёный.
- **Committed in:** `2fb68a4`

**2. [Rule 3 - Blocking] Конфликт `@utility glass` и произвольных `bg-*` в одном слое**

- **Found during:** Task 2 (поверхность карточки и панели)
- **Issue:** План задавал поверхность карточки классом `bg-[linear-gradient(...),linear-gradient(...)]`, а панель классом `bg-[radial-gradient(...)]` поверх утилиты `glass`. `.glass` пишет `background` шорткатом и живёт в том же `@layer utilities`, поэтому итог зависит от порядка правил внутри слоя и может стереть градиент.
- **Fix:** Градиенты карточки и панели описаны селекторами `.resource-card` и `.resources-panel` в `resources.css`. Файл импортируется компонентом и попадает в бандл вне слоёв Tailwind, поэтому перекрывает утилиту детерминированно. Соответствующие Tailwind-классы из `ResourceCard.tsx` и `ResourcePanel.tsx` убраны, чтобы не оставлять мёртвых классов.
- **Files modified:** `src/components/resources/ResourceCard.tsx`, `src/components/resources/ResourcePanel.tsx`, `src/components/resources/resources.css`
- **Verification:** позиции правил в `dist/assets/index-*.css` сверены скриптом (`.glass` внутри слоя utilities, компонентный CSS после слоёв); `npm run build` → exit 0.
- **Committed in:** `a7d9503`, `2fb68a4`

**3. [Rule 1 - Bug] Неоднозначные произвольные значения Tailwind**

- **Found during:** Task 2 (`ResourceCard`)
- **Issue:** План предписывал `hover:border-[var(--accent)]`, `focus-visible:outline-[var(--accent)]`, `bg-[var(--accent)]`. Tailwind не выводит тип значения из `var()`, поэтому такие утилиты не всегда компилируются в `border-color` / `outline-color` / `background-color`.
- **Fix:** Записано как `[color:var(--accent)]` во всех трёх местах.
- **Files modified:** `src/components/resources/ResourceCard.tsx`
- **Verification:** `npm run build` → exit 0, классы попали в собранный CSS.
- **Committed in:** `a7d9503`

**4. [Rule 3 - Blocking] Конфликт padding в `MusicPlaceholder`**

- **Found during:** Task 2
- **Issue:** План задавал `<GlassCard className="... p-8 ...">`, но `GlassCard` уже отдаёт `p-6 md:p-8`; две утилиты padding в одном слое дают неопределённый результат.
- **Fix:** Из `className` убран `p-8`, padding берётся у `GlassCard` (`p-6 md:p-8`, на `md` даёт те же 32px из UI-SPEC).
- **Files modified:** `src/components/resources/MusicPlaceholder.tsx`
- **Verification:** `npm run build` → exit 0.
- **Committed in:** `a7d9503`

**5. [Rule 2 - Convention] Сообщения коммитов на русском**

- **Found during:** Task 1
- **Issue:** План диктовал английские строки (`test(04-04): add failing tests...`), глобальный `CLAUDE.md` требует русский для всего текста, включая коммиты. План 04-03 уже зафиксировал этот выбор.
- **Fix:** Тип и scope оставлены как в плане, заголовок и тело переведены на русский.
- **Files modified:** нет
- **Verification:** `git log --oneline -3`
- **Committed in:** `faff361`, `a7d9503`, `2fb68a4`

### Assumption Drift (advisory)

**1. Панель материалов по deep link открывается на первом рендере, а не после эффекта**

- **Found during:** Task 3
- **Planned:** план и UI-SPEC описывали открытие через `setActive("materials")` в эффекте монтирования, то есть после первого рендера.
- **Actual:** состояние стартует с `"materials"`, панель есть в разметке сразу; эффект отвечает только за `scrollIntoView`.
- **Why:** правило `react-hooks/set-state-in-effect` (см. пункт 1 в «Auto-fixed Issues»). Поведение для посетителя то же, но без промежуточного кадра с закрытой панелью, поэтому CSS-переход `0fr→1fr` при заходе по ссылке не проигрывается.

---

**Total deviations:** 5 auto-fixed (3 blocking, 1 bug, 1 convention)
**Impact on plan:** ни одна правка не расширила объём. Три из пяти чинят детерминированность каскада и линт, одна снимает неоднозначность синтаксиса Tailwind, одна следует глобальному правилу языка.

## Issues Encountered

**Тесты заглушек фазы 1 падают, потому что `Resources` больше не заглушка.** Это ожидаемый эффект замены секции, чинить его в этом worktree запрещено инструкцией оркестратора:

- `src/App.test.tsx > App > показывает стеклянные карточки в секциях-заглушках` — ищет `.glass-card` внутри `#resources`; теперь карточек ресурсов пять, но ни одна не `.glass-card` (утилита `.glass` без компонента `GlassCard`).
- `src/components/placeholders.test.tsx > Заглушка Resources > рендерит секцию с надзаголовком, заголовком и телом из copy.ts`
- `src/components/placeholders.test.tsx > Заглушка Resources > держит тело в стеклянной карточке`

Оба файла лежат вне зоны этого плана. Оркестратору при мердже нужно убрать `resources` из списка заглушек в обоих файлах, как это уже сделано для `quote` в коммите `b855c40`.

## Verification Results

Прогнано в worktree `/Users/thevladoss/devs/web/esd_cringe-wt/04-04`:

- `npx vitest run src/components/resources/Resources.test.tsx` → **11 passed (11)**, exit 0.
- `npm test` → **171 passed, 3 failed (174)**; все три падения из списка выше, вне зоны плана.
- `npm run build` → exit 0 (`tsc -b && vite build`, 221 модуль, CSS 61.14 kB).
- `npx eslint src/` → exit 0.
- Проверки acceptance criteria: `@keyframes resources-particles` встречается 1 раз; `prefers-reduced-motion: reduce`, `grid-template-rows: 1fr`, `--color-unity-200: #8f9dd6` найдены; все селекторы `resources.css` начинаются с `.resources` или `.resource-`; `git diff --name-only ca7d3e0 -- src` не выходит за `src/components/resources/`.

**Не проверено:** визуальный smoke в браузере (раскладка на 1440px и 390px, дрейф частиц, плавность раскрытия панели, поведение при `prefers-reduced-motion: reduce` в DevTools, реальный скролл по `#resources-materials`). Браузерный инструмент этому агенту недоступен; проверка остаётся за оркестратором или фазой 5.

## Known Stubs

| Место | Файл | Почему |
|-------|------|--------|
| Панель «Музыка» показывает заглушку вместо плеера | `src/components/resources/MusicPlaceholder.tsx` | Официальной песни «Единого голоса 27» ещё нет; честная заглушка описана в 04-CONTEXT и копирайт-контракте UI-SPEC. Плеер отложен в v2 (PROD-04). |

Ссылки, видео и материалы работают на реальных данных, замоканных заглушек в них нет.

## Threat Flags

Новых поверхностей за пределами `<threat_model>` плана не появилось. Митигации на месте: `T-04-13` (строгое сравнение хэша с литералом, значение не парсится и не попадает в DOM), `T-04-14` (`rel="noopener noreferrer"` на пяти ссылках, проверяется тестом), `T-04-16` (вложенных интерактивов внутри карточек нет, `aria-controls` указывает на постоянную обёртку), `T-04-17` (только JSX-интерполяция), `T-04-18` (анимируются только `transform` и `opacity`, выключаются при reduced motion).

## Next Phase Readiness

- RES-01 … RES-04 закрыты, секция готова к reveal-анимациям фазы 5.
- Фазе 5 остаётся поднять `--color-unity-200: #8f9dd6` из `resources.css` в `tokens.css` `@theme` и свести `VideoFacade` с `VideoEmbed` фазы 3.
- Блокер для мерджа: два файла тестов заглушек (см. «Issues Encountered»).

---
*Phase: 04-news-resources-quote*
*Completed: 2026-09-05*

## Self-Check: PASSED

Все семь файлов из `key-files` лежат на диске, все три хэша коммитов задач находятся в `git log`.
