# Phase 11: Ресурсы: сетка, карточки, панели — Context

**Gathered:** 2026-09-06
**Status:** Ready for planning
**Source:** правки пользователя (пункт 5: блок «Всё, что нужно для старта» другой, изучить размеры и анимации, при клике — если у ЕАД нет аналога, вставить английские материалы оригинала) + спецификация v1.1, раздел 5; правила оригинала `#ov-resources*` и `#ov-resources-panels*` в `docs/research/v1.1/orig-rules.css`, переменные в `orig-vars.txt`, разметка панелей `dom-ov-resources-panels.html`, скриншоты `orig-resources.jpeg`, `orig-panel-music.jpeg`, `orig-panel-materials.jpeg`

<domain>
## Phase Boundary

Секция ресурсов целиком: сетка, карточки, полноэкранные панели, данные файлов. Не трогать `global.css`, `primitives.css`, `Header.css`, `VideoEmbed.tsx` (вызывать с текущим API `size="compact"`).
</domain>

<decisions>
## Implementation Decisions

### Сетка и карточки
- Значения сетки, пропорций, отступов и карточек — в спецификации RES-01/RES-02 дословно (сетка `320fr/528fr/272fr`, aspect-ratio блоков, `justify-self`, `align-self`, gap 16). Текущие Tailwind-классы сетки в `Resources.tsx` заменить на классы из `resources.css`.
- Карточка: `ResourceCard` получает класс `glass-resource` (утилиту создаёт фаза 7 в `global.css`; до слияния класс просто не имеет правил и карточка остаётся на текущем стекле — это ожидаемо) и убирает собственный фон из `resources.css`. Структура: индикатор (label + точка 16px), контент внизу (`margin-top: auto`), действие с подчёркиванием. Кнопка-слой на всю карточку сохраняется (доступность как сейчас).
- Reveal-каскад карточек сохраняется.

### Панели
- Архитектура оригинала: один fixed-контейнер `#resources-panels` (`z-index: 10000`, выше шапки `z 40/42`), внутри слои `::before`/`::after` и три панели; активная панель `display: block`. Тайминги, easing и фоны — в RES-03. Классы состояний `is-opening` / `is-open` / `is-closing` управляются React-состоянием и `transitionend` (или таймером на длительность как fallback).
- Scroll lock: класс `resources-panel-locked` на `document.documentElement` и `body` с правилом `overflow: hidden` в `resources.css`, либо существующий `src/lib/scrollLock.ts`, если он есть и подходит без правок.
- Доступность: панель `role="dialog" aria-modal="true" aria-labelledby`; фокус на кнопку «Назад» после открытия; `Escape` закрывает; Tab не выходит за пределы панели (простая ловушка фокуса); после закрытия фокус возвращается на карточку. `inert` на остальном документе не обязателен.
- Deep link `#resources-materials` и делегированный клик по `a[href="#resources-materials"]` (карточка триптиха) открывают панель материалов, как сейчас; `hashchange` не ломать.
- Reduced motion: слои и панель без переходов (сразу конечное состояние).

### Данные
- Новый `src/data/resourceFiles.ts`: типы `ResourceFile { id, name, type: "pdf"|"zip"|"mov"|"pptx"|"png"|"mp4"|"docx"|"web", href, action: "download"|"open" }` и `ResourceGroup { id, title, files, open? }`; наборы `musicFiles`, `materialGroups` (ЕАД, English, Spanish, Portuguese, French), `videoFiles` (Video backgrounds). Все адреса — из спецификации RES-05 дословно. `materials.ts` можно оставить источником для группы ЕАД (переиспользовать), английскую папку SharePoint перенести в группу English.
- Тексты панелей (`copy.resources.ts`): заголовки «Музыка» / «Материалы» / «Видео», описания из RES-05, кнопки «Назад», «Скачать», «Открыть», названия групп «Материалы ЕАД (на русском)», «English resources», «Spanish resources», «Portuguese resources», «French resources». Названия файлов оригинала оставить на языке оригинала.
- «Видео»: `VideoGrid` (16 роликов, `grid-cols-2 md:grid-cols-3 lg:grid-cols-4`) и под ним карточка файла «Video backgrounds».
- `MusicPlaceholder.tsx` удалить вместе с тестами и текстами `music.emptyTitle/emptyBody`.

### Claude's Discretion
- Разбиение на компоненты (`ResourcePanels`, `FileCard`, `FileGroup`), способ ловушки фокуса, тестовые утилиты для `transitionend`.
</decisions>

## Canonical References

- `docs/superpowers/specs/2026-09-06-design-fixes-v1.1-design.md` — спецификация с точными значениями CSS оригинала (раздел 5 (RES)); при расхождении с любым другим документом побеждает спецификация
- `.planning/ROADMAP.md` — фаза 11: критерии успеха, список файлов во владении, правила параллельной работы (фазы 7–12 идут одновременно в разных worktree от одного `main`)
- `docs/research/v1.1/orig-rules.css` и `orig-vars.txt` — правила и переменные оригинала; `dom-*.html` — разметка; скриншоты `orig-*.jpeg`
- `docs/qa/SMOKE.md` — как принимались прошлые фазы (Playwright на 1440×900 и 390×844)

## Правила фазы

- Редактировать только файлы из списка **Files** фазы 11 в ROADMAP.md. Чужие файлы не трогать даже ради одной строки; правило для чужого селектора класть в свой CSS-файл.
- Цвета в CSS писать литералами `rgb(r g b / a)` из спецификации: токены `--color-midnight-*` проекта сдвинуты на шаг относительно палитры оригинала.
- Тесты в той же фазе, что и код; `npm test` по затронутым файлам зелёный до завершения плана; `npx tsc -b` и `npm run lint` без ошибок.
- Весь пользовательский текст на русском, идентификаторы на английском. Комментарии в коде на русском, как в проекте.
- Reduced motion: любые новые анимации гаснут при `prefers-reduced-motion: reduce` через единый блок в своём CSS (`@media (prefers-reduced-motion: reduce)`).

## Deferred Ideas

- Всё из бэклога v2 (`.planning/PROJECT.md`, «Key context») остаётся вне фазы.
