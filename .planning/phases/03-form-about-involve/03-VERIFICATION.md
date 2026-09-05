---
phase: 03-form-about-involve
verified: 2026-09-05T19:20:00Z
status: passed
score: 15/15 must-haves verified
has_blocking_gaps: false
overrides_applied: 0
human_verification:
  - test: "npm run dev, секция #light-form на 390/768/1024/1440px: поля и радио-карточки со стилями токенов (высота 54px, фон, рамки), фокус-кольцо #aad9dc на всех интерактивных элементах, отправка валидной формы — кнопка «Зажигаем…» на 1.2с, тост снизу по центру появляется 240мс и уходит 200мс, с «Уменьшить движение» — без анимации; горизонтального скролла на 390px нет"
    expected: "Визуальный вид и тайминги совпадают с 03-UI-SPEC; фокус переходит по цепочке Тип света → поля → согласие → кнопка"
    why_human: "CSS-анимации, backdrop-эффекты и реальные тайминги требуют визуального наблюдения в браузере, не проверяются статическим анализом"
  - test: "npm run dev, секция #about на 1440 и 390px: постер видео 16:9 с радиусом 24px, круглая кнопка play 72px, по клику воспроизводится iframe; три карточки шагов в ряд на 1440 и стопкой на 390, градиентные номера, при наведении разделитель растягивается"
    expected: "Постер и видео визуально соответствуют UI-SPEC, hover-эффекты карточек работают только на устройствах с hover"
    why_human: "Визуальный рендеринг градиентов, теней и hover-переходов не проверяется grep/тестами"
  - test: "npm run dev, секция #involve на 1440/768/390px: на 1440 три карточки в единой стеклянной рамке со швами 1px и мягким свечением, на 768 три строки с медиа слева, на 390 стопка карточек с радиусом 24px; при наведении иллюстрация укрупняется, линия под ссылкой растягивается; Tab доходит до трёх ссылок с видимым кольцом фокуса"
    expected: "Раскладка триптиха переключается по брейкпоинтам без визуальных дефектов, фокус виден на ссылках"
    why_human: "Адаптивная раскладка и hover/focus-эффекты требуют браузерного наблюдения"
---

# Phase 3: Форма, О проекте, Участие — Verification Report

**Phase Goal:** Посетитель понимает суть проекта, видит путь «от убеждения к действию» и может зажечь свой свет через форму, результат которой сразу отражается на карте и в счётчиках
**Verified:** 2026-09-05T19:20:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Примечание о формате цели (mode: mvp)

ROADMAP.md помечает фазу 3 как `Mode: mvp`, но строка `**Goal:**` написана прозой, а не в каноническом формате User Story. Проверка `bm-sdk query user-story.validate --story "..." --pick valid` вернула `false` (нет «As a», «I want to», «so that»). Тот же разрыв уже зафиксирован в верификации фазы 1 (01-VERIFICATION.md). Согласно разделу «MVP Mode Verification», в этом случае раздел «User Flow Coverage» не строится, а проверка идёт стандартной goal-backward методологией по ROADMAP Success Criteria (4 пункта) и must_haves четырёх PLAN-файлов фазы, без сокращения объёма. Рекомендация не блокирует фазу: поправить формат `**Goal:**` для фаз 1 и 3 в ROADMAP.md отдельным коммитом.

## Goal Achievement

### Observable Truths

