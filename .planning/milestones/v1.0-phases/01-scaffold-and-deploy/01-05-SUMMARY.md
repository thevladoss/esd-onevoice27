---
phase: 01-scaffold-and-deploy
plan: 05
subsystem: infra
tags: [github-actions, github-pages, deploy, ci, curl, vite-preview, readme]

requires:
  - phase: 01-01
    provides: "скаффолд, base /esd-onevoice27/, index.html с метаданными, workflow deploy.yml, README"
  - phase: 01-02
    provides: "примитивы и восемь секций-заглушек с h1 и CTA"
  - phase: 01-03
    provides: "header-пилюля, меню, бургер, мобильный оверлей, scrollToSection"
  - phase: 01-04
    provides: "footer с волнами, подписью, © строкой и внешними ссылками"
provides:
  - "Опубликованный итог фазы 1 на https://thevladoss.github.io/esd-onevoice27/ (прогон 33975939373, sha 7fe92f2)"
  - "Раздел README «Проверка деплоя»: gh run list, gh run watch, curl и чеклист живого сайта"
  - "Подтверждение, что локальный vite preview и живой сайт отдают побайтово одинаковые index.html, JS и CSS"
affects: [02-hero-and-map, 03-content-sections, 04-resources-and-quote, 05-motion-and-polish]

tech-stack:
  added: []
  patterns:
    - "Сверка деплоя по sha256 ассетов: локальный dist и живые файлы GitHub Pages сравниваются на одном коммите"
    - "Ожидание прогона без gh run watch: цикл gh run view --json status,conclusion с паузой 20 с (на macOS нет timeout)"

key-files:
  created: []
  modified:
    - README.md

key-decisions:
  - "Ожидание прогона сделано опросом gh run view в цикле вместо gh run watch: на macOS нет coreutils timeout, а watch без него может висеть до бесконечности"
  - "Наличие восьми секций, заголовков, header и footer проверено по живому JS-бандлу: esbuild минифицирует строки в шаблонные литералы, поэтому паттерны ищутся в обратных кавычках"

patterns-established:
  - "Проверка деплоя = четыре шага: sha прогона == HEAD, 200 на URL, 200 на каждом ассете, sha256 ассетов совпадает с локальным билдом"

requirements-completed: [QA-03]

duration: 8min
completed: 2026-09-05
---

# Phase 01 Plan 05: Живой деплой и проверка Summary

**Итог фазы 1 опубликован: прогон 33975939373 на sha 7fe92f2 зелёный, живой сайт отдаёт побайтово тот же index.html, JS и CSS, что и локальный `vite preview`, README описывает проверку деплоя.**

## Performance

- **Duration:** 8 min
- **Started:** 2026-09-05T15:46:24Z
- **Completed:** 2026-09-05T15:54:00Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- Локальный гейт из чистого дерева прошёл целиком: `npm ci` (284 пакета, 0 уязвимостей), `npm run lint` без замечаний, `npm test` 15 файлов / 111 тестов passed, `npm run build` за 411 мс.
- `main` запушен в `origin` (763c8c3 → 7fe92f2), workflow `Deploy to GitHub Pages` отработал на этом sha: job `build` success, job `deploy` success.
- Живой сайт отвечает `HTTP/2 200`, а его `index.html`, JS и CSS побайтово совпадают с локальным `vite preview` того же коммита (sha256 сошлись).
- README получил раздел «Проверка деплоя» с командами `gh run list`, `gh run watch --exit-status`, `curl -sI` и чеклистом того, что смотреть.

## Task Commits

1. **Task 1: Полный локальный гейт, пуш и проверка живого деплоя** — `7fe92f2` (docs)
2. **Task 2: Браузерный smoke живого сайта** — без коммита: проверки прошли, правок в файлах не потребовалось (план: «README не менять, если проблем не было»)

## Files Created/Modified

- `README.md` — раздел «Проверка деплоя»: команды `gh run list --workflow deploy.yml --limit 1`, `gh run watch <id> --exit-status`, `curl -sI https://thevladoss.github.io/esd-onevoice27/`, чеклист из шести пунктов и предупреждение про пути от корня вместо `/esd-onevoice27/`.

## Деплой: что зафиксировано

| Поле | Значение |
|---|---|
| Прогон | `33975939373` |
| Workflow | Deploy to GitHub Pages (`.github/workflows/deploy.yml`) |
| `headSha` | `7fe92f22b1269ea6300f78f483c8d8ce39d3321b` |
| Jobs | `build: success`, `deploy: success` |
| Начало / конец | 2026-09-05T15:48:55Z → 2026-09-05T15:49:42Z (47 с) |
| URL прогона | https://github.com/thevladoss/esd-onevoice27/actions/runs/33975939373 |
| `git rev-parse HEAD` | `7fe92f2` = `origin/main` |

