# Phase 1: Каркас и деплой - Context

**Gathered:** 2026-09-05
**Status:** Ready for planning
**Mode:** Smart discuss (autonomous), рекомендованные ответы приняты автоматически, пользователь недоступен

<domain>
## Phase Boundary

Фаза даёт опубликованный на GitHub Pages каркас лендинга: проект Vite + React + TypeScript + Tailwind v4 с токенами палитры оригинала и шрифтами Onest/Noto Sans, плавающий header-пилюля с якорным меню и бургером, footer с дрейфующими волнами, пустые секции-заглушки с id (`hero`, `map`, `light-form`, `about`, `involve`, `news`, `resources`, `quote`) для якорей, дизайн-примитивы (`Section`, `Eyebrow`, `GradientTitle`, `Button`, `GlassCard`), Vitest с jsdom-моками и первыми тестами, GitHub Actions workflow с тестами, билдом и деплоем на `https://thevladoss.github.io/esd-onevoice27/`. Контент секций делают фазы 2–4.

Требования: SHELL-01, SHELL-02, SHELL-03, SHELL-04, SHELL-05, SHELL-06, QA-03.

</domain>

<decisions>
## Implementation Decisions

### Header-пилюля
- `position: fixed`, отступ 16px от краёв (12px на мобильном), max-width 72rem по центру; стеклянный фон `backdrop-filter: blur(18px) saturate(135%)`, поверхность `rgb(7 2 16 / 0.77)`, border 1.5px `rgba(184,192,230,.22)`, radius 18px; скос 20° через `clip-path: polygon(...)` у внешней оболочки (как `--ov-header-angle` оригинала); при скролле больше 24px уплотняется: padding 20px → 12px, transition 420ms `cubic-bezier(0.32, 0.72, 0, 1)`.
- Логотип: текстовый wordmark «Единый голос 27» (Onest 900, градиент signal-300 → unity-500 → horizon-400 через `background-clip: text`) и подпись «МИССИЯ ДЛЯ ВСЕХ» (Noto Sans 700, 10px, letter-spacing 0.2em, paper/0.8). Логотип — ссылка на `#top`.
- Пункты меню: Onest 650, 16px, uppercase, letter-spacing 0.02em, цвет paper/0.9, hover horizon-200 с градиентным подчёркиванием (`::after`, transition 360ms); `aria-current="true"` у пункта активной секции (IntersectionObserver по секциям, только на десктопе).
- Мобильное меню (< 768px): кнопка-бургер 48×48 с тремя линиями 1.5px, `aria-expanded`, `aria-controls`; полноэкранный оверлей от верха с `backdrop-filter: blur(24px)` и градиентом midnight-950/0.98 → unity-950/0.97; закрытие кнопкой, Esc и кликом по фону; фокус-трап внутри оверлея, возврат фокуса на бургер; `document.body.style.overflow = "hidden"` пока открыт.
- Клик по пункту меню: `scrollIntoView` не использовать; считать `top = el.offsetTop - headerHeight - 16` и `window.scrollTo({ top, behavior: reducedMotion ? "auto" : "smooth" })`; после клика на мобильном закрывать оверлей.

### Footer
- Фон: `linear-gradient(180deg, #211a3e, #120c34)` плюс четыре слоя волн из `repeating-radial-gradient` разного размера и прозрачности, анимация `footer-wave-drift` 28s linear infinite alternate по `background-position`; гало `::before` radial-gradient signal-600/0.25, анимация `footer-halo-drift` 22s (translate3d + scale). Обе анимации выключаются в `@media (prefers-reduced-motion: reduce)`.
- Состав: wordmark «Единый голос 27» + «МИССИЯ ДЛЯ ВСЕХ», подпись «Официальный сайт Церкви христиан адвентистов седьмого дня», ссылки «Евро-Азиатский дивизион» → https://esd.adventist.org и «OneVoice27 (глобальный сайт)» → https://onevoice27.org с `target="_blank" rel="noopener noreferrer"`, строка «© 2026 Евро-Азиатский дивизион Церкви христиан-адвентистов седьмого дня».
- Раскладка: на десктопе две колонки (логотип и подпись слева, ссылки справа), на мобильном стек; юридическая строка внизу через разделитель paper/0.12.

