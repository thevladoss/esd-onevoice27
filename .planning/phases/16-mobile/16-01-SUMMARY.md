---
phase: 16-mobile
plan: 01
subsystem: ui
tags: [mobile, tap-target, footer, form, news, header, css, vitest]

requires:
  - phase: 12-footer-column
    provides: столбик ссылок футера и подпись вордмарка clamp(.625rem, 1.1vw, .8125rem)
  - phase: 09-form-original
    provides: блок «Согласие» в light-form.css и компонент ConsentCheckbox с label htmlFor
  - phase: 10-news-media
    provides: карточка новостей 16:9 с кропом coverZoom/coverPosition
provides:
  - цели касания 44px у ссылок футера и label согласия
  - проп priority у NewsCard и передача приоритета первой карточке первой страницы
  - width/height/decoding у всех обложек новостей
  - единый кегль подписи логотипа .625rem в шапке
affects: [17-ship, аудит целей касания SHIP-03, замер LCP ленты новостей]

tech-stack:
  added: []
  patterns:
    - цель касания задаётся боксом ссылки (min-height + inline-flex), а не отступами списка
    - приоритет загрузки картинки приходит пропом от контейнера списка, карточка его не вычисляет
    - значения CSS проверяются чтением файла через readFileSync (vitest настроен с css: false)

key-files:
  created: []
  modified:
    - src/components/layout/Footer.css
    - src/components/layout/Footer.test.tsx
    - src/components/form/light-form.css
    - src/components/form/ConsentCheckbox.tsx
    - src/components/form/LightForm.test.tsx
    - src/components/news/NewsCard.tsx
    - src/components/news/News.tsx
    - src/components/news/NewsCard.test.tsx
    - src/components/news/News.test.tsx
    - src/components/layout/Header.css
    - src/components/layout/Header.test.tsx

key-decisions:
  - "Шаг столбца ссылок футера вырос с 30,4px до 44px: gap: 0 ставит боксы встык, отрицательных margin нет, касание по краю остаётся в своей ссылке"
  - "Переопределение подписи логотипа в медиаблоке 768px удалено: базовое значение совпало с десктопным, каскад отдаёт .625rem на всех ширинах"
  - "Разметка ConsentCheckbox не менялась: label уже несла htmlFor, нажатие по тексту работает нативно, изменился только JSDoc"
  - "Хелпер renderCard в NewsCard.test.tsx принял второй параметр priority вместо отдельного вызова render"

patterns-established:
  - "Цель касания описывается в CSS блоком элемента-ссылки, а список отвечает только за раскладку"
  - "Проп приоритета загрузки живёт в зоне фазы: News.tsx решает, NewsCard.tsx исполняет"

requirements-completed: [MOB-01, MOB-02, MOB-03, MOB-04]

duration: 9min
completed: 2026-09-06
---

# Phase 16 Plan 01: Мобильная адаптация Summary

**Четыре находки аудита 390×844 закрыты: ссылки футера и label согласия стали боксами 44px, обложки новостей получили `width`/`height` и приоритет у первой карточки первой страницы, подпись логотипа в шапке выросла с 9px до 10px.**

## Performance

- **Duration:** ~9 мин
- **Started:** 2026-09-06T15:38:00Z
- **Completed:** 2026-09-06T15:47:00Z
- **Tasks:** 4
- **Files modified:** 11

## Accomplishments

- Ссылка `.site-footer__links a` описана как `display: inline-flex; align-items: center; min-height: 44px; padding-inline: 8px`; список получил `gap: 0`, строки `gap: 8px` в `Footer.css` больше нет (`grep -c` → 0). Отрицательных `margin` не появилось: боксы 44px стоят встык, шаг столбца вырос с 30,4px до 44px.
- Label согласия `.lf-check` стала `min-height: 44px; display: flex; align-items: center; gap: 12px`, чекбокс `.lf-checkbox` — 20×20 с `margin: 0` вместо 18×18 с `margin: 2px 0 0`. Разметка `ConsentCheckbox.tsx` осталась прежней, поменялся только JSDoc: label уже связана через `htmlFor`, поэтому клик по тексту переключает чекбокс нативно (новый тест это фиксирует).
- Каждый `<img>` карточки новостей несёт `width="480" height="360" decoding="async"`. Первая карточка первой страницы грузится `loading="eager"` с `fetchpriority="high"`, остальные пять и все три карточки второй страницы — `lazy` без приоритета. Классы `object-cover object-center`, `coverZoom`, `coverPosition` и `news.css` не изменились.
- Подпись «МИССИЯ ДЛЯ ВСЕХ» в шапке переведена на `font-size: .625rem` с прежним `letter-spacing: .16em`; переопределение внутри `@media (width >= theme(--breakpoint-desktop))` удалено, в файле осталось одно правило `.site-header .wordmark__tagline` (`grep -c` → 1), строки `.5625rem` нет (`grep -c` → 0).
- Тестов стало на 7 больше: 10 в `Footer.test.tsx`, 40 в `LightForm.test.tsx`, 16 в `NewsCard.test.tsx`, 15 в `News.test.tsx`, 41 в `Header.test.tsx`. Полный набор — 511 тестов в 50 файлах (было 504).

