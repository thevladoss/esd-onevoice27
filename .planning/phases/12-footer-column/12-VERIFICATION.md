---
phase: 12-footer-column
verified: 2026-09-06T08:09:57Z
status: passed
score: 6/6 must-haves verified
has_blocking_gaps: false
overrides_applied: 0
deferred:
  - truth: "Визуальная пиксельная приёмка футера на 1440×900 и 390×844 (совпадение с оригиналом, отсутствие переноса названия при ширине 190px)"
    addressed_in: "Phase 13"
    evidence: "ROADMAP.md Phase 13 QA-03: «Playwright на проде 1440×900 и 390×844: таблица «оригинал/прод» ... FOOT (одна колонка)»; PLAN 12-01 <verification>: «Визуальная приёмка на 1440×900 и 390×844 выполняется фазой 13»"
---

# Phase 12: Футер в одну колонку — Verification Report

**Phase Goal:** Посетитель видит футер оригинала в одну колонку по центру: логотип, подпись, ссылки столбиком и юридический текст
**Verified:** 2026-09-06T08:09:57Z
**Status:** passed
**Re-verification:** Нет — первичная проверка

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Футер выстроен одной колонкой по центру: логотип → подпись → ссылки → юридический текст | ✓ VERIFIED | `Footer.tsx:14-31` — ровно четыре прямых ребёнка `.site-footer__inner` в этом порядке; `Footer.test.tsx:78-101` утверждает индексы `[0,1,2,3]` и `inner.children.length === 4`; тест выполнен вживую, зелёный |
| 2 | Контейнер `.site-footer__inner` имеет `width: min(100% - 32px, 1152px)`, `gap: clamp(20px, 3vw, 34px)`, `padding-block` со скосом `clamp(72px, 10vw, 124px)` | ✓ VERIFIED | `Footer.css:55-66` (width, gap, flex-column, text-align: center); `Footer.css:12` `padding-block: calc(var(--footer-wedge) + clamp(72px, 10vw, 124px)) clamp(72px, 10vw, 124px)` — этот блок не менялся фазой (`git diff` по строкам 1-54 пуст) |
| 3 | Логотип в футере `clamp(190px, 26vw, 300px)` × `clamp(72px, 10vw, 108px)` со свечением `drop-shadow(0 0 22px rgb(91 90 214 / .13))`, логотип в шапке не изменился | ✓ VERIFIED | `Footer.css:70-76` буквально совпадает со спецификацией; `git diff 782ffa5~1..782ffa5 -- Header.tsx Header.css` пуст; `Header.test.tsx` зелёный в общем прогоне (97/97 тестов каталога `layout`) |
| 4 | Ссылки столбиком по центру, gap 8px, 700 14px `rgb(248 247 251 / .92)`, hover/focus `rgb(170 217 220)`, `rel="noopener noreferrer"` в одной строке со sr-only подсказкой | ✓ VERIFIED | `Footer.css:110-133`; `Footer.tsx:22-23` — `target="_blank" rel="noopener noreferrer"` в одной строке; `Footer.test.tsx:45-56,130-155` проверяют это вживую |
| 5 | Над юридическим текстом нет разделительной линии; текст `.75rem`, lh 1.7, `rgb(239 237 245 / .66)`, `text-wrap: balance`, ширина `min(100%, 680px)` | ✓ VERIFIED | `Footer.css:136-143`; `grep -c border-top Footer.css` = 0; `Footer.tsx:30` — `<p className="site-footer__legal">` без `div`-обёртки |
| 6 | Скос, волны (`::after`) и гало (`.site-footer__halo`) на месте, реестр `data-anim` не тронут | ✓ VERIFIED | `git diff` показывает первое изменение только с `.site-footer__inner` (строка 55) — блоки `.site-footer`, `::after`, `.site-footer__halo` (строки 1-54) идентичны состоянию до фазы; `Footer.tsx:8,12` — `data-anim="wave"` и `data-anim="halo"` сохранены |

