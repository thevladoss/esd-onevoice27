---
phase: 05-polish-and-release
plan: 04
subsystem: ui
tags: [accessibility, aria, prefers-reduced-motion, tailwind-v4, youtube-facade, vitest]

requires:
  - phase: 04-news-resources-quote
    provides: секции новостей, ресурсов и цитаты, VideoFacade, слои частиц
  - phase: 03-form-about-involve
    provides: VideoEmbed с валидацией id и переносом фокуса на iframe
  - phase: 05-polish-and-release
    provides: единый блок reduce и реестр data-anim из плана 05-02, обёртки Reveal из 05-01
provides:
  - Единственный видео-фасад проекта VideoEmbed с песочницей плеера и компактным вариантом
  - data-anim particles и atmosphere в секции ресурсов, девять значений реестра в разметке
  - aria-labelledby на news-title, resources-title и quote-title, скрытый h2 цитаты
  - Кольцо фокуса внутри обрезанных контейнеров новостей и ресурсов через -outline-offset-3
  - Токен --color-unity-200 в tokens.css и акценты карточек ресурсов ссылками на палитру
affects: [05-05 smoke, 05-06 деплой, будущая работа с секциями news/resources/quote]

tech-stack:
  added: []
  patterns:
    - "Один фасад YouTube на проект: about/VideoEmbed, размер задаётся пропом size"
    - "Слой атмосферы секции красится акцентом открытой панели через data-kind и наезжает по data-anim"
    - "Имя секции даёт span с id внутри GradientTitle, пока сам примитив не пробрасывает id"

key-files:
  created:
    - src/components/resources/VideoGrid.test.tsx
  modified:
    - src/components/about/VideoEmbed.tsx
    - src/components/about/VideoEmbed.test.tsx
    - src/components/about/video-embed.css
    - src/components/resources/VideoGrid.tsx
    - src/components/resources/Resources.tsx
    - src/components/resources/ResourceCard.tsx
    - src/components/resources/ResourcePanel.tsx
    - src/components/resources/MaterialsList.tsx
    - src/components/resources/MusicPlaceholder.tsx
    - src/components/resources/resources.css
    - src/components/resources/Resources.test.tsx
    - src/components/news/News.tsx
    - src/components/news/NewsCard.tsx
    - src/components/news/NewsPagination.tsx
    - src/components/news/News.test.tsx
    - src/components/quote/Quote.tsx
    - src/components/quote/Quote.test.tsx
    - src/data/copy.resources.ts
    - src/styles/tokens.css
  deleted:
    - src/components/resources/VideoFacade.tsx
    - src/components/resources/VideoFacade.test.tsx

key-decisions:
  - "VideoEmbed взял строгую валидацию id из фазы 3 и песочницу плеера из фазы 4: обе защиты сложились, ни одна не отброшена"
  - "Кнопкой фасада стала вся плитка, круг play остался span-ом: в сетке 16 роликов на 390px в круг 56px попасть трудно"
  - "Hover-зум круга переехал на утилиту motion-safe:group-hover, чтобы второй блок prefers-reduced-motion не появился в CSS секции"
  - "id заголовка живёт на внутреннем span: GradientTitle в этой волне правит план 05-03, конфликт по файлу не нужен"
  - "Непрозрачность вторичного текста в новостях и цитате поднята до .78, а не до .62 из контракта фазы 4: гейт плана требует не ниже .72"
  - "Слой атмосферы собран заново по ov-resources-zoom-* оригинала: в разметке фазы 4 его не было, был только звёздный фон и частицы"

patterns-established:
  - "Именованная секция становится ландмарком region: тесты ищут панель внутри секции, а не по всему документу"
  - "Заголовок карточки-кнопки идёт span-ом: поточный контент внутри button невалиден, роль заголовка внутри кнопки скринридеры не озвучивают"

requirements-completed: [MOTION-02, MOTION-03]

duration: 20min
completed: 2026-09-05
---

# Phase 5 Plan 04: Видео-фасад, новости, ресурсы и цитата Summary

**Два видео-фасада сведены в `about/VideoEmbed` с песочницей плеера, а секции news, resources и quote получили имена ландмарков, кольцо фокуса внутри обрезанных контейнеров и девятое значение реестра `data-anim`.**

## Performance

- **Duration:** 20 min
- **Started:** 2026-09-05T18:02:00Z
- **Completed:** 2026-09-05T18:22:00Z
- **Tasks:** 3 из 3
- **Files modified:** 20 изменено, 1 создан, 2 удалено

## Accomplishments

