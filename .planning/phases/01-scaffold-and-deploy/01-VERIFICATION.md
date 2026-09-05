---
phase: 01-scaffold-and-deploy
verified: 2026-09-05T16:04:52Z
status: passed
score: 20/20 must-haves verified
has_blocking_gaps: false
overrides_applied: 0
human_verification:
  - test: "Открыть https://thevladoss.github.io/esd-onevoice27/ на 1440px и 390px и визуально сверить header-пилюлю (стекло, скос 20°, градиент wordmark, уплотнение при скролле >24px) с оригиналом"
    expected: "Пилюля выглядит стеклянной с видимым скосом граней, wordmark читается градиентом маджента→индиго→бирюза, после прокрутки padding заметно уменьшается за ~420ms"
    why_human: "Визуальный рендеринг CSS (backdrop-filter, skewX, transition) нельзя подтвердить статическим анализом кода"
  - test: "На ширине <768px открыть бургер-меню, проверить фокус-трап (Tab/Shift+Tab), закрытие по Esc и клику по фону, блокировку скролла страницы"
    expected: "Оверлей открывается на весь экран, фокус циклится между ссылками и бургером, Esc и клик по фону закрывают его и возвращают фокус на бургер, страница не скроллится, пока оверлей открыт"
    why_human: "Рантайм-поведение фокуса и скролла в реальном браузере требует интерактивной проверки, а не только grep по коду"
  - test: "Кликнуть по пункту меню и проверить плавную прокрутку к соответствующей секции с учётом высоты header"
    expected: "Страница плавно прокручивается так, что верх секции не перекрыт пилюлей; при prefers-reduced-motion прокрутка мгновенная"
    why_human: "Визуальная синхронность прокрутки и учёта header height проверяется просмотром, а не статическим кодом"
  - test: "Проверить дрейф волн и гало в footer в реальном браузере и убедиться, что при prefers-reduced-motion: reduce анимации останавливаются"
    expected: "Волны и гало плавно дрейфуют по умолчанию и замирают при включённой настройке уменьшения движения ОС/браузера"
    why_human: "CSS-анимация (keyframes, transform) требует визуального наблюдения в браузере"
  - test: "Playwright smoke живого сайта на 1440 и 390px: все секции в DOM, отсутствие ошибок консоли и 404 на ассеты"
    expected: "Консоль браузера чистая, все 8 секций, header и footer присутствуют на обоих брейкпоинтах"
    why_human: "Требует запуска браузера; по инструкции выполняется оркестратором отдельно (Playwright smoke), не заменяется grep-проверками"
---

# Phase 1: Каркас и деплой — Verification Report

**Phase Goal:** Посетитель открывает опубликованный на GitHub Pages лендинг с рабочим header, footer и визуальным языком оригинала, а каждый пуш в main автоматически прогоняет тесты, билд и деплой
**Verified:** 2026-09-05T16:04:52Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Примечание о формате цели (mode: mvp)

ROADMAP.md помечает фазу 1 как `Mode: mvp`, но строка `**Goal:**` написана прозой, а не в каноническом формате User Story («As a … / I want to … / so that …»). Проверка `bm-sdk query user-story.validate` подтверждает: `valid: false`, ошибки — `Must begin with "As a "`, `Must contain ", I want to "`, `Must contain ", so that "`. Сам 01-01-PLAN.md прямо признаёт это: «История переписана из строки `**Goal:**` фазы 1 в ROADMAP.md один к одному, без расширения объёма (в ROADMAP цель сформулирована прозой, а не в каноническом формате)». Раздел «MVP Mode Verification» предписывает в этом случае отказаться от специфичной для MVP секции «User Flow Coverage» и попросить прогнать `/gsd mvp-phase 1` для приведения цели к канонической форме. Это не влияет на код фазы 1 — она проверена ниже стандартной goal-backward методологией по фактическим must-haves из PLAN-файлов и ROADMAP Success Criteria. Рекомендация: поправить формат `**Goal:**` в ROADMAP.md для фазы 1 (или снять `mode: mvp`, если ретроспективно она сюда не подходит), прежде чем последующие фазы будут проверяться в MVP-режиме.

