# Phase 1: Каркас и деплой - Research

**Researched:** 2026-09-05
**Confidence:** HIGH (проверено сборкой в песочнице)

## Проверено в песочнице (scratchpad/probe)

Установлены и собраны вместе без ошибок:

| Пакет | Версия | Результат |
|---|---|---|
| vite | 8.2.2 | `vite build` 305 мс, `base: "/esd-onevoice27/"` попал в `dist/index.html` |
| @vitejs/plugin-react | 6.1.1 | работает с Vite 8 |
| tailwindcss + @tailwindcss/vite | 4.3.3 | `@import "tailwindcss"; @theme { --color-midnight-950: #070210; --font-display: ... }` даёт классы `bg-midnight-950`, `font-display` в итоговом CSS |
| vitest | 5.0.0 | `environment: "jsdom"` в `test` блоке `vite.config.ts`, тест проходит за 421 мс |
| jsdom | 29.1.1 | `document` доступен в тестах |
| react / react-dom | 19.2.8 | рендер через `createRoot` |
| typescript | npm по умолчанию ставит 7.0.2 | **Закрепить `typescript@^5.9`** — шаблон Vite и `tsc -b` проверены на 5.x, версия 7 (нативный компилятор) может отличаться поведением |

Вывод: откат на Vite 7 не нужен. `vite.config.ts` из CONTEXT.md рабочий как есть.

## Точная установка

```bash
npm create vite@latest . -- --template react-ts
npm i motion d3-geo d3-zoom d3-selection topojson-client world-atlas
npm i -D tailwindcss @tailwindcss/vite vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event @types/d3-geo @types/d3-zoom @types/d3-selection @types/topojson-client @types/geojson typescript@^5.9
```

Если `npm create vite` откажется работать в непустой папке (есть `.planning`, `docs`, `CLAUDE.md`, `.gitignore`), создать шаблон во временной папке и перенести файлы шаблона в корень, не трогая существующие.

## vite.config.ts (проверенный)

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  base: "/esd-onevoice27/",
  plugins: [react(), tailwindcss()],
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    globals: true,
    css: false,
  },
});
```

Для типов `test` в `defineConfig` подключить `/// <reference types="vitest/config" />` в начале файла (или импортировать `defineConfig` из `vitest/config`).

## GitHub Pages

- Репозиторий `thevladoss/esd-onevoice27` создан, remote `origin` настроен, ветка `main` запушена (планировочные коммиты).
- Pages включён через API с `build_type: workflow`; URL `https://thevladoss.github.io/esd-onevoice27/`.
- Workflow по CONTEXT.md: `actions/checkout@v4`, `actions/setup-node@v4` (node 22, cache npm), `actions/configure-pages@v5`, `actions/upload-pages-artifact@v3` (`path: dist`), `actions/deploy-pages@v4`; `permissions: contents: read, pages: write, id-token: write`; `concurrency: group: pages, cancel-in-progress: true`.
- Проверка после пуша: `gh run list --limit 1`, `gh run watch <id>`, `curl -sI https://thevladoss.github.io/esd-onevoice27/ | head -1`.

## Шрифты

`https://fonts.googleapis.com/css2?family=Onest:wght@400;700;800;900&family=Noto+Sans:wght@400;700&display=swap` — Onest поддерживает кириллицу (весы 100–900), Noto Sans содержит кириллицу.

## Оригинальные значения для header/footer

Из `docs/research/orig-custom-styles.css`: header `--ov-header-angle: 20deg`, `--ov-header-blur: 18px`, `--ov-header-saturation: 135%`, `--ov-header-surface-opacity: 0.77`, `--ov-header-radius-desktop: 18px`, `--ov-header-min-height-desktop: 80px`, `--ov-header-scroll-duration: 420ms`, `--ov-header-scroll-easing: cubic-bezier(0.32, 0.72, 0, 1)`, `--ov-header-menu-hover-duration: 360ms`, `--ov-header-toggle-size: 48px`, `--ov-header-overlay-blur: 24px`. Footer: `@keyframes ov-footer-wave-drift { from { background-position: 0 0, 0 0, -2vw 0, 2vw 0 } to { background-position: 2vw 1vw, -2vw 1vw, 2vw -1vw, -2vw 1vw } }`, `@keyframes ov-footer-halo-drift { from { transform: translate3d(-52%, 0, 0) scale(.98) } to { transform: translate3d(-48%, 7%, 0) scale(1.06) } }`, фон футера `linear-gradient(rgb(33, 26, 62), rgb(18, 12, 52))`, высота 465px.
