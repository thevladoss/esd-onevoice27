---
phase: 11-resources-panels
plan: 03
subsystem: ui
tags: [resources, portal, dialog, focus-trap, scroll-lock, css-transitions, vitest]

# Dependency graph
requires:
  - phase: 11-resources-panels
    provides: "11-01 — resourceFiles.ts, тексты панелей и групп; 11-02 — сетка секции и карточки с data-kind"
  - phase: 04-resources
    provides: VideoGrid с шестнадцатью фасадами роликов
  - phase: 05-sections
    provides: слои атмосферы и частиц секции ресурсов
provides:
  - Полноэкранный хост ResourcePanel порталом в body с фазами closed/opening/open/closing
  - Шторка оригинала: два цветных слоя за 620ms со сдвигом 90ms, панель с задержкой 180ms
  - Модальная доступность панели: scroll lock классом, фокус на «Назад», Escape, ловушка Tab
  - Карточка файла FileCard и языковая группа FileGroup с бейджами форматов
  - Три наполненные панели вместо заглушки: музыка, материалы, видео
affects: [12-footer, 13-merge-accept, визуальный smoke фазы 11]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Модальные слои уходят порталом в document.body: секция с isolate не пускает z-index выше шапки"
    - "Фазы CSS-перехода живут в React-состоянии, выход из закрытия ловит transitionend со страховочным таймером"
    - "Производное состояние от пропа считается в рендере, а не в эффекте: кадр с пустым контейнером не проскакивает"
    - "Блокировка прокрутки — класс на html и body, без фиксации body и восстановления позиции"

key-files:
  created:
    - src/components/resources/FileCard.tsx
    - src/components/resources/FileGroup.tsx
    - src/components/resources/ResourcePanel.test.tsx
  modified:
    - src/components/resources/ResourcePanel.tsx
    - src/components/resources/Resources.tsx
    - src/components/resources/resources.css
    - src/components/resources/Resources.test.tsx
    - src/data/copy.resources.ts
    - src/data/materials.ts
    - src/data/resourceFiles.test.ts
  deleted:
    - src/components/resources/MusicPlaceholder.tsx
    - src/components/resources/MaterialsList.tsx

key-decisions:
  - "Панель рендерится порталом в document.body: секция ресурсов стоит с isolate, и внутри неё никакой z-index не поднимает панель над шапкой (z 40) и бургером (z 42) — Header.css править не пришлось"
  - "Фаза opening живёт ровно один кадр requestAnimationFrame с принудительным чтением offsetWidth: без этого браузер складывает is-opening и is-open в один кадр и слои появляются без въезда"
  - "Выход из фазы closing ловит transitionend верхнего слоя с фильтром по pseudoElement и propertyName, страховочный таймер 900ms снимает панель, когда события нет (свёрнутая вкладка, погашенные переходы)"
  - "Блокировка прокрутки — класс resources-panel-locked, а не lib/scrollLock.ts: тот фиксирует body и при снятии возвращает страницу на сохранённую позицию, что сбило бы вход по #resources-materials"
  - "Ловушка Tab отфильтровывает содержимое свёрнутых <details>: jsdom не прячет его от дерева доступности, и без фильтра фокус уезжал бы в невидимые ссылки"

patterns-established:
  - "Контейнер шторки несёт ровно один класс состояния is-opening / is-open / is-closing"
  - "Стрелка кнопки файла рисуется в CSS через ::after, чтобы символ не попадал в имя ссылки"

requirements-completed: [RES-03, RES-04, RES-06]

# Metrics
duration: 14 min
completed: 2026-09-06
---

# Phase 11 Plan 03: Полноэкранные панели ресурсов Summary

**Панель ресурсов уехала порталом в `document.body`: два цветных слоя въезжают справа за 620ms со сдвигом 90ms, содержимое проявляется с задержкой 180ms, страница под панелью заблокирована, фокус заперт внутри диалога, а три панели наполнены реальными файлами вместо заглушки.**

