---
phase: 02-hero-and-map
plan: 05
subsystem: ui
tags: [react-hooks, intersection-observer, requestAnimationFrame, accessibility, vitest, fake-timers]

requires:
  - phase: 02-hero-and-map
    provides: "02-02: easeOutCubic, formatCount, usePrefersReducedMotion, LightsProvider с counts"
  - phase: 02-hero-and-map
    provides: "02-03: разметка Counters, классы counter--people и counter--groups, map.css"
provides:
  - "useInViewOnce: однократное срабатывание IntersectionObserver с порогом 0.4 и отключением наблюдателя"
  - "useCountUp: счёт от нуля за 1600ms по easeOutCubic на rAF, мгновенное значение при reduced motion и после проигранной анимации"
  - "Counters: count-up при первом появлении блока в вьюпорте, видимое число скрыто от скринридера, aria-live отдаёт конечное значение"
affects: [03-form-about-involve, 05-motion-and-polish]

tech-stack:
  added: []
  patterns:
    - "Хук анимации хранит долю прохода, а не число: значение считается при рендере, поэтому смена цели после анимации видна сразу и без кадров"
    - "Анимационные эффекты не зовут setState синхронно в теле эффекта: правило react-hooks/set-state-in-effect включено как ошибка"
    - "rAF в тестах подменяется на setTimeout(16ms) поверх vi.useFakeTimers(), время берётся из аргумента кадра"

key-files:
  created:
    - src/lib/useInViewOnce.ts
    - src/lib/useInViewOnce.test.tsx
    - src/lib/useCountUp.ts
    - src/lib/useCountUp.test.tsx
  modified:
    - src/components/map/Counters.tsx
    - src/components/map/Counters.test.tsx

key-decisions:
  - "useCountUp держит в состоянии долю анимации (0..1), число считается при рендере: обходит запрет setState в теле эффекта и даёт мгновенный показ нового значения после добавления огонька"
  - "Цель анимации убрана из зависимостей эффекта: рост счётчика от addLight не перезапускает кадры"
  - "Видимое число получает aria-hidden, а конечное значение живёт в отдельном span.sr-only с aria-live: скринридер не читает промежуточные кадры"
  - "useInViewOnce отдаёт true, когда IntersectionObserver недоступен: без наблюдателя содержимое не прячется"

patterns-established:
  - "TDD по задачам: коммит test(...) с красными тестами, затем feat(...) с реализацией"
  - "Мок IntersectionObserver объявляется в тестовом файле и восстанавливает глобал фазы 1 в afterEach, а не через unstubAllGlobals"

requirements-completed: [MAP-04]

duration: 7min
completed: 2026-09-05
---

# Phase 2 Plan 05: Count-up счётчиков карты Summary

**Счётчики «ЧЕЛОВЕК» и «ГРУПП» досчитывают от нуля до значения за 1600ms по easeOutCubic при первом появлении блока в вьюпорте, при prefers-reduced-motion показывают конечное число сразу, а скринридер получает только конечное значение.**

## Performance

- **Duration:** 7 мин
- **Started:** 2026-09-05T16:03:00Z
- **Completed:** 2026-09-05T16:10:00Z
- **Tasks:** 2 из 2
- **Files modified:** 6 (4 создано, 2 изменено)

## Accomplishments

- `useInViewOnce` создаёт наблюдатель с `{ threshold: 0.4 }`, после первого пересечения зовёт `disconnect()` и больше не возвращается в `false`; без `IntersectionObserver` в окружении сразу отдаёт `true`.
- `useCountUp` крутит кадры через `window.requestAnimationFrame`, снимает их в cleanup, доводит число ровно до цели за 1600ms и не запускает ни одного кадра при `reduced: true` или `active: false`.
- `Counters` подключил оба хука: видимое число (`aria-hidden`) бежит от нуля, соседний `span.sr-only` с `aria-live="polite"` держит конечное значение из контекста. Проверено тестом: после `advanceTimersByTime(1700)` видно `1 150`, при reduced motion то же число без вызовов rAF, после клика «зажечь огонёк» группы становятся `13`.
- Прогоны: `npm test` 160 тестов в 29 файлах зелёные, `npm run build` собрал `dist` за 519ms, `npx eslint` по затронутым файлам без замечаний.

## Task Commits

1. **Task 1: хуки useInViewOnce и useCountUp** — `0cb23a3` (test, красные), `08d424e` (feat)
2. **Task 2: count-up в Counters** — `8ae135e` (test, красные), `3bc4b0e` (feat)

## Files Created/Modified