### Проверенные URL

| URL | Код | Content-Type | Размер |
|---|---|---|---|
| `https://thevladoss.github.io/esd-onevoice27/` | 200 | text/html; charset=utf-8 | 2 121 |
| `/esd-onevoice27/assets/index-Cka7Objt.js` | 200 | application/javascript | 203 443 |
| `/esd-onevoice27/assets/index-DNVgr8oC.css` | 200 | text/css | 42 645 |
| `/esd-onevoice27/favicon.svg` | 200 | image/svg+xml | 574 |
| `https://fonts.googleapis.com/css2?family=Onest...&family=Noto+Sans...` | 200 | text/css | — |

Голый origin `https://fonts.googleapis.com` из тега `preconnect` отдаёт 404 при прямом `curl`, но браузер этот URL не запрашивает: `preconnect` только открывает соединение. Реальная таблица стилей шрифтов отвечает 200.

### Сверка локального билда и живого сайта

Набор ссылок в HTML совпал (`diff` пуст), файлы совпали по sha256:

| Файл | sha256 (локальный dist == живой Pages) |
|---|---|
| `index.html` | побайтовый `diff` пуст |
| `assets/index-Cka7Objt.js` | `d55dcd6c83a650d63795c620889d83e69335a20407ef886547a1ebc793691219` |
| `assets/index-DNVgr8oC.css` | `d2de5f17b21cc3a905ec941f10b547649ca17b4398bf1c3ad5d093e06afa09ce` |

### Содержимое живого билда

Живой `index.html`: `lang="ru"`, `<title>Единый голос 27 — Евро-Азиатский дивизион</title>`, `og:title`, `og:url` на адрес Pages, `theme-color #070210`.

В живом JS-бандле найдены все восемь id секций (`hero`, `map`, `light-form`, `about`, `involve`, `news`, `resources`, `quote`) и все восемь заголовков из `copy.sections.*.title`: «Вместе, единым голосом», «Зажигаем свет по всему дивизиону», «Зажгите свет», «Что такое Единый голос 27?», «От убеждения к действию», «Каждая платформа становится голосом», «Всё, что нужно для старта», «Слово, с которого всё начинается». Там же: единственный маркер `h1`, CTA «Зажечь свой свет», строки header («Основная навигация», «Открыть меню», «Закрыть меню», `aria-modal`) и footer («Внешние ссылки», «МИССИЯ ДЛЯ ВСЕХ», «Евро-Азиатский дивизион»). В живом CSS: 24 вхождения `site-header`, 15 `site-footer`, keyframes `footer-wave-drift` и четыре блока `prefers-reduced-motion`.

## Браузерный smoke

**Браузерный smoke не выполнен исполнителем плана: Playwright MCP недоступен в этой сессии** (инструментов `browser_navigate`, `browser_resize`, `browser_snapshot`, `browser_console_messages`, `browser_click`, `browser_evaluate` нет в наборе агента). Имитацию проверки не делал, скриншотов нет.

Оркестратор запускает браузерную проверку сразу после этого плана, поэтому в фазу 5 (QA-04) перенос не нужен, если она пройдёт. Если оркестратор её тоже не выполнит, пункт уходит в фазу 5 (QA-04).

Что закрыто без браузера (через curl и разбор бандла) и что осталось на браузер:

| Пункт чеклиста UI-SPEC | Статус |
|---|---|
| Все восемь секций с ожидаемыми id в DOM | закрыто: восемь id и восемь заголовков в живом бандле |
| Один `h1`, CTA «Зажечь свой свет» | закрыто: маркеры в живом бандле |
| Ассеты без 404 | закрыто: 200 на JS, CSS, favicon и таблице шрифтов |
| Header с навигацией, footer с внешними ссылками | закрыто по строкам и CSS-классам в живом билде |
| `prefers-reduced-motion` выключает волны и гало | закрыто на уровне CSS: четыре медиаблока в живом CSS |
| Уплотнение пилюли при скролле, видимость скоса | на браузер |
| Клик по четырём пунктам прокручивает к секциям | на браузер |
| Бургер, оверлей, Esc, возврат фокуса, блокировка скролла на 390px | на браузер |
| Отсутствие горизонтального скролла на 390/768/1024/1440 | на браузер |
| Консоль без ошибок | на браузер |

## Decisions Made

- Ожидание прогона: цикл `gh run view --json status,conclusion` с паузой 20 с вместо `gh run watch --exit-status`. На macOS нет `timeout`, а `watch` без него рискует зависнуть; цикл дал тот же результат за три итерации.
- Проверка содержимого живого билда идёт по бандлу, а не по HTML: страница рендерится React-ом, в `index.html` только оболочка. esbuild минифицирует строки в шаблонные литералы, поэтому поиск ведётся по обратным кавычкам (`` `hero` ``), а не по двойным.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `gh run watch` заменён на опрос `gh run view` в цикле**

