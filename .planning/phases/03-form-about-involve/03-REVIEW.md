---
phase: 03-form-about-involve
reviewed: 2026-09-05T16:19:57Z
depth: standard
files_reviewed: 28
files_reviewed_list:
  - src/components/about/About.tsx
  - src/components/about/About.test.tsx
  - src/components/about/StepCard.tsx
  - src/components/about/VideoEmbed.tsx
  - src/components/about/VideoEmbed.test.tsx
  - src/components/about/about.css
  - src/components/about/video-embed.css
  - src/components/form/LightForm.tsx
  - src/components/form/LightForm.test.tsx
  - src/components/form/LightTypeChoice.tsx
  - src/components/form/FormField.tsx
  - src/components/form/ConsentCheckbox.tsx
  - src/components/form/SuccessToast.tsx
  - src/components/form/light-form.css
  - src/components/involve/Involve.tsx
  - src/components/involve/Involve.test.tsx
  - src/components/involve/InvolveCard.tsx
  - src/components/involve/art/PersonalArt.tsx
  - src/components/involve/art/SharingArt.tsx
  - src/components/involve/art/ToolkitArt.tsx
  - src/components/involve/involve.css
  - src/data/about.ts
  - src/data/about.test.ts
  - src/data/copy.about.ts
  - src/data/copy.form.ts
  - src/data/copy.involve.ts
  - src/lib/validation.ts
  - src/lib/validation.test.ts
findings:
  critical: 1
  warning: 9
  info: 13
  total: 23
status: issues_found
---

# Фаза 3: отчёт code review

**Проверено:** 2026-09-05T16:19:57Z
**Глубина:** standard
**Файлов:** 28
**Статус:** issues_found

## Сводка

Проверил форму «Зажгите свой свет», секцию About с фасадом YouTube и триптих Involve. Инструменты проекта зелёные: `npx tsc -p tsconfig.app.json --noEmit` без ошибок, `npx eslint` по файлам фазы молчит, `npx vitest run` по шести файлам фазы даёт 30 passed. Зелёные тесты тут ничего не доказывают: половина найденного лежит ровно в тех местах, которые тесты не трогают.

Инъекций, секретов, `eval`, `dangerouslySetInnerHTML` нет. Единственная подстановка во внешний URL — `videoId` в `VideoEmbed`, и она идёт без кодирования (WR-05). Загрузку постера с `img.youtube.com` не считаю замечанием: она прямо разрешена в CLAUDE.md (раздел Stack, «используем SVG-графику и `img.youtube.com`»).

Главная проблема — единственное подтверждение успеха формы (тост) недоступно скринридерам (CR-01). Дальше идут три дефекта времени жизни: окно в 1200 мс, где форма принимает ввод и потом молча его стирает (WR-01); скрытая зависимость `SuccessToast` от мемоизации `onClose` у вызывающего (WR-02); дублирование id согласия двумя источниками (WR-03). Отдельным блоком — системное дублирование Tailwind-утилит и рукописного CSS (WR-06): unlayered CSS всегда выигрывает у слоя `utilities`, поэтому правки классов в JSX молча не действуют.

## Критичные

### CR-01: успех формы не озвучивается скринридером

**Файл:** `src/components/form/SuccessToast.tsx:85-92`, `src/components/form/LightForm.tsx:262-267`
**Проблема:** `role="status"`-контейнер монтируется в `document.body` уже с текстом внутри — регион и его содержимое приходят одной мутацией DOM. NVDA, JAWS и VoiceOver в этом случае объявление, как правило, не читают: live-region должен существовать в DOM *до* появления текста. Тост — единственное подтверждение отправки: после успеха форма молча очищается (`LightForm.tsx:113-116`), фокус уезжает на сабмит с прежней надписью «Зажечь свой свет», ошибок нет. Незрячий пользователь не может отличить успешную отправку от «ничего не произошло». Тесты этого не ловят: `LightForm.test.tsx:198` проверяет только наличие узла с `role="status"`.
**Исправление:** держать пустой live-region смонтированным всегда и менять только текст.

