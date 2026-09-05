---
phase: 06-original-fidelity
reviewed: 2026-09-06T00:12:00Z
depth: standard
files_reviewed: 24
files_reviewed_list:
  - src/components/layout/Header.tsx
  - src/components/layout/Header.css
  - src/components/layout/Header.test.tsx
  - src/components/layout/MobileMenu.tsx
  - src/components/layout/BurgerButton.tsx
  - src/components/layout/Wordmark.tsx
  - src/components/layout/Button.tsx
  - src/components/layout/primitives.test.tsx
  - src/components/layout/Footer.css
  - src/lib/useHeaderHide.ts
  - src/lib/useHeaderHide.test.ts
  - src/lib/breakpoints.ts
  - src/lib/scrollLock.ts
  - src/styles/global.css
  - src/styles/tokens.css
  - src/styles/motionPolicy.test.ts
  - src/components/hero/Hero.tsx
  - src/components/hero/hero.css
  - src/components/map/MapSection.tsx
  - src/components/map/map.css
  - src/components/form/light-form.css
  - src/components/about/about.css
  - src/components/involve/involve.css
  - src/components/news/news.css
  - src/components/news/News.tsx
  - src/components/resources/resources.css
  - src/components/resources/Resources.tsx
  - src/components/resources/Resources.test.tsx
  - src/components/quote/Quote.tsx
  - src/data/copy.involve.ts
findings:
  critical: 3
  warning: 6
  info: 10
  total: 19
status: issues_found
---

# Phase 6: Отчёт код-ревью

**Reviewed:** 2026-09-06T00:12:00Z
**Depth:** standard
**Files Reviewed:** 24 (плюс сопутствующие тесты и `src/lib`)
**Status:** issues_found

## Summary

`npm test` даёт 368 зелёных тестов в 44 файлах, `npm run lint` молчит. Инварианты фаз 1–5 держатся: блок `prefers-reduced-motion` в проекте один, реестр `data-anim` закрыт, `outline: none` нигде нет, `<p>` внутри `<button>` нет, `RevealGroup key={result.page}` в новостях на месте, `useMapZoom` пересоздаёт поведение на ресайзе и не теряет трансформ.

Три дефекта я считаю блокирующими. Два из них родила именно эта фаза. Перенос оверлея внутрь пилюли (коммит `2677b94`) поставил фиксированный оверлей под трансформируемого предка: пока шапка уезжает или стоит спрятанной, `.mobile-menu` считает координаты от пилюли, а не от вьюпорта. Deep link `#resources-materials` из триптиха срабатывает один раз за жизнь страницы: `Resources` слушает только `hashchange`, а повторный клик по той же ссылке события не рождает. Третий дефект пришёл вместе со скрытием шапки: спрятанная шапка держит логотип, пункты и бургер в порядке табуляции при `opacity: 0` за экраном.

Отдельно стоит `isolation: isolate` на `.site-header__content`. По Filter Effects это backdrop root, и оба `backdrop-filter` под ним (стекло пилюли и оверлей меню) перестают видеть страницу. Требование FID-01 просило именно стекло оригинала.

Остальное — дубли селекторов после переезда фонов, мёртвые правила, магические числа высоты шапки и один вакуумный тест.

## Critical Issues

### CR-01: Трансформ шапки делает её containing block для фиксированного оверлея

**File:** `src/components/layout/Header.css:20-35`, `src/components/layout/Header.css:333-336`, `src/components/layout/Header.tsx:118-127`

**Issue:** `.mobile-menu` объявлен `position: fixed; inset: 0; height: 100svh` и лежит внутри `.site-header__content`, то есть внутри `.site-header`. По CSS Transforms 1 §3 любое значение `transform`, кроме `none`, создаёт containing block для всех потомков, включая `position: fixed`. У `.site-header` есть два состояния с трансформом:

```css
.site-header.is-header-hidden {
  transform: translateY(calc(-100% - 2rem));
}
```

и весь переход `transform var(--dur-header)` длиной 420 мс.

Шапка стоит без трансформа только в покое. Как только посетитель прокрутил вниз и открыл меню, `is-menu-open` возвращает `transform: none`, но CSS анимирует это возвращение 420 мс. Все 420 мс `.mobile-menu` раскладывается по коробке пилюли: ширина колонки 72rem, высота 72–88px, сдвиг на `-100% - 2rem` вверх. Полноэкранное меню превращается в полоску за краем экрана, потом рывком встаёт на место. Туда же в первый кадр уходит фокус: `MobileMenu` фокусирует первую ссылку сразу.