## Performance

- **Duration:** 14 min
- **Started:** 2026-09-06T08:33:00Z
- **Completed:** 2026-09-06T08:47:00Z
- **Tasks:** 3
- **Files modified:** 12 (3 создано, 7 изменено, 2 удалено)

## Accomplishments

- `ResourcePanel` переписан из блока под сеткой в полноэкранный хост: `createPortal` в `document.body`, контейнер `position: fixed; inset: 0; z-index: 10000`, слои `::before` `rgb(132 53 127)` и `::after` `rgb(59 77 161)` с таймингами оригинала, панель с фоном `rgb(18 12 52 / .985)` и двумя радиальными пятнами.
- Фазы шторки живут в React-состоянии: `opening` держится один кадр `requestAnimationFrame`, `open` включает конечное положение слоёв, `closing` завершается по `transitionend` верхнего слоя или страховочным таймером 900ms.
- Модальная доступность: класс `resources-panel-locked` на `html` и `body`, фокус на кнопке «Назад» при открытии, `Escape` на документе только в открытых фазах, ловушка `Tab` по обоим направлениям, возврат фокуса на карточку остался за секцией.
- `FileCard` и `FileGroup` собирают внутренности панели по RES-04: сетка `repeat(auto-fill, minmax(min(100%, 17.5rem), 1fr))`, карточка с бейджем формата и кнопкой «Скачать»/«Открыть», языковые группы `<details>` с поворачивающимся шевроном.
- Три панели наполнены из `resourceFiles.ts`: «Музыка» — три файла оригинала, «Материалы» — раскрытая группа ЕАД (DOCX + три WEB) и четыре языковые группы, «Видео» — шестнадцать фасадов `VideoGrid` и архив «Video backgrounds».
- Легаси снято целиком: `MusicPlaceholder.tsx` и `MaterialsList.tsx` удалены, из `copy.resources.ts` ушли `panel.close/closeLabel` и блок `music`, из `materials.ts` — объединяющий экспорт `materials`.
- Deep link `#resources-materials`, делегированный клик по ссылке триптиха, класс секции `is-*-active`, атмосфера с `data-kind` и слой частиц остались нетронутыми.

## Task Commits

1. **Task 1: Компоненты FileCard и FileGroup, CSS панелей, слоёв и scroll lock** — `df185dd` (feat)
2. **Task 2: Хост ResourcePanel с порталом, фазами, фокусом и Escape; подключение в Resources.tsx** — `beb92f0` (feat)
3. **Task 3: Удаление легаси, тесты ResourcePanel.test.tsx и обновление Resources.test.tsx** — `3f45e99` (test)

## Files Created/Modified

- `src/components/resources/FileCard.tsx` — карточка файла: название с `id`, бейдж `data-file-type`, ссылка с `data-action`, `target="_blank" rel="noopener noreferrer"` и именем «Скачать: <файл>» / «Открыть: <файл>»
- `src/components/resources/FileGroup.tsx` — `details#resources-group-<id>` с `summary`, шевроном-svg и сеткой `ul.resources-files`
- `src/components/resources/ResourcePanel.tsx` — хост панелей: состояние `{ tracked, kind, phase }`, четыре эффекта (кадр открытия, завершение закрытия, блокировка прокрутки, фокус), слушатель `Escape` на документе, ловушка `Tab` и рендер трёх наполнений
- `src/components/resources/Resources.tsx` — снят `panelRef` с эффектом фокуса и обёртка `.resources-panel-wrap`, добавлен `<ResourcePanel active={active} onClose={close} />` рядом с содержимым секции
- `src/components/resources/resources.css` — удалены `.resources-panel-wrap` и старый фон панели, добавлены правила `.resources-panels*`, `.resources-panel*`, `.resources-files`, `.resources-file*`, `.resources-group*` и блокировка прокрутки; медиа-блоки `48rem` (padding карточки файла) и `64rem` (размер заголовка группы)
- `src/components/resources/ResourcePanel.test.tsx` — 10 сценариев: содержимое трёх панелей, фазы `is-opening` → `is-open`, закрытие по таймеру и по `transitionend`, reduced motion, `Escape`, ловушка `Tab`, клик по «Назад»
- `src/components/resources/Resources.test.tsx` — хелперы переведены с `role="region"` на `role="dialog"`, добавлены `panelsContainer()` и сценарий блокировки прокрутки, ссылки материалов считаются внутри `#resources-group-esd`
- `src/data/copy.resources.ts` — из типа и объекта убраны `panel.close`, `panel.closeLabel` и блок `music`
- `src/data/materials.ts` — снят экспорт `materials`, остались `MaterialKind`, `MaterialItem`, `esdMaterials`, `englishFolder`
- `src/data/resourceFiles.test.ts` — снят импорт удалённого `materials` и его проверка длины

