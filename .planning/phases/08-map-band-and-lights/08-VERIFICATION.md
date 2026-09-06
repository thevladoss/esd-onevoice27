---
phase: 08-map-band-and-lights
verified: 2026-09-06T09:01:25Z
status: passed
score: 5/5 must-haves verified (2 через override)
has_blocking_gaps: false
overrides_applied: 3
overrides:
  - must_have: "Огоньки дышат свечением в пяти фазовых корзинах: ореол радиусом 6→12px и opacity .30→.60 с периодом ~2.6s (MAP-05)"
    reason: "Дыхание радиуса держало медиану 50,9 fps при пороге 50 (запас 1,8%). Оркестратор решил не рисковать на более слабом железе и применил fallback MAP-06 поверх решения плана: --halo-k зарегистрирован с initial-value 1.5 (статичный радиус 6px×1.5=9px, середина диапазона оригинала 7–12px), дышит только opacity корзины (71 fps на том же стенде). Коммит «perf(08-02): fallback MAP-06 — ореол 9px статичный, дышит только opacity» (cd8a64c)."
    accepted_by: "оркестратор"
    accepted_at: "2026-09-06T08:56:03Z"
  - must_have: "При prefers-reduced-motion: reduce ореолы статичны с opacity .45 (MAP-06, MAP-07)"
    reason: "motionPolicy.test.ts требует единственный блок @media (prefers-reduced-motion: reduce) в global.css; у map.css своего медиазапроса нет, статичную opacity ореола под reduce (.22) задаёт уже существующее глобальное правило [data-anim=\"pulse\"] .light-halo. Поправка зафиксирована координатором в 08-02-PLAN.md (<ownership>) и подтверждена в 08-02-SUMMARY.md."
    accepted_by: "оркестратор"
    accepted_at: "2026-09-06T08:37:00Z"
  - must_have: "SVG карты остаётся без собственного фона полотна сверх правил спецификации (MAP-03)"
    reason: "Прозрачный SVG показывал вне стран подложку ленты, и на x = 1240 нижняя кромка скоса давала перепад 0 (граница не читалась). По указанию оркестратора добавлен .map-shell { background: rgb(5 4 15) } под тем же clip-path — теперь скос читается по всей ширине (перепады 11–20 на трёх из четырёх выборок вместо ~0), MAP-03 по-прежнему выполняется (jumps: [] на всех проверенных абсциссах). Коммит «feat(08-02): тёмное полотно карты rgb(5 4 15)» (6bf208c)."
    accepted_by: "оркестратор"
    accepted_at: "2026-09-06T08:52:00Z"
---

# Phase 8: Лента карты и дышащие огоньки — Verification Report

**Phase Goal:** Прокручивая к карте, посетитель видит карту и форму на одной скошенной подложке без второй линии среза, огоньки видны сразу и дышат свечением, а не мигают
**Verified:** 2026-09-06T09:01:25Z
**Status:** passed
**Re-verification:** No — initial verification

## Контекст проверки

Оба плана фазы 8 (08-01, 08-02) слиты в `main` через merge-коммит `d594704` («chore: merge executor worktree (agent-08) — фаза 8, лента карты и дышащие огоньки»), следом идёт коммит координатора `cd8a64c` («perf(08-02): fallback MAP-06»), после чего фаза 11 продолжила историю docs-коммитами. Рабочее дерево на момент проверки чистое (`git status --porcelain` показывает только несвязанный `.planning/HANDOFF.json` и черновики `13-01-PLAN.md`/`13-02-PLAN.md` фазы 13).

`ROADMAP.md` и `REQUIREMENTS.md` **не обновлены** после слияния: фаза 8 в таблице Progress по-прежнему числится «0/0, Not started», а MAP-01…07 — «Pending», хотя фазы 7, 9–12 уже отмечены завершёнными с соответствующими docs-коммитами. Это административный пробел (шаг «фаза N завершена — roadmap, state, requirements» для фазы 8 не выполнен), не влияющий на код; отмечен в разделе «Пробелы» как незначительный (minor, не блокирующий).

## Goal Achievement