```tsx
// LightForm.tsx — рядом с формой, монтируется один раз
<p className="sr-only" role="status" aria-live="polite">
  {toastOpen ? formCopy.success : ""}
</p>

// SuccessToast.tsx — визуальная карточка становится чисто декоративной
<div className="lf-toast ..." data-state={closing ? "closing" : "open"} aria-hidden="true" onClick={requestClose}>
```

## Предупреждения

### WR-01: во время «отправки» форма принимает ввод, потом стирает его и забирает фокус

**Файл:** `src/components/form/LightForm.tsx:59-67`, `110-120`
**Проблема:** на 1200 мс блокируется только кнопка (`disabled={submitting}`), поля остаются активными. Пользователь успевает уйти в другое поле и печатать; по таймеру `setValues({ ...initialLightFormValues, type: values.type })` затирает всё введённое (`values` захвачен на момент сабмита), а эффект строк 60-67 безусловно вызывает `focus()` на кнопке и выдёргивает фокус из поля, где идёт набор. Переключение радио «тип света» в этом окне тоже молча откатывается на значение с момента отправки.
**Исправление:** заблокировать всю группу полей на время отправки и возвращать фокус только если пользователь его не перехватил.

```tsx
<fieldset disabled={submitting} className="contents">…поля формы…</fieldset>

useEffect(() => {
  if (submitting || !returnFocus.current) return;
  returnFocus.current = false;
  const active = document.activeElement;
  if (active === null || active === document.body) {
    document.getElementById(SUBMIT_ID)?.focus();
  }
}, [submitting]);
```

### WR-02: LiveToast залипает, если `onClose` или `duration` меняют идентичность

**Файл:** `src/components/form/SuccessToast.tsx:55-83`
**Проблема:** эффект зависит от `[duration, requestClose]`, а `requestClose` — от `onClose`. Любая смена идентичности `onClose` (обычный инлайн `onClose={() => setOpen(false)}`) запускает cleanup: он гасит `closeTimer` и обнуляет ref, но `closing` остаётся `true`. Карточка при этом уже под `animation: lf-toast-out … both` (`light-form.css:337-339`), то есть `opacity: 0` с `pointer-events: auto` (`light-form.css:332`) — невидимый перехватчик кликов внизу экрана. Автотаймер стартует заново с полного `duration`, поэтому залипание длится ещё до 4 с, а при частых ререндерах — бесконечно. Сейчас не воспроизводится только потому, что `LightForm` мемоизирует `closeToast` (`LightForm.tsx:123`): корректность компонента скрыто зависит от дисциплины вызывающего.
**Исправление:** снять `requestClose` из зависимостей автотаймера и не трогать `closeTimer` в его cleanup.

```tsx
const requestCloseRef = useRef(requestClose);
useEffect(() => { requestCloseRef.current = requestClose; });

useEffect(() => {
  const autoTimer = setTimeout(() => requestCloseRef.current(), duration);
  return () => clearTimeout(autoTimer);
}, [duration]);

// отдельный размонтирующий cleanup для closeTimer
useEffect(() => () => { if (closeTimer.current !== null) clearTimeout(closeTimer.current); }, []);
```

### WR-03: id чекбокса согласия задан двумя независимыми источниками

**Файл:** `src/components/form/ConsentCheckbox.tsx:3`, `src/components/form/LightForm.tsx:28-30`, `105`
**Проблема:** `LightForm` ищет поле через `fieldId("consent")` → `"light-form-consent"`, а `ConsentCheckbox` объявляет свой `CONSENT_ID = "light-form-consent"` отдельной константой. Совпадение держится на честном слове. Переименование в любом из файлов не ломает ни типы, ни ESLint: `document.getElementById(...)?.focus()` из-за `?.` молча ничего не сделает, и при невалидном согласии фокус просто не поедет. Ни один тест не сравнивает эти два источника.
**Исправление:** передавать id сверху — `<ConsentCheckbox id={fieldId("consent")} …>` — либо экспортировать одну константу из `validation.ts` и использовать её в обоих файлах.

### WR-04: countryId не проверяется на принадлежность справочнику, `createLight` бросает исключение

