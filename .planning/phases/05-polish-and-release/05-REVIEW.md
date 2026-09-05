---
phase: 05-polish-and-release
reviewed: 2026-09-05T22:30:00Z
depth: standard
files_reviewed: 62
files_reviewed_list:
  - src/components/layout/reveal.constants.ts
  - src/components/layout/Reveal.tsx
  - src/components/layout/Reveal.test.tsx
  - src/components/layout/Reveal.motion.test.tsx
  - src/components/layout/Section.tsx
  - src/components/layout/GradientTitle.tsx
  - src/components/layout/Button.tsx
  - src/components/layout/ErrorBoundary.tsx
  - src/components/layout/Footer.tsx
  - src/components/layout/Footer.css
  - src/components/layout/Header.test.tsx
  - src/components/hero/Hero.tsx
  - src/components/hero/Starfield.tsx
  - src/components/hero/GlobeCanvas.tsx
  - src/components/hero/GlobeCanvas.test.tsx
  - src/components/hero/globe.ts
  - src/components/hero/globe.test.ts
  - src/components/hero/hero.css
  - src/components/map/MapSection.tsx
  - src/components/map/Counters.tsx
  - src/components/map/EsdMap.tsx
  - src/components/map/CountryChips.test.tsx
  - src/components/map/map.css
  - src/components/form/LightForm.tsx
  - src/components/form/LightTypeChoice.tsx
  - src/components/form/SuccessToast.tsx
  - src/components/form/light-form.css
  - src/components/about/About.tsx
  - src/components/about/VideoEmbed.tsx
  - src/components/about/about.css
  - src/components/about/video-embed.css
  - src/components/involve/Involve.tsx
  - src/components/involve/involve.css
  - src/components/news/News.tsx
  - src/components/news/NewsCard.tsx
  - src/components/news/NewsPagination.tsx
  - src/components/resources/Resources.tsx
  - src/components/resources/Resources.test.tsx
  - src/components/resources/ResourceCard.tsx
  - src/components/resources/ResourcePanel.tsx
  - src/components/resources/MaterialsList.tsx
  - src/components/resources/MusicPlaceholder.tsx
  - src/components/resources/VideoGrid.tsx
  - src/components/resources/VideoGrid.test.tsx
  - src/components/resources/resources.css
  - src/components/quote/Quote.tsx
  - src/data/copy.resources.ts
  - src/state/lights.tsx
  - src/styles/global.css
  - src/styles/tokens.css
  - src/styles/motionPolicy.test.ts
  - src/lib/useReducedMotion.ts
  - src/App.tsx
  - src/App.test.tsx
  - src/main.tsx
  - src/test/setup.ts
  - scripts/check-dist.mjs
  - vite.config.ts
  - tsconfig.app.json
  - package.json
  - .github/workflows/deploy.yml
  - README.md
findings:
  critical: 1
  warning: 8
  info: 10
  convention: 3
  total: 22
status: issues_found
---

# Фаза 5: отчёт код-ревью

**Дата:** 2026-09-05T22:30:00Z
**Глубина:** standard
**Файлов просмотрено:** 62
**Статус:** issues_found

## Сводка

Я прочитал все исходники фазы, прогнал `npm test` (42 файла, 335 тестов зелёные),
`npm run lint` (чисто), `npm run build` (без предупреждений о размере чанков, главный чанк
393 КБ, `vendor-map` 183 КБ) и `npm run check:dist` (11 проверок из 11). Дыр в безопасности
я не нашёл: `eval`, `innerHTML`, `dangerouslySetInnerHTML`, секретов и `as any` в коде нет,
внешние ссылки несут `rel="noopener noreferrer"`, `videoId` проверяется регуляркой и
кодируется, iframe грузится с `youtube-nocookie.com` в песочнице, права джобы `build` в
`deploy.yml` сведены к чтению. Требование «чистая консоль» выполнено: `console.*` остался
только в CLI-скрипте `check-dist.mjs`. Правки фаз 1–4 не регрессировали: `strict` включён,
`inert` на месте, живой регион формы смонтирован постоянно, `paginate` защищён от `perPage <= 0`,
`hashchange` слушается.

