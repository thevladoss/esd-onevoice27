---
phase: 08-map-band-and-lights
plan: 02
subsystem: ui
tags: [map, svg, css-animation, performance, playwright]

requires:
  - phase: 08-map-band-and-lights
    plan: 01
    provides: лента .map-band, зонд map-probe.mjs с режимами band и fps, базовый fps 120.3
  - phase: 02-map-and-lights
    provides: EsdMap, 942 огонька, счётчики карты
provides:
  - Огоньки в пяти фазовых корзинах `<g class="light-bucket" data-bucket="n" data-anim="pulse">` с дыханием light-breathe 2.6s
  - Ореол как `<circle fill="url(#light-halo-person|group)">` на радиальном градиенте вместо плоской заливки
  - Ядро 2.2px с белой обводкой .9px opacity .5 и non-scaling-stroke, отдельным слоем .light-cores
  - `@property --halo-k` и радиус ореола `calc(var(--light-halo-r) * var(--halo-k) / var(--zoom-k))`
  - Тёмное полотно карты `.map-shell { background: rgb(5 4 15) }`: кромка скоса читается по всей ширине
  - Режим `lights` зонда (обычный и `--reduced`) для приёмки MAP-05/06/07
affects: [09 форма, 13 приёмочный smoke]

tech-stack:
  added: []
  patterns:
    - "Групповая анимация вместо поэлементной: дышат пять узлов-корзин, а не 942 круга"
    - "Зарегистрированное свойство --halo-k как единственный анимируемый вход для геометрии SVG в CSS"
    - "Цвет градиента через currentColor на самом узле radialGradient, класс типа задаёт color"
    - "Текстовая проверка CSS из компонентного теста: jsdom анимаций не считает и calc в r не разрешает"

key-files:
  created: []
  modified:
    - src/components/map/EsdMap.tsx
    - src/components/map/EsdMap.test.tsx
    - src/components/map/map.css
    - .planning/phases/08-map-band-and-lights/qa/map-probe.mjs

key-decisions:
  - "Дыхание радиуса оставлено: медиана 50.9 fps против порога 50 (вариант без --halo-k даёт 71 fps, числа записаны для фазы 13)"
  - "Статичный ореол под reduce имеет opacity .22 из глобального правила, а не .45 из спецификации: медиазапрос в map.css запрещён motionPolicy.test.ts (поправка координатора)"
  - "Фон полотна повешен на .map-shell, а не на .map-container: clip-path со скосом живёт на .map-shell, и только там фон получает скошенную кромку"
  - "Счётчики карты отвязаны от --light-person/--light-group литералами rgb(210 142 190) и rgb(123 194 199): цвета огоньков потемнели, карточки должны выглядеть как до фазы"

patterns-established:
  - "Декоративная петля вешается на минимальное число узлов, а элементы внутри наследуют анимируемое свойство"
  - "Комментарии в CSS не должны содержать строк, по которым текстовые тесты ищут нарушения (prefers-reduced-motion, старые литералы цветов)"

requirements-completed: [MAP-05, MAP-06, MAP-07]

duration: 15 min
completed: 2026-09-06
---

# Phase 8 Plan 02: Огоньки в пяти корзинах Summary

**Поле из 942 огоньков дышит пятью фазовыми корзинами: ореол на радиальном градиенте растёт с 6px до 12px через зарегистрированное `--halo-k`, прозрачность корзины ходит .30 → .60, ядро с белой обводкой не тускнеет отдельным слоем; заодно полотно карты стало почти чёрным, и кромка скоса читается по всей ширине.**

## Performance

- **Duration:** 15 min
- **Started:** 2026-09-06T08:37:00Z
- **Completed:** 2026-09-06T08:52:00Z
- **Tasks:** 3 плана + дополнительная задача координатора
- **Files modified:** 4 (создано 0, изменено 4)

## Accomplishments

