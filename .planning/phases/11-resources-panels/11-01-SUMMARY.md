---
phase: 11-resources-panels
plan: 01
subsystem: ui
tags: [resources, data, copy, typescript, vitest]

# Dependency graph
requires:
  - phase: 04-resources
    provides: секция ресурсов, materials.ts, videos.ts, copy.resources.ts
provides:
  - Модуль src/data/resourceFiles.ts со всеми адресами файлов RES-05 (музыка, пять языковых групп, видеофоны)
  - Разделение materials.ts на esdMaterials (четыре позиции ЕАД) и englishFolder (папка SharePoint)
  - Тексты панелей, кнопок и языковых групп в copy.resources.ts, акценты карточек литералами rgb()
  - Тест данных ресурсов рядом с модулем, VideoGrid.test.tsx очищен от data-сценариев
affects: [11-02, 11-03, 13-merge-accept]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Адреса внешних файлов живут в src/data/, компоненты получают их через типизированные наборы"
    - "Цвета из спецификации пишутся литералами rgb(r g b) в данных и CSS, а не токенами проекта"
    - "Data-сценарии лежат рядом с модулем данных (src/data/*.test.ts), тесты компонентов проверяют только рендер"

key-files:
  created:
    - src/data/resourceFiles.ts
    - src/data/resourceFiles.test.ts
  modified:
    - src/data/copy.resources.ts
    - src/data/materials.ts
    - src/components/resources/VideoGrid.test.tsx

key-decisions:
  - "Группа esd собирается функцией materialToFile из esdMaterials: адреса дивизиона остаются в одном месте, DOCX уходит на скачивание, страницы esd.onevoice27.org получают бейдж WEB и кнопку «Открыть»"
  - "Базовый адрес хранилища вынесен в модульную константу HOPE, SharePoint-ссылки записаны целиком: они с query-строками и не складываются из частей"
  - "Экспорт materials сохранён как [...esdMaterials, englishFolder]: старые MaterialsList и Resources.test компилируются и остаются зелёными до плана 11-03"
  - "Акценты карточек и тексты панелей взяты из спецификации посимвольно, названия файлов оригинала не переведены"

patterns-established:
  - "ResourceFile { id, name, type, href, action } — единый контракт карточки файла для планов 11-02 и 11-03"
  - "Заголовок языковой группы берётся из resourcesCopy.groups[id], в resourceFiles.ts текстов нет"

requirements-completed: [RES-05]

# Metrics
duration: 7 min
completed: 2026-09-06
---

# Phase 11 Plan 01: Данные и тексты панелей ресурсов Summary

**Все адреса RES-05 переехали в типизированный `src/data/resourceFiles.ts`: три файла музыки, пять языковых групп (30 файлов суммарно, группа ЕАД собирается из `esdMaterials`) и архив видеофонов; `copy.resources.ts` отдаёт заголовки панелей, кнопки «Назад/Скачать/Открыть» и акценты литералами `rgb()`.**

## Performance

- **Duration:** 7 min
- **Started:** 2026-09-06T08:19:00Z
- **Completed:** 2026-09-06T08:26:00Z
- **Tasks:** 3
- **Files modified:** 5 (2 создано, 3 изменено)

## Accomplishments

- `resourceFiles.ts` содержит 23 адреса спецификации дословно: сверка extraction-диффом со спекой показала полное совпадение, лишних и потерянных файлов нет
- `materialGroups` собраны в порядке оригинала `esd, en, es, pt, fr` (4/7/5/5/5 файлов), раскрыта только группа ЕАД; English замыкается папкой SharePoint из `englishFolder`
- `copy.resources.ts` расширен блоками `panels` (тексты RES-05) и `groups` (названия пяти групп), акценты карточек переписаны с токенов на литералы `rgb(143 157 214)`, `rgb(123 194 199)`, `rgb(210 142 190)`
- `materials.ts` разделён без ломки потребителей: `MaterialsList` и `Resources.test.tsx` продолжают видеть пять ссылок
- Data-сценарии переехали из `VideoGrid.test.tsx` в `src/data/resourceFiles.test.ts` (10 сценариев), компонентный тест остался про рендер

## Task Commits

1. **Task 1: Тексты панелей, акценты литералами и разделение materials.ts** — `b99b384` (feat)
2. **Task 2: Модуль resourceFiles.ts с наборами файлов по RES-05** — `dcec52a` (feat)
3. **Task 3: Тест данных ресурсов и перенос data-describe из VideoGrid.test.tsx** — `4ff056b` (test)

## Files Created/Modified