Зелёные гейты здесь ничего не доказывают. Главный дефект фазы я нашёл замером, а не чтением:
после перехода на вторую страницу новостей карточки остаются с `opacity: 0` и не появляются
никогда. Секция показывает заголовок, пагинацию и пустое место. Причина лежит в контракте
`RevealGroup`: `motion` раздаёт вариант «visible» детям в момент, когда группа входит во
вьюпорт, а ребёнок, смонтированный позже, наследует из контекста только `initial="hidden"`.
Я воспроизвёл это на самом компоненте `News` (см. CR-01), а потом проверил предложенное
исправление тем же способом.

Тесты не могли этого поймать по устройству: мок `IntersectionObserver` в `src/test/setup.ts`
не шлёт ни одного события, а `Reveal.motion.test.tsx` закрепляет `opacity === "0"` как
ожидаемое состояние. Ни один тест проекта не проверяет, что блок вообще становится видимым.

Дальше идут два места, где требование «чистая консоль» выполнили удалением диагностики:
`ErrorBoundary` больше не логирует упавший рендер, а `tryCreateLight` молча роняет огонёк
неизвестной страны, пока форма показывает тост «Ваш свет зажжён». Отдельным блоком — два
конкурирующих источника `prefers-reduced-motion` и правило `outline-color: transparent`,
написанное так, чтобы пройти собственный инвариантный тест проекта.

## Narrative Findings (AI reviewer)

## Критические проблемы

### CR-01: карточки второй страницы новостей не появляются никогда

**Файл:** `src/components/news/News.tsx:63-69`, `src/components/layout/Reveal.tsx:112-172`
**Проблема:** `RevealGroup` держит `initial="hidden"` и `whileInView="visible"`, а `RevealItem`
своего `whileInView` не имеет и живёт вариантом от родителя. `motion` раздаёт «visible» детям
один раз, в момент пересечения группы с вьюпортом (`framer-motion/.../animation-state`,
`animateChildren` вызывается из `setActive`). Ребёнок, смонтированный после этого момента,
берёт из `MotionContext` только `initial` («hidden»), своего `animate` у него нет, и на
экране он остаётся с `opacity: 0; transform: translateY(24px)`.

Клик по пагинации меняет ключи всех шести `RevealItem`: старые размонтируются, новые
монтируются в уже показанную группу. Я замерил это на самом `News` (временный тест,
управляемый мок `IntersectionObserver`, реальное ожидание 1500 мс):

```
PAGE1 li opacity:   ["1","1","1","1","1","1"]
PAGE2 li opacity:   ["0","0","0"]
PAGE2 li transform: ["translateY(24px)","translateY(24px)","translateY(24px)"]
```

Посетитель кликает «2», сетка пустеет, живой регион при этом объявляет «страница 2 из N».
Комментарий в `News.tsx:61-62` утверждает обратное: «карточки следующей страницы встают в
готовое состояние без ожидания». Проверка это не подтверждает.

**Исправление:** пересобирать группу на смену страницы, тогда `whileInView` отрабатывает
заново и каскад остаётся. Я проверил вариант тем же замером: `p2 opacity: ["1"]`.

```tsx
// News.tsx
<RevealGroup key={result.page} as="ul" className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
  {result.items.map((item) => (
    <RevealItem as="li" key={item.id} className="min-w-0">
      <NewsCard item={item} />
    </RevealItem>
  ))}
</RevealGroup>
```

Альтернатива без ремонтирования: дать `RevealItem` собственные `initial`/`whileInView`
(как у `Reveal`) и потерять stagger. Первый вариант дешевле и сохраняет каскад.

**Тест, который должен появиться вместе с правкой:** рендер `News` с моком
`IntersectionObserver`, который шлёт `isIntersecting: true`, клик по «2», проверка
`style.opacity !== "0"` на каждой карточке.

## Предупреждения

