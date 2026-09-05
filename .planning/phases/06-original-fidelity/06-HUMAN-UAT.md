---
status: complete
phase: 06-original-fidelity
source: [docs/qa/SMOKE.md «Фаза 6», 06-VERIFICATION.md]
started: 2026-09-05T21:10:00Z
updated: 2026-09-05T21:50:00Z
---

## Current Test

[все пункты проверены оркестратором через Playwright MCP на проде https://thevladoss.github.io/esd-onevoice27/ (сборка c733412) на 1440, 1920 и 390, числа в docs/qa/SMOKE.md, раздел «Фаза 6»]

## Tests

### 1. Пилюля шапки как в оригинале (1440 и 1920)
expected: 72rem по центру, 80px, radius 18px, скос 20° на слоях рамки и стекла, градиентная рамка, стекло rgb(7 2 16 / .77) с blur 18px, drop-shadow, белый логотип
result: passed — 1152×80 на x=144 (1440) и x=384 (1920), матрица skewX tan 20° у `::before` и `::after`, blur(18px) saturate(1.35), rgba(7, 2, 16, .77), логотип rgb(255 255 255); docs/qa/final-header-1920.jpeg

### 2. Пункты меню и ховер
expected: 16px / 650 / uppercase, текст в span с градиентом 230%, на ховере сдвиг background-position 100% 50% → 0 50%
result: passed — 16px 650 uppercase, `background-clip: text`, позиция 100% 50% → 0px 50% после hover

### 3. Скрытие шапки при прокрутке
expected: вниз — класс is-header-hidden, translateY(calc(-100% - 2rem)), opacity 0; вверх — возврат
result: passed — после 700 → 900 px класс стоит, matrix(…, 0, -112), opacity 0; после прокрутки вверх класс снят

### 4. Бургер и мобильное меню на 390
expected: шапка 72px без радиуса с линией по низу, бургер из трёх rect складывается в крест, оверлей с blur 24px и градиентами, пункты 750 веса с разделителями и линией справа, крест поверх оверлея, Esc и клик по кресту закрывают с возвратом фокуса
result: passed — 72px, radius 0, линия 1.5px; трансформы rect совпали с оригиналом; blur(24px) saturate(1.25); пункты 31.2px/750, линия 24px; elementFromPoint по центру бургера отдаёт бургер (после переноса оверлея в пилюлю); закрытие Esc и крестом с фокусом на бургере; docs/qa/final-mobile-menu.jpeg

### 5. Кнопка hero и submit формы
expected: рамка 1.5px с коническим лучом, поверхность 125deg, ::before блик, ::after точки 7px под конической маской на той же переменной, 3s; submit те же правила
result: passed — border 1.5px, оба градиента, `::after` background-size 7px 7px, opacity .42, mask conic-gradient, animation hero-beam 3s, угол 221° → 257° за 300 мс; docs/qa/final-cta.jpeg

### 6. Фоны секций на всю ширину (1920 и 390)
expected: подложки и градиенты на секциях шириной окна, скосы карты/involve/footer, карта на всю ширину, между секциями нет чёрных промежутков
result: passed — все `main > section` и footer шириной 1920 (и 390) с непрозрачными подложками или псевдослоями; карта SVG 1920px от left 0; docs/qa/final-full-1920.jpeg против docs/research/orig-full.jpeg

### 7. Горизонтальный скролл
expected: scrollWidth равен innerWidth на 320 / 390 / 768 / 1024 / 1440 / 1920
result: passed после фикса overflow-x: clip — до него 978 / 1304 / 1834 / 2338 на 768 / 1024 / 1440 / 1920 (как у оригинала), после равен ширине на всех шести

### 8. Deep link материалов из триптиха
expected: клик по «Скачать материалы» открывает панель материалов и прокручивает к ней
result: passed — hash #resources-materials, aria-expanded панелей [false, true, false], 5 ссылок, секция под шапкой

### 9. Reduced motion, консоль, сеть, регрессии
expected: анимации выключены, 0 ошибок, 0 ответов ≥ 400, 8 секций, reveal, счётчики
result: passed — 51 [data-anim] без анимации, кнопка и `::after` animation none, transition шапки 1e-05s; 0 ошибок консоли; 0 из 60 ответов ≥ 400; 8 секций; reveal 31/31; счётчики 694/248; sha256 index.html и трёх ассетов равен dist

## Summary

total: 9
passed: 9
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

Нет.