Свод объединяет 4 ROADMAP Success Criteria и must_haves четырёх PLAN-файлов (03-01…03-04), пересекающиеся формулировки схлопнуты.

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Посетитель видит секцию `#light-form` с eyebrow «Участвуйте с нами», H2 «Зажгите свой свет» и двумя радио-карточками «Индивидуальный свет» (выбрана по умолчанию) / «Групповой маяк» с текстами 03-CONTEXT | ✓ VERIFIED | `LightForm.tsx` рендерит `Section#light-form`, `GradientTitle h2`, `LightTypeChoice`; `copy.form.ts` содержит точные тексты; тест «структура секции» проверяет заголовок, eyebrow, `checked` на individual |
| 2 | Форма содержит имя, фамилию, страну (select из 12 стран ЕАД), город, email, согласие; пустая отправка показывает ровно 6 ошибок на русском, фокус на «Имя» | ✓ VERIFIED | `validation.ts` (6 правил, тексты из `formCopy.errors`); тест «на пустой отправке» проверяет ровно 6 текстов ошибок, `aria-invalid`/`aria-describedby`, `document.activeElement === firstName`; select — 13 опций, Россия `value="643"` |
| 3 | После первой неудачной попытки поле перепроверяется на blur, ошибка исчезает сразу при валидном значении; до первой попытки ошибок нет | ✓ VERIFIED | `updateField`/`revalidateField` в `LightForm.tsx` условны на `attempted`; тест «перепроверяет поле на blur только после первой попытки» проходит весь сценарий (0 ошибок до попытки → 6 после → снятие по вводу → возврат по blur) |
| 4 | Валидная отправка: кнопка «Зажигаем…» с `aria-busy` на 1200мс → `addLight({ type, countryId })` → счётчик соответствующего типа +1 → форма сброшена с сохранением типа → фокус на кнопке | ✓ VERIFIED | `handleSubmit` вызывает `setTimeout(1200)` → `addLight(...)`; тест «зажигает групповой маяк» подтверждает рост `probe-groups` 248→249, `probe-people` неизменно 694, `probe-last` = `{"type":"group","countryId":643}`, сброс всех полей кроме типа, фокус на `#light-form-submit` |
| 5 | Тост `role="status"` «Ваш свет зажжён! Огонёк уже на карте.» закрывается через 4000мс или по клику, при reduced motion — мгновенно | ✓ VERIFIED | `SuccessToast.tsx`/`LiveToast`: `role="status"`, `aria-live="polite"`, автотаймер 4000мс + фаза ухода 200мс, `wantsInstantClose()` для reduced motion; три теста тоста (обычное закрытие, клик, reduced motion) зелёные |
| 6 | Форма не делает сетевых запросов: у `<form>` нет `action`/`method`, `onSubmit` вызывает `preventDefault` | ✓ VERIFIED | `<form className="lf-form" noValidate onSubmit={handleSubmit}>` без `action`/`method`; `event.preventDefault()` в `handleSubmit`; grep `fetch\|axios\|localStorage` по `components/form` = 0 |
| 7 | Новый огонёк реально попадает на карту и в счётчики (не только в форму) | ✓ VERIFIED | `main.tsx` оборачивает `<App />` в единый `LightsProvider`; `MapSection.tsx`, `EsdMap.tsx`, `Counters.tsx` читают тот же `useLights()`; `createLight` в `state/lights.tsx` считает координату внутри границы страны через `geoContains` |
| 8 | Секция `#about` с eyebrow «Глобальное влияние», H2 «Что такое Единый голос 27?» и абзацем про сентябрь 2027/2000-летие крещения | ✓ VERIFIED | `About.tsx` рендерит `Section#about`, `GradientTitle`, `aboutCopy.lead` с точным текстом из 03-CONTEXT; тест About.test.tsx проверяет заголовок, eyebrow, обе подстроки лида |
| 9 | Видео-фасад: постер `img.youtube.com`, кнопка play с `aria-label`, iframe отсутствует до клика; по клику монтируется `youtube-nocookie.com` iframe с `autoplay=1&rel=0`, нужным `allow`, `allowfullscreen`, фокус на iframe; fallback постера при ошибке | ✓ VERIFIED | `VideoEmbed.tsx`: постер `hqdefault.jpg`, `button[aria-label="Смотреть видео: Единый голос 27"]`, `iframe` монтируется только при `active`, `useEffect` вызывает `iframeRef.current?.focus()`, `onError` показывает `.ve-fallback`; 4 теста `VideoEmbed.test.tsx` покрывают все ветки |
| 10 | Три стеклянные карточки «1 Проект / 2 Подготовка / 3 Цель» с градиентными номерами, списками по 3 пункта, разделителем и итогом, тексты совпадают с 03-CONTEXT | ✓ VERIFIED | `about.ts` — тексты дословно совпадают с 03-CONTEXT; `StepCard.tsx` рендерит номер/заголовок/список/`hr`/итог; `about.css` — `font: 900 56px` градиентный номер, `.ab-step-list`, `.ab-step-rule`; тест about.test.ts и About.test.tsx проверяют структуру |
| 11 | `VideoEmbed` не зависит от секции About, переиспользуем фазой 4 | ✓ VERIFIED | `grep -c -E "from \"\.\/About\"\|copy\.about\|data/about" VideoEmbed.tsx` = 0 (по acceptance criteria плана); импортирует только React и `./video-embed.css` |
| 12 | Секция `#involve` с eyebrow «Как включиться», H2 «От убеждения к действию», лидом из 03-CONTEXT | ✓ VERIFIED | `Involve.tsx` рендерит `Section#involve`, `GradientTitle`, `involveCopy.lead`; тест «структура секции» подтверждает |
| 13 | Триптих из трёх карточек «Личное преображение / Материалы для церкви / Делиться» с SVG-иллюстрациями, заголовками и ссылками-действиями | ✓ VERIFIED | `Involve.tsx` мапит `involveCopy.cards` в `InvolveCard` с `art` по `id`; три SVG-файла (2054/1891/2244 байт, каждый < 3072); тест проверяет 3 `h3` в порядке, 3 `article` |
| 14 | Ссылки «Начать путь →» / «Скачать материалы →» / «Узнать, как делиться →» ведут на `#about` / `#resources` / `#news`; кликабельна только ссылка | ✓ VERIFIED | `copy.involve.ts` — `href: "#about"\|"#resources"\|"#news"`; `InvolveCard.tsx` — `onClick` на `article` отсутствует (grep = 0), единственная цель — `<a href>`; тест проверяет href и отсутствие обработчиков на `article` |
| 15 | SVG-иллюстрации декоративны (`aria-hidden`, `role=presentation`, `focusable=false`), без текста/растра, каждая < 3КБ | ✓ VERIFIED | Все три art-файла: `viewBox="0 0 400 300"`, `role="presentation"`, `focusable="false"`; grep `<text\|<image\|<foreignObject\|<script>` = 0 |

