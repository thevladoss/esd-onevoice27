---
phase: 04-news-resources-quote
plan: 02
subsystem: ui
tags: [quote, d3-geo, geoNaturalEarth1, svg, react, vitest, a11y]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: примитив Eyebrow, токены tokens.css, утилита .text-gradient-brand
  - phase: 02-hero-and-map
    provides: src/lib/geo.ts с разобранным world-atlas (worldFeatures, 177 стран)
provides:
  - Секция #quote с цитатой из «Евангелизма» вместо заглушки фазы 1
  - WorldSilhouette — декоративный SVG-силуэт карты мира на одном path
  - src/data/copy.quote.ts — тексты цитаты отдельным модулем, вне copy.ts
affects: [05-polish, phase-5-cleanup-copy, footer-transition]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "geoNaturalEarth1 + geoPath считаются один раз на импорте модуля, компонент остаётся чистым"
    - "Декоративная графика: фиксированный viewBox + preserveAspectRatio=slice вместо ResizeObserver"
    - "Тексты параллельной фазы живут в отдельном copy.*.ts, чтобы не ловить конфликты в copy.ts"

key-files:
  created:
    - src/data/copy.quote.ts
    - src/components/quote/WorldSilhouette.tsx
    - src/components/quote/Quote.test.tsx
  modified:
    - src/components/quote/Quote.tsx

key-decisions:
  - "Силуэт строится из worldFeatures фазы 2 (loadWorld/world в geo.ts не существует), второй разбор world-atlas не нужен"
  - "Все 177 стран рисуются одним path: 177 узлов дороже, а силуэт декоративный"
  - "Тексты вынесены в src/data/copy.quote.ts, ключи copy.sections.quote фазы 1 не тронуты"

patterns-established:
  - "Модульный расчёт геометрии: проекция и d вычисляются на импорте, рендер только подставляет строку"
  - "Декоративный слой прячется тройкой aria-hidden + focusable=false + pointer-events-none"

requirements-completed: [QUOTE-01]

# Metrics
duration: 10min
completed: 2026-09-05
---

# Phase 4 Plan 02: Секция цитаты Summary

**Цитата Эллен Уайт на градиентном фоне с силуэтом карты мира из world-atlas: 177 стран одним SVG-path через geoNaturalEarth1, весь расчёт на импорте модуля.**

## Performance

- **Duration:** ~10 мин
- **Started:** 2026-09-05T15:48Z
- **Completed:** 2026-09-05T15:58:29Z
- **Tasks:** 2
- **Files modified:** 4 (3 создано, 1 переписан)
- **Worktree:** `/Users/thevladoss/devs/web/esd_cringe-wt/04-02`, ветка `agent-04-02`

## Accomplishments

- Заглушка `Quote` заменена на секцию `#quote`: градиент `#120c34 → #211a3e`, пятна signal/horizon, `figure > blockquote` с двумя абзацами и `figcaption > cite`.
- `WorldSilhouette` рисует силуэт карты мира одним `path` (177 стран, `d` на 160 244 символа — замерено отдельным прогоном `geoPath`), маска-эллипс гасит края; скринридер и клавиатура его не видят.
- Тесты написаны до кода: 7 проверок, RED зафиксирован отдельным коммитом, GREEN проходит.
- Геоданные переиспользованы из фазы 2 — новых зависимостей и второго разбора `world-atlas` нет, `package.json` не тронут.

## Task Commits

1. **Task 1: Падающий тест секции цитаты (RED)** — `308ba7f` (test)
2. **Task 2: Секция цитаты с силуэтом карты мира (GREEN)** — `ab5ef1c` (feat)

Гейты TDD на месте: `test(04-02)` предшествует `feat(04-02)`. Рефакторинг не понадобился, третьего коммита нет.

## Files Created/Modified

