---
phase: 01-scaffold-and-deploy
reviewed: 2026-09-05T16:11:15Z
depth: standard
files_reviewed: 32
files_reviewed_list:
  - .github/workflows/deploy.yml
  - index.html
  - vite.config.ts
  - src/App.tsx
  - src/App.test.tsx
  - src/main.tsx
  - src/data/copy.ts
  - src/test/setup.ts
  - src/styles/global.css
  - src/styles/tokens.css
  - src/components/layout/Button.tsx
  - src/components/layout/Eyebrow.tsx
  - src/components/layout/GlassCard.tsx
  - src/components/layout/GradientTitle.tsx
  - src/components/layout/Section.tsx
  - src/components/layout/SkipLink.tsx
  - src/components/layout/Wordmark.tsx
  - src/components/layout/primitives.css
  - src/components/layout/primitives.test.tsx
  - src/components/layout/Header.tsx
  - src/components/layout/Header.css
  - src/components/layout/Header.test.tsx
  - src/components/layout/BurgerButton.tsx
  - src/components/layout/MobileMenu.tsx
  - src/components/layout/Footer.tsx
  - src/components/layout/Footer.css
  - src/components/layout/Footer.test.tsx
  - src/components/placeholders.test.tsx
  - src/lib/scrollToSection.ts
  - src/lib/scrollToSection.test.ts
  - src/lib/useActiveSection.ts
  - src/lib/useActiveSection.test.ts
findings:
  critical: 2
  warning: 13
  info: 15
  total: 30
status: issues_found
---

# Фаза 01: отчёт код-ревью

**Дата:** 2026-09-05T16:11:15Z
**Глубина:** standard
**Файлов проверено:** 32
**Статус:** issues_found

## Резюме

Я прочитал 32 файла фазы 1: скаффолд Vite, дизайн-примитивы, header с мобильным оверлеем, footer, workflow деплоя. Инъекций, секретов, `eval`, `innerHTML` и `dangerouslySetInnerHTML` в коде нет. Внешние ссылки footer закрыты `rel="noopener noreferrer"`. `npx tsc -b` и `npx vitest run` по этим файлам проходят (81 тест, 14 файлов).

Зелёные гейты здесь мало что доказывают. `tsconfig.app.json` не включает `strict`, поэтому `tsc -b` в CI пропускает присваивание `HTMLElement | null` в `HTMLElement` (проверил компилятором отдельно: без `strict` ошибок нет, с `--strict` падает TS2322). Все `?.` и фильтры `!== null` в проверенном коде остаются декорацией, которую компилятор не защищает.

Вторая дыра лежит в CI: build-джоба выполняет `npm ci` с правами `id-token: write` и `pages: write`. Любой install-скрипт транзитивной зависимости получает токен, которым публикуют содержимое на Pages.

Дальше идут два расходящихся `scrollToSection` (в `src/lib` и в `src/components/hero`) с разной математикой, нулевой зазор под пилюлей на десктопе, конфликт `aria-modal` с фокус-ловушкой и непокрытая тестами логика выбора активной секции.

## Критические проблемы

### CR-01: TypeScript собирает всю фазу без `strict`

**Файл:** `tsconfig.app.json:1-27` (смежный со скоупом артефакт того же скаффолда, управляет всеми проверенными файлами)
**Проблема:** В `compilerOptions` нет `"strict": true`. Проверка `npx tsc -p tsconfig.app.json --showConfig` не показывает ни `strict`, ни `strictNullChecks`, значит действует дефолт `false`. Доказательство на пробнике:

```
// без strict (текущий конфиг): ошибок нет
export const el: HTMLElement = document.getElementById("x");
// с --strict: error TS2322: Type 'HTMLElement | null' is not assignable to type 'HTMLElement'
```