- `VideoFacade` удалён, панель «Видео» и блок «О проекте» рендерят один компонент; `grep -rl VideoFacade src` даёт 0.
- В разметке девять значений `data-anim`: `particles` появился на трёх слоях частиц, `atmosphere` на новом слое секции ресурсов, который наезжает и красится акцентом открытой панели.
- Три секции получили `aria-labelledby`, цитата получила скрытый `h2` и явный `figure`; тестов стало 307 против 301 на входе.

## Task Commits

1. **Task 1: Один видео-фасад** — `c10526b` (refactor)
2. **Task 2: Новости и цитата** — `b0c4ce2` (feat)
3. **Task 3: Ресурсы, data-anim, аудит стекла** — `ee3e830` (feat)

## Files Created/Modified

- `src/components/about/VideoEmbed.tsx` — единственный фасад: валидация id, `encodeURIComponent`, `sandbox` и узкий `allow`, кнопка на всю плитку, проп `size="compact"`.
- `src/components/about/video-embed.css` — компактный вариант плитки, кольцо фокуса `outline-offset: -3px`, `max-width: 100%`.
- `src/components/about/VideoEmbed.test.tsx` — десять проверок, включая перенос фокуса на iframe, песочницу и отказ рендерить подменённый id.
- `src/components/resources/VideoGrid.tsx` — импортирует `about/VideoEmbed`, колонки приходят пропом от панели.
- `src/components/resources/VideoGrid.test.tsx` — проверки сетки и данных ресурсов, переехавшие из теста удалённого фасада.
- `src/components/resources/Resources.tsx` — `aria-labelledby`, слой атмосферы, `data-anim` на частицах, `min-w-0` на карточках.
- `src/components/resources/resources.css` — слой `.resources-atmosphere` с наездом `resources-zoom`, снятый `will-change`, убранный локальный токен.
- `src/components/resources/ResourceCard.tsx` — заголовок span-ом, кольцо фокуса внутрь, шкала непрозрачности `.78`/`.62`.
- `src/components/news/*.tsx` — имя секции, кольцо фокуса `-outline-offset-3`, скрим `.9`, `max-w-full` на обложке, `min-w-0` на карточках.
- `src/components/quote/Quote.tsx` — скрытый `h2 id="quote-title"`, явный `figure` внутри `Reveal`.
- `src/styles/tokens.css` — единственная правка: `--color-unity-200: #8f9dd6` в `@theme`.
- `src/data/copy.resources.ts` — акценты карточек ссылаются на токены палитры, мёртвая строка `video.watchLabel` удалена вместе с фасадом.

## Decisions Made

- **Строгость фасада собрана из двух источников.** `YOUTUBE_ID_RE` фазы 3 отсекает подменённые id раньше, чем `encodeURIComponent` фазы 4 экранирует остаток; `sandbox` и allow-list фазы 4 перенесены дословно вместе с комментариями о снятых правах.
- **Реестр `data-anim` закрыт разметкой, а не CSS.** `global.css` принадлежит выполненному плану 05-02, поэтому наезд атмосферы гасится общим правилом `[data-anim] { animation: none !important }` без нового блока и без статичного конечного кадра.
- **Тесты панели ресурсов ищут регион внутри секции.** `aria-labelledby` на `<section>` делает её ландмарком `region`, и глобальный `getByRole("region")` начал находить два элемента.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Именованная секция сломала десять тестов панели ресурсов**
- **Найдено:** задача 3
- **Проблема:** `aria-labelledby` на `<section id="resources">` дало секции роль `region`, и `screen.getByRole("region")` в `Resources.test.tsx` стал находить два элемента.
- **Решение:** helper-функции `panelRegion()` и `queryPanelRegion()` ищут панель внутри секции; тест размонтирования проверяет отсутствие секции и `#resources-panel`.
- **Файлы:** `src/components/resources/Resources.test.tsx`
- **Проверка:** `npx vitest run src/components/resources` — 23 passed.
- **Коммит:** `ee3e830`

**2. [Rule 2 - Correctness] `<h3>` внутри `<button>` (топ-фикс 2 из 04-UI-REVIEW)**
- **Найдено:** задача 3
- **Проблема:** HTML не разрешает поточный контент внутри `button`, а роль заголовка внутри кнопки скринридеры всё равно не озвучивают (children presentational).
- **Решение:** заголовок карточки стал `span` с теми же классами; уровень `h3` остался у заголовка раскрытой панели.
- **Файлы:** `src/components/resources/ResourceCard.tsx`, `Resources.test.tsx` (новая проверка «внутри кнопок нет заголовков»)
- **Коммит:** `ee3e830`