**Score:** 15/15 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/validation.ts` | `validateLightForm`, типы, `initialLightFormValues`, `toLightType`, `EMAIL_RE` | ✓ VERIFIED | Все экспорты присутствуют, чистая функция, 78 строк |
| `src/lib/validation.test.ts` | Unit-тесты шести правил | ✓ VERIFIED | Существует, тесты зелёные |
| `src/data/copy.form.ts` | `formCopy` со всеми текстами | ✓ VERIFIED | Содержит «Ваш свет зажжён! Огонёк уже на карте.» и все 6 ошибок |
| `src/components/form/LightForm.tsx` | Секция, состояние, submit, addLight, тост | ✓ VERIFIED | 271 строка, полностью реализовано |
| `src/components/form/LightTypeChoice.tsx` | fieldset с радио-карточками | ✓ VERIFIED | 38 строк, `:has(input:checked)` в CSS |
| `src/components/form/FormField.tsx` | label+control+ошибка с aria | ✓ VERIFIED | 47 строк, render-prop контракт |
| `src/components/form/ConsentCheckbox.tsx` | Кастомный чекбокс | ✓ VERIFIED | 54 строки |
| `src/components/form/SuccessToast.tsx` | Тост с автозакрытием и фазой ухода | ✓ VERIFIED | 112 строк, `data-state`, `prefers-reduced-motion` |
| `src/components/form/LightForm.test.tsx` | Component-тесты формы | ✓ VERIFIED | Полное покрытие: структура, 6 ошибок, blur, успех, тост, reduced motion |
| `src/components/form/light-form.css` | Токены и визуальный контракт формы | ✓ VERIFIED | ≥150 строк, `:has(input:checked)` ×4, все требуемые токены присутствуют |
| `src/data/about.ts` | `aboutSteps` три шага | ✓ VERIFIED | Тексты дословно из 03-CONTEXT, включая «Желание веков» |
| `src/data/copy.about.ts` | `aboutCopy` | ✓ VERIFIED | Содержит `YpLD6p-z00g` |
| `src/components/about/VideoEmbed.tsx` | Фасад YouTube | ✓ VERIFIED | 79 строк, постер/iframe/fallback/фокус реализованы |
| `src/components/about/StepCard.tsx` | Карточка шага | ✓ VERIFIED | 27 строк |
| `src/components/about/About.tsx` | Секция `#about` | ✓ VERIFIED | 34 строки |
| `src/components/about/about.css`, `video-embed.css` | Визуальный контракт | ✓ VERIFIED | `font: 900 56px`, `aspect-ratio: 16/9`, `prefers-reduced-motion`, `!important`=0, `h2`=0 |
| `src/components/about/*.test.tsx`, `src/data/about.test.ts` | Тесты | ✓ VERIFIED | Все зелёные |
| `src/data/copy.involve.ts` | Тексты триптиха | ✓ VERIFIED | Содержит все три `href` |
| `src/components/involve/Involve.tsx` | Секция `#involve` | ✓ VERIFIED | 46 строк |
| `src/components/involve/InvolveCard.tsx` | Карточка | ✓ VERIFIED | 33 строки, `onClick` отсутствует |
| `src/components/involve/art/{Personal,Toolkit,Sharing}Art.tsx` | SVG-иллюстрации | ✓ VERIFIED | 2054/2244/1891 байт, каждая < 3072, без `text`/`image`/`script` |
| `src/components/involve/involve.css` | Визуальный контракт триптиха | ✓ VERIFIED | `aspect-ratio: 4/3`, `repeat(3`, `prefers-reduced-motion`, `h2`=0, `!important`=0 |
| `src/components/involve/Involve.test.tsx` | Тесты секции | ✓ VERIFIED | 5 тестов зелёных |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| `LightForm.tsx` | `state/lights.tsx` | `useLights().addLight` | ✓ WIRED | `addLight({ type: toLightType(values.type), countryId: Number(values.countryId) })` вызывается в таймере успеха |
| `LightForm.tsx` | `lib/validation.ts` | `validateLightForm` на submit и blur/change | ✓ WIRED | Вызывается в `handleSubmit`, `updateField`, `revalidateField` (≥2 раза) |
| `LightForm.tsx` | `data/countries.ts` | опции select | ✓ WIRED | `ESD_COUNTRIES.map(...)`, 12 стран + плейсхолдер |
| `SuccessToast.tsx` | a11y live region | `role=status` | ✓ WIRED | `role="status"` `aria-live="polite"` на портале в `document.body` |
| `lib/validation.ts` | `data/copy.form.ts` | тексты ошибок | ✓ WIRED | `formCopy.errors.*` во всех шести правилах |
| `LightForm.tsx` → `MapSection.tsx`/`Counters.tsx` | общий контекст | `LightsProvider` в `main.tsx` | ✓ WIRED | Оба потребителя читают один и тот же `useLights()`, подтверждено на уровне провайдера верхнего уровня (Data-Flow Trace ниже) |
| `About.tsx` | `VideoEmbed.tsx` | `<VideoEmbed videoId title>` | ✓ WIRED | Рендерится с `aboutCopy.video.id`/`title` |
| `VideoEmbed.tsx` | `youtube-nocookie.com/embed/` | src iframe после клика | ✓ WIRED | Подтверждено тестом и grep |
| `VideoEmbed.tsx` | `img.youtube.com/vi/{id}` | src постера | ✓ WIRED | Подтверждено тестом и grep |
| `About.tsx` | `data/about.ts` | `aboutSteps.map → StepCard` | ✓ WIRED | 1 вхождение |
| `Involve.tsx` | `data/copy.involve.ts` | `involveCopy.cards.map → InvolveCard` | ✓ WIRED | Подтверждено |
| `InvolveCard.tsx` | `#about\|#resources\|#news` | `href={}` | ✓ WIRED | Три ссылки с точными href |
| `Involve.tsx` | `art/*.tsx` | по id карточки | ✓ WIRED | Объект `artById` мапит все три id |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|---------------------|--------|
| `LightForm` → `MapSection`/`Counters` | `lights` / `counts` из `useLights()` | Единый `LightsProvider` в `main.tsx`, оборачивающий `<App />`; `addLight` диспатчит `createLight`, который вычисляет реальную координату внутри границы страны через `geoContains` | Да — `createLight` не возвращает заглушку: координата зависит от количества уже занятых огоньков страны (golden angle), реально мутирует состояние, читаемое обоими потребителями | ✓ FLOWING |
| `EsdMap.tsx` рендер точек | `lights` (prop) | `MapSection.tsx` → `useLights().lights` | Да — `map-lights` группа рендерит `<circle>` по каждому элементу массива, включая только что добавленный | ✓ FLOWING |
| `Counters.tsx` | `counts.people`/`counts.groups` | `useLights().counts`, пересчитывается `useMemo` при каждом изменении `state.lights` | Да, подтверждено ростом `probe-groups` 248→249 в тесте формы | ✓ FLOWING |
| `VideoEmbed` постер/iframe | `videoId`/`title` (props) | `aboutCopy.video` (статичные данные репозитория) | Да, соответствует характеру фичи — видео фиксировано, не требует динамического источника | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Полный набор тестов проходит | `npm test -- --run` | 33 файла, 187 тестов, код 0 | ✓ PASS |
| Продакшен-билд собирается | `npm run build` | `tsc -b && vite build` — код 0, CSS 64.66 kB | ✓ PASS |
| Линт чистый | `npx eslint src` | без вывода, код 0 | ✓ PASS |
| Один именованный тест формы проходит изолированно | `npx vitest run src/components/form -t "зажигает групповой маяк"` | passed | ✓ PASS |
| Нет сетевых вызовов/storage в форме | `grep -rn "fetch(\|axios\|localStorage\|sessionStorage" src/components/form` | 0 совпадений | ✓ PASS |