- `src/data/copy.quote.ts` — `quoteCopy`: надзаголовок «Слово на дорогу», два абзаца цитаты, подпись «Эллен Уайт, «Евангелизм», стр. 122».
- `src/components/quote/WorldSilhouette.tsx` — статичный SVG: `geoNaturalEarth1().fitSize([960, 480], world)`, `geoPath`, один `path` с заливкой paper/.05 и обводкой paper/.1.
- `src/components/quote/Quote.tsx` — секция `#quote`: собственный `<section>` (градиент и силуэт нужны на всю ширину), слои фона под `-z-10`, контент `max-w-3xl` по центру.
- `src/components/quote/Quote.test.tsx` — 7 проверок: секция, два абзаца, `cite`, надзаголовок, атрибуты SVG и длина `d`, декоративная кавычка, отсутствие `h2`.

## Verification Results

Все команды выполнены в worktree, вывод наблюдался:

| Проверка | Результат |
|---|---|
| `npx vitest run src/components/quote/Quote.test.tsx` (Task 1, RED) | FAIL — `Failed to resolve import "../../data/copy.quote"` |
| `npx vitest run src/components/quote/Quote.test.tsx` (Task 2, GREEN) | PASS — 7/7 |
| `npm run build` (`tsc -b && vite build`) | PASS — 179 модулей, `index-tVsy99br.js` 336.47 КБ (gzip 114.12 КБ) |
| `npx eslint src/components/quote src/data/copy.quote.ts` | PASS — без замечаний |
| `npm test` (весь набор) | 115 passed, 3 failed — см. «Известные поломки» |

Ручной smoke в браузере (`npm run dev`) не запускался: агент работает без графической сессии. Визуальную сверку с `esd-full.jpeg` (плотность силуэта, растворение краёв) закрывает фаза 5.

## Decisions Made

**1. Силуэт строится из `worldFeatures`, а не из `loadWorld()`/`world`.**
План допускал два имени экспорта в `src/lib/geo.ts` и требовал подтвердить чтением. В файле нет ни того, ни другого: наружу торчит `worldFeatures: CountryFeature[]` (плоский массив 177 стран) плюс `esdFeatures`/`esdCollection` для 12 стран ЕАД. `WorldSilhouette` собирает `FeatureCollection` из `worldFeatures` локально. Запасной вариант из плана (второй импорт `world-atlas/countries-110m.json` и повторный `topojson.feature`) не понадобился и был бы хуже: удвоил бы разбор 108 КБ TopoJSON.

**2. Проекция и `d` считаются на уровне модуля.**
`geoNaturalEarth1().fitSize` и `geoPath` отрабатывают один раз при импорте, компонент только подставляет готовую строку. Фиксированный `viewBox="0 0 960 480"` плюс `preserveAspectRatio="xMidYMid slice"` покрывают любую высоту секции, поэтому `ResizeObserver` не нужен (T-04-06 в реестре угроз).

**3. Тексты в отдельном `src/data/copy.quote.ts`.**
Фаза 4 идёт параллельно с фазой 3, `copy.ts` под запретом на редактирование. Ключи `copy.sections.quote` фазы 1 («Вдохновение», «Слово, с которого всё начинается») остались на месте и ждут уборки в фазе 5.

**4. `key={text}` вместо `key={i}`.**
План предлагал индекс. Абзацы уникальны и статичны, текст как ключ читается лучше и не спорит с правилами React про индексные ключи.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Импорт геоданных переписан под реальный API `geo.ts`**
- **Found during:** Task 2
- **Issue:** План ссылался на `loadWorld()` или `world` из `src/lib/geo.ts`; таких экспортов нет, импорт не собрался бы.
- **Fix:** `import { worldFeatures } from "../../lib/geo"` и сборка `FeatureCollection` внутри `WorldSilhouette`.
- **Files modified:** `src/components/quote/WorldSilhouette.tsx`
- **Verification:** `npm run build` и 7 тестов зелёные; `d` длиннее 1000 символов, значит спроецировались все страны.
- **Committed in:** `ab5ef1c`

**2. [Rule 3 - Blocking] Команды `<verify>` перенаправлены в worktree**
- **Found during:** Task 1
- **Issue:** В плане обе команды начинаются с `cd /Users/thevladoss/devs/web/esd_cringe` — это основной чекаут, куда параллельному агенту писать нельзя.
- **Fix:** Те же команды выполнены в `/Users/thevladoss/devs/web/esd_cringe-wt/04-02`.
- **Files modified:** нет
- **Verification:** `git rev-parse --show-toplevel` совпадает с корнем worktree перед каждым коммитом.
- **Committed in:** —

