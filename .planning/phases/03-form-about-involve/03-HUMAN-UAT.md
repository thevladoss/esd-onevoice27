---
status: complete
phase: 03-form-about-involve
source: [03-VERIFICATION.md]
started: 2026-09-05T16:23:16Z
updated: 2026-09-05T16:23:16Z
---

## Current Test

[все пункты проверены оркестратором через Playwright на живом сайте, см. docs/qa/SMOKE-phase3-4.md]

## Tests

### 1. Форма: валидация и сообщения на русском
expected: 6 ошибок при пустой отправке
result: passed — 6 полей aria-invalid, тексты совпадают с CONTEXT

### 2. Форма: успешная отправка добавляет огонёк и увеличивает счётчик
expected: новый огонёк is-new, счётчик +1, тост
result: passed — огоньков 942 → 943, .light.is-new = 1, «Групп» 248 → 249, тост «Ваш свет зажжён! Огонёк уже на карте.» (docs/qa/phase3-live-form-toast.jpeg)

### 3. Визуальный контракт формы на 1440
expected: стеклянная карточка, радио-карточки, поля 54px, градиентная кнопка
result: passed — docs/qa/phase3-live-form.jpeg

### 4. Видео-фасад «О проекте»
expected: постер и play, iframe youtube-nocookie по клику
result: passed — iframe src youtube-nocookie.com/embed/YpLD6p-z00g?autoplay=1&rel=0

### 5. Карточки 1/2/3 и триптих «Участие»
expected: три карточки шагов, три карточки триптиха с SVG и ссылками
result: passed — ссылки #about, #resources, #news; скриншоты phase3-live-about.jpeg, phase3-live-involve.jpeg

## Summary

total: 5
passed: 5
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

Нет.