### Probe Execution

Не применимо: в проекте нет `scripts/*/tests/probe-*.sh`, PLAN/SUMMARY фазы 3 не описывают пробы. Step 7c: SKIPPED (probe-скрипты не обнаружены).

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|--------------|--------|----------|
| FORM-01 | 03-01, 03-04 | Секция с надзаголовком, H2 и выбором типа света | ✓ SATISFIED | Truths 1, 3 |
| FORM-02 | 03-01, 03-04 | Шесть полей и согласие, клиентская валидация на русском | ✓ SATISFIED | Truths 2, 3 |
| FORM-03 | 03-01, 03-04 | Тост, addLight, рост счётчика, сброс формы, без сети | ✓ SATISFIED | Truths 4, 5, 6, 7 |
| ABOUT-01 | 03-02 | Надзаголовок, H2, абзац про 2027/2000-летие | ✓ SATISFIED | Truth 8 |
| ABOUT-02 | 03-02 | Видео-фасад с постером и iframe по клику | ✓ SATISFIED | Truths 9, 11 |
| ABOUT-03 | 03-02 | Три карточки 1/2/3 с текстами оригинала | ✓ SATISFIED | Truth 10 |
| INVOLVE-01 | 03-03 | Надзаголовок, H2, триптих с SVG и ссылками-действиями | ✓ SATISFIED | Truths 12, 13, 14, 15 |