Следствия в проверенном коде: `document.getElementById("root")!` в `src/main.tsx:7` типизируется как `HTMLElement` даже без `!`; предикат `(element): element is HTMLElement => element !== null` в `src/lib/useActiveSection.ts:23` не несёт информации; `headerRef.current?.getBoundingClientRect()` в `src/components/layout/Header.tsx:54` компилируется и без `?.`. `npm run build` (`tsc -b && vite build`) в CI работает как гейт стиля, а не типов. Стек в CLAUDE.md обещает «ошибки ловятся на билде», и это обещание сейчас не выполняется. Чинить дешевле сейчас, до восьми фаз кода поверх слабых типов.
**Исправление:**

```jsonc
// tsconfig.app.json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noUnusedLocals": true,
    // ...остальное без изменений
  }
}
```

После включения перепроверьте `src/components/layout/MobileMenu.tsx:78` (`stops[next].focus()` под `noUncheckedIndexedAccess`) и `src/components/layout/Button.tsx:21,33` (двойной каст, см. IN-08).

### CR-02: build-джоба деплоя держит права на публикацию Pages

**Файл:** `.github/workflows/deploy.yml:8-32`
**Проблема:** `permissions` объявлены на уровне workflow, поэтому обе джобы получают `pages: write` и `id-token: write`. Джоба `build` запускает `npm ci` (40+ пакетов вместе с транзитивными install-скриптами) и `npm test`. Install-скрипт скомпрометированной зависимости получает OIDC-токен с правом деплоя на Pages и публикует произвольное содержимое на публичный сайт церкви. Права для сборки нужны только на чтение репозитория.
**Исправление:**

```yaml
permissions:
  contents: read

jobs:
  build:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    # прав workflow-уровня (contents: read) достаточно
    steps:
      # ...

  deploy:
    needs: build
    runs-on: ubuntu-latest
    permissions:
      pages: write
      id-token: write
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
```

## Предупреждения

### WR-01: два расходящихся `scrollToSection`

**Файлы:** `src/lib/scrollToSection.ts:15-31`, `src/components/hero/scrollToSection.ts:8-17`
**Проблема:** В проекте живут две функции с одним именем и разной математикой. Версия в `src/lib` считает `target.offsetTop - headerHeight - 16` и обрабатывает якорь `#top`. Версия в `src/components/hero` считает `getBoundingClientRect().top + window.scrollY - 96`, про `#top` не знает. `Header.tsx:4` импортирует первую, `Hero.tsx:9` вторую. Одна и та же секция получает две разные конечные позиции в зависимости от того, откуда пришёл клик, а правка бага в одном файле не доедет до второго.
**Исправление:** Удалите `src/components/hero/scrollToSection.ts`, оставьте один модуль в `src/lib`, перенесите туда более надёжный расчёт через `getBoundingClientRect` (см. WR-02) и вызывайте из Hero с той же высотой header:

```ts
// src/components/hero/Hero.tsx
import { scrollToSection } from "../../lib/scrollToSection";
```

### WR-02: расчёт позиции ломается при позиционированном предке и даёт нулевой зазор на десктопе

**Файл:** `src/lib/scrollToSection.ts:28`
**Проблема:** Две ошибки в одной строке.

1. `target.offsetTop` меряет смещение от `offsetParent`, а не от документа. Сегодня `<main id="main">` (`src/App.tsx:18`) не позиционирован, и число совпадает. Как только любая фаза добавит `main { position: relative }` или обёртку с `position`, все переходы по меню молча уедут. Копия в `hero/` уже использует корректную формулу.
2. Из позиции вычитается только высота header, без его отступа сверху. Header зафиксирован на `top: 16px` при ширине от 768px (`Header.css:231-234`), значит секция встаёт в `y = H + 16`, а нижняя граница пилюли лежит на `16 + H`. Обещанный в докстринге зазор 16px превращается в 0px на десктопе и в 4px на мобильном (`top: 12px`). Плюс во время плавной прокрутки срабатывает `data-scrolled="true"`, пилюля теряет 16px высоты, и итоговая позиция расходится с замеренной в момент клика.

**Исправление:**

