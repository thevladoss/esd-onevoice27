---
phase: 01-scaffold-and-deploy
plan: 02
subsystem: ui
tags: [react, typescript, tailwindcss-v4, design-system, vitest, testing-library, accessibility]

requires:
  - phase: 01-01
    provides: "copy.ts, токены @theme, утилита glass, App.tsx с восемью секциями, setup.ts с jsdom-моками"
provides:
  - "Примитивы src/components/layout/: Section, Eyebrow, GradientTitle, Button, GlassCard"
  - "Классы-хуки .gradient-title, .gradient-title--section, .gradient-title--hero, .btn, .btn--primary, .btn--ghost, .glass-card, .glass-card--interactive в primitives.css"
  - "Восемь секций-заглушек с надзаголовком, градиентным заголовком и телом в GlassCard"
  - "Единственный h1 страницы и primary-CTA «Зажечь свой свет» на #light-form в hero"
  - "Тесты primitives.test.tsx (12) и placeholders.test.tsx (33), проверка .glass-card в App.test.tsx"
affects: [01-05, 02-hero-and-map, 03-content-sections, 04-resources-and-quote, 05-motion-and-polish]

tech-stack:
  added: []
  patterns:
    - "Один примитив на файл, один именованный экспорт, типы через import type"
    - "Псевдоэлементы и градиенты живут в primitives.css, раскладка и отступы — на утилитах Tailwind"
    - "Стекло (фон, рамка, радиус, тень, backdrop-filter) приходит из утилиты glass, primitives.css его не дублирует"
    - "Полиморфный компонент: тег через проп as, атрибуты пробрасываются через rest"
    - "Заглушка секции = Section + GlassCard + один абзац из copy.ts, без русских литералов в компонентах"

key-files:
  created:
    - src/components/layout/Section.tsx
    - src/components/layout/Eyebrow.tsx
    - src/components/layout/GradientTitle.tsx
    - src/components/layout/Button.tsx
    - src/components/layout/GlassCard.tsx
    - src/components/layout/primitives.css
    - src/components/layout/primitives.test.tsx
    - src/components/placeholders.test.tsx
  modified:
    - src/components/hero/Hero.tsx
    - src/components/map/MapSection.tsx
    - src/components/form/LightForm.tsx
    - src/components/about/About.tsx
    - src/components/involve/Involve.tsx
    - src/components/news/News.tsx
    - src/components/resources/Resources.tsx
    - src/components/quote/Quote.tsx
    - src/App.test.tsx

key-decisions:
  - "Стили кнопки целиком в primitives.css: фаза 2 добавляет вращающийся луч через .btn--primary::before в том же файле, не трогая Button.tsx"
  - "Hero держит h1 через GradientTitle as=\"h1\" variant=\"section\": вариант hero объявлен и покрыт тестом, но включает его фаза 2 вместе с полноэкранным hero"
  - "Button собран на одном приведении типа props к ButtonOwnProps & { as?: \"a\" | \"button\" }: TS-контракт остаётся union'ом, а рантайм не плодит неиспользуемых переменных под no-unused-vars"
  - ".btn--primary получил border: 0, иначе нативный <button> рисует рамку UA поверх градиента"
  - "Section заворачивает children в div.mt-6: зазор 24px после заголовка задан один раз в примитиве, секции его не повторяют"

patterns-established:
  - "Насыщенность 900 живёт только в .gradient-title (плюс вордмарк из 01-01); в кнопках и меню её нет"
  - "Тело заглушки: p.font-body.text-base.leading-[1.6].text-paper/72 внутри GlassCard с max-w-[60ch]"
  - "Тесты заглушек табличные: список из восьми пар (компонент, ключ copy) прогоняется одним циклом"

requirements-completed: [SHELL-05]

duration: 7min
completed: 2026-09-05
---

# Phase 01 Plan 02: Каркас и деплой Summary

**Пять примитивов дизайн-системы (Section, Eyebrow, GradientTitle, Button, GlassCard) на классах-хуках из primitives.css и восемь секций-заглушек, где тело каждой лежит в стеклянной карточке, а hero держит единственный h1 и пилюлю «Зажечь свой свет» на #light-form.**

## Performance

- **Duration:** 7 мин
- **Started:** 2026-09-05T15:27:30Z
- **Completed:** 2026-09-05T15:34:30Z
- **Tasks:** 2 (обе по циклу RED → GREEN, 4 коммита)
- **Files modified:** 17

## Accomplishments

- Фазы 2–4 получили готовый контракт оформления: пять примитивов с классами `.gradient-title*`, `.btn*`, `.glass-card*` и 12 тестов на их поведение.
- Посетитель видит восемь секций с надзаголовком, градиентным заголовком и стеклянной карточкой: `npm test` подтверждает не меньше восьми `.glass-card` на странице и по одной в каждой секции.
- Hero даёт единственный `h1` «Вместе, единым голосом» и primary-кнопку «Зажечь свой свет» с `href="#light-form"` внутри той же карточки, что и текст.
- Прогон: `npm test` — 4 файла, 52 теста, код 0; `npm run build` — код 0 (`dist/assets/index-BdVwP2jD.css`, 35.73 kB); `npm run lint` — код 0.
- В собранном CSS присутствуют `gradient-title--section`, `gradient-title--hero`, `btn--primary`, `glass-card`, а также утилиты `min-h-[40vh]`, `max-w-[60ch]`, `max-w-[72rem]` и `color-mix(in oklab, var(--color-paper) 72%, transparent)`.