- **Найдено во время:** Task 1, шаг 3
- **Проблема:** на macOS нет `timeout`, обернуть `gh run watch --exit-status` нечем; при зависании прогона агент завис бы вместе с ним.
- **Решение:** цикл до 30 итераций `gh run view <id> --json status,conclusion` с `sleep 20`, выход по `completed`. Прогон завершился на третьей итерации со `success`.
- **Файлы:** нет (только команда исполнения)
- **Проверка:** `gh run list --workflow deploy.yml --limit 1 --json conclusion,headSha` → `success` на `7fe92f2`
- **Коммит:** нет (изменение в процедуре, не в файлах)

**2. [Rule 2 - Прозрачность проверки] Браузерный smoke не имитирован, зафиксирован явно**

- **Найдено во время:** Task 2
- **Проблема:** Playwright MCP недоступен агенту, а план запрещает имитировать браузерную проверку.
- **Решение:** пункт записан в SUMMARY явно, недостающие пункты чеклиста разнесены по таблице «закрыто / на браузер»; браузерную часть выполняет оркестратор сразу после плана.
- **Файлы:** `.planning/phases/01-scaffold-and-deploy/01-05-SUMMARY.md`
- **Проверка:** curl-проверки Task 1 прошли, автоматический `verify` Task 2 вернул 0
- **Коммит:** финальный коммит плана

---

**Total deviations:** 2 auto-fixed (1 × Rule 3, 1 × Rule 2)
**Impact on plan:** объём не поплыл, изменений в продуктовом коде нет. Единственная непокрытая часть плана — браузерный smoke, и она отмечена честно.

## Assumption Drift (advisory)

**1. `npm test` показывает 15 файлов и 111 тестов вместо ожидаемых планом 7 файлов**

- **Найдено во время:** Task 1, шаг 1
- **Планировалось:** «ожидается 7 файлов тестов: App, Wordmark, primitives, placeholders, scrollToSection, Header, Footer»
- **Фактически:** 15 файлов, 111 тестов, все зелёные. Добавились `useActiveSection.test.ts` из плана 01-03 и семь файлов волны 1 фазы 2 (`lights.test.ts`, `easing.test.ts`, `format.test.ts`, `geo.test.ts`, `rng.test.ts`, `useReducedMotion.test.tsx`, `lights.reducer.test.tsx`).
- **Почему:** пока волна 2 фазы 1 шла, в `main` влился план 02-02 («движок карты»): 8 коммитов с библиотечным кодом и тестами. Пуш этого плана публикует не только каркас фазы 1, но и этот фундамент фазы 2.
- **Влияние:** видимой части сайта не касается, 02-02 добавил только модули в `src/lib`, `src/data`, `src/state`. Проверка «восемь секций и h1» на живом бандле подтверждает, что страница осталась каркасом фазы 1.

## Issues Encountered

Ни одной ошибки CI: расхождения между локальным Node 25.2.1 и Node 22 в раннере не всплыло, повторных пушей и починок не потребовалось. Первый же `curl` после прогона вернул 200, ждать распространения Pages не пришлось.

## User Setup Required

None — внешние сервисы не настраиваются, публикация идёт через OIDC.

## Known Stubs

Восемь секций остаются заглушками (`Section` + `GlassCard` + абзац из `copy.ts`) по замыслу фазы 1: содержимое заводят фазы 2–4, `App.tsx` при этом не меняется. Отдельно отмечу заглушку hero: canvas-глобус и луч по границе CTA приезжают в фазе 2 (HERO-01, HERO-03).

## Threat Flags

Нет: план не менял код приложения, не трогал зависимости и не добавлял сетевых точек. Пункты T-01-12 (id прогона и sha в SUMMARY) и T-01-13 (сверка ассетов локального билда и живого сайта) закрыты выше.

## Next Phase Readiness

Фаза 1 готова к verify: критерий 5 ROADMAP подтверждён на живом сайте, критерии 1–4 подтверждены на уровне DOM-строк и CSS в живом билде, интерактивная их часть ждёт браузерного прохода оркестратора. `origin/main` = локальный HEAD, дерево чистое, следующие исполнители могут пушить от `7fe92f2`.

---
*Phase: 01-scaffold-and-deploy*
*Completed: 2026-09-05*

## Self-Check: PASSED

- `README.md` на диске, содержит «Проверка деплоя», `gh run watch` и `curl -sI https://thevladoss.github.io/esd-onevoice27/`
- `.planning/phases/01-scaffold-and-deploy/01-05-SUMMARY.md` на диске
- Коммит `7fe92f2` есть в истории и в `origin/main`
