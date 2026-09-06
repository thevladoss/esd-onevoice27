# Phase 9: Форма как в оригинале — Pattern Map

**Mapped:** 2026-09-06
**Files analyzed:** 10
**Analogs found:** 10 / 10 (8 файлов меняются — аналог это их текущая версия; 2 новых паттерна взяты у соседей)

Все десять файлов фазы уже существуют: новых файлов фаза не создаёт. Поэтому «ближайший аналог» для
каждого — его собственная текущая версия плюс сосед, у которого лежит недостающий приём (id от
родителя, sr-only-подпись, типизированный copy-модуль).

## File Classification — классификация файлов

| Файл фазы | Роль | Поток данных | Ближайший аналог | Качество |
|-----------|------|--------------|------------------|----------|
| `src/components/form/LightForm.tsx` | component (контейнер формы, состояние) | request-response (submit → validate → `addLight`) | он же, v1.0; для шапки — `Section` + `Reveal` (строки 148-156) | exact |
| `src/components/form/LightTypeChoice.tsx` | component (группа контролируемых radio) | event-driven (`onChange` вверх) | он же; для id от родителя — `ConsentCheckbox.tsx:7-19` | exact |
| `src/components/form/FormField.tsx` | component (обёртка с render-prop) | transform (props → aria) | он же; для звёздочки — `Footer.tsx:25`, `Counters.tsx:36` | exact |
| `src/components/form/ConsentCheckbox.tsx` | component (контролируемый checkbox) | event-driven | он же | exact |
| `src/components/form/light-form.css` | config/styles | — | он же; конвенции секции — `involve/involve.css:1-22` | exact |
| `src/components/form/LightForm.test.tsx` | test (компонент, сценарии) | request-response | он же; для `userEvent` — `resources/Resources.test.tsx:1-33` | exact |
| `src/components/form/LightForm.failure.test.tsx` | test (компонент, замоканная зависимость) | error branch | он же (`vi.mock` строки 11-20) | exact |
| `src/data/copy.form.ts` | data (копирайт) | static config | он же; типизированный вариант — `data/copy.involve.ts:1-17` | exact |
| `src/lib/validation.ts` | utility (чистая функция) | transform | он же | exact |
| `src/lib/validation.test.ts` | test (unit) | transform | он же | exact |

---

## Pattern Assignments — что копировать по файлам

### `src/components/form/LightForm.tsx` (component, request-response)

**Аналог:** текущая версия файла.

**Импорты и порядок** (строки 1-24) — CSS первым, затем типы React, затем данные, `lib`, `state`,
`layout`-примитивы, свои подкомпоненты:

```tsx
import "./light-form.css";
import type { FormEvent } from "react";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import { formCopy } from "../../data/copy.form";
import { ESD_COUNTRIES } from "../../data/countries";
import type { LightFormErrors, LightFormField, LightFormValues } from "../../lib/validation";
import {
  LIGHT_FORM_FIELD_ORDER,
  initialLightFormValues,
  toLightType,
  validateLightForm,
} from "../../lib/validation";
import { useLights } from "../../state/lights";
import { Button } from "../layout/Button";
import { Eyebrow } from "../layout/Eyebrow";
import { GlassCard } from "../layout/GlassCard";   // ← убрать в этой фазе
import { GradientTitle } from "../layout/GradientTitle";
import { Reveal } from "../layout/Reveal";
import { Section } from "../layout/Section";
```

**Шапка секции** (строки 148-156) — переносится дословно, меняется только обёртка формы ниже:

```tsx
<Section id="light-form" titleId="form-title" className="lf-section">
  <Reveal className="lf-head">
    <Eyebrow>{formCopy.eyebrow}</Eyebrow>
    <GradientTitle as="h2" variant="section" id="form-title">
      {formCopy.title}
    </GradientTitle>
    <p className="lf-lead">{formCopy.lead}</p>
  </Reveal>
```

