---
phase: 05-polish-and-release
verified: 2026-09-05T19:21:05Z
status: passed
score: 38/38 must-haves verified
has_blocking_gaps: false
overrides_applied: 0
re_verification: null
gaps: []
deferred: []
notes:
  - "Phase 5 закрывает майлстоун: более поздних фаз, куда можно отложить находки, нет"
  - "Браузерная приёмка выполнена оркестратором через Playwright MCP и записана в docs/qa/SMOKE.md и 05-HUMAN-UAT.md (8 из 8), поэтому human_needed не выставляется"
---

# Фаза 5: Полировка и финальный прогон. Отчёт о проверке

**Цель фазы:** Секции лендинга плавно появляются при скролле, страница безупречно работает на всех целевых ширинах без ошибок в консоли, а финальный деплой подтверждён Playwright smoke-тестами
**Проверено:** 2026-09-05T19:21:05Z
**Статус:** passed
**Повторная проверка:** нет, первая проверка фазы
**Коммит:** `dce04f6`, совпадает с `origin/main` и с задеплоенным SHA прогона [33986485474](https://github.com/thevladoss/esd-onevoice27/actions/runs/33986485474)

## Что я прогнал сам

Ни один пункт ниже не взят из SUMMARY.md. Команды выполнены в этой сессии на рабочем дереве.

| Команда | Результат |
|---|---|
| `npm test` | exit 0, **42 файла / 335 тестов** зелёные; grep по полному выводу не нашёл ни `Warning`, ни `not wrapped in act`, ни `stderr` |
| `npm run lint` | exit 0, вывод пуст |
| `npm run build` | exit 0, предупреждения о размере чанков нет; чанки `vendor-map-BjCgd77U.js` 182.70 КБ и `index-DkFfHplE.js` 393.36 КБ |
| `node scripts/check-dist.mjs` | `OK: 11 проверок`, exit 0 |
| `node scripts/check-dist.mjs --dist <сломанная копия>` | **негативный тест:** exit 1, поймано 5 из 5 подложенных дефектов (`lang`, `title`, префикс ассетов, ссылки от корня, пропавший `vendor-map`) |
| `curl -sI https://thevladoss.github.io/esd-onevoice27/` | `HTTP/2 200` |
| `diff` списков ассетов прода и `dist/index.html` | пуст: `index-DkFfHplE.js`, `index-HFIOJlwW.css`, `vendor-map-BjCgd77U.js` в обоих |
| `gh run view 33986485474` | `conclusion=success`, `headSha=dce04f64…` равен локальному HEAD |
| `npx vitest run -t "рисует ореолы плоскими кругами без shadowBlur"` | 1 passed |
| `npx vitest run -t "показывает контент сразу и не ставит inline opacity 0"` | 1 passed |
| Просмотр `final-desktop.jpeg`, `final-mobile.jpeg`, `final-full.jpeg`, `final-reduced-motion.jpeg` | глобус рисуется телом с ореолами и орбитами, восемь секций залиты реальным контентом, счётчики 694 / 248, заглушек в вёрстке нет |

Негативный тест `check-dist.mjs` снимает главное подозрение по фазе: скрипт не штампует OK, а реально валит сборку с подменёнными `lang`, `title`, base-префиксом и вырезанным чанком.

## Достижение цели

### Критерии успеха ROADMAP

| # | Критерий | Статус | Доказательство |
|---|---|---|---|
| 1 | Секции и карточки появляются при скролле через motion один раз, при reduced motion контент виден сразу; фоновые CSS-анимации гаснут вместе с ним | ✓ VERIFIED | `Reveal.tsx` ветвится на `useReducedMotion`: при reduce возвращает голый `Tag` без inline-стилей; `viewport={{ once: true }}`; `global.css:262` держит единственный блок `@media (prefers-reduced-motion: reduce)`, гасящий `[data-anim]`, `::before`, `::after`; `motionPolicy.test.ts` запрещает второй такой блок в любом CSS-файле; SMOKE: 31 обёртка из 31 с `opacity 1` и `transform none`, 51 слой `[data-anim]` с `animationName: none` |
| 2 | Страница без горизонтального скролла на 390, 768, 1024 и 1440px, видимый фокус и aria у интерактивных элементов, консоль собранного билда без ошибок и 404 | ✓ VERIFIED | `body { overflow-x: clip }`, глобальное `:focus-visible { outline: 2px solid var(--color-horizon-200); outline-offset: 4px }`; grep не нашёл ни одного `console.*` в продакшн-коде `src`; SMOKE на пяти ширинах 320/390/768/1024/1440: `scrollWidth === innerWidth` до и после прокрутки, кольцо фокуса на 10 стопах из 10, прод 0 ошибок консоли и 45 ответов со статусом 200 |
| 3 | Component-тесты дополнительно покрывают навигацию header и чипы стран | ✓ VERIFIED | `Header.test.tsx` 510 строк, 24 кейса: якоря, `scrollTo` с `smooth`/`auto`, `aria-current`, бургер, Esc, фокус-трап; `CountryChips.test.tsx` 9 кейсов: `aria-pressed`, Enter и пробел, порядок стран, отдача кода страны |
| 4 | Сайт на GitHub Pages совпадает с локальным preview, Playwright smoke подтверждает секции и чистую консоль на 1440 и 390px | ✓ VERIFIED | Прод отдаёт 200, список ассетов побайтно тот же, что в `dist/index.html` текущей сборки; SMOKE фиксирует sha256 четырёх живых файлов равными локальным; десять строк чеклиста заполнены для preview и прода |

**Итог по ROADMAP: 4/4.**

### Must-haves планов

#### 05-01. Reveal, RevealGroup, RevealItem (MOTION-01)

| # | Truth | Статус | Доказательство |
|---|---|---|---|
| 1 | Заголовки и сетки семи секций появляются один раз: opacity 0 → 1, сдвиг 24px (16px ниже 768px), 0.7s, `cubic-bezier(0.22, 1, 0.36, 1)` | ✓ VERIFIED | `reveal.constants.ts`: `REVEAL_DURATION = 0.7`, `REVEAL_EASE = [0.22, 1, 0.36, 1]`, `REVEAL_SHIFT_DESKTOP = 24`, `REVEAL_SHIFT_MOBILE = 16`; `useRevealSetup` читает `(max-width: 767px)` один раз при монтировании; `viewport.once = true` |
| 2 | Сетки карточек идут каскадом с шагом 0.08s через variants, не через delay на каждом | ✓ VERIFIED | `groupVariants.visible.transition = { staggerChildren: REVEAL_STAGGER, delayChildren: REVEAL_DELAY_CHILDREN }`; у `RevealItem` своего `whileInView` нет, состояние приходит от группы |
| 3 | При reduce три обёртки рендерят обычные элементы без motion и без inline opacity 0 | ✓ VERIFIED | В каждой из трёх функций ветка `if (reduce) return <Tag …>`; `Reveal.test.tsx` проверяет отсутствие inline `opacity`; SMOKE: «motion-обёрток нет, Reveal отдаёт детей напрямую» |
| 4 | Hero без Reveal, три блока проявляются fade 0.6s с задержками 0 / 0.08 / 0.16s | ✓ VERIFIED | `Hero.tsx:16` `fadeIn(index)` на `HERO_FADE_DURATION = 0.6` и `HERO_FADE_DELAYS = [0, 0.08, 0.16]`, применён к eyebrow, `hero__title`, `hero__subtitle`; импорта `Reveal` в hero нет |
| 5 | Reveal двигает только opacity и y, после завершения `transform: none` | ✓ VERIFIED | В `initial`/`whileInView` только `opacity` и `y`, ни scale, ни blur, ни filter; SMOKE: 31 из 31 обёртки с `transform === "none"` на preview и проде |

#### 05-02. Единый блок reduced motion и оболочка (MOTION-02, MOTION-03)

| # | Truth | Статус | Доказательство |
|---|---|---|---|
| 1 | Один блок `@media` в `global.css` гасит луч, пульсацию, звёзды, глобус, волны и гало через `data-anim`, оставляя статичные кадры | ✓ VERIFIED | `global.css:262`; правила `[data-anim] { animation: none !important }` плюс конечные состояния для `halo`, `pulse`, `beam`, `particles`, `new-light`; `motionPolicy.test.ts` требует ровно одного вхождения и единственного файла |
| 2 | Прокрутка к якорям при reduce идёт с `behavior: auto` | ✓ VERIFIED | `scrollToSection.ts`: `const behavior = prefersReducedMotion() ? "auto" : "smooth"`; `Header.test.tsx` кейс «убирает плавность, когда система просит уменьшить движение» |
| 3 | Skip-link первым, `main#main`, nav «Основная навигация», footer nav с `rel="noopener noreferrer"` | ✓ VERIFIED | `SkipLink.tsx` с `href="#main"`, `App.tsx` порядок SkipLink → Header → `main#main` → Footer; `App.test.tsx` кейсы про первый стоп табом и ландмарки; `motionPolicy.test.ts` валит любую строку с `target="_blank"` без `noopener noreferrer`; SMOKE: первый стоп skip-link |
| 4 | Кольцо фокуса `outline: 2px solid var(--color-horizon-200)` с offset 4px, `outline: none` в исходниках нет | ✓ VERIFIED | `global.css:61`; `motionPolicy.test.ts` кейс «нигде в исходниках не снимает обводку фокуса» ищет `outline: none`, `outline-width: 0`, `outline-none` по всем `.css/.ts/.tsx`; SMOKE: `solid 2px rgb(170, 217, 220)` на 10 стопах из 10. См. примечание 3 |
| 5 | `body` держит `overflow-x: clip`, `html` держит `scroll-padding-top` | ✓ VERIFIED | `global.css:58` `overflow-x: clip` (тест отдельно запрещает `hidden`), `html { scroll-padding-top: var(--header-offset) }`. Значение переменной 100px и 104px на десктопе вместо заявленных в плане 96px. См. примечание 1 |

#### 05-03. Аудит a11y и адаптива hero, map, form, about, involve (MOTION-03)

| # | Truth | Статус | Доказательство |
|---|---|---|---|
| 1 | Пять секций несут `aria-labelledby` на свой заголовок, на странице один h1 | ✓ VERIFIED | `Hero.tsx:45`, `MapSection.tsx:36` напрямую; `light-form`, `about`, `involve` через `Section titleId`; единственный h1 в `Hero.tsx:39`; `App.test.tsx` кейсы «называет каждую секцию её заголовком» и «держит ровно один h1» |
| 2 | Карта как `role="img"` с `title`, счётчики с `aria-live="polite"`, чипы с `aria-pressed` и клавиатурой, поля через `aria-invalid`/`aria-describedby` с уводом фокуса, тост `role="status"` | ✓ VERIFIED | `EsdMap.tsx:258` `role="img"` + `<title id>` + `aria-describedby`; `Counters.tsx:28` `aria-live="polite"`; `CountryChips.tsx:36` `aria-pressed`; `FormField.tsx` связывает label, `aria-invalid`, `aria-describedby`; `LightForm.tsx:54` уводит фокус на первое невалидное поле; `SuccessToast.tsx:26` `role="status"` |
| 3 | Видео-фасад и декоративные SVG не мешают скринридеру | ✓ VERIFIED | `VideoEmbed.tsx:83` `aria-label={watchLabel(title)}`; декоративные слои карты и триптиха под `aria-hidden="true"` |
| 4 | На 390px счётчики над картой, чипы переносятся, форма в одну колонку, стек карточек, горизонтального скролла нет | ✓ VERIFIED | `overflow: hidden` на секциях с декоративными слоями (`hero.css:7`, `map.css:262/298`), `min-w-0` на flex- и grid-детях; SMOKE: раскладка 390 подтверждена, `scrollWidth === innerWidth`; `final-mobile.jpeg` и `phase5-live-mobile-full.jpeg` |
| 5 | Текст на стекле не бледнее .72, кроме плейсхолдера .56, у каждого поля видимый label | ✓ VERIFIED | В зоне плана значения текста только `.72` и выше (`.8`, `.82`, `.86`, `.9`, `.92`, `.94`), `.56` держит `--field-placeholder` в `light-form.css:12`, значения ниже `.55` относятся к звёздам и градиентам; `LightForm.test.tsx` кейс «связывает каждый контрол с видимой подписью через htmlFor»; SMOKE: 11.3:1 и 9.3:1. См. примечание 2 |

#### 05-04. Слияние видео-фасада, a11y и адаптив news, resources, quote (MOTION-02, MOTION-03)

| # | Truth | Статус | Доказательство |
|---|---|---|---|
| 1 | Один компонент фасада `about/VideoEmbed.tsx`, `VideoFacade` удалён, панель «Видео» и «О проекте» рендерят его же | ✓ VERIFIED | `VideoFacade.tsx` и `VideoFacade.test.tsx` в дереве отсутствуют; `VideoEmbed` импортируют `About.tsx:8` и `VideoGrid.tsx:1`; кнопка `aria-label` «Смотреть видео: {название}», iframe на `youtube-nocookie.com` монтируется после клика. См. примечание 4 |
| 2 | news, resources, quote несут `aria-labelledby`, у quote есть h2 | ✓ VERIFIED | `News.tsx:27`, `Resources.tsx:81`, `Quote.tsx:10`; `Quote.tsx:22` держит `<h2 id="quote-title" className="sr-only">` |
| 3 | Карточки ресурсов: `aria-expanded`, `aria-controls`, фокус на панели, Esc, кнопка «Свернуть» с `aria-label`, девять значений `data-anim` в проекте | ✓ VERIFIED | `ResourceCard.tsx:28,32`; `ResourcePanel.tsx` `role="region"`, `tabIndex={-1}`, `aria-label` на кнопке закрытия; `Resources.tsx:158` ловит Escape; grep даёт ровно 9 значений `data-anim` (stars, globe, beam, pulse, new-light, particles, atmosphere, wave, halo), `motionPolicy.test.ts` держит этот список закрытым |
| 4 | Новости: карточка-ссылка с `rel="noopener noreferrer"`, пагинация в `nav` с `aria-label`, `aria-current="page"`, стрелка с `aria-label` | ✓ VERIFIED | `NewsCard.tsx:38`, `NewsPagination.tsx:38,46,47,67` |
| 5 | На 390px новости в одну колонку, ресурсы стеком, видео в две колонки, `overflow: hidden` у resources и quote | ✓ VERIFIED | `News.tsx:63` `grid gap-6 md:grid-cols-2 lg:grid-cols-3`; `Resources.tsx:99` `flex flex-col gap-6 md:grid`; `ResourcePanel.tsx` `grid-cols-2 md:grid-cols-3 lg:grid-cols-4`; `overflow-hidden` в `Resources.tsx:82` и `Quote.tsx:11`; SMOKE подтверждает раскладку на 390 |

#### 05-05. Добор component-тестов (QA-02)

| # | Truth | Статус | Доказательство |
|---|---|---|---|
| 1 | `App.test.tsx` подтверждает восемь секций, один h1, skip-link первым, `main#main`, nav, footer, отсутствие `target="_blank"` без noopener | ✓ VERIFIED | 14 кейсов, включая «все восемь секций содержат реальную вёрстку, а не заглушки», «рендерит страницу молча: ни ошибок, ни предупреждений в консоли», «не отдаёт внешним вкладкам доступ к opener» |
| 2 | `Header.test.tsx` подтверждает четыре якоря, `scrollTo` с behavior, бургер с блокировкой скролла, Esc с возвратом фокуса | ✓ VERIFIED | 24 кейса в трёх describe, включая user-event-блок «ведёт к секции плавно, пока движение разрешено» и «закрывает оверлей по Escape, возвращает фокус на бургер и отдаёт скролл» |
| 3 | CountryChips, LightForm и Resources покрыты: `aria-pressed`, 6 ошибок на пустой отправке и рост счётчика, панели с `aria-expanded`, Esc и фокусом | ✓ VERIFIED | `CountryChips.test.tsx` 9 кейсов; `LightForm.test.tsx` кейсы «на пустой отправке показывает шесть ошибок и уводит фокус на имя» и «растит счётчик „Человек“ на один»; `Resources.test.tsx` 19 кейсов, включая Esc и возврат фокуса на карточку-триггер |
| 4 | `npm test` зелёный без предупреждений act и без `Warning` в выводе | ✓ VERIFIED | Полный прогон сохранён и прогрепан: 335 passed, exit 0, ни одного `Warning`, `not wrapped in act` или `stderr` |

#### 05-06. Бандл, консоль и инструменты приёмки (MOTION-04, QA-04)

| # | Truth | Статус | Доказательство |
|---|---|---|---|
| 1 | `npm run build` без предупреждения о размере чанков и без deprecated, d3/topojson/world-atlas в `vendor-map` | ✓ VERIFIED | Мой прогон: вывод содержит только четыре строки размеров, предупреждений нет; `vite.config.ts` держит `codeSplitting.groups` с маской `node_modules[\\/](d3-[a-z-]+|topojson-client|world-atlas)[\\/]` |
| 2 | В продакшн-коде `src` нет ни одного `console.*` | ✓ VERIFIED | Grep по `*.ts`, `*.tsx`, `*.css` вернул ноль совпадений даже с учётом тестов |
| 3 | `check-dist.mjs` проверяет lang, title, og, ассеты, `vendor-map`, потолок 500 КБ, восемь id секций, внешние хосты | ✓ VERIFIED | `OK: 11 проверок` на текущем `dist`; негативный прогон по сломанной копии дал `FAIL: 5 проверок из 11 не прошли`, exit 1 |
| 4 | README содержит раздел «Проверка», SMOKE.md содержит полный чеклист | ✓ VERIFIED | `README.md` раздел «## Проверка» с пятью подразделами и ссылкой на `docs/qa/SMOKE.md`; сам чеклист держит десять строк проверок, блок контраста, таблицу скриншотов и блок прода |

#### 05-07. Финальный деплой и приёмка (QA-04, MOTION-04)

| # | Truth | Статус | Доказательство |
|---|---|---|---|
| 1 | main запушен, Actions прогнал ci/test/build/деплой, прод отвечает 200 с тем же title и списком ассетов | ✓ VERIFIED | HEAD равен `origin/main` и равен `headSha` успешного прогона 33986485474; `curl -sI` даёт `HTTP/2 200`; `diff` списков ассетов прода и `dist/index.html` пуст; `deploy.yml` гоняет `npm ci`, `npm run lint`, `npm test`, `npm run build` до `upload-pages-artifact` |
| 2 | Playwright smoke по preview и проду на 1440×900 и 390×844: восемь секций, 0 ошибок консоли, 0 ответов 404/5xx, без горизонтального скролла на пяти ширинах, reveal и reduced motion | ✓ VERIFIED | `docs/qa/SMOKE.md` держит заполненные колонки preview и прода по всем десяти строкам; `05-HUMAN-UAT.md` фиксирует 8 из 8 passed, 0 issues; прод: 45 ответов, все 200 |
| 3 | Четыре скриншота в `docs/qa`, результаты записаны с датой и коммитом | ✓ VERIFIED | Файлы на диске от 22:06–22:07; я открыл `final-desktop`, `final-mobile`, `final-full` и `final-reduced-motion` и подтвердил содержимое; SMOKE фиксирует дату 2026-09-05 и сборку a69b775 |

#### 05-08. Глобус без shadowBlur (MOTION-02, MOTION-04, QA-04)

| # | Truth | Статус | Доказательство |
|---|---|---|---|
| 1 | Глобус рисуется без `shadowBlur`, кадр укладывается в 16 мс, rAF держит не меньше 55 fps | ✓ VERIFIED | Grep по всему `src`: ни одного присваивания `shadowBlur` в продакшн-коде, только упоминания в комментарии и в тестах-сторожах; `globe.ts:207` кладёт ореол через `globalAlpha` и `arc`; SMOKE: 121 fps в hero, при прокрутке и в середине страницы, на preview и на проде |
| 2 | Средняя яркость области глобуса на проде не ниже 100/255, сфера читается как тело с ореолами | ✓ VERIFIED | SMOKE фиксирует 125/255 при 100% освещённых сэмплов; я открыл `final-desktop.jpeg` и `final-mobile.jpeg`: сфера читается телом, ореолы у части точек и три орбитальные дуги на месте |
| 3 | Тесты глобуса описывают новую отрисовку: ореол каждой шестой точки, ни одного `shadowBlur`, вращение по времени кадра | ✓ VERIFIED | `globe.test.ts` кейсы «рисует точку, ореол каждой шестой, свечение, лимб и три орбитальные дуги» и «рисует ореолы плоскими кругами без shadowBlur» (прогнал отдельно, passed); `GlobeCanvas.test.tsx` «вращает глобус по времени кадра, а не по их числу» |

**Итог по планам: 34/34. Общий счёт: 38/38.**

### Обязательные артефакты

| Артефакт | Ожидание | Уровни 1–4 | Статус |
|---|---|---|---|
| `src/components/layout/reveal.constants.ts` | `REVEAL_DURATION = 0.7` | 30 строк, значение на месте, импортируется `Reveal.tsx` и `Hero.tsx` | ✓ VERIFIED |
| `src/components/layout/Reveal.tsx` | экспорт трёх обёрток, ≥60 строк | 173 строки, три экспорта, импортируется восемью секциями | ✓ VERIFIED |
| `src/components/layout/Reveal.test.tsx` | тест reduce | 66 строк, 3 кейса, зелёные | ✓ VERIFIED |
| `src/components/layout/Reveal.motion.test.tsx` | тест без reduce | 53 строки, 2 кейса, зелёные | ✓ VERIFIED |
| `src/styles/global.css` | токены reveal, блок reduce, кольцо фокуса, `overflow-x: clip` | 323 строки, всё на месте, попадает в `dist/assets/index-HFIOJlwW.css` | ✓ VERIFIED |
| `src/components/layout/SkipLink.tsx` | «Перейти к содержимому» | текст берётся из `copy.shell.skipLink`, отрисован первым в `App.tsx` | ✓ VERIFIED |
| `src/App.tsx` | `main#main`, порядок ландмарков | 35 строк, порядок соблюдён, `tabIndex={-1}` для цели skip-link | ✓ VERIFIED |
| `src/components/layout/Section.tsx` | проп `titleId` и `aria-labelledby` | проп прокинут на `<section>` и на `GradientTitle` | ✓ VERIFIED |
| `src/components/map/EsdMap.tsx` | `role="img"` | 356 строк, `role`, `<title>`, `aria-describedby` | ✓ VERIFIED |
| `src/components/form/FormField.tsx` | `aria-describedby` | 47 строк, отдаёт контролу id, класс, `aria-invalid`, `aria-describedby` | ✓ VERIFIED |
| `src/components/about/VideoEmbed.tsx` | `youtube-nocookie.com` | 119 строк, валидация id, sandbox, отложенный iframe | ✓ VERIFIED |
| `src/components/resources/Resources.tsx` | `data-anim="particles"` | 170 строк, три слоя частиц плюс атмосфера | ✓ VERIFIED |
| `src/components/quote/Quote.tsx` | `quote-title` | 48 строк, figure/blockquote/figcaption/cite | ✓ VERIFIED |
| `src/App.test.tsx` | содержит `light-form` | 198 строк, 14 кейсов | ✓ VERIFIED |
| `src/components/layout/Header.test.tsx` | содержит «Основная навигация» | 510 строк, 24 кейса | ✓ VERIFIED |
| `vite.config.ts` | `vendor-map` | 35 строк, чанк подтверждён выводом сборки | ✓ VERIFIED |
| `scripts/check-dist.mjs` | ≥60 строк | 233 строки, 11 реальных проверок, негативный тест валит сборку | ✓ VERIFIED |
| `docs/qa/SMOKE.md` | содержит `final-reduced-motion.jpeg` | 108 строк, обе колонки результатов заполнены, вердикт «Принято» | ✓ VERIFIED |
| `README.md` | раздел «## Проверка» | на месте, пять подразделов | ✓ VERIFIED |
| `src/components/hero/globe.ts` | `GLOBE_HALO_SCALE` | 221 строка, константа на строке 35, `shadowBlur` не используется | ✓ VERIFIED |
| `docs/qa/final-full.jpeg` | полный скриншот 1440 | 619 КБ, открыт и проверен: восемь секций с контентом | ✓ VERIFIED |
| `src/components/resources/VideoFacade.tsx` | **должен быть удалён** | файла нет, как и его теста | ✓ VERIFIED (удаление подтверждено) |

Ни одного MISSING, STUB или ORPHANED артефакта.

### Проверка ключевых связей

| Откуда | Куда | Через | Статус | Детали |
|---|---|---|---|---|
| `Reveal.tsx` | `motion/react` | `import { motion, useReducedMotion }` | ✓ WIRED | строка 3 |
| `Reveal.tsx` | `reveal.constants.ts` | шесть констант | ✓ WIRED | строки 5–12 |
| Семь секций | `layout/Reveal.tsx` | обёртки вокруг заголовков и сеток | ✓ WIRED | map (MapSection + Counters), form, about, involve, news, resources, quote: 24 использования |
| `global.css` | слои `[data-anim]` | селекторы внутри блока reduce | ✓ WIRED | 9 значений в 6 компонентах, реестр закрыт тестом |
| `SkipLink.tsx` | `App.tsx main#main` | `href="#main"` | ✓ WIRED | цель существует, `tabIndex={-1}` |
| `scrollToSection.ts` | `matchMedia("(prefers-reduced-motion: reduce)")` | `behavior: auto`/`smooth` | ✓ WIRED | строка 25 |
| секции | id заголовка | `aria-labelledby` | ✓ WIRED | все восемь секций |
| `CountryChips.tsx` | активная страна | `aria-pressed` | ✓ WIRED | строка 36 |
| `ResourcePanel.tsx` | `about/VideoEmbed.tsx` | импорт фасада | ⚠️ WIRED косвенно | связь идёт через `VideoGrid.tsx:1`. Компонент один, план ожидал прямой импорт. См. примечание 4 |
| `ResourceCard.tsx` | id панели | `aria-controls` | ✓ WIRED | строка 32, выставляется только у раскрытой карточки |
| `global.css` reduce | `resources/*.tsx` | `[data-anim="particles"] { opacity: .28 }` | ✓ WIRED | правило и три носителя атрибута |
| `package.json` | `scripts/check-dist.mjs` | `check:dist` | ✓ WIRED | скрипт объявлен, прогнан |
| `vite.config.ts` | `node_modules/d3-*`, `topojson-client`, `world-atlas` | `codeSplitting.groups[].test` | ✓ WIRED | чанк `vendor-map` в выводе сборки |
| `.github/workflows/deploy.yml` | GitHub Pages | `id-token: write` у джобы deploy | ✓ WIRED | права разделены: build читает, deploy публикует |
| `dist/index.html` | прод | одинаковый список `/esd-onevoice27/assets/*` | ✓ WIRED | `diff` пуст |
| `GlobeCanvas.tsx` | `globe.ts` | `drawGlobe` каждый кадр rAF | ✓ WIRED | плюс тест «запускает rAF-цикл и снимает его при размонтировании» |

### Трассировка данных (уровень 4)

| Артефакт | Переменная | Источник | Реальные данные | Статус |
|---|---|---|---|---|
| `EsdMap.tsx` | `lights` | `state/lights.tsx` через `LightsProvider`, детерминированный генератор `data/lights.ts` | да, огоньки на скриншоте видны, форма добавляет новые | ✓ FLOWING |
| `Counters.tsx` | `people`, `groups` | тот же контекст, `formatCount` | да, `final-full.jpeg` показывает 694 / 248 | ✓ FLOWING |
| `News.tsx` | `items` | `data/news.ts`, 9 записей через `paginate` | да, 6 карточек на странице плюс пагинация | ✓ FLOWING |
| `ResourcePanel.tsx` | `card`, списки | `data/copy.resources.ts`, `data/materials.ts`, `data/videos.ts` | да, 5 материалов и 16 роликов подтверждены тестами | ✓ FLOWING |
| `LightForm.tsx` | `values`, `errors` | локальное состояние плюс `addLight` в контекст | да, тест фиксирует рост счётчика на 1 | ✓ FLOWING |
| `GlobeCanvas.tsx` | точки сферы | `fibonacciSphere` в `globe.ts` | да, сфера на скриншотах | ✓ FLOWING |

Пустых пропов и статических заглушек вместо данных нет.

### Поведенческие спот-чеки

| Поведение | Команда | Результат | Статус |
|---|---|---|---|
| Тесты фазы существуют и зелёные | `npm test` | 42 файла / 335 тестов, exit 0 | ✓ PASS |
| Линт чистый | `npm run lint` | пустой вывод, exit 0 | ✓ PASS |
| Сборка без предупреждения о чанках | `npm run build` | 4 строки размеров, `vendor-map` отдельно | ✓ PASS |
| Проверка dist | `node scripts/check-dist.mjs` | `OK: 11 проверок` | ✓ PASS |
| Проверка dist ловит дефекты | `node scripts/check-dist.mjs --dist <сломанная копия>` | 5 FAIL из 5 подложенных, exit 1 | ✓ PASS |
| Прод жив | `curl -sI …/esd-onevoice27/` | `HTTP/2 200` | ✓ PASS |
| Прод равен локальной сборке | `diff` списков ассетов | пусто | ✓ PASS |
| Деплой на текущем коммите | `gh run view 33986485474` | success, sha равен HEAD | ✓ PASS |
| Ореолы глобуса без shadowBlur | `npx vitest run -t "рисует ореолы плоскими кругами без shadowBlur"` | 1 passed | ✓ PASS |
| Reveal при reduce отдаёт контент сразу | `npx vitest run -t "показывает контент сразу и не ставит inline opacity 0"` | 1 passed | ✓ PASS |

### Прогон probe

Проект не держит `scripts/*/tests/probe-*.sh`, планы фазы probe-скрипты не объявляли. Роль probe играют `npm test`, `npm run lint`, `npm run build` и `scripts/check-dist.mjs`: все четыре прогнаны выше в этой сессии.

### Покрытие требований

| Требование | План | Описание | Статус | Доказательство |
|---|---|---|---|---|
| MOTION-01 | 05-01 | Секции и карточки появляются при скролле через `motion`, при reduce видны сразу | ✓ SATISFIED | `Reveal.tsx` + `reveal.constants.ts`, 5 тестов в двух файлах, SMOKE 31/31 |
| MOTION-02 | 05-02, 05-04, 05-08 | Фоновые CSS-анимации отключаются при reduced motion | ✓ SATISFIED | единственный блок в `global.css`, 9 значений `data-anim`, `motionPolicy.test.ts`, SMOKE 51 слой с `animationName: none` |
| MOTION-03 | 05-02, 05-03, 05-04 | 390/768/1024/1440 без горизонтального скролла, видимый фокус и aria | ✓ SATISFIED | `overflow-x: clip`, глобальное кольцо фокуса, `aria-labelledby` на восьми секциях, SMOKE на пяти ширинах и 10 стопах табом |
| MOTION-04 | 05-06, 05-07, 05-08 | В консоли собранного билда нет ошибок и 404 | ✓ SATISFIED | ноль `console.*` в `src`, SMOKE: 0 ошибок и 45 ответов 200 на проде |
| QA-02 | 05-05 | Component-тесты покрывают форму, чипы, панели ресурсов и навигацию header | ✓ SATISFIED | `LightForm.test.tsx`, `CountryChips.test.tsx`, `Resources.test.tsx`, `Header.test.tsx`, `App.test.tsx` |
| QA-04 | 05-06, 05-07, 05-08 | Прод совпадает с preview, Playwright smoke подтверждает секции и чистую консоль | ✓ SATISFIED | 200, совпадение ассетов, sha256 4 из 4, SMOKE и HUMAN-UAT заполнены |

Осиротевших требований нет: `REQUIREMENTS.md` относит к фазе 5 ровно эти шесть ID, и каждый заявлен хотя бы одним планом.

### Найденные анти-паттерны

Скан по `src`, `scripts`, `vite.config.ts`, `index.html`, `.github`.

| Что искал | Найдено | Вердикт |
|---|---|---|
| `TODO`, `FIXME`, `XXX`, `TBD`, `HACK`, `PLACEHOLDER` | 0 | чисто, гейт долговых маркеров пройден |
| `console.*` в продакшн-коде | 0 | чисто |
| `outline: none`, `outline-width: 0` | 0 | чисто, сторожевой тест держит инвариант |
| «coming soon», «в разработке», «скоро будет» | 0 | чисто |
| `return null` / `return []` | 6 | все шесть охранные: нет контекста, тост закрыт, невалидный id ролика, проекция не готова, нет `matchMedia`. Не заглушки |
| Пустые обработчики `=> {}` | 1 | `Header.tsx:20` возвращает no-op отписку из `useSyncExternalStore`, когда `matchMedia` отсутствует. Корректно |
| Слово «заглушка» | 1 | `MusicPlaceholder.tsx`: честная заглушка панели «Музыка», прямо заказанная критерием 2 фазы 4. Не дефект |

Блокеров нет, предупреждений нет.

### Примечания (info, ни одно не блокирует цель)

1. **`scroll-padding-top` равен 100px и 104px, а не 96px из текста плана 05-02.** `global.css:14` держит `--header-offset: 100px` с расчётом в комментарии (12 + 72 + 16) и 104px от десктопного брейкпоинта. Единый источник соблюдён: значение читают и `scroll-padding-top`, и `lib/headerOffset.ts`. Результат измерен: SMOKE даёт зазор 150–255px против требуемых 16px. Число в плане было оценкой, код держит пересчитанное.
2. **`text-paper/62` в двух подписях секции ресурсов** (`ResourceCard.tsx:38`, `ResourcePanel.tsx:38`) ниже порога .72 из truth плана 05-03. Секция ресурсов в зону 05-03 не входила, это микроподписи капсом жирным, контраст остаётся выше 7:1 при пороге WCAG 4.5:1. Претензии по доступности нет.
3. **`main:focus` и `main:focus-visible` гасят кольцо через `outline-color: transparent`.** Осознанное исключение с комментарием в `global.css:68`: программный фокус на цели skip-link не должен обводить всю страницу. Обводка снимается только у ландмарки, клавиатурный фокус внутри `main` работает, сторожевой тест на `outline: none` проходит.
4. **`ResourcePanel.tsx` берёт `VideoEmbed` через `VideoGrid.tsx`, а не напрямую.** План 05-04 описывал прямой импорт. Суть truth выполнена: фасад в проекте один, `VideoFacade` удалён, оба потребителя рендерят один компонент.
5. **`REQUIREMENTS.md` всё ещё держит MOTION-01, MOTION-02, MOTION-03 и QA-02 как `[ ]` Pending**, хотя MOTION-04 и QA-04 уже отмечены Complete. Реализация закрыта по всем шести; осталась бухгалтерия статусов после приёмки.
6. **`.planning/phases/05-polish-and-release/05-HUMAN-UAT.md` не в git** (untracked). Файл фиксирует 8 из 8 пройденных пунктов приёмки и стоит того, чтобы попасть в коммит вместе с этим отчётом.

### Требуется ручная проверка

Пусто. Браузерная приёмка выполнена оркестратором через Playwright MCP по preview и по проду, результаты записаны в `docs/qa/SMOKE.md` (десять строк чеклиста и блок контраста, обе колонки) и в `05-HUMAN-UAT.md` (8 из 8 passed, 0 issues, 0 pending). Я дополнительно открыл все четыре финальных скриншота и подтвердил визуальный результат сам.

### Отложено командой на v2

Список из блока «Отложено на v2» в SMOKE.md. Фаза 5 закрывает майлстоун, более поздних фаз для переноса нет, поэтому пункты идут в бэклог, а не в `deferred`.

| Пункт | Почему за рамками |
|---|---|
| Lighthouse-аудит и OG-превью картинкой | вне критериев успеха фазы и вне требований майлстоуна |
| Параллакс триптиха, автоцентрирование карты, кнопки зума | украшения сверх спеки, прототип их не требует |
| Попиксельный замер контраста заголовков новостей поверх обложек | расчётная оценка даёт ≥ 7.8:1, порог 4.5:1 |
| Реальная отправка формы | CLAUDE.md фиксирует прототип на замоканных данных без API |

### Сводка

Цель фазы достигнута. Reveal-обёртки стоят на всех семи контентных секциях и уходят в обычные элементы при `prefers-reduced-motion`, единственный блок `@media` гасит девять слоёв декоративного движения, и оба инварианта закрыты сторожевым тестом `motionPolicy.test.ts`, который валится при появлении второго блока или значения `data-anim` вне реестра. Восемь секций несут `aria-labelledby`, на странице один h1, кольцо фокуса глобальное, горизонтальный скролл срезан `overflow-x: clip` и подтверждён на пяти ширинах. Тестов стало 335 в 42 файлах, прогон чистый без предупреждений `act`. Сборка разъезжается на два чанка, `check-dist.mjs` держит одиннадцать инвариантов и, как показал негативный прогон, действительно валит сломанный билд. Прод отдаёт 200 и побайтно совпадает с локальным `dist` на текущем HEAD, деплой которого прошёл зелёным.

Дефект приёмки нашёлся один: глобус тратил 533 мс на кадр из-за `shadowBlur`. План 05-08 переложил ореолы на плоские круги, `shadowBlur` в продакшн-коде не осталось, замер после фикса дал 121 fps, а сфера на скриншотах читается телом.

Гэпов нет. Шесть примечаний выше носят информационный характер: четыре фиксируют мелкие расхождения между буквой планов и кодом при выполненной сути, два просят закрыть бухгалтерию (статусы в `REQUIREMENTS.md` и untracked `05-HUMAN-UAT.md`).

---

_Проверено: 2026-09-05T19:21:05Z_
_Проверяющий: Claude (gsd-verifier)_
