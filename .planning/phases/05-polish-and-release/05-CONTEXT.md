# Phase 5: Полировка и финальный прогон - Context

**Gathered:** 2026-09-05
**Status:** Ready for planning
**Mode:** Smart discuss (autonomous), рекомендованные ответы приняты автоматически, пользователь недоступен

<domain>
## Phase Boundary

Фаза доводит собранную страницу до релиза: reveal-анимации секций через `motion`, аудит фоновых анимаций и `prefers-reduced-motion`, адаптив 390/768/1024/1440, доступность (фокус, aria, skip-link), чистая консоль, недостающие component-тесты, Playwright smoke по собранному билду на 1440 и 390 со скриншотами, финальный деплой и проверка прод-URL. Новых секций не добавляет.

Требования: MOTION-01, MOTION-02, MOTION-03, MOTION-04, QA-02, QA-04.

</domain>

<decisions>
## Implementation Decisions

### Reveal-анимации (MOTION-01)
- Компонент `Reveal` в `components/layout/Reveal.tsx` на `motion/react`: `motion.div` с `initial={{ opacity: 0, y: 24 }}`, `whileInView={{ opacity: 1, y: 0 }}`, `viewport={{ once: true, amount: 0.2, margin: "0px 0px -10% 0px" }}`, `transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay }}`; пропсы `delay`, `as`, `className`. Для сеток карточек — `RevealGroup` с `staggerChildren: 0.08` через `variants`, дочерние `RevealItem`.
- Оборачиваются: заголовочные блоки каждой секции (eyebrow+title+text), карточки 1/2/3, триптих, карточки новостей, карточки ресурсов, форма, счётчики, цитата. Hero не анимируется reveal (виден сразу), только внутренний fade текста 0.6s при монтировании.
- `useReducedMotion()`: при `true` `Reveal` рендерит детей без motion-обёртки (opacity 1), stagger отключён. Тест `Reveal.test.tsx` с мок `matchMedia` для `prefers-reduced-motion: reduce` проверяет, что контент виден сразу.

### Фоновые анимации и reduced motion (MOTION-02)
- Единый блок `@media (prefers-reduced-motion: reduce)` в `global.css` отключает `beam`, `light-pulse`, `resources-particles`, `footer-wave-drift`, `footer-halo-drift`, дрейф звёзд (`animation: none`), а `GlobeCanvas` уже рисует статичный кадр. Проверка Playwright с `emulateMedia({ reducedMotion: "reduce" })`: секции видны, контент не смещён.
- Аудит производительности: `backdrop-filter` только у header, счётчиков и карточек внутри вьюпорта; у карточек новостей и материалов вместо blur полупрозрачный фон; `will-change: transform` только на пульсирующих огоньках; проверка DevTools-подобная через Playwright `page.evaluate` FPS-сэмпл при скролле (ориентир ≥ 45 fps на десктопе, информативно).

### Адаптив и доступность (MOTION-03)
- Чеклист ширин 390, 768, 1024, 1440: нет горизонтального скролла (`document.documentElement.scrollWidth <= innerWidth`), header не перекрывает заголовки (scroll-padding-top), карта и счётчики читаемы на 390 (счётчики над картой), сетка ресурсов стекуется, форма в одну колонку, футер стеком.
- Доступность: skip-link «К содержанию» первым элементом (`sr-only focus:not-sr-only`); `main` с `id="content"`; `focus-visible` кольцо `outline: 2px solid #7bc2c7; outline-offset: 3px` глобально; все иконочные кнопки с `aria-label`; секции с `aria-labelledby` на свои H2; цветовой контраст текста на стекле ≥ 4.5:1 (paper на midnight), для paper/.8 на карточках проверить и при необходимости поднять до .86.
- Плавный скролл к якорям учитывает reduced motion (`behavior: "auto"`).

### Чистая консоль и билд (MOTION-04)
- `npm run build` без предупреждений о размере чанков выше 700 КБ (world-atlas и d3 в отдельном чанке через `build.rollupOptions.output.manualChunks` или динамический импорт `EsdMap`); никаких `console.*` в продакшн-коде; проверка Playwright: 0 ошибок консоли, 0 запросов с 404 на `vite preview` и на прод-URL.
- `README.md` дополняется разделом «Проверка» (команды тестов, билд, smoke).

### Тесты (QA-02)
- Добавить недостающие component-тесты: `Header.test.tsx` (навигация: 4 якоря, бургер, Esc, фокус возвращается), `CountryChips.test.tsx` (если не покрыто в фазе 2), `Resources.test.tsx` (панели), `LightForm.test.tsx` (если не покрыто в фазе 3); `App.test.tsx` — все 8 секций и skip-link. Цель: `vitest run` зелёный, без `act` предупреждений.

### Финальный smoke и деплой (QA-04)
- Скрипт `scripts/smoke.md` (инструкция) и прогон через Playwright MCP по `vite preview --port 4173` и по `https://thevladoss.github.io/esd-onevoice27/`: на 1440×900 и 390×844 проверить наличие секций `#hero #map #light-form #about #involve #news #resources #quote`, header и footer, отсутствие ошибок консоли, скриншоты `docs/qa/final-desktop.jpeg`, `docs/qa/final-mobile.jpeg`, `docs/qa/final-full.jpeg`; результаты записать в `docs/qa/SMOKE.md`.
- Деплой: пуш в `main`, `gh run watch` до зелёного, `curl -I` прод-URL 200, сравнение заголовка страницы и числа секций между preview и прод.

### Claude's Discretion
- Точные значения `amount`/`margin` для reveal на мобильном, набор скриншотов сверх обязательных, способ разбиения чанков.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- Все компоненты фаз 1–4, `motion` уже в зависимостях (STACK.md), тестовый setup с моками, GitHub Actions workflow.
- `docs/research/*.jpeg` для визуального сравнения с оригиналом.

### Established Patterns
- Компонент = папка, тесты рядом, тексты в `data/`, токены в `@theme`, reduced motion уважается везде.

### Integration Points
- `Reveal` оборачивает существующие блоки внутри секций без изменения их API; `main.tsx` добавляет skip-link; `global.css` получает единый reduced-motion блок; `vite.config.ts` — manualChunks.

</code_context>

<specifics>
## Specific Ideas

- Финальный вид сравнить бок о бок с `docs/research/orig-full.jpeg`: тот же ритм секций, скосы, стекло, градиенты.
- Smoke-скриншоты сохранить в репозиторий как артефакт приёмки.

</specifics>

<deferred>
## Deferred Ideas

- Lighthouse-аудит и OG-превью картинкой — после приёмки прототипа.
- Параллакс триптиха, автоцентрирование карты, кнопки зума — v2.

</deferred>