### Observable Truths (критерии успеха ROADMAP)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Одна лента `.map-band` с подложкой `rgb(18 12 52)` и `clip-path: polygon(0 var(--map-wedge), 100% 0, 100% 100%, 0 100%)`; секции карты и формы внутри прозрачные; единственная граница — скос карты (MAP-01, MAP-03) | ✓ VERIFIED | `src/components/map/map.css:298-326` — блок `.map-band`/`.map-band::before` с точными значениями; `.map-band .lf-section { background: transparent }` и `::before { content: none }`; `MapBand.test.tsx` подтверждает структуру `div.map-band > section#map + section#light-form` и все текстовые инварианты CSS. Зонд `map-probe.mjs band` (08-01-SUMMARY, повторно подтверждён после смены полотна в 08-02-SUMMARY): `jumps: []` на x=200 и x=1240 (1440×900) и на x=20/370 (390×844), `maxJumpOutsideSkew` 0–0.93 при пороге 6 |
| 2 | Нижний орб центрирован на нижнем правом крае карты (`translate(38%, -50%)`) и светит в форму без обрезки; на <768px — полоса во всю ширину (MAP-02) | ✓ VERIFIED | `map.css:384-411` — `.map-orb--bottom { top: 100%; right: 0; transform: translate(38%, -50%) }`, медиаблок `@media (max-width: 767px)` даёт `width: 100%`, `transform: translateY(-50%)`; 08-01-SUMMARY приводит измерение `getBoundingClientRect`: центр орба (1838.6 на 1440×900) совпадает с низом `.map-shell`/`#map`, орб `1320.2 → 2357.0` светит в форму без клипа |
| 3 | Карта и огоньки видны в первом кадре без reveal-затухания; заголовок и счётчики по-прежнему появляются каскадом (MAP-04, MAP-07 частично) | ✓ VERIFIED | `src/components/map/MapSection.tsx:57-69` — `<Reveal delay={0.1}>` вокруг `.map-container` убран, `<div className="map-container">` единственный прямой ребёнок `.map-shell`; `<Reveal className="map-section__header">` вокруг заголовка остался. `MapBand.test.tsx` и `MapSection.test.tsx` проверяют `shell.children` длиной 1 и отсутствие `style` на контейнере. Зонд `lights --width 1440` (08-02-SUMMARY): `firstFrame: true`, `firstFrameCounts: {cores: 942, buckets: 5}` сразу после `domcontentloaded` |
| 4 | Огоньки дышат свечением в пяти фазовых корзинах (`index % 5`): ядро 2.2px с обводкой `#fff` 0.9px opacity .5, ореол радиусом 6→12px и opacity .30→.60, период ~2.6s, цвета `rgb(158 67 154)`/`rgb(84 164 172)`; `light-pulse` отсутствует, `light-arrive` остался (MAP-05) | ✓ PASSED (override) | Ядро, обводка, цвета, пять `<g class="light-bucket" data-bucket="n" data-anim="pulse">` с задержками `calc(-2.6s * n/5)`, отсутствие `light-pulse`/`PULSE_EVERY`, сохранённый `light-arrive` — всё подтверждено кодом (`EsdMap.tsx`, `map.css`) и тестами (`EsdMap.test.tsx`, 47/47 в блоке «дыхание огоньков» проходят). **Дыхание радиуса 6→12px не работает**: после коммита `cd8a64c` радиус ореола статичен (9px), дышит только opacity — см. override |
| 5 | Chrome 1440×900 держит ≥ 50 fps с 942 огоньками, иначе остаётся только дыхание opacity; без `@property` дышит только opacity; при `reduce` ореолы статичны opacity .45 (MAP-06, MAP-07 частично) | ✓ PASSED (override) | fps подтверждён числами из SUMMARY (не перезапускался по инструкции задачи): медиана дыхания радиуса 50,9 fps (запас 1,8%) → оркестратор применил fallback (71 fps на opacity-only, коммит `cd8a64c`); текущий код `map.css`/`EsdMap.test.tsx` соответствует применённому fallback (`initial-value: 1.5`, `@keyframes light-breathe` без `--halo-k`). Reduced-motion: статичная opacity ореола `.22`, а не `.45` — см. override |

**Score:** 5/5 truths verified (3 из них — через задокументированные overrides оркестратора)

### Проверки кода (запущены в этой сессии)

| Команда | Результат |
|---|---|
| `npx tsc -b` | код 0, без ошибок |
| `npx vitest run src/components/map src/App.test.tsx src/styles/motionPolicy.test.ts src/components/form` | 10 файлов, **145 тестов, все passed** |
| `npx vitest run` (полный набор, один прогон) | 49 файлов, **498 тестов, все passed** — регрессий в остальных фазах (7, 9–12) нет |

Зонд Playwright (`map-probe.mjs`, режимы `band`/`fps`/`lights`) в этой сессии **не запускался** по прямому указанию задачи — числа взяты из `08-01-SUMMARY.md` и `08-02-SUMMARY.md` как задокументированные результаты прогонов исполнителя; воспроизведение на реальном проде — предмет фазы 13.