`variant="section"` не трогать: плоский белый заголовок приходит из фазы 7. `Section` (см.
`layout/Section.tsx:26-38`) сам оборачивает детей в `div.mx-auto.max-w-[72rem].px-4.py-16.md:px-8.md:py-24`,
поэтому колонку 42rem и отступы 64px задавать классами `.lf-head` / `.lf-form` в своём CSS, а не
пропсами `Section`.

**Уникальные id на экземпляр** (строки 35-38) — паттерн сохраняется, к нему добавятся `type` и `orgName`:

```tsx
const uid = useId();
const fieldId = (field: LightFormField) => `${uid}-${field}`;
const submitId = `${uid}-submit`;
```

**Фокус внутри своей формы** (строки 54-57) — не заменять на `document.getElementById`:

```tsx
function focusInForm(id: string) {
  formRef.current?.querySelector<HTMLElement>(`[id="${id}"]`)?.focus();
}
```

**Отправка: валидация → первый невалидный → таймер → `addLight`** (строки 105-144). Ветку отказа
(`!lit`) и сброс значений менять не нужно, порядок фокуса берётся из `LIGHT_FORM_FIELD_ORDER`:

```tsx
const found = validateLightForm(values);
setErrors(found);
setAttempted(true);

const firstInvalid = LIGHT_FORM_FIELD_ORDER.find((field) => found[field]);
if (firstInvalid) {
  focusInForm(fieldId(firstInvalid));
  return;
}
```

**Гашение ошибки при наборе** (строки 28-32, 81-103) — `withoutField` уже готов и пригодится, когда
`orgName` исчезает вместе со своей ошибкой:

```tsx
function withoutField(errors: LightFormErrors, field: LightFormField): LightFormErrors {
  const next = { ...errors };
  delete next[field];
  return next;
}
```

**Ограничение, которое ловится только здесь:** `LIGHT_FORM_FIELD_ORDER` теперь начинается с `type`, а
`focusInForm(fieldId("type"))` не найдёт радио — его id генерирует свой `useId` внутри
`LightTypeChoice` (строка 24 того файла). Аналог решения лежит рядом: `ConsentCheckbox` получает `id`
сверху (`LightForm.tsx:268` → `ConsentCheckbox.tsx:8`). Так же передать id первой радио-кнопки в
`LightTypeChoice`.

**Смена типа сейчас пишется мимо `updateField`** (строки 163-166): `setValues((prev) => ({ ...prev, type }))`
не гасит ошибку и не сбрасывает `failed`. При `type: ""` с ошибкой «Выберите тип света» это надо
провести через тот же `updateField`, иначе ошибка группы останется висеть после выбора.

---

### `src/components/form/LightTypeChoice.tsx` (component, event-driven)

**Аналог:** текущая версия + `ConsentCheckbox.tsx` (id и ошибка сверху).

**Скрытое нативное радио + карточка-label** (строки 26-50) — приём сохраняется целиком, `sr-only`
вместо `display: none` держит клавиатуру и `getByRole("radio")` в тестах:

```tsx
<fieldset className="lf-types">
  <legend className="lf-legend">{formCopy.typeLegend}</legend>
  {OPTIONS.map((option) => (
    <label
      key={option.value}
      className="lf-type"
      data-type={option.value}
      htmlFor={`${uid}-${option.value}`}
    >
      <input
        className="sr-only"
        id={`${uid}-${option.value}`}
        type="radio"
        name="lightType"
        value={option.value}
        checked={value === option.value}
        onChange={() => onChange(option.value)}
      />
      <span className="lf-type-title">{option.title}</span>
      <span className="lf-type-text">{option.text}</span>
      <span className="lf-type-dot" aria-hidden="true" />
    </label>
  ))}
</fieldset>
```

**Таблица опций из copy** (строки 6-9) — тексты не хардкодить в JSX:

```tsx
const OPTIONS: readonly { value: LightType; title: string; text: string }[] = [
  { value: "individual", ...formCopy.types.individual },
  { value: "group", ...formCopy.types.group },
];
```

