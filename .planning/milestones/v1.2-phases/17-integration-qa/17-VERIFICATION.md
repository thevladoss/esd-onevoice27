---
phase: 17-integration-qa
verified: 2026-09-06T17:25:20Z
status: passed
score: 5/5 must-haves verified
has_blocking_gaps: false
overrides_applied: 0
---

# Phase 17: Интеграция, гейт и приёмка — Verification Report

**Phase Goal:** Прод на GitHub Pages содержит все три правки вместе, проходит полный гейт и по Playwright-приёмке совпадает с оригиналом по hero, держит бюджет fps на телефоне и не имеет целей касания ниже 44px
**Verified:** 2026-09-06T17:25:20Z
**Status:** passed
**Re-verification:** No — initial verification

Проверка прогонялась заново с чистого листа на HEAD `2683804` (актуальный, включая docs-коммит 17-02), а не переписывала числа из SUMMARY.md. Ни один прогон не совпадал бы с зафиксированными значениями, если бы SUMMARY приукрашивал факты — совпал.

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 (SHIP-01) | Гейт зелёный: `tsc -b`, `npm test`, `npm run lint`, `npm run build`, `check-dist.mjs`; единственный блок reduce; закрытый реестр `data-anim` | ✓ VERIFIED | Прогнано лично: `npx tsc -b` код 0 без вывода; `npm test` → 52 файла / 564 теста, 0 failed/skipped, 0 строк «Not implemented»/`act(`/`console.error`; `npm run lint` код 0; `npm run build` → 793 модуля, ассеты `index-D5PMozSR.js`/`index-BrMtUpqK.css`/`vendor-map-BjCgd77U.js` без предупреждений; `node scripts/check-dist.mjs` → `OK: 12 проверок` (12-я — видео глобуса); `grep -c "@media (prefers-reduced-motion: reduce)" src/styles/global.css` → 1; `motionPolicy.test.ts` (13 тестов) зелёный, `stars`/`pulse` в обязательных, `new-light` только в реестре |
| 2 (SHIP-02) | Прод на GitHub Pages: sha256 живых файлов равны `dist/` | ✓ VERIFIED | `gh run list` показывает `success` даже на текущем HEAD `2683804` (run 34048314304); лично прогнан `qa/prod-hashes.mjs --retries 1` на HEAD `2683804` → «7 из 7 равны» (index.html, favicon.svg, оба JS/CSS чанка, `hero-globe.webm`, `hero-globe.mp4`); прод отдаёт `HTTP/2 200`. Docs-коммит не менял сборку — dist детерминирован по исходникам, поэтому таблица 17-01 (`sha на 827785c`) осталась валидной, но я перепроверил её на актуальном HEAD напрямую, а не поверил допущению «оркестратор перепроверит» |
| 3 (SHIP-03) | Playwright-приёмка 1440/390: видео играет и совпадает размером/`object-fit` с оригиналом, частицы ~24–31 fps, таблица fps ≥100/≥55, узлов SVG < 1300, аудит касаний чист, скриншоты в `docs/qa/v12-*.jpeg` | ✓ VERIFIED | JSON в `qa/results/` прочитаны напрямую: `prod-measure-1440.json` — `globe.playing=true`, `rect` 1066.66×600, `objectFit=contain`, `mixBlendMode=screen`, `particles.drawsPerSecond=26`, `lights.drawsPerSecond=29.5`, `svg.nodes=282`; `prod-measure-390.json` — `rect` 390×844, `objectFit=cover`, `svg.nodes=282`, `touch.small=[]`, `touch.checked=47`; `prod-fps-390-cpu4.json`/`prod-fps-1440.json` — медианы hero/map/light-form 120,2–120,3 (порог 55/100), `passAll=true`, `light-form.mapIntersects=false` и `lightsDraws=0` во всех трёх прогонах (критерий 5); reduced-json — видео на паузе, оба canvas 0 fps; 4 файла `docs/qa/v12-{hero,map}-{1440,390}.jpeg` существуют (18–76 КБ), открыты визуально — реальные кадры прода (глобус справа вверху на 1440, огоньки на карте), не заглушки |
| 4 (SHIP-04) | `docs/qa/SMOKE.md` — раздел «Фаза 17 / v1.2» с таблицами «оригинал / прод» и отклонениями; README указывает на раздел | ✓ VERIFIED | `awk '/^## Фаза 17/,0'` — 174 строки, 9 подразделов (Гейт и деплой, Стыки фаз, GLOBE, LIGHT, fps, MOB, Принятые отклонения, Скриншоты, Итог), 8 пунктов отклонений, ни одной пустой ячейки; README — `OK: 12 проверок` (1 раз), `OK: 11 проверок` (0 раз), `Фаза 17 / v1.2` (1 раз), путь на архив v1.1 обновлён. Закрытие milestone (аудит/архив/тег) — шаг оркестратора после этой верификации, по плану не входит в критерии фазы |
| 5 | Стыки без дефектов: `App.seams.test.tsx` читает canvas карты и `light-form.css`; `Hero.test.tsx` и `motionPolicy.test.ts` зелёные вместе; форма держит fps, пока цикл огоньков остановлен вне экрана | ✓ VERIFIED | `src/App.seams.test.tsx` содержит `describe("стыки фаз v1.2")` на 4 теста (hero видео+частицы, canvas огоньков+SVG, цели касания 44px, реестр data-anim) поверх нетронутого блока v1.1; прогнан вместе с `Hero.test.tsx` и `motionPolicy.test.ts` — 2 файла / 28 тестов зелёные; `prod-fps-390-cpu4.json.sections["light-form"]` — `mapIntersects: false`, `lightsDraws: 0` во всех 3 прогонах, `median: 120.3` (порог 55) |

