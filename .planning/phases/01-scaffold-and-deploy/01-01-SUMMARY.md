---
phase: 01-scaffold-and-deploy
plan: 01
subsystem: infra
tags: [vite, react, typescript, tailwindcss-v4, vitest, jsdom, github-actions, github-pages]

requires: []
provides:
  - "Скаффолд Vite 8.2.2 + React 19.2.8 + TypeScript 5.9.3 + Tailwind v4.3.3 + Vitest в корне репозитория"
  - "base /esd-onevoice27/ и метаданные index.html (lang=ru, title, description, theme-color, Open Graph, Google Fonts, noscript)"
  - "Контракт текстов src/data/copy.ts: sectionIds, SectionId, copy, NavItem"
  - "Токены @theme в src/styles/tokens.css и глобальные стили с утилитами glass, text-gradient-brand, focus-ring"
  - "Финальная композиция src/App.tsx: SkipLink, Header, main#main с восемью секциями, Footer"
  - "Заглушки Header, Footer и восьми секций в своих папках под замену планами 01-02, 01-03, 01-04"
  - "Компоненты Wordmark и SkipLink с тестами"
  - "jsdom-моки в src/test/setup.ts: IntersectionObserver, ResizeObserver, matchMedia, canvas getContext, scrollIntoView, scrollTo"
  - "Workflow .github/workflows/deploy.yml и живой сайт https://thevladoss.github.io/esd-onevoice27/"
affects: [01-02, 01-03, 01-04, 01-05, 02-hero-and-map, 03-content-sections, 04-resources-and-quote, 05-motion-and-polish]

tech-stack:
  added:
    - vite 8.2.2
    - "@vitejs/plugin-react 6.1.1"
    - react 19.2.8 / react-dom 19.2.8
    - typescript 5.9.3
    - tailwindcss 4.3.3 + "@tailwindcss/vite" 4.3.3
    - vitest 4.1.11 + jsdom 29.1.1
    - "@testing-library/react 16.3.3, jest-dom 7.0.1, user-event 14.6.7"
    - motion 13.2.0
    - d3-geo 3.1.1, d3-zoom 3.0.0, d3-selection 3.0.0, topojson-client 3.1.0, world-atlas 2.0.2
    - eslint 10.10.0 + typescript-eslint 8.x (конфиг из шаблона create-vite)
  patterns:
    - "Токены Tailwind v4 живут в @theme (src/styles/tokens.css), без tailwind.config.js и без @tailwind"
    - "Весь пользовательский текст в src/data/copy.ts, компоненты берут строки оттуда"
    - "Один компонент на файл, один именованный экспорт; секции разложены по папкам src/components/<секция>/"
    - "Тесты лежат рядом с компонентами в *.test.tsx, названия тестов на русском"
    - "App.tsx фиксирует композицию: планы волны 2 заменяют файлы компонентов, не трогая App.tsx"

key-files:
  created:
    - vite.config.ts
    - index.html
    - src/App.tsx
    - src/data/copy.ts
    - src/styles/tokens.css
    - src/styles/global.css
    - src/test/setup.ts
    - src/components/layout/Wordmark.tsx
    - src/components/layout/SkipLink.tsx
    - .github/workflows/deploy.yml
    - README.md
  modified:
    - .gitignore

key-decisions:
  - "Vitest закреплён на 4.1.11 и jsdom на 29.1.1: локальный Node 25.2.1 не входит в engines vitest 5 (^22.12 || ^24 || >=26), npm сам выбирает ветку V4"
  - "TypeScript закреплён на ^5.9.3 вместо шаблонного ~6.0.2, как требует RESEARCH"
  - "Шаблон create-vite собран во временной папке и перенесён по файлам, потому что корень репозитория занят .planning, docs и CLAUDE.md"
  - "Откат на Vite 7 не понадобился: Vite 8.2.2 работает с @tailwindcss/vite 4.3.3 и Vitest"

patterns-established:
  - "Дизайн-токены: @theme в tokens.css, не-утилитарные переменные в :root внутри global.css"
  - "Доступность: skip-link первым фокусируемым элементом, ландмарки header/main#main/footer, кольцо фокуса horizon-200"
  - "CI: пуш в main прогоняет npm ci, npm test, npm run build и публикует dist через OIDC без секретов"

requirements-completed: [SHELL-05, SHELL-06, QA-03]

duration: 13min
completed: 2026-09-05
---

# Phase 01 Plan 01: Каркас и деплой Summary

**Скелет лендинга на Vite 8 + React 19 + Tailwind v4 с base `/esd-onevoice27/`, контрактами copy.ts и токенов, восемью секциями-заглушками и зелёным деплоем на GitHub Pages.**

## Performance

- **Duration:** 13 мин
- **Started:** 2026-09-05T15:09:30Z
- **Completed:** 2026-09-05T15:22:00Z
- **Tasks:** 4
- **Files modified:** 32

## Accomplishments

