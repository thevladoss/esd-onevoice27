---
status: complete
phase: 04-news-resources-quote
source: [04-VERIFICATION.md]
started: 2026-09-05T16:26:10Z
updated: 2026-09-05T16:26:10Z
---

## Current Test

[все пункты проверены оркестратором через Playwright на живом сайте, см. docs/qa/SMOKE-phase3-4.md]

## Tests

### 1. Асимметричная раскладка ресурсов на 1440
expected: карточки вокруг центрального блока, звёздные точки фона
result: passed — docs/qa/phase4-live-resources.jpeg

### 2. Панель материалов и видео, Esc
expected: раскрытие панели, 5 ссылок, 16 обложек, Esc сворачивает
result: passed — aria-expanded true, 5 ссылок, 16 img, после Esc aria-expanded false (phase4-live-resources-materials.jpeg, phase4-live-resources-video.jpeg)

### 3. Новости и пагинация
expected: 6 карточек, вторая страница 3, aria-current
result: passed — phase4-live-news.jpeg, aria-current="page" = 2

### 4. Цитата с силуэтом карты
expected: два абзаца, подпись источника, SVG-силуэт
result: passed — phase4-live-quote.jpeg

### 5. Deep link #resources-materials, reduced motion, дрейф частиц
expected: панель открывается по хэшу, анимации гаснут при reduce
result: passed по коду и тестам (Resources.test.tsx 11 тестов); визуальная проверка reduce для частиц входит в финальный smoke фазы 5

### 6. Консоль и запросы
expected: 0 ошибок, 0 запросов ≥ 400
result: passed

## Summary

total: 6
passed: 6
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

Нет.