**Ошибка и id сверху — брать у `ConsentCheckbox.tsx:7-20`:**

```tsx
export function ConsentCheckbox({ id, checked, error, onChange, onBlur }: { ... }) {
  const errorId = `${id}-error`;
```

Для группы это значит: пропсы `id`, `error`, `value: LightType | ""`; `aria-describedby={error ? errorId : undefined}`
и `aria-invalid` вешать на `<fieldset>`, ошибку рисовать тем же `<p className="lf-error" id={errorId}>`.

**sr-only `<legend>`** — аналог скрытой подписи у `Quote.tsx:22-24`:

```tsx
<h2 id="quote-title" className="sr-only">
  {quoteCopy.eyebrow}
</h2>
```

`sr-only` — утилита Tailwind v4, своего правила в CSS проекта нет; класс просто вешается.

---

### `src/components/form/FormField.tsx` (component, transform)

**Аналог:** текущая версия.

**Контракт render-prop** (строки 3-8, 26-46) — сохранить целиком: контрол получает `id`, класс и aria,
а id ошибки выводится из id поля, поэтому `aria-describedby` не расходится с разметкой:

```tsx
export interface FormControlProps {
  id: string;
  className: string;
  "aria-invalid": true | undefined;
  "aria-describedby": string | undefined;
}

const errorId = `${id}-error`;

return (
  <div className={"lf-field" + (className ? " " + className : "")}>
    <label className="lf-label" htmlFor={id}>{label}</label>
    {children({
      id,
      className: "lf-control",
      "aria-invalid": error ? true : undefined,
      "aria-describedby": error ? errorId : undefined,
    })}
    {error ? <p className="lf-error" id={errorId}>{error}</p> : null}
  </div>
);
```

`className` уже прокидывается наружу (`LightForm.tsx:250` передаёт `lf-span`) — через него и ставить
колонки сетки 6/3/3 из FORM-01, новых пропсов для раскладки не заводить.

**Звёздочка обязательного поля** — приём «видимый значок + скрытая подпись» уже есть в двух местах.
`Footer.tsx:25`:

```tsx
{link.label} <span className="sr-only">{copy.footer.newTabHint}</span>
```

`Counters.tsx:35-37` — пара «декоративное для глаза / текст для скринридера»:

```tsx
<span aria-hidden="true">{formatCount(people)}</span>
<span className="sr-only">{mapCopy.counters.peopleLive(formatCount(counts.people))}</span>
```

Из этого складывается разметка FORM-02: `<span className="lf-required" title="Обязательно" aria-hidden="true">` (иконка)
плюс `<span className="sr-only">обязательно</span>`; текст обеих частей — в `copy.form.ts`.

---

### `src/components/form/ConsentCheckbox.tsx` (component, event-driven)

**Аналог:** текущая версия.

**Сигнатура и связка ошибки** (строки 7-35) остаются, меняется только внутренность бокса: FORM-04
требует нативный чекбокс 18×18 с `accent-color: rgb(170 217 220)`, то есть `className="sr-only"`,
`<span className="lf-check-box">` с SVG-галочкой (строки 26, 36-47) и правила `.lf-check-box` в CSS
(строки 278-317) уходят.

```tsx
<label className="lf-check" htmlFor={id}>
  <input
    className="sr-only"        // ← снять: чекбокс становится видимым нативным
    id={id}
    type="checkbox"
    name="consent"
    checked={checked}
    aria-invalid={error ? true : undefined}
    aria-describedby={error ? errorId : undefined}
    onChange={(event) => onChange(event.target.checked)}
    onBlur={onBlur}
  />
```

`name="consent"` не переименовывать: тесты обеих форм ищут контролы по `[name="..."]`.

---

### `src/components/form/light-form.css` (config/styles)

**Аналог:** текущая версия + `involve/involve.css:1-22` (конвенция «локальные токены на корне секции»).