**Score:** 6/6 truths verified

### Deferred Items

| # | Item | Addressed In | Evidence |
|---|------|-------------|----------|
| 1 | Визуальное пиксельное сравнение футера с оригиналом на 1440×900 и 390×844 (в т.ч. проверка, что название не переносится на 190px) | Phase 13 | ROADMAP.md Phase 13, QA-03: Playwright-таблица «оригинал/прод» по пункту FOOT; PLAN 12-01 явно исключает визуальную приёмку из своей фазы |

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/components/layout/Wordmark.tsx` | Опциональный проп `size`, дефолт не меняет шапку | ✓ VERIFIED | Проп `size?: "default" \| "footer"`, при `"footer"` добавляет `wordmark--footer`; дефолт даёт `className === "wordmark"` |
| `src/components/layout/Wordmark.test.tsx` | Тесты пропа `size` | ✓ VERIFIED | 7 тестов (4 старых + 3 новых), все зелёные |
| `src/components/layout/Footer.tsx` | Разметка одной колонки: Wordmark → caption → nav → legal | ✓ VERIFIED | Ровно 4 прямых ребёнка `.site-footer__inner` в нужном порядке, `site-footer__grid`/`site-footer__brand` отсутствуют |
| `src/components/layout/Footer.css` | Flex-колонка, правило `.wordmark--footer`, столбик ссылок, юр.текст без рамки | ✓ VERIFIED | Все литералы спецификации присутствуют; запрещённые паттерны (`grid-template-columns`, `border-top`, `prefers-reduced-motion`, `var(--color-horizon-200)`) отсутствуют |
| `src/components/layout/Footer.test.tsx` | Тест порядка узлов, `rel`, CSS-проверки | ✓ VERIFIED | 9 тестов (5 старых + 4 новых), все зелёные |
| `src/data/copy.ts` | Блок `footer` без изменений (текст уже верный) | ✓ VERIFIED | `git diff` подтверждает — файл не тронут фазой |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `Footer.tsx` | `Wordmark.tsx` | `<Wordmark size="footer" />` | ✓ WIRED | `Footer.tsx:15` |
| `Wordmark.tsx` | `Footer.css` | класс `wordmark--footer` на корне | ✓ WIRED | `Wordmark.tsx:17-22` добавляет класс, `Footer.css:70-87` стилизует его |
| `Footer.tsx` | `src/data/copy.ts` | `copy.footer.*` | ✓ WIRED | `Footer.tsx:16,18-23,30` использует `caption`, `linksLabel`, `links`, `newTabHint`, `legal` |
| `Footer.test.tsx` | `Footer.css` | `readFileSync` (vitest `css: false`) | ✓ WIRED | `Footer.test.tsx:8-11`, используется в двух тестах CSS-значений |
| `Header.tsx` | `Wordmark.tsx` | `<Wordmark tone="solid" />` без `size` | ✓ WIRED, без регрессии | Вызов не менялся; `git diff` пуст, `Header.test.tsx` зелёный |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Тесты футера и вордмарка реально проходят (не только заявлены в SUMMARY) | `npx vitest run src/components/layout src/styles/motionPolicy.test.ts` | 8 файлов, 97 тестов, все зелёные | ✓ PASS |
| Типы собираются без ошибок | `npx tsc -b` | exit 0 | ✓ PASS |
| Нет регрессий в остальном проекте | `npx vitest run` (полный набор) | 45 файлов, 393 теста, все зелёные | ✓ PASS |
| Линт чист по изменённым файлам | `npx eslint Footer.tsx Wordmark.tsx Footer.test.tsx Wordmark.test.tsx` | 0 ошибок (1 неигнорируемое предупреждение — `Footer.css` вне зоны eslint, ожидаемо) | ✓ PASS |
| Header не изменён | `git diff 782ffa5~1..782ffa5 -- Header.tsx Header.css` | пусто | ✓ PASS |
| Изменены только файлы владения фазы 12 | `git diff --name-only 782ffa5~1..782ffa5` \| исключить `.planning/*`, файлы Footer/Wordmark/copy.ts | пусто (посторонних файлов нет) | ✓ PASS |

### Требования (значения CSS буквально по спецификации, раздел 6 FOOT)

| Значение спецификации | Footer.css | Совпадение |
|---|---|---|
| `width: min(100% - 32px, 1152px)` | строка 62 | ✓ |
| `gap: clamp(20px, 3vw, 34px)` | строка 64 | ✓ |
| `text-align: center` | строка 65 | ✓ |
| `padding-block: clamp(72px, 10vw, 124px)` (+ скос) | строка 12 (не менялась фазой) | ✓ |
| логотип `clamp(190px, 26vw, 300px)` × `clamp(72px, 10vw, 108px)` | строки 71-72 | ✓ |
| `drop-shadow(0 0 22px rgb(91 90 214 / .13))` | строка 75 | ✓ |
| подпись `min(100%, 680px)`, 16→18→20px, lh normal, `rgb(248 247 251 / .92)` | строки 90-107 | ✓ |
| ссылки: gap 8px, 700 14px, `rgb(248 247 251 / .92)`, hover `rgb(170 217 220)` | строки 110-133 | ✓ |
| юр. текст `min(100%, 680px)`, `.75rem`, lh 1.7, `rgb(239 237 245 / .66)`, `text-wrap: balance` | строки 136-143 | ✓ |
| без верхней линии над юр. текстом | нет `border-top` в файле | ✓ |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|---|---|---|---|---|
| FOOT-01 | 12-01-PLAN.md | Футер в одну колонку по центру, порядок логотип→подпись→ссылки→юр.текст, скос/волны/гало сохранены | ✓ SATISFIED | Truths 1, 2, 3, 6 |
| FOOT-02 | 12-01-PLAN.md | Ссылки столбиком, gap 8px, 700 14px, hover `rgb(170 217 220)`, без линии над юр. текстом | ✓ SATISFIED | Truths 4, 5 |

Осиротевших требований для фазы 12 в REQUIREMENTS.md нет (только FOOT-01 и FOOT-02, оба заявлены в PLAN и покрыты).

### Anti-Patterns Found

Не найдено. Проверены `Footer.tsx`, `Footer.css`, `Wordmark.tsx` на `TBD|FIXME|XXX|TODO|HACK|PLACEHOLDER`, `outline: none`, `prefers-reduced-motion` вне `global.css`, `border-top`, остатки grid-разметки (`site-footer__grid`, `site-footer__brand`, `grid-template-columns`) — все проверки чистые.

### Human Verification Required

Пунктов, требующих обязательной приёмки человеком именно в фазе 12, нет: все критерии успеха ROADMAP для фазы 12 — структурные и CSS-значения, проверяемые кодом и тестами. Единственный визуальный аспект (пиксельное сравнение с оригиналом на 1440×900/390×844, включая проверку непереноса названия «Единый голос 27» на узком экране) сознательно вынесен в Phase 13 согласно ROADMAP (QA-03) и явному пункту `<verification>` плана 12-01 — см. раздел «Deferred Items».

### Gaps Summary

Пробелов не найдено. Все шесть производных истин фазы подтверждены кодом и живым прогоном тестов (не только текстом SUMMARY): структура DOM, литералы CSS из спецификации, неприкосновенность шапки и владения файлами. `npx tsc -b`, точечный и полный `npx vitest run`, `eslint` по изменённым файлам — зелёные. Единственный оставшийся пункт — визуальная Playwright-приёмка — по архитектуре проекта относится к Phase 13 и не является пробелом фазы 12.

---

*Verified: 2026-09-06T08:09:57Z*
*Verifier: Claude (gsd-verifier)*
