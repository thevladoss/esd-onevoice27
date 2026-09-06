---
phase: 09-form-original
plan: 01
subsystem: ui
tags: [form, validation, a11y, react, copy]

requires:
  - phase: 04-form
    provides: LightForm, FormField, ConsentCheckbox, LightTypeChoice, validateLightForm
provides:
  - "Модель формы с необязательным типом (LightTypeValue) и условным полем orgName"
  - "Порядок фокуса LIGHT_FORM_FIELD_ORDER из восьми полей, начиная с группы типа"
  - "Подписи и плейсхолдеры формы по спецификации FORM-02"
  - "RequiredMark: звёздочка обязательного поля с title «Обязательно» и sr-only «обязательно»"
affects: [09-02-form-styles, 12-smoke]

tech-stack:
  added: []
  patterns:
    - "id и текст ошибки группы radio приходят от родителя, как у ConsentCheckbox"
    - "Условное поле рендерится, а не прячется: фокус и aria не ссылаются на скрытый узел"

key-files:
  created: []
  modified:
    - src/data/copy.form.ts
    - src/lib/validation.ts
    - src/lib/validation.test.ts
    - src/components/form/LightTypeChoice.tsx
    - src/components/form/LightForm.tsx
    - src/components/form/FormField.tsx
    - src/components/form/ConsentCheckbox.tsx
    - src/components/form/light-form.css
    - src/components/form/LightForm.test.tsx
    - src/components/form/LightForm.failure.test.tsx

key-decisions:
  - "Группа типа получила role=radiogroup и tabIndex -1: на роли group атрибут aria-invalid не разрешён, а фокус при ошибке должен вести на саму группу"
  - "Город перестал быть обязательным: в спецификации он идёт без звёздочки, а FORM-02 требует звёздочку у каждого обязательного поля"
  - "Поле организации исчезает из разметки при личном свете вместе со значением и ошибкой, а не прячется атрибутом hidden"

patterns-established:
  - "RequiredMark: пара «значок aria-hidden + слово sr-only» через пробел, иначе доступное имя склеивается"

requirements-completed: [FORM-01, FORM-02]

duration: 14min
completed: 2026-09-06
---

# Phase 9 Plan 1: Модель и тексты формы «Зажгите свой свет» Summary

**Форма стартует без выбранного типа, для группового маяка показывает обязательное «Название организации», а подписи и звёздочки обязательности переписаны по спецификации FORM-02.**

## Performance

- **Duration:** 14 min
- **Started:** 2026-09-06T08:13:00Z
- **Completed:** 2026-09-06T08:27:00Z
- **Tasks:** 3
- **Files modified:** 10

## Accomplishments

- `LightFormValues.type` принимает пустую строку: при загрузке ни одна карточка не выбрана, пустая отправка даёт «Выберите тип света» и уводит фокус на группу `radiogroup` с подписью «Тип света».
- Поле `orgName` живёт только при `type === "group"`: появляется с плейсхолдером «Например, община в Твери», требует минимум два символа, а возврат к личному свету уносит поле вместе со значением и ошибкой.
- Все подписи, плейсхолдеры и тексты ошибок пришли из спецификации FORM-02 дословно; город потерял обязательность вслед за отсутствием звёздочки в спецификации.
- Обязательные поля и согласие помечены звёздочкой 12px `rgb(252 165 165)` с `title="Обязательно"` и `aria-hidden`, рядом стоит sr-only «обязательно»; контролы получили `aria-required`.
- Тестов в затронутых файлах стало 60: покрыты оба состояния формы, переключение типа, порядок ошибок и доступные имена полей.

## Task Commits

1. **Task 1: Тексты FORM-02 и модель валидации с пустым типом и orgName** — `8d996fa` (feat)
2. **Task 2: Состояния формы: группа типа с id от родителя, условное поле orgName** — `7d23481` (feat)
3. **Task 3: Звёздочка обязательности с title «Обязательно» и sr-only «обязательно»** — `99c4c67` (feat)

## Files Created/Modified

- `src/data/copy.form.ts` — подписи FORM-02, блок `required`, ошибки `type` и `orgName`, ушла ошибка города
- `src/lib/validation.ts` — тип `LightTypeValue`, поле `orgName`, `LightFormField = keyof LightFormValues`, порядок фокуса из восьми полей, город без проверки
- `src/lib/validation.test.ts` — тесты пустого типа, обязательности организации только у группы, порядка фокуса и стартового состояния
- `src/components/form/LightTypeChoice.tsx` — id и ошибка приходят сверху, `role="radiogroup"`, `tabIndex={-1}`, sr-only `legend`, свой `useId` убран
- `src/components/form/LightForm.tsx` — условный рендер поля организации, смена типа через `updateField`, сужение типа перед `toLightType`, проп `required` у пяти полей
- `src/components/form/FormField.tsx` — проп `required`, `aria-required` в контракте контрола, экспорт `RequiredMark`
- `src/components/form/ConsentCheckbox.tsx` — звёздочка после текста согласия, `aria-required` на чекбоксе
- `src/components/form/light-form.css` — единственное новое правило `.lf-required` и `.lf-required svg`
- `src/components/form/LightForm.test.tsx` — тесты обоих состояний, переключения типа, порядка ошибок и пометки обязательности
- `src/components/form/LightForm.failure.test.tsx` — `fillValidForm` выбирает тип света перед отправкой