**Локальные токены на корневом классе секции** — как в `.lf-section` (строки 4-34) и `.inv-section`
(involve.css 3-22). Значения FORM-03/FORM-04 подставлять сюда, а не размазывать по правилам:

```css
.lf-section {
  /* Поля */
  --field-height: 54px;
  --field-radius: 12px;               /* → 16px по FORM-04 */
  --field-surface: rgb(18 12 52 / .58);  /* → rgb(33 26 62 / .58) */
  --field-border: rgb(248 247 251 / .18);/* → rgb(239 237 245 / .18) */
  --field-error: #fca5a5;                /* → литерал rgb(252 165 165) */

  /* Общее */
  --focus-ring: #aad9dc;
  --ui-transition: 420ms cubic-bezier(0.32, 0.72, 0, 1);

  position: relative;
  isolation: isolate;
  overflow-x: clip;
  background: rgb(18 12 52);          /* ← удалить (подложку даёт лента фазы 8) */
}
```

Вместе с `background` уходит и весь блок `.lf-section::before` (строки 36-50) — орб рисует `map.css`
фазы 8.

**Состояния через `:has()`, а не через классы из JS** (строки 135-143, 169-179, 301-317):

```css
.lf-type:has(input:checked) {
  border-color: var(--option-border-active);
  background: var(--option-surface-active);
}

.lf-type:has(input:focus-visible) {
  outline: 2px solid var(--focus-ring);
  outline-offset: 3px;
}

.lf-type[data-type="individual"] .lf-type-dot { background: var(--color-signal-400); }
.lf-type[data-type="group"] .lf-type-dot      { background: var(--color-horizon-400); }
```

`data-type` на label — готовый крючок для `--beacon` / `--halo` из FORM-03: объявлять их в
`.lf-type[data-type="individual"]` / `[data-type="group"]`, а `::before`-маячок писать через
`var(--beacon)` / `var(--halo)`, как декоративные слои в `involve.css::before` (строки 24-41).

**Резерв под ошибку в сетке поля** (строки 197-204) — сохранить, иначе появление ошибки `orgName`
будет дёргать соседние поля:

```css
/* Третья строка сетки поля пуста, пока ошибки нет: её появление не сдвигает соседние поля.
   26px = строка 13px/1.35 плюс отступ 8px от контрола. */
.lf-field {
  display: grid;
  grid-template-rows: auto auto minmax(26px, auto);
  align-content: start;
  min-width: 0;
}
```

**Брейкпоинт и ховер** (строки 71-75, 101-105, 129-133, 187-195, 231-235): только
`@media (min-width: 768px)` и `@media (hover: hover)`, вложенности нет, media-блок ставится сразу
после базового правила.

**Свой SVG-стрелка селекта инлайном** (строки 248-256) — оставить как есть, поменять только `radius`
и фон через токены:

```css
select.lf-control {
  appearance: none;
  padding-right: 44px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='%23aad9dc' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m3 6 5 5 5-5'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 16px center;
  background-size: 16px;
}
```

Комментарий строки 212 объясняет, почему тут `background-color`, а не `background` — при переносе
значений FORM-04 это правило не ломать.

**Reduced motion.** В проекте один блок на весь репозиторий — `styles/global.css:289-314`:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }

  [data-anim], [data-anim]::before, [data-anim]::after { animation: none !important; }
}
```

Глобальная страховка уже гасит переходы 240ms/220ms из FORM-03/FORM-04, отдельный блок в
`light-form.css` под них не нужен. Заводить локальный `@media (prefers-reduced-motion: reduce)`
только если в форме появится собственный `@keyframes`; `global.css` фаза 9 не редактирует.

**Кнопка.** `.btn[data-beam][data-size="form"]` в `global.css:269-274` уже даёт `width: 100%`,
`min-height: 54px`, `padding: 14px 28px`. В своём CSS остаётся только `margin-top: 8px` на `.lf-submit`
и состояние `[aria-busy="true"]` (строки 330-337); дублировать ширину и высоту не надо.

---

### `src/components/form/LightForm.test.tsx` (test, сценарии)

**Аналог:** текущая версия.

**Поиск контролов по `name`, а не по id** (строки 33-70) — id уникальны на экземпляр, поэтому
хелперы такие:

```tsx
/** id полей теперь уникальны на экземпляр формы (useId), поэтому контролы ищем по name. */
function control(name: string): HTMLInputElement {
  const element = document.querySelector<HTMLInputElement>(`[name="${name}"]`);
  if (!element) {
    throw new Error(`Нет контрола ${name}`);
  }
  return element;
}