- Разметка огоньков разъехалась на два слоя: пять `<g class="light-bucket" data-bucket="n" data-anim="pulse">` держат ореолы, `<g class="light-cores">` — ядра и кольцо нового огонька. Анимаций на карте пять вместо сорока, а ядра больше не тускнеют вместе со свечением, как слой `awe-pin-lights-core` у оригинала.
- Свечение рисует радиальный градиент (`stop-opacity` .9 в центре → 0 на краю) вместо плоского круга с opacity .22: аналог `circle-blur: 1` у слоёв `awe-pin-lights-glow-0…4`. Градиента ровно два, цвет каждый берёт из `currentColor` через `.light-halo-def--person/--group`.
- Дыхание описано через `@property --halo-k { syntax: "<number>"; inherits: true; initial-value: 1 }`: `light-breathe 2.6s ease-in-out infinite` ведёт `--halo-k` 1 → 2 и `opacity` .3 → .6, корзины сдвинуты отрицательной задержкой `calc(-2.6s * n / 5)`. В браузере измерено: `animationDelay` третьей корзины ровно `-1.56s`, радиус ореола за 650 мс уехал с 11.97px до 9.40px, прозрачность корзины — с .598 до .470.
- `light-pulse` и `PULSE_EVERY` удалены целиком, `light-arrive` и `data-anim="new-light"` остались. Жалоба «огоньки пропадают и мигают» закрыта: мигания каждого 24-го огонька больше нет, а reveal вокруг карты снят ещё планом 01.
- Полотно карты получило собственный фон `rgb(5 4 15)` под тем же `clip-path`. До этого прозрачный SVG показывал вне стран подложку ленты, и нижняя кромка скоса на x = 1240 давала перепад ровно 0; теперь 19.6.

## Task Commits

1. **Task 1: Корзины, градиенты и дыхание (EsdMap.tsx, map.css)** — `956af49` (feat)
2. **Task 2: Тесты корзин и текста map.css (EsdMap.test.tsx)** — `deeee2c` (test)
3. **Дополнительная задача координатора: тёмное полотно карты (map.css, EsdMap.test.tsx)** — `6bf208c` (feat)
4. **Task 3: Режим `lights` в зонде (map-probe.mjs)** — `a1172f5` (test)

## Files Created/Modified

- `src/components/map/EsdMap.tsx` — `LIGHT_BUCKETS = 5` вместо `PULSE_EVERY`; `useMemo` раскладки точек по корзинам; `<defs>` с двумя `radialGradient`; слои `.light-bucket` × 5 и `.light-cores`
- `src/components/map/EsdMap.test.tsx` — тесты корзин (189/189/188/188/188 и новый огонёк в третьей), реестра `data-anim`, градиентов и заливок; два блока текстовых проверок `map.css`: «дыхание огоньков» (7 тестов) и «полотно карты»
- `src/components/map/map.css` — `@property --halo-k`, `@keyframes light-breathe`, `.light-bucket` с четырьмя задержками, `.light-halo` без `fill` и `opacity`, обводка `.light-core`, цвета огоньков литералами, закреплённые акценты счётчиков, фон `.map-shell`
- `.planning/phases/08-map-band-and-lights/qa/map-probe.mjs` — режим `lights` (21 проверка в обычном режиме, 20 с `--reduced`), диспетчер режимов через таблицу `RUNNERS`

## Замер fps и reduced motion

### Как запустить

```bash
npm run build && node scripts/check-dist.mjs
npx vite preview --port 4181 --strictPort &   # 4173 держали соседние worktree фаз 7 и 9–12

P=.planning/phases/08-map-band-and-lights/qa/map-probe.mjs
U=http://localhost:4181/esd-onevoice27/
node $P lights --url $U --width 1440 --height 900
node $P lights --url $U --width 1440 --height 900 --reduced
node $P fps    --url $U --width 1440 --height 900 --runs 3
node $P band   --url $U --width 1440 --height 900
node $P band   --url $U --width 390  --height 844
```

Браузер: headed Chrome (`chrome`, окно на переднем плане), playwright 1.63.0-alpha-2026-08-31 из кэша npx. Во время замера fps параллельных `npm test` и `npm run build` не было, WebGL-вкладки закрыты.

### fps, 1440×900, 3 прогона — PASS (код 0), вердикт MAP-06

```
{"mode":"fps","viewport":{"width":1440,"height":900},
 "runs":[{"fps":50.9,"maxGapMs":26,"frames":103},
         {"fps":51,"maxGapMs":25.8,"frames":102},
         {"fps":50.6,"maxGapMs":25.8,"frames":102}],
 "median":50.9,"maxGapMs":26,"floor":50,
 "channel":"chrome","headless":false,"reduced":false}
PASS
```

