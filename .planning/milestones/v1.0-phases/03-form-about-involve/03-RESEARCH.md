# Phase 3: Форма, О проекте, Участие - Research

**Researched:** 2026-09-05
**Confidence:** HIGH (внешние ресурсы проверены запросами)

## Проверено

- Обложка ролика `YpLD6p-z00g`: `https://img.youtube.com/vi/YpLD6p-z00g/hqdefault.jpg` → 200 (7,3 КБ, 480×360), `maxresdefault.jpg` → 200. Для видео-фасада можно использовать `maxresdefault` с fallback на `hqdefault` через `onError`, либо сразу `hqdefault` (стабильнее, меньше).
- Embed: `https://www.youtube-nocookie.com/embed/YpLD6p-z00g?autoplay=1&rel=0`, iframe с `allow="autoplay; encrypted-media; picture-in-picture"` и `allowfullscreen`. Автоплей после клика пользователя разрешён браузерами.
- В jsdom `HTMLMediaElement`/iframe не грузятся: тест `VideoEmbed.test.tsx` проверяет только смену DOM (кнопка play → `iframe[src*="youtube-nocookie.com/embed/YpLD6p-z00g"]`).

## Форма без бэкенда

- `validateLightForm(values)` — чистая функция, возвращает `Partial<Record<keyof Values, string>>`; пустой объект = валидно. Тестируется без DOM.
- Тост: `role="status"` + `aria-live="polite"` уже подразумевается ролью; таймер `setTimeout(4000)` очищать в cleanup; в тестах использовать `vi.useFakeTimers()` или проверять только появление.
- `addLight` из `state/lights.tsx` (фаза 2) принимает `{ type: "person" | "group"; countryId: number }`; координата вычисляется внутри контекста, форма про геометрию не знает.
- Сброс формы: контролируемые поля через `useState` одного объекта `values`; `setValues(initial)` после успеха, тип света сохранять.

## Радио-карточки

Паттерн: `<label class="type-card">` содержит `<input type="radio" class="sr-only">`; стиль выбранного через `.type-card:has(input:checked)` (поддержка `:has()` во всех современных браузерах с 2023). Фокус: `.type-card:has(input:focus-visible)` рисует кольцо horizon-200. Клавиатура работает нативно (стрелки внутри группы `name="lightType"`).

## Ссылки триптиха

Внутренние якоря `#about`, `#resources`, `#news`; для «Скачать материалы →» можно вести на `#resources` и, при желании, добавить хэш `#resources-materials`, который фаза 4 распознаёт и открывает панель материалов.