- Проект собирается и тестируется из корня репозитория: `npm test` (2 файла, 6 тестов), `npm run build` и `npm run lint` зелёные локально и в CI.
- Сайт живёт по адресу https://thevladoss.github.io/esd-onevoice27/: HTTP/2 200, `lang="ru"`, заголовок «Единый голос 27 — Евро-Азиатский дивизион», CSS, JS и favicon отдаются по base `/esd-onevoice27/` с кодом 200.
- Зафиксированы контракты для волны 2: `copy.ts`, `tokens.css`, `global.css`, `Wordmark`, `SkipLink`, `App.tsx`, `setup.ts`, `package.json`. Планы 01-02, 01-03 и 01-04 заменяют только свои файлы компонентов.
- Workflow `deploy.yml` прогоняет `npm ci`, `npm test`, `npm run build` и публикует `dist` через OIDC, без секретов и токенов.

## Task Commits

1. **Task 1: Скаффолд проекта и конфигурация** — `ab1c59d` (chore)
2. **Task 2: Заглушки оболочки и восьми секций, композиция App.tsx** — `bc91155` (feat)
3. **Task 3: Токены, global.css и Wordmark** — `fbe76d8` (feat)
4. **Task 4: Workflow GitHub Actions, README и живой деплой** — `730208a` (ci)

## Файл прогона деплоя

- Run ID: 33974323720
- Ссылка: https://github.com/thevladoss/esd-onevoice27/actions/runs/33974323720
- Статус: `success` (build 23 с, deploy 11 с)
- Аннотация раннера: экшены `checkout@v4`, `setup-node@v4`, `configure-pages@v5`, `upload-artifact@v4` собраны под Node 20 и запускаются на Node 24. Предупреждение GitHub, на результат не влияет.

## Фактические версии из package-lock.json

| Пакет | Версия |
|---|---|
| vite | 8.2.2 |
| react / react-dom | 19.2.8 |
| typescript | 5.9.3 |
| tailwindcss / @tailwindcss/vite | 4.3.3 |
| vitest | 4.1.11 |
| jsdom | 29.1.1 |
| @vitejs/plugin-react | 6.1.1 |
| motion | 13.2.0 |
| d3-geo / topojson-client / world-atlas | 3.1.1 / 3.1.0 / 2.0.2 |
| eslint | 10.10.0 |

## Files Created/Modified

- `vite.config.ts` — base `/esd-onevoice27/`, плагины react и tailwindcss, блок test с jsdom и globals
- `index.html` — lang=ru, title, description, theme-color, Open Graph, preconnect и Google Fonts, noscript
- `package.json` / `package-lock.json` — имя `esd-onevoice27`, шесть скриптов, зависимости фаз 1–5
- `tsconfig.app.json` — типы `vite/client` и `vitest/globals`
- `src/data/copy.ts` — sectionIds, SectionId, copy, NavItem; тексты оболочки, CTA и восьми секций
- `src/styles/tokens.css` — блок @theme: палитра, шрифты, размеры, радиусы, тени, кривые
- `src/styles/global.css` — импорты Tailwind и токенов, :root, базовые стили, утилиты glass / text-gradient-brand / focus-ring, классы wordmark и skip-link, keyframes футера, reduced motion
- `src/test/setup.ts` — jest-dom и моки IntersectionObserver, ResizeObserver, matchMedia, canvas getContext, scrollIntoView, scrollTo
- `src/App.tsx` — SkipLink, Header, main#main с восемью секциями, Footer
- `src/App.test.tsx` — секции с ожидаемыми id, ландмарки, ссылка пропуска
- `src/components/layout/Wordmark.tsx` + `Wordmark.test.tsx` — вордмарк с градиентом и тесты
- `src/components/layout/SkipLink.tsx` — ссылка на #main
- `src/components/layout/{Header,Footer}.tsx` и восемь файлов секций — заглушки под замену волной 2
- `public/favicon.svg` — круг с брендовым градиентом на фоне midnight-950
- `.github/workflows/deploy.yml` — сборка, тесты и публикация на Pages
- `README.md` — запуск, деплой, структура проекта
- `.gitignore` — записи шаблона добавлены к существующим

## Decisions Made

- Vitest остаётся на ветке 4.x, потому что vitest 5 не поддерживает локальный Node 25.2.1. CI на Node 22 ставит ту же версию из lockfile, расхождения между локальным прогоном и CI нет.
- Favicon нарисован вручную (круг с градиентом signal → unity → horizon на midnight-950) вместо шаблонного логотипа Vite.
- README не описывает планы фаз, только запуск, деплой и структуру: файл читают разработчики, а не участники планирования.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Vitest 4.1.11 и jsdom 29.1.1 вместо 5.0.0 и 30.0.1**
- **Found during:** Task 1 (установка зависимостей)
- **Issue:** План и RESEARCH называли vitest 5.0.0. `npm i -D vitest` поставил 4.1.11: engines vitest 5 требуют Node `^22.12.0 || ^24.0.0 || >=26.0.0`, локально стоит Node 25.2.1, и npm выбрал ветку V4. По той же причине jsdom встал 29.1.1 вместо 30.0.1.
- **Fix:** Оставлены версии, которые npm выбрал для текущего Node; lockfile закрепляет их и для CI на Node 22.
- **Files modified:** package.json, package-lock.json
- **Verification:** `npm test` проходит локально (6 тестов) и в CI шагом `npm test` прогона 33974323720
- **Committed in:** `ab1c59d`