**Медиана 50.9 при пороге 50 — дыхание радиуса оставлено, fallback не применялся.** Для сравнения замерен и вариант fallback (те же keyframes без обеих строк `--halo-k`, остальное без изменений): **71.0 / 70.7 / 71.1, медиана 71.0, худший интервал 17.6 мс**. После замера файл восстановлен из бэкапа, `git diff` по `map.css` пуст, сборка повторена.

Три числа рядом: **120.3** (огоньки до фазы, план 01) → **71.0** (градиентные ореолы, дышит только opacity) → **50.9** (финальная конфигурация с дыханием радиуса). Запас над порогом ужался с 2.4× до 1.8 %; подробнее — в разделе «Assumption Drift».

### lights, 1440×900 — PASS (код 0)

```
{"mode":"lights","viewport":{"width":1440,"height":900},"firstFrame":true,
 "firstFrameCounts":{"cores":942,"buckets":5},
 "buckets":5,"bucketOrder":["0","1","2","3","4"],"bucketsMarked":5,
 "halos":942,"halosInBuckets":942,"haloFillsOk":true,"haloPerson":694,"haloGroup":248,
 "cores":942,"pulseClass":0,"gradients":2,
 "gradientIds":["light-halo-person","light-halo-group"],
 "supportsProperty":true,
 "animationNames":["light-breathe","light-breathe","light-breathe","light-breathe","light-breathe"],
 "animationDuration":"2.6s","animationDelay3":"-1.56s",
 "coreStroke":"rgb(255, 255, 255)","coreStrokeWidth":"0.9px","coreStrokeOpacity":"0.5",
 "personFill":"rgb(158, 67, 154)","groupFill":"rgb(84, 164, 172)",
 "peopleAccent":"rgb(210, 142, 190)","groupsAccent":"rgb(123, 194, 199)",
 "shellBackground":"rgb(5, 4, 15)",
 "breath":{"before":{"haloR":"11.9696px","haloOpacity":"1","bucketOpacity":"0.598478"},
           "after":{"haloR":"9.39588px","haloOpacity":"1","bucketOpacity":"0.469793"},
           "gapMs":650},
 "failed":[],"channel":"chrome","headless":false,"reduced":false}
PASS
```

Радиус и прозрачность за 650 мс изменились оба — значит `@property` зарегистрирован и дышит именно геометрия, а не только прозрачность. `firstFrame: true` снят после `goto` с `waitUntil: "domcontentloaded"` и одного `requestAnimationFrame`: 942 ядра и пять корзин существуют до полной загрузки страницы (MAP-07).

### lights --reduced, 1440×900 — PASS (код 0)

```
{"mode":"lights","viewport":{"width":1440,"height":900},"firstFrame":true,
 "animationNames":["none","none","none","none","none"],
 "animationDuration":"0s","animationDelay3":"0s",
 "breath":{"before":{"haloR":"6px","haloOpacity":"0.22","bucketOpacity":"1"},
           "after":{"haloR":"6px","haloOpacity":"0.22","bucketOpacity":"1"},
           "gapMs":650},
 "halos":942,"cores":942,"gradients":2,
 "failed":[],"channel":"chrome","headless":false,"reduced":true}
PASS
```

Анимации нет ни на одной корзине, радиус стоит на 6px, за 650 мс не двинулся. **Принятое отклонение: статичный ореол получает opacity .22 из глобального правила `[data-anim="pulse"] .light-halo`, а не .45 из спецификации** — `motionPolicy.test.ts` требует единственного `@media (prefers-reduced-motion: reduce)` в `global.css`, поэтому своего правила у фазы нет (поправка координатора, зафиксирована в плане).

### band после смены полотна — PASS на обоих вьюпортах

MAP-03 не сломался ни огоньками, ни фоном карты. Ниже — только выборки; полные JSON повторяют форму из 08-01-SUMMARY.

