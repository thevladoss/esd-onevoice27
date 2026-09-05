---
status: complete
phase: 05-polish-and-release
source: [docs/qa/SMOKE.md, 05-VERIFICATION.md]
started: 2026-09-05T18:40:00Z
updated: 2026-09-05T19:25:00Z
---

## Current Test

[все пункты проверены оркестратором через Playwright MCP на preview (порт 4174) и на проде https://thevladoss.github.io/esd-onevoice27/, подробности и числа в docs/qa/SMOKE.md]

## Tests

### 1. Восемь секций, header и footer на 1440 и 390
expected: `#hero #map #light-form #about #involve #news #resources #quote`, header-пилюля, footer
result: passed — 8 из 8 на preview и проде, docs/qa/final-desktop.jpeg, final-mobile.jpeg, final-full.jpeg

### 2. Reveal при скролле
expected: после прокрутки до низа все обёртки motion с opacity 1 и transform none
result: passed — 31 из 31 на preview и проде

### 3. Reduced motion
expected: секции видны сразу, `[data-anim]` без анимаций, высота документа та же
result: passed — 8 секций, 51 `[data-anim]` с `animationName: none`, высота 8739 = 8739, docs/qa/final-reduced-motion.jpeg

### 4. Адаптив 320 / 390 / 768 / 1024 / 1440
expected: без горизонтального скролла до и после прокрутки; на 390 счётчики над картой, форма и новости в одну колонку, видео в две
result: passed — scrollWidth равен innerWidth на всех ширинах, раскладка 390 подтверждена

### 5. Доступность: skip-link, фокус, якоря, мобильное меню
expected: первый стоп «Перейти к содержимому», кольцо фокуса на каждом стопе, порядок по DOM, заголовок секции ниже пилюли ≥ 16 px, диалог «Меню» закрывается Esc с возвратом фокуса
result: passed — кольцо `2px rgb(170, 217, 220)` на 10 из 10 стопов, отступы якорей 150–255 px, фокус возвращается на бургер

### 6. Консоль и сеть на preview и проде
expected: 0 ошибок, 0 ответов ≥ 400, внешние хосты только шрифты Google и превью YouTube
result: passed — 0 ошибок; прод 45 ответов, все 200; хосты thevladoss.github.io, fonts.googleapis.com, fonts.gstatic.com, img.youtube.com

### 7. Прод равен локальной сборке
expected: одинаковые title и список ассетов, sha256 живых файлов равен `dist`
result: passed — 4 из 4 файлов совпали на сборке a69b775, прогон Actions 33985866376 зелёный

### 8. Производительность hero
expected: rAF в верху страницы не ниже 45 fps (информативно)
result: passed после плана 05-08 — 121 fps на preview и проде; до фикса канвас с `shadowBlur` стоил 533 мс на кадр

## Summary

total: 8
passed: 8
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

Нет. Единственный дефект приёмки (FPS глобуса) закрыт планом 05-08 и перепроверен на проде.
