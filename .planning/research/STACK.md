# Stack Research

**Domain:** анимированный одностраничный лендинг-кампания (React + Vite), SVG-карта на d3-geo, canvas-глобус, статический билд на GitHub Pages
**Researched:** 2026-09-05
**Confidence:** MEDIUM (версии проверены через `npm view`; совместимость Vite 8 с плагином Tailwind и Vitest 5 проверяется в фазе 1)

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

```bash
npm create vite@latest . -- --template react-ts
npm i motion d3-geo d3-zoom d3-selection topojson-client world-atlas
npm i -D tailwindcss @tailwindcss/vite vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event @types/d3-geo @types/d3-zoom @types/d3-selection @types/topojson-client @types/geojson
```

`vite.config.ts`:

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  base: "/esd-onevoice27/",
  plugins: [react(), tailwindcss()],
  test: { environment: "jsdom", setupFiles: "./src/test/setup.ts", globals: true },
});
```

`src/styles/global.css`:

```css
@import "tailwindcss";
@theme {
  --font-display: "Onest", "Noto Sans", sans-serif;
  --font-body: "Noto Sans", sans-serif;
  --color-midnight-950: #070210;
  --color-midnight-900: #120c34;
  --color-midnight-800: #211a3e;
  --color-unity-700: #303f83;
  --color-unity-500: #3b4da1;
  --color-signal-600: #9e439a;
  --color-signal-400: #bb6cae;
  --color-signal-300: #d28ebe;
  --color-horizon-600: #54a4ac;
  --color-horizon-400: #7bc2c7;
  --color-horizon-200: #aad9dc;
  --color-paper: #f8f7fb;
}
```

Шрифты: `<link href="https://fonts.googleapis.com/css2?family=Onest:wght@400;700;800;900&family=Noto+Sans:wght@400;700&display=swap" rel="stylesheet">`. Onest поддерживает кириллицу (шрифт Onest Type, вес 100–900), Noto Sans содержит кириллицу.

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

**Если `@tailwindcss/vite` 4.3 не заводится с Vite 8 (rolldown):** откатить на Vite 7.x, остальное без изменений.

**Если Vitest 5 конфликтует с Vite 8:** Vitest 4.x с той же конфигурацией.

**Если 300 анимированных `<circle>` тормозят на мобильном:** ограничить одновременную пульсацию 40 огоньками (CSS `animation-delay`, остальные статичны) или вынести огоньки в canvas-оверлей поверх SVG.

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
