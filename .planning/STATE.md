---
gsd_state_version: 1.0
milestone: v1.1
milestone_name: Дизайн-правки по оригиналу
status: ready
last_updated: "2026-09-06T07:30:00.000Z"
last_activity: 2026-09-06
progress:
  total_phases: 7
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-09-06)

**Core value:** Посетитель открывает страницу и видит красивый, живой лендинг уровня оригинала onevoice27.org, но про ЕАД: узнаёт, что такое «Единый голос 27», видит карту движения по дивизиону и может «зажечь свой свет».
**Current focus:** Milestone v1.1 «Дизайн-правки по оригиналу»: roadmap на фазы 7–13 готов; фазы 7–12 планируются и исполняются параллельно в отдельных worktree, фаза 13 сливает и принимает.

## Current Position

Phase: 7 (Стекло и заголовки) — Not started
Plan: —
Status: Roadmap created, ready to plan
Last activity: 2026-09-06 — Roadmap v1.1 записан (фазы 7–13, 32/32 требований)

Параллельные фазы: 7, 8, 9, 10, 11, 12 стартуют от main одновременно; 13 после слияния всех шести.

## Performance Metrics

**Velocity:**

- Total plans completed: 34
- Average duration: - min
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01 | 5 | - | - |
| 02 | 5 | - | - |
| 03 | 4 | - | - |
| 04 | 4 | - | - |
| 05 | 8 | - | - |
| 06 | 4 | - | - |

**Recent Trend:**

- Last 5 plans: -
- Trend: -

*Updated after each plan completion*
| Phase 01 P01 | 13min | 4 tasks | 32 files |
| Phase 01 P05 | 8min | 2 tasks | 1 files |
| Phase 05 P07 | 12min | 2 tasks | 1 files |
| Phase 05 P08 | 28min | 2 tasks | 4 files |

## Accumulated Context

### Decisions

Решения логируются в таблице Key Decisions в PROJECT.md.
Актуальные для текущей работы:

- Инициализация: собственная SVG-карта на d3-geo вместо Mapbox (без токенов, полный контроль над стилем)
- Инициализация: canvas-глобус из частиц вместо webm-видео (нет исходника, вес 0 байт)
- Инициализация: Onest вместо Figtree для заголовков (кириллица)
- Инициализация: GitHub Pages + Actions, gh уже авторизован
- [Phase 01]: Vitest закреплён на 4.1.11 и jsdom на 29.1.1 — локальный Node 25.2.1 не входит в engines vitest 5
- [Phase 01]: Vite 8.2.2 работает с @tailwindcss/vite 4.3.3 и Vitest, откат на Vite 7 не нужен — блокер фазы 1 снят проверкой билда и тестов
- [Phase 01]: TypeScript закреплён на ^5.9.3 вместо шаблонного ~6.0.2 — шаблон Vite и tsc -b проверены на 5.x
- [Phase 01]: деплой фазы 1 подтверждён сверкой sha256 локального dist и живых файлов Pages на одном коммите, а не только кодом 200
- [Phase 01]: ожидание прогона Actions на macOS делается циклом gh run view --json status,conclusion с паузой: timeout для обёртки gh run watch недоступен
- [Phase 05]: приём деплоя = код 200 + пустой diff списка ассетов + совпадение sha256 живых файлов и локального dist
- [Phase 05]: права workflow разложены по джобам (build без OIDC-токена) — строже единого блока permissions, приводить к плану не стали
- [Phase 05]: ореолы точек глобуса плоскими кругами без shadowBlur: тень стоила 533 мс на кадр на GPU, без неё 4 мс; FPS в Playwright-Chrome мерить при закрытых WebGL-вкладках
- [Roadmap v1.1]: фазы 7–12 разведены по владению файлами и идут параллельно; правило для чужого селектора кладётся в свой CSS-файл, чужие файлы не редактируются
- [Roadmap v1.1]: GLASS-06 через плоский `.gradient-title--section` по умолчанию и новый `section-gradient` только в About.tsx: вызовы GradientTitle в секциях других фаз не меняются
- [Roadmap v1.1]: GLASS-03 отдаётся утилитой `glass-resource` в global.css (фаза 7), класс на `.resource-card` вешает фаза 11; до слияния карточки ресурсов остаются на текущем стекле
- [Roadmap v1.1]: подложку и орб под формой даёт лента `.map-band` фазы 8; фаза 9 убирает фон и `::before` секции формы, до слияния секция прозрачна
- [Roadmap v1.1]: scroll lock панели ресурсов без правок global.css: класс на html/body с правилом в resources.css или вызов существующего src/lib/scrollLock.ts

### Pending Todos

Нет.

### Blockers/Concerns

Нет открытых. Риск фазы 8: бюджет ≥ 50 fps на 942 огоньках с дыханием радиуса через `@property`; спецификация задаёт fallback на дыхание opacity (MAP-06).

## Deferred Items

Items acknowledged and carried forward from previous milestone close:

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| *(none)* | | | |

## Session Continuity

Last session: 2026-09-06T07:30:00.000Z
Stopped at: Roadmap v1.1 created (phases 7–13)
Resume file: .planning/ROADMAP.md

## Operator Next Steps

- Спланировать фазы 7–12: `/bm:plan-phase 7` … `/bm:plan-phase 12` (независимы, можно параллельно)
- Исполнять фазы 7–12 в отдельных worktree по правилам владения файлами из ROADMAP.md
- После слияния шести веток: `/bm:plan-phase 13`