## Task Commits

Коммитов исполнитель не делал: по указанию оркестратора все изменения оставлены в рабочем дереве worktree `esd_cringe-wt/16` (ветка `agent-16`), слияние за оркестратором.

1. **Task 1: Ссылки футера как цели касания 44px** — без коммита, файлы `Footer.css`, `Footer.test.tsx`
2. **Task 2: Label согласия 44px и чекбокс 20×20 (TDD)** — без коммита, файлы `light-form.css`, `ConsentCheckbox.tsx`, `LightForm.test.tsx`
3. **Task 3: Размеры и приоритет обложек новостей (TDD)** — без коммита, файлы `NewsCard.tsx`, `News.tsx`, `NewsCard.test.tsx`, `News.test.tsx`
4. **Task 4: Подпись логотипа .625rem** — без коммита, файлы `Header.css`, `Header.test.tsx`

## Files Created/Modified

- `src/components/layout/Footer.css` — `.site-footer__links ul` с `gap: 0`, `.site-footer__links a` как `inline-flex` 44px с `padding-inline: 8px`; комментарий объясняет рост шага столбца до 44px и запрет перекрытия боксов
- `src/components/layout/Footer.test.tsx` — в тесте столбика ожидание `"gap: 8px"` заменено на `"gap: 0;"`, добавлен тест «даёт ссылкам цель касания 44px без перекрытия боксов» (блоки ссылки и списка, запрет `inline-block`/`margin-block`/`margin-top`/`margin-bottom`, подпись вордмарка футера)
- `src/components/form/light-form.css` — блок «Согласие»: label 44px по центру с `gap: 12px`, чекбокс 20×20 без отступов
- `src/components/form/ConsentCheckbox.tsx` — только JSDoc: label служит целью касания 44px, связь через `htmlFor` переключает чекбокс без своего обработчика
- `src/components/form/LightForm.test.tsx` — тест «переключает согласие по нажатию на текст label» (клик по `.lf-check-text` включает и выключает чекбокс, `for` совпадает с id) и тест «даёт согласию цель касания 44px» по тексту CSS
- `src/components/news/NewsCard.tsx` — сигнатура `NewsCard({ item, priority = false })`, у `<img>` появились `width={480}`, `height={360}`, `loading={priority ? "eager" : "lazy"}`, `fetchPriority={priority ? "high" : undefined}`
- `src/components/news/News.tsx` — `result.items.map((item, index) => …)` с `priority={result.page === 1 && index === 0}` и комментарием, почему приоритет только на первой странице
- `src/components/news/NewsCard.test.tsx` — хелпер `renderCard(item, priority)`, describe «NewsCard: атрибуты обложки» с двумя тестами (по умолчанию и с приоритетом, кроп 2,41:1 сохранён)
- `src/components/news/News.test.tsx` — из теста «держит обложку декоративной…» убрана строка про `loading="lazy"`, добавлен тест «грузит обложку первой карточки первой страницы с приоритетом» с проверкой второй страницы
- `src/components/layout/Header.css` — базовое правило подписи на `.625rem`, переопределение в медиаблоке 768px удалено, комментарий про порог читаемости
- `src/components/layout/Header.test.tsx` — тест «держит подпись логотипа на .625rem с прежним трекингом на любой ширине» (ровно одно правило, значения, отсутствие `.5625rem`)

Файлы `Footer.tsx`, `Header.tsx`, `Wordmark.tsx`, `LightForm.tsx`, `FormField.tsx`, `news.css`, `src/styles/global.css`, `src/components/map/*`, `src/components/hero/*`, `src/App.seams.test.tsx`, `package.json`, `package-lock.json` не тронуты.

