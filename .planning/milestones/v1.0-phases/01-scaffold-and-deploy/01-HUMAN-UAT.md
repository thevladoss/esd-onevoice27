---
status: complete
phase: 01-scaffold-and-deploy
source: [01-VERIFICATION.md]
started: 2026-09-05T16:08:15Z
updated: 2026-09-05T16:08:15Z
---

## Current Test

[все пункты проверены оркестратором через Playwright на живом сайте, пользователь недоступен]

## Tests

### 1. Header-пилюля на 1440 и 390px
expected: стекло, скос, градиентный wordmark, уплотнение при скролле
result: passed — скриншоты docs/qa/phase1-live-desktop.jpeg и phase1-live-mobile.jpeg; после клика по якорю header получает data-scrolled="true"

### 2. Бургер-меню на 390px: фокус-трап, Esc, блокировка скролла
expected: оверлей на весь экран, фокус внутри, Esc закрывает и возвращает фокус, body не скроллится
result: passed — aria-expanded true → role="dialog" в DOM, фокус внутри диалога, body overflow hidden; после Esc aria-expanded false, фокус на бургере, overflow visible (docs/qa/phase1-live-mobile-menu.jpeg)

### 3. Плавная прокрутка к секции с учётом header
expected: верх секции не перекрыт пилюлей
result: passed — клик «Что это?» на 1440: scrollY 2491, верх #about на 103px от края вьюпорта

### 4. Волны и гало footer, prefers-reduced-motion
expected: анимации идут по умолчанию и останавливаются при reduce
result: passed — footer::before footer-halo-drift, ::after footer-wave-drift; при emulateMedia reduce обе animationName = none, луч CTA тоже none (docs/qa/phase1-live-footer.jpeg)

### 5. Playwright smoke живого сайта
expected: 8 секций, header, footer, чистая консоль, нет 404
result: passed — см. docs/qa/SMOKE-phase1.md (0 ошибок консоли, 0 запросов ≥400, нет горизонтального скролла на 1440 и 390)

## Summary

total: 5
passed: 5
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

Нет.
