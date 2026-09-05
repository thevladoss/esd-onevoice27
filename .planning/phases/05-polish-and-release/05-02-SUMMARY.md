---
phase: 05-polish-and-release
plan: 02
subsystem: ui
tags: [css, tailwind-v4, prefers-reduced-motion, accessibility, canvas, vitest]

requires:
  - phase: 01-scaffold-and-deploy
    provides: дизайн-система, токены, skip-link, ландмарки, кольцо фокуса, scrollToSection с проверкой reduce
  - phase: 02-hero-and-map
    provides: звёздное поле, глобус на canvas, луч кнопки, огоньки карты
  - phase: 04-resources-and-quote
    provides: слои частиц в секции ресурсов, куда план 05-04 добавит data-anim
provides:
  - Единственный блок @media (prefers-reduced-motion: reduce) в проекте, внизу global.css
  - Реестр data-anim на семи декоративных слоях оболочки, hero и карты
  - Токены reveal в :root (--dur-reveal, --ease-reveal, --stagger-reveal, --reveal-shift)
  - overflow-x: clip на body и кольцо фокуса без единого снятого outline в исходниках
  - Читаемая сфера глобуса: атмосферный диск, лимб, точки 1.4–2.6px с alpha .92/.25
  - Тесты-инварианты политики движения, реестра data-anim и защиты внешних ссылок
affects: [05-01 Reveal, 05-03 aria секций, 05-04 particles и atmosphere, 05-05 smoke]

tech-stack:
  added: []
  patterns:
    - "Атрибут data-anim из закрытого списка на носителе анимации; единственный блок reduce гасит их по нему"
    - "Тесты-инварианты читают исходники с диска и сторожат общепроектные контракты"

key-files:
  created:
    - src/styles/motionPolicy.test.ts
  modified:
    - src/styles/global.css
    - src/components/hero/globe.ts
    - src/components/hero/hero.css
    - src/components/hero/Starfield.tsx
    - src/components/hero/GlobeCanvas.tsx
    - src/components/layout/Button.tsx
    - src/components/layout/Footer.tsx
    - src/components/layout/Footer.css
    - src/components/map/EsdMap.tsx
    - tsconfig.app.json

key-decisions:
  - "aria-modal на оверлей меню не возвращён: фаза 1 сняла его по код-ревью WR-05, кнопка закрытия лежит снаружи диалога, изоляция держится на inert"
  - "scroll-padding-top оставлен на var(--header-offset) (100/104px), а не приведён к 96px из плана: величина измерена в фазе 1 и имеет единственный источник"
  - "Текст skip-link и метки навигации остались в data/copy.ts, литералами в компоненты не продублированы"
  - "Гало footer вынесено из ::before в узел .site-footer__halo, иначе статичный кадр reduce сдвинул бы всю секцию"
  - "Яркость глобуса поднята атмосферным диском и маской скрима правее 58% ширины: точки сами по себе не дают средней яркости области"

patterns-established:
  - "Реестр data-anim: девять значений, ни одного вне списка; проверяется тестом"
  - "Статичные конечные кадры под reduce перебивают позднюю секционную CSS через !important или специфичность"

requirements-completed: [MOTION-02, MOTION-03]

duration: 82min
completed: 2026-09-05
---

# Phase 5 Plan 02: Политика движения и контракт оболочки Summary

**Девять блоков `@media (prefers-reduced-motion: reduce)` из восьми файлов сведены в один внизу `global.css`, семь декоративных слоёв получили `data-anim`, а глобус hero — атмосферный диск и лимб вместо почти невидимых точек.**

## Performance

- **Duration:** ~82 мин
- **Started:** 2026-09-05T16:36:00Z
- **Completed:** 2026-09-05T17:58:00Z
- **Tasks:** 3
- **Files modified:** 25 (24 изменено, 1 создан)

## Accomplishments

- Единственный источник правды по reduced motion: страховка на весь документ, явное гашение `[data-anim]`, четыре статичных конечных кадра, выключенное hover-движение. Смена цвета и границ при hover и focus осталась.
- Токены reveal в `:root` с укороченным сдвигом до 768px — план 05-01 берёт их для обёрток `Reveal`.
- `overflow-x: clip` на body (не `hidden`, чтобы не сломать `position: fixed` у шапки), кольцо фокуса живёт и в утилите, и глобальным правилом, снятых обводок в `src` нет ни одной.
- Реестр `data-anim`: `stars`, `globe`, `beam`, `pulse`, `new-light`, `wave`, `halo` проставлены на носителях анимации; `particles` и `atmosphere` ждут план 05-04.
- Глобус: 2200 точек с alpha .92 спереди и .25 сзади, размер 1.4–2.6px, `globalCompositeOperation = "lighter"`, атмосферный диск на `createRadialGradient` и лимб по краю; скрим с 768px гасится маской правее 58% ширины.
- Три новых набора тестов: политика движения и реестр (`motionPolicy.test.ts`), атрибуты на footer, огоньках и кнопках, порядок табуляции от skip-link.