### Required Artifacts

| Artifact | Expected | Status | Details |
|---|---|---|---|
| `src/components/map/MapBand.tsx` | `<div class="map-band">` с `<MapSection/>` и `<LightForm/>` | ✓ VERIFIED | 18 строк, экспорт `MapBand`, импортирует `./map.css`; используется в `App.tsx` |
| `src/App.tsx` | `<MapBand />` вместо пары `<MapSection/><LightForm/>` | ✓ VERIFIED | `grep "MapBand\|MapSection\|LightForm" src/App.tsx` даёт ровно импорт `MapBand` и `<MapBand />`; секции `MapSection`/`LightForm` в App.tsx больше не упоминаются напрямую |
| `src/components/map/MapSection.tsx` | без `.map-section__skew`, без `Reveal` вокруг `.map-container` | ✓ VERIFIED | код прочитан целиком: подложки и `Reveal delay={0.1}` нет, орбы и `Reveal` заголовка на месте |
| `src/components/map/map.css` | `.map-band`, орбы, `@property --halo-k`, корзины, правила `.lf-section` | ✓ VERIFIED | все блоки присутствуют и текстово проверены тестами (`MapBand.test.tsx`, `EsdMap.test.tsx`) |
| `src/components/map/EsdMap.tsx` | пять `<g class="light-bucket" data-bucket="n">`, градиенты, слой ядер | ✓ VERIFIED | `LIGHT_BUCKETS = 5`, `useMemo` раскладки по корзинам, `<defs>` с двумя `radialGradient`, `.light-cores` |
| `.planning/phases/08-map-band-and-lights/qa/map-probe.mjs` | зонд Playwright, режимы `band`/`fps`/`lights` | ✓ VERIFIED | 557 строк, диспетчер `RUNNERS = { band, fps, lights }`; результаты прогонов задокументированы в обоих SUMMARY |
| `src/components/map/MapBand.test.tsx`, `MapSection.test.tsx`, `EsdMap.test.tsx` | тесты структуры и CSS-инвариантов | ✓ VERIFIED | все зелёные в целевом и полном прогоне |
| `src/components/map/Counters.tsx` | не менялся (GLASS-05) | ✓ VERIFIED | `git log --follow` не показывает изменений файла в коммитах фазы 8; акценты счётчиков закреплены литералами в `map.css`, а не в `Counters.tsx` |

### Key Link Verification

| From | To | Via | Status | Details |
|---|---|---|---|---|
| `src/App.tsx` | `src/components/map/MapBand.tsx` | `<MapBand />` | ✓ WIRED | импорт и использование на месте |
| `src/components/map/MapBand.tsx` | `src/components/form/LightForm.tsx` | `<LightForm />` внутри `.map-band` | ✓ WIRED | форма вызывается без правок (файлы формы фазой 8 не тронуты) |
| `src/components/map/map.css` | `.lf-section` (light-form.css фазы 9) | `.map-band .lf-section { background: transparent }` / `::before { content: none }` | ✓ WIRED (no-op после фазы 9) | `light-form.css` больше не объявляет свой фон/`::before` на `.lf-section` (фаза 9 их убрала) — правила фазы 8 стали no-op, как и предполагалось в SUMMARY; конфликта нет |
| `src/components/map/EsdMap.tsx` `.light-halo` | `<radialGradient id="light-halo-person|group">` | `fill={url(#light-halo-${type})}` | ✓ WIRED | подтверждено тестом «красит ореол радиальным градиентом типа» (694/248 распределение) |
| `map.css .light-halo` | `@property --halo-k` на `.light-bucket` | `r: calc(var(--light-halo-r,6px) * var(--halo-k,1) / var(--zoom-k,1))` | ✓ WIRED (статично после fallback) | свойство зарегистрировано и используется, но с `initial-value: 1.5` и без анимации `--halo-k` в keyframes — радиус постоянный (9px), а не «дышащий»; согласуется с override |
| `src/styles/global.css [data-anim]` (не правился) | `.light-bucket[data-anim="pulse"]` | глобальный блок reduce | ✓ WIRED | `motionPolicy.test.ts` подтверждает единственный блок reduce и реестр `data-anim`; `EsdMap.test.tsx` подтверждает `data-anim="pulse"` ровно на 5 узлах |

### Data-Flow Trace (Level 4)