**Проверка полноты:** все 7 ID из `.planning/REQUIREMENTS.md` (раздел «Форма «Зажгите свой свет»», «О проекте», «Участие»), заявленные для Phase 3 в Traceability, покрыты плановыми `requirements:` фронтматтера (03-01: FORM-01..03; 03-02: ABOUT-01..03; 03-03: INVOLVE-01; 03-04 повторно закрывает FORM-01..03 визуальным контрактом). Орфанных требований (заявленных в REQUIREMENTS.md для фазы 3, но не покрытых ни одним PLAN) не найдено.

**Замечание (не блокер):** `.planning/REQUIREMENTS.md` всё ещё показывает чекбоксы `[ ]`/«Pending» для FORM-01..03, ABOUT-01..03, INVOLVE-01, хотя код и тесты подтверждают реализацию. Тот же паттерн документационного лага уже отмечен в 01-VERIFICATION.md — обновление трекинга ожидается отдельным коммитом оркестратора, это не дефект кода фазы 3.

### Anti-Patterns Found

Не найдено. `grep -rn -E "TBD|FIXME|XXX|TODO|HACK|PLACEHOLDER"` по всем файлам `src/components/form`, `src/components/about`, `src/components/involve`, `src/lib/validation.ts`, `src/data/copy.form.ts`, `src/data/copy.about.ts`, `src/data/copy.involve.ts`, `src/data/about.ts` — 0 совпадений. Поиск «placeholder/coming soon/not yet implemented» вне легитимных атрибутов `placeholder=` и текстов copy-модулей — 0 совпадений. `dangerouslySetInnerHTML` — 0 во всех файлах фазы. `!important` и переопределение `h2` в CSS фазы — 0.

### Human Verification Required

См. секцию `human_verification` в frontmatter — 3 пункта, все три перенесены из `<human-check>`-блоков планов 03-02, 03-03, 03-04 (визуальный проход по формы, about и involve на 390/768/1024/1440px, реальные CSS-анимации и hover-состояния). Эти пункты требуют браузера и не проверяются статическим анализом; ни один из них не свидетельствует о незавершённости — вся статически проверяемая логика (тексты, атрибуты, aria, обработчики, CSS-правила, тесты, билд, линт, сквозной поток данных форма→карта→счётчики) подтверждена напрямую.

### Gaps Summary

Блокирующих пробелов не найдено. Все 15 truths, выведенных из 4 ROADMAP Success Criteria и must_haves четырёх PLAN-файлов фазы, подтверждены прямыми доказательствами: 187 тестов зелёные (включая полный сценарий формы на fake timers — 6 ошибок, blur-перепроверка, successful submit, рост счётчика, тост с обычным и reduced-motion закрытием), зелёный билд и линт, сквозная проверка потока данных через общий `LightsProvider` (форма → карта → счётчики — не изолированный мок, а один и тот же React-контекст), точное текстовое соответствие 03-CONTEXT во всех трёх секциях, SVG-иллюстрации в пределах лимита 3КБ без запрещённых элементов. Единственные открытые пункты — три визуальные/браузерные проверки из `<human-check>` планов, которые по инструкции идут в `human_verification`. Статус `human_needed` вместо `passed` — исключительно из-за наличия этих пунктов.

---

_Verified: 2026-09-05T19:20:00Z_
_Verifier: Claude (gsd-verifier)_
