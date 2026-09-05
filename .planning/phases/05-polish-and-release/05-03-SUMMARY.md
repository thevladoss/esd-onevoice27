---
phase: 05-polish-and-release
plan: 03
subsystem: ui
tags: [accessibility, aria, responsive, css, react, vitest, wcag]

requires:
  - phase: 01-scaffold-and-deploy
    provides: примитивы Section, GradientTitle, Eyebrow, GlassCard, кольцо фокуса, ландмарки
  - phase: 02-hero-and-map
    provides: карта на d3-geo с role=img, счётчики с живым регионом, чипы стран с aria-pressed
  - phase: 03-form-about-involve
    provides: форма с htmlFor/aria-invalid/aria-describedby, триптих, карточки шагов
  - phase: 05-polish-and-release
    provides: обёртки Reveal и RevealGroup из 05-01, реестр data-anim и политика reduce из 05-02
provides:
  - Проп titleId у Section и проброс id у GradientTitle
  - Пять секций (hero, map, light-form, about, involve) с aria-labelledby на свой заголовок
  - Живой регион успеха как отдельный экспорт SuccessLiveRegion в SuccessToast.tsx
  - Явная связка радио-карточек типа света с подписями через htmlFor
  - Резерв высоты под строку ошибки в сетке поля формы
  - Счётчики карты строкой до 1024px, подсказка о жестах под картой на узком экране
  - Четыре правки из UI-ревью фаз 2 и 3, попавшие в файлы этого плана
affects: [05-04 aria секций news/resources/quote, 05-05 smoke на 1440 и 390, финальный UI-аудит фазы]

tech-stack:
  added: []
  patterns:
    - "Секция получает aria-labelledby, заголовок — одноимённый id; для секций на примитиве Section связку держит проп titleId"
    - "Живой регион смонтирован всегда и пуст до события; визуальный тост помечен aria-hidden"
    - "Строка ошибки занимает свою строку grid всегда: появление текста не двигает раскладку"

key-files:
  created: []
  modified:
    - src/components/layout/Section.tsx
    - src/components/layout/GradientTitle.tsx
    - src/components/hero/Hero.tsx
    - src/components/map/MapSection.tsx
    - src/components/map/map.css
    - src/components/form/LightForm.tsx
    - src/components/form/LightTypeChoice.tsx
    - src/components/form/SuccessToast.tsx
    - src/components/form/light-form.css
    - src/components/about/About.tsx
    - src/components/about/about.css
    - src/components/involve/Involve.tsx
    - src/components/involve/involve.css

key-decisions:
  - "Идентификаторы заголовков заданы литералами в самих секциях, а не выведены из id секции: спека требует form-title при секции light-form, вывод по шаблону дал бы другое имя"
  - "Живой регион успеха переехал из LightForm в SuccessToast.tsx отдельным экспортом SuccessLiveRegion: архитектура фикса CR-01 фазы 3 сохранена, вся история объявления успеха собрана в одном файле"
  - "SVG карты продолжает брать доступное имя из <title id> через aria-labelledby, а не из aria-label: имя и подсказка браузера идут из одного узла"
  - "Строки href триптиха и текст успеха формы остались в data/copy.*.ts и не продублированы литералами в компоненты и copy.ts ради grep-критериев"
  - "Оверлей счётчиков поверх карты включается от 1024px, а не от 768px: так раскладка совпадает с формулировкой плана «ниже 1024px строкой»"
  - "Подсказка о жестах ниже 768px встаёт в поток под картой: поверх карты она закрывала бы огоньки в правом нижнем углу"

patterns-established:
  - "Доступное имя секции проверяется тестом через роль region: getByRole('region', { name: заголовок })"
  - "Связка контрола и подписи проверяется обходом всех input и select формы по label[for]"

requirements-completed: [MOTION-03]

duration: 17min
completed: 2026-09-05
---

# Фаза 5 План 03: доступность и адаптив первых пяти секций — итог

