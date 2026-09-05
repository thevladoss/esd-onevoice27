---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: executing
stopped_at: Executing Phase 06 (планы 06-01…06-03 параллельно в worktree)
last_updated: "2026-09-05T20:45:00.000Z"
last_activity: 2026-09-05 -- Фаза 6 «Точность оригинала» по правкам пользователя: планы 06-01 шапка, 06-02 кнопка, 06-03 фоны исполняются
progress:
  total_phases: 6
  completed_phases: 5
  total_plans: 30
  completed_plans: 26
  percent: 87
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-09-05)

**Core value:** Посетитель открывает страницу и видит красивый, живой лендинг уровня оригинала onevoice27.org, но про ЕАД: узнаёт, что такое «Единый голос 27», видит карту движения по дивизиону и может «зажечь свой свет».
**Current focus:** Phase 06 — original-fidelity (правки пользователя после приёмки фазы 5)

## Current Position

Phase: 06 (original-fidelity) — EXECUTING
Plan: 1–3 of 4 (параллельно)
Status: Фаза 05 закрыта (verification passed, review-fix, UAT); фаза 06 по правкам пользователя: шапка, кнопка, фоны, затем deep link, smoke и деплой
Last activity: 2026-09-05 -- планы 06-01…06-03 у исполнителей

Progress: [████████▋ ] 87%

## Performance Metrics

**Velocity:**

- Total plans completed: 26
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

### Pending Todos

Нет.

### Blockers/Concerns

- Фаза 2: производительность огоньков и проекция карты на реальном билде (антимеридиан, ≤40 анимированных огоньков)

## Deferred Items

Items acknowledged and carried forward from previous milestone close:

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| *(none)* | | | |

## Session Continuity

Last session: 2026-09-05T18:49:13.640Z
Stopped at: Completed 05-07-PLAN.md
Resume file: .planning/phases/05-polish-and-release/05-07-SUMMARY.md
