---
phase: 03-form-about-involve
plan: 01
subsystem: ui
tags: [form, validation, react, testing-library, accessibility, react-portal]

requires:
  - phase: 01-scaffold-and-deploy
    provides: "Примитивы Section, Eyebrow, GradientTitle, Button, GlassCard, токены и jsdom-моки в src/test/setup.ts"
  - phase: 02-hero-and-map
    provides: "LightsProvider, useLights, addLight({ type, countryId }), ESD_COUNTRIES из src/data/countries.ts"
provides:
  - "Чистая валидация формы: validateLightForm, EMAIL_RE, LIGHT_FORM_FIELD_ORDER, initialLightFormValues, toLightType"
  - "Тексты секции формы в src/data/copy.form.ts (formCopy), включая шесть сообщений об ошибках"
  - "Рабочая секция #light-form: выбор типа света, шесть полей, согласие, мок-отправка в контекст огоньков"
  - "Компоненты формы FormField, LightTypeChoice, ConsentCheckbox, SuccessToast с классами lf-* под CSS плана 03-04"
  - "Тесты: validation.test.ts (7) и LightForm.test.tsx (8) с fake timers"
affects: [03-04, 05-polish-and-release]

tech-stack:
  added: []
  patterns:
    - "Тексты секции живут в своём файле data/copy.*.ts, компонент не держит русских литералов"
    - "FormField принимает render-prop: id, className, aria-invalid и aria-describedby приходят в контрол одним объектом"
    - "Классы lf-* задают контракт разметки, раскладка на утилитах Tailwind, оформление отдаёт CSS плана 03-04"
    - "Фокус после асинхронного действия возвращается через useEffect по смене submitting, а не сразу в setTimeout"

key-files:
  created:
    - src/lib/validation.ts
    - src/lib/validation.test.ts
    - src/data/copy.form.ts
    - src/components/form/LightForm.tsx
    - src/components/form/LightForm.test.tsx
    - src/components/form/LightTypeChoice.tsx
    - src/components/form/FormField.tsx
    - src/components/form/ConsentCheckbox.tsx
    - src/components/form/SuccessToast.tsx
  modified:
    - src/App.test.tsx
    - src/components/placeholders.test.tsx

key-decisions:
  - "Counters в LightForm.test.tsx не используется: src/components/map/Counters.tsx на базе ветки ещё нет, счётчики проверяет CountsProbe через useLights()"
  - "toLightType возвращает LightType из src/data/lights.ts (person | group), а форменный тип назван так же, но живёт в validation.ts (individual | group)"
  - "Кнопка получает фокус в useEffect по смене submitting: фокус сразу в колбэке таймера попал бы на ещё отключённую кнопку"
  - "Тост перемонтируется по key при каждом успехе: таймер 4000 мс отсчитывается от последнего зажжённого огонька, второго элемента role=status при этом не появляется"
  - "Утилиты Tailwind в разметке повторяют значения CSS плана 03-04 (grid gap-4 md:grid-cols-2, max-w-4xl, gap-8), чтобы форма была читаемой ещё до появления light-form.css"

patterns-established:
  - "Радио-карточка: label.lf-type с data-type, внутри sr-only radio; выбранное состояние рисует CSS через :has(input:checked), JS-классов нет"
  - "Ошибка поля рендерится только при наличии текста, её id выводится из id контрола суффиксом -error"

requirements-completed: [FORM-01, FORM-02, FORM-03]

duration: 11min
completed: 2026-09-05
---

# Phase 3 Plan 01: Форма «Зажгите свой свет» Summary

**Секция #light-form с выбором типа света, шестью полями и русской клиентской валидацией: валидная отправка на 1200 мс переводит кнопку в «Зажигаем…», зовёт addLight, растит счётчик группы с 248 до 249 и показывает тост role=status.**

## Performance

- **Duration:** 11 min
- **Started:** 2026-09-05T15:45:30Z
- **Completed:** 2026-09-05T15:54:01Z
- **Tasks:** 3
- **Files modified:** 11 (9 создано, 2 изменено)

## Accomplishments

- Чистая `validateLightForm` с шестью правилами и текстами на русском, покрыта семью unit-тестами без DOM
- Форма: две радио-карточки, шесть полей с `label`, `aria-invalid` и `aria-describedby`, согласие, кнопка с `aria-busy`
- Проверка на submit с фокусом на первое невалидное поле; после первой попытки поле перепроверяется на blur, ошибка гаснет прямо во время набора
- Мок-отправка без сети: `addLight({ type, countryId })`, сброс полей с сохранением типа, возврат фокуса на кнопку
- Тост `role="status"` через портал в `document.body`: автозакрытие 4000 мс и закрытие по клику
- `npm test` 97 зелёных, `npm run build` и `npx eslint src` без замечаний