/** Текст ошибки поля: связь идёт через aria-describedby, а не через угаданный id. */
function errorFor(name: string): HTMLElement | null {
  const errorId = control(name).getAttribute("aria-describedby");
  return errorId === null ? null : document.getElementById(errorId);
}

function errorNodes(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>(".lf-error"));
}
```

**Обвязка провайдером и зонд состояния** (строки 9-31): `LightsProvider` + `CountsProbe`, счётчики
читаются из контекста, карта не рендерится.

**Фейковые таймеры и `matchMedia`** (строки 96-117) — отправка ждёт 1200 мс:

```tsx
beforeEach(() => {
  vi.useFakeTimers();
  mockReducedMotion(false);
});

afterEach(() => {
  vi.useRealTimers();
});

act(() => { vi.advanceTimersByTime(1200); });
```

**Роли для запросов**: `screen.getByRole("radio", { name: /Групповой маяк/ })`,
`screen.getByRole("button", { name: /Зажечь свой свет/ })`, `screen.getByRole("status")`,
`screen.getByRole("heading", { level: 2, name: formCopy.title })`. Тост ищется по классу
(`.lf-toast`), потому что он `aria-hidden` (строки 76-79).

**Что в этих тестах поедет от изменений фазы** (счётчики зашиты числами, планировать правку заранее):
- строка 131: `expect(individual).toBeChecked()` — при `type: ""` ни одна карточка не выбрана;
- строки 181: `expect(ids).toHaveLength(18)` («девять на форму») — `orgName` добавляет id;
- строка 190: `expect(controls).toHaveLength(8)` — то же;
- строки 215-232, 254: «шесть ошибок» на пустой отправке — станет семь (плюс тип);
- `fillIndividual` (строки 468-475) полагается на тип по умолчанию — теперь нужен клик по «Личный свет».

**Для новых сценариев переключения** (`group` → появилось поле → `individual` → исчезло) взять
`userEvent` как в `resources/Resources.test.tsx:1-2, 52-70`:

```tsx
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
```

Оговорка: с `vi.useFakeTimers()` `userEvent` нужно создавать через
`userEvent.setup({ advanceTimers: vi.advanceTimersByTime })`, иначе он зависнет; там, где хватает
`fireEvent`, оставаться на нём — так написан весь текущий файл.

---

### `src/components/form/LightForm.failure.test.tsx` (test, ветка отказа)

**Аналог:** текущая версия. Копировать целиком мок контекста (строки 6-20):

```tsx
const addLight = vi.fn(() => false);

