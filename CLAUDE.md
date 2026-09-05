<!-- GSD:project-start source:PROJECT.md -->
## Project

**Единый голос 27 — лендинг Евро-Азиатского дивизиона (редизайн)**

Одностраничный лендинг «Единый голос 27» для Евро-Азиатского дивизиона (ЕАД) Церкви адвентистов седьмого дня: структурная и визуальная копия оригинала https://onevoice27.org/ (тёмная фиолетово-бирюзовая тема, стеклянные карточки, карта с огоньками, форма «зажечь свет»), наполненная русскоязычным контентом ЕАД с https://esd.onevoice27.org/ и https://esd-map.vercel.app/. Рабочий прототип редизайна с замоканными данными, опубликованный на GitHub Pages.

**Core Value:** Посетитель открывает страницу и видит красивый, живой лендинг уровня оригинала onevoice27.org, но про ЕАД: узнаёт, что такое «Единый голос 27», видит карту движения по дивизиону и может «зажечь свой свет».

### Constraints

- **Tech stack**: Vite 8 + React 19 + TypeScript, Tailwind CSS v4, motion, d3-geo/d3-zoom/topojson-client/world-atlas, Vitest + Testing Library — зафиксировано в спеке, чтобы билд был статическим и бесплатно хостился
- **Hosting**: GitHub Pages (репозиторий thevladoss/esd-onevoice27, base path `/esd-onevoice27/`) — единственный бесплатный хостинг с уже авторизованным CLI
- **Язык**: весь пользовательский текст на русском; идентификаторы на английском
- **Внешние зависимости в рантайме**: только Google Fonts (Onest, Noto Sans) и YouTube (превью и lite-embed); никаких токенов и API-ключей
- **Тесты**: test-as-you-go, тесты пишутся и прогоняются в той же фазе, что и код
- **Объём**: рабочий прототип, без задрачивания каждой детали
<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->
## Technology Stack

## Recommended Stack
### Core Technologies
| Технология | Версия | Назначение | Почему |
|---|---|---|---|
| Vite | 8.2.x | сборка и dev-сервер | статический билд, `base` под GitHub Pages, быстрый HMR |
| React | 19.2.x | UI | компоненты секций, контекст огоньков |
| TypeScript | 5.x | типизация моков и пропсов | моки в `src/data/` типизированы, ошибки ловятся на билде |
| Tailwind CSS | 4.3.x (`@tailwindcss/vite`) | утилиты и токены | оригинал на Tailwind; v4 конфигурируется в CSS через `@theme`, без `tailwind.config.js` |
### Supporting Libraries
| Библиотека | Версия | Назначение | Когда использовать |
|---|---|---|---|
| `motion` | 13.x (`import { motion, useReducedMotion } from "motion/react"`) | reveal-анимации `whileInView`, stagger | появление секций и карточек; при reduced motion отключать |
| `d3-geo` | 3.1.x | проекция и `geoPath` для SVG-карты | `geoMercator` или `geoConicConformal`, `fitExtent` под bbox ЕАД |
| `d3-zoom` + `d3-selection` | 3.x | зум и панорамирование карты | привязка через `useRef`/`useEffect`, transform хранить в состоянии React |
| `topojson-client` | 3.1.x | TopoJSON → GeoJSON (`feature`, `mesh`) | конвертация `world-atlas` один раз при загрузке модуля |
| `world-atlas` | 2.0.x (`world-atlas/countries-110m.json`) | границы стран | 110m достаточно для карты дивизиона; 50m тяжелее в 4 раза |
### Development Tools
| Инструмент | Версия | Назначение |
|---|---|---|
| Vitest | 5.x (`environment: "jsdom"`) | unit и component тесты |
| `@testing-library/react` + `@testing-library/jest-dom` | актуальные | тесты компонентов |
| Playwright MCP | доступен в сессии | визуальный smoke после `vite build && vite preview` |
| GitHub Actions `actions/checkout@v4`, `actions/setup-node@v4`, `actions/configure-pages@v5`, `actions/upload-pages-artifact@v3`, `actions/deploy-pages@v4` | | деплой на Pages, `build_type: workflow` уже включён в репозитории |
## Installation
## Alternatives Considered
| Вместо | Рассмотрели | Почему нет |
|---|---|---|
| d3-geo SVG | Mapbox GL / MapLibre + тайлы | токен или внешние тайлы, сложнее стилизовать под фиолетовую палитру; оригинал на Mapbox, но у нас нет ключа |
| d3-geo SVG | react-simple-maps | обёртка над d3-geo с отставанием версий React; d3 напрямую проще контролировать |
| canvas-глобус | three.js / cobe | +600 КБ или WebGL-зависимость ради одного декоративного элемента |
| `motion` | GSAP + ScrollTrigger | платная лицензия для части плагинов раньше, императивный API; оригинал вообще без библиотек |
| Onest | Unbounded / Montserrat | Unbounded слишком широкий, Montserrat узнаваемый «шаблонный»; Onest ближе к Figtree по геометрии |
## What NOT to Use
- `framer-motion` как имя пакета: актуальный пакет `motion`, импорт из `motion/react`.
- `tailwind.config.js` и `@tailwind base/components/utilities`: в v4 только `@import "tailwindcss"` и `@theme`.
- `world-atlas/countries-50m.json` по умолчанию: тяжелее и не нужен для масштаба дивизиона.
- Хотлинк картинок с `images.hopesoftware.org`: чужой CDN, может закрыться; используем SVG-графику и `img.youtube.com`.
## Stack Patterns by Variant
## Version Compatibility
| Пара | Статус |
|---|---|
| React 19.2 + motion 13 | совместимы (motion поддерживает React 18/19) |
| Vite 8.2 + @tailwindcss/vite 4.3 | проверить в фазе 1 (MEDIUM) |
| Vite 8.2 + Vitest 5.0 | проверить в фазе 1 (MEDIUM) |
| d3-geo 3 + topojson-client 3 + world-atlas 2 | совместимы, стабильные версии |
| Node 25 локально, Node 22 в CI | использовать `actions/setup-node@v4` с `node-version: 22`, `npm ci` |
## Sources
- `npm view` для vite, react, tailwindcss, @tailwindcss/vite, vitest, motion, d3-geo, d3-zoom, topojson-client, world-atlas (2026-09-05) — HIGH
- Tailwind v4 docs (`@import "tailwindcss"`, `@theme`), motion docs (`motion/react`, `whileInView`, `useReducedMotion`) — MEDIUM (по памяти, подтвердить в фазе 1)
- GitHub Pages API: `build_type: workflow` включён через `gh api` в этой сессии — HIGH
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