Как воспроизвести:
1. Прокрутить вниз (шапка спряталась), нажать Tab до бургера, нажать Enter.
2. Или: прокрутить вниз, прокрутить чуть вверх (шапка едет обратно) и в эти 420 мс тапнуть бургер.

Комментарий в шапке файла обещает обратное: «backdrop-filter и transform на самой ландмарке отрезали бы оверлей меню от вьюпорта». Слои с `backdrop-filter` вынесены на псевдоэлементы, а трансформ вернулся на саму ландмарку вместе со скрытием при прокрутке.

**Fix:** снять переход в момент открытия меню, чтобы трансформ схлопывался в `none` в том же пересчёте стилей, в котором оверлей получает `is-open`:

```css
/* Открытое меню держит шапку на экране в любом случае: кнопка закрытия —
   бургер — лежит в пилюле. Переход снят намеренно: пока transform едет к none,
   шапка остаётся containing block для фиксированного оверлея внутри неё. */
.site-header.is-menu-open {
  transform: none;
  opacity: 1;
  transition: none;
}
```

Регрессионный тест: в `Header.test.tsx` открыть меню из состояния `is-header-hidden` и проверить, что на шапке нет класса `is-header-hidden` и что `getComputedStyle` не отдаёт матрицу трансформа. В jsdom это ловится текстом класса, полную проверку добирает Playwright-smoke.

---

### CR-02: Deep link «Скачать материалы» работает один раз за загрузку страницы

**File:** `src/components/resources/Resources.tsx:62-75`, `src/data/copy.involve.ts:33`, `src/components/involve/InvolveCard.tsx:24`

**Issue:** карточка триптиха — обычная ссылка `<a href="#resources-materials">` без обработчика. Панель материалов раскрывает только слушатель `hashchange` в `Resources`. Браузер не шлёт `hashchange`, если адрес после клика совпадает с текущим.

Сценарий:
1. Клик по «Скачать материалы» → хэш меняется с пустого на `#resources-materials`, панель раскрывается, страница едет к секции.
2. Посетитель сворачивает панель кнопкой «Свернуть панель» → `active = null`, адрес остаётся `#resources-materials`.
3. Клик по той же карточке → адрес не меняется, события нет, панель закрыта, прокрутки нет. Ссылка молчит.

Элемента с `id="resources-materials"` в разметке нет, поэтому нативной прокрутки по якорю тоже не будет. Требование плана 06-04 «карточка ведёт на deep link и раскрывает панель» ломается на втором использовании.

**Fix:** чистить хэш перед переходом, чтобы клик всегда менял адрес:

```tsx
// InvolveCard.tsx
<a
  className="inv-action"
  href={href}
  onClick={() => {
    // Повторный клик по той же ссылке не рождает hashchange: сбрасываем адрес,
    // и переход по умолчанию снова меняет хэш.
    if (window.location.hash === href) {
      history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  }}
>
```

Либо принимать клик в самом `Resources` через делегирование на `a[href="#resources-materials"]`. Первый вариант короче и не тянет глобальный слушатель.

---

### CR-03: Спрятанная шапка держит логотип, пункты и бургер в порядке табуляции

**File:** `src/components/layout/Header.css:25-28`

**Issue:** скрытие описано через `transform` и `opacity: 0`. Ни то, ни другое не убирает элемент из последовательной навигации. После прокрутки вниз клавиатурный посетитель получает 5–6 остановок фокуса на элементах, которых не видит: ссылка вордмарка, четыре пункта меню (на ≥1024), бургер (на <1024). Кольцо `:focus-visible` рисуется за верхней границей экрана при нулевой прозрачности.

Это провал WCAG 2.4.7 Focus Visible и 2.4.11 Focus Not Obscured. Проект держит политику фокуса тестом `motionPolicy.test.ts` («нигде не снимает обводку фокуса»), но невидимый фокус этот тест не ловит.

**Fix:** возвращать шапку, как только фокус попадает внутрь:

```css
/* Фокус внутри спрятанной шапки возвращает её на экран: иначе кольцо
   :focus-visible рисуется за верхней границей вьюпорта. */
.site-header.is-header-hidden:focus-within {
  transform: none;
  opacity: 1;
}
```