```ts
const rect = target.getBoundingClientRect();
const top = Math.max(0, rect.top + window.scrollY - headerBottom - GAP);
```

где `headerBottom` приходит из `headerRef.current?.getBoundingClientRect().bottom` (учитывает `top`-отступ), а `GAP` вынесен в именованную константу.

### WR-03: три независимых источника высоты header

**Файлы:** `src/styles/global.css:19`, `src/components/hero/scrollToSection.ts:2`, `src/components/layout/Header.tsx:54`
**Проблема:** `scroll-padding-top: 96px`, `HEADER_OFFSET = 96` и динамический `getBoundingClientRect().height` описывают одну и ту же величину тремя способами. Реальная высота пилюли меняется между компактным и обычным состоянием, поэтому нативный переход по хешу (заход по прямой ссылке `site/#about`, отказ JS) и переход по клику приводят в разные точки.
**Исправление:** Оставьте один источник: CSS-переменную `--header-offset` в `:root`, читайте её в JS через `getComputedStyle` либо задавайте `scroll-padding-top: var(--header-offset)` и вычитайте ту же переменную в `scrollToSection`.

### WR-04: цель skip-link не принимает фокус

**Файлы:** `src/App.tsx:18`, `src/components/layout/SkipLink.tsx:5`
**Проблема:** Ссылка ведёт на `#main`, а у `<main id="main">` нет `tabIndex={-1}`. Safari и Firefox не переводят фокус на нефокусируемый фрагмент: страница прокручивается, но следующий Tab продолжает обход с header, и скринридер не объявляет переход. Тест `src/App.test.tsx:46-52` проверяет только атрибут `href`, поэтому регрессия не видна.
**Исправление:**

```tsx
<main id="main" tabIndex={-1}>
```

и добавьте `main:focus { outline: none }` в `global.css`, чтобы не рисовать рамку вокруг всей страницы (`:focus-visible` продолжит работать для клавиатуры).

### WR-05: `aria-modal="true"` конфликтует с фокус-ловушкой, которая уводит фокус на бургер

**Файлы:** `src/components/layout/MobileMenu.tsx:20-23,119-120`, `src/components/layout/Header.tsx:91-105`
**Проблема:** Оверлей объявлен модальным диалогом, а кнопка закрытия (бургер) лежит снаружи диалога, в `.site-header__pill`. Скринридер, уважающий `aria-modal`, скрывает всё вне диалога, включая бургер. При этом `focusables()` ставит бургер первым в цикле Tab, и пользователь получает фокус на элементе, которого для него не существует. Кнопки «Закрыть меню» внутри диалога нет.
**Исправление:** Перенесите управляющую кнопку внутрь оверлея (отдельная кнопка «Закрыть меню» первым элементом диалога) и уберите бургер из `focusables()`. Как вариант: снимите `aria-modal`, тогда бургер снаружи остаётся видимым для скринридера.

### WR-06: блокировка скролла не держит iOS Safari, у оверлея нет своей прокрутки

**Файлы:** `src/components/layout/MobileMenu.tsx:27-37`, `src/components/layout/Header.css:165-183`
**Проблема:** `document.body.style.overflow = "hidden"` не останавливает тач-скролл страницы в iOS Safari. Меню рассчитано на мобильные экраны, то есть на основной класс устройств, где приём не работает. У самого оверлея нет ни `overflow-y`, ни `overscroll-behavior`: при четырёх пунктах в альбомной ориентации (padding сверху 104px плюс 4 × 48px плюс нижний padding) содержимое почти достаёт до края, а пятый пункт станет недостижимым.
**Исправление:**

```css
.mobile-menu {
  overflow-y: auto;
  overscroll-behavior: contain;
}
```

Для iOS добавьте фиксацию body с сохранением позиции:

```ts
const y = window.scrollY;
document.body.style.position = "fixed";
document.body.style.top = `-${y}px`;
// в cleanup: снять стили и вернуть window.scrollTo({ top: y, behavior: "auto" })
```

