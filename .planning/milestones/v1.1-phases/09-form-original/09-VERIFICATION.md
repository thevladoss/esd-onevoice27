---
phase: 09-form-original
verified: 2026-09-06T12:00:00Z
status: passed
score: 5/5 must-haves verified
has_blocking_gaps: false
overrides_applied: 2
overrides:
  - must_have: "Город обязателен"
    reason: "Спецификация раздела 3 (FORM) отмечает звёздочкой только обязательные поля; у «Города» звёздочки нет, поэтому проверка обязательности снята умышленно (задокументировано в 09-01-SUMMARY.md, Assumption Drift). Условие принято до верификации: инструкция верификатора называет это принятым отклонением."
    accepted_by: "orchestrator (verification_context инструкции)"
    accepted_at: "2026-09-06T00:00:00Z"
  - must_have: "outline: none на .lf-control:focus, .lf-checkbox:focus, .lf-type:focus-within как в оригинале"
    reason: "src/styles/motionPolicy.test.ts требует единственное разрешённое место, где гасится клавиатурная обводка (main:focus после ссылки пропуска); light-form.css оставляет глобальный :focus-visible поверх рамки/кольца/тени, которые в остальном совпадают со спецификацией дословно. Задокументировано в 09-02-SUMMARY.md как принятое отклонение (Rule 3 - Blocking)."
    accepted_by: "orchestrator (verification_context инструкции)"
    accepted_at: "2026-09-06T00:00:00Z"
re_verification: null
---

# Phase 9: Форма как в оригинале Verification Report

**Phase Goal:** Посетитель заполняет форму «Зажгите свой свет» без карточки-обёртки, сам выбирает тип света, для группового маяка указывает организацию и видит понятные русские подписи и поля оригинала
**Verified:** 2026-09-06T12:00:00Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (Success Criteria из ROADMAP.md)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Форма стоит на секции без стеклянной карточки-обёртки; при старте тип света не выбран, отправка без выбора показывает «Выберите тип света» | ✓ VERIFIED | `LightForm.tsx` не импортирует `GlassCard` (`grep -c GlassCard` = 0); `initialLightFormValues.type = ""`; `validateLightForm` ставит `errors.type = "Выберите тип света"` при пустом типе; тест «на пустой отправке показывает шесть ошибок и уводит фокус на группу типа» зелёный |
| 2 | «Групповой маяк» показывает обязательное «Название организации» с placeholder «Например, община в Твери»; пустое поле → «Укажите название организации»; возврат на «Личный свет» убирает поле и ошибку; оба состояния покрыты тестами | ✓ VERIFIED | `LightForm.tsx` рендерит `orgName` условно при `values.type === "group"`; `updateField` стирает `orgName` и его ошибку при смене типа; тесты «групповой маяк требует название организации», «возврат к личному свету убирает поле организации вместе с ошибкой», «повторный выбор группы даёт пустое поле организации» — все зелёные |
| 3 | Подписи на русском по спецификации; звёздочки `rgb(252 165 165)` с `title="Обязательно"` и sr-only «обязательно» | ✓ VERIFIED | `copy.form.ts` содержит все тексты FORM-02 дословно (типы, поля, согласие, кнопка «Зажечь свой свет →»); `FormField.tsx`/`RequiredMark` рисует звёздочку с `title={formCopy.required.title}` = «Обязательно» и `aria-hidden`, следом `sr-only` «обязательно»; `.lf-required { color: rgb(252 165 165); }` в `light-form.css`; тест-группа «пометка обязательных полей» проверяет звёздочку у organName/firstName/lastName/countryId/email/consent и её отсутствие у city |
| 4 | Карточки типа, поля, чекбокс, кнопка со значениями FORM-03/04 | ✓ VERIFIED | `light-form.css`: `--option-surface: rgb(33 26 62 / .42)`, `::before` 40×40 с двумя `radial-gradient`, `.lf-type-dot` 16px, выбранная `--option-border-active: rgb(123 194 199 / .72)` + `0 0 24px var(--halo)`, hover/focus-within `translateY(-2px)`; `--field-height: 54px`, `--field-radius: 16px`, `--field-surface: rgb(33 26 62 / .58)`, `--field-border: rgb(239 237 245 / .18)`, фокус `--field-border-focus: rgb(170 217 220)` + `--field-focus-ring: 0 0 0 3px rgb(123 194 199 / .12)`; `.lf-checkbox` 18×18 `accent-color: rgb(170 217 220)`; `.lf-submit { margin-top: 8px }` без `width` (ширину даёт `.btn[data-beam][data-size="form"]` из `global.css`, не тронутого фазой) |
| 5 | Шапка секции: eyebrow, плоский заголовок, лид, колонка 42rem, отступы 64px, отступ 48px до формы; `#light-form`, тост, добавление огонька | ✓ VERIFIED | `.lf-head .eyebrow { color: rgb(170 217 220) }`; `variant="section"` у `GradientTitle` не изменён (плоский белый — контракт фазы 7); `.lf-lead { font: 400 18px/1.65; color: rgb(219 215 232) }`; `--form-width: 42rem` на `.lf-head`/`.lf-form`; `.lf-section > div { padding-block: 64px }`; `.lf-head { margin-bottom: 48px }`; `<Section id="light-form" …>`; тест «зажигает групповой маяк, растит счётчик и сбрасывает поля» подтверждает `addLight`, тост и живой регион |