**Пять секций лендинга называются своим заголовком для скринридера, форма и карта проходимы с клавиатуры, строка ошибки больше не двигает поля, а счётчики и подсказка о жестах на 390px стоят в потоке, а не поверх карты.**

## Performance

- **Duration:** 17 мин
- **Started:** 2026-09-05T18:01:40Z
- **Completed:** 2026-09-05T18:18:26Z
- **Tasks:** 3
- **Files modified:** 19 (13 исходников, 6 тестов)

## Accomplishments

- `Section` принимает `titleId`, `GradientTitle` пробрасывает `id`: связка «секция — её заголовок» задаётся одним пропом, а не разметкой в каждой секции.
- Пять секций несут `aria-labelledby` на `hero-title`, `map-title`, `form-title`, `about-title`, `involve-title`; в продакшен-коде ровно один `<h1>`, заголовки карточек на `<h3>`, пропусков уровней нет.
- Живой регион успеха формы получил своё место в `SuccessToast.tsx` (`role="status"`, `aria-live="polite"`), визуальная карточка осталась `aria-hidden`.
- Каждый из восьми контролов формы связан с видимой подписью через `htmlFor` — радио-карточки типа света перешли с неявной вложенности на явный `id`.
- Строка ошибки заняла третью строку сетки поля: её появление не сдвигает соседние поля ни в одной, ни в двух колонках.
- Счётчики карты уходят в оверлей только от 1024px, подсказка о жестах ниже 768px стоит под картой; чипы, поля и карточки шагов держат `min-width: 0`.
- Закрыты четыре правки из UI-ревью фаз 2 и 3, попавшие в файлы плана: зазор карточек шагов 48px, зазор иконки тоста 4px, ссылка пустого состояния карты с акцента на paper, отступ подсказки на шкале 4px.
- Тестов стало 311 (было 308): девять новых на доступные имена секций, уровни заголовков и связку контролов с подписями.

## Task Commits

1. **Задача 1: aria-labelledby и иерархия заголовков** — `a8fdf97` (feat)
2. **Задача 2: карта и форма — aria, клавиатура, раскладка 390px** — `eb20bb2` (feat)
3. **Задача 3: «О проекте» и «Участие» — медиа и стек на мобильном** — `579f122` (feat)

## Files Created/Modified

- `src/components/layout/Section.tsx` — проп `titleId`, `aria-labelledby` на `<section>`, `id` на собственный заголовок
- `src/components/layout/GradientTitle.tsx` — необязательный проп `id` на элемент заголовка
- `src/components/hero/Hero.tsx` — `aria-labelledby="hero-title"`, `id` на единственном `<h1>`
- `src/components/map/MapSection.tsx` — `aria-labelledby="map-title"`, `id` на `<h2>`
- `src/components/map/map.css` — оверлей счётчиков от 1024px, подсказка под картой ниже 768px, `min-width: 0` у чипов и счётчиков, ссылка пустого состояния на paper, отступ подсказки 8px 12px
- `src/components/form/LightForm.tsx` — `titleId="form-title"`, живой регион через `SuccessLiveRegion`
- `src/components/form/SuccessToast.tsx` — новый экспорт `SuccessLiveRegion` с `role="status"`
- `src/components/form/LightTypeChoice.tsx` — `useId`, явные `id` и `htmlFor` у двух радио-карточек
- `src/components/form/light-form.css` — сетка `.lf-field` с резервом под ошибку, `min-width: 0` у полей и радио-карточек, зазор иконки тоста 4px
- `src/components/about/About.tsx` — `titleId="about-title"`, `id` на `<h2>`
- `src/components/about/about.css` — зазор карточек шагов 48px, `min-width: 0` у детей сетки, `max-width: 100%` у видео-фасада
- `src/components/involve/Involve.tsx` — `titleId="involve-title"`, `id` на `<h2>`
- `src/components/involve/involve.css` — `max-width: 100%` у SVG-иллюстрации
- Тесты: `primitives.test.tsx`, `Hero.test.tsx`, `MapSection.test.tsx`, `LightForm.test.tsx`, `About.test.tsx`, `Involve.test.tsx`