---

**Total deviations:** 2 auto-fixed (обе Rule 3, блокирующие)
**Impact on plan:** Обе правки — подгонка под реальный код и изоляцию worktree. Контракт секции, разметка и стили выполнены как написано, объём не расширялся.

## Assumption Drift (advisory)

**1. API геоданных фазы 2**
- **Found during:** Task 2
- **Planned:** `geo.ts` отдаёт готовую `FeatureCollection` всего мира (`loadWorld()` или `world`).
- **Actual:** Отдаёт плоский массив `worldFeatures: CountryFeature[]`; готовая коллекция есть только для 12 стран ЕАД (`esdCollection`).
- **Why it matters:** Каждый следующий потребитель мировой геометрии будет собирать `FeatureCollection` у себя. Если таких мест станет больше одного, фазе 5 стоит поднять `worldCollection` в `geo.ts`.

**2. Типографика цитаты**
- **Found during:** Task 2
- **Planned (CONTEXT):** `text-xl md:text-2xl`, то есть 20/24px.
- **Actual:** Один размер 22px, вес Onest 700 — как решил UI-SPEC («Отклонения от CONTEXT»: шкала держится на четырёх кеглях).
- **Why it matters:** Дизайн-контракт фазы победил черновик обсуждения; расхождение уже зафиксировано в UI-SPEC, реализация ему следует.

## Известные поломки чужих тестов (не чинил — файлы вне зоны плана)

`npm test`: **115 passed, 3 failed**. Мои 7 тестов зелёные, билд зелёный. Все три падения — в файлах, которые план 04-02 трогать запрещает; их чинит фаза 5 (или владелец соответствующего файла):

| Файл | Тест | Причина |
|---|---|---|
| `src/App.test.tsx:42` | «показывает стеклянные карточки во всех секциях» | Цитата по UI-SPEC идёт без `GlassCard`, в `#quote` больше нет `.glass-card`. |
| `src/components/placeholders.test.tsx:59` | «Заглушка Quote → рендерит секцию с надзаголовком, заголовком и телом» | Надзаголовок сменился с «Вдохновение» на «Слово на дорогу»; `h2` в секции нет по контракту. |
| `src/components/placeholders.test.tsx:69` | «Заглушка Quote → держит тело в стеклянной карточке» | Та же причина: `GlassCard` в цитате не используется. |

Ожидаемо: план явно требует секцию без `h2` и без стеклянной карточки, а `App.test.tsx` и `placeholders.test.tsx` описывают заглушки фазы 1. Тот же эффект даёт любой другой план фазы 3–4, заменяющий заглушку.

## Issues Encountered

Ни одного блокера. RED зафиксировался с первого прогона, GREEN — тоже; авто-починок кода не потребовалось.

## User Setup Required

None — внешних сервисов, ключей и переменных окружения секция не требует.

## Next Phase Readiness

- QUOTE-01 закрыт: цитата, подпись источника, силуэт карты.
- Фазе 5 остаётся: убрать `copy.sections.quote` из `copy.ts`, снять запись Quote из `placeholders.test.tsx`, ослабить проверку `.glass-card` в `App.test.tsx`, свести `copy.quote.ts` с общим `copy.ts` при желании.
- Стык с футером: секция заканчивается цветом `#211a3e`; клин футера фазы 1 садится поверх без правок с моей стороны.
- Риск конфликта при merge: нулевой — план тронул только 4 файла внутри `src/components/quote/` и `src/data/copy.quote.ts`.

---
*Phase: 04-news-resources-quote*
*Completed: 2026-09-05*

## Self-Check: PASSED

Файлы на диске: `src/data/copy.quote.ts`, `src/components/quote/WorldSilhouette.tsx`, `src/components/quote/Quote.tsx`, `src/components/quote/Quote.test.tsx`, `.planning/phases/04-news-resources-quote/04-02-SUMMARY.md`.
Коммиты в истории ветки `agent-04-02`: `308ba7f`, `ab5ef1c`.
`STATE.md` и `ROADMAP.md` не изменялись.