### WR-07: активная секция выбирается по `intersectionRatio` и всегда проигрывает длинным секциям

**Файл:** `src/lib/useActiveSection.ts:30-47`
**Проблема:** `rootMargin: "-40% 0px -55% 0px"` оставляет полосу в 5% высоты вьюпорта. `intersectionRatio` считается как доля площади самой секции, попавшей в полосу. Короткая секция закрывает полосу целиком и даёт ratio около 1, длинная секция при том же положении даёт 0.05. Победитель `reduce` определяется размером секции, а не тем, куда смотрит посетитель. Вдобавок в `entries` приходят только изменившиеся записи, поэтому сравнение идёт по неполному набору: секция, которая уже в полосе, но не меняла статус в этом батче, в сравнении не участвует.
**Исправление:** Держите накопленное состояние по всем наблюдаемым секциям и выбирайте по порядку в документе, а не по площади:

```ts
const visible = new Map<string, boolean>();
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => visible.set(entry.target.id, entry.isIntersecting));
  const first = ids.find((id) => visible.get(id));
  if (first) setActive(first);
}, { rootMargin: ROOT_MARGIN, threshold: 0 });
```

### WR-08: выбор активной секции и десктопная ветка Header не покрыты тестами

**Файлы:** `src/lib/useActiveSection.test.ts:39-58`, `src/test/setup.ts:30-39`, `src/components/layout/Header.test.tsx`
**Проблема:** Тесты хука проверяют только три вещи: наблюдатель не создаётся при `enabled: false`, создаётся один раз, отключается при размонтировании. Колбэк `IntersectionObserver` не вызывается ни разу, поэтому вся логика `reduce` (см. WR-07) не исполняется в тестах. Параллельно `setup.ts` возвращает `matches: false` на любой запрос, значит `useMediaQuery(DESKTOP_QUERY)` в Header всегда ложный, `useActiveSection` всегда выключен, и атрибут `aria-current` вместе с подчёркиванием `.site-header__link[aria-current="true"]` не проверяет ни один тест. Правило проекта «test-as-you-go» здесь не выполнено для основной логики хука.
**Исправление:** Сохраняйте колбэк в spy-классе и дёргайте его вручную:

```ts
let cb: IntersectionObserverCallback;
class ObserverSpy { constructor(c: IntersectionObserverCallback) { cb = c; } /* ... */ }
// затем
act(() => cb([{ target: about, isIntersecting: true, intersectionRatio: 0.1 }] as never, null as never));
expect(result.current).toBe("about");
```

Плюс тест Header с `matchMedia`, отдающим `matches: true` для `(min-width: 768px)`, и проверкой `aria-current` на нужной ссылке.

### WR-09: переход по меню не пишет hash и не переносит фокус в секцию

**Файл:** `src/components/layout/Header.tsx:57-60`, `src/components/layout/MobileMenu.tsx:133-136`
**Проблема:** `event.preventDefault()` отменяет нативное поведение якоря и ничем его не заменяет. URL остаётся прежним, поэтому посетитель не скопирует ссылку на раздел, а кнопка «Назад» не отматывает переходы по секциям. Фокус остаётся на ссылке в header, значит клавиатурный пользователь после перехода продолжает обход с шапки, а скринридер не объявляет новый раздел.
**Исправление:**

```ts
const navigate = useCallback((href: string) => {
  setMenuOpen(false);
  const moved = scrollToSection(href, headerBottom());
  if (!moved) return;
  history.pushState(null, "", href);
  const target = document.getElementById(href.slice(1));
  target?.setAttribute("tabindex", "-1");
  target?.focus({ preventScroll: true });
}, []);
```

### WR-10: `cancel-in-progress: true` отменяет идущий деплой Pages

