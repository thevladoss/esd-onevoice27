---
gsd_state_version: 1.0
milestone: v1.2
milestone_name: Мобильная адаптация, глобус оригинала и производительность
status: ready_to_plan
last_updated: 2026-09-06T16:07:42.897Z
last_activity: 2026-09-06
progress:
  total_phases: 4
  completed_phases: 0
  total_plans: 0
  completed_plans: 4
  percent: 0
stopped_at: Phase 14 complete (2/2) — ready to discuss Phase 15
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-09-06)

**Core value:** Посетитель открывает страницу и видит красивый, живой лендинг уровня оригинала onevoice27.org, но про ЕАД: узнаёт, что такое «Единый голос 27», видит карту движения по дивизиону и может «зажечь свой свет».
**Current focus:** Phase 15 — lights canvas

## Current Position

Phase: 15 исполняется в worktree agent-15 (план 15-02); фазы 14 и 16 завершены и слиты в main
Plan: 15-02
Status: Executing
Last activity: 2026-09-06

## Performance Metrics

**Velocity:**

- Total plans completed: 50
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
| 12 | 1 | - | - |
| 10 | 1 | - | - |
| 7 | 2 | - | - |
| 9 | 2 | - | - |
| 11 | 3 | - | - |
| 8 | 2 | - | - |
| 13 | 2 | - | - |
| 16 | 1 | - | - |
| 14 | 2 | - | - |

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
- Инициализация: Onest вместо Figtree для заголовков (кириллица)
- Инициализация: GitHub Pages + Actions, gh уже авторизован
- [Phase 01]: Vitest закреплён на 4.1.11 и jsdom на 29.1.1 — локальный Node 25.2.1 не входит в engines vitest 5
- [Phase 01]: ожидание прогона Actions на macOS делается циклом gh run view --json status,conclusion с паузой: timeout для обёртки gh run watch недоступен
- [Phase 05]: приём деплоя = код 200 + пустой diff списка ассетов + совпадение sha256 живых файлов и локального dist
- [Phase 05]: FPS в Playwright-Chrome мерить при закрытых WebGL-вкладках
- [Roadmap v1.1]: фазы разводятся по владению файлами и идут параллельно; правило для чужого селектора кладётся в свой CSS-файл, чужие файлы не редактируются
- [Roadmap v1.2]: глобус hero переезжает с canvas-частиц на `<video>` оригинала (webm 1,9 МБ, mp4 2,9 МБ уже в `public/`), поверх него порт `orig-hero-motion.js` на 30 fps; `GlobeCanvas`, `globe.ts` и `Starfield` удаляются (пересмотр решения v1.0 «canvas-глобус вместо webm»)
- [Roadmap v1.2]: огоньки карты переезжают из SVG (1884 круга, 30 fps при CPU×4) на canvas-оверлей со спрайтами; дыхание радиуса 7→12px возвращается (пересмотр fallback MAP-06 из v1.1)
- [Roadmap v1.2]: `global.css` не трогает ни одна из фаз 14–16; правила `[data-anim="pulse"] circle`, `.light-halo` и `[data-anim="new-light"]` в блоке reduce остаются как no-op, `motionPolicy.test.ts` правит только фаза 15 (`new-light` выходит из обязательных)
- [Roadmap v1.2]: `News.tsx` принадлежит фазе 16 только для передачи приоритета первой карточке; `src/test/setup.ts` (`getContext` → `null`) не меняется, на него опираются jsdom-тесты обоих canvas
- [Roadmap v1.2]: бюджет LIGHT-07 для hero (код фазы 14) подтверждается в фазе 17 после слияния; в ветке фазы 15 меряются карта и форма

### Pending Todos

Нет.

### Blockers/Concerns

Нет открытых. Риски по фазам:

- Фаза 14: автовоспроизведение на iOS без `muted` в DOM (дублируется через ref); поддержка `mask-composite: intersect` и `-webkit-mask-composite: source-in` в Safari; вес видео 1,9/2,9 МБ на мобильном (обход: `saveData`)
- Фаза 15: бюджет ≥ 55 fps при CPU×4 на 942 огоньках с `drawImage` спрайтов; при недоборе первым делом снижать dpr canvas с 2 до 1,5, затем частоту цикла
- Фаза 16: интервал списка футера должен компенсировать `min-height: 44px`, иначе столбец растянется

## Deferred Items

Items acknowledged and carried forward from previous milestone close:

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| *(none)* | | | |

## Session Continuity

Last session: 2026-09-06T15:30:00.000Z
Stopped at: Roadmap v1.2 created (phases 14–17)
Resume file: .planning/ROADMAP.md

## Operator Next Steps

- `/bm:plan-phase 14`, `/bm:plan-phase 15`, `/bm:plan-phase 16` (фазы независимы, исполняются в отдельных worktree)
- После слияния 14–16: `/bm:plan-phase 17`
