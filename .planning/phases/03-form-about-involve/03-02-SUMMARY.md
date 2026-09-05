---
phase: 03-form-about-involve
plan: 02
subsystem: ui
tags: [about, youtube, lite-embed, react, css, accessibility, vitest]

requires:
  - phase: 01-02
    provides: "Примитивы Section, Eyebrow, GradientTitle, GlassCard; primitives.css; токены @theme и утилита glass"
  - phase: 01-01
    provides: "copy.ts с ключом sections.about, setup.ts с jsdom-моками, vitest c css: false"
provides:
  - "Секция #about: eyebrow, H2 через GradientTitle, лид о сентябре 2027 года, видео-фасад и три карточки шагов"
  - "Переиспользуемый VideoEmbed({ videoId, title, className? }) для фазы 4: постер img.youtube.com, iframe youtube-nocookie по клику, заглушка при ошибке постера"
  - "StepCard({ number, title, items, summary }) на GlassCard с градиентным номером и разделителем"
  - "Данные aboutSteps в src/data/about.ts и тексты aboutCopy в src/data/copy.about.ts"
  - "CSS-контракт .ab-* и .ve-* в about.css и video-embed.css"
affects: [04-resources-and-quote, 05-motion-and-polish]

tech-stack:
  added: []
  patterns:
    - "Видео подключается фасадом: сторонний iframe монтируется только после клика, внешних скриптов нет"
    - "Тексты секции лежат в отдельном src/data/copy.<section>.ts, общий copy.ts не растёт"
    - "CSS секции живёт рядом с компонентом и импортируется из него; примитивы фазы 1 не переопределяются"

key-files:
  created:
    - src/data/about.ts
    - src/data/about.test.ts
    - src/data/copy.about.ts
    - src/components/about/VideoEmbed.tsx
    - src/components/about/VideoEmbed.test.tsx
    - src/components/about/StepCard.tsx
    - src/components/about/About.test.tsx
    - src/components/about/about.css
    - src/components/about/video-embed.css
  modified:
    - src/components/about/About.tsx

key-decisions:
  - "title ролика — «Единый голос 27»: контракт VideoEmbed даёт один title и на кнопку, и на iframe, поэтому суффикс «: видео о проекте» из UI-SPEC не применяется; aria-label кнопки совпадает с зафиксированным в 03-CONTEXT «Смотреть видео: Единый голос 27»"
  - "Фон секции задан прямо на .ab-section без псевдоэлемента и 100vw: примитив Section держит max-width на внутреннем div, сам <section> уже во всю ширину main"
  - "Заглушка постера получает aria-hidden=\"true\": название ролика уже озвучено через aria-label кнопки play, второй раз читать его не нужно"
  - "Номер шага живёт в span.ab-step-num рядом с h3, а не внутри заголовка: доступное имя заголовка остаётся «Проект», «Подготовка», «Цель»"
  - "Постер берём сразу hqdefault.jpg (480×360, 7 КБ) вместо maxresdefault с каскадом fallback: одна сетевая попытка, onError сразу показывает градиентную заглушку"

patterns-established:
  - "Фасад стороннего видео: состояние active + posterFailed, useEffect переводит фокус на смонтированный iframe"
  - "Классы разметки секции пишутся по префиксу секции (.ab-*), собственные переменные компонента объявляются на его корне (--ve-ring, --ve-transition)"

requirements-completed: [ABOUT-01, ABOUT-02, ABOUT-03]

duration: 7min
completed: 2026-09-05
---

# Phase 3 Plan 02: Секция «Что такое Единый голос 27?» Summary

**Секция #about с лидом о сентябре 2027 года, фасадом YouTube (постер hqdefault → iframe youtube-nocookie по клику, фокус на iframe, градиентная заглушка при ошибке постера) и тремя стеклянными карточками шагов из src/data/about.ts.**

## Performance

- **Duration:** 7 мин
- **Started:** 2026-09-05T15:45:40Z
- **Completed:** 2026-09-05T15:52:05Z
- **Tasks:** 3
- **Files modified:** 10 (9 создано, 1 переписан)

## Accomplishments

- Заглушка About фазы 1 заменена на секцию из трёх блоков: текст (eyebrow, H2 через `GradientTitle variant="section"`, лид), видео-фасад, три карточки шагов.
- `VideoEmbed` не зависит ни от секции, ни от данных: фаза 4 импортирует его напрямую для 16 роликов раздела «Ресурсы».
- До клика страница не обращается к YouTube никак, кроме статичного постера; iframe с `allow="autoplay; encrypted-media; picture-in-picture"` и `referrerPolicy="strict-origin-when-cross-origin"` монтируется только по действию пользователя (T-03-06, T-03-07).
- 9 тестов покрывают данные, фасад (включая `onError` постера) и разметку секции.