Правило специфичнее `.is-header-hidden` (0,3,0 против 0,2,0), поэтому порядок в файле роли не играет. Дополнительно стоит подписать `useHeaderHide` на `focusin`, чтобы состояние React совпадало с картинкой.

## Warnings

### WR-01: `isolation: isolate` на пилюле гасит оба `backdrop-filter` под ней

**File:** `src/components/layout/Header.css:37-39`, `src/components/layout/Header.css:73-81`, `src/components/layout/Header.css:353-354`

**Issue:** по Filter Effects Level 2 элемент с `isolation: isolate` образует Backdrop Root. `backdrop-filter` фильтрует только то, что нарисовано внутри ближайшего backdrop root. Оба слоя с размытием живут внутри `.site-header__content`:

- `.site-header__content::after` — стекло пилюли, `blur(18px) saturate(135%)`;
- `.mobile-menu` — оверлей меню, `blur(24px) saturate(125%)` (переехал внутрь в коммите `2677b94`).

Ни один из них страницу под собой не видит. Пилюля показывает плоский `rgb(7 2 16 / .77)` поверх содержимого вместо матового стекла оригинала, а оверлей платит за композитный слой впустую (его фон и так на 97–98% непрозрачный).

Изоляция здесь избыточна: `.site-header` объявлен `position: fixed; z-index: 40` и уже создаёт стековый контекст, внутри которого работает пара бургер 42 / оверлей 40.

**Fix:** снять `isolation: isolate` со строки 39 и проверить порядок слоёв в браузере. Если стекло уедет под контент, поднять его через `z-index` внутри контекста самой ландмарки, а не через новый backdrop root. Замер: `blur` виден на границе пилюли и текста hero при прокрутке.

---

### WR-02: Переход по пункту меню прячет шапку

**File:** `src/lib/useHeaderHide.ts:39-84`, `src/components/layout/Header.tsx:43-63`

**Issue:** хук считает направление по событиям `scroll` и не отличает жест от программной прокрутки. `scrollToSection` зовёт `window.scrollTo({ behavior: "smooth" })`, эффект хука к этому моменту уже взял `lastY` из позиции до перехода. Плавная прокрутка вниз шлёт десятки событий, каждое из которых читается как «посетитель ушёл вниз», и шапка уезжает посреди перехода. Пользователь тапнул пункт меню и остался без шапки на целевой секции.

**Fix:** заглушить хук на время программной прокрутки. Проще всего экспортировать из `scrollToSection` момент старта и держать в хуке окно молчания:

```ts
// useHeaderHide.ts
const apply = () => {
  scheduled = false;
  const y = window.scrollY;
  if (performance.now() < suppressUntil) {
    lastY = y;
    return;
  }
  …
};
```

Где `suppressUntil` ставится из того же модуля, что вызывает `scrollTo`. Альтернатива без общего состояния: подписаться на `scrollend` и сбрасывать `lastY` там.

---

### WR-03: Логотип и десктоп-меню остаются в дереве доступности при открытом оверлее

**File:** `src/components/layout/MobileMenu.tsx:29-41`

**Issue:** эффект вешает `inert` на соседей `<header>`, то есть на `SkipLink`, `<main>` и футер. Всё, что внутри `<header>`, остаётся доступным: `.site-header__brand` и, при промежуточных ширинах, `.site-nav__link`. Оверлей закрывает их визуально.

Клавиатуру спасает ловушка Tab с `preventDefault`. Виртуальный курсор скринридера и свайп-навигация VoiceOver ловушку обходят: посетитель попадает на ссылку «Единый голос 27, на главную», которой не видит, и уходит на верх страницы вместо навигации по меню.

Тест `Header.test.tsx:355-366` проверяет только соседа-`main`, поэтому дырку не видно.

**Fix:** гасить и содержимое пилюли, кроме бургера:

```tsx
const inside = Array.from(
  header?.querySelectorAll<HTMLElement>(":scope > .site-header__content > :not(.site-header__toggler):not(.mobile-menu)") ?? [],
);
[...siblings, ...inside].forEach((element) => element.setAttribute("inert", ""));
```

Тест: открыть меню и проверить, что ссылка вордмарка получила `inert`, а бургер нет.

---

### WR-04: Тест дедзоны в `useHeaderHide.test.ts` проходит и без дедзоны

**File:** `src/lib/useHeaderHide.test.ts:62-71`

