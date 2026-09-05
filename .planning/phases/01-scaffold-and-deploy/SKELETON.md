# Walking Skeleton — Единый голос 27 (лендинг ЕАД)

**Phase:** 1
**Generated:** 2026-09-05

## Capability Proven End-to-End

Посетитель открывает https://thevladoss.github.io/esd-onevoice27/, видит стеклянный header-пилюлю с меню из четырёх якорей и footer с волнами, кликает по пункту меню и плавно попадает к нужной секции; на телефоне открывает и закрывает бургер-меню. Каждый пуш в `main` проходит `npm ci`, `npm test`, `npm run build` и публикуется на GitHub Pages.

## Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Framework | Vite 8.2 + React 19.2 + TypeScript 5.9 (`react-ts` шаблон create-vite 9.2 с `--eslint`) | Статический билд под GitHub Pages, быстрый HMR; TS 7 ещё не проверен с шаблоном, поэтому закреплён 5.9 |
| Styling | Tailwind CSS 4.3 через `@tailwindcss/vite`, токены в `src/styles/tokens.css` внутри `@theme`, глобальные переменные и утилиты в `src/styles/global.css`, стили компонентов в co-located `*.css` | Оригинал на Tailwind; v4 конфигурируется в CSS без `tailwind.config.js`; токены палитры оригинала перенесены 1:1 |
| Data layer | Нет базы и сети. Тексты в `src/data/copy.ts` (`as const`), моки данных появятся в `src/data/*.ts` фазами 2–4, состояние огоньков в памяти через `LightsProvider` (фаза 2) | Прототип с замоканными данными; форма ничего не отправляет по решению PROJECT.md |
| Auth | Нет | Публичный лендинг без личного кабинета |
| Deployment target | GitHub Pages, `build_type: workflow`, `.github/workflows/deploy.yml` (checkout@v4, setup-node@v4 Node 22, configure-pages@v5, upload-pages-artifact@v3, deploy-pages@v4), `base: "/esd-onevoice27/"` | Бесплатный хостинг с уже авторизованным `gh`; деплой через OIDC без секретов |
| Testing | Vitest 5 (`environment: jsdom`, `globals: true`, `css: false`, `setupFiles: src/test/setup.ts`) + Testing Library + user-event; тесты рядом с компонентами `*.test.tsx`; Playwright MCP для smoke живого сайта | test-as-you-go из CLAUDE.md; jsdom-моки IntersectionObserver/ResizeObserver/matchMedia/canvas заданы один раз |
| Directory layout | `src/components/{layout,hero,map,form,about,involve,news,resources,quote}/`, `src/data/`, `src/lib/`, `src/styles/`, `src/test/`; `App.tsx` фиксирует порядок секций и больше не редактируется | Папка на секцию позволяет фазам 2–4 работать параллельно без конфликтов файлов |
| Navigation | Одна страница, якоря `#hero #map #light-form #about #involve #news #resources #quote`, прокрутка через `scrollToSection(hash, headerHeight)` по формуле `offsetTop - headerHeight - 16`, без `scrollIntoView` | Решение CONTEXT фазы 1; учитывает фиксированный header и reduced motion |
| Motion policy | CSS keyframes для фоновых петель (волны/гало footer), универсальный блок `prefers-reduced-motion` в `global.css`; `motion` библиотека установлена, reveal-анимации в фазе 5 | Как в оригинале: фон на CSS, появление секций декларативно |

## Stack Touched in Phase 1

- [x] Project scaffold (Vite, TypeScript, ESLint, Vitest, Tailwind v4)
- [x] Routing: одна страница с восемью якорными секциями и `scrollToSection`
- [ ] Database: не применимо (статический прототип; данные в памяти, моки в `src/data/`)
- [x] UI: интерактивный header (меню, бургер-оверлей с фокус-трапом, Esc, блокировка скролла) и footer с внешними ссылками
- [x] Deployment: GitHub Pages через Actions, живой URL https://thevladoss.github.io/esd-onevoice27/

## Out of Scope (Deferred to Later Slices)

- Hero с canvas-глобусом, градиентный H1 `variant="hero"` и луч по границе кнопки (фаза 2, HERO-01…03)
- SVG-карта ЕАД, огоньки, счётчики, чипы стран, `LightsProvider` (фаза 2, MAP-01…06)
- Форма «Зажгите свой свет», тост, добавление огонька (фаза 3, FORM-01…03)
- Секции About, Involve с реальным содержимым и видео (фаза 3), News, Resources, Quote (фаза 4)
- Reveal-анимации `whileInView`, мобильный аудит, Playwright smoke как обязательный гейт (фаза 5)
- Бэкенд, CMS, многоязычность, аналитика, светлая тема (v2 / Out of Scope в REQUIREMENTS.md)

## Subsequent Slice Plan

Каждая следующая фаза добавляет вертикальный срез поверх этого скелета, не меняя его архитектурных решений:

- Phase 2: посетитель видит hero с глобусом и живую карту дивизиона с огоньками, счётчиками и чипами стран (`Hero.tsx`, `MapSection.tsx` заменяются целиком; `LightsProvider` оборачивает `App` в `main.tsx`)
- Phase 3: посетитель зажигает свой свет через форму, результат появляется на карте и в счётчиках; читает «Что такое Единый голос 27?» и «От убеждения к действию»
- Phase 4: посетитель листает новости, раскрывает панели ресурсов и читает цитату из «Евангелизма»
- Phase 5: секции появляются при скролле, страница проверена на 390–1440px без ошибок консоли, финальный Playwright smoke на живом сайте