## Task Commits

1. **Task 1 (часть 1): единый блок reduce, токены reveal, overflow-x** — `8f312ab` (feat)
2. **Task 1 (правка сборки): чтение исходников в тесте через node:fs** — `9560f99` (fix)
3. **Task 1 (часть 2): яркость глобуса** — `61df732` (feat)
4. **Task 2: контракт data-anim на слоях оболочки, hero и карты** — `c4bda54` (feat)
5. **Task 3: внешние ссылки и тесты контракта оболочки** — `34fce23` (fix)

Задача 1 разошлась на три коммита: политика CSS, починка сборки после теста-инварианта и отдельный шаг яркости глобуса. Каждый коммит зелёный по `npm test`, `npm run build`, `npm run lint`.

## Files Created/Modified

- `src/styles/global.css` — токены reveal, `overflow-x: clip`, прозрачное кольцо у ландмарка `main`, единственный блок reduce внизу файла
- `src/styles/motionPolicy.test.ts` — новый: единственность блока, страховка, статичные кадры, токены, реестр `data-anim`, отсутствие снятых обводок, защита внешних ссылок
- `src/components/{about/about,about/video-embed,form/light-form,hero/hero,involve/involve,layout/Footer,map/map,resources/resources}.css` — вырезаны локальные блоки reduce
- `src/components/hero/globe.ts` — константы яркости, `pointAlpha`, `pointSize`, атмосферный диск, лимб
- `src/components/hero/hero.css` — canvas без приглушения opacity, маска скрима с 768px
- `src/components/hero/Starfield.tsx` — `data-anim="stars"` на слоях дрейфа
- `src/components/hero/GlobeCanvas.tsx` — `data-anim="globe"`, строка медиазапроса берётся из `lib/useReducedMotion`
- `src/components/layout/Button.tsx` — `data-anim="beam"` у основного варианта
- `src/components/layout/Footer.tsx` и `Footer.css` — `data-anim="wave"` на footer, гало переехало в `.site-footer__halo`
- `src/components/map/EsdMap.tsx` — `data-anim="pulse"` на группе огонька, `new-light` на кольце
- `src/components/news/NewsCard.tsx`, `src/components/resources/MaterialsList.tsx` — `target` и `rel` в одной строке
- `src/App.test.tsx` — тест порядка табуляции от skip-link
- `tsconfig.app.json` — в `types` добавлен `node`

## Decisions Made

1. **`aria-modal` не возвращён.** Фаза 1 сняла его по код-ревью WR-05: бургер, единственная кнопка закрытия, лежит снаружи диалога, и скринридер прятал элемент, на который фокус-ловушка ставит фокус первым. Изоляция держится на `inert` у соседей header. Возврат атрибута сломал бы уже принятое исправление.
2. **`scroll-padding-top` остался `var(--header-offset)`.** План просил литерал 96px, в проекте живёт измеренная величина 100px (104px на десктопе) с единственным источником в `global.css`, откуда её читает и `lib/headerOffset.ts`.
3. **Пользовательский текст не продублирован в компоненты.** «Перейти к содержимому», «Основная навигация», «Внешние ссылки» лежат в `data/copy.ts` по конвенции проекта; приёмочные грепы плана искали литералы прямо в `SkipLink.tsx` и `Header.tsx`.
4. **Гало footer стало отдельным узлом.** Правило `[data-anim="halo"] { transform: translateX(-50%) }` на псевдоэлементе применилось бы к самому footer и сдвинуло секцию на пол-экрана.
5. **Яркость глобуса добирается свечением, а не только точками.** 2200 точек диаметром до 2.6px покрывают меньше 2% площади области замера: без атмосферного диска среднюю яркость 35/255 не набрать физически.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 — Blocking] Тест-инвариант ломал `tsc -b`**
- **Found during:** Задача 1
- **Issue:** `motionPolicy.test.ts` читает исходники, но `types` приложения ограничены `vite/client` и `vitest/globals`, и `node:fs` не резолвился. Обход через `import.meta.glob(..., { query: "?raw" })` не годится: vitest настроен с `css: false` и отдаёт содержимое CSS-модулей пустой строкой.
- **Fix:** В `tsconfig.app.json` добавлен `node` в `types`. Таймеры в коде уже типизированы через `ReturnType<typeof setTimeout>`, поэтому расширение глобальных типов ничего не сдвинуло.
- **Verification:** `npm run build` (`tsc -b && vite build`) зелёный, `npm run lint` зелёный.
- **Committed in:** `9560f99`