- `src/lib/useInViewOnce.ts` — однократный IntersectionObserver с порогом по умолчанию 0.4
- `src/lib/useInViewOnce.test.tsx` — 3 теста: отсутствие наблюдателя, пересечение с disconnect, ожидание порога
- `src/lib/useCountUp.ts` — count-up на rAF с easeOutCubic, ветками reduced motion и неактивного старта
- `src/lib/useCountUp.test.tsx` — 5 тестов на фейковых таймерах: reduced, неактивный старт, рост к цели, мгновенная смена цели, снятие кадра
- `src/components/map/Counters.tsx` — хуки, `ref` на `.counters`, разделение видимого числа и объявления для скринридера
- `src/components/map/Counters.test.tsx` — 5 тестов: reduced motion, ноль до вьюпорта, досчёт за 1600ms, подписи и классы, рост после `addLight`

## Decisions Made

- Долю анимации хранит состояние, число собирается при рендере (`Math.round(target * easing(progress))`). Так эффект не зовёт `setValue` синхронно, а новое значение цели видно мгновенно.
- Зависимости эффекта сузились до `[active, duration, reduced]`: смена цели не перезапускает кадры, поэтому огонёк из формы фазы 3 просто увеличивает число.
- Тест добавления огонька дёргает `addLight` через кнопку-потребитель и `fireEvent.click`, а не присваивает колбэк наружу во время рендера: присваивание в рендере нарушает правила чистоты eslint-plugin-react-hooks 7.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Структура useCountUp переписана под правило react-hooks/set-state-in-effect**
- **Found during:** Task 1 (реализация хуков)
- **Issue:** План предписывал `setValue(0)` и `setValue(target)` прямо в теле эффекта. В репозитории правило `react-hooks/set-state-in-effect` включено как ошибка, `npx eslint` падал на `src/lib/useCountUp.ts:35`.
- **Fix:** Состояние хранит долю прохода анимации, отображаемое число считается при рендере: `reduced ? target : Math.round(target * easing(progress))`. Ветки «не активен» и «анимация уже проиграна» перестали нуждаться в setState, `target` ушёл из зависимостей эффекта.
- **Files modified:** src/lib/useCountUp.ts
- **Verification:** `npx eslint src/lib/*.ts` без ошибок; все 8 тестов хуков зелёные, включая мгновенную смену цели после анимации
- **Committed in:** `08d424e`

**2. [Rule 3 - Blocking] Типы моков в тесте useInViewOnce**
- **Found during:** Task 1 (прогон `tsc -b`)
- **Issue:** `ReturnType<typeof vi.fn>` даёт `Mock<Procedure | Constructable>`, который нельзя вызвать: `tsc -b` падал на `spy.observe(target)`.
- **Fix:** Явные сигнатуры `Mock<(target: Element) => void>` и `vi.fn<(target: Element) => void>()`.
- **Files modified:** src/lib/useInViewOnce.test.tsx
- **Verification:** `npx tsc -b` завершается без ошибок
- **Committed in:** `08d424e`

**3. [Rule 3 - Blocking] Стабильный ref в тестах useInViewOnce**
- **Found during:** Task 1 (написание тестов)
- **Issue:** Ref, созданный внутри колбэка `renderHook`, меняет идентичность на каждом рендере и перезапускает эффект, из-за чего `disconnect` вызывался дважды.
- **Fix:** Ref создаётся один раз до `renderHook`.
- **Files modified:** src/lib/useInViewOnce.test.tsx
- **Verification:** Тест «срабатывает при пересечении и сразу отключает наблюдателя» ждёт ровно один `disconnect` и проходит
- **Committed in:** `0cb23a3`

---

**Total deviations:** 3 auto-fixed (3 blocking)
**Impact on plan:** Поведение из плана сохранено полностью, изменилась только внутренняя механика хука и типизация тестов. Расширения объёма нет.

## Issues Encountered

- Тестовый файл `Counters.test.tsx` после генерации содержал литеральный U+202F; символ заменён на escape `\u202F` по соглашению фазы 2 (в исходниках литерального узкого пробела нет).

## Known Stubs

Нет.

## User Setup Required

Нет.

## Next Phase Readiness

- MAP-04 закрыт: значения из состояния, форматирование U+202F, count-up по IntersectionObserver, доступное объявление.
- Фаза 3 может рендерить `Counters` рядом с формой внутри `LightsProvider`: после `addLight` число растёт мгновенно, кадры не перезапускаются.
- Ручная проверка в браузере (`npm run preview`, прокрутка к карте, эмуляция reduced motion) не выполнялась: агент работает без GUI.

---
*Phase: 02-hero-and-map*
*Completed: 2026-09-05*

## Self-Check: PASSED

Все перечисленные файлы существуют, все четыре коммита задач найдены в истории ветки agent-02-05.
