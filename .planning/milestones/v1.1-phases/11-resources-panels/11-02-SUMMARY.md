---
phase: 11-resources-panels
plan: 02
subsystem: ui
tags: [css-grid, tailwind, react, vitest, testing-library, aspect-ratio]

# Dependency graph
requires:
  - phase: 05-sections
    provides: секция ресурсов, обёртки Reveal/RevealGroup/RevealItem, слои атмосферы и частиц
  - phase: 07-glass
    provides: утилита glass-resource в global.css (класс уже висит на карточке)
provides:
  - сетка секции ресурсов 320fr / 528fr / 272fr с 64rem и колонка по центру ниже
  - пропорции блоков оригинала: текст 528×523, музыка 320×296, материалы 272×336, видео 368×256
  - разметка карточки: индикатор с точкой 16px, контент внизу, действие с подчёркиванием
  - ховер и фокус карточки: рамка акцента, подъём на 4px, подчёркивание scaleX(.34) → scaleX(1) за 420ms
affects: [11-03 панели ресурсов, 07 стеклянные поверхности, визуальный smoke фазы 11]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - размеры ячеек сетки лежат на обёртке RevealItem, а не на карточке
    - поверхность карточки отдана утилитам glass + glass-resource, в CSS секции своего фона нет
    - значения CSS проверяются чтением файла с диска через readFileSync

key-files:
  created: []
  modified:
    - src/components/resources/resources.css
    - src/components/resources/Resources.tsx
    - src/components/resources/ResourceCard.tsx
    - src/components/resources/Resources.test.tsx

key-decisions:
  - "Размеры и grid-area висят на .resources-cell (обёртка RevealItem): прямой ребёнок грида — именно она, до карточки правила иначе не дойдут"
  - "Ховер и фокус карточки собраны в одно правило с [data-open=true]: рамку акцента даёт то же состояние, что и раскрытая панель"
  - "Порядок в DOM оставлен copy → music → materials → video: он же порядок колонки до 64rem, на широком экране блоки расставляет grid-area"

patterns-established:
  - "Контракт значений CSS: тест читает resources.css с диска и сверяет строки спецификации, потому что vitest настроен с css: false"
  - "Собственный фон компонента запрещён тестом-регуляркой, чтобы утилита стекла не перекрывалась правилом файла"

requirements-completed: [RES-01, RES-02]

# Metrics
duration: 9 min
completed: 2026-09-06
---

# Phase 11 Plan 02: Сетка и карточки ресурсов Summary

**Секция «Всё, что нужно для старта» встала на сетку оригинала 320fr / 528fr / 272fr с пропорциями блоков и карточкой с индикатором, контентом внизу и подчёркиванием действия.**

## Performance

- **Duration:** 9 min
- **Started:** 2026-09-06T08:18:40Z
- **Completed:** 2026-09-06T08:28:30Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments

- Сетка секции повторяет оригинал: с 64rem три дорожки `minmax(0, 320fr) minmax(0, 528fr) minmax(0, 272fr)`, две строки, gap 16px; текст в центре с пунктирной рамкой, музыка слева, материалы прижаты к низу первой строки, видео во второй строке шириной `min(69.697%, 368px)`.
- До 64rem блоки идут колонкой по центру: текст первым с отступом 28px снизу, карточки `min(100%, 328px) × 248px` с gap 24px.
- Карточка размечена по RES-02: строка индикатора с подписью и точкой 16px цвета акцента, контент прижат к низу через `margin-top: auto`, действие с подчёркиванием `scaleX(.34)`, на ховер и фокус подчёркивание раскрывается, карточка поднимается на 4px и берёт рамку акцента за 420ms.
- Поверхность карточки ушла в утилиты `glass` и `glass-resource`: собственный градиент и `backdrop-filter` из `resources.css` удалены, тест не даёт вернуть их обратно.
- Reveal-каскад, слои атмосферы и частиц с `data-anim`, доступность карточки (overlay-кнопка с `aria-expanded`, `aria-labelledby`, `aria-controls`) остались нетронутыми.

## Task Commits

1. **Task 1: Правила сетки, ячеек и карточки в resources.css** — `bec69b2` (feat)
2. **Task 2: Разметка сетки в Resources.tsx и карточки в ResourceCard.tsx** — `466de3a` (feat)
3. **Task 3: Тесты сетки, карточки и значений CSS** — `a2f9f91` (test)

## Files Created/Modified