## Task Commits

1. **Task 1: красные тесты данных, фасада и секции** — `fc18e73` (test)
2. **Task 2: данные, тексты, VideoEmbed, StepCard, About** — `6b8238e` (feat)
3. **Task 3: визуальный контракт секции и фасада** — `748f329` (style)

## Files Created/Modified

- `src/data/copy.about.ts` — `aboutCopy`: eyebrow, H2, лид, `video: { id: "YpLD6p-z00g", title: "Единый голос 27" }`
- `src/data/about.ts` — `AboutStep` и `aboutSteps`: три шага, по три пункта и итогу, тексты из 03-CONTEXT
- `src/data/about.test.ts` — порядок номеров, заголовки, длина списков, литеральный итог первого шага
- `src/components/about/VideoEmbed.tsx` — фасад: постер `hqdefault.jpg`, скрим, кнопка play 72px, `iframe` nocookie по клику, фокус на iframe, заглушка при `onError`
- `src/components/about/VideoEmbed.test.tsx` — 4 теста: постер без iframe, монтирование iframe, fallback постера, проброс `className`
- `src/components/about/StepCard.tsx` — `GlassCard` с номером, `h3`, списком, `hr` и итогом
- `src/components/about/About.tsx` — сборка секции: `ab-head`, `VideoEmbed`, `aboutSteps.map` в сетку `ab-steps`
- `src/components/about/About.test.tsx` — 3 теста: тексты секции, фасад без iframe, три карточки с 9 пунктами
- `src/components/about/about.css` — фон секции, сетка шагов, акцентная линия `::after`, градиентный номер, маркеры, разделитель, hover, reduced motion
- `src/components/about/video-embed.css` — 16:9 контейнер radius 24px, постер, заглушка, скрим, кнопка play, iframe, hover, focus-visible, reduced motion

## Decisions Made

- **`title` ролика без суффикса.** Контракт `VideoEmbed` из плана даёт один `title` на кнопку и на iframe. Взят вариант «Единый голос 27», потому что `aria-label` кнопки зафиксирован в 03-CONTEXT как «Смотреть видео: Единый голос 27». Суффикс «: видео о проекте» из 03-UI-SPEC (title iframe и текст заглушки) не применяется. Если фаза 4 захочет разные строки для кнопки и iframe, контракт придётся расширять пропом вроде `frameTitle`.
- **Full-bleed фон без трюков.** План предлагал повторить приём `MapSection` или псевдоэлемент с `width: 100vw`. `MapSection` в базе ветки ещё заглушка, а `Section` держит `max-width: 72rem` на внутреннем `div`, поэтому сам `<section class="ab-section">` уже во всю ширину: фон объявлен прямо на нём. Плюс `overflow-x: clip` — страховка от горизонтального скролла на 390px. `100vw` не используется, ширина полосы прокрутки не мешает.
- **`aria-hidden` на заглушке постера.** Название ролика в заглушке дублирует `aria-label` кнопки play, для скринридера это повтор.
- **Кнопка play перекрывает постер целиком?** Нет: `.ve-play` — круг 72px по центру (`inset: 0; margin: auto`), клик по остальной площади постера видео не запускает. Так же ведёт себя оригинал.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Проверка лида ловила пункты карточек**

- **Found during:** Task 2 (GREEN)
- **Issue:** Тест Task 1 брал лид через `screen.getByText(/сентябре 2027 года/)`. Та же подстрока есть в пунктах шагов 1 и 3 («Во всём мире в сентябре 2027 года»), поэтому запрос падал на трёх совпадениях. Дефект теста, не реализации.
- **Fix:** Лид ищется по полной строке `aboutCopy.lead`, у найденного элемента проверяется класс `ab-lead` и обе подстроки через `toMatch`.
- **Files modified:** `src/components/about/About.test.tsx`
- **Verification:** `npx vitest run src/data/about.test.ts src/components/about` → 3 файла, 9 тестов, код 0
- **Committed in:** `6b8238e` (коммит Task 2)

### Assumption Drift (advisory)

**1. Приём full-bleed фона взят не из `MapSection`**

- **Found during:** Task 3
- **Planned:** «повторить приём `MapSection` для full-bleed фона #about».
- **Actual:** `src/components/map/MapSection.tsx` в базовой ветке (`3acd937`) всё ещё заглушка фазы 1, приёма там нет. Фон объявлен прямо на `.ab-section`, потому что элемент секции уже занимает всю ширину `main`.
- **Why:** План писался в расчёте на карту фазы 2, которая в этой ветке ещё не влита.

---

**Total deviations:** 1 auto-fixed (1 bug в тесте)
**Impact on plan:** Правка не меняет поведение компонентов и не расширяет объём.

## Issues Encountered