## Decisions Made

- Хост держит `kind` отдельно от пропа `active`: во время закрытия панель продолжает показывать своё содержимое, а при открытом диалоге смена `active` (клик по другой карточке, `hashchange`) меняет наполнение на месте, без повторного въезда шторки.
- Слушатель `Escape` висит на `document`, а не на диалоге: фокус может стоять на любом узле панели, а `keydown` от портала до секции в React-дереве не доходит.
- Кнопка «Назад» отдаёт закрытие наружу через `onClose`, возврат фокуса на карточку остался в `Resources.close()`: хост не знает, какая карточка его открыла.
- Медиа-блоки панели вынесены в конец файла: `padding: 22px 24px` карточки файла и увеличенный заголовок группы должны побеждать базовые значения при равной специфичности.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 — Blocking] `src/data/resourceFiles.test.ts` импортировал удалённый экспорт `materials`**

- **Found during:** Task 3 (удаление легаси)
- **Issue:** файла нет в `files_modified` плана, но он импортирует `materials` из `materials.ts` и проверяет `expect(materials).toHaveLength(5)`. После снятия экспорта `npx tsc -b` и весь набор тестов падали бы на этом импорте.
- **Fix:** убран импорт `materials` и одна строка проверки; остальные проверки сценария («materials разделён на материалы ЕАД и папку SharePoint») сохранены — состав `esdMaterials` и `englishFolder` проверяется как раньше.
- **Files modified:** `src/data/resourceFiles.test.ts`
- **Verification:** `npx tsc -b` без ошибок, `npx vitest run src/data` зелёный (2 файла, 24 теста)
- **Committed in:** `3f45e99`

---

**Total deviations:** 1 (1 blocking, исправлено автоматически)
**Impact on plan:** нулевой. Правка на две строки в тесте данных, который во владении фазы 11; поведение и состав данных не менялись.

## Assumption Drift (advisory)

**1. Фокус на «Назад» ставится и при повторном открытии из фазы `closing`**

- **Found during:** Task 2
- **Planned:** план описывает постановку фокуса «при переходе из `closed` в `opening`/`open`».
- **Actual:** условие расширено до «предыдущая фаза `closed` или `closing`».
- **Why:** сценарий из плана «клик по ссылке триптиха, пока панель уезжает» разворачивает панель обратно из `closing`. По букве плана фокус в этом случае оставался бы на ссылке снаружи портала, ловушка `Tab` не сработала бы, и клавиатура ушла бы гулять по странице под панелью.

**2. При reduced motion закрытие сразу обнуляет `kind`**

- **Found during:** Task 2
- **Planned:** «`active` null и `phase` `opening`/`open`: `phase = reduced ? "closed" : "closing"`, `kind` сохранить».
- **Actual:** ветка reduced возвращает то же состояние, что и завершение закрытия: `{ tracked: null, kind: null, phase: "closed" }`.
- **Why:** в фазе `closed` рендер возвращает `null` при любом `kind`, поэтому видимой разницы нет, а инвариант «`closed` ⇒ `kind` пуст» держится одним значением на оба пути выхода.