**2. [Rule 3 - Blocking] Публичное поле callback в моке IntersectionObserver**
- **Found during:** Task 1 (первый прогон `npm run build`)
- **Issue:** `noUnusedLocals` в tsconfig.app.json ругается на приватное поле класса, которое конструктор сохраняет и никто не читает.
- **Fix:** Поле объявлено публичным `readonly callback`, конструктор по-прежнему сохраняет колбэк, как требует план.
- **Files modified:** src/test/setup.ts
- **Verification:** `npm run build` (`tsc -b`) и `npm run lint` завершаются кодом 0
- **Committed in:** `ab1c59d`

---

**Total deviations:** 2 auto-fixed (обе Rule 3, блокирующие)
**Impact on plan:** Обе правки вынужденные и не расширяют объём. Откат на Vite 7 не понадобился, остальная конфигурация совпадает с планом.

## Assumption Drift (advisory)

**1. Vitest 5 в песочнице против Vitest 4 в проекте**
- **Found during:** Task 1
- **Planned:** RESEARCH.md зафиксировал проверенную связку vite 8.2.2 + vitest 5.0.0 и назвал её рабочей.
- **Actual:** На рабочей машине с Node 25.2.1 npm ставит vitest 4.1.11; vitest 5 отсекается по engines.
- **Why it matters:** Читатель RESEARCH ждёт vitest 5 в lockfile. Когда фаза 5 будет добавлять Playwright и покрытие, версия vitest окажется 4.x, а её API немного отличается (например, дефолты `pool` и репортеров).

**2. Заглушки секций пустые, без текста**
- **Found during:** Task 2
- **Planned:** CONTEXT.md описывал заглушку как `Section` с заголовком и `min-height: 40vh`.
- **Actual:** План 01-01 переопределил заглушки на пустые `<section id="…" />` без русского текста, а тела и примитивы отдал плану 01-02.
- **Why it matters:** После этого плана страница на живом URL визуально пустая: только фон midnight-950. Наполнение появится после 01-02, 01-03 и 01-04.

## Known Stubs

| Файл | Что заглушено | Кто закрывает |
|---|---|---|
| `src/components/layout/Header.tsx` | пустой `<header />` | план 01-03 |
| `src/components/layout/Footer.tsx` | пустой `<footer />` | план 01-04 |
| `src/components/hero/Hero.tsx` | пустой `<section id="hero" />` | план 01-02, затем фаза 2 |
| `src/components/map/MapSection.tsx` | пустой `<section id="map" />` | план 01-02, затем фаза 2 |
| `src/components/form/LightForm.tsx` | пустой `<section id="light-form" />` | план 01-02, затем фаза 2 |
| `src/components/about/About.tsx` | пустой `<section id="about" />` | план 01-02, затем фаза 3 |
| `src/components/involve/Involve.tsx` | пустой `<section id="involve" />` | план 01-02, затем фаза 3 |
| `src/components/news/News.tsx` | пустой `<section id="news" />` | план 01-02, затем фаза 3 |
| `src/components/resources/Resources.tsx` | пустой `<section id="resources" />` | план 01-02, затем фаза 4 |
| `src/components/quote/Quote.tsx` | пустой `<section id="quote" />` | план 01-02, затем фаза 4 |

Заглушки предусмотрены планом: они фиксируют композицию `App.tsx` и якоря секций, чтобы планы волны 2 шли параллельно и не редактировали общий файл.

## Issues Encountered

- `timeout` в macOS отсутствует, поэтому ожидание прогона сделано через `gh run watch --exit-status` без обёртки. Прогон занял 34 секунды, зависания не было.
- `.planning/ROADMAP.md` изменён оркестратором во время выполнения (разметка волн). Файл не тронут и не закоммичен этим планом.

## User Setup Required

Нет: внешних сервисов и секретов план не требует, Pages уже включён с `build_type: workflow`.

## Next Phase Readiness

- Планы 01-02, 01-03 и 01-04 могут стартовать параллельно: контракты `copy`, `sectionIds`, `Wordmark`, токены и утилиты на месте, `App.tsx` больше не редактируется.
- План 01-05 получит зелёный workflow и живой URL, ему остаётся финальный прогон и браузерный smoke.
- Открытый вопрос для фазы 5: если понадобится vitest 5, обновлять его придётся вместе с Node (нужен 24.x или 26+).

---
*Phase: 01-scaffold-and-deploy*
*Completed: 2026-09-05*