**Файл:** `src/lib/validation.ts:60-62`, `src/components/form/LightForm.tsx:112`
**Проблема:** валидация требует только `countryId !== ""`. Дальше `Number(values.countryId)` уходит в `addLight`, а `createLight` на неизвестном id бросает `Error("Unknown ESD country: …")` (`src/state/lights.tsx:56-59`). Бросок происходит внутри reducer'а, ErrorBoundary в `App.tsx` нет — приложение падает в белый экран. Значение `select` меняется не только пользователем: расширение браузера, autofill, DevTools или будущая правка справочника (`ESD_COUNTRIES` и список `<option>` расходятся) выводят на этот путь.
**Исправление:** сделать проверку членства частью чистой валидации.

```ts
import { countryById } from "../data/countries";

const parsedCountry = Number(values.countryId);
if (values.countryId === "" || !Number.isInteger(parsedCountry) || !countryById(parsedCountry)) {
  errors.countryId = formCopy.errors.countryId;
}
```

### WR-05: videoId подставляется в URL без кодирования и без проверки формата

**Файл:** `src/components/about/VideoEmbed.tsx:31`, `47`
**Проблема:** `videoId` — публичный проп компонента, а не константа. Он вклеивается в две строки URL сырым: `…/embed/${videoId}?autoplay=1&rel=0` и `…/vi/${videoId}/hqdefault.jpg`. Значение вида `abc?list=X&` или `abc/../../watch` меняет путь и query итогового адреса. Схема захардкожена, поэтому до `javascript:` не дойти, но подмена параметров эмбеда и обход `nocookie`-пути реальны, а компонент заявлен как переиспользуемый.
**Исправление:** проверить формат id и кодировать подстановку.

```tsx
const YT_ID_RE = /^[\w-]{11}$/;
if (!YT_ID_RE.test(videoId)) return null;
const safeId = encodeURIComponent(videoId);
```

### WR-06: Tailwind-утилиты и рукописный CSS объявляют одни и те же свойства

**Файл:** `src/components/form/LightForm.tsx:132`, `135`, `136`; `src/components/about/About.tsx:13`, `27`; `src/components/involve/Involve.tsx:30`; `src/components/involve/InvolveCard.tsx:22`; `src/components/form/SuccessToast.tsx:87`
**Проблема:** одни и те же элементы получают свойство дважды. `lf-card mx-auto max-w-4xl` при `.lf-card { max-width: 56rem; margin-inline: auto }`; `lf-form flex flex-col gap-8` при `.lf-form { display: flex; flex-direction: column; gap: 32px }`; `ab-steps … grid gap-6 lg:grid-cols-3` при `.ab-steps` с теми же правилами; `lf-toast … fixed inset-x-0 bottom-6 z-[60] flex justify-center` при `.lf-toast` с полным набором тех же свойств; `inv-body … gap-4 p-8` при `.inv-body { gap: 16px; padding: 32px }`. Tailwind v4 кладёт утилиты в `@layer utilities`, а файлы `*.css` подключаются вне слоёв — unlayered CSS выигрывает всегда, независимо от порядка импорта и специфичности. Разработчик, который поменяет `max-w-4xl` на `max-w-5xl` или `gap-4` на `gap-6`, не увидит никакого эффекта и потратит время на поиск причины.
**Исправление:** оставить один источник на свойство. Отступы, ширины и раскладку, которые уже описаны в `*.css`, из JSX убрать; в JSX оставить только то, чего в CSS нет (`mt-12`, `mt-6`, `text-center`).

### WR-07: фиксированные глобальные DOM id плюс поиск через `document.getElementById`

**Файл:** `src/components/form/LightForm.tsx:26`, `28-30`, `66`, `105`; `src/components/form/ConsentCheckbox.tsx:3-4`
**Проблема:** все id формы — модульные константы (`light-form-firstName`, `light-form-consent`, `light-form-submit`). Второй экземпляр `LightForm` на странице (повторный блок в лендинге, storybook, тест с двумя рендерами) даёт дубли id: `htmlFor` и `aria-describedby` начинают указывать на первый экземпляр, `getElementById` уводит фокус в чужую форму. Поиск идёт по всему документу, а не по поддереву компонента.
**Исправление:** взять `useId()` из React 19 как префикс (`const uid = useId(); const fieldId = (f) => \`${uid}-${f}\``) и держать ссылки на контролы в `useRef`, а не искать их в документе.

