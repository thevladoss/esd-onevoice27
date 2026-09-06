---
phase: 13-integration-qa
verified: 2026-09-06T13:55:00Z
status: passed
score: 11/11 must-haves verified
has_blocking_gaps: false
overrides_applied: 0
---

# Phase 13: Интеграция, гейт и приёмка — отчёт о верификации

**Цель фазы:** Прод на GitHub Pages содержит все шесть правок вместе, проходит полный гейт и по Playwright-сравнению совпадает с оригиналом по пунктам GLASS, MAP, FORM, MEDIA, RES и FOOT.
**Проверено:** 2026-09-06
**Статус:** passed
**Повторная верификация:** Нет — первичная проверка.

Проверка велась от цели назад: команды гейта, `gh`/`curl`/`shasum` против живого прода и независимый повторный прогон `pixel-probe.mjs` запущены заново в этой сессии, а не приняты по тексту SUMMARY. Пять стыков сверены прямым чтением исходников (`grep`/`awk`), а не только текстом `App.seams.test.tsx`.

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|---|---|---|
| 1 | QA-01: полный `npx vitest run` зелёный, набор содержит тесты состояний формы/`orgName`, панели ресурсов, пяти корзин без `pulse`, карточки 16:9, порядка узлов футера и стыков | ✓ VERIFIED | Перезапуск: `50 файлов, 504 теста, 0 failed`. Прямой `grep` подтвердил нужные ассерты в `LightForm.test.tsx` (4×«название организации»), `ResourcePanel.test.tsx` (`resources-panel-locked`, 3×`Escape`), `Resources.test.tsx` (4×`resources-materials`), `EsdMap.test.tsx` (4×`data-bucket`/`LIGHT_BUCKETS`, `.light.pulse`), `NewsCard.test.tsx` (`aspect-video`), `Footer.test.tsx` («логотип → подпись → ссылки»), `App.seams.test.tsx` (5 сценариев стыков) |
| 2 | QA-02 (гейт): `npx tsc -b`, `npm test`, `npm run lint`, `npm run build`, `node scripts/check-dist.mjs` проходят с кодом 0 | ✓ VERIFIED | Перезапущено в этой сессии: `tsc -b` код 0; `vitest run` 504/504 passed; `eslint .` код 0 без предупреждений; `vite build` код 0, без предупреждений о размере чанков (`index-ClJA1isH.js` 399,48 КБ, `vendor-map` 182,70 КБ, `index-gb-e5VHG.css` 76,46 КБ); `check-dist.mjs` → `OK: 11 проверок` |
| 3 | QA-02 (деплой): прогон «Deploy to GitHub Pages» зелёный на HEAD, прод побайтно равен локальному `dist` | ✓ VERIFIED | `gh run list --workflow deploy.yml --limit 3` → три подряд `success`, последний `10d098d` = текущий `HEAD`/`origin/main`. Свежий `curl -H 'Cache-Control: no-cache'` + `shasum -a 256` для `index.html` и трёх ассетов дал те же хэши, что и у только что собранного `dist` (4 из 4, включая `9a0d038dd0cf…` и `d81f311ba504…`) |
| 4 | QA-03: `docs/qa/SMOKE.md` содержит раздел «Фаза 13 / v1.1» с таблицами «оригинал/прод» на 1440×900 и 390×844 по GLASS/MAP/FORM/MEDIA/RES/FOOT с измеренными значениями | ✓ VERIFIED | Раздел найден, все шесть подразделов присутствуют по одному разу, ячейки результатов заполнены числами (не «да» вместо значений), статусы ссылаются на 15 пронумерованных отклонений |
| 5 | QA-03: семь скриншотов `docs/qa/v11-*.jpeg` лежат в `docs/qa/` и закоммичены | ✓ VERIFIED | Все 7 файлов на диске и в `git ls-files`; `file` подтверждает корректный JPEG нужных размеров (1440×900, 390×844, 1440×8401 и т.д.), размеры 27–709 КБ (в пределах 8 КБ…900 КБ) |
| 6 | Стык 8+9: форма стоит прозрачно внутри `.map-band`, без `::before` и без карточки-обёртки | ✓ VERIFIED | Прямой `grep`/`awk`: `<MapBand />` в `App.tsx` (1), `<LightForm />` отсутствует (0); `.lf-section::before` отсутствует в `light-form.css`; блок `.lf-section {` без `background`; `map.css` содержит 2 правила `.map-band .lf-section` (страховка каскада, no-op) |
| 7 | Стык 7+11: карточки ресурсов несут утилиту `glass-resource` фазы 7 | ✓ VERIFIED | `ResourceCard.tsx` строка 31: `className="resource-card glass glass-resource"`; `@utility glass-resource` в `global.css` содержит `blur(14px) saturate(125%)` |
| 8 | Стык 7+9: заголовок формы плоский, About градиентный | ✓ VERIFIED | `LightForm.tsx` строка 177: `variant="section"` у `#form-title`; единственный `variant="section-gradient"` в исходниках — `About.tsx` |
| 9 | Стык 10+11: превью в панели «Видео» 16:9 с `object-fit: cover`, deep link `#resources-materials` открывает материалы | ✓ VERIFIED | `video-embed.css`: `.ve { aspect-ratio: 16 / 9 }`, `.ve-poster { object-position: center }`; deep link подтверждён числами в `orig/prod-interactive-1440.json` и в SMOKE (`kind: materials`, `esdOpen: true`, 4 ссылки) |
| 10 | Стык 8: скос карты — единственная линия среза, пять корзин дышат, `light-pulse` удалён | ✓ VERIFIED | `map.css`: `.map-shell` содержит `calc(100% - var(--map-wedge))`, `.map-band::before` — `rgb(18 12 52)`, `light-pulse` отсутствует (0 вхождений), `@property --halo-k` объявлен один раз; зонд `map-probe.mjs` на проде (`prod-band-1440.json`, `prod-fps-1440.json`) даёт `jumps: []` и медиану fps 69,5 при пороге 50 |
| 11 | Отклонение №9 (чёрная полоса на обложке новости «День молитвы» и «Руководители») закрыто кропом `coverZoom` без регресса гейта | ✓ VERIFIED | Независимый повторный запуск `pixel-probe.mjs` против живого прода в этой сессии: карточка 0 → `topBand 8.93` (те же цифры, что в SMOKE), карточка 3 → `topBand 67.34, pass: true`; `NewsCard.test.tsx` закрепляет `transform: scale(1.45)`/`object-position: 50% 65%` только у широких роликов |