vi.mock("../../state/lights", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../state/lights")>();

  return {
    ...actual,
    useLights: () => ({ lights: [], counts: { people: 0, groups: 0 }, addLight }),
  };
});
```

Здесь `render(<LightForm />)` идёт без провайдера — контекст замокан. `fillValidForm` (строки 31-40)
не выбирает тип света: после перехода на `type: ""` форма не дойдёт до `addLight`, поэтому в хелпер
надо добавить клик по радио, иначе оба теста файла станут красными.

---

### `src/data/copy.form.ts` (data, static config)

**Аналог:** он же; типизированный вариант — `data/copy.involve.ts:1-17`.

**Текущая форма модуля** (строки 1-3, 29-37): плоский `as const`-объект, комментарий-шапка на русском,
ошибки отдельным вложенным объектом — из него читает и компонент, и `validation.ts`:

```ts
/** Тексты секции «Зажгите свой свет». Живут отдельно от copy.ts: форма растёт своим темпом. */
export const formCopy = {
  eyebrow: "Участвуйте с нами",
  ...
  errors: {
    firstName: "Введите имя",
    countryId: "Выберите страну",
    consent: "Нужно согласие на обработку данных",
  },
} as const;
```

Соседний стиль с явными интерфейсами (`copy.involve.ts:1-17`) — если понадобится типизировать
структуру полей:

```ts
export interface InvolveCardCopy {
  id: InvolveCardId;
  title: string;
  action: string;
  href: "#about" | "#resources" | "#resources-materials" | "#news";
}
```

Порядок правок: сначала новые строки (`types.*`, `fields.orgName`, `errors.type`, `errors.orgName`,
`required*`) в `copy.form.ts`, потом `validation.ts` — он импортирует `formCopy.errors` (validation.ts:2, 54).

---

### `src/lib/validation.ts` (utility, transform)

**Аналог:** он же.

**Типы и порядок фокуса** (строки 6-31) — точка приложения FORM-01:

```ts
export type LightType = "individual" | "group";

export interface LightFormValues {
  type: LightType;          // → LightType | ""
  firstName: string;
  ...
}

export type LightFormField = Exclude<keyof LightFormValues, "type">;   // ← "type" придётся впустить
export type LightFormErrors = Partial<Record<LightFormField, string>>;

/** Порядок полей в разметке: по нему ищется первое невалидное поле для фокуса. */
export const LIGHT_FORM_FIELD_ORDER: readonly LightFormField[] = [
  "firstName", "lastName", "countryId", "city", "email", "consent",
];
```

Новый порядок из CONTEXT: `type → orgName → firstName → lastName → countryId → city → email → consent`.

**Стиль проверок** (строки 47-85): чистая функция, ранние `if`, сообщения только из `formCopy.errors`,
комментарий там, где решение неочевидно:

```ts
const MIN_TEXT_LENGTH = 2;

/** Чистая проверка: ни DOM, ни сети, аргумент не меняется. Пустой объект означает «валидно». */
export function validateLightForm(values: LightFormValues): LightFormErrors {
  const errors: LightFormErrors = {};

  if (values.firstName.trim().length < MIN_TEXT_LENGTH) {
    errors.firstName = formCopy.errors.firstName;
  }

  // Членство в справочнике проверяем здесь: дальше id уходит в createLight, а тот
  // на неизвестной стране бросает исключение прямо внутри reducer'а.
  const countryId = Number(values.countryId);
  if (values.countryId.trim() === "" || !Number.isInteger(countryId) || countryById(countryId) === undefined) {
    errors.countryId = formCopy.errors.countryId;
  }

  return errors;
}
```

`orgName` проверять только при `values.type === "group"` — иначе личный свет никогда не отправится.

**`toLightType`** (строки 43-45) остаётся мостом в тип карты; при `type: ""` до него доходить нельзя —
валидация обязана отсечь раньше, либо сигнатура сужается до `LightType`.

---

### `src/lib/validation.test.ts` (test, unit)

**Аналог:** он же.

**Каркас**: один валидный набор наверху, дальше точечные `{ ...valid, поле }` (строки 10-18, 46-51):

```ts
const valid: LightFormValues = {
  type: "group",
  firstName: "Иван",
  lastName: "Иванов",
  countryId: "643",
  city: "Москва",
  email: "ivan@example.org",
  consent: true,
};