### WR-08: пустое утверждение в тесте Involve создаёт ложную уверенность

**Файл:** `src/components/involve/Involve.test.tsx:49`
**Проблема:** `expect((article as HTMLElement).onclick).toBeNull()` не может провалиться. React 17+ вешает обработчики делегированием на корневой контейнер и никогда не пишет в свойство `onclick` DOM-узла — оно останется `null`, даже если в `InvolveCard` добавить `<article onClick={…}>`. Тест называется «не делает кликабельной всю карточку», но именно эту регрессию он не поймает.
**Исправление:** проверять поведение, а не свойство узла.

```tsx
const onCardClick = vi.fn();
document.addEventListener("click", onCardClick);
fireEvent.click(article);
// либо: убедиться, что клик по article вне ссылки не меняет location
expect(article.querySelectorAll("button, [role='button']")).toHaveLength(0);
```

### WR-09: тост закрывается только мышью

**Файл:** `src/components/form/SuccessToast.tsx:86-92`
**Проблема:** `onClick` висит на `div` без роли кнопки, без `tabIndex` и без обработчика клавиатуры; Escape не обрабатывается. Пользователь клавиатуры не может убрать сообщение — только ждать 4 с. Плюс родитель под `pointer-events-none`, поэтому кликабельна лишь сама карточка, а не «любая точка», как обещает комментарий на строке 19.
**Исправление:** повесить `keydown`-слушатель на `document` для Escape внутри `LiveToast` и не давать `onClick` неинтерактивному узлу с `role="status"` (см. развязку в CR-01: интерактив уезжает на декоративный слой, объявление — в отдельный live-region).

## Информационные

### IN-01: мёртвое правило `.inv-triptych::before` — опечатка в селекторе

**Файл:** `src/components/involve/involve.css:149-151`
**Проблема:** свечение объявлено на `.inv-triptych-wrap::before` (строка 25), а гасится на `.inv-triptych::before` — у этого псевдоэлемента нет `content`, он не создаётся. Правило не делает ничего. Заодно оно и не нужно: `.inv-triptych-wrap::before` по умолчанию `display: none` и включается только на `min-width: 1024px`.
**Исправление:** удалить блок.

### IN-02: мёртвые объявления в about.css

**Файл:** `src/components/about/about.css:3`, `102`
**Проблема:** `--focus-ring: #aad9dc` на `.ab-section` нигде в файле не используется (в секции нет фокусируемых элементов со своим кольцом). `transform-origin: left` на `.ab-step-rule` не влияет ни на что: анимируется `width`, `transform` у элемента нет.
**Исправление:** удалить обе строки.

### IN-03: `StepCardProps` дублирует `AboutStep` с более слабым типом

**Файл:** `src/components/about/StepCard.tsx:3-8`, `src/data/about.ts:1-6`
**Проблема:** два описания одной сущности: у данных `items: readonly [string, string, string]`, у компонента `items: readonly string[]`. Инвариант «ровно три пункта» держится только тестом `about.test.ts:12`.
**Исправление:** `export type StepCardProps = AboutStep;` и импорт типа из `../../data/about`.

### IN-04: ключ списка по тексту пункта

**Файл:** `src/components/about/StepCard.tsx:19`
**Проблема:** `key={item}` ломается на двух одинаковых строках в одном шаге — React выдаст предупреждение о дубле ключа. Данные сейчас уникальны, но это свойство контента, а не кода.
**Исправление:** `key={index}` (список статический, переупорядочивания нет).

### IN-05: половинчатая защита `window` в `wantsInstantClose`

**Файл:** `src/components/form/SuccessToast.tsx:11-14`
**Проблема:** `typeof window.matchMedia === "function"` защищает метод, но само обращение к `window` не защищено — в среде без `window` это `ReferenceError`, а не `undefined`. Проверка выглядит защитной, но защищает не от того.
**Исправление:** `typeof window !== "undefined" && typeof window.matchMedia === "function"`.

### IN-06: `toHaveTextContent` сравнивает по подстроке

**Файл:** `src/components/form/LightForm.test.tsx:152`, `186`, `192-193`
**Проблема:** `toHaveTextContent("248")` пройдёт и на «1248», и на «2480». Это ключевые утверждения теста успешной отправки (счётчик вырос на единицу).
**Исправление:** `toHaveTextContent(/^249$/)`.