## Task Commits

1. **Task 1: Примитивы (RED)** — `456de0f` (test) — 12 падающих проверок примитивов
2. **Task 1: Примитивы (GREEN)** — `cfc1a9b` (feat) — Section, Eyebrow, GradientTitle, Button, GlassCard, primitives.css
3. **Task 2: Заглушки (RED)** — `5843678` (test) — placeholders.test.tsx и проверка `.glass-card` в App.test.tsx, 19 падающих проверок
4. **Task 2: Заглушки (GREEN)** — `0466986` (feat) — восемь секций с телом в GlassCard и CTA в hero

Рефакторинг не понадобился: реализация прошла тесты без переписывания.

## Экспорты примитивов (контракт для фаз 2–4)

```ts
// src/components/layout/Section.tsx
export function Section(props: {
  id: SectionId; eyebrow?: string; title?: string; children?: ReactNode; className?: string;
}): ReactElement;
// <section id className> > div.mx-auto.max-w-[72rem].px-4.py-16.md:px-8.md:py-24
// eyebrow → <Eyebrow>, title → <GradientTitle as="h2" variant="section" className="mt-2">, children → div.mt-6

// src/components/layout/Eyebrow.tsx
export function Eyebrow(props: { children: ReactNode; className?: string }): ReactElement;
// <p class="eyebrow font-body text-xs font-bold uppercase tracking-[0.1em] leading-[1.4] text-horizon-200">

// src/components/layout/GradientTitle.tsx
export function GradientTitle(props: {
  as: "h1" | "h2"; variant: "hero" | "section"; children: ReactNode; className?: string;
}): ReactElement;
// class="gradient-title gradient-title--{variant} font-display"

// src/components/layout/Button.tsx
type ButtonOwnProps = { variant?: "primary" | "ghost"; className?: string; children: ReactNode };
export function Button(
  props:
    | (ButtonOwnProps & { as: "a" } & ComponentPropsWithoutRef<"a">)
    | (ButtonOwnProps & { as?: "button" } & ComponentPropsWithoutRef<"button">),
): ReactElement;
// class="btn btn--{variant ?? primary}"; без as → <button type={type ?? "button"}>

// src/components/layout/GlassCard.tsx
export function GlassCard(props: {
  children: ReactNode; className?: string; interactive?: boolean; as?: "div" | "article" | "li";
}): ReactElement;
// class="glass-card glass p-6 md:p-8 [glass-card--interactive]"
```

`primitives.css` импортируется из `GradientTitle.tsx`, `Button.tsx` и `GlassCard.tsx`; Vite дедуплицирует импорт. `Section.tsx` и `Eyebrow.tsx` обходятся утилитами Tailwind.

## Что оставлено фазе 2

- **Луч по границе кнопки.** `.btn--primary` в фазе 1 статичный: градиент `--gradient-action`, тень `--shadow-button` плюс `inset 0 0 0 1px rgb(255 255 255 / .12)`, hover `translateY(-2px)`. Вращающийся луч (`conic-gradient` плюс `@property --beam` из оригинала, строки 2839–2900 `docs/research/orig-custom-styles.css`) фаза 2 добавляет через `.btn--primary::before` в этом же `primitives.css`, не трогая `Button.tsx`.
- **Вариант hero у заголовка.** `.gradient-title--hero` уже содержит стопы градиента оригинала (`--ov-hero-title-gradient`, 12 стопов), `clamp(2.75rem, 8vw, 4.5rem)`, letter-spacing -0.055em, line-height 0.94 и покрыт тестом. Hero фазы 1 использует `GradientTitle as="h1" variant="section"`, чтобы заголовок не разъезжался в секции высотой 40vh; фаза 2 меняет один проп на `variant="hero"`.
- **Тело секций.** Восемь абзацев из `copy.sections.*.body` — точка замены для фаз 2–4. Обёртка (`Section` + `GlassCard`) остаётся.

## Files Created/Modified

- `src/components/layout/Section.tsx` — секция с id, надзаголовком, h2 и контентной шириной 72rem
- `src/components/layout/Eyebrow.tsx` — микротекст надзаголовка, `p.eyebrow`, цвет horizon-200
- `src/components/layout/GradientTitle.tsx` — h1/h2 с градиентом через `background-clip: text`
- `src/components/layout/Button.tsx` — полиморфная пилюля `a`/`button`, варианты primary и ghost
- `src/components/layout/GlassCard.tsx` — стеклянная карточка с внутренним светом в `::before`
- `src/components/layout/primitives.css` — классы `.gradient-title*`, `.btn*`, `.glass-card*`
- `src/components/layout/primitives.test.tsx` — 12 тестов примитивов
- `src/components/placeholders.test.tsx` — 33 теста восьми заглушек, h1 и CTA
- `src/components/{hero/Hero,map/MapSection,form/LightForm,about/About,involve/Involve,news/News,resources/Resources,quote/Quote}.tsx` — заглушки с телом в GlassCard
- `src/App.test.tsx` — добавлен тест «показывает стеклянные карточки во всех секциях»