## Что уже было сделано до плана

Аудит показал, что фазы 2 и 3 вместе с их код-ревью закрыли большую часть контракта. Ниже — проверенные grep-ом и тестами пункты, которые я не трогал:

| Пункт контракта | Где реализовано |
|---|---|
| Карта `role="img"`, `<title>`, `aria-describedby` на скрытый абзац с числами | `EsdMap.tsx:255–266, 339` |
| Декоративные группы карты `aria-hidden` | `EsdMap.tsx:281, 301` |
| Счётчики: `aria-live="polite"` на контейнере, анимируемый span `aria-hidden`, `sr-only` итог | `Counters.tsx:28–44` |
| Чипы: `role="group"`, `aria-label`, `aria-pressed`, нативные `button`, «Весь дивизион» сбрасывает зум до `zoomIdentity` | `CountryChips.tsx`, `EsdMap.tsx:266–284` |
| `touch-action: pan-y` и `overflow: hidden` на секции карты | `map.css:260, 294` |
| Высота контейнера карты `clamp(520px, 70vh, 880px)` | `map.css:293` |
| Поля формы: `htmlFor`, `aria-invalid`, `aria-describedby`, фокус на первое невалидное поле | `FormField.tsx`, `LightForm.tsx:103–106` |
| Кнопка отправки с `aria-busy` | `LightForm.tsx` |
| Нативные радио и чекбокс скрыты `sr-only`, а не `display: none` | `LightTypeChoice.tsx`, `ConsentCheckbox.tsx` |
| Три SVG триптиха: `aria-hidden`, `role="presentation"`, `focusable="false"`, `preserveAspectRatio` | `involve/art/*.tsx` |
| `aspect-ratio: 16 / 9` фасада видео и `4 / 3` медиа-блока карточки | `video-embed.css:7`, `involve.css:65` |
| Hover-зум медиа только внутри `@media (hover: hover)` | `involve.css:213` |
| `overflow-x: clip` на секциях `#about`, `#involve`, `#light-form` | `about.css:8`, `involve.css:11`, `light-form.css:27` |

## Контраст: расчёты

Проверял композит по итоговому цвету (альфа-смешение над фоном секции), формула относительной яркости WCAG 2.1.

| Пара | Итоговый фон | Ratio | Порог |
|---|---|---|---|
| `paper/.8` на `GlassCard`, светлый стоп `unity-700/.86` | `rgb(52 63 121)` | **6.55:1** | 4.5:1 |
| `paper/.8` на `GlassCard`, тёмный стоп `midnight-900/.76` | `rgb(26 21 53)` | **10.77:1** | 4.5:1 |
| `#fca5a5` на поле `rgb(18 12 52 / .58)` над `midnight-950` | `rgb(13 8 37)` | **10.26:1** | 4.5:1 |
| `#fca5a5` на том же поле внутри стеклянной карточки | `rgb(32 34 81)` | **7.87:1** | 4.5:1 |
| `paper/.94` — текст в поле | `rgb(13 8 37)` | **16.09:1** | 4.5:1 |
| `paper/.72` — подсказка о жестах на подложке `rgb(7 2 16 / .55)` | `rgb(12 6 32)` | **9.61:1** | 4.5:1 |
| `paper` — новая ссылка пустого состояния карты на `#120c34` | `#120c34` | **17.46:1** | 4.5:1 |
| `paper/.86` — чип на `rgb(18 12 52 / .42)` | `rgb(12 6 31)` | **13.63:1** | 4.5:1 |
| Кольцо `#aad9dc` на `midnight-950` | `#070210` | **13.33:1** | 3:1 |