### WR-01: тестовый мок делает дефекты появления невидимыми

**Файл:** `src/test/setup.ts:3-19`, `src/components/layout/Reveal.motion.test.tsx:19-52`
**Проблема:** `IntersectionObserverMock` принимает колбэк и не вызывает его никогда, поэтому
`whileInView` в jsdom не срабатывает ни разу. `Reveal.motion.test.tsx` фиксирует это как
контракт: `expect(root.style.opacity).toBe("0")`. Счастливого пути нет ни в одном из 42
файлов: ни один тест не проверяет, что блок доходит до `opacity: 1`. Любая поломка появления
(неверный `amount`, сломанное распространение вариантов, опечатка в `whileInView`) оставляет
набор зелёным. CR-01 доехал до прода именно так. Побочный эффект: весь контент под `Reveal`
в остальных 40 файлах тестов лежит с `opacity: 0`, поэтому `toBeVisible()` в этом проекте
применять нельзя, и никто этого не заметит.
**Исправление:** управляемый мок, который умеет сообщать о пересечении.

```ts
// src/test/setup.ts
const observers = new Set<{ cb: IntersectionObserverCallback; targets: Element[] }>();

class IntersectionObserverMock implements IntersectionObserver {
  // …
  constructor(private cb: IntersectionObserverCallback) { observers.add({ cb, targets: this.targets }); }
  observe(el: Element) { this.targets.push(el); }
  disconnect() { this.targets.length = 0; }
}

/** Тест сам решает, когда блок вошёл во вьюпорт. */
export function enterViewport() {
  for (const { cb, targets } of observers) {
    cb(targets.map((target) => ({ target, isIntersecting: true }) as IntersectionObserverEntry), null as never);
  }
}
```

Дальше добавить в `Reveal.motion.test.tsx` симметричный кейс: после `enterViewport()` и
прокрутки таймеров `opacity` равна `1`.

### WR-02: падение рендера больше не оставляет следов

**Файл:** `src/components/layout/ErrorBoundary.tsx:26-28`
**Проблема:** фаза удалила `componentDidCatch` целиком, чтобы убрать `console.error` из
продакшн-кода. Вместе с ним ушла единственная диагностика: исключение в фазе рендера теперь
показывает экран «Страница не загрузилась» и не пишет ни строчки ни в проде, ни в дев-режиме.
Разработчик видит серый экран без стека и без `componentStack`. Требование MOTION-04 просило
чистую консоль у посетителя, а не отсутствие логов у разработчика.
**Исправление:** оставить лог под флагом сборки, тогда прод молчит, а `vite dev` говорит.

```tsx
componentDidCatch(error: Error, info: ErrorInfo): void {
  if (import.meta.env.DEV) {
    console.error("Рендер упал:", error, info.componentStack);
  }
}
```

### WR-03: форма подтверждает успех, когда огонёк не зажёгся

**Файл:** `src/state/lights.tsx:57-61`, `src/components/form/LightForm.tsx:120-130`
**Проблема:** `tryCreateLight` возвращает `null` для страны вне дивизиона, редьюсер отдаёт
прежнее состояние, а `console.warn` из этой ветки фаза удалила. `handleSubmit` при этом
безусловно ставит `toastOpen` и пишет в живой регион «Ваш свет зажёгся»: результат `addLight`
никто не проверяет. Сейчас ветка недостижима из формы (валидация сверяет `countryId` со
справочником, фикс WR-04 фазы 3), но контракт «диспатч всегда успешен» нигде не закреплён,
и наблюдаемости у него теперь ноль. Любая будущая правка `validateLightForm` или
`countryById` превращает это в молчаливую потерю данных с ложным подтверждением.
**Исправление:** сделать отказ видимым хотя бы в дев-режиме и не подтверждать то, чего не было.

```tsx
// lights.tsx
if (!country) {
  if (import.meta.env.DEV) console.warn(`Страна вне дивизиона, огонёк не зажжён: ${input.countryId}`);
  return null;
}
```