**3. [Rule 2 - Correctness] Токен `--color-unity-200` в трёх источниках (топ-фикс 1 из 04-UI-REVIEW)**
- **Найдено:** задача 3
- **Проблема:** `#8f9dd6` жил как scoped-переменная в `resources.css`, сырой hex в `copy.resources.ts` и `text-[#8f9dd6]` в `MusicPlaceholder.tsx`.
- **Решение:** объявление переехало в `tokens.css` `@theme` (единственная разрешённая правка файла), `MusicPlaceholder` перешёл на `text-unity-200`, акценты карточек стали `var(--color-unity-200)`, `var(--color-horizon-400)`, `var(--color-signal-300)`.
- **Проверка:** в собранном CSS `text-unity-200{color:var(--color-unity-200)}`, `npm run build` зелёный.
- **Коммит:** `ee3e830`

**4. [Rule 2 - Contrast] Шкала непрозрачности разошлась между планом и контрактом фазы 4**
- **Найдено:** задача 2
- **Проблема:** 04-UI-REVIEW требует третичный текст `.62`, гейт плана 05-04 запрещает в новостях и цитате значения ниже `.72`.
- **Решение:** в `news` и `quote` третичный текст поднят до `.78` (вторичный уровень контракта), в `resources` шкала приведена к `.78`/`.62` по букве ревью. Нижняя точка скрима обложки поднята с `.82` до `.9` по правилу контраста 05-UI-SPEC.
- **Файлы:** `News.tsx`, `NewsCard.tsx`, `NewsPagination.tsx`, `ResourceCard.tsx`, `ResourcePanel.tsx`, `MaterialsList.tsx`, `MusicPlaceholder.tsx`
- **Проверка:** гейт `grep -rnE "text-paper/([0-6][0-9]?|7[01])\b…" src/components/news src/components/quote` даёт 0.
- **Коммиты:** `b0c4ce2`, `ee3e830`

**5. [Rule 3 - Blocking] `GradientTitle` не пробрасывает `id`, а файл принадлежит плану 05-03**
- **Найдено:** задачи 2 и 3
- **Проблема:** `id="news-title"` и `id="resources-title"` нужны на заголовке, но правка примитива в этой волне дала бы конфликт по файлу и красный `tsc` до слияния.
- **Решение:** id живёт на `span` внутри заголовка; имя секции считается по тексту этого элемента и совпадает с текстом `h2`. Тесты проверяют, что элемент с id лежит внутри `h2`.
- **Файлы:** `News.tsx`, `Resources.tsx`
- **Коммиты:** `b0c4ce2`, `ee3e830`

**6. [Rule 3 - Blocking] Гейт требует литерал `<figure` в `Quote.tsx`**
- **Найдено:** задача 2
- **Проблема:** цитата рендерила figure через `<Reveal as="figure">`, в исходнике литерала нет.
- **Решение:** `Reveal` остался на месте обёрткой (`div`), внутри появился явный `figure` с прежними классами колонки. Позиция обёртки не изменилась, требование 05-01 соблюдено.
- **Файлы:** `Quote.tsx`, `Quote.test.tsx`
- **Коммит:** `b0c4ce2`

**7. [Rule 2 - Performance] `will-change: transform, opacity` на трёх слоях частиц**
- **Найдено:** задача 3, аудит стекла
- **Проблема:** MOTION-02 и п.3 «Взаимодействие reveal со стеклом» оставляют ручной `will-change` только пульсирующим огонькам карты; три слоя на всю секцию держали композитные слои ради петли, которая гаснет при reduce.
- **Решение:** свойство снято, причина записана комментарием.
- **Файлы:** `src/components/resources/resources.css`
- **Проверка:** `grep -rn 'will-change' src` даёт 0 совпадений.
- **Коммит:** `ee3e830`

**8. [Rule 1 - Dead code] `resourcesCopy.video.watchLabel` остался без потребителя**
- **Найдено:** задача 1
- **Проблема:** строку читал только удалённый `VideoFacade`; `VideoEmbed` строит имя кнопки сам.
- **Решение:** поле и его тип удалены из `copy.resources.ts`, текст «Смотреть видео: {название}» не изменился.
- **Коммит:** `c10526b`

---

**Total deviations:** 8 auto-fixed (Rule 1: 1, Rule 2: 4, Rule 3: 3)
**Impact on plan:** все правки лежат внутри файлов плана и закрывают либо гейт плана, либо топ-фикс 04-UI-REVIEW. Архитектура не менялась, зависимостей не добавлено.

## Assumption Drift (advisory)