- `src/components/resources/resources.css` — добавлены `.resources-content`, `.resources-grid`, `.resources-copy`, `.resources-cell*`, полный набор правил `.resource-card*` и медиа-блок `@media (min-width: 64rem)`; удалён блок фона карточки и старое подчёркивание `::after`. Блоки подложки, атмосферы, частиц и панели не тронуты.
- `src/components/resources/Resources.tsx` — Tailwind-сетка заменена на классы секции: `resources-content`, `resources-grid`, `resources-copy`, `resources-cell--music|materials|video`; убраны служебные отступы `mt-2` и `mt-4` внутри текстового блока (их даёт `gap: 10px`).
- `src/components/resources/ResourceCard.tsx` — корень получил `resource-card glass glass-resource` и `data-kind`; разметка перестроена на `indicator → content (title, description, actions → trigger)`; поведенческие Tailwind-классы сняты, overlay-кнопка не изменилась.
- `src/components/resources/Resources.test.tsx` — новый describe «сетка и карточки по оригиналу»: пять сценариев (порядок блоков, разметка карточки и `--accent`, значения CSS, правила ховера и фокуса, запрет собственного фона и блока reduce).

## Verification

Все команды прогнаны в worktree, вывод наблюдался:

- `npx vitest run src/components/resources/Resources.test.tsx src/styles/motionPolicy.test.ts` → 2 файла, 38 тестов пройдено (25 в Resources, 13 в motionPolicy).
- `npx tsc -b` → без ошибок.
- `npm run lint` → без ошибок.
- `npx vitest run src/App.test.tsx` → 14 тестов пройдено (проверка, что смена классов секции не задела сборку страницы).
- Автопроверка Task 1: все 16 строк спецификации найдены в `resources.css`; `awk` подтвердил, что блок `.resource-card {` без `background`; `prefers-reduced-motion`, `var(--color-` и `outline` в файле отсутствуют.
- Визуальный smoke на 1440 и 390 не запускался: по заданию `npm run build` и `preview` в этом worktree не гоняем.

## Decisions Made

- Размеры и `grid-area` живут на `.resources-cell`, а не на `.resource-card`: прямой ребёнок сетки — обёртка `RevealItem`, и правила на карточке до раскладки бы не дошли.
- Ховер, `:has(:focus-visible)` и `[data-open="true"]` собраны в одно правило: у всех трёх состояний одинаковый результат — рамка акцента и подъём на 4px.
- Медиа-блок `@media (min-width: 64rem)` вынесен в конец набора правил секции, чтобы `padding: 20px` карточки и `margin-top: 4px` действия побеждали базовые значения при равной специфичности.

## Deviations from Plan

None — план выполнен ровно так, как написан.

## Assumption Drift (advisory)

**1. Обёртка старой панели центрируется вместе с колонкой**

- **Found during:** Task 2
- **Planned:** план описывает `.resources-content` как flex-колонку с `align-items: center` и отдельно требует не трогать старую обёртку `.resources-panel-wrap` (её переписывает 11-03).
- **Actual:** из-за `align-items: center` обёртка панели стала flex-элементом по ширине содержимого, а не во всю ширину секции, как было при блочном контейнере.
- **Why:** оба указания плана выполнены дословно; ширину обёртки план не оговаривает, потому что 11-03 заменяет её на полноэкранный контейнер `position: fixed`.

Ничего не блокирует: тесты и доступность панели не зависят от её ширины, а сам узел исчезает в 11-03.

## Issues Encountered

Нет. Заметка для 11-03: пока старая обёртка `.resources-panel-wrap` жива, раскрытая панель внутри `.resources-content` сжимается по содержимому — после перехода на полноэкранные панели вопрос снимается.

## User Setup Required

None — внешние сервисы не настраиваются.

## Next Phase Readiness

- Секция готова к 11-03: сетка и карточки не зависят от внутренностей панели, `data-kind` на карточке даёт панели точку привязки.
- Класс `glass-resource` висит на карточке без правил, пока фаза 7 не сольёт утилиту в `global.css`; до слияния карточка остаётся на текущем стекле `glass` — это ожидаемое поведение из 11-CONTEXT.md.
- Акценты карточек приходят из `copy.resources.ts`: после плана 11-01 в `--accent` встанут литералы `rgb(...)` вместо токенов, тест сверяет значение с данными и переживёт замену.

## Self-Check: PASSED

Четыре файла из `files_modified` на диске, коммиты `bec69b2`, `466de3a`, `a2f9f91`, `77d1e1e` в истории ветки `agent-11-02`. `git diff 4acb38b..HEAD --name-only` возвращает ровно эти четыре файла и SUMMARY: за пределы владения плана правки не вышли, `STATE.md` и `ROADMAP.md` не тронуты.

---

_Phase: 11-resources-panels_
_Completed: 2026-09-06_