## Task Commits

1. **Task 1: Красные тесты валидации и формы** — `ecf979d` (test)
2. **Task 2: Валидация, тексты и рабочая форма с отправкой в контекст огоньков** — `5865580` (feat)
3. **Task 3: Тост успеха и зелёный прогон всех тестов формы** — `20865c1` (feat)

## Files Created/Modified

- `src/lib/validation.ts` — типы значений и ошибок, `EMAIL_RE`, порядок полей, `initialLightFormValues`, `toLightType`, `validateLightForm`
- `src/lib/validation.test.ts` — семь тестов: шесть правил, trim, регулярка email, чистота функции
- `src/data/copy.form.ts` — `formCopy`: надзаголовок, H2, лид, тексты типов, подписи и плейсхолдеры полей, согласие, кнопка, успех, шесть ошибок
- `src/components/form/LightForm.tsx` — секция `#light-form`, состояние формы, submit с задержкой 1200 мс, вызов `addLight`, сброс, тост
- `src/components/form/LightForm.test.tsx` — восемь component-тестов на fake timers: структура, шесть ошибок, blur, успех, тост
- `src/components/form/LightTypeChoice.tsx` — `fieldset.lf-types` с двумя карточками и скрытыми radio
- `src/components/form/FormField.tsx` — подпись, контрол через render-prop и текст ошибки со связанными id
- `src/components/form/ConsentCheckbox.tsx` — согласие: скрытый чекбокс, свой бокс с SVG-галочкой, ошибка
- `src/components/form/SuccessToast.tsx` — портал с `role="status"`, `aria-live="polite"`, таймер с очисткой в cleanup
- `src/App.test.tsx` — рендер приложения обёрнут в `LightsProvider`
- `src/components/placeholders.test.tsx` — из таблицы заглушек убрана строка `LightForm`

## Decisions Made

- Тип света в форме (`individual | group`) и тип огонька на карте (`person | group`) разведены по модулям: `validation.ts` знает про форму, `data/lights.ts` про карту, мост между ними — `toLightType`
- Тост монтируется порталом в `body`: секция формы получит `overflow-x: clip` в плане 03-04, `position: fixed` внутри неё вело бы себя иначе
- Значения утилит Tailwind в разметке подобраны так, чтобы совпасть с CSS плана 03-04 и не конфликтовать по специфичности

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `Counters` в тесте формы заменён на пробу контекста**

- **Found during:** Task 1 (тесты)
- **Issue:** План велел рендерить рядом `Counters` из `../map/Counters` и проверять в нём число 249. На базовой ветке этого файла нет: его создаёт план 02-03, который идёт параллельно. Импорт ронял тест на этапе резолва модуля
- **Fix:** Тест рендерит `LightForm` и `CountsProbe` внутри `LightsProvider`; счётчики и последний огонёк читаются напрямую из `useLights()` через `data-testid="probe-people|probe-groups|probe-last"`. Проверки чисел 249, 694 и `{"type":"group","countryId":643}` остались на месте
- **Files modified:** src/components/form/LightForm.test.tsx
- **Verification:** `npx vitest run src/components/form` — 8 тестов зелёные
- **Committed in:** `ecf979d`

**2. [Rule 3 - Blocking] Тесты фазы 1 приведены к рабочей форме**

- **Found during:** Task 2 (реализация)
- **Issue:** Живой `LightForm` читает контекст огоньков, поэтому `src/App.test.tsx` (рендер `<App />` без провайдера) падал на `useLights must be used within <LightsProvider>`, а `src/components/placeholders.test.tsx` продолжал требовать от формы текст заглушки из `copy.sections.lightForm`. Без правки `npm test` красный
- **Fix:** В `App.test.tsx` добавлен хелпер `renderApp()`, оборачивающий `<App />` в `LightsProvider` (то же делает план 02-03 в своей ветке); из таблицы `placeholders.test.tsx` убрана строка `LightForm` вместе с импортом. Остальные проверки не тронуты
- **Files modified:** src/App.test.tsx, src/components/placeholders.test.tsx
- **Verification:** `npm test` — 97 тестов зелёные, 14 файлов
- **Committed in:** `5865580`