Дальше: либо `addLight` возвращает `boolean`, либо счётчик огоньков сверяется до и после,
и тост показывается только на росте.

### WR-04: два независимых источника prefers-reduced-motion

**Файл:** `src/components/layout/Reveal.tsx:72,113,143`, `src/components/hero/Hero.tsx:29`,
`src/lib/useReducedMotion.ts:28-33`
**Проблема:** проект держит собственный `usePrefersReducedMotion` на `useSyncExternalStore`
(живая подписка) и прямо в докблоке объясняет, почему хук из `motion` не подошёл: «motion
кэширует matchMedia в модульном синглтоне». `Reveal`, `RevealGroup`, `RevealItem` и `Hero`
после этого используют именно `useReducedMotion` из `motion/react`, который снимает значение
один раз через `useState` и не переподписывается (`framer-motion/.../use-reduced-motion.mjs`,
комментарий «TODO See if people miss automatically updating»). Итог: посетитель включает
«уменьшить движение» на ходу, CSS и canvas реагируют мгновенно, карта и счётчики реагируют,
а reveal-обёртки и hero продолжают анимировать. Вторая грань той же проблемы: обёртки
переключают тип элемента (`motion.div` против `div`), поэтому смена значения между
монтированиями разных экземпляров даёт разное поведение внутри одной страницы, а
теоретический ререндер со сменой значения размонтировал бы поддерево вместе с состоянием
формы и открытой панели.
**Исправление:** один источник на проект.

```tsx
import { usePrefersReducedMotion } from "../../lib/useReducedMotion";
// …
const reduce = usePrefersReducedMotion();
```

Тогда `Reveal.test.tsx` перестаёт зависеть от порядка загрузки модулей `motion`, и два
отдельных файла тестов (`Reveal.test.tsx` и `Reveal.motion.test.tsx`) можно свести в один.

### WR-05: инвариантный тест обводки фокуса больше ничего не гарантирует

**Файл:** `src/styles/global.css:66-73`, `src/styles/motionPolicy.test.ts:124-132`
**Проблема:** тест «нигде в исходниках не снимает обводку фокуса» ищет по тексту
`outline: none`, `outline-width: 0` и `outline-none`. Правило для `main` переписали с
`outline: none` на `outline-color: transparent`, и комментарий в CSS прямо называет причину:
«аудит доступности ищет отключённый outline грепом». Визуальный результат тот же, тест
зелёный. Теперь любой разработчик может убрать кольцо фокуса с кнопки, ссылки или поля тем же
приёмом, и тест это пропустит. Гарантия, ради которой тест написан, потеряна.
**Исправление:** расширить регулярку до способов гасить кольцо и внести `main` в явный
белый список с обоснованием.

```ts
const ringOff = /outline:\s*none|outline-width:\s*0|outline-color:\s*transparent|\boutline[-]none\b/;
const allowed = new Set([join(SRC, "styles", "global.css")]); // main — цель skip-link, кольцо не нужно
const offenders = filesWithExt([".css", ".ts", ".tsx"])
  .filter((path) => !allowed.has(path))
  .filter((path) => ringOff.test(readFileSync(path, "utf8")));
```

### WR-06: `check:dist` не запускается ни в одном автоматическом прогоне

**Файл:** `.github/workflows/deploy.yml:30-40`, `package.json:9`, `README.md`
**Проблема:** фаза написала 233 строки проверок собранного билда (base path, наличие файлов
ассетов, чанк `vendor-map`, потолок 500 КБ, белый список хостов) и оставила их ручной
командой. Джоба `build` гоняет `lint`, `test`, `build` и сразу заливает артефакт. Регрессия
`base`, потерянный чанк или чужой хост в `index.html` уедут на Pages, и узнает об этом
человек по чеклисту `docs/qa/SMOKE.md`. Инструмент приёмки, который не стоит в воротах, со
временем перестают запускать.
**Исправление:** одна строка между сборкой и загрузкой артефакта.

```yaml
      - run: npm run build
      - run: npm run check:dist
      - uses: actions/configure-pages@v5
```

