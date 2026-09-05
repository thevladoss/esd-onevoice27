---
phase: 01-scaffold-and-deploy
plan: 04
subsystem: ui
tags: [react, typescript, css, tailwindcss-v4, animation, prefers-reduced-motion, accessibility, vitest]

requires:
  - phase: 01-01
    provides: "copy.footer, Wordmark, токены палитры, keyframes footer-wave-drift и footer-halo-drift, --footer-wedge, композиция App.tsx"
provides:
  - "Footer с клиновидной верхней гранью, градиентом #211a3e → #120c34, четырьмя дрейфующими слоями и гало"
  - "Раскладка footer: вордмарк с подписью слева, внешние ссылки справа от 768px, юридическая строка под разделителем"
  - "Внешние ссылки с target=_blank, rel=noopener noreferrer и скрытой подсказкой о новой вкладке"
  - "Footer.css: распределение слоёв (::after — волны z-index -2, ::before — гало z-index -1, базовый градиент на самом элементе)"
  - "Footer.test.tsx: четыре теста состава, навигации, атрибутов внешних ссылок и отсутствия заголовков"
affects: [01-05, 05-motion-and-polish]

tech-stack:
  added: []
  patterns:
    - "Декоративные слои footer живут в псевдоэлементах с отрицательным z-index внутри isolation: isolate, контент поднят на z-index 1"
    - "Keyframes объявлены один раз в global.css, компонентный CSS только привязывает анимацию"
    - "Локальный блок @media (prefers-reduced-motion: reduce) выключает анимации через animation: none поверх универсального блока global.css"

key-files:
  created:
    - src/components/layout/Footer.css
    - src/components/layout/Footer.test.tsx
  modified:
    - src/components/layout/Footer.tsx

key-decisions:
  - "Базовый градиент остался на самом .site-footer, четыре анимируемых слоя переехали в ::after (z-index -2), гало — в ::before (z-index -1): непрозрачный ::after поверх собственного фона элемента перекрыл бы волны"
  - "Layout-часть Footer.css написана в Task 1 вместе с разметкой, декоративные слои добавлены в Task 2, чтобы каждый коммит собирался"

patterns-established:
  - "Слои footer: элемент = базовый градиент, ::after = четыре волны, ::before = гало (ориентир для MOTION-02 в фазе 5)"
  - "Внешняя ссылка = label + пробел + span.sr-only с подсказкой, чтобы доступное имя читалось «label (откроется в новой вкладке)»"

requirements-completed: [SHELL-04]

duration: 6min
completed: 2026-09-05
---

# Phase 01 Plan 04: Footer с волнами и гало Summary

**Footer оригинала: клин по верхней грани через clip-path, градиент #211a3e → #120c34, четыре дрейфующих слоя в ::after и гало в ::before, вордмарк с подписью, две внешние ссылки с защитой от reverse tabnabbing и юридическая строка.**

## Performance

- **Duration:** 6 мин
- **Started:** 2026-09-05T15:25:40Z
- **Completed:** 2026-09-05T15:31:15Z
- **Tasks:** 2
- **Files modified:** 3 (2 создано, 1 переписан)

## Accomplishments

- Заглушка `<footer />` заменена на ландмарк `contentinfo` с вордмарком, подписью, навигацией «Внешние ссылки» и строкой копирайта; все тексты берутся из `copy.footer`, русских литералов в компоненте нет.
- Обе внешние ссылки открываются в новой вкладке с `rel="noopener noreferrer"` и несут скрытую подсказку «(откроется в новой вкладке)», доступное имя читается как «Евро-Азиатский дивизион (откроется в новой вкладке)».
- Визуальный слой повторяет оригинал: клин `clamp(24px, 3vw, 44px)` по верхней грани, базовый градиент, два гало-пятна и две эллиптические волны с дрейфом 28s, большое размытое гало с дрейфом 22s.
- Локальный блок `prefers-reduced-motion` останавливает обе анимации и возвращает гало в `translateX(-50%)`; в собранном CSS правило стоит после универсального блока `global.css`.