**3. [Rule 2 - Missing Critical] Возврат фокуса на кнопку вынесен в эффект**

- **Found during:** Task 2 (реализация)
- **Issue:** Фокус на `#light-form-submit` прямо в колбэке `setTimeout` не срабатывает: React ещё не перерисовал кнопку, и `focus()` попадает на `disabled`-элемент. Требование доступности «фокус возвращается на кнопку» осталось бы невыполненным
- **Fix:** Флаг в `useRef` плюс `useEffect` по смене `submitting`: фокус ставится после того, как кнопка снова активна
- **Files modified:** src/components/form/LightForm.tsx
- **Verification:** Тест «зажигает групповой маяк…» проверяет `document.activeElement === #light-form-submit`
- **Committed in:** `5865580`

**4. [Rule 2 - Missing Critical] Тост перемонтируется по key**

- **Found during:** Task 3 (тост)
- **Issue:** Блок behavior требует, чтобы повторный успех при открытом тосте перезапускал таймер и не плодил второй `role="status"`. При неизменном `toastOpen === true` эффект с зависимостями `[open, duration, onClose]` не перезапускается, и тост исчез бы раньше времени после второго огонька
- **Fix:** Счётчик `toastKey` в `LightForm` растёт на каждом успехе и передаётся в `<SuccessToast key={toastKey}>`; компонент монтируется заново с новым таймером, элемент остаётся один
- **Files modified:** src/components/form/LightForm.tsx
- **Verification:** `npx vitest run src/components/form` зелёный; `screen.getByRole("status")` не жалуется на несколько совпадений
- **Committed in:** `20865c1`

---

**Total deviations:** 4 auto-fixed (2 blocking, 2 missing critical)
**Impact on plan:** Расширения скоупа нет. Две правки вызваны параллельным исполнением (нет `Counters`, нет провайдера в `App.tsx`), две закрывают требования доступности и поведения тоста из самого плана.

## Assumption Drift (advisory)

**1. Заглушку формы проверял общий табличный тест фазы 1**

- **Found during:** Task 2
- **Planned:** План перечислял только файлы формы и считал, что замена заглушки ни на что снаружи не влияет
- **Actual:** `src/components/placeholders.test.tsx` и `src/App.test.tsx` описывают все восемь секций разом, поэтому первый же живой компонент фазы ломает оба файла
- **Why:** Те же правки понадобятся планам 03-02 и 03-03 (About, Involve) и уже запланированы у 02-03 для `App.test.tsx`. При слиянии веток строки в этих двух файлах могут конфликтовать — правки одинаковые по смыслу, разрешаются в пользу «убрать строку заглушки» и «рендерить под провайдером»

## Issues Encountered

- `noUnusedLocals` в `tsconfig.app.json` не даёт оставить `toastOpen` неиспользованным между задачами: в коммите Task 2 состояние объявлено как `const [, setToastOpen]`, Task 3 вернул полное имя вместе с рендером тоста

## Known Stubs

Заглушек нет. Форма полностью подключена к контексту огоньков; визуальное оформление (`light-form.css` с токенами полей, радио-карточек и тоста) осознанно отложено в план 03-04 той же фазы — до него разметка держится на утилитах Tailwind.

## User Setup Required

None — внешние сервисы не используются, форма не ходит в сеть.

## Next Phase Readiness

- План 03-04 может писать CSS: все классы из контракта (`lf-section`, `lf-head`, `lf-lead`, `lf-card`, `lf-form`, `lf-types`, `lf-legend`, `lf-type[data-type]`, `lf-type-title`, `lf-type-text`, `lf-type-dot`, `lf-grid`, `lf-span`, `lf-field`, `lf-label`, `lf-control`, `lf-error`, `lf-consent`, `lf-check`, `lf-check-box`, `lf-check-text`, `lf-submit`, `lf-toast`, `lf-toast-card`, `lf-toast-icon`) стоят в разметке, id контролов и ошибок совпадают с контрактом
- `SuccessToast` готов принять фазу закрытия (`data-state`) из плана 03-04: сейчас у него один таймер и `onClose`
- Для слияния: ветка трогает `src/App.test.tsx` и `src/components/placeholders.test.tsx` — те же файлы правят планы 02-03, 03-02 и 03-03

---
_Phase: 03-form-about-involve_
_Completed: 2026-09-05_

## Self-Check: PASSED

Все девять файлов плана и SUMMARY на месте, три коммита задач (`ecf979d`, `5865580`, `20865c1`) в истории ветки `agent-03-01`.