### Дизайн-система
- Токены в `src/styles/tokens.css` внутри `@theme`: `--color-midnight-950: #070210`, `--color-midnight-900: #120c34`, `--color-midnight-800: #211a3e`, `--color-unity-700: #303f83`, `--color-unity-500: #3b4da1`, `--color-signal-600: #9e439a`, `--color-signal-400: #bb6cae`, `--color-signal-300: #d28ebe`, `--color-horizon-600: #54a4ac`, `--color-horizon-400: #7bc2c7`, `--color-horizon-200: #aad9dc`, `--color-paper: #f8f7fb`, `--font-display: "Onest", "Noto Sans", sans-serif`, `--font-body: "Noto Sans", sans-serif`, `--radius-card: 16px`, `--shadow-card: 0 30px 72px rgb(18 12 52 / .62), 0 10px 24px rgb(18 12 52 / .42), inset 0 1px 0 rgb(248 247 251 / .08)`.
- `src/styles/global.css`: `@import "tailwindcss"; @import "./tokens.css";` затем базовые стили (`html { scroll-padding-top: 96px }`, `body` с midnight-950 фоном, paper цветом, `font-body`), keyframes футера, утилиты `.glass` (фон `linear-gradient(145deg, rgb(48 63 131 / .86), rgb(18 12 52 / .76))`, border `rgba(184,192,230,.22)`, radius `--radius-card`, `--shadow-card`), `.text-gradient-brand`.
- Примитивы в `src/components/layout/`: `Section` (`id`, `eyebrow?`, `title?`, `children`, max-w 72rem, padding `py-16 md:py-24 px-4 md:px-8`), `Eyebrow` (uppercase, Noto Sans 700, letter-spacing 0.1em, horizon-200), `GradientTitle` (`as` h1/h2, варианты `hero` с градиентом оригинала и `section` с градиентом `104deg #e3afd2 2%, #8f9dd6 52%, #7bc2c7 98%`), `Button` (`variant: "primary" | "ghost"`, `as: "a" | "button"`; primary — пилюля radius 999px, градиент `125deg #6c2c68 0%, #3b4da1 50%, #39727e 100%`, тень `0 10px 30px rgb(59 77 161 / .34)`, Noto Sans 700 14px uppercase letter-spacing 0.08em, padding 16px 40px; луч по границе добавит фаза 2), `GlassCard`.
- Шрифты: в `index.html` `<link rel="preconnect" href="https://fonts.googleapis.com">`, `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>`, `<link href="https://fonts.googleapis.com/css2?family=Onest:wght@400;700;800;900&family=Noto+Sans:wght@400;700&display=swap" rel="stylesheet">`.
- Пустые секции: `App.tsx` рендерит `Header`, `main` и `Footer`; каждая секция живёт в своём файле-заглушке, который потом заменяет своя фаза без правок `App.tsx`: `components/hero/Hero.tsx` (`#hero`), `components/map/MapSection.tsx` (`#map`), `components/form/LightForm.tsx` (`#light-form`), `components/about/About.tsx` (`#about`), `components/involve/Involve.tsx` (`#involve`), `components/news/News.tsx` (`#news`), `components/resources/Resources.tsx` (`#resources`), `components/quote/Quote.tsx` (`#quote`). Заглушка = `Section` с заголовком («Карта дивизиона — скоро») и `min-height: 40vh`. `src/data/copy.ts` создаётся с eyebrow/title для всех секций, чтобы фазы 2–4 только дописывали свои ключи.
- `index.html`: `lang="ru"`, `<title>Единый голос 27 — Евро-Азиатский дивизион</title>`, `meta description` «Празднование 2000-летия крещения Иисуса и начала Его служения в сентябре 2027 года. Евро-Азиатский дивизион присоединяется к всемирному движению «Единый голос 27».», `theme-color #070210`, Open Graph `og:title`, `og:description`, `og:type=website`, `og:url=https://thevladoss.github.io/esd-onevoice27/`, `og:locale=ru_RU`.