## Task Commits

1. **Task 1 (RED): падающие тесты состава footer** — `09e464f` (test)
2. **Task 1 (GREEN): разметка Footer + базовая раскладка** — `88947e9` (feat)
3. **Task 2: клин, градиент, волны, гало, reduced motion** — `33528a4` (feat)

Рефакторинг после GREEN не понадобился: разметка и стили писались сразу в целевом виде.

## Files Created/Modified

- `src/components/layout/Footer.tsx` — footer с `Wordmark`, подписью, `nav` внешних ссылок и юридической строкой, тексты только из `copy.footer`
- `src/components/layout/Footer.css` — клин верхней грани, базовый градиент, четыре слоя волн в `::after`, гало в `::before`, раскладка в две колонки от 768px, локальный reduced-motion
- `src/components/layout/Footer.test.tsx` — четыре теста: состав ландмарка, две ссылки с ожидаемыми `href`, `target`/`rel`/`sr-only`, отсутствие заголовков

## Decisions Made

- **Распределение слоёв поменяно местами против текста плана.** План предлагал держать четыре анимируемых слоя на самом `.site-footer`, а базовый градиент вынести в `::after` с `z-index: -2`. Внутри `isolation: isolate` псевдоэлемент с отрицательным z-index рисуется поверх собственного фона элемента, поэтому непрозрачный `linear-gradient(180deg, #211a3e, #120c34)` закрыл бы волны. Итог совпал с оригиналом (`docs/research/orig-custom-styles.css`, строки 2486–2552): градиент на элементе, волны и гало в псевдоэлементах.
- **Layout-часть CSS написана в Task 1.** План разрешал создать `Footer.css` в Task 1, если Task 2 идёт отдельным коммитом. Так каждый коммит проходит `npm run build`: разметка не ссылается на несуществующий файл.
- **Гало осталось в `::before`, волны — в `::after`.** Обратный порядок против оригинала (там `::before` — волны), зато совпадает с acceptance-контрактом плана; порядок отрисовки задаёт z-index (-2 волны под -1 гало), а не имена псевдоэлементов.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Базовый градиент перекрывал волны**

- **Found during:** Task 2 (визуальные слои)
- **Issue:** Предложенное планом распределение (`.site-footer` несёт четыре волны, `::after` с `z-index: -2` несёт непрозрачный базовый градиент) прячет волны: внутри `isolation: isolate` псевдоэлементы с отрицательным z-index рисуются поверх фона самого элемента, а не под ним.
- **Fix:** Базовый градиент оставлен на `.site-footer` (`background-image: linear-gradient(180deg, #211a3e, #120c34)`), четыре анимируемых слоя перенесены в `.site-footer::after` (`z-index: -2`, `inset: 0`, `animation: footer-wave-drift 28s linear infinite alternate`). Гало в `::before` (`z-index: -1`) не менялось.
- **Files modified:** `src/components/layout/Footer.css`
- **Verification:** В `dist/assets/index-lLhSewaL.css` правило `site-footer:after` содержит четыре градиента, `background-size: auto, auto, 108% 108%, 112% 112%` и привязку `animation: 28s linear infinite alternate footer-wave-drift`; порядок отрисовки: фон элемента → `::after` (-2) → `::before` (-1) → контент (`z-index: 1`).
- **Committed in:** `33528a4` (коммит Task 2)

**2. [Rule 3 - Blocking] Reduced-motion блок переписан под новое распределение слоёв**

- **Found during:** Task 2
- **Issue:** План выключал анимацию у `.site-footer` и `.site-footer::before`; после переноса волн в `::after` правило перестало бы попадать в анимируемый слой.
- **Fix:** `@media (prefers-reduced-motion: reduce) { .site-footer::before, .site-footer::after { animation: none } .site-footer::before { transform: translateX(-50%) } }`.
- **Files modified:** `src/components/layout/Footer.css`
- **Verification:** В собранном CSS правило `.site-footer:before,.site-footer:after{animation:none}` стоит после универсального блока `global.css`, значит побеждает по порядку.
- **Committed in:** `33528a4` (коммит Task 2)