**Файл:** `.github/workflows/deploy.yml:13-15`
**Проблема:** Группа `pages` покрывает обе джобы. Пуш во время активного `deploy-pages` отменяет джобу деплоя посреди работы и оставляет деплоймент Pages в подвешенном состоянии, из которого следующий запуск выходит с ошибкой «deployment already in progress». Шаблон GitHub для Pages ставит `cancel-in-progress: false` именно поэтому.
**Исправление:**

```yaml
concurrency:
  group: pages
  cancel-in-progress: false
```

### WR-11: CI не запускает линтер

**Файл:** `.github/workflows/deploy.yml:26-28`
**Проблема:** В `package.json` объявлен скрипт `lint` (eslint с `typescript-eslint` и `react-hooks`), но workflow гоняет только `npm test` и `npm run build`. Правила `react-hooks` ловят как раз тот класс ошибок, который встречается в этой фазе (зависимости эффектов, нестабильные ссылки в `useEffect`), и сейчас они не проверяются ни на одном коммите.
**Исправление:** Добавьте шаг между `npm ci` и `npm test`:

```yaml
      - run: npm run lint
```

### WR-12: у страницы нет `og:image` и карточки Twitter

**Файл:** `index.html:12-19`
**Проблема:** Есть `og:title`, `og:description`, `og:type`, `og:url`, `og:locale`, но нет `og:image`. Ссылка на сайт в Telegram, WhatsApp и соцсетях отдаёт превью без картинки. Для лендинга кампании, который распространяют репостами, это ломает основной сценарий распространения. `twitter:card` тоже отсутствует.
**Исправление:**

```html
<meta property="og:image" content="https://thevladoss.github.io/esd-onevoice27/og-cover.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta name="twitter:card" content="summary_large_image" />
```

Картинку положите в `public/`.

### WR-13: брейкпойнт 768px продублирован в четырёх местах

**Файлы:** `src/components/layout/Header.tsx:11`, `src/components/layout/MobileMenu.tsx:6`, `src/components/layout/Header.css:230`, `src/components/layout/Footer.css:59`
**Проблема:** Одно и то же значение живёт в двух TS-константах `DESKTOP_QUERY` и в двух `@media`. Расхождение даёт конкретный отказ: CSS скрывает `.mobile-menu` через `display: none`, JS при этом продолжает считать меню открытым, обработчик Tab в `MobileMenu.tsx:77-78` вызывает `preventDefault()` и пытается сфокусировать элемент внутри `display: none` контейнера. Фокус не переходит никуда, клавиатурная навигация по странице встаёт.
**Исправление:** Вынесите константу в один модуль и переиспользуйте:

```ts
// src/lib/breakpoints.ts
export const DESKTOP_QUERY = "(min-width: 768px)";
export const DESKTOP_MIN_PX = 768;
```

В CSS используйте `@custom-media` либо кастомные брейкпойнты Tailwind v4 из `@theme`.

## Информационные замечания

### IN-01: класс `.eyebrow` не описан ни одним CSS-правилом

**Файл:** `src/components/layout/Eyebrow.tsx:7`
**Проблема:** Поиск по всем десяти файлам `.css` в `src/` не находит правила `.eyebrow`. Всё оформление приходит из Tailwind-утилит в той же строке, а класс работает селектором для тестов (`primitives.test.tsx:18,28`, `placeholders.test.tsx:37`, `App.test.tsx`). Тесты держатся за пустышку, и её удаление уронит их без изменения поведения.
**Исправление:** Либо перенесите стили надзаголовка в `primitives.css` под `.eyebrow` (как сделано для `.btn`, `.glass-card`, `.gradient-title`), либо замените селектор в тестах на `data-testid`.

### IN-02: `App.test.tsx` дублирует список секций вместо импорта

**Файл:** `src/App.test.tsx:14-27`
**Проблема:** Массив `expectedSectionIds` повторяет `sectionIds` из `src/data/copy.ts:1-10` литералами. Новая секция в `copy.ts` не уронит тест, и расхождение двух списков останется незамеченным.
**Исправление:** `import { sectionIds } from "./data/copy";` и используйте его напрямую.

