---
phase: 03-form-about-involve
fixed_at: 2026-09-05T20:13:00Z
review_path: .planning/phases/03-form-about-involve/03-REVIEW.md
iteration: 1
findings_in_scope: 10
fixed: 10
skipped: 0
status: all_fixed
---

# Фаза 3: отчёт о правках после code review

**Исправлено:** 2026-09-05T20:13:00Z
**Источник:** `.planning/phases/03-form-about-involve/03-REVIEW.md`
**Ветка:** `agent-fix-03` (worktree `/Users/thevladoss/devs/web/esd_cringe-wt/fix-03`, база `4f256cf`)
**Итерация:** 1

**Сводка:**
- Находок в объёме (Critical + Warning): 10
- Исправлено: 10
- Пропущено: 0

После каждой правки прогонял `npx tsc -b`, `npm test`, `npm run build`, `npm run lint` — всё зелёное.
Тестов было 235, стало 250.

## Исправленные

### CR-01: успех формы не озвучивается скринридером

**Файлы:** `src/components/form/LightForm.tsx`, `src/components/form/SuccessToast.tsx`, `src/components/form/LightForm.test.tsx`
**Коммит:** a4986b2
**Что сделал:** форма всегда держит смонтированный `<p className="sr-only" role="status" aria-live="polite">`, пустой до отправки; после успеха в него приходит текст, и скринридер читает его как смену содержимого живого региона. Визуальная карточка потеряла `role="status"`/`aria-live` и получила `aria-hidden="true"` — она стала декоративной копией. Тесты тоста переписал: карточка ищется по классу `.lf-toast`, живой регион — по роли `status`. Добавил три теста на объявление (регион пустой до отправки, ровно одна живая область, регион очищается после закрытия).

### WR-01: во время отправки форма принимает ввод, потом стирает его и забирает фокус

**Файлы:** `src/components/form/LightForm.tsx`, `src/components/form/light-form.css`, `src/components/form/LightForm.test.tsx`
**Коммит:** efa88ab
**Что сделал:** поля, радио-карточки и согласие переехали в `<fieldset className="lf-fields" disabled={submitting}>`, так что 1200 мс отправки ввод не принимается и сброс формы нечего затирать. Класс `.lf-fields` в CSS — `display: contents`, поэтому раскладку по-прежнему держит `.lf-form`. Возврат фокуса на кнопку теперь под условием: он срабатывает, только если активного элемента нет (`document.body`). Сброс значений перевёл на функциональный `setValues((prev) => …)` — захваченный `values` больше не участвует. Тесты: поля блокируются и разблокируются, фокус не отбирается у элемента вне формы.

### WR-02: LiveToast залипает, если onClose или duration меняют идентичность

**Файлы:** `src/components/form/SuccessToast.tsx`, `src/components/form/SuccessToast.test.tsx` (новый)
**Коммит:** 42a3014
**Что сделал:** свежий `requestClose` лежит в ref, автотаймер зависит только от `duration`, а таймер фазы ухода гасится отдельным эффектом при размонтировании. Прозрачная карточка с `pointer-events: auto` больше не остаётся ловить клики. Завёл `SuccessToast.test.tsx` с четырьмя тестами, два из которых на старом коде падали: отсчёт не перезапускается на новой ссылке `onClose`, фаза ухода доживает до конца после ререндера родителя.

### WR-03: id чекбокса согласия задан двумя независимыми источниками

**Файлы:** `src/components/form/ConsentCheckbox.tsx`, `src/components/form/LightForm.tsx`, `src/components/form/LightForm.test.tsx`
**Коммит:** 83c4b2a
**Что сделал:** константа `CONSENT_ID` удалена, `ConsentCheckbox` принимает `id` пропом от `fieldId("consent")` и выводит из него id ошибки. Добавил тест: при заполненной форме без галочки фокус после сабмита доезжает до чекбокса — он падал бы, разойдись источники.

### WR-04: countryId не проверяется на принадлежность справочнику

**Файлы:** `src/lib/validation.ts`, `src/lib/validation.test.ts`
**Коммит:** 671da03
**Что сделал:** `validateLightForm` проверяет `countryId` через `countryById` из `src/data/countries.ts`: пустое значение, нецелое число и id вне 12 стран дивизиона дают ошибку «Выберите страну». `createLight` больше не получает неизвестную страну, то есть исключение внутри reducer'а недостижимо со стороны формы. Тест перебирает все 12 валидных id и восемь мусорных значений (`"840"`, `"643.5"`, `"abc"`, `"Infinity"` и другие).

### WR-05: videoId подставляется в URL без кодирования и проверки формата