### Проект и CI
- Скаффолд: `npm create vite@latest . -- --template react-ts` (Vite 8); зависимости по `.planning/research/STACK.md`; `vite.config.ts` с `base: "/esd-onevoice27/"`, плагинами `react()` и `tailwindcss()`, блоком `test: { environment: "jsdom", setupFiles: "./src/test/setup.ts", globals: true, css: false }`. Если `@tailwindcss/vite` 4.3 или Vitest 5 не заводятся с Vite 8 — откат на Vite 7.x, остальное без изменений, решение записать в SUMMARY.
- `src/test/setup.ts`: `@testing-library/jest-dom/vitest`, моки `IntersectionObserver`, `ResizeObserver`, `window.matchMedia`, `HTMLCanvasElement.prototype.getContext = () => null`, `Element.prototype.scrollIntoView`, `window.scrollTo`.
- Первые тесты: `Header.test.tsx` (четыре ссылки с href `#about`, `#involve`, `#news`, `#resources`; бургер переключает `aria-expanded`; Esc закрывает), `Footer.test.tsx` (подпись, © строка, две внешние ссылки с `rel="noopener noreferrer"`), `App.test.tsx` (восемь секций с ожидаемыми id).
- `package.json` scripts: `dev`, `build` (`tsc -b && vite build`), `preview`, `test` (`vitest run`), `test:watch`, `lint` (eslint из шаблона).
- `.github/workflows/deploy.yml`: `on: push: branches: [main]` и `workflow_dispatch`; `permissions: contents: read, pages: write, id-token: write`; `concurrency: group: pages, cancel-in-progress: true`; job `build`: checkout@v4, setup-node@v4 (node 22, cache npm), `npm ci`, `npm test`, `npm run build`, configure-pages@v5, upload-pages-artifact@v3 (`path: dist`); job `deploy`: `needs: build`, `environment: github-pages`, deploy-pages@v4.
- Проверка деплоя: после пуша дождаться `gh run watch`, затем `curl -I https://thevladoss.github.io/esd-onevoice27/` → 200 и открыть URL в Playwright: нет 404 на ассеты, консоль без ошибок, header и footer в DOM.
- `README.md` на русском: что это, как запустить, где деплой.

### Claude's Discretion
- Точные размеры отступов внутри пилюли, форма кривой скоса, тексты заголовков-заглушек, структура eslint-конфига.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- Кода нет. Есть исследование: `docs/research/orig-custom-styles.css` (87 КБ инлайн-CSS оригинала: header `--ov-header-*`, footer keyframes `ov-footer-wave-drift`/`ov-footer-halo-drift`, карточки), скриншоты `docs/research/orig-vp-*.jpeg`, снапшоты доступности.
- Спека `docs/superpowers/specs/2026-09-05-esd-onevoice27-redesign-design.md` и `.planning/research/*.md`.

### Established Patterns
- Не установлены; эта фаза задаёт их: токены в `@theme`, примитивы в `src/components/layout/`, тексты в `src/data/copy.ts`, тесты рядом с компонентами (`*.test.tsx`).

### Integration Points
- Репозиторий `thevladoss/esd-onevoice27` с remote `origin`, ветка `main`; GitHub Pages уже включён с `build_type: workflow`; `gh` авторизован.

</code_context>

<specifics>
## Specific Ideas

- Header и footer должны читаться как оригинал onevoice27.org: пилюля со скосом и стеклом, тёмный фиолетовый фон, волны в футере. Ориентир: `docs/research/orig-vp-0.jpeg` (header) и хвост `docs/research/orig-full.jpeg` (footer).
- Wordmark «Единый голос 27» повторяет логотип с esd.onevoice27.org (градиент маджента → бирюза), подпись «Миссия для всех».

</specifics>

<deferred>
## Deferred Ideas

- Луч по границе кнопки CTA — фаза 2 (HERO-03).
- Reveal-анимации при скролле — фаза 5 (MOTION-01).
- Активная подсветка пункта меню по секции остаётся простой (IntersectionObserver), без скролл-спай библиотек.

</deferred>