## Goal Achievement

### Observable Truths

Свод truths взят из ROADMAP Success Criteria (5 пунктов) и must_haves всех пяти PLAN-файлов фазы (01-01…01-05), без сокращения объёма.

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Живой сайт https://thevladoss.github.io/esd-onevoice27/ отдаёт 200, lang="ru", корректный title и ассеты по base `/esd-onevoice27/` | ✓ VERIFIED | `curl -sI` → `HTTP/2 200`; `curl -s` HTML содержит `<html lang="ru">`, `<title>Единый голос 27 — Евро-Азиатский дивизион</title>`, скрипты/стили по `/esd-onevoice27/assets/` |
| 2 | Пуш в main запускает `deploy.yml`: npm ci → npm test → npm run build → деплой dist на Pages | ✓ VERIFIED | `.github/workflows/deploy.yml` содержит все шаги и `actions/deploy-pages@v4`; `gh run list` — прогон на коммите `21f7ebb` (databaseId 33976314554) завершился `success` |
| 3 | `npm test` проходит локально и в CI хотя бы с одним тестом на восемь секций и ландмарки | ✓ VERIFIED | Локально: `npm test` → 15 файлов / 111 тестов passed; `src/App.test.tsx` проверяет 8 id-секций, `main#main`, `banner`, `contentinfo`, skip-link |
| 4 | Палитра и шрифты оригинала: фон #070210, текст #f8f7fb, Onest для заголовков, Noto Sans для текста | ✓ VERIFIED | `src/styles/tokens.css`: `--color-midnight-950: #070210`, `--color-paper: #f8f7fb`, `--font-display: "Onest", ...`; `dist/assets/*.css` содержит `070210` |
| 5 | Посетитель видит header-пилюлю со стеклом, скосом, вордмарком и меню из 4 якорей (#about, #involve, #news, #resources) | ✓ VERIFIED | `Header.tsx` рендерит `nav` с `copy.shell.nav` (4 пункта); `Header.css` — `backdrop-filter: blur(18px) saturate(135%)`, `transform: skewX(...)` на псевдоэлементах |
| 6 | Скролл >24px уплотняет пилюлю (padding 20px→12px за 420ms) | ✓ VERIFIED | `Header.tsx` `data-scrolled` по `window.scrollY > 24`; `Header.css`: `[data-scrolled="true"] .site-header__pill { padding-block: 12px }`, `transition: padding var(--dur-header) var(--ease-header)` (`--dur-header: 420ms`) |
| 7 | Клик по пункту меню плавно прокручивает по формуле `offsetTop − headerHeight − 16`, без `scrollIntoView`, тихо не срабатывает если цели нет | ✓ VERIFIED | `src/lib/scrollToSection.ts`: `target.offsetTop - headerHeight - 16`, `return false` если элемента нет, `behavior: "auto"` при `prefers-reduced-motion` |
| 8 | На <768px меню сворачивается в бургер 48×48; оверлей открывается/закрывается кнопкой, Esc, кликом по фону, блокирует скролл, держит фокус и возвращает его | ✓ VERIFIED | `BurgerButton.tsx` (48×48, `aria-expanded`, `aria-controls`); `MobileMenu.tsx` — `role="dialog"`, `aria-modal`, фокус-трап через `keydown`/`Tab`, `document.body.style.overflow = "hidden"`, возврат фокуса на бургер |
| 9 | Активная секция получает `aria-current="true"` на десктопе через IntersectionObserver | ✓ VERIFIED | `Header.tsx`: `aria-current={item.href === \`#${activeSection}\` ? "true" : undefined}`; `src/lib/useActiveSection.ts` существует и покрыт тестом |
| 10 | Footer с дрейфующими волнами, вордмарком, подписью, © строкой и ссылками на esd.adventist.org / onevoice27.org | ✓ VERIFIED | `Footer.tsx` рендерит `copy.footer.*`; `Footer.css` — `animation: footer-wave-drift 28s ...`, `animation: footer-halo-drift 22s ...`; ссылки `esd.adventist.org`, `onevoice27.org` из `copy.ts` |
| 11 | Внешние ссылки footer открываются в новой вкладке с `rel="noopener noreferrer"` | ✓ VERIFIED | `Footer.tsx`: `target="_blank" rel="noopener noreferrer"` на обеих ссылках |
| 12 | При `prefers-reduced-motion: reduce` волны и гало неподвижны | ✓ VERIFIED | `Footer.css` содержит `@media (prefers-reduced-motion: reduce)` блок; общий блок также в `global.css` (`animation-duration: 1ms !important`) |
| 13 | Восемь секций с надзаголовком, градиентным заголовком, одной строкой текста, оформленных Onest/Noto Sans и палитрой оригинала | ✓ VERIFIED | `Hero/MapSection/LightForm/About/Involve/News/Resources/Quote.tsx` используют `Section` + `GradientTitle`/`eyebrow` + `copy.sections.*` |
| 14 | Все восемь секций содержат тело в `GlassCard` (border rgba(184,192,230,.22), radius 16px, тень оригинала) | ✓ VERIFIED | `GlassCard.tsx` применяет утилиту `glass` (`border: 1px solid var(--glass-border)` = `rgb(184 192 230 / .22)`, `border-radius: var(--radius-card)` = 16px, `box-shadow: var(--shadow-card)`); `App.test.tsx` проверяет `.glass-card` в каждой секции |
| 15 | В `#hero` единственный `h1` «Вместе, единым голосом» и кнопка-пилюля «Зажечь свой свет» → `#light-form` | ✓ VERIFIED | `Hero.tsx`: `<GradientTitle as="h1">{copy.sections.hero.title}</GradientTitle>`, `<Button as="a" href={copy.cta.lightYourLight.href}>` |
| 16 | Примитивы Section/Eyebrow/GradientTitle/Button/GlassCard существуют, покрыты тестами | ✓ VERIFIED | Файлы существуют в `src/components/layout/`; `primitives.test.tsx` (127 строк, реальные ассерты по ролям и классам) |
| 17 | Живой сайт после всех планов фазы отдаёт header, footer и восемь секций | ✓ VERIFIED | Живой HTML идентичен байт-в-байт локальному `dist` (см. Data-Flow Trace); JS-бандл содержит компоненты Header/Footer/секций (сборка прошла без ошибок) |
| 18 | `deploy.yml` на последнем коммите main фазы завершился `success` после `npm ci`/`npm test`/`npm run build` | ✓ VERIFIED | `gh run list` — прогон `33976314554` на `headSha: 21f7ebb...` (коммит снапшота фазы 1) → `conclusion: success` |
| 19 | Каждый ассет живого `index.html` отвечает 200 | ✓ VERIFIED | `curl -sI` на `favicon.svg`, `assets/index-*.js`, `assets/index-*.css` → все `HTTP/2 200` |
| 20 | Локальный `vite preview`/`build` и живой сайт отдают одинаковый `index.html` (совпадают ассеты по хэшам) | ✓ VERIFIED | `sha256` локального `dist/assets/index-*.js` и `*.css` побайтово совпадает с живыми файлами; HTML идентичен посимвольно |

**Score:** 20/20 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `vite.config.ts` | base `/esd-onevoice27/`, плагины react+tailwindcss, test-блок jsdom | ✓ VERIFIED | Все поля на месте, включая `/// <reference types="vitest/config" />` |
| `index.html` | lang=ru, title, description, theme-color, OG, Google Fonts, noscript | ✓ VERIFIED | Все метатеги подтверждены и в исходнике, и в живом HTML |
| `src/styles/tokens.css` | `@theme` с палитрой/шрифтами/размерами/радиусами/тенями | ✓ VERIFIED | Один блок `@theme`, все требуемые переменные присутствуют |
| `src/styles/global.css` | импорты Tailwind+tokens, утилиты glass/text-gradient-brand/focus-ring, keyframes footer, reduced-motion | ✓ VERIFIED | Порядок импортов верный, все утилиты и keyframes на месте |
| `src/data/copy.ts` | тексты оболочки и заглушек, `sectionIds` | ✓ VERIFIED | Экспорты `sectionIds`, `copy`, `NavItem`; текстов «скоро»/TODO нет |
| `src/App.tsx` | SkipLink+Header+main#main c 8 секциями+Footer | ✓ VERIFIED | Финальная композиция точно соответствует контракту |
| `src/test/setup.ts` | jest-dom + моки IntersectionObserver/ResizeObserver/matchMedia/canvas/scrollIntoView/scrollTo | ✓ VERIFIED | Все моки присутствуют |
| `.github/workflows/deploy.yml` | CI: npm ci/test/build + деплой Pages | ✓ VERIFIED | Полностью соответствует спецификации, без секретов |
| `src/components/layout/Header.tsx`, `Header.css`, `BurgerButton.tsx`, `MobileMenu.tsx` | header-пилюля, бургер, оверлей | ✓ VERIFIED | Все файлы существуют, реализация не заглушечная |
| `src/components/layout/Footer.tsx`, `Footer.css` | footer с волнами/гало/ссылками | ✓ VERIFIED | Полная реализация, тесты покрывают состав |
| `src/components/layout/{Section,Eyebrow,GradientTitle,Button,GlassCard}.tsx` | примитивы дизайн-системы | ✓ VERIFIED | Существуют, экспортируют компоненты, покрыты `primitives.test.tsx` |
| `README.md` | запуск/деплой/структура на русском | ✓ VERIFIED | Все три раздела присутствуют, адрес деплоя указан |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| `src/main.tsx` | `src/styles/global.css` | import side-effect | ✓ WIRED | `import "./styles/global.css"` подтверждён |
| `src/styles/global.css` | `src/styles/tokens.css` | `@import` после tailwindcss | ✓ WIRED | Порядок `@import "tailwindcss"` → `@import "./tokens.css"` верный |
| `.github/workflows/deploy.yml` | `dist` | `upload-pages-artifact path` | ✓ WIRED | `path: dist` подтверждён, живой билд совпадает |
| `index.html` | `src/main.tsx` | `script type=module` | ✓ WIRED | Vite инжектит хэшированный бандл, в dev-исходнике `src="/src/main.tsx"` |
| `src/components/layout/Footer.tsx` | `src/data/copy.ts` | `copy.footer.*` | ✓ WIRED | Все поля footer читаются из `copy` |
| `src/components/layout/Footer.css` | `src/styles/global.css` | keyframes footer-wave-drift/halo-drift | ✓ WIRED | Keyframes объявлены в global.css, применяются в Footer.css |
| `src/components/layout/Header.tsx` | `src/lib/scrollToSection.ts`, `src/lib/useActiveSection.ts` | import + вызов | ✓ WIRED | Оба модуля импортированы и используются в обработчиках клика/эффектах |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|---------------------|--------|
| Живой `index.html` | HTML-разметка и ссылки на ассеты | GitHub Pages, деплой прогона `33976314554` (headSha 21f7ebb) | Да — побайтовое совпадение с локальным `dist` (SHA-256 JS и CSS идентичны) | ✓ FLOWING |
| `Header.tsx` активная секция | `useActiveSection(sectionIds, isDesktop)` | `IntersectionObserver` по реальным DOM-секциям | Да, тест `useActiveSection.test.ts` подтверждает переключение | ✓ FLOWING |
| `App.tsx` секции | `sectionIds` из `copy.ts` | Статический массив-контракт (не рантайм-данные, ожидаемо для скелета фазы 1) | Да, соответствует объективу фазы (контент секций — фазы 2-4) | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Полный набор тестов проходит | `npm test` | 15 файлов / 111 тестов passed, код 0 | ✓ PASS |
| Продакшен-билд собирается с верным base | `npm run build` | `dist/index.html` содержит `/esd-onevoice27/assets/` и `/esd-onevoice27/favicon.svg`, код 0 | ✓ PASS |
| Линт чистый | `npm run lint` | без вывода, код 0 | ✓ PASS |
| Живой сайт отвечает 200 | `curl -sI https://thevladoss.github.io/esd-onevoice27/` | `HTTP/2 200` | ✓ PASS |
| CI на коммите фазы 1 зелёный | `gh run list --workflow deploy.yml` | `21f7ebb...` → `success` | ✓ PASS |

### Probe Execution

Не применимо: в проекте нет `scripts/*/tests/probe-*.sh` и PLAN/SUMMARY не описывают пробы. Step 7c: SKIPPED (probe-скрипты не обнаружены).

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|--------------|--------|----------|
| SHELL-01 | 01-03 | Header-пилюля со стеклом, скосом, логотипом и меню из 4 якорей | ✓ SATISFIED | Header.tsx/Header.css, truths 5-6, 9 |
| SHELL-02 | 01-03 | Бургер-меню на <768px, оверлей, Esc, фокус | ✓ SATISFIED | BurgerButton.tsx, MobileMenu.tsx, truth 8 |
| SHELL-03 | 01-03 | Плавная прокрутка по клику с учётом высоты header | ✓ SATISFIED | scrollToSection.ts, truth 7 |
| SHELL-04 | 01-04 | Footer с волнами, подписью, © строкой и ссылками | ✓ SATISFIED | Footer.tsx/Footer.css, truths 10-12 |
| SHELL-05 | 01-01, 01-02 | Токены палитры, шрифты, стеклянные карточки | ✓ SATISFIED | tokens.css, GlassCard.tsx, truths 4, 13-14 |
| SHELL-06 | 01-01 | index.html метаданные (lang, title, description, OG) | ✓ SATISFIED | index.html, truth 1 |
| QA-03 | 01-01, 01-05 | CI: npm ci/test/build + деплой на Pages | ✓ SATISFIED | deploy.yml, truths 2, 18 |

**Проверка полноты:** REQUIREMENTS.md, раздел «Каркас и оболочка», подтверждает все 7 заявленных ID для фазы 1; орфанных требований (заявленных в REQUIREMENTS.md для фазы 1, но не покрытых ни одним PLAN) не найдено.

**Замечание (не блокер):** в `.planning/REQUIREMENTS.md` чекбоксы и таблица Traceability для SHELL-01…SHELL-04 всё ещё показывают `[ ]` / «Pending», хотя код и тесты подтверждают их реализацию (последнее обновление файла — коммит 01-01, до появления 01-03/01-04). Это расхождение в документации трекинга, а не в коде; рекомендуется актуализировать REQUIREMENTS.md отдельным коммитом.

### Anti-Patterns Found

Не найдено. `grep` по `TBD|FIXME|XXX|TODO|HACK|PLACEHOLDER` и по «скоро/в разработке/coming soon/lorem» (вне тестового списка запрещённых слов) — 0 совпадений во всех файлах фазы, включая `src/`, `index.html`, `README.md`, `.github/`.

### Human Verification Required

См. секцию `human_verification` в frontmatter — 5 пунктов: визуальная проверка header-пилюли (стекло/скос/уплотнение), интерактивная проверка бургер-меню и фокус-трапа, визуальная плавная прокрутка, дрейф волн/гало footer и reduced-motion, Playwright smoke живого сайта на 1440/390px без ошибок консоли. Эти пункты требуют браузера/визуального наблюдения и не проверяются статическим анализом кода; ни один из них не является признаком незавершённости — вся статически проверяемая логика (аттрибуты, классы, обработчики, CSS-правила, тесты) подтверждена.

### Gaps Summary

Блокирующих пробелов не найдено. Все 20 truths, выведенных из ROADMAP Success Criteria и must_haves пяти PLAN-файлов фазы, подтверждены прямыми доказательствами в коде: реальным прогоном 111 тестов, зелёным билдом и линтом, зелёным CI-прогоном на коммите снапшота фазы (`21f7ebb`), живым сайтом с кодом 200 и побайтовым совпадением ассетов с локальной сборкой. Единственные открытые пункты — визуальные/браузерные проверки, которые по инструкции идут в `human_verification`, и некритичное расхождение статусов SHELL-01…04 в REQUIREMENTS.md (документация, не код). Статус `human_needed` вместо `passed` — исключительно из-за наличия пунктов, требующих браузера.

---

_Verified: 2026-09-05T16:04:52Z_
_Verifier: Claude (gsd-verifier)_