**Файлы:** `src/components/about/VideoEmbed.tsx`, `src/components/about/VideoEmbed.test.tsx`
**Коммит:** 11192c2
**Что сделал:** `VideoEmbed` проверяет проп регуляркой `/^[\w-]{11}$/` и при промахе возвращает `null` (проверка стоит после хуков). В оба адреса — эмбед и постер — подставляется `encodeURIComponent(videoId)`. Тест перебирает пять негодных значений, включая `"YpLD6p-z00g?list=PL"` и `"../../watch"`.

### WR-06: Tailwind-утилиты и рукописный CSS объявляют одни и те же свойства

**Файлы:** `src/components/form/LightForm.tsx`, `LightTypeChoice.tsx`, `ConsentCheckbox.tsx`, `SuccessToast.tsx`, `src/components/about/About.tsx`, `about.css`, `src/components/involve/Involve.tsx`, `InvolveCard.tsx`, `involve.css`
**Коммит:** 5525149
**Что сделал:** убрал из JSX утилиты, чьи свойства уже объявлены в `*.css` вне слоёв (эти утилиты были мертвы: unlayered CSS выигрывает у `@layer utilities`). Прошёл по всем таким местам в файлах фазы, а не только по процитированным строкам: `lf-head`, `lf-lead`, `lf-card`, `lf-form`, `lf-grid`, `lf-span`, `lf-submit`, `lf-types`, `lf-check`, `lf-toast`, `lf-toast-card`, `ab-steps`, `inv-triptych`, `inv-body`, `inv-title`, `inv-action`. Ширину текстовой колонки перенёс в CSS: появились `.ab-head` и `.inv-head` с `max-width: 42rem`, из `.ab-lead` и `.inv-lead` дублирующий `max-width` ушёл. В JSX остались только `mt-12`, `mt-6`, `mt-4`, `mt-2` и шрифтовые утилиты лида Involve, которых в CSS нет.

### WR-07: фиксированные глобальные DOM id плюс поиск через document.getElementById

**Файлы:** `src/components/form/LightForm.tsx`, `src/components/form/LightForm.test.tsx`
**Коммит:** 7548d41
**Что сделал:** модульные константы `SUBMIT_ID` и `fieldId` заменил на префикс `useId()` внутри компонента. Поиск контролов идёт по поддереву формы через `formRef.current?.querySelector('[id="…"]')` — атрибутный селектор, поэтому двоеточия из `useId` не ломают запрос. Тесты больше не угадывают id: контролы ищутся по `name`, ошибки — по `.lf-error` и `aria-describedby`, кнопка — по `button[type="submit"]`. Новый тест рендерит две формы и проверяет, что 14 id внутри форм уникальны, а `getAllByLabelText` находит оба поля имени.

### WR-08: пустое утверждение в тесте Involve

**Файлы:** `src/components/involve/Involve.test.tsx`
**Коммит:** 826827f
**Что сделал:** выбросил `expect(article.onclick).toBeNull()` — оно не может провалиться, React пишет обработчики не в свойство узла. Вместо него: внутри карточки ровно одна ссылка и ноль кнопок, псевдокнопок, инпутов и `tabindex`; клик по самой карточке не меняет `window.location.hash`.

### WR-09: тост закрывается только мышью

**Файлы:** `src/components/form/SuccessToast.tsx`, `src/components/form/SuccessToast.test.tsx`
**Коммит:** b3359bd
**Что сделал:** `LiveToast` вешает `keydown` на `document` и по Escape запускает ту же фазу ухода, что и клик. Слушатель снимается при размонтировании. Интерактив остался на декоративном слое (`aria-hidden`), объявление живёт в живом регионе формы — развязка из CR-01. Два теста: Escape закрывает, остальные клавиши игнорируются, после размонтирования Escape ничего не будит.

## Что стоит проверить руками

Автотесты идут в jsdom и не видят вёрстку. Глазами в браузере полезно посмотреть два места:

- **WR-01:** `<fieldset className="lf-fields">` с `display: contents` — раскладка формы (колонка с шагом 32px) и вид полей в состоянии `disabled`.
- **WR-06:** секции About, Involve и форма после удаления утилит — ширина текстовой колонки, сетка шагов и триптиха на 768px и 1024px, положение тоста внизу экрана.

## Не трогал (вне объёма)

Информационные находки IN-01…IN-13 остались как есть: объём правки — Critical и Warning.
Побочно закрылся только IN-12: комментарий про клик «в любую точку» я переписал, потому что
поведение тоста изменилось в CR-01 и WR-09.

Отдельно отмечу расхождение, которого в отчёте нет и которое я не правил: `GlassCard` добавляет
`p-6 md:p-8`, а `.lf-card` объявляет `padding: 24px` и 40px на 768px. Побеждает CSS, значит
`md:p-8` (32px) мёртв. Живёт это в примитиве фазы 1, поэтому оставил как есть.

---

_Исправлено: 2026-09-05T20:13:00Z_
_Исполнитель: Claude (gsd-code-fixer)_
_Итерация: 1_