**Тест фазы 1 `src/components/placeholders.test.tsx` устарел — чинит оркестратор.**

`npm test` в воркtree: 15 файлов, 95 тестов, **2 падения**, оба в `src/components/placeholders.test.tsx > Заглушка About`:

- `рендерит секцию с надзаголовком, заголовком и телом из copy.ts` — ждёт `copy.sections.about.body` («Здесь появится рассказ о сентябре 2027 года и видео о проекте.»);
- `держит тело в стеклянной карточке` — ждёт тот же текст внутри `#about .glass-card`.

Это ровно та заглушка, которую план 03-02 обязан был заменить. Файл общий для всех секций фазы 3: планы 03-01 (форма) и 03-03 (участие) сломают его теми же двумя тестами для `LightForm` и `Involve`. Ни один план фазы 3 файл не заявляет в `files_modified`, а мой worktree ограничен `src/components/about/**` и `src/data/about*`, поэтому я его не трогал: три параллельных правки одного массива дали бы конфликт слияния на соседних строках.

Минимальная правка после слияния всех секционных планов фазы 3 — убрать из `src/components/placeholders.test.tsx` импорты и записи массива `placeholders` для `LightForm`, `About`, `Involve` (остальные пять секций остаются заглушками). Ключи `copy.sections.{lightForm,about,involve}` при этом можно оставить: `copy.ts` неприкосновенен для исполнителей фазы 3.

Все остальные наборы зелёные: 14 файлов, 93 теста. `npm run build` и `npm run lint` — код 0.

## Verification Results

Прогнано в worktree `/Users/thevladoss/devs/web/esd_cringe-wt/03-02`:

| Команда | Результат |
|---------|-----------|
| `npx vitest run src/data/about.test.ts src/components/about` | 3 файла, 9 тестов, passed |
| `npm run build` | passed, `dist/assets/index-*.css` 41.26 kB |
| `npm run lint` | passed |
| `npm test` (весь набор) | 93 passed, 2 failed — только `Заглушка About` в `placeholders.test.tsx` (см. «Issues Encountered») |
| грепы приёмки Task 2 и Task 3 | все совпали: `youtube-nocookie.com/embed/`=1, `img.youtube.com/vi/`=1, `allowFullScreen`=1, `.focus()`=1, `dangerouslySetInnerHTML`=0, `aboutSteps.map`=1, `aspect-ratio: 16 / 9`=1, `width: 72px`=1, `font: 900 56px`=1, `repeat(3`=1, `h2`=0, `!important`=0 |

Визуальная проверка `npm run dev` на 1440 и 390px (`human-check` в Task 3) не выполнялась: пользователь недоступен, чекпойнт авто-одобрен (`⚡ Auto-approved checkpoint`). Косвенное подтверждение: селекторы `.ab-section`, `.ab-step-num`, `.ve-play`, `.ve-frame`, `aspect-ratio:16/9`, `repeat(3,minmax(0,1fr))` присутствуют в собранном `dist/assets/index-*.css`.

## Контракт для фазы 4

```ts
// src/components/about/VideoEmbed.tsx
export interface VideoEmbedProps {
  videoId: string;
  title: string;
  className?: string;
}
export function VideoEmbed(props: VideoEmbedProps): JSX.Element;
```

- Импорт: `import { VideoEmbed } from "../about/VideoEmbed";` — компонент тянет только React и `./video-embed.css`, ни `About`, ни `data/about`, ни `copy.about`.
- Кнопка получает `aria-label` вида «Смотреть видео: {title}»; `title` iframe равен пропу `title`.
- Внешний вид меняется через `className` на корне (`.ve`); переменные `--ve-ring` и `--ve-transition` объявлены на `.ve` и переопределяются снаружи.
- Контейнер сам держит `aspect-ratio: 16 / 9` и `border-radius: 24px`; сетке ресурсов достаточно задать ширину колонки.

## User Setup Required

None — внешние сервисы не настраиваются, пакеты не ставились, `package.json` не менялся.

## Next Phase Readiness

- ABOUT-01, ABOUT-02, ABOUT-03 закрыты.
- Фаза 4 может подключать `VideoEmbed` без изменений в нём.
- Фаза 5 (MOTION-01) получает карточки шагов отдельными узлами верхнего уровня внутри `.ab-steps` — `whileInView` со stagger вешается без правки разметки.
- Блокер для оркестратора: `src/components/placeholders.test.tsx` (см. «Issues Encountered»).

---
_Phase: 03-form-about-involve_
_Completed: 2026-09-05_

## Self-Check: PASSED

Все 10 файлов кода и SUMMARY.md на диске; коммиты `fc18e73`, `6b8238e`, `748f329` в истории ветки `agent-03-02`; удалённых файлов в диапазоне `3acd937..HEAD` нет.