Спека оценивала `paper/.8` на стекле в ~8.9:1; по расчёту на светлом стопе градиента выходит 6.55:1. Порог WCAG AA пройден с запасом, менять непрозрачность не потребовалось.

Ни одно объявление `color:` в пяти секциях не опускается ниже `.72`:

```
hero.css:169 .82   map.css:134 .82   map.css:156 .86   map.css:198 .8
map.css:332 .86    map.css:377 .72   light-form.css:56 .8   light-form.css:149 .8
light-form.css:215 .94   light-form.css:315 .8   about.css:21/87/111 .8   involve.css:20 .8
```

## Decisions Made

- **Идентификаторы заголовков — литералы в секциях.** Вывод `titleId` из `id` секции дал бы `light-form-title`, а спека требует `form-title`. Явный проп читается лучше вычисления и проверяется тестом.
- **Живой регион успеха переехал в `SuccessToast.tsx`.** Фикс CR-01 фазы 3 (регион смонтирован всегда, пуст до отправки; карточка `aria-hidden`) сохранён дословно, изменилось только место объявления: теперь вся история объявления успеха читается в одном файле, `LightForm` подключает `<SuccessLiveRegion message={...} />`.
- **Имя карты остаётся на `<title id>` + `aria-labelledby`.** Переход на `aria-label` дал бы то же имя, но развёл бы доступное имя и подсказку браузера по двум источникам.
- **Оверлей счётчиков от 1024px.** План задаёт «ниже 1024px счётчики строкой над картой», UI-SPEC на 768px допускает оба варианта — сдвиг брейкпоинта закрывает оба требования.
- **Подсказка о жестах ниже 768px — в потоке под картой.** Абсолют в правом нижнем углу закрывал бы огоньки; чеклист 390px прямо требует «видна и не наезжает на карту».
- **Резерв под ошибку вместо абсолюта.** `.lf-field` стал сеткой `auto auto minmax(26px, auto)`: третья строка пуста, пока ошибки нет. План допускал оба приёма; резерв не рискует наложением текста ошибки на соседнее поле при переносе на две строки.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 — Missing Critical] Подсказка о жестах на 390px закрывала угол карты**
- **Found during:** Задача 2
- **Issue:** `.map-hint` абсолютом в правом нижнем углу `.map-stage` перекрывала огоньки на узком экране; чеклист 390px требует «видна и не наезжает на карту»
- **Fix:** медиазапрос `max-width: 767px` возвращает подсказку в поток под картой с отступом 16px
- **Files modified:** `src/components/map/map.css`
- **Verification:** `npm test` (311 зелёных), `npm run build`; DOM-тест «объясняет жесты и мышью, и пальцами» не затронут
- **Committed in:** `eb20bb2`

**2. [Rule 2 — Missing Critical] Строка ошибки сдвигала раскладку формы**
- **Found during:** Задача 2
- **Issue:** `.lf-field` не имел собственных стилей, ошибка появлялась в потоке и двигала поля ниже и строку сетки на десктопе
- **Fix:** `.lf-field` стал grid с зарезервированной третьей строкой `minmax(26px, auto)` (18px текста 13px/1.35 плюс отступ 8px)
- **Files modified:** `src/components/form/light-form.css`
- **Verification:** `npm test`, `npm run build`; вертикальный ритм формы вырос на 26px на строку сетки — сознательная плата за стабильность раскладки
- **Committed in:** `eb20bb2`

**3. [Rule 2 — Missing Critical] Чипы, поля, радио-карточки и карточки шагов без `min-width: 0`**
- **Found during:** Задачи 2 и 3
- **Issue:** чеклист защиты от горизонтального скролла требует `min-width: 0` у flex- и grid-детей; у части узлов его не было, длинное слово раздвинуло бы колонку
- **Fix:** `min-width: 0` добавлен `.chip`, `.counters .counter`, `.lf-field`, `.lf-type`, `.ab-steps > *`
- **Files modified:** `src/components/map/map.css`, `src/components/form/light-form.css`, `src/components/about/about.css`
- **Verification:** `npm run build`, `npm run lint`
- **Committed in:** `eb20bb2`, `579f122`