### WR-07: `<p>` внутри `<button>` и три пропавших заголовка

**Файл:** `src/components/resources/ResourceCard.tsx:48-53`
**Проблема:** правка заменила `<h3>` на `<span>` с комментарием «внутри button поточный
контент невалиден», а строкой ниже оставила `<p className="mt-2 …">{card.description}</p>`.
Модель контента `<button>` — phrasing content, `<p>` в неё не входит, так что нарушение
осталось на месте, только теперь оно противоречит собственному комментарию файла. React
такую вложенность не проверяет, поэтому тест «рендерит страницу молча» её не ловит. Вторая
половина правки убрала из документа три заголовка секции ресурсов: пользователь скринридера
больше не может дойти до «Пойте вместе», «Будьте готовы» и «Смотрите и делитесь» обходом по
заголовкам, а замены (например, заголовка над сеткой карточек) не появилось.
**Исправление:** довести содержимое кнопки до phrasing content и вернуть заголовки наружу.

```tsx
<span className="mt-2 block font-body text-base leading-[1.5] text-paper/78">
  {card.description}
</span>
```

Заголовки уровня h3 стоит вернуть как видимый заголовок над карточкой (вне `<button>`), а
кнопке оставить `aria-labelledby` на него.

### WR-08: `ref as never` отключает проверку типов в шести местах

**Файл:** `src/components/layout/Reveal.tsx:79,88,120,129,162,169`
**Проблема:** проп объявлен как `ref?: Ref<HTMLElement>` и приводится к `never` на каждой
передаче. Компилятор после этого принимает любую пару «тег + ref»: `<Reveal as="li"
ref={divRef}>` собирается, а в рантайме в `useRef<HTMLDivElement>` ляжет `HTMLLIElement`.
Комментарий объясняет причину (у объединения тегов нет общего надтипа ref), но выбранное
решение снимает проверку целиком вместо того, чтобы связать `as` и `ref`.
**Исправление:** параметризовать компонент тегом, тогда `as never` не нужен.

```tsx
type TagElement = {
  div: HTMLDivElement; section: HTMLElement; article: HTMLElement;
  figure: HTMLElement; ul: HTMLUListElement; li: HTMLLIElement; p: HTMLParagraphElement;
};

type RevealBaseProps<T extends RevealTag = "div"> = AriaAttributes & {
  as?: T; className?: string; children: ReactNode; ref?: Ref<TagElement[T]>;
};

export function Reveal<T extends RevealTag = "div">({ as, ref, … }: RevealProps<T>) { … }
```

Если параметризация окажется дороже пользы, минимальный шаг — сузить приведение до
`ref as Ref<HTMLElement>` и оставить `never` только на самом вызове `MotionTag`.

## Информационные замечания

### IN-01: скринридер слышит надзаголовок цитаты дважды

**Файл:** `src/components/quote/Quote.tsx:21-26`
**Проблема:** скрытый `<h2 id="quote-title" className="sr-only">{quoteCopy.eyebrow}</h2>`
и видимый `<Eyebrow>{quoteCopy.eyebrow}</Eyebrow>` несут один и тот же текст подряд. При
входе в секцию озвучиваются и имя региона, и его первый абзац с тем же содержимым.
**Исправление:** поставить `id` на видимый `Eyebrow` и убрать скрытый заголовок, либо дать
скрытому заголовку отдельный текст («Слово о движении»), отличный от надзаголовка.

### IN-02: два разных способа связать секцию с её заголовком

**Файл:** `src/components/news/News.tsx:37-41`, `src/components/resources/Resources.tsx:102-106`
**Проблема:** пять секций ставят `id` прямо на `GradientTitle` (проп появился в 05-03), а
`News` и `Resources` держат `id` на вложенном `<span>` с комментарием «GradientTitle в этой
волне правит план 05-03». План 05-03 уже выполнен, комментарий устарел, а два способа делать
одно и то же остались.
**Исправление:** `<GradientTitle as="h2" variant="section" className="mt-2" id="news-title">`
и удалить `<span>` вместе с комментарием.

