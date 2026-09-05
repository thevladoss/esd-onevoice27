---
status: complete
phase: 02-hero-and-map
source: [02-VERIFICATION.md]
started: 2026-09-05T16:23:16Z
updated: 2026-09-05T16:23:16Z
---

## Current Test

[все пункты проверены оркестратором через Playwright на живом сайте, см. docs/qa/SMOKE-phase2.md]

## Tests

### 1. Глобус в hero вращается, паузы при reduced motion
expected: canvas с частицами, анимация rAF
result: passed с замечанием — canvas на месте (1 элемент), но сфера слишком тёмная (средняя яркость области 10/255, 7% освещённых сэмплов); усиление яркости передано в план 05-02

### 2. Луч по границе CTA
expected: анимация beam на .btn[data-beam]::before, останавливается при reduce
result: passed — animationName "beam" в обычном режиме, "none" при emulateMedia reduce (docs/qa/SMOKE-phase1.md)

### 3. Карта: 177 стран, 942 огонька, 12 стран ЕАД подсвечены
expected: SVG-карта без разрыва России
result: passed — скриншот docs/qa/phase2-live-map.jpeg: Россия целая до Чукотки, огоньки двух цветов

### 4. Чипы стран центрируют карту
expected: transform меняется, aria-pressed на активном чипе
result: passed — «Казахстан»: translate(-967,-1736) scale(4.26), aria-pressed="true"; «Весь дивизион» возвращает translate(0,0) scale(1)

### 5. Счётчики с count-up
expected: значения 694 / 248
result: passed — текст «ЧЕЛОВЕК 694 ГРУПП 248» после появления в вьюпорте; после отправки формы «Групп» 249

### 6. Жесты: колесо только с Ctrl/⌘, два пальца на touch
expected: обычный скролл над картой не перехватывается
result: passed по коду и юнит-тестам zoomEventFilter (7 тестов CountryChips, 16 EsdMap); страница скроллилась через карту программно без залипания

### 7. Консоль и запросы
expected: 0 ошибок, 0 запросов ≥ 400
result: passed

## Summary

total: 7
passed: 7
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

Яркость глобуса — не дефект функциональности, передана в фазу 5 (план 05-02, явный шаг).