### Правки из UI-ревью фаз 2 и 3 (по указанию оркестратора)

**4. Зазор карточек шагов 24px → 48px** (`03-UI-REVIEW`, фикс 1) — `about.css`, коммит `579f122`.
**5. Зазор иконки и текста тоста 12px → 4px** (`03-UI-REVIEW`, фикс 2) — `light-form.css`, коммит `eb20bb2`.
**6. Ссылка пустого состояния карты с `#aad9dc` на `paper` с подчёркиванием** (`02-UI-REVIEW`, фикс 3) — `map.css`, коммит `eb20bb2`. Убирает шестое применение акцента вне закрытого списка; контраст вырос с 12.12:1 до 17.46:1.
**7. Отступ подсказки о жестах `6px 10px` → `8px 12px`** (`02-UI-REVIEW`, фикс 3) — `map.css`, коммит `eb20bb2`.

### Отклонения от grep-критериев плана

Семь строк `acceptance_criteria` — grep-прокси к содержательным требованиям. Требования выполнены, буквальный вид строк не совпал; кода ради счётчика grep я не портил.

| Критерий | Факт | Почему не подгонял |
|---|---|---|
| `grep -rhoE 'aria-labelledby="(hero\|map\|form\|about\|involve)-title"' \| wc -l` = 5 в `<verify>` | 2 литерала (`hero`, `map`) + 3 `titleId=` (`form`, `about`, `involve`) = 5 уникальных имён | Сам план в `acceptance_criteria` засчитывает передачу через `titleId`; три секции рисуют заголовок внутри обёртки `Reveal`, `aria-labelledby` ставит примитив |
| `grep -rc "<title>" src/components/map` ≥ 1 | 0: в коде `<title id={titleId}>` | Атрибут `id` нужен для `aria-labelledby`; элемент `<title>` на месте, доступное имя карты проверяет тест `EsdMap.test.tsx:42` |
| `grep -rc "htmlFor" src/components/form` ≥ 5 | 3 (`FormField`, `ConsentCheckbox`, `LightTypeChoice`) | Пять полей рендерит один `FormField`; чтобы получить пять литералов, пришлось бы расклеить общий компонент. Вместо этого добавлен тест, обходящий все восемь контролов через `label[for]` |
| `grep -c "Ваш свет зажжён" ... src/data/copy.ts` ≥ 1 | текст лежит в `src/data/copy.form.ts` | В `copy.ts` живут тексты оболочки и заглушки каркаса; дублировать строку успеха туда — второй источник правды |
| `grep -rcE "overflow..." src/components/map/MapSection.tsx` ≥ 1 | `overflow: hidden` в `map.css:260` (`.map-section`) | Раскладка проекта живёт в CSS секции; тот же класс, тот же узел |
| `grep -rcE "overflow..." src/components/involve/Involve.tsx` ≥ 1 | `overflow-x: clip` в `involve.css:11` плюс `overflow: hidden` на рамке триптиха | `clip` по горизонтали — приём из самого чеклиста фазы: не режет кольцо фокуса по вертикали |
| `grep -rcE 'href="#(about\|resources\|news)"' src/components/involve` ≥ 3 | ссылки приходят из `data/copy.involve.ts` (тип `"#about" \| "#resources" \| "#news"`) | Тексты и адреса секций по паттерну фаз 1–4 лежат в `copy.*`; тест `Involve.test.tsx:42` сверяет три href |
| `grep -rcE "lg:grid-cols-3\|grid-cols-3" src/components/about/About.tsx` ≥ 1 | `repeat(3, minmax(0, 1fr))` в `about.css:31` под `@media (min-width: 1024px)` | Сетка секции описана в CSS, а не утилитами Tailwind |
| Грепа-гейт непрозрачности = 0 | 3 совпадения в `map`+`form`, 3 в `about`+`involve` | Все шесть — не текст: `inset` в `box-shadow` (`map.css:169`), `--field-border` и `--option-border` (`light-form.css:10, 18`), два стопа градиента разделителя (`about.css:103–104`), шов триптиха (`involve.css:5`). Ни одного `color:` ниже `.72` во всех пяти секциях — проверено отдельным грепом, список выше |

