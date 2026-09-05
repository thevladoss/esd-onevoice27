# Project Research Summary

**Project:** Единый голос 27 — лендинг Евро-Азиатского дивизиона (редизайн)
**Domain:** одностраничный лендинг-кампания с картой участия, формой присоединения и мок-данными
**Researched:** 2026-09-05
**Confidence:** MEDIUM-HIGH (структура и контент подтверждены исследованием оригинала; совместимость Vite 8 с плагинами проверяется в фазе 1)

## Executive Summary

Оригинал onevoice27.org — Next.js-сайт на Hope Software CMS с Tailwind, Radix и Mapbox, где весь визуальный эффект достигается CSS-keyframes, CSS-переменными и одним canvas. Нам нужен статический прототип с тем же визуальным языком, но с русским контентом ЕАД и без внешних сервисов. Выбранный стек: Vite + React 19 + TypeScript, Tailwind v4, `motion` для reveal-анимаций, d3-geo + world-atlas для собственной SVG-карты, canvas-глобус, Vitest + Testing Library, GitHub Pages через Actions. Главная техническая сложность одна: карта дивизиона (антимеридиан, производительность огоньков, зум). Всё остальное — аккуратная вёрстка по токенам оригинала.

## Key Findings

### Recommended Stack

Vite 8.2 (откат на 7 при несовместимости), React 19.2, TypeScript 5, Tailwind 4.3 через `@tailwindcss/vite` с `@theme`-токенами, `motion` 13 (`motion/react`), d3-geo 3 / d3-zoom 3 / topojson-client 3 / world-atlas 2 (110m), Vitest 5 + jsdom + Testing Library, шрифты Onest (заголовки) и Noto Sans (текст) с Google Fonts.

**Core technologies:**
- Vite + React + TS: статический билд, `base: "/esd-onevoice27/"`.
- Tailwind v4: токены палитры оригинала (midnight, unity, signal, horizon) в `@theme`.
- d3-geo SVG-карта: без токенов, полный контроль над стилем.
- motion + CSS keyframes: reveal и фоновые петли как в оригинале.

### Expected Features

**Must have (table stakes):** header-пилюля с якорями и бургером; hero с H1, подзаголовком и CTA; карта дивизиона с огоньками и счётчиками; форма с валидацией и видимым результатом; секция «Что такое» с тремя карточками; триптих участия; новости с пагинацией; ресурсы с панелями; цитата; footer; адаптив 390–1440; reduced motion; без ошибок консоли.

**Should have (competitive):** canvas-глобус в hero; вращающийся луч по границе CTA (`@property` + conic-gradient); скошенные края карты; count-up счётчиков; пульсирующие огоньки; чипы стран с плавным зумом; дрейфующие частицы в ресурсах и волны в футере; stagger-появление карточек.

**Defer (v2+):** реальная отправка формы, CMS, многоязычность, тайловая карта, пиксель-перфект.

### Architecture Approach

Один контекст `LightsProvider` для огоньков и счётчиков; d3 считает геометрию, React рендерит SVG; d3-zoom привязан через `useRef`/`useEffect`, transform в состоянии; canvas-глобус с управляемым rAF-циклом; все тексты и моки в `src/data/`, чистая логика в `src/lib/`.

**Major components:**
1. `Header`, `Footer`, примитивы `Section`/`Eyebrow`/`GradientTitle`/`Button`/`GlassCard`.
2. `Hero` + `GlobeCanvas` + `Starfield`.
3. `MapSection` + `EsdMap` + `Counters` + `CountryChips` + `LightsProvider`.
4. `LightForm`, `About` (+`VideoEmbed`, `StepCard`), `Involve`.
5. `News`, `Resources` (+`ResourcePanel`), `Quote`.

### Critical Pitfalls

1. Антимеридиан: `geoMercator().rotate([-90,0])` + `fitExtent` по странам ЕАД, тест на попадание 12 центров.
2. Base path на Pages: `base` в Vite, проверка итогового URL.
3. Tailwind v4 без `tailwind.config.js`: `@import "tailwindcss"` + `@theme`.
4. jsdom без IntersectionObserver/ResizeObserver/canvas: моки в `test/setup.ts`.
5. Производительность огоньков: анимировать ≤40, без `filter` на каждом.
6. Права deploy-pages: `pages: write`, `id-token: write`.

## Implications for Roadmap

Пять фаз (coarse), каждая даёт видимый и протестированный срез.

### Phase 1: Каркас и деплой
**Rationale:** пайплайн и токены нужны всем остальным фазам; ранний деплой снимает риск base path и прав Pages.
**Delivers:** Vite/Tailwind/Vitest настроены, токены и шрифты, Header/Footer, пустые секции с якорями, CI, страница живёт на Pages.
**Addresses:** header, footer, адаптивная база, CI.
**Avoids:** base path, Tailwind v4, jsdom-моки, права деплоя.

### Phase 2: Hero и карта
**Rationale:** самая сложная и самая заметная часть; Core Value.
**Delivers:** GlobeCanvas, градиентный H1, CTA с лучом, EsdMap с огоньками, счётчики, чипы стран, контекст огоньков.
**Uses:** d3-geo, d3-zoom, world-atlas, canvas.
**Implements:** `LightsProvider`, `EsdMap`, `Counters`, `CountryChips`, `GlobeCanvas`.

### Phase 3: Форма, О проекте, Участие
**Rationale:** форма замыкает конверсионный сценарий через контекст фазы 2; About/Involve используют готовые примитивы.
**Delivers:** LightForm с валидацией и тостом, About с видео и карточками 1/2/3, триптих Involve.

### Phase 4: Новости, Ресурсы, Цитата
**Rationale:** контентные секции без зависимостей, параллелятся.
**Delivers:** News с пагинацией, Resources с панелями (материалы, 16 видео, музыка), Quote.

### Phase 5: Полировка и финальный прогон
**Rationale:** анимации появления, мобильная вёрстка и a11y лучше делать по готовой странице целиком.
**Delivers:** reveal-анимации, reduced motion, мобильный аудит 390px, производительность, Playwright smoke, финальный деплой.

### Phase Ordering Rationale

Инфраструктура → самый рискованный компонент → конверсия → контент → полировка. Фазы 3 и 4 независимы после фазы 2.

### Research Flags

- Фаза 1: подтвердить совместимость Vite 8 с `@tailwindcss/vite` и Vitest 5, иначе Vite 7.
- Фаза 2: проекция и производительность огоньков проверяются на реальном билде.

## Confidence Assessment

| Область | Уверенность | Причина |
|---|---|---|
| Структура и контент | HIGH | снапшоты и CSS оригинала в `docs/research/` |
| Стек | MEDIUM | версии проверены, совместимость Vite 8 нет |
| Архитектура | HIGH | стандартные паттерны d3 + React |
| Производительность | MEDIUM | нужен замер на устройстве |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

- Совместимость Vite 8 (фаза 1).
- FPS карты на мобильном (фаза 5).

## Sources

### Primary (HIGH confidence)
- `docs/research/orig-custom-styles.css`, `orig-snapshot.md`, `esd-snapshot.md`, скриншоты.
- `.planning/research/FEATURES.md` (полное исследование фич).

### Secondary (MEDIUM confidence)
- `npm view` версий (2026-09-05); документация Tailwind v4, motion, d3-geo по памяти.

### Tertiary (LOW confidence)
- Нет.