- `src/data/resourceFiles.ts` — типы `ResourceFile`, `ResourceGroup`, `ResourceFileType`, `ResourceFileAction`; наборы `musicFiles`, `materialGroups`, `videoFiles`; константа `HOPE` с базовым адресом хранилища
- `src/data/resourceFiles.test.ts` — 10 сценариев: состав музыки, порядок и наполнение групп, папка SharePoint в конце English, одинаковый состав es/pt/fr, архив видеофонов, уникальность id и абсолютные адреса, плюс перенесённые проверки `videos`, `materials` и строк `resourcesCopy`
- `src/data/copy.resources.ts` — `ResourceGroupId`, блоки `panels` и `groups`, `panel.back/download/open`, акценты литералами
- `src/data/materials.ts` — `esdMaterials`, `englishFolder`, `materials` как их объединение
- `src/components/resources/VideoGrid.test.tsx` — снят describe «данные ресурсов» и импорты `materials`, `resourcesCopy`

## Decisions Made

- Формулировка ROADMAP «4 позиции с бейджем WEB» уступила спецификации: DOCX описания проекта скачивается, бейдж WEB получают три страницы ЕАД (правило CONTEXT о приоритете спецификации)
- Проверка типа файла в `materialToFile` идёт по окончанию `.docx` у href, а не по полю `kind`: `kind` описывает иконку строки, а не формат
- `as const` стоит на массивах `musicFiles`, `materialGroups`, `videoFiles`; конкатенация `HOPE + "имя"` внутри литерала ей не мешает

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 — Blocking] Автоматическая проверка Task 2 `grep -c "1787" >= 23` даёт 22**

- **Found during:** Task 2 (модуль resourceFiles.ts)
- **Issue:** порог 23 в плане посчитан по всем адресам хранилища, но один файл English-группы называется `uq31788340270047.zip` (там `1788`), а DOCX описания проекта `mGS1787822852554.docx` живёт в `materials.ts`, а не в `resourceFiles.ts`. Реальное число вхождений `1787` в новом модуле — 22
- **Fix:** данные не менялись; вместо счётчика подстроки прогнал сильную проверку — вытащил все адреса вида `XXX17…` из спецификации и из кода регуляркой и сравнил `diff`. Результат: 23 адреса спецификации присутствуют в `resourceFiles.ts` дословно, единственная разница — `mGS1787822852554.docx` из `materials.ts` на стороне кода
- **Files modified:** нет (артефакт verify-команды плана, не дефект данных)
- **Verification:** `diff` списков адресов спеки и кода: единственная строка расхождения — ожидаемый DOCX из `materials.ts`; плюс рантайм-проверка `all 30 uniq=30 https=true`
- **Committed in:** `dcec52a` (данные без изменений)

---

**Total deviations:** 1 (1 blocking, исправлен способ верификации, код плана не менялся)
**Impact on plan:** нулевой; состав данных совпадает со спецификацией, порог в verify-строке плана был занижающе неточен.

## Assumption Drift (advisory)

- **Planned:** «в панели материалов четыре позиции ЕАД с бейджем WEB» (формулировка ROADMAP)
- **Actual:** три позиции WEB + один DOCX на скачивание
- **Why:** спецификация RES-05 прямо перечисляет «описание проекта DOCX, баннеры, вопросы, заставка … страницы с бейджем WEB»; план 11-01 уже разрешил конфликт в пользу спецификации, фиксирую для читателя ROADMAP

## Issues Encountered

None.

## User Setup Required

None — внешние сервисы не настраиваются, все адреса публичные.

## Verification Results

Выполнено в worktree `/Users/thevladoss/devs/web/esd_cringe-wt/11-01`:

- `npx tsc -b` — без ошибок (после каждой задачи)
- `npm run lint` — без ошибок
- `npx vitest run src/data/resourceFiles.test.ts src/components/resources/VideoGrid.test.tsx src/components/resources/Resources.test.tsx` — 3 файла, 33 теста, зелёные
- `npx vitest run` (весь набор) — 47 файлов, 415 тестов, зелёные
- Рантайм-снимок данных: `music 3 pdf,zip,mov actions=download`, `groups esd:4:true en:7:false es:5:false pt:5:false fr:5:false`, `esd docx/download web/open web/open web/open`, `enlast web/open/true`, `video 1 zip true`, `all 30 uniq=30 https=true`
- `git status` — изменения только в пяти файлах плана (плюс несвязанный симлинк `node_modules`, он не стадился)

## Known Stubs

None — все наборы заполнены реальными адресами.

## Next Phase Readiness

- План 11-02 берёт акценты карточек из `resourcesCopy.cards.*.accent` (литералы готовы)
- План 11-03 наполняет панели из `musicFiles`, `materialGroups`, `videoFiles` и текстов `resourcesCopy.panels/groups/panel`; экспорты `materials`, `panel.close/closeLabel` и `music.emptyTitle/emptyBody` оставлены живыми специально — их снимает 11-03 вместе с `MusicPlaceholder`
- Блокеров нет

---

_Phase: 11-resources-panels_
_Completed: 2026-09-06_

## Self-Check: PASSED

Все пять файлов плана на диске, три коммита задач (`b99b384`, `dcec52a`, `4ff056b`) в истории ветки `agent-11-01`, четвёртый коммит — этот SUMMARY; `git diff` от базы показывает ровно шесть путей плана.