**Score:** 11/11 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|---|---|---|---|
| `src/App.seams.test.tsx` | 5 тестов стыков на рендере `<App/>` | ✓ VERIFIED | 5 `it(...)`, ассерты сверены с исходниками напрямую (не только с текстом теста) |
| `.planning/phases/13-integration-qa/qa/results/prod-hashes.txt` | Таблица sha256 прода/`dist` | ✓ VERIFIED | 4 сверки (после каждого пуша), последняя — коммит `22dab32`, значения совпали с моим независимым `curl`+`shasum` |
| `docs/qa/SMOKE.md` (раздел «Фаза 13 / v1.1») | Таблицы GLASS/MAP/FORM/MEDIA/RES/FOOT, отклонения, скриншоты | ✓ VERIFIED | Полный раздел, 15 отклонений, ссылки на `qa/results/*.json` |
| `docs/qa/v11-*.jpeg` (7 файлов) | Скриншоты приёмки | ✓ VERIFIED | 7 JPEG нужных размеров, в git |
| `.planning/REQUIREMENTS.md` (MAP-07) | Уточнение opacity `.22` | ✓ VERIFIED | Строка MAP-07 содержит `.22`, MAP-06 содержит `cd8a64c` |
| `.planning/phases/13-integration-qa/qa/results/prod-pixels-1440.json` | Свежий снимок яркости обложек после кропа | ⚠️ ORPHANED (не блокирует) | Файл датирован 13:23, **до** фиксов кропа (13:38–13:41): содержит старые значения `topBand 3.56/3.50`. Числа, вписанные в SMOKE как «после фикса» (8,93/67,34), в `qa/results/` не пересохранены. Проверено независимым перезапуском зонда против живого прода в этой сессии — текущие значения совпадают с SMOKE, расхождение не влияет на цель фазы, но нарушает правило «каждое число в SMOKE переписано из `qa/results/*.json`, которые лежат в том же коммите» |

### Key Link Verification