Компонент декоративный (CSS-анимация и статическая разметка SVG на основе `useLights()`), не тянет асинхронные данные — уровень 4 неприменим сверх уже проверенного: `points`/`buckets` считаются из `lights` контекста `LightsProvider` через `useMemo`, что подтверждено тестом добавления огонька (`AddLightHarness`: клик «зажечь» добавляет ореол в третью корзину, 942 → 943).

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|---|---|---|---|---|
| MAP-01 | 08-01 | Лента `.map-band` с единой подложкой, прозрачные секции | ✓ SATISFIED | код + тесты + зонд `band` |
| MAP-02 | 08-01 | Нижний орб на кромке карты, полоса на мобильном | ✓ SATISFIED | код + зонд `band` (измерение орба) |
| MAP-03 | 08-01, 08-02 | Нет второй линии на стыке карты и формы | ✓ SATISFIED | зонд `band` (`jumps: []`), перепроверен после смены полотна карты |
| MAP-04 | 08-01 | Карта без reveal, видна в первом кадре | ✓ SATISFIED | код (Reveal снят) + зонд `lights` (`firstFrame: true`) |
| MAP-05 | 08-02 | Пять корзин, ядро с обводкой, ореол градиентом, `light-pulse` удалён | ⚠ SATISFIED (override на дыхание радиуса) | код + тесты; радиус ореола статичен после fallback — см. override |
| MAP-06 | 08-02 | `@property --halo-k` + fallback, ≥50 fps | ⚠ SATISFIED (override — fallback применён с запасом) | коммит `cd8a64c`, числа fps в 08-02-SUMMARY |
| MAP-07 | 08-01, 08-02 | Первый кадр без плейсхолдеров; reduce выключает дыхание | ⚠ SATISFIED (override на статичную opacity .22) | зонд `lights --reduced` (08-02-SUMMARY): анимации нет, `haloOpacity: "0.22"` |

Оркестраторская сверка REQUIREMENTS.md (чекбоксы `[ ]`/статус «Pending» для MAP-01…07) **не отражает** фактическое состояние кода — это административный, а не функциональный пробел (см. «Контекст проверки» выше).

### Anti-Patterns Found

Поиск по файлам фазы 8 (`App.tsx`, `MapBand.tsx(.test)`, `MapSection.tsx(.test)`, `map.css`, `EsdMap.tsx(.test)`, `map-probe.mjs`) на `TODO|FIXME|TBD|XXX|HACK|PLACEHOLDER`, `placeholder`/`coming soon`/`not yet implemented` (регистронезависимо) и пустые реализации (`return null|{}|[]`, `=> {}`) — **ничего не найдено**. Единственные совпадения по `return []` — легитимные ранние выходы в `useMemo` при отсутствии проекции (`EsdMap.tsx:115,124`), не заглушки.

### Human Verification Required

Не требуется на уровне фазы 8: все критерии подтверждены кодом, тестами и числовыми результатами зонда Playwright, запротоколированными в SUMMARY обоих планов. Живая пиксельная приёмка на проде и сравнение с оригиналом onevoice27.org — явно вынесены в фазу 13 (ROADMAP: «Стыки между фазами закрыты… проверяются в фазе 13», «Phase 13: Интеграция, гейт и приёмка»); повторный прогон `map-probe.mjs` на смерженном коде — часть плана фазы 13, не фазы 8.

### Deferred Items

| # | Item | Addressed In | Evidence |
|---|------|-------------|----------|
| 1 | Пиксельное сравнение с оригиналом на реальном проде (1440×900, 390×844), включая повторный замер fps на машине приёмки | Phase 13 | ROADMAP Phase 13 success criteria: «Playwright-сравнение с оригиналом… `docs/qa/SMOKE.md`… по пунктам MAP (полигон скоса, отсутствие второй линии по MAP-03, fps по MAP-06)»; 08-02-SUMMARY прямо просит фазу 13 перемерить fps на своей машине (запас 1,8% может не выдержать более слабый GPU) |

### Пробелы (minor, не блокирующие)

- **ROADMAP.md/REQUIREMENTS.md/STATE.md не обновлены под завершение фазы 8** — прогресс-таблица показывает «0/0, Not started», требования MAP-01…07 висят «Pending», хотя код и тесты фазы полностью готовы и слиты в `main`. В отличие от фаз 7, 9–12, для фазы 8 нет коммита `docs(08): фаза 8 завершена — roadmap, state, requirements`. Не блокирует функциональность, но фазе 13 нужна корректная роадмап-таблица для собственного гейта — рекомендуется закрыть перед стартом фазы 13.

---

_Verified: 2026-09-06T09:01:25Z_
_Verifier: Claude (gsd-verifier)_