**Score:** 5/5 truths verified

### Требования FORM-01…05

| Requirement | Source Plan | Описание | Status | Evidence |
|---|---|---|---|---|
| FORM-01 | 09-01, 09-02 | Форма без `GlassCard`; пустой тип при старте; условное `orgName`; тексты ошибок | ✓ SATISFIED | Код + 13 тестов состояний (LightForm.test.tsx, validation.test.ts) |
| FORM-02 | 09-01 | Подписи FORM-02 дословно; звёздочка обязательности | ✓ SATISFIED | `copy.form.ts`, `FormField.tsx`/`RequiredMark`, тест-группа «пометка обязательных полей» |
| FORM-03 | 09-02 | Стили карточек типа | ✓ SATISFIED | `light-form.css` (`.lf-type*`), тесты-инварианты CSS |
| FORM-04 | 09-02 | Поля, чекбокс, кнопка | ✓ SATISFIED | `light-form.css` (`.lf-control`, `.lf-checkbox`, `.lf-submit`), тесты-инварианты CSS. Отклонение: `outline: none` не добавлен (см. overrides) |
| FORM-05 | 09-02 | Шапка секции, отступы, id, тост | ✓ SATISFIED | `light-form.css` (`.lf-head`, `.lf-lead`, `.lf-section > div`), `LightForm.tsx` (`id="light-form"`, `SuccessToast`) |

Примечание: `.planning/REQUIREMENTS.md` и чекбокс `Phase 9` в `.planning/ROADMAP.md` ещё помечены как «Pending»/`[ ]` — это документационный статус, обновляемый штатно вместе с закрытием фазы, а не пробел в коде.

### Required Artifacts

| Artifact | Expected | Status | Details |
|---|---|---|---|
| `src/lib/validation.ts` | `LightTypeValue`, `orgName`, `LIGHT_FORM_FIELD_ORDER` из 8 полей, ошибка `type` | ✓ VERIFIED | Все поля на месте, `city` без проверки (принятое отклонение) |
| `src/data/copy.form.ts` | Подписи FORM-02, `required`, ошибки `type`/`orgName` | ✓ VERIFIED | Дословно совпадает со спецификацией |
| `src/components/form/LightTypeChoice.tsx` | `role="radiogroup"`, id/ошибка от родителя, строка `lf-type-row` | ✓ VERIFIED | Подтверждено чтением файла и тестами |
| `src/components/form/FormField.tsx` | `required`, `RequiredMark`, `aria-required` | ✓ VERIFIED | Экспорт и контракт совпадают с интерфейсом плана |
| `src/components/form/ConsentCheckbox.tsx` | Нативный `.lf-checkbox`, `RequiredMark` | ✓ VERIFIED | `sr-only`/`lf-check-box`/`<svg>` отсутствуют |
| `src/components/form/LightForm.tsx` | Без `GlassCard`, сетка `lf-col-3`/`lf-span` | ✓ VERIFIED | `grep -c GlassCard` = 0; классы сетки на месте |
| `src/components/form/light-form.css` | Стили FORM-03/04/05 без фона/орба/reduce | ✓ VERIFIED | Инвариантные тесты `describe("light-form.css: значения оригинала")` проходят |
| `src/components/form/LightForm.test.tsx`, `LightForm.failure.test.tsx`, `src/lib/validation.test.ts` | Тесты обоих состояний | ✓ VERIFIED | Все тесты зелёные (см. ниже) |

### Key Link Verification

| From | To | Via | Status | Details |
|---|---|---|---|---|
| `LightForm.tsx` | `validation.ts` | `LIGHT_FORM_FIELD_ORDER.find` для первого невалидного поля | ✓ WIRED | Строка `const firstInvalid = LIGHT_FORM_FIELD_ORDER.find((field) => found[field]);` |
| `LightForm.tsx` | `LightTypeChoice.tsx` | id группы от родителя, тот же id ищет `focusInForm` | ✓ WIRED | `id={fieldId("type")}` передан и используется `focusInForm(fieldId(firstInvalid))` |
| `LightForm.tsx` | `state/lights.tsx` | `addLight` с `toLightType` после сужения типа | ✓ WIRED | `addLight({ type: toLightType(lightType), countryId: Number(values.countryId) })` |
| `validation.ts` | `copy.form.ts` | тексты ошибок только из `formCopy.errors` | ✓ WIRED | `errors.type = formCopy.errors.type`, `errors.orgName = formCopy.errors.orgName` |
| `light-form.css .lf-type::before` | `.lf-type[data-type=…]` (`--beacon`/`--halo`) | radial-gradient через переменные карточки | ✓ WIRED | `--beacon`/`--halo` объявлены на `[data-type="individual"]`/`[data-type="group"]`, использованы в `::before` |
| `LightForm.tsx (Button size="form")` | `global.css (.btn[data-beam][data-size="form"])` | `data-size="form"` даёт ширину/высоту, `light-form.css` только `margin-top` | ✓ WIRED | Правило существует в `global.css` (не тронуто фазой), `.lf-submit` не задаёт `width` |
| `light-form.css (.lf-section > div)` | `Section.tsx` (контейнер `py-16 md:py-24`, `mt-6`) | неслоёное правило перебивает утилиты Tailwind | ✓ WIRED | Структура DOM `Section.tsx` подтверждена чтением файла, `Section.tsx` не изменён фазой |