### IN-03: non-null assertion на корневом узле

**Файл:** `src/main.tsx:7`
**Проблема:** `document.getElementById("root")!` при отсутствии узла (правка `index.html`, встраивание виджета) даёт `Cannot read properties of null` без объяснения. Под нынешним не-strict конфигом (CR-01) `!` вообще ничего не значит.
**Исправление:**

```ts
const root = document.getElementById("root");
if (!root) throw new Error("Не найден узел #root в index.html");
createRoot(root).render(/* ... */);
```

### IN-04: организация названа двумя разными способами

**Файл:** `src/data/copy.ts:32,39`
**Проблема:** `caption` пишет «Церкви христиан адвентистов седьмого дня», `legal` тремя строками ниже пишет «Церкви христиан-адвентистов седьмого дня» с дефисом. Обе строки выводятся в одном footer, тесты фиксируют оба варианта (`Footer.test.tsx:12,16`).
**Исправление:** Оставьте официальное написание с дефисом в обеих строках и поправьте тест.

### IN-05: год копирайта зашит в строку

**Файл:** `src/data/copy.ts:39`
**Проблема:** `© 2026` требует ручной правки каждый январь, а сайт живёт до кампании сентября 2027 года.
**Исправление:** Соберите строку в `Footer.tsx`: `` `© ${new Date().getFullYear()} ${copy.footer.legalOwner}` ``.

### IN-06: якорь `#top` не указывает ни на один элемент

**Файл:** `src/components/layout/Header.tsx:67`
**Проблема:** Элемента с `id="top"` в документе нет. Клик обрабатывает JS (`scrollToSection` знает про `#top`), но открытие ссылки в новой вкладке или средней кнопкой мыши ведёт на несуществующий фрагмент.
**Исправление:** Поставьте `href="#main"` либо добавьте `id="top"` на корневой узел.

### IN-07: высота пилюли зашита в padding оверлея

**Файл:** `src/components/layout/Header.css:169`
**Проблема:** `padding: calc(88px + 16px) ...` повторяет высоту header числом. В компактном состоянии пилюля теряет 16px, и верхний отступ меню перестаёт соответствовать шапке.
**Исправление:** Заведите `--header-height` и используйте её здесь и в расчёте прокрутки (см. WR-03).

### IN-08: двойной каст в `Button` снимает защиту дискриминированного union

**Файл:** `src/components/layout/Button.tsx:21,27,33`
**Проблема:** `props as ButtonOwnProps & { as?: "a" | "button" }` стирает union, после чего `rest` приводится к типу целевого элемента ещё раз. В паре с выключенным `strict` (CR-01) компилятор пропустит `<Button as="a" disabled>` или `<Button href="#x">` на `<button>`.
**Исправление:** Разведите ветки до деструктуризации:

```tsx
export function Button(props: ButtonProps) {
  if (props.as === "a") {
    const { as: _as, variant = "primary", className, children, ...rest } = props;
    return <a className={classes(variant, className)} {...rest}>{children}</a>;
  }
  const { as: _as, variant = "primary", className, children, type = "button", ...rest } = props;
  return <button type={type} className={classes(variant, className)} {...rest}>{children}</button>;
}
```

### IN-09: тестовый setup глушит canvas и медиазапросы глобально

**Файл:** `src/test/setup.ts:30-42`
**Проблема:** `HTMLCanvasElement.prototype.getContext` возвращает `null` для всего набора: компонент, который вызовет `ctx.fillRect`, упадёт с `null is not an object` вместо осмысленной ошибки. Фаза 5 планирует канвас-глобус. `window.matchMedia` отдаёт `matches: false` на любой запрос, из-за чего десктопная и reduced-motion ветки не исполняются нигде, кроме тестов, которые подменяют мок вручную (`scrollToSection.test.ts:60`, `Header.test.tsx:222`).
**Исправление:** Сделайте оба мока настраиваемыми: экспортируйте хелперы `mockMatchMedia(map)` и `mockCanvas2d()`, чтобы тест объявлял нужный режим явно.