**Score:** 5/5 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/test/setup.ts` | Заглушки `HTMLMediaElement.play/pause` | ✓ VERIFIED | Строки 33–34, обычные функции (не `vi.fn`), `getContext` не тронут |
| `src/components/hero/HeroParticles.test.tsx` | Без ссылки на удалённый `GlobeCanvas.test.tsx` | ✓ VERIFIED | 210 строк, `grep -c "GlobeCanvas"` → 0 |
| `src/App.seams.test.tsx` | Блок «стыки фаз v1.2» на 4 теста | ✓ VERIFIED | 334 строки, 9 `it(` (5 v1.1 + 4 v1.2) |
| `.planning/phases/17-integration-qa/qa/prod-hashes.mjs` | Сверка sha256 прода/dist | ✓ VERIFIED | 254 строки, запущен лично, код 0 |
| `.planning/phases/17-integration-qa/qa/results/prod-hashes.txt` | Таблица «7 из 7 равны» | ✓ VERIFIED | Присутствует, соответствует живому прогону скрипта |
| `.planning/phases/17-integration-qa/qa/v12-measure.js` | Снимок GLOBE/LIGHT/MOB | ✓ VERIFIED | 379 строк, данные из него дали согласованные JSON |
| `.planning/phases/17-integration-qa/qa/v12-run.mjs` | Драйвер measure/fps/shots | ✓ VERIFIED | 487 строк |
| 8 JSON в `qa/results/` (measure/fps прод+оригинал) | Числа приёмки | ✓ VERIFIED | Все 8 файлов существуют, значения соответствуют порогам |
| `docs/qa/v12-hero-1440.jpeg`, `v12-hero-390.jpeg`, `v12-map-1440.jpeg`, `v12-map-390.jpeg` | Скриншоты прода | ✓ VERIFIED | Существуют, 18–76 КБ, визуально осмотрены — реальный контент |
| `docs/qa/SMOKE.md` | Раздел «Фаза 17 / v1.2» | ✓ VERIFIED | 174 строки, 9 подразделов |
| `README.md` | Абзац о v1.2, `OK: 12 проверок` | ✓ VERIFIED | Подтверждено grep |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `src/test/setup.ts` | `App.test.tsx`, `App.seams.test.tsx` | Заглушки `play`/`pause` до рендера `<video>` | ✓ WIRED | Живой прогон `npm test` дал 0 строк «Not implemented» |
| `src/App.seams.test.tsx` | `Hero.tsx`, `HeroParticles.tsx` | `querySelector video[data-anim="globe"]`, `canvas[data-anim="stars"]` | ✓ WIRED | Тест «hero складывает видео оригинала и canvas частиц (14)» зелёный |
| `src/App.seams.test.tsx` | `LightsCanvas.tsx` | `canvas.map-lights-canvas` с `data-light-count` | ✓ WIRED | Тест «карта рисует огоньки на canvas…» зелёный, `svg, svg *` < 1300 |
| `qa/prod-hashes.mjs` | `dist/index.html` + прод | `createHash("sha256")` по каждому файлу | ✓ WIRED | Личный прогон подтвердил 7/7 равенств на HEAD `2683804` |
| `.github/workflows/deploy.yml` | GitHub Pages | push → lint/test/build/check:dist → deploy-pages | ✓ WIRED | `gh run list` — `success` на HEAD `2683804`, live 200 |
| `docs/qa/SMOKE.md` | `qa/results/*.json` | числа ячеек переписаны из JSON | ✓ WIRED | Сверены выборочно (fps, размеры видео, узлы SVG) — совпадают |

### Data-Flow Trace (Level 4)

Артефакты фазы — тестовые скрипты и QA-документы, не React-компоненты с состоянием; числа в `SMOKE.md` трассированы до исходных JSON в `qa/results/` (см. Key Link Verification выше) — реальные измерения Playwright против живого прода и оригинала, не статичные заглушки.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| tsc чист | `npx tsc -b` | код 0, вывод пуст | ✓ PASS |
| Полный набор тестов | `npm test` | 52 файла / 564 теста, 0 failed/skipped | ✓ PASS |
| Линт чист | `npm run lint` | код 0 | ✓ PASS |
| Сборка без предупреждений | `npm run build` | 793 модуля, ассеты те же хэши | ✓ PASS |
| check-dist | `node scripts/check-dist.mjs` | `OK: 12 проверок` | ✓ PASS |
| Сверка хэшей прода на актуальном HEAD | `node qa/prod-hashes.mjs --retries 1` | «7 из 7 равны» на HEAD `2683804` | ✓ PASS |
| Стыки + Hero + motionPolicy вместе | `npx vitest run src/components/hero/Hero.test.tsx src/styles/motionPolicy.test.ts` | 2 файла / 28 тестов | ✓ PASS |
| Прод жив | `curl -sI https://thevladoss.github.io/esd-onevoice27/` | `HTTP/2 200` | ✓ PASS |
| Деплой на актуальном HEAD | `gh run list --workflow deploy.yml` | `success` на `2683804` (run 34048314304) | ✓ PASS |

### Probe Execution

Формальных `scripts/*/tests/probe-*.sh` в проекте нет; функцию probe выполняют скрипты `qa/prod-hashes.mjs` и `qa/v12-run.mjs`, прогнанные напрямую в разделе Spot-Checks выше (не только процитированы из SUMMARY).

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|--------------|--------|----------|
| SHIP-01 | 17-01 | Полный гейт зелёный, инварианты CSS/data-anim не нарушены | ✓ SATISFIED | Личный прогон гейта, см. Truth 1 |
| SHIP-02 | 17-01 | Прод = `dist/` побайтно | ✓ SATISFIED | Личный прогон `prod-hashes.mjs` на актуальном HEAD, см. Truth 2 |
| SHIP-03 | 17-02 | Playwright-приёмка против оригинала, бюджет fps, цели касания, скриншоты | ✓ SATISFIED | JSON и скриншоты, см. Truth 3 |
| SHIP-04 | 17-02 | Раздел SMOKE.md + README | ✓ SATISFIED | Проверено содержимое, см. Truth 4 |
| LIGHT-07 | 17-02 (подтверждение) | fps ≥55/≥100, SVG < 1300 | ✓ SATISFIED | `prod-fps-*.json`, `svg.nodes=282` |

Требования REQUIREMENTS.md для SHIP-01…04 отмечены как «Pending» — это ожидаемо: обновление реестра требований и закрытие milestone (аудит, архив, тег v1.2) выполняет оркестратор после этой верификации, согласно `<orchestrator>` в 17-02-PLAN.md. Это не гап фазы.

### Anti-Patterns Found

Debt-маркеры (`TBD`/`FIXME`/`XXX`) и warning-маркеры (`TODO`/`HACK`/`PLACEHOLDER`, «not yet implemented», «coming soon») не найдены ни в одном файле, изменённом фазой 17 (`setup.ts`, `HeroParticles.test.tsx`, `App.seams.test.tsx`, `prod-hashes.mjs`, `v12-measure.js`, `v12-run.mjs`, `SMOKE.md`, `README.md`).

### Human Verification Required

Нет пунктов, требующих ручной проверки: визуальное сравнение скриншотов уже выполнено исполнителем и подтверждено мной при просмотре `docs/qa/v12-hero-1440.jpeg` и `docs/qa/v12-map-390.jpeg` — реальный живой контент прода (глобус, частицы, 942 огонька на карте), не заглушки. Числовые пороги (fps, размеры, sha256) проверены командами напрямую, а не разбором заявлений SUMMARY.

### Gaps Summary

Гэпов нет. Все пять наблюдаемых истин фазы 17 подтверждены прогоном кода на текущем HEAD `2683804`, а не пересказом SUMMARY.md: гейт зелёный, прод побайтно равен `dist/` (проверено дважды — на HEAD плана 17-01 и на актуальном HEAD после docs-коммита), Playwright-числа из JSON проходят все пороги SHIP-03/LIGHT-07, документация SMOKE.md/README.md заполнена без пустых ячеек, а тесты стыков v1.2 зелёные вместе с `Hero.test.tsx` и `motionPolicy.test.ts`. Оставшиеся шаги (обновление REQUIREMENTS.md/ROADMAP.md, аудит и архив milestone, тег v1.2) явно закреплены планом за оркестратором и не входят в критерии успеха самой фазы 17.

---

_Verified: 2026-09-06T17:25:20Z_
_Verifier: Claude (gsd-verifier)_