**2. [Rule 1 — Bug] Под reduce пульсирующие огоньки становились жирными пятнами**
- **Found during:** Задача 1
- **Issue:** Правило спеки `[data-anim="pulse"] circle { opacity: .9 }` перебивает `.light-halo { opacity: .22 }` по специфичности, и сорок огоньков получали свечение радиусом 6px на почти полной непрозрачности.
- **Fix:** В блок добавлено `[data-anim="pulse"] .light-halo { opacity: .22 }` с комментарием.
- **Verification:** `npm test`, разбор специфичности по собранному `dist/assets/index-*.css`.
- **Committed in:** `8f312ab`

**3. [Rule 1 — Bug] Статичный кадр луча кнопки не применялся**
- **Found during:** Задача 1
- **Issue:** Базовое правило `.btn[data-beam="true"]::before` (0,2,0) перебивает `[data-anim="beam"]::before` (0,1,0), и под reduce остался бы конический градиент вместо статичного фона.
- **Fix:** `background: var(--gradient-action) !important` в блоке reduce.
- **Verification:** Проверка порядка и специфичности по собранному CSS: блок из `global.css` лежит раньше секционных стилей, поэтому равная специфичность проигрывает.
- **Committed in:** `8f312ab`

**4. [Rule 2 — Missing Critical] `outline: none` у ландмарка `main`**
- **Found during:** Задача 1
- **Issue:** Правило гасило кольцо программного фокуса цели skip-link, но попадало под запрет аудита доступности (грep по снятой обводке).
- **Fix:** Заменено на `outline-color: transparent` для `main:focus` и `main:focus-visible`; поведение то же, запрет соблюдён.
- **Verification:** `grep -rnE "outline:\s*none|outline-width:\s*0|\boutline-none\b" src` даёт 0; тест-инвариант сторожит это дальше.
- **Committed in:** `8f312ab`

**5. [Rule 2 — Missing Critical] Две внешние ссылки держали `rel` на отдельной строке**
- **Found during:** Задача 3
- **Issue:** `NewsCard.tsx` и `MaterialsList.tsx` несут `rel="noopener noreferrer"`, но строкой ниже `target="_blank"`. Построчный гейт (T-05-03) такую пару не видит, и пропажу `rel` на ревью не заметить.
- **Fix:** Атрибуты сведены в одну строку, добавлен тест-инвариант на все `.tsx`.
- **Verification:** `grep -rn 'target="_blank"' src --include=*.tsx | grep -vc 'noopener noreferrer'` даёт 0; тест зелёный.
- **Committed in:** `34fce23`

**6. [Rule 1 — Bug] Тест вращения глобуса опирался на магический индекс точки**
- **Found during:** Задача 1
- **Issue:** После роста числа точек до 2200 и появления двух декоративных дуг индекс 900 попадал на точку, которую поворот вокруг оси почти не смещает, и отношение шагов давало 1.93 вместо 2.
- **Fix:** Тест сам выбирает точку с максимальным |z| около экватора и отбирает вызовы `arc` по радиусу.
- **Verification:** `npx vitest run src/components/hero` зелёный.
- **Committed in:** `61df732`

### Отступления от буквы плана (не автофиксы)

**A. `aria-modal="true"` в оверлее меню не добавлен.** Приёмочный критерий требовал его в `Header.tsx`. Атрибут снят фазой 1 по код-ревью (`01-REVIEW-FIX.md`, WR-05), а сам оверлей живёт в `MobileMenu.tsx`, не в `Header.tsx`. Инструкция плана «всё, что сделано фазой 1, оставить как есть» имеет приоритет.

**B. `scroll-padding-top: 96px` не проставлен.** В `global.css` остаётся `var(--header-offset)` = 100px (104px с 768px). Величина измерена в фазе 1 и имеет один источник на весь проект.

**C. Литералы текста и aria-меток не продублированы в компоненты.** Грепы плана по `SkipLink.tsx` и `Header.tsx` ищут русские строки, которые по конвенции проекта живут в `data/copy.ts`. Значения проверены: `skipLink: "Перейти к содержимому"`, `navLabel: "Основная навигация"`, `linksLabel: "Внешние ссылки"`, `wordmarkAriaLabel: "Единый голос 27, на главную"`.