**Issue:** сценарий идёт 300 → 150 → 152. На шаге 150 хук уже выставил `hidden = false`, а на шаге 152 обе ветки (`return` дедзоны и `else`) дают тот же `false`. Убрать из `useHeaderHide.ts` строку `} else if (y > lastY - STEP) { return; }` — тест останется зелёным.

Настоящее назначение дедзоны: мелкое дрожание вверх не должно возвращать спрятанную шапку. Этот случай не покрыт.

**Fix:** переписать на дрожание в скрытом состоянии:

```ts
it("не возвращает шапку на дрожание в пару пикселей", () => {
  const { result } = renderHook(() => useHeaderHide({ menuOpen: false }));

  scrollTo(300);
  expect(result.current).toBe(true);

  scrollTo(298); // меньше STEP: шапка остаётся спрятанной
  expect(result.current).toBe(true);

  scrollTo(280); // больше STEP: шапка возвращается
  expect(result.current).toBe(false);
});
```

---

### WR-05: Тесты deep link бьют `hashchange` руками и потому не ловят CR-02

**File:** `src/components/resources/Resources.test.tsx:204-215`

**Issue:** тест меняет `window.location.hash` и сам диспатчит `new Event("hashchange")`. Браузер по клику на ссылку с текущим хэшем этого события не шлёт. Тест закрепляет поведение, которого в проде нет, и даёт ложную уверенность по требованию 06-04.

**Fix:** после починки CR-02 добавить сценарий с двумя кликами по настоящей ссылке:

```tsx
it("раскрывает панель и на повторный переход по той же ссылке", async () => {
  render(<><Involve /><Resources /></>);
  const link = screen.getByRole("link", { name: /Скачать материалы/ });

  await user.click(link);
  expect(panelRegion()).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Свернуть панель" }));
  await user.click(link);
  expect(panelRegion()).toBeInTheDocument();
});
```

---

### WR-06: Идентификатор оверлея задан литералом в двух местах

**File:** `src/components/layout/Header.tsx:13`, `src/components/layout/MobileMenu.tsx:131`

**Issue:** `Header` держит `const MENU_ID = "mobile-menu"` и отдаёт его в `aria-controls` бургера. `MobileMenu` пишет `id="mobile-menu"` собственной строкой и пропа не принимает. Правка одной строки без второй молча рвёт связь кнопки с диалогом: атрибут остаётся, ссылка становится битой, ни один тест на это не смотрит (оба проверяют одно и то же значение).

**Fix:** передавать id пропом:

```tsx
// Header.tsx
<MobileMenu id={MENU_ID} … />

// MobileMenu.tsx
type MobileMenuProps = { id: string; … };
<div ref={menuRef} id={id} …>
```

## Info

### IN-01: `.map-section` разбит на три блока в одном файле

**File:** `src/components/map/map.css:2-5`, `:251-262`, `:292-294`
**Issue:** после переезда фонов у секции три отдельных объявления, третье несёт единственное свойство `overflow-x: clip`. Читателю приходится собирать правило по кускам.
**Fix:** свести в один блок рядом с комментарием про ореолы.

### IN-02: `.lf-section` объявляет `overflow-x: clip` дважды

**File:** `src/components/form/light-form.css:27` и `:38-40`
**Issue:** второй блок — точный дубль первого свойства. Мёртвое правило, комментарий над ним описывает `::before`, а не саму секцию.
**Fix:** удалить блок 38-40, комментарий перенести к `.lf-section::before`.

### IN-03: `.map-empty a` объявлен дважды

**File:** `src/components/map/map.css:117-119` и `:137-141`
**Issue:** один селектор, два блока с разными свойствами и четырьмя строками между ними.
**Fix:** слить в один.

### IN-04: Блок кнопки в `prefers-reduced-motion` избыточен

**File:** `src/styles/global.css:337-340`
**Issue:** `Button` ставит на кнопку `data-anim="beam"`, поэтому правило `[data-anim], [data-anim]::before, [data-anim]::after { animation: none !important }` уже гасит и луч, и маску точек. Правило `.btn[data-beam], .btn[data-beam]::after { animation: none }` ничего не добавляет, а `motionPolicy.test.ts:70-72` его закрепляет.
**Fix:** снять правило и заменить проверку в тесте на проверку `data-anim="beam"` в `Button.tsx` (она уже есть в `primitives.test.tsx:120`).

### IN-05: `@utility focus-ring` не используется

