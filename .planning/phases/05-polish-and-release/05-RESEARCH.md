# Phase 5: Полировка и финальный прогон - Research

**Researched:** 2026-09-05
**Confidence:** HIGH (проверено в песочнице с реальными пакетами)

## motion v13 (проверено)

- Пакет `motion@13.2.0`, импорт `import { motion, useReducedMotion, useInView, MotionConfig, AnimatePresence, LazyMotion, domAnimation } from "motion/react"` — все экспорты присутствуют.
- `whileInView` + `viewport={{ once: true, amount: 0.2 }}` работает на `motion.div`; в jsdom нужен мок `IntersectionObserver` (класс с `observe/unobserve/disconnect/takeRecords`).
- `useReducedMotion()` читает `matchMedia("(prefers-reduced-motion: reduce)")`; в тестах мок `window.matchMedia` с `matches: q.includes("reduce")` даёт `true`, компонент `Reveal` рендерит статичный контент. Тест из 1 проверки проходит за <1 с (Vitest 5, jsdom 29).
- Обёртка `<MotionConfig reducedMotion="user">` в `main.tsx` заставляет все анимации motion уважать системную настройку без ручных проверок в каждом компоненте; `useReducedMotion` всё равно пригодится для отключения stagger и canvas.
- Для уменьшения бандла можно использовать `LazyMotion features={domAnimation}` + `m.div` вместо `motion.div` (экономия ~15 КБ gzip); необязательно для прототипа.

## Reduced motion в CSS

Единый блок в `global.css`:

```css
@media (prefers-reduced-motion: reduce) {
  .beam::before, .light.pulse, .resources-particles::before, .resources-particles::after,
  .footer-waves, .footer-halo, .starfield { animation: none !important; }
  html { scroll-behavior: auto; }
}
```

Playwright проверка: `await page.emulateMedia({ reducedMotion: "reduce" })`, затем скриншот и проверка, что `getComputedStyle(el).animationName === "none"`.

## Smoke через Playwright MCP

- Собрать: `npm run build && npx vite preview --port 4173 --strictPort` (в фоне), открыть `http://localhost:4173/esd-onevoice27/`.
- Проверки: `page.locator("#hero, #map, #light-form, #about, #involve, #news, #resources, #quote").count() === 8`, `header` и `footer` в DOM, `page.on("console")` без `error`, `page.on("response")` без статусов ≥ 400, `document.documentElement.scrollWidth <= window.innerWidth` на 390 и 1440.
- Скриншоты: `docs/qa/final-desktop.jpeg` (1440×900 viewport), `docs/qa/final-mobile.jpeg` (390×844), `docs/qa/final-full.jpeg` (fullPage). Playwright MCP пишет файлы в cwd проекта; переносить в `docs/qa/`.
- Прод: те же проверки на `https://thevladoss.github.io/esd-onevoice27/` после `gh run watch`.

## Размер бандла

Ориентиры gzip: react + react-dom ≈ 60 КБ, motion ≈ 35 КБ, d3-geo/zoom/selection/transition ≈ 30 КБ, world-atlas 110m ≈ 40 КБ. Итого ≈ 170 КБ gzip — предупреждение Vite (500 КБ raw) может сработать; вынести карту через `React.lazy(() => import("./components/map/EsdMap"))` с `Suspense` и заглушкой той же высоты, либо `build.rollupOptions.output.manualChunks: { geo: ["d3-geo", "d3-zoom", "d3-selection", "d3-transition", "topojson-client", "world-atlas/countries-110m.json"] }`.