**D. Отдельного правила `a:focus-visible, button:focus-visible, …` не добавлено.** В `global.css` уже стоит `:focus-visible` без ограничения по селектору — оно строго шире перечисления и покрывает элементы фаз 2–4. Критерий на два вхождения `outline: 2px solid var(--color-horizon-200)` выполнен утилитой и этим правилом.

**E. Тронуты файлы за пределами `files_modified`.** Восемь секционных CSS (вырезаны блоки reduce — прямое требование задачи 1 и её гейта), `globe.ts`, `hero.css`, тесты hero, карты, footer, примитивов, `App.test.tsx`, `NewsCard.tsx`, `MaterialsList.tsx`, `tsconfig.app.json`. Ни один файл из списка плана 05-01 (`Reveal*`, `Section.tsx`, корни секций) не тронут.

---

**Total deviations:** 6 автофиксов (3 × Rule 1, 2 × Rule 2, 1 × Rule 3) и 5 отступлений от буквы плана, каждое в пользу уже принятых решений фаз 1–4.
**Impact on plan:** Расползания объёма нет. Зависимостей не добавлял (`git diff -- package.json` пуст), файлов не удалял.

## Assumption Drift (advisory)

**1. Задача 3 оказалась почти целиком уже выполненной.**
- **Планировалось:** оболочка доступности собирается в этом плане (skip-link, `main#main`, nav-метки, `rel`, `noscript`).
- **На деле:** всё это уже стоит в коде после фазы 1 и её код-ревью, включая `App.test.tsx`, который план отдавал плану 05-05. Реальной работы осталось на две правки: строки внешних ссылок и тест порядка табуляции.
- **Почему:** план писался по 05-UI-SPEC, а не по текущему состоянию `src` после исправлений код-ревью фазы 1.

**2. Яркость глобуса упирается не в параметры точек.**
- **Планировалось:** поднять alpha и размер точек, включить `lighter` — и средняя яркость области дойдёт до 35/255.
- **На деле:** `globalCompositeOperation = "lighter"` уже стоял с фазы 2, alpha передней стороны была .9. Точки покрывают меньше 2% площади области замера, поэтому решают атмосферный диск под ними и маска скрима, а не параметры точек.
- **Почему:** критерий задан по средней яркости области, а не по яркости самих точек.

## Issues Encountered

- **`import.meta.glob` не отдаёт содержимое CSS.** Vitest настроен с `css: false` и подменяет CSS-модули пустой строкой даже по запросу `?raw`. Проверено экспериментом; тест переведён на чтение с диска.
- **Замер яркости в браузере недоступен.** В jsdom пиксели canvas не считаются. Значения подбирал численной моделью композитинга (свечение → `screen` поверх фона → скрим с маской → виньетка) для 1440×820: средняя яркость области 55–95% × 15–75% выходит ≈ 37/255 при 98% освещённых сэмплов против 10/255 и 7% после фазы 2. Точки в модель не входят, они добавляются сверху. **Живой замер за оркестратором.**
- **Контраст заголовка hero проверен отдельно.** Средний стоп градиента (#5d6cb1, 4.1:1 из фазы 1) лежит около 460px по горизонтали — дальше 400px от центра свечения, то есть в зоне, куда диск не достаёт. Маска скрима начинает слабеть с 58% ширины, а текстовая колонка заканчивается на 55%. Требование WCAG 1.4.3 не задето.

## User Setup Required

None — внешних сервисов план не трогает.

## Next Phase Readiness

- Токены reveal и блок reduce готовы: план 05-01 может опираться на `--dur-reveal`, `--ease-reveal`, `--stagger-reveal`, `--reveal-shift`.
- Реестр `data-anim` ждёт два значения от плана 05-04: `particles` и `atmosphere` на слоях `src/components/resources/`. Правило `[data-anim="particles"] { opacity: .28 }` уже стоит в блоке reduce; до проставления атрибута петля частиц гасится только страховкой на весь документ.
- Замер яркости глобуса в браузере на 1440 — за оркестратором: критерий «средняя ≥ 35/255 и ≥ 30% освещённых сэмплов» подтверждается скриншотом, а не unit-тестом.
- aria-атрибуты секций (`aria-labelledby` на восьми `<section>`) остаются за планами 05-03 и 05-04.

---
*Phase: 05-polish-and-release*
*Completed: 2026-09-05*

## Self-Check: PASSED

Файлы на месте, все пять коммитов в истории ветки `agent-05-02`, `STATE.md` и `ROADMAP.md` не тронуты.