## Decisions Made

- Ошибка группы типа рисуется последним потомком `fieldset` и связывается через `aria-describedby`; роль `radiogroup` выбрана ради допустимого `aria-invalid`.
- `updateField("type", …)` дополнительно гасит ошибку `orgName` и стирает значение организации: без этого ошибка исчезнувшего поля висела бы в форме, а старое название вернулось бы при повторном выборе группы.
- Сброс после успеха остался `{ ...initialLightFormValues, type: prev.type }`: тип сохраняется, организация чистится вместе с остальными полями.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Тест «ведёт от невалидного поля к тексту ошибки» отправлял форму без выбора типа**

- **Found during:** Task 2 (состояния формы)
- **Issue:** Тест не был перечислен в списке правок плана, но после смены порядка фокуса пустая отправка уводит фокус на группу типа, а не на имя — `expect(firstName).toHaveFocus()` падал.
- **Fix:** Перед отправкой тест кликает «Личный свет», поэтому первым невалидным полем снова оказывается имя.
- **Files modified:** `src/components/form/LightForm.test.tsx`
- **Verification:** `npx vitest run src/components/form src/lib/validation.test.ts` — 60 тестов зелёные.
- **Committed in:** `7d23481` (коммит задачи 2)

### Расхождение с формулировкой критерия приёмки

**2. [Rule 3 - Blocking] Критерий `grep -c 'GlassCard' LightForm.tsx` даёт 3, а не 2**

- **Found during:** Task 2 (проверка acceptance_criteria)
- **Issue:** План ждал 2 строки (импорт и обёртка), но `GlassCard` занимает три строки: импорт, открывающий и закрывающий тег.
- **Fix:** Ничего не менял. Требование плана «обёртка остаётся до плана 09-02» выполнено; удалять `GlassCard` ради счётчика нельзя, это область плана 09-02.
- **Files modified:** нет
- **Verification:** `grep -n 'GlassCard' src/components/form/LightForm.tsx` — импорт, `<GlassCard className="lf-card">`, `</GlassCard>`.
- **Committed in:** — (правки не потребовалось)

---

**Total deviations:** 1 auto-fixed (1 bug) + 1 расхождение формулировки критерия без правок кода
**Impact on plan:** Область плана не расширялась. Правка теста вынуждена сменой порядка фокуса, которую план и предписывал.

## Assumption Drift (advisory)

**Город стал полностью необязательным полем**

- **Planned:** план задачи 1 прямо предписывает убрать проверку города, ссылаясь на спецификацию.
- **Actual:** так и сделано, но следствие шире, чем звучит в плане: посетитель теперь отправляет форму с пустым городом, а `city` остаётся в значениях и в порядке фокуса как чисто справочное поле.
- **Why:** FORM-02 требует звёздочку у каждого обязательного поля, а у города в спецификации звёздочки нет.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Разметка и поведение формы зафиксированы: план 09-02 может убирать `GlassCard`, переписывать `light-form.css` под FORM-03/FORM-04 и не трогать логику.
- `.lf-required` — единственное правило, добавленное в CSS этим планом; остальное перепишет план 09-02.
- Ручную проверку в браузере (`npm run dev`) из блока verification не выполнял: в worktree запуск дев-сервера не предусмотрен. Всё поведение закрыто компонентными тестами.

## Self-Check

- `src/lib/validation.ts`, `src/data/copy.form.ts`, `src/components/form/LightTypeChoice.tsx`, `src/components/form/FormField.tsx`, `src/components/form/LightForm.test.tsx`, `src/lib/validation.test.ts` — на диске, изменены.
- Коммиты `8d996fa`, `7d23481`, `99c4c67` в `git log` ветки `agent-09`.
- `npx tsc -b` — без ошибок; `npx vitest run src/components/form src/lib/validation.test.ts src/styles/motionPolicy.test.ts` — 5 файлов, 60 тестов зелёные; `npm run lint` — чисто.

## Self-Check: PASSED

---
*Phase: 09-form-original*
*Completed: 2026-09-06*