---

**Total deviations:** 2 auto-fixed (1 баг отрисовки, 1 блокирующая правка reduced motion)
**Impact on plan:** Обе правки внутри тех же двух файлов, ни один acceptance-критерий плана не пострадал, объём не вырос.

## Assumption Drift (advisory)

**Псевдоэлементы footer поменялись ролями против плана**

- **Found during:** Task 2
- **Planned:** `.site-footer` = четыре слоя волн, `::after` = базовый градиент, `::before` = гало (текст `<action>` шага 1–2).
- **Actual:** `.site-footer` = базовый градиент, `::after` = четыре слоя волн, `::before` = гало.
- **Why:** Порядок отрисовки внутри `isolation: isolate` (см. Rule 1 выше). Для фазы 5 (MOTION-02) актуально именно это распределение.

## Issues Encountered

Нет. RED-фаза упала ожидаемо (3 из 4 тестов; тест «нет заголовков» проходил и на пустой заглушке), GREEN закрыл все четыре.

## Verification

Прогнано в worktree `/Users/thevladoss/devs/web/esd_cringe-wt/01-04`:

- `npx vitest run src/components/layout/Footer.test.tsx` — 4 теста, код 0
- `npm test` — 3 файла, 10 тестов, код 0
- `npm run build` — `tsc -b && vite build`, код 0, `dist/assets/index-lLhSewaL.css` 35.76 kB
- `npm run lint` — код 0
- `grep -l 'site-footer' dist/assets/*.css` и `grep -l 'footer-halo-drift' dist/assets/*.css` — оба находят собранный CSS
- `grep -c '@keyframes' src/components/layout/Footer.css` = 0 (keyframes живут в `global.css`)
- `grep -Ec '[А-Яа-яЁё]' src/components/layout/Footer.tsx` = 0, `grep -Ec '<h[1-6]'` = 0
- `grep -c 'target="_blank"'` = `grep -c 'rel="noopener noreferrer"'` = 1 (обе ссылки рендерятся из одного `map`)
- Все 20 строковых acceptance-критериев Task 2 проверены `grep -F`, все найдены

Визуальный smoke в браузере не прогонялся: план его не требует, а `01-05` проверяет опубликованный сайт.

## Threat Model Compliance

- **T-01-10 (reverse tabnabbing):** закрыто. `rel="noopener noreferrer"` на обеих ссылках, проверяется тестом «открывает внешние ссылки в новой вкладке с защитой от reverse tabnabbing».
- **T-01-11 (Referer):** принято как есть, `noreferrer` не передаёт заголовок, адреса статичны и только https.
- **T-01-SC (npm):** пакеты не устанавливались.

## User Setup Required

Нет.

## Next Phase Readiness

- SHELL-04 закрыт: footer в DOM, стилизован, покрыт тестами.
- Оркестратору: план шёл в worktree `agent-01-04`, `STATE.md` и `ROADMAP.md` не трогались.
- Для фазы 5 (MOTION-02) зафиксировано распределение слоёв: `.site-footer` — базовый градиент, `::after` (z-index -2) — четыре волны с `footer-wave-drift`, `::before` (z-index -1) — гало с `footer-halo-drift`.
- Конфликтов с 01-02 и 01-03 нет: план трогал только три файла `src/components/layout/Footer.*`.

---

*Phase: 01-scaffold-and-deploy*
*Completed: 2026-09-05*

## Self-Check: PASSED

- Файлы на месте: `src/components/layout/Footer.tsx`, `Footer.css`, `Footer.test.tsx`, `01-04-SUMMARY.md`
- Коммиты в истории `agent-01-04`: `09e464f`, `88947e9`, `33528a4`
- `git diff 763c8c3..HEAD --name-only` содержит только три файла footer: `STATE.md` и `ROADMAP.md` не тронуты