### IN-03: атрибут в продакшн-разметке существует только ради теста

**Файл:** `src/components/resources/Resources.tsx:92`, `src/components/resources/Resources.test.tsx:236`
**Проблема:** `data-particles` не читает ни CSS, ни JS, его единственный потребитель —
селектор `[data-particles] > span[aria-hidden='true']` в тесте. У самих слоёв уже есть
`data-anim="particles"`, по которому их можно найти.
**Исправление:** убрать атрибут, а в тесте искать
`section.querySelectorAll('[data-anim="particles"]')`.

### IN-04: утверждение, которое не может провалиться

**Файл:** `src/components/layout/Header.test.tsx` (тест «ведёт к секции плавно»)
**Проблема:** `behavior: expect.stringMatching(/^(smooth|auto)$/)` принимает оба возможных
значения, то есть проверяет только то, что поле — строка. Смысл несёт следующая строка с
`behavior: "smooth"`.
**Исправление:** удалить первое утверждение, оставить точное.

### IN-05: форматирование исходников удерживают построчные тесты

**Файл:** `src/components/resources/MaterialsList.tsx:82`, `src/styles/motionPolicy.test.ts:112-122`,
`src/App.test.tsx:164-167`
**Проблема:** проверка `target="_blank"` без `rel` работает по строкам файла, поэтому пару
атрибутов пришлось схлопнуть в одну строку вопреки остальному форматированию, а в `App.test.tsx`
селектор написан без кавычек с комментарием «иначе аудит примет строку теста за
незащищённую ссылку». Прогон prettier или изменение ширины строки уронит тесты, не изменив
поведение.
**Исправление:** проверять не текст, а DOM: отрендерить `App` и убедиться, что
`document.querySelectorAll('a[target="_blank"]:not([rel~="noopener"])')` пуст. Такой тест уже
есть в `App.test.tsx`, поэтому построчный дубль из `motionPolicy.test.ts` можно удалить.

### IN-06: `fibonacciSphere(1)` возвращает NaN

**Файл:** `src/components/hero/globe.ts:68`
**Проблема:** `const y = 1 - (i / (n - 1)) * 2` при `n === 1` делит на ноль, дальше
`Math.sqrt(Math.max(0, 1 - y*y))` даёт NaN и все три координаты становятся NaN. Продакшн
всегда зовёт функцию с `GLOBE_POINTS = 2200`, так что это ловушка для будущих тестов и
экспериментов с плотностью точек.
**Исправление:** `const y = n === 1 ? 0 : 1 - (i / (n - 1)) * 2;`

### IN-07: `Reveal` читает matchMedia без проверки и запоминает брейкпоинт навсегда

**Файл:** `src/components/layout/Reveal.tsx:45-48`
**Проблема:** `typeof window !== "undefined" && window.matchMedia(MOBILE_QUERY)` падает с
TypeError, если `matchMedia` отсутствует; соседний `src/lib/useReducedMotion.ts:6-8`
проверяет именно `typeof window.matchMedia !== "function"`. Второе: ширина снимается
`useState`-инициализатором один раз, поэтому после поворота планшета `Reveal` продолжает
сдвигать блоки на 24px там, где CSS-токен `--reveal-shift` уже равен 16px. Расхождение
величины, объявленной «единственным источником», с фактической.
**Исправление:** вынести чтение в общий хелпер рядом с `useReducedMotion` и подписаться на
`change`, либо читать сдвиг из CSS-переменной `--reveal-shift` через `getComputedStyle`,
как это уже сделано для `--header-offset` в `src/lib/headerOffset.ts`.

### IN-08: README описывает CI без шага линтера

**Файл:** `README.md:21`
**Проблема:** «он ставит зависимости через `npm ci`, гоняет `npm test`, собирает `npm run
build`» — в `deploy.yml` между установкой и тестами стоит ещё `npm run lint`, который
блокирует деплой так же, как тесты.
**Исправление:** дописать `npm run lint` в перечисление.