## Decisions Made

- **Луч кнопки живёт в CSS, а не в JSX.** `Button.tsx` не знает про декоративные слои: фаза 2 дописывает `.btn--primary::before` и не ломает контракт пропсов.
- **Hero пока на `variant="section"`.** Размер hero-градиента (до 4.5rem) рассчитан на полноэкранный блок фазы 2; в заглушке 40vh он давит на карточку.
- **`border: 0` у `.btn--primary`.** Нативный `<button>` иначе рисует рамку UA поверх градиента; у ссылки этой проблемы нет, поэтому правило точечное.
- **Приведение типа внутри `Button`.** Публичный тип остаётся union'ом из плана, а внутри одно приведение к `ButtonOwnProps & { as?: "a" | "button" }` даёт rest-спред без переменных-пустышек, которые ловит `@typescript-eslint/no-unused-vars`.
- **`div.mt-6` вокруг children в `Section`.** Зазор 24px после заголовка задан в примитиве; восемь секций не повторяют отступ у себя.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] `.btn--primary` получил `border: 0`**

- **Found during:** Task 1 (примитивы)
- **Issue:** План перечислил фон, тень и padding, но не сбросил рамку. Нативный `<button>` в варианте primary отрисовал бы дефолтную рамку браузера поверх градиента `--gradient-action`; у `a` этого дефекта нет, поэтому в тестах он бы не всплыл.
- **Fix:** В `.btn--primary` добавлено `border: 0`. `.btn--ghost` рамку задаёт сам (`1.5px solid var(--glass-border)`), его правило не тронуто.
- **Files modified:** `src/components/layout/primitives.css`
- **Verification:** `npm run build` код 0, `npm test` 52 теста зелёные; в `dist/assets/*.css` правило присутствует.
- **Committed in:** `cfc1a9b` (коммит Task 1)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Правка на одну строку CSS, контракт пропсов и классов не изменился. Расширения объёма нет.

## Assumption Drift (advisory)

Нет: рабочие допущения совпали с планом и UI-SPEC.

## Known Stubs

Заглушки предусмотрены планом и UI-SPEC (раздел «Заглушки секций»), фазы 2–4 заменяют только тело:

| Файл | Что заглушка | Кто заменит |
|---|---|---|
| `src/components/hero/Hero.tsx` | абзац `copy.sections.hero.body` и `variant="section"` у h1 | фаза 2 |
| `src/components/map/MapSection.tsx` | абзац вместо карты дивизиона | фаза 2 |
| `src/components/form/LightForm.tsx` | абзац вместо формы «зажечь свет» | фаза 2 |
| `src/components/about/About.tsx` | абзац вместо рассказа и видео | фаза 3 |
| `src/components/involve/Involve.tsx` | абзац вместо трёх путей участия | фаза 3 |
| `src/components/news/News.tsx` | абзац вместо ленты новостей | фаза 3 |
| `src/components/resources/Resources.tsx` | абзац вместо материалов и музыки | фаза 4 |
| `src/components/quote/Quote.tsx` | абзац вместо цитаты | фаза 4 |

Формулировок «скоро», «coming soon», «TODO» и «lorem» нет: тест «говорит, что появится, без извиняющихся формулировок» проверяет это для каждой из восьми секций.

## Issues Encountered

- Тип `React.ReactElement` в `placeholders.test.tsx` не резолвился без импорта (в проекте `jsx: react-jsx`, глобального `React` нет). Заменён на `import type { ReactElement } from "react"` до коммита RED; `npx tsc -b` после правки чистый.

## User Setup Required

None — внешние сервисы не подключались.

## Next Phase Readiness

- Фаза 2 берёт `GradientTitle variant="hero"` и `.btn--primary::before` готовыми; менять `Button.tsx` и `GlassCard.tsx` не потребуется.
- Волна 2 закрыта только со стороны этого плана: якоря меню (`#about`, `#involve`, `#news`, `#resources`) ведут в секции с реальными заголовками, но прокрутку и подсветку пунктов даёт Header из плана 01-03.
- Файлы планов 01-01, 01-03 и 01-04 не тронуты: `git diff --name-only` по ветке `agent-01-02` показывает только примитивы, восемь секций, два файла тестов и `src/App.test.tsx`.

---
*Phase: 01-scaffold-and-deploy*
*Completed: 2026-09-05*

## Self-Check: PASSED

- 18 файлов из списка созданы или изменены и лежат на диске.
- Четыре коммита (`456de0f`, `cfc1a9b`, `5843678`, `0466986`) есть в истории ветки `agent-01-02`.
- `git diff --name-only` от базы ветки: 17 файлов, все из зоны этого плана; `STATE.md`, `ROADMAP.md` и файлы планов 01-01, 01-03, 01-04 не тронуты.