### IN-07: `autoComplete="country-name"` на select с числовыми значениями

**Файл:** `src/components/form/LightForm.tsx:190`
**Проблема:** значения опций — числовые коды M49 (`"643"`), а токен `country-name` описывает текстовое имя страны. Автозаполнение либо промахнётся, либо совпадёт по тексту опции случайно.
**Исправление:** убрать атрибут или взять `autoComplete="country"` и согласовать его со значением опции.

### IN-08: порядок полей для фокуса продублирован вручную

**Файл:** `src/lib/validation.ts:23-30`, `src/components/form/LightForm.tsx:142-246`
**Проблема:** `LIGHT_FORM_FIELD_ORDER` повторяет порядок разметки. Перестановка полей в JSX не ломает ни типы, ни тесты — фокус после неудачного сабмита просто уедет не туда.
**Исправление:** в `LightForm.test.tsx` добавить утверждение, что порядок `LIGHT_FORM_FIELD_ORDER` совпадает с порядком `[id^="light-form-"]` в DOM.

### IN-09: мок `window.matchMedia` не восстанавливается

**Файл:** `src/components/form/LightForm.test.tsx:64-84`
**Проблема:** `mockReducedMotion` перезаписывает глобал напрямую, `afterEach` возвращает только таймеры. Внутри файла спасает `beforeEach`, но привычка хрупкая: любой новый `describe` без `beforeEach` унаследует мок предыдущего теста.
**Исправление:** `vi.stubGlobal("matchMedia", …)` плюс `vi.unstubAllGlobals()` в `afterEach`.

### IN-10: молчаливый fallback в `toLightType`

**Файл:** `src/lib/validation.ts:42-44`
**Проблема:** `type === "group" ? "group" : "person"` — добавление третьего типа света отобразится в «person» без ошибки компиляции.
**Исправление:** `const MAP: Record<LightType, MapLightType> = { individual: "person", group: "group" }; return MAP[type];`.

### IN-11: секции обходят props `eyebrow` и `title` примитива Section

**Файл:** `src/components/about/About.tsx:13-19`, `src/components/involve/Involve.tsx:22-28`, `src/components/form/LightForm.tsx:127-133`
**Проблема:** `Section` умеет рендерить надзаголовок и H2 сам (`Section.tsx:22-27`), и `primitives.test.tsx:11` эту ветку проверяет. Все три секции фазы 3 передают `Eyebrow`/`GradientTitle` детьми, повторяя `as="h2" variant="section" className="mt-2"` в трёх местах. Props примитива в новом коде остались мёртвыми.
**Исправление:** либо пользоваться `<Section id="about" eyebrow={…} title={…}>`, либо убрать неиспользуемые props из `Section` — сейчас в кодовой базе живут оба способа.

### IN-12: комментарий расходится с поведением

**Файл:** `src/components/form/SuccessToast.tsx:19`
**Проблема:** «закрывается по таймеру или по клику в любую точку» — на обёртке стоит `pointer-events-none` (`SuccessToast.tsx:87`, `light-form.css:322`), кликабельна только карточка.
**Исправление:** «закрывается по таймеру или по клику по карточке».

### IN-13: дублированная inline-SVG галочка

**Файл:** `src/components/form/ConsentCheckbox.tsx:33-42`, `src/components/form/SuccessToast.tsx:95-104`
**Проблема:** идентичный `path d="M1 6.2 4.4 9.4 11 2.6"` с тем же набором атрибутов скопирован в два компонента.
**Исправление:** вынести в `CheckIcon` рядом с примитивами.

## Соглашения (CONVENTION)

Прогнал `gsd-tools.cjs verify conventions --check` по файлам фазы. Пакет вернул 11 находок вида «identifier casing is Pascal (About) → rename to camel case» — все ложные: PascalCase обязателен для React-компонентов и совпадает с остальной кодовой базой. В отчёт не переношу.

Единственное реальное отклонение по соглашениям — IN-11 (два способа собирать заголовок секции). Формально это CONVENTION-уровень: не блокирует, рекомендуется свести к одному способу.

---

_Reviewed: 2026-09-05T16:19:57Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