| Вьюпорт | x | `skewStep` до фона (план 01) | `skewStep` сейчас | `maxJumpOutsideSkew` | `jumps` |
|---|---|---|---|---|---|
| 1440×900 | 200 | 7.07 | 2.49 | 0 | `[]` |
| 1440×900 | 1240 | 0 | **19.6** | 0.93 | `[]` |
| 390×844 | 20 | 0 | **11.16** | 0 | `[]` |
| 390×844 | 370 | 0.02 | **19.44** | 0.93 | `[]` |

Единственный перепад на отрезке «низ карты + 120px» — сама линия скоса: `jumps` пусты по всем четырём абсциссам, вне окна скоса максимум 0.93 при пороге 6. На x = 200 ступенька уменьшилась с 7.07 до 2.49: там под кромкой лежит суша, а полотно потемнело сильнее, чем подложка ленты, и контраст поменял знак почти в ноль. Зато на трёх остальных выборках скос теперь виден там, где раньше его не было вовсе, — ради этого фон и вводился.

## Проверки кода

| Команда | Результат |
|---|---|
| `npx tsc -b` | код 0 |
| `npm run lint` | код 0 |
| `npx vitest run` (весь набор) | 47 файлов, 429 тестов, все passed |
| `npx vitest run src/components/map src/App.test.tsx src/styles/motionPolicy.test.ts` | 86 тестов passed, предупреждений `act` и `console.error` нет |
| `npm run build` | код 0, самый большой чанк 385.7 КБ при пороге 500 |
| `node scripts/check-dist.mjs` | 11 проверок, все OK |
| `git status --porcelain` | только симлинк `node_modules` (см. «Issues Encountered») |

## Decisions Made

- **Дыхание радиуса оставлено по числу, а не по ощущению.** Правило плана: медиана ≥ 50 → радиус остаётся. Медиана 50.9, значит остаётся. Вариант fallback замерен тем же зондом (71.0) и записан выше: если фаза 13 на более слабой машине увидит < 50, переключение стоит двух строк в `@keyframes light-breathe` и одной правки в тесте «дышит радиусом и прозрачностью».
- **Фон полотна повешен на `.map-shell`.** `clip-path` со скосом объявлен там же, поэтому фон сразу получает скошенные кромки сверху и снизу. На `.map-container` фон был бы прямоугольным и вылезал бы за скос.
- **Счёт градиентов в зонде ограничен картой.** Document-wide `querySelectorAll("radialGradient")` возвращает 4: два наших и два у иллюстраций секции «как участвовать». Проверка теперь смотрит внутрь `.esd-map__svg` и сверяет ещё и порядок id.
- **Пять корзин собираются в `useMemo` по `points`.** Раскладка не зависит от зума и пересчитывается только при смене проекции или списка огоньков; на кадрах жеста React по-прежнему не участвует.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Зонд считал градиенты по всему документу**

- **Found during:** Task 3, первый прогон `lights`
- **Issue:** План задал проверку `document.querySelectorAll("radialGradient").length === 2`. В документе их 4: `#inv-personal-halo` и `#inv-sharing-halo` из `src/components/involve/art/*` (фаза 6). Верная разметка карты давала FAIL по единственному пункту `gradients`.
- **Fix:** Запрос сужен до `.esd-map__svg radialGradient`, дополнительно сверяется список id (`light-halo-person,light-halo-group`).
- **Files modified:** `.planning/phases/08-map-band-and-lights/qa/map-probe.mjs`
- **Verification:** повторный прогон `lights` даёт `gradients: 2`, `gradientIds` в нужном порядке, `failed: []`
- **Committed in:** `a1172f5`

### По указанию координатора

**2. Тёмное полотно карты `rgb(5 4 15)` (вне плана 08-02)**

- **Задача:** у оригинала вода почти чёрная (`#05040F`), поэтому скошенные кромки читаются по всей ширине; у нас SVG прозрачный, и на x = 1240 ступеньки не было.
- **Сделано:** `.map-shell { background: rgb(5 4 15) }` под существующим `clip-path`; текстовая проверка в новом блоке `describe("map.css: полотно карты")`.
- **Files modified:** `src/components/map/map.css`, `src/components/map/EsdMap.test.tsx`
- **Verification:** `band` на 1440×900 и 390×844 — PASS, цифры в таблице выше; `shellBackground: "rgb(5, 4, 15)"` в JSON режима `lights`
- **Committed in:** `6bf208c`

---