### IN-10: ширина контента задана числом в трёх местах

**Файлы:** `src/components/layout/Section.tsx:21`, `src/components/layout/Footer.tsx:8`, `src/components/layout/Header.css:8`
**Проблема:** `max-w-[72rem]` дважды и `max-width: 72rem` один раз. Смена ширины контейнера требует три правки в двух языках.
**Исправление:** Заведите `--container-max: 72rem` в `@theme` (`tokens.css`) и используйте `max-w-(--container-max)` в JSX и `var(--container-max)` в CSS.

### IN-11: экшены workflow не запинены, лимита времени нет

**Файл:** `.github/workflows/deploy.yml:21-42`
**Проблема:** Экшены подключены по плавающим тегам (`@v4`, `@v5`, `@v3`). Тег двигают, и содержимое шага меняется без коммита в репозиторий. У джоб нет `timeout-minutes`, зависший шаг съедает лимит минут раннера.
**Исправление:** Запиньте по SHA (`actions/checkout@8ade135...  # v4.2.2`) и добавьте `timeout-minutes: 10` обеим джобам.

### IN-12: в мобильном меню нет индикации текущей секции

**Файлы:** `src/components/layout/Header.tsx:40,81`, `src/components/layout/MobileMenu.tsx:128-141`
**Проблема:** `aria-current` считается только при `isDesktop`, а ссылки оверлея не получают его вовсе. На телефоне посетитель не видит, в каком разделе находится, хотя данные для этого есть.
**Исправление:** Передайте `activeSection` в `MobileMenu` и ставьте `aria-current` на совпавшую ссылку. Хук включайте всегда, а не только на десктопе.

## Соглашения (CONVENTION, не блокируют)

### CV-01: примитивы стилизуются двумя разными способами

**Файлы:** `src/components/layout/Eyebrow.tsx:7`, `src/components/layout/Section.tsx:21` против `Button.tsx`, `GlassCard.tsx`, `GradientTitle.tsx`
**Отклонение:** `Eyebrow` и `Section` собирают вид из Tailwind-утилит прямо в JSX и не импортируют CSS. Три остальных примитива держат оформление в `primitives.css` и подключают его файлом.
**Соглашение (выведено из кода):** примитив слоя `layout` описывает вид в `primitives.css` под BEM-классом, JSX ставит только имя класса.
**Рекомендация:** Перенесите утилиты `Eyebrow` в правило `.eyebrow`, а контейнер `Section` в `.section__inner`. Это заодно закрывает IN-01.

### CV-02: `import "./primitives.css"` продублирован в трёх компонентах

**Файлы:** `src/components/layout/Button.tsx:2`, `GlassCard.tsx:2`, `GradientTitle.tsx:3`
**Отклонение:** Один и тот же файл стилей импортируется трижды. Header и Footer подключают свой CSS ровно один раз рядом с компонентом.
**Соглашение:** один CSS-файл подключается из одной точки входа слоя.
**Рекомендация:** Импортируйте `primitives.css` из `src/styles/global.css` (`@import "../components/layout/primitives.css";`) и уберите три импорта из компонентов.

### CV-03: склейка className повторена в пяти компонентах

**Файлы:** `Button.tsx:23`, `Eyebrow.tsx:7-9`, `GlassCard.tsx:19-22`, `GradientTitle.tsx:19-21`, `Wordmark.tsx:5`
**Отклонение:** Выражение `(className ? " " + className : "")` скопировано пять раз, в `GlassCard` ещё и с дополнительным условием.
**Соглашение:** повторяющаяся логика сборки классов живёт в одном хелпере.
**Рекомендация:** Добавьте `src/lib/cx.ts` (`export const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(" ")`) и вызывайте его во всех примитивах.

---

_Проверено: 2026-09-05T16:11:15Z_
_Ревьюер: Claude (gsd-code-reviewer)_
_Глубина: standard_