**1. Слой атмосферного зума не существовал**
- **Планировалось:** «слой атмосферного зума карточки получает `data-anim="atmosphere"`», то есть слой уже есть и ему нужен атрибут.
- **На деле:** в разметке фазы 4 были только звёздный фон `::before` и три слоя частиц. Слой собран заново в `Resources.tsx` и `resources.css` по образцу `ov-resources-zoom-*` из `docs/research/orig-custom-styles.css`: он лежит в секции, а не в карточке, и красится акцентом открытой панели через `data-kind`.
- **Почему:** оригинал зумит атмосферу секции при активной карточке, а не саму карточку; повторять зум на трёх карточках означало бы три анимируемых слоя вместо одного.

**2. Счёт значений `data-anim`**
- **Планировалось:** добавить два значения и получить девять.
- **На деле:** в `src` было восемь уникальных значений, причём `particles` считался только по тексту `global.css` и теста политики движения, в разметке его не было. Добавлены атрибуты `particles` (три узла) и `atmosphere` (один узел), уникальных значений стало девять.

## Verification (наблюдаемые результаты)

| Проверка | Результат |
|----------|-----------|
| `npx tsc -b` | проходит, вывода нет |
| `npm test` | 42 файла, 307 тестов passed (на входе было 301) |
| `npm run build` | 787 модулей, `✓ built in 169ms`; предупреждение о чанке > 500 КБ остаётся за планом 05-05 (`manualChunks`) |
| `npm run lint` | проходит, вывода нет |
| `grep -rl "VideoFacade" src` | 0 |
| `grep -rhoE 'data-anim="[a-z-]+"' src \| sort -u \| wc -l` | 9 |
| `target="_blank"` без `rel` | 0 строк во всех `.tsx` |
| Кольцо фокуса | `-outline-offset-3` собирается в `outline-offset: calc(3px * -1)`, проверено в `dist/assets/*.css` |

Гейты плана, где текст грепа расходится с реализацией (поведение при этом закрыто тестами):

- `aria-label="Пагинация новостей"` и `aria-label="Свернуть панель"` приходят из `data/copy.news.ts` и `data/copy.resources.ts`, гейт ищет литерал в компонентах или в `data/copy.ts`. Тесты `getByRole("navigation", { name: "Пагинация новостей" })` и `getByRole("button", { name: "Свернуть панель" })` зелёные.
- `aria-current="page"` записан условно: `aria-current={isCurrent ? "page" : undefined}`. Тест `News.test.tsx` проверяет атрибут у активной кнопки и его отсутствие у остальных.

## Аудит стекла (MOTION-02)

`backdrop-filter` в исходниках остался у `.glass` (`global.css`), пилюли и оверлея меню (`Header.css`) и поверхности карточек ресурсов (`resources.css`). Карточки новостей (`NewsCard.tsx`, фон `bg-midnight-900`) и строки материалов (`MaterialsList.tsx`, фон `bg-paper/5`) блюра не держат, как и требует решение MOTION-02. Панель ресурсов пользуется `.glass` — это разрешено п.4 «Взаимодействие reveal со стеклом» 05-UI-SPEC. Единственный `backdrop-blur` в JSX жил в удалённом `VideoFacade` и ушёл вместе с ним. Ручной `will-change` в `src` не остался нигде; у `.light.pulse` его нет и не было, файл карты принадлежит другому плану.

## Issues Encountered

Тесты `Resources.test.tsx` покраснели сразу после появления `aria-labelledby` на секции. Причина оказалась в ARIA, а не в коде: секция с доступным именем становится ландмарком `region`. Запросы переведены на поиск внутри секции, поведение панели не менялось.

## Known Stubs

Нет.

## User Setup Required

Нет: внешние сервисы не настраиваются.

## Next Phase Readiness

- Разметка готова к smoke-прогону 05-05: девять значений `data-anim`, восемь именованных секций после слияния с 05-03, кольцо фокуса внутри обрезанных контейнеров.
- Ждёт внешней проверки: воспроизведение YouTube под `sandbox` в настоящем браузере (перенесено из 04-REVIEW-FIX WR-03) и контраст даты новости поверх самой светлой обложки.
- Замечание для 05-05: `npm run build` по-прежнему предупреждает о чанке больше 500 КБ, `manualChunks` за тем планом.

---
*Phase: 05-polish-and-release*
*Completed: 2026-09-05*

## Self-Check: PASSED

Все заявленные файлы на месте, `VideoFacade.tsx` и его тест удалены, коммиты `c10526b`, `b0c4ce2`, `ee3e830` есть в истории ветки `agent-05-04`.