**File:** `src/styles/global.css:100-103`
**Issue:** класс `focus-ring` не встречается ни в одном компоненте. В Tailwind v4 неиспользованная утилита в билд не попадает, так что это мёртвый исходник. Живёт он только потому, что `motionPolicy.test.ts:129` считает ровно два вхождения `outline: 2px solid var(--color-horizon-200)`.
**Fix:** удалить утилиту и поправить счётчик на 1.

### IN-06: Высота шапки продублирована числами в отступах оверлея

**File:** `src/components/layout/Header.css:343`, `:437-441`
**Issue:** `padding: calc(72px + 1rem) …` и `padding-block: calc(88px + 1rem)` повторяют высоту пилюли, при том что `global.css:14` объявляет `--header-offset` как единственный источник этой величины и сам держит 88px / 120px / 112px. Числа совпадают случайно и разъедутся при первой правке высоты.
**Fix:** заменить на `padding-block: var(--header-offset)` и убрать медиазапрос 437-441.

### IN-07: Порог скрытия меньше фактической высоты шапки

**File:** `src/lib/useHeaderHide.ts:4`
**Issue:** `THRESHOLD = 80`, а пилюля на 768–1279 занимает 88px плюс 16px отступа. План формулировал правило как «прячется при прокрутке вниз дальше своей высоты», то есть дальше 104px.
**Fix:** брать порог из `headerOffset()` вместо константы либо поднять до 120 и описать расхождение в комментарии.

### IN-08: Опция `threshold` не используется и не покрыта тестом

**File:** `src/lib/useHeaderHide.ts:11-14`
**Issue:** `Header` зовёт хук без второго поля, ни один тест порог не подменяет. Публичная точка настройки, которую никто не дёргает.
**Fix:** либо удалить, либо добавить тест на нестандартный порог.

### IN-09: `transition-delay` оверлея переживает reduced motion

**File:** `src/components/layout/Header.css:359-363`, `src/styles/global.css:302-309`
**Issue:** страховка в блоке reduce правит `transition-duration`, но не `transition-delay`. У `.mobile-menu` задержка живёт в `visibility 0s linear var(--dur-ui)`, поэтому при закрытии оверлей остаётся `visibility: visible` ещё 240 мс. Кликов он не ловит (`pointer-events: none`), так что вреда нет, но политика «движение выключено» на нём не выполняется.
**Fix:** добавить в блок reduce `transition-delay: 0s !important` рядом с `transition-duration`.

### IN-10: Клик мимо списка закрывает оверлей не везде

**File:** `src/components/layout/MobileMenu.tsx:122-126`, `src/components/layout/Header.css:373-385`
**Issue:** `onBackdropClick` сравнивает `event.target === event.currentTarget`. Сверху и снизу от списка клик попадает в сам оверлей и закрывает его, а слева и справа — в `.mobile-menu__nav` шириной 100%, и меню остаётся открытым. Зона закрытия выглядит для посетителя случайной.
**Fix:** дать `.mobile-menu__nav` ширину `min(100%, 36rem)` заодно со списком либо закрывать по `event.target.closest(".mobile-menu__list") === null`.

---

## Convention (advisory)

Прогон `gsd-tools verify conventions --check` по изменённым `.ts`/`.tsx` вернул пять находок вида «identifier casing is Pascal (Header) → should be camel». Это ложные срабатывания: PascalCase у React-компонентов задан самим React, а не выбором автора. В отчёт не переношу.

Собственные наблюдения по конвенциям проекта:

- **CN-01** `src/components/involve/involve.css:80` и `src/components/about/about.css:31` цепляют контентную колонку селектором `.inv-section > div` / `.ab-section > div`. Колонку рисует `Section.tsx:28`, и любая обёртка внутри `Section` эти правила отвяжет. Конвенция проекта — класс на узле, а не позиционный селектор. Предложение: добавить `Section` проп `contentClassName` или класс `section__inner`, как это уже сделано в `news.css` (`.news-section__inner`).
- **CN-02** `src/components/resources/resources.css:27-37` объявляет `.resources-atmosphere` с `inset: -8%`, но без `position`. Позиционирование приходит из Tailwind-класса `absolute` в `Resources.tsx:91`. Правило раскидано между CSS-файлом и разметкой. Предложение: перенести `position: absolute` в CSS-файл рядом с `inset`.

---

_Reviewed: 2026-09-06T00:12:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
