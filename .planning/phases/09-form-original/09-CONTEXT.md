# Phase 9: Форма как в оригинале — Context

**Gathered:** 2026-09-06
**Status:** Ready for planning
**Source:** правки пользователя (пункт 3: форма другая по дизайну и полям, поля меняются от типа света, локализовать понятнее) + спецификация v1.1, раздел 3; разметка и computed styles оригинала в `docs/research/v1.1/dom-ov-light-form-container.html`, `orig-form.jpeg`, `orig-form-group.jpeg`

<domain>
## Phase Boundary

`LightForm`, `LightTypeChoice`, `FormField`, `ConsentCheckbox`, `light-form.css`, `copy.form.ts`, `validation.ts` и тесты. Логика добавления огонька и тост не меняются. Не трогать `App.tsx`, `map.css`, `primitives.css`, `Button.tsx`, `GlassCard.tsx`, `GradientTitle.tsx`.
</domain>

<decisions>
## Implementation Decisions

### Структура и состояния
- Без `GlassCard`: форма стоит прямо на секции. Колонка 42rem по центру (шапка и форма), сетка полей 6 колонок gap 16px (см. спецификацию: на ≥768px Имя | Фамилия и Страна | Город по 3 колонки, остальное во всю ширину; на <768px всё в одну колонку).
- Тип света при старте не выбран (`type: ""`). Отправка без типа → ошибка «Выберите тип света» у fieldset (aria-describedby на группу). Выбор «Групповой маяк» показывает поле `orgName` (обязательное, «Укажите название организации»); при возврате к «Личный свет» поле убирается, его значение и ошибка сбрасываются.
- `validation.ts`: `LightFormValues.type: LightType | ""`, новое поле `orgName`, порядок фокуса при ошибке: type → orgName → firstName → lastName → countryId → city → email → consent. `toLightType` продолжает отдавать тип для `addLight`.
- «Адрес» оригинала (геокодер) у нас = Страна (select) + Город; оставляем.

### Тексты (copy.form.ts)
- Все подписи из спецификации FORM-02 дословно; placeholder’ы: «Например, община в Твери», «Например, Алматы», «name@example.com», у Имени/Фамилии без placeholder (как в оригинале). Пометка обязательного поля: `<span class="lf-required" title="Обязательно" aria-hidden="true">` со звёздочкой-иконкой 12px `rgb(252 165 165)` + sr-only «обязательно».
- Шапка: eyebrow «Участвуйте с нами», заголовок «Зажгите свой свет» (плоский белый приходит из фазы 7 через `variant="section"`; вызов не менять), лид текущий.

### Стили
- Все значения карточек типа, маячка `::before`, точки-радио, полей, фокуса, чекбокса и кнопки — в спецификации FORM-03/FORM-04; переносить дословно, ничего не «улучшать». Кнопка — `Button variant="primary" size="form"` (луч и точки уже есть), `margin-top: 8px`.
- `.lf-section`: убрать `background` и `::before` (подложку и орб даёт лента фазы 8); `overflow-x: clip` можно оставить. Секция остаётся `id="light-form"`, отступы 64px сверху и снизу, между лидом и формой 48px.
- Select страны стилизуется как input (radius 16, те же фон/рамка) с нынешней SVG-стрелкой.

### Claude's Discretion
- Как реализовать условное поле (условный рендер vs `hidden`), лишь бы фокус и aria были корректны и тесты покрывали оба состояния.
</decisions>

## Canonical References

- `docs/superpowers/specs/2026-09-06-design-fixes-v1.1-design.md` — спецификация с точными значениями CSS оригинала (раздел 3 (FORM)); при расхождении с любым другим документом побеждает спецификация
- `.planning/ROADMAP.md` — фаза 9: критерии успеха, список файлов во владении, правила параллельной работы (фазы 7–12 идут одновременно в разных worktree от одного `main`)
- `docs/research/v1.1/orig-rules.css` и `orig-vars.txt` — правила и переменные оригинала; `dom-*.html` — разметка; скриншоты `orig-*.jpeg`
- `docs/qa/SMOKE.md` — как принимались прошлые фазы (Playwright на 1440×900 и 390×844)

## Правила фазы

- Редактировать только файлы из списка **Files** фазы 9 в ROADMAP.md. Чужие файлы не трогать даже ради одной строки; правило для чужого селектора класть в свой CSS-файл.
- Цвета в CSS писать литералами `rgb(r g b / a)` из спецификации: токены `--color-midnight-*` проекта сдвинуты на шаг относительно палитры оригинала.
- Тесты в той же фазе, что и код; `npm test` по затронутым файлам зелёный до завершения плана; `npx tsc -b` и `npm run lint` без ошибок.
- Весь пользовательский текст на русском, идентификаторы на английском. Комментарии в коде на русском, как в проекте.
- Reduced motion: любые новые анимации гаснут при `prefers-reduced-motion: reduce` через единый блок в своём CSS (`@media (prefers-reduced-motion: reduce)`).

## Deferred Ideas

- Всё из бэклога v2 (`.planning/PROJECT.md`, «Key context») остаётся вне фазы.