expect(validateLightForm({ ...valid, firstName: " И " }).firstName).toBe("Введите имя");
expect(validateLightForm({ ...valid, firstName: "Иван" }).firstName).toBeUndefined();
```

**Чистота функции проверяется отдельным тестом** (строки 40-44) — сохранить:

```ts
it("не трогает переданный объект значений", () => {
  const values = { ...initialLightFormValues };
  validateLightForm(values);
  expect(values).toEqual(initialLightFormValues);
});
```

**Перечисление ключей ошибок** (строки 21-38) — «шесть ошибок» станет семью-восемью, сортированный
список ключей обновляется там же. Строки-сообщения в тесте зашиты литералами, а не через `formCopy`:
это намеренно (тест ловит подмену текста), новые сообщения писать так же.

---

## Shared Patterns — сквозные приёмы

### Шапка секции
**Источник:** `src/components/form/LightForm.tsx:148-156`, `src/components/layout/Section.tsx:26-38`
**Куда:** `LightForm.tsx`
`Section` даёт `id`, `aria-labelledby` и контейнер 72rem; `Reveal` — каскад появления; `Eyebrow`
(`layout/Eyebrow.tsx`) уже красит надзаголовок в `text-horizon-200`; `GradientTitle variant="section"`
не менять.

### Связка «поле — ошибка — aria»
**Источник:** `FormField.tsx:27-45`, `ConsentCheckbox.tsx:20-54`
**Куда:** все контролы, включая новый fieldset типа и `orgName`
Правило одно: `const errorId = \`${id}-error\``, `aria-invalid` и `aria-describedby` ставятся только
при наличии ошибки (`undefined`, а не `false`/`""`), текст ошибки — `<p className="lf-error" id={errorId}>`.

### Пара «значок для глаза / текст для скринридера»
**Источник:** `Counters.tsx:35-37`, `Footer.tsx:25`, `Quote.tsx:22-24`
**Куда:** звёздочка обязательного поля, sr-only `<legend>` группы типа
Видимая часть — `aria-hidden="true"`, рядом `<span className="sr-only">` с русским текстом из copy-модуля.

### id от родителя для вложенного контрола
**Источник:** `ConsentCheckbox.tsx:7-19` + вызов `LightForm.tsx:267-273`
**Куда:** `LightTypeChoice` (чтобы `focusInForm` доставал первую радио-кнопку)

### CSS-конвенции секции
**Источник:** `light-form.css:1-34`, `involve/involve.css:1-22`
**Куда:** `light-form.css`
Локальные токены на корневом классе; цвета литералами `rgb(r g b / a)` (значения оригинала, не токены
`--color-midnight-*`); классы `lf-*` в kebab-case без вложенности; `@media (min-width: 768px)` и
`@media (hover: hover)` сразу после базового правила; комментарии на русском объясняют «почему», а не «что».

### Reduced motion
**Источник:** `src/styles/global.css:289-348`
**Куда:** все анимации формы
Один блок на репозиторий гасит переходы и анимации; декоративные петли помечаются `data-anim` из
закрытого списка. Фаза 9 `global.css` не трогает: новые переходы 220-240ms покрыты глобальной
страховкой, локальный блок нужен только под собственные `@keyframes`.

### Кнопка отправки
**Источник:** `layout/Button.tsx:4-14`, `primitives.css:44-75`, `global.css:269-274`
**Куда:** `LightForm.tsx` (вызов не меняется), `light-form.css`
```tsx
<Button as="button" type="submit" variant="primary" size="form" id={submitId} className="lf-submit"
        disabled={submitting} aria-busy={submitting || undefined}>
```
`size="form"` уходит в `data-size="form"` и уже даёт `width: 100%; min-height: 54px; padding: 14px 28px`.

### Тесты
**Источник:** `LightForm.test.tsx:24-117`, `LightForm.failure.test.tsx:11-20`, `Resources.test.tsx:1-33`
**Куда:** оба тест-файла формы
Хелперы `control(name)` / `errorFor(name)` / `errorNodes()`; запросы по ролям для видимого;
`document.querySelector` по классу для `aria-hidden`-узлов; `vi.useFakeTimers()` в `beforeEach` и
`vi.useRealTimers()` в `afterEach`; `act(() => vi.advanceTimersByTime(1200))` вокруг отправки;
`vi.mock` контекста — только в файле `.failure.`.