---

**Total deviations:** 3 авто-фикса (Rule 2), 4 правки из UI-ревью по указанию оркестратора, 9 расхождений с буквой grep-критериев при выполненной сути.
**Impact on plan:** объём плана не расширен, новых зависимостей нет (`git diff package.json` пуст), правки фаз 1–3 не отменены.

## Assumption Drift (advisory)

**1. Половина контракта доступности уже была выполнена до плана**
- **Planned:** план описывает задачу 2 как внедрение aria на карту и форму («у `<svg>` `role="img"`, вложенный `<title>`…», «при ошибке `aria-invalid`…»)
- **Actual:** всё перечисленное поставили фазы 2 и 3 вместе с их код-ревью; задача 2 свелась к трём точечным правкам плюс раскладке
- **Why:** план писался по контракту фазы 5, без сверки с `0{2,3}-REVIEW-FIX.md`; таблица «Что уже было сделано до плана» фиксирует найденное

**2. Живой регион успеха жил не там, где ждал критерий**
- **Planned:** `grep -c 'role="status"' src/components/form/SuccessToast.tsx` ≥ 1 — критерий предполагает роль на самом тосте
- **Actual:** фикс CR-01 фазы 3 сознательно снял `role="status"` с карточки и перенёс объявление в постоянный `sr-only` регион формы
- **Why:** архитектура фикса сохранена, регион вынесен отдельным экспортом в тот же файл — и роль на месте, и объявление не зависит от монтирования тоста

## Issues Encountered

- Тест «даёт двум формам на странице непересекающиеся id» проверял ровно 14 id; явные `id` у радио-карточек подняли счёт до 18. Ожидание обновлено с комментарием про девять узлов на форму.
- `container.querySelectorAll<HTMLInputElement>` не итерируется напрямую при текущем `target` в tsconfig (TS2488) — обёрнут в `Array.from`.

## Проверки

| Команда | Результат |
|---|---|
| `npx tsc -b` | 0 |
| `npm test` | 42 файла, 311 тестов, все зелёные (было 308) |
| `npm run build` | собрано за 634ms, без ошибок |
| `npm run lint` | 0 замечаний |
| `git diff -- package.json` | пусто (T-05-SC закрыт) |

Все четыре команды прогонялись после каждой задачи; приведённые числа — с последнего прогона после коммита `579f122`.

## User Setup Required

None — внешние сервисы не настраиваются.

## Next Phase Readiness

- Контракт доступности закрыт для `hero`, `map`, `light-form`, `about`, `involve`. Оставшиеся три секции (`news`, `resources`, `quote`) и `VideoEmbed.tsx` — за планом 05-04.
- Раскладка 390/768/1024 выправлена на уровне классов; визуальное подтверждение даёт smoke плана 05-07 (скриншоты на 1440 и 390).
- Риск для 05-04: `Section.tsx` и `GradientTitle.tsx` изменены здесь. Если 05-04 подключает `titleId` для `news-title`, `resources-title`, `quote-title`, API уже готов и конфликта не будет.
- Открытый вопрос для финального UI-аудита: `paper/.8` на светлом стопе стекла даёт 6.55:1, а не заявленные в спеке ~8.9:1. Порог AA пройден, но цифру в `05-UI-SPEC.md` стоит поправить.

---
*Phase: 05-polish-and-release*
*Completed: 2026-09-05*

## Self-Check: PASSED

Все перечисленные файлы найдены на диске, все три хеша задач есть в `git log`, `STATE.md` и `ROADMAP.md` не изменены.