## Issues Encountered

None.

## User Setup Required

None — внешние сервисы не настраиваются, все адреса публичные.

## Verification Results

Все команды выполнены в worktree `/Users/thevladoss/devs/web/esd_cringe-wt/11-03`, вывод наблюдался:

- `npx tsc -b` — без ошибок (после каждой задачи).
- `npm run lint` — без ошибок, `eslint-disable` в коде нет. Правило `react-hooks/set-state-in-render` производное состояние хоста не пометило, обходной путь через `queueMicrotask` не понадобился.
- `npx vitest run src/components/resources src/data src/styles/motionPolicy.test.ts src/components/involve` — 8 файлов, 83 теста, зелёные.
- `npx vitest run src/components/resources/ResourcePanel.test.tsx` — 10 сценариев, зелёные.
- `npx vitest run` (весь набор) — 48 файлов, 457 тестов, зелёные.
- `npm run build` — `tsc -b && vite build`, 791 модуль, CSS 99.95 kB (gzip 20.94), сборка за 206ms.
- Автопроверка Task 1: все 24 строки спецификации найдены в `resources.css`; `resources-panel-wrap`, `prefers-reduced-motion`, `var(--color-` и `outline: none` отсутствуют; блоки `.resources`, `.resources-atmosphere*`, `.resources-particles`, `.resources-grid`, `.resources-cell*`, `.resource-card*` из 11-02 на месте.
- `grep -rnE "MusicPlaceholder|MaterialsList|emptyTitle|closeLabel" src` — совпадений в ресурсах нет (остались только `newsCopy.emptyTitle` и его чтение в `News.tsx`, к панелям отношения не имеющие).
- `git status` — рабочее дерево чистое, кроме несвязанного симлинка `node_modules`, он не стадился.

**Не проверялось:** визуальный smoke из блока `<verification>` плана (въезд слоёв на 1440×900, шапка под панелью, `#resources-materials` в браузере, `emulateMedia({ reducedMotion: "reduce" })`). `vite preview` и `dev` в этом worktree запускать запрещено заданием — проверка остаётся за приёмкой фазы 11 после слияния.

## Known Stubs

None — все три панели наполнены реальными адресами из `resourceFiles.ts`, заглушка «Песня ещё в работе» удалена вместе с текстами.

## Threat Flags

Новых поверхностей вне `<threat_model>` плана не появилось. Диспозиции реестра закрыты так:

- **T-11-05** (deep link): эффект хэша и делегированный клик перенесены дословно, `MATERIALS_HASH` остался модульной константой.
- **T-11-06** (внешние ссылки): `target="_blank" rel="noopener noreferrer"` стоит в одной строке JSX в `FileCard.tsx`, тест `motionPolicy` эту пару стережёт.
- **T-11-07** (scroll lock): класс снимается в cleanup эффекта при любом размонтировании, страховочный таймер 900ms гарантирует выход из `closing` без `transitionend` — оба пути покрыты сценариями теста.

## Next Phase Readiness

- Фаза 11 закрыта по коду: планы 11-01, 11-02 и 11-03 выполнены, RES-01…RES-06 реализованы.
- Для приёмки после слияния нужен визуальный smoke по `docs/qa/SMOKE.md` на 1440×900 и 390×844: въезд слоёв, шапка под панелью, deep link, reduced motion.
- Блокеров нет.

---

_Phase: 11-resources-panels_
_Completed: 2026-09-06_

## Self-Check: PASSED

Три созданных файла (`FileCard.tsx`, `FileGroup.tsx`, `ResourcePanel.test.tsx`) на диске, `MusicPlaceholder.tsx` и `MaterialsList.tsx` удалены, коммиты `df185dd`, `beb92f0`, `3f45e99` в истории ветки `agent-11-03`. `git diff --name-status 80d70c8..HEAD` возвращает ровно 12 путей плана: за пределы владения правки не вышли, `STATE.md` и `ROADMAP.md` не тронуты.