---

## Conventions — конвенции репозитория

Выведено детерминированно: `gsd-tools verify conventions --derive` (порог именованного контракта — доля ≥ 70%).

Область `src` (весь исходник):

| Ось | Dominant | Share | Entropy | Status |
|-----|----------|-------|---------|--------|
| file-name casing | — (Pascal 46 / other 55 / camel 29) | 42% | 0.971 | contested hotspot |
| identifier casing | camel | 70% | 0.887 | contested hotspot (на границе) |
| export style | esm | 100% | 0.000 | named contract |
| import style | esm | 100% | 0.000 | named contract |

Область `src/components/form` (файлы фазы):

| Ось | Dominant | Share | Entropy | Status |
|-----|----------|-------|---------|--------|
| file-name casing | Pascal (5 из 8) | 63% | 0.954 | contested hotspot |
| identifier casing | camel | 74% | 0.824 | named contract |
| export style | esm (5) | — | — | insufficient-data |
| import style | esm | 100% | 0.000 | named contract |

**Contested hotspots (author's choice).** Прототип намеренно расщеплённой оси — двойной резолвер
CJS↔SDK в самом gsd: `bin/lib/**` живёт на CJS (`module.exports` / `require`), `sdk/src/**` — на ESM
(`export` / `import`); каждая половина внутри себя однородна, contested она только в масштабе всего
репозитория. Здесь такой же расклад по именам файлов: компоненты — `PascalCase.tsx`
(`LightForm.tsx`, `FormField.tsx`), CSS — kebab-case (`light-form.css`), модули `lib` и `data` —
camelCase с точками (`validation.ts`, `copy.form.ts`), тесты — имя носителя плюс `.test.tsx` и
дополнительный сегмент сценария (`LightForm.failure.test.tsx`). Не сводить эти половины к одному
стилю: подбирать локальный стиль каталога. Именованные контракты (ESM на импорт и экспорт) держатся
без исключений — новые файлы фазы пишутся только так.

Дополнительные конвенции, не покрытые осями:
- Все компоненты — именованные `export function Component()`; default-экспортов в `src/` нет.
- CSS импортируется первой строкой того компонента, который его владеет (`import "./light-form.css";`).
- Пользовательские строки не живут в JSX: только через `copy.*`-модули из `src/data/`.
- Комментарии и тексты тестов на русском, идентификаторы на английском.

---

## No Analog Found — приёмы без аналога в кодовой базе

| Файл | Роль | Поток | Причина |
|------|------|-------|---------|
| `LightForm.tsx` (условное поле `orgName`) | component | event-driven | В проекте нет формы с полем, зависящим от другого поля. Частичные опоры: `withoutField` (`LightForm.tsx:28-32`) для сброса ошибки и условный рендер панели с возвратом фокуса в `resources/ResourcePanel.tsx`. Решение (условный рендер vs `hidden`) отдано на усмотрение по CONTEXT. |
| `LightTypeChoice.tsx` (ошибка на уровне `fieldset`) | component | transform | Ошибок у группы контролов в проекте ещё не было: все `aria-describedby` висят на одиночных полях. Ближайший образец связки — `FormField.tsx:27-45`, но перенос на `<fieldset>` делается впервые. |
| `light-form.css` (`::before`-маячок карточки типа) | styles | — | Точного аналога нет; техника декоративного `::before` с радиальными градиентами и переменными взята из `involve/involve.css:24-41` и орба `light-form.css:36-50`. |

---

## Metadata

**Область поиска аналогов:** `src/components/form`, `src/components/layout`, `src/components/involve`,
`src/components/resources`, `src/components/map`, `src/components/quote`, `src/data`, `src/lib`, `src/styles`, `src/test`
**Прочитано файлов:** 22 (из них 10 — файлы фазы)
**Дата извлечения паттернов:** 2026-09-06