### IN-09: проверка id секций в бандле почти ничего не проверяет

**Файл:** `scripts/check-dist.mjs:157-169`
**Проблема:** `checkSectionIds` ищет в склеенном JS подстроку `"hero"`, `"map"`, `"quote"`
в любых кавычках. Слово `map` встретится в минифицированном бандле как имя метода или ключа
почти гарантированно, `quote` и `news` придут из текстов копирайта. Проверка отдаёт OK и
тогда, когда секция потеряна.
**Исправление:** сверять не бандл, а разметку после запуска: либо проверять `id` по
`dist/index.html` (сейчас там только `#root`), либо перенести эту проверку в браузерный
smoke, где секции ищутся в живом DOM, и убрать её из `check-dist`.

### IN-10: `data-anim="beam"` висит на кнопках, у которых луча нет

**Файл:** `src/components/layout/Button.tsx:27`
**Проблема:** атрибут ставится всем `variant="primary"`, а анимацию несёт только
`.btn[data-beam="true"]::before`. Кнопка отправки формы объявляет себя носителем движения,
не будучи им. Сейчас безвредно (без `content` псевдоэлемент не создаётся, правило
`[data-anim="beam"]::before` ни к чему не применяется), но реестр `data-anim` из 05-UI-SPEC
перестаёт отвечать на вопрос «что на странице движется».
**Исправление:** `const anim = variant === "primary" && (rest as { "data-beam"?: string })["data-beam"] === "true" ? "beam" : undefined;`
или, чище, перенести решение в вызывающий код, который уже ставит `data-beam`.

## Замечания по единообразию (CONVENTION)

### CV-01: два стиля именования CSS-файлов компонентов

**Файл:** `src/components/layout/Footer.css`, `src/components/layout/Header.css`,
`src/components/layout/ErrorBoundary.css`
**Отклонение:** PascalCase при доминирующем kebab/lowercase.
**Выведенное правило:** восемь из одиннадцати CSS-файлов компонентов названы строчными
буквами (`hero.css`, `map.css`, `about.css`, `involve.css`, `resources.css`,
`light-form.css`, `video-embed.css`, `primitives.css`), три — по имени компонента.
**Рекомендуемая правка:** переименовать три файла в `footer.css`, `header.css`,
`error-boundary.css` вместе с импортами. Правка косметическая, слияние не блокирует.

### CV-02: версия vitest расходится с зафиксированным стеком

**Файл:** `package.json:47`
**Отклонение:** `"vitest": "^4.1.11"`, прогон печатает `RUN v4.1.11`.
**Выведенное правило:** CLAUDE.md (раздел Development Tools) объявляет Vitest 5.x.
**Рекомендуемая правка:** либо обновить зависимость до 5.x и перепрогнать набор, либо
поправить таблицу стека в CLAUDE.md на фактическую мажорную версию. Сейчас документ
обещает то, чего в проекте нет.

### CV-03: заголовочный блок ресурсов лежит внутри каскада, но в нём не участвует

**Файл:** `src/components/resources/Resources.tsx:99-110`
**Отклонение:** `Reveal` вложен в `RevealGroup` рядом с тремя `RevealItem`.
**Выведенное правило:** паттерн фазы, записанный в 05-01-SUMMARY: «Заголовочный блок секции
= `<Reveal>`, сетка карточек = `<RevealGroup>` + `<RevealItem>`»; в `About`, `Involve`,
`News` заголовок стоит рядом с группой, а не внутри неё.
**Рекомендуемая правка:** вынести `Reveal` заголовка из `RevealGroup` и оставить в группе
только карточки. Сейчас `staggerChildren` раздаётся трём детям из четырёх, а `Reveal`
переопределяет унаследованный вариант собственными `initial`/`whileInView` — работает, но
читается как ошибка.

---

_Проверено: 2026-09-05T22:30:00Z_
_Ревьюер: Claude (gsd-code-reviewer)_
_Глубина: standard_