### Behavioral Spot-Checks (test-based)

| Behavior | Command | Result | Status |
|---|---|---|---|
| Типобезопасность модели формы | `npx tsc -b` | без ошибок | ✓ PASS |
| Полный набор целевых тестов формы/валидации/motion policy/App | `npx vitest run src/components/form src/lib src/styles/motionPolicy.test.ts src/App.test.tsx` | 21 test files, 158 tests passed | ✓ PASS |
| Владение файлами по merge-коммиту | `git show --stat f581041` | ровно 10 файлов кода фазы 9 (+2 SUMMARY.md), ни одного файла из списка «Не трогать» | ✓ PASS |

### Anti-Patterns Found

Проверены все изменённые файлы фазы (`LightForm.tsx`, `LightTypeChoice.tsx`, `FormField.tsx`, `ConsentCheckbox.tsx`, `light-form.css`, `copy.form.ts`, `validation.ts`) на `TBD|FIXME|XXX|TODO|HACK|PLACEHOLDER`, заглушки `return null/{}/[]`, хардкод пустых пропов.

| File | Line | Pattern | Severity | Impact |
|---|---|---|---|---|
| — | — | ничего не найдено | — | Отклонений нет |

### Human Verification Required

Нет пунктов. План 09-02 явно откладывает визуальную сверку на фазу 13 (`<human-check>` в задаче 2: сравнение с `orig-form.jpeg`/`orig-form-group.jpeg` на 1440×900 и 390×844), что соответствует инструкции: «Визуальная сверка в браузере — фаза 13 (deferred)».

### Deferred Items

| # | Item | Addressed In | Evidence |
|---|------|-------------|----------|
| 1 | Визуальная попиксельная сверка формы с оригиналом (маячок, точка-радио, отступы на 1440×900/390×844) | Phase 13 | Roadmap Phase 13: «полный гейт, деплой и Playwright-сравнение с оригиналом на 1440×900 и 390×844»; 09-02-PLAN.md прямо помечает human-check как «не блокирует план», перенося на QA-03 |

### Принятые отклонения (overrides)

1. **Город необязателен.** Спецификация (раздел 3, FORM) помечает звёздочкой только обязательные поля; у «Города» звёздочки нет. `validateLightForm` больше не проверяет `city`, поле остаётся в значениях и порядке фокуса как справочное. Задокументировано в `09-01-SUMMARY.md` (Assumption Drift).
2. **`outline: none` на фокусе полей/чекбокса/карточки не добавлен**, хотя спецификация FORM-04 дословно этого просит вслед за оригиналом. `src/styles/motionPolicy.test.ts` требует единственное место в проекте, где гасится клавиатурная обводка (`main:focus` после ссылки пропуска); `light-form.css` оставляет поверх рамки/фона/тени глобальную `:focus-visible` обводку. Задокументировано в `09-02-SUMMARY.md` как «Rule 3 - Blocking» с обоснованием.

Оба отклонения — из инструкции верификации помечены как «известные принятые», подтверждены чтением кода и тестов, не блокируют фазу.

### Gaps Summary

Пробелов, блокирующих цель фазы, не найдено. Форма стоит на секции без карточки-обёртки, тип света не выбран при старте, поле «Название организации» появляется и валидируется только для группового маяка и корректно убирается при возврате к личному свету, все подписи и стили карточек/полей/чекбокса/кнопки/шапки соответствуют спецификации буквально (сверено построчно с разделом 3 FORM), CSS не содержит `GlassCard`, `background`/`::before` у `.lf-section`, `@media (prefers-reduced-motion: reduce)` и новых `data-anim`. `npx tsc -b` и полный целевой прогон тестов (158/158) зелёные. Владение файлами не нарушено: merge-коммит `f581041` содержит ровно файлы фазы 9.

Документационные поля (`REQUIREMENTS.md` статус «Pending», чекбокс Phase 9 в `ROADMAP.md`) не обновлены под завершение — не пробел кода, но стоит закрыть при завершении фазы.

---

*Verified: 2026-09-06T12:00:00Z*
*Verifier: Claude (gsd-verifier)*