**Total deviations:** 1 auto-fixed (баг проверки в зонде) + 1 задача сверх плана по указанию координатора
**Impact on plan:** Компоненты и CSS огоньков сделаны ровно по плану; расширение объёма — только фон полотна, он же закрывает открытый вопрос из «Assumption Drift» плана 01.

## Assumption Drift (advisory)

**1. Бюджет fps съеден почти целиком**

- **Found during:** Task 3
- **Planned:** 08-01-SUMMARY фиксировал базу 120.3 fps и «запас над порогом 50 — 2.4×»; CONTEXT и спецификация исходили из того, что дыхание пяти корзин заметно дешевле пульсации сорока огоньков.
- **Actual:** финальная конфигурация даёт медиану 50.9 fps, то есть запас 1.8 %. Промежуточный замер (только opacity) — 71.0.
- **Why:** дышат пять узлов, но перерисовываются все 942 круга внутри них: смена `--halo-k` заставляет Chrome пересчитывать геометрию каждого ореола каждый кадр, а градиентная заливка дороже плоской. Стоимость масштабируется числом кругов, а не числом анимаций.
- Порог MAP-06 выполнен, поэтому решение плана не меняется. Но приёмке фазы 13 стоит перемерить на своей машине: на дисплее 120 Гц кадр укладывается впритык (худший интервал 26 мс), и на более слабом GPU медиана может уйти под 50. Переключатель готов и описан выше.

**2. Кромка скоса на x = 200 стала менее контрастной**

- **Found during:** дополнительная задача координатора
- **Planned:** тёмное полотно вводилось, чтобы скос читался по всей ширине.
- **Actual:** на трёх выборках из четырёх ступенька выросла с ~0 до 11–20, а на x = 200 (1440×900) упала с 7.07 до 2.49.
- **Why:** там под кромкой лежит суша: страна `rgb(33 26 62 / .55)` поверх нового почти чёрного полотна оказалась чуть темнее подложки ленты `rgb(18 12 52)`, и контраст прошёл через ноль и поменял знак. Критерий MAP-03 («скос виден хотя бы на одной абсциссе, второй линии нет нигде») выполняется с запасом, но абсцисса x = 200 больше не годится как контрольная точка для «скос виден».

## Issues Encountered

- Текстовые тесты ловят и комментарии: черновой комментарий в `map.css` со словом `prefers-reduced-motion` уронил бы `motionPolicy.test.ts`, а упоминание старых `#d28ebe`/`#7bc2c7` нарушило бы критерий плана. Обе строки переписаны до коммита; правило вынесено в `patterns-established`.
- `node_modules` в worktree — симлинк, а `.gitignore` содержит `node_modules/` со слешем и симлинк не покрывает: он висит в `git status` как untracked. Файлы стадились поимённо, в коммиты симлинк не попал (то же наблюдение, что в плане 01).

## User Setup Required

None — внешних сервисов и ключей не нужно, зонд работает по localhost.

## Next Phase Readiness

- Фаза 8 по огонькам закрыта: MAP-05, MAP-06 и MAP-07 подтверждены прогонами зонда, MAP-03 перепроверен после смены полотна.
- Фаза 13 берёт команды из раздела «Замер fps и reduced motion» как есть, меняя только порт в `--url`. Два числа для сравнения: 50.9 (текущая конфигурация) и 71.0 (fallback без `--halo-k`).
- Фаза 9 огоньков не касается; правила `.map-band .lf-section` из плана 01 остаются в силе.
- Открытый вопрос для приёмки: если на машине приёмки медиана < 50, применяется fallback из плана (убрать обе строки `--halo-k` из `@keyframes light-breathe`, поправить тест «дышит радиусом и прозрачностью» и проверку `radiusBreathes` в зонде).

## Self-Check: PASSED

- Все четыре файла из `key-files.modified` на диске найдены
- Коммиты `956af49`, `deeee2c`, `6bf208c`, `a1172f5` присутствуют в `git log`
- Критерии приёмки Task 1–3 перепрогнаны: `tsc`, `lint`, `vitest run` (429 тестов), `build`, `check-dist`, четыре режима зонда — все зелёные

---
*Phase: 08-map-band-and-lights*
*Completed: 2026-09-06*
