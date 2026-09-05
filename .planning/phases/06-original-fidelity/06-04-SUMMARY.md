---
phase: 06-original-fidelity
plan: 04
subsystem: qa
tags: [playwright, smoke, deploy, deep-link, overflow, github-pages]

requires:
  - phase: 06-original-fidelity
    provides: планы 06-01 (шапка и меню), 06-02 (кнопка), 06-03 (фоны) слиты в main
  - phase: 04-news-resources-quote
    provides: приёмник deep link #resources-materials в Resources.tsx
provides:
  - Карточка триптиха «Скачать материалы» ведёт на #resources-materials и раскрывает панель материалов
  - Оверлей мобильного меню внутри пилюли: крест закрытия поверх оверлея, как в оригинале
  - Секции карты и формы клипуют горизонталь: scrollWidth равен ширине окна на 320…1920
  - Прод равен dist по sha256, браузерная приёмка фазы 6 в docs/qa/SMOKE.md, восемь скриншотов
affects: [верификатор фазы 06, аудит и закрытие milestone v1.0]

tech-stack:
  added: []
  patterns:
    - "Полноширинные декоративные слои со сдвигом за край окна клипуются на секции-носителе через overflow-x: clip, вертикаль остаётся открытой"
    - "Элемент, который должен оставаться кликабельным поверх фиксированного оверлея, живёт в том же изолированном стековом контексте с большим z-index"

key-files:
  created:
    - docs/qa/final-header-1920.jpeg
    - docs/qa/final-cta.jpeg
    - docs/qa/final-full-1920.jpeg
    - docs/qa/final-mobile-menu.jpeg
  modified:
    - src/data/copy.involve.ts
    - src/components/involve/Involve.test.tsx
    - src/components/resources/Resources.tsx
    - src/components/layout/Header.tsx
    - src/components/map/map.css
    - src/components/form/light-form.css
    - docs/qa/SMOKE.md
    - docs/qa/final-desktop.jpeg
    - docs/qa/final-mobile.jpeg
    - docs/qa/final-full.jpeg
    - docs/qa/final-reduced-motion.jpeg

key-decisions:
  - "Горизонтальный overflow оригинала (scrollWidth 2338 на 1920 из-за орба со сдвигом 38%) не скопирован: секции карты и формы получили overflow-x: clip"
  - "Оверлей меню перенесён внутрь .site-header__content по образцу оригинала вместо поднятия z-index всей шапки: стекло и логотип уходят под оверлей, крест остаётся сверху"

patterns-established:
  - "Браузерная приёмка фазы фиксируется таблицей «оригинал / наш прод / статус» в SMOKE.md"

requirements-completed: [FID-01, FID-02, FID-03]

duration: 40min
completed: 2026-09-05
---

# Phase 6 Plan 04: Deep link, smoke и деплой Summary

**Прод после слияния трёх планов фазы 6 совпал с оригиналом по шапке, меню, кнопке и фонам во всех замерах на 1440, 1920 и 390; по пути закрыты три дефекта: deep link материалов, крест бургера под оверлеем и горизонтальный overflow от орбов.**

## Performance

- **Duration:** 40 min
- **Started:** 2026-09-05T21:05:00Z
- **Completed:** 2026-09-05T21:45:00Z
- **Tasks:** 2 из 2 (задача 2 выполнена оркестратором через Playwright MCP)
- **Files modified:** 7, создано 4 скриншота

## Accomplishments

- Слиты ветки agent-06-01, agent-06-02, agent-06-03 без конфликтов; гейт после слияния: 44 файла / 368 тестов, lint чист, build без предупреждений, `check:dist` 11 из 11
- `copy.involve.ts`: карточка «Материалы для церкви» ведёт на `#resources-materials`; на проде клик раскрывает панель материалов (5 ссылок) и прокручивает к секции под шапку
- `Header.tsx`: `MobileMenu` перенесён внутрь `.site-header__content`; `elementFromPoint` по центру бургера при открытом меню отдаёт бургер, клик по кресту закрывает меню и возвращает фокус
- `map.css`, `light-form.css`: `overflow-x: clip` на секциях; scrollWidth равен innerWidth на 320 / 390 / 768 / 1024 / 1440 / 1920 (до фикса 978 / 1304 / 1834 / 2338 на 768 / 1024 / 1440 / 1920, ровно как у оригинала)
- Прод сверен побайтно с `dist` (index.html и три ассета), прогоны Actions зелёные
- `docs/qa/SMOKE.md` дополнен разделом «Фаза 6» с таблицей оригинал / прод; восемь скриншотов пересняты

## Task Commits

1. **Task 1: deep link** — `e75e0dc` fix(06-04)
2. **Task 2: smoke и фиксы по итогам** — `fix(06-01)` перенос оверлея (коммит перед e75e0dc), `fix(06-03)` overflow-x: clip, `docs(06)` smoke и скриншоты

## Deviations from Plan

**1. Два дополнительных фикса в задаче 2.** Smoke нашёл крест бургера под оверлеем (оверлей лежал рядом с изолированным контентом пилюли) и горизонтальный overflow от орбов со сдвигом 38%. Оба исправлены сразу, поскольку правки по одной строке-двум и полностью в периметре FID-01 / FID-02; задокументированы в SMOKE.md.

**2. Скриншотов восемь вместо шести:** добавлены полная страница на 1920 и открытое мобильное меню, потому что именно эти виды сравнивал пользователь.

## Issues Encountered

- Оригинал сам имеет горизонтальный overflow на 1920 (scrollWidth 2338); копировать дефект не стали.
- Playwright прокручивает к кнопке пагинации перед кликом, если она ниже экрана: артефакт методики, описан в разделе фазы 5.

## Next Phase Readiness

- Фаза 6 готова к верификации; после неё повторный аудит milestone и закрытие v1.0.