## Verification (наблюдаемые результаты)

- `npx vitest run src/components/layout src/components/form src/components/news src/App.seams.test.tsx` — 13 файлов, 183 теста, все зелёные.
- `npx vitest run` (полный набор) — 50 файлов, 511 тестов, все зелёные.
- `npx tsc -b` — exit 0.
- `npm run lint` — exit 0, без предупреждений.
- Пофазные прогоны: `Footer.test.tsx` 10/10; `LightForm.test.tsx` + `App.seams.test.tsx` 43/43; `src/components/news` 30/30; `Header.test.tsx` + `Wordmark.test.tsx` 48/48.
- RED-фазы TDD наблюдались: до правки `light-form.css` тест «даёт согласию цель касания 44px» падал на `min-height: 44px` (1 failed / 37 passed); до правки `NewsCard.tsx` падали три теста атрибутов обложки (3 failed / 27 passed).
- `grep -c "gap: 8px" src/components/layout/Footer.css` → 0; `grep -c "5625rem" src/components/layout/Header.css` → 0; `grep -c "wordmark__tagline" src/components/layout/Header.css` → 1; блок `.lf-section {` выведен целиком, `background` в нём нет.
- `git diff --diff-filter=D --name-only` — пусто, файлов не удалено.
- `git status --short` показывает ровно одиннадцать файлов из `files_modified` плюс неотслеживаемый симлинк `node_modules`, созданный оркестратором при подготовке worktree.
- Визуальная приёмка на 390×844 (аудит целей касания, шаг столбца, кегль подписи) в этой фазе не выполнялась: по плану её делает фаза 17 (SHIP-03). `npm run build` и `node scripts/check-dist.mjs` не запускались — гейт сборки за фазой 17.

## Decisions Made

- Шаг столбца ссылок футера поднят до 44px вместо сохранения прежних 30,4px: удержать старый шаг при боксе 44px можно было бы только перекрытием соседей на 13,6px, а перекрытие уводит касание по краю бокса в соседнюю ссылку (угроза T-16-04 в модели плана).
- Переопределение `.site-header .wordmark__tagline` внутри медиаблока 768px удалено, а не оставлено дублем: базовое значение теперь совпадает с десктопным, и тест требует ровно одно правило.
- Хелпер `renderCard` в `NewsCard.test.tsx` получил второй параметр `priority = false` вместо отдельного вызова `render` в новых тестах: существующие вызовы остались без изменений.

## Deviations from Plan

None — план выполнен как написан.

## Assumption Drift (advisory)

- **Найдено в Task 2.** План строил задачу по циклу TDD с ожиданием красной фазы на обоих новых тестах. Тест «переключает согласие по нажатию на текст label» прошёл сразу: разметка `ConsentCheckbox.tsx` уже несла `label.lf-check[htmlFor]`, и план сам запрещал её менять. Красную фазу дал только CSS-тест целей касания. Поведение зафиксировано тестом, работа не менялась.

## Issues Encountered

None — гейт прошёл с первого прогона после каждой задачи.

## User Setup Required

None — внешние сервисы не настраиваются, пакеты не устанавливались.

## Next Phase Readiness

- Ветка `agent-16` готова к слиянию: полный `npx vitest run`, `npx tsc -b` и `npm run lint` зелёные, коммитов нет, изменения лежат в рабочем дереве worktree.
- Для SHIP-03 фазы 17: на 390×844 проверять высоту ссылок футера (44px, боксы встык без перекрытия), высоту label согласия (44px) и кегль подписи логотипа (10px); аудит целей касания не должен находить элементов ниже 44px, кроме визуально скрытых radio.
- Стык с фазой 15 закрыт: `App.seams.test.tsx` не правился и зелёный, блок `.lf-section` остался без `background`.

## Threat Flags

Новых поверхностей вне `<threat_model>` плана не появилось: хост обложек (`img.youtube.com`) прежний, обработчиков в разметке согласия не добавлено, сеть и хранилища не затронуты.

## Self-Check: PASSED

- Файлы на месте: все одиннадцать из `files_modified` присутствуют в worktree и числятся изменёнными в `git status --short`.
- Коммитов нет по указанию оркестратора, поэтому проверка хешей не применима; вместо неё сверены дифф (`git diff --stat`, 198 вставок / 23 удаления в 11 файлах) и отсутствие удалённых файлов.

---
*Phase: 16-mobile*
*Completed: 2026-09-06*
