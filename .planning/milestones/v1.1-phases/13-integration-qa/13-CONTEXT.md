# Phase 13: Интеграция, гейт и приёмка — Context

**Gathered:** 2026-09-06
**Status:** Ready for planning
**Source:** спецификация v1.1, раздел 7 QA; ROADMAP фаза 13; SUMMARY и VERIFICATION фаз 7–12

<domain>
## Phase Boundary

Все шесть фаз слиты в `main` оркестратором (worktree-ветки agent-* удалены). Фаза 13 работает в основном каталоге без параллельных соседей: стыки фаз, полный гейт, деплой на GitHub Pages, Playwright-сравнение с оригиналом, обновление `docs/qa/SMOKE.md`, README и `.planning`. Правки исходников допустимы только для дефектов стыков и приёмки (без новых фич).
</domain>

<decisions>
## Implementation Decisions

### Стыки, которые надо проверить первыми
- 8 + 9: `.lf-section` внутри `.map-band` прозрачна, `light-form.css` без фона и `::before`; правила `.map-band .lf-section` в map.css стали no-op — можно оставить или удалить.
- 7 + 11: `.resource-card` носит класс `glass-resource`, утилита из `global.css` применяется (computed backdrop `blur(14px) saturate(1.25)`).
- 7 + 9: заголовок формы плоский (`.gradient-title--section`), About градиентный.
- 10 + 11: превью в панели «Видео» 16:9 без полос; открытие панели с `#resources-materials` и по ссылке триптиха работает после слияния 11-03.
- 8: тёмное полотно карты `rgb(5 4 15)` и скос по всей ширине; `map-probe.mjs` (в `.planning/phases/08-map-band-and-lights/qa/`) можно переиспользовать для приёмки.

### Гейт и деплой
- Порядок: `npx tsc -b` → `npm test` (полный) → `npm run lint` → `npm run build` → `node scripts/check-dist.mjs` → push в `main` → дождаться workflow «Deploy to GitHub Pages» (`gh run watch`) → сверить, что прод отдаёт те же хэши ассетов, что локальный `dist` (как в v1.0: имена файлов и sha256).
- Реестр `data-anim` и единственный блок reduce в `global.css` — инварианты (`motionPolicy.test.ts`).

### Playwright-приёмка (QA-03)
- Оригинал https://onevoice27.org/ за Vercel challenge: браузер Playwright MCP проходит после долгой навигации (`waitUntil: 'commit'`, таймаут 120 с); `page.request` не наследует cookie; в `browser_run_code_unsafe` нет `URL`/`location`, хост брать regex. FPS мерить при закрытых WebGL-вкладках.
- Вьюпорты 1440×900 и 390×844. Таблица «оригинал / прод» в `docs/qa/SMOKE.md` (новый раздел «Фаза 13 / v1.1»): GLASS (computed background-image/border/box-shadow/backdrop-filter карточек About, ресурсов, триптиха), MAP (полигон `clip-path` карты; отсутствие второй линии по MAP-03 — выборка пикселей по x = 200 и 1240; fps ≥ 50 по медиане трёх замеров rAF за 2 с; корзины `data-bucket` 0–4; отсутствие `light-pulse`), FORM (список видимых полей в состояниях individual/group; computed styles карточек типа и полей), MEDIA (aspect-ratio 16:9 карточек новостей и средняя яркость 6px-полос у верхнего и нижнего края обложки > 12), RES (прямоугольники четырёх блоков на ширине 1152 в пределах ±8px от пропорций оригинала 320×296 / 528×523 / 272×336 / 368×256; открытие панели: z-index 10000, тайминги, scroll lock, фокус, Escape), FOOT (одна колонка: порядок узлов и центрирование).
- Скриншоты в `docs/qa/`: `v11-desktop.jpeg`, `v11-mobile.jpeg`, `v11-full.jpeg`, `v11-form-group.jpeg`, `v11-panel-materials.jpeg`, `v11-map-bottom.jpeg`, `v11-footer.jpeg` (JPEG, качество 80).
- Известные принятые отклонения (записать в SMOKE): fallback MAP-06 — дыхание радиуса ореола отключено (50,9 fps при пороге 50), радиус статичен 9px, дышит только opacity корзины (коммит cd8a64c); статичный ореол при reduced motion opacity .22 (глобальная политика); город необязателен; панель карточки новости `inset: auto 4px 4px`; `outline: none` на фокусе поля не добавлен (инвариант motionPolicy.test.ts); полотно карты `rgb(5 4 15)` = цвет воды `#05040F` стиля Mapbox оригинала; Onest вместо Figtree.

### Документы
- `docs/qa/SMOKE.md` — раздел v1.1; `README.md` — если упоминает структуру секций/панелей; `.planning/REQUIREMENTS.md` — MAP-07 уточнить (.22); `.planning/STATE.md`/`ROADMAP.md` обновляет оркестратор.

### Claude's Discretion
- Способ снятия computed styles (один evaluate-скрипт на все секции), формат таблицы SMOKE, набор кропов.
</decisions>

## Canonical References

- `docs/superpowers/specs/2026-09-06-design-fixes-v1.1-design.md` (разделы 1–7)
- `.planning/ROADMAP.md` (фаза 13, стыки), `.planning/phases/07…12-*/ *-SUMMARY.md`, `*-VERIFICATION.md`
- `docs/qa/SMOKE.md` (формат приёмки v1.0), `.planning/phases/08-map-band-and-lights/qa/map-probe.mjs`
- `docs/research/v1.1/` (замеры оригинала)

## Deferred Ideas

- Бэклог v2 (`.planning/PROJECT.md`) — вне фазы.