| From | To | Via | Status | Details |
|---|---|---|---|---|
| `src/App.tsx` | `src/components/map/MapBand.tsx` | `<MapBand />` | ✓ WIRED | 1 вхождение, `<LightForm />` отдельно не рендерится |
| `src/components/resources/ResourceCard.tsx` | `src/styles/global.css` | класс `glass-resource` | ✓ WIRED | Класс на карточке + утилита в `global.css` дают `backdrop-filter: blur(14px) saturate(1.25)`, подтверждено `prod-1440.json`/`prod-seams-1440.json` |
| `docs/qa/SMOKE.md` | `.planning/phases/13-integration-qa/qa/results/*.json` | значения таблиц переписаны из JSON | ⚠️ PARTIAL | Верно для GLASS/MAP/FORM/RES/FOOT; для MEDIA post-fix чисел нет исходного JSON (см. artifact выше) |
| `.github/workflows/deploy.yml` | GitHub Pages | push → build → deploy | ✓ WIRED | 3 последних прогона `success`, HEAD совпадает |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|---|---|---|---|
| Гейт целиком | `npx tsc -b && npx vitest run && npm run lint && npm run build && node scripts/check-dist.mjs` | код 0 на каждом шаге, 504/504 тестов, `OK: 11 проверок` | ✓ PASS |
| Прод = `dist` | `curl -H 'Cache-Control: no-cache'` + `shasum -a 256` для 4 файлов | 4 из 4 совпали с локальной пересборкой | ✓ PASS |
| Деплой зелёный | `gh run list --workflow deploy.yml --limit 3` | 3/3 `success`, headSha последнего = HEAD | ✓ PASS |
| Кроп обложки «День молитвы» | `node qa/pixel-probe.mjs --cover .news-card__cover --cover-index 0` (против прода) | `topBand: 8.93` (совпадает с SMOKE) | ✓ PASS (с известным отклонением №9) |
| Кроп обложки «Руководители» | `node qa/pixel-probe.mjs --cover .news-card__cover --cover-index 3` (против прода) | `topBand: 67.34, pass: true` | ✓ PASS |

### Probe Execution

Полный повтор Playwright-приёмки не требовался по инструкции задачи («оценить полноту и согласованность JSON... замеры не повторять»). Вместо этого запущен существующий Node-зонд `pixel-probe.mjs` фазы 13 против живого прода — см. Behavioral Spot-Checks выше. `map-probe.mjs`/`v11-*` заново не запускались; их JSON в `qa/results/` признаны согласованными с таблицами SMOKE при построчном сравнении (band, lights, fps, seams).

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|---|---|---|---|---|
| QA-01 | 13-01 | Тесты состояний, панели, корзин, карточки, футера и стыков зелёные | ✓ SATISFIED | 504/504 тестов, все нужные ассерты найдены в файлах |
| QA-02 | 13-01 | Гейт из пяти команд + деплой + побайтная сверка | ✓ SATISFIED | Все команды перезапущены с кодом 0, деплой зелёный, хэши равны |
| QA-03 | 13-02 | Таблица «оригинал/прод» на двух вьюпортах, 6 пунктов, скриншоты | ✓ SATISFIED | Раздел SMOKE полный, 7 скриншотов на диске |

Примечание: чекбоксы QA-01…03 и строки Traceability в `.planning/REQUIREMENTS.md` остаются `[ ]`/«Pending» — по правилам владения фазы это поле обновляет оркестратор после приёмки, а не исполнитель плана; сама реализация подтверждена независимо.

### Anti-Patterns Found

Проверены все файлы, изменённые фазой 13 и точечным фиксом оркестратора (`App.seams.test.tsx`, `news.ts`, `NewsCard.tsx`, `NewsCard.test.tsx`, `global.css`, `REQUIREMENTS.md`, `SMOKE.md`, `README.md`, `v11-measure.js`, `pixel-probe.mjs`). Debt-маркеров (`TBD`/`FIXME`/`XXX`/`TODO`/`HACK`/`PLACEHOLDER`) не найдено.

### Human Verification Required

Не требуется. Визуальное сравнение скриншотов с оригиналом выполнено и задокументировано построчно в SMOKE.md («Сравнение с выгрузками оригинала»); задача явно указала не повторять Playwright-замеры. Файлы скриншотов проверены на корректность формата и размеров (`file`, `stat`), содержимое не искажено.

### Gaps Summary

Блокирующих пробелов нет. Единственное найденное несоответствие — `qa/results/prod-pixels-1440.json` не пересохранён после фиксов кропа обложек (коммиты `3c0d063`/`22dab32`), из-за чего числа «после фикса» существуют только в тексте SMOKE.md и в git-истории коммитов, а не в JSON рядом. Числа перепроверены независимым запуском `pixel-probe.mjs` против живого прода в этой сессии и совпали дословно с тем, что записано в SMOKE («8,93» и «67,34»), поэтому это не искажает вывод приёмки — отмечено как WARNING для полноты трассируемости, не как BLOCKER.

**This looks intentional but undocumented.** Если координатор считает разрыв между `qa/results/` и текстом SMOKE приемлемым (числа перепроверяемы и совпадают), можно принять override:

```yaml
overrides:
  - must_have: "Каждое число в SMOKE переписано из qa/results/*.json, которые лежат в том же коммите"
    reason: "Точечный фикс кропа обложек (после основного плана 13-02) не пересохранил prod-pixels-1440.json; значения независимо перепроверены зондом против прода и совпадают с текстом SMOKE"
    accepted_by: "{имя}"
    accepted_at: "{ISO timestamp}"
```

---

*Verified: 2026-09-06*
*Verifier: Claude (gsd-verifier)*
