---
phase: 11-resources-panels
verified: 2026-09-06T08:53:32Z
status: passed
score: 6/6 must-haves verified
has_blocking_gaps: false
overrides_applied: 0
---

# Фаза 11: Ресурсы: сетка, карточки, панели — отчёт о верификации

**Цель фазы:** Посетитель видит блок ресурсов с сеткой и карточками оригинала, открывает полноэкранную панель со шторным переходом и находит в ней материалы ЕАД, а где аналога нет, английские материалы оригинала.

**Проверено:** 2026-09-06T08:53:32Z
**Статус:** passed
**Повторная верификация:** Нет — первая проверка

## Достижение цели

### Наблюдаемые истины (Success Criteria из ROADMAP)

| # | Истина | Статус | Свидетельство |
|---|--------|--------|---------------|
| 1 | RES-01: сетка `≥1024px` `320fr/528fr/272fr`, gap 16px, пропорции блоков; `<1024px` колонка, карточки `min(100%, 328px) × 248px` | ✓ VERIFIED | `resources.css:276-335` — `@media (min-width: 64rem)` содержит `grid-template-columns: minmax(0, 320fr) minmax(0, 528fr) minmax(0, 272fr)`, grid-area `1/1`, `1/2`, `1/3` (`align-self: end`), `2/2` (`justify-self: start`, `width: min(69.697%, 368px)`), все `aspect-ratio` дословно из спецификации; вне медиа-запроса `.resources-cell { width: min(100%, 328px); height: 248px }`, `.resources-grid { gap: 24px }`. Подтверждено тестом `Resources.test.tsx` («держит порядок блоков…», «задаёт сетку и пропорции оригинала в CSS») |
| 2 | RES-02: карточка — индикатор с точкой 16px акцента, контент внизу, подчёркивание `scaleX(.34)→scaleX(1)`, подъём 4px за 420ms, акценты `rgb(143 157 214)/rgb(123 194 199)/rgb(210 142 190)`, поверхность `glass-resource` | ✓ VERIFIED | `ResourceCard.tsx:31` — класс `"resource-card glass glass-resource"`; `resources.css:196-270` — `.resource-card__dot { width:16px; height:16px }`, `.resource-card__trigger::before { transform: scaleX(.34) }` → hover/focus `scaleX(1)`, `.resource-card:hover { transform: translateY(-4px) }` за `420ms cubic-bezier(.22, 1, .36, 1)`; `copy.resources.ts:44,51,58` — акценты литералами. `global.css:103-112` — утилита `glass-resource` фазы 7 подключена и используется |
| 3 | RES-03: клик открывает полноэкранную панель `fixed z 10000`, слои `rgb(132 53 127)`/`rgb(59 77 161)` въезжают за 620ms со сдвигом 90ms, панель проявляется через 180ms; scroll lock; фокус на «Назад»; Escape/«Назад» закрывают с обратной анимацией и возвращают фокус; `#resources-materials` открывает материалы; reduced motion без переходов | ✓ VERIFIED | `ResourcePanel.tsx` — `createPortal(…, document.body)`, фазы `closed/opening/open/closing`; `resources.css:346-427` — `z-index: 10000`, `rgb(132 53 127)`/`rgb(59 77 161)`, `620ms cubic-bezier(.22, 1, .36, 1)`, `transition-delay: 90ms` (слой after), `transition-delay: 180ms` (панель и слои на закрытии); scroll-lock класс `resources-panel-locked` на `html`/`body`; фокус на кнопку «Назад» (`backRef.current?.focus`); `Escape` → `onClose`; ловушка Tab (`trapTab`); при `usePrefersReducedMotion()` состояние сразу `open`/`closed` без промежуточных фаз. Deep link и делегированный клик по `a[href="#resources-materials"]` в `Resources.tsx:59-93`. Все сценарии зелёные в `ResourcePanel.test.tsx` (14 тестов) и `Resources.test.tsx` (deep link, hashchange, клик по триптиху, Esc, «Назад») |
| 4 | RES-04: внутри панели — «Назад», заголовок, описание, сетка файлов `repeat(auto-fill, minmax(min(100%, 17.5rem), 1fr))`, карточки с бейджем и «Скачать»/«Открыть», языковые группы `<details>`; «Музыка» — 3 файла; «Материалы» — раскрытая ЕАД (4, WEB) + En/Es/Pt/Fr; «Видео» — 16 роликов + «Video backgrounds»; `MusicPlaceholder` в коде нет | ✓ VERIFIED | `ResourcePanel.tsx:216-273` — шапка с `resources-panel__back`, заголовком и описанием; `resources.css:514-523` — `repeat(auto-fill, minmax(min(100%, 17.5rem), 1fr))`; `FileCard.tsx` — бейдж `data-file-type`, ссылка «Скачать»/«Открыть»; `FileGroup.tsx` — `<details>`/`<summary>`. `resourceFiles.test.ts` подтверждает 3 файла музыки, 5 групп в порядке `esd/en/es/pt/fr`, ЕАД раскрыта и состоит из 4 позиций (DOCX+3×WEB), En/Es/Pt/Fr нужного состава, `videoFiles` — один ZIP. `MusicPlaceholder.tsx`/`MaterialsList.tsx` физически удалены (`ls` → No such file), упоминаний в `src/` нет |
| 5 | RES-05 (наполнение дословно из спецификации) | ✓ VERIFIED | Построчная сверка `src/data/resourceFiles.ts` и `src/data/materials.ts` с разделом 5 (RES-05) спецификации: все href (`hope-documents…`, `gcsda.sharepoint.com…`) и имена файлов совпадают посимвольно, база `HOPE` вынесена в константу. Тексты панелей и групп в `copy.resources.ts` совпадают с формулировками RES-05 («Официальная песня движения…», «Материалы дивизиона на русском…», «16 роликов дивизиона и видеофоны глобального проекта.») |
| 6 | RES-06: фон секции при открытой панели красится в цвет карточки, атмосфера и частицы сохранены | ✓ VERIFIED | `resources.css:6-21` — `.resources.is-music-active { background-color: rgb(22 29 61) }`, `.is-materials-active { rgb(25 47 54) }`, `.is-video-active { rgb(50 16 47) }`; класс навешивается в `Resources.tsx:100-102` (`is-${active}-active`). Атмосфера (`data-anim="atmosphere"`) и звёздное поле (`data-anim="particles"`) на месте, тесты «держит слой частиц…», «переводит атмосферу на акцент…» зелёные |

**Оценка:** 6/6 истин подтверждено (все Success Criteria из ROADMAP и RES-01…06 из REQUIREMENTS.md).

### Обязательные артефакты (must_haves из планов 11-01/02/03)

| Артефакт | Ожидание | Статус | Детали |
|----------|----------|--------|--------|
| `src/data/resourceFiles.ts` | Типы + `musicFiles`/`materialGroups`/`videoFiles` | ✓ VERIFIED | 271 строка, все адреса дословно из RES-05, содержит `PIl1787819788226.pdf` |
| `src/data/resourceFiles.test.ts` | Тест состава, id, ссылок | ✓ VERIFIED | 143 строки (≥60), 10 сценариев, все зелёные |
| `src/data/materials.ts` | `esdMaterials` (4) + `englishFolder` | ✓ VERIFIED | Экспортирует `esdMaterials`, `englishFolder`, `MaterialItem`, `MaterialKind`; экспорта `materials` больше нет |
| `src/data/copy.resources.ts` | Заголовки/описания/кнопки/группы | ✓ VERIFIED | Содержит «Официальная песня движения и материалы к ней» дословно |
| `src/components/resources/resources.css` | Сетка, карточки, панель, слои | ✓ VERIFIED | Содержит `minmax(0, 320fr) minmax(0, 528fr) minmax(0, 272fr)`, `z-index: 10000` |
| `src/components/resources/ResourceCard.tsx` | Индикатор+точка, контент внизу, оверлей-кнопка | ✓ VERIFIED | Содержит `glass-resource`, структура по плану |
| `src/components/resources/Resources.tsx` | Сетка классами вместо Tailwind | ✓ VERIFIED | Содержит `resources-grid`, `<ResourcePanel active=` |
| `src/components/resources/Resources.test.tsx` | Структура, порядок, CSS-значения | ✓ VERIFIED | 510 строк (≥300), все тесты зелёные |
| `src/components/resources/ResourcePanel.tsx` | Портал, фазы, scroll lock, фокус, Escape, ловушка Tab | ✓ VERIFIED | 277 строк, `createPortal` присутствует |
| `src/components/resources/FileCard.tsx` | Название, бейдж, «Скачать»/«Открыть» | ✓ VERIFIED | Экспортирует `FileCard` |
| `src/components/resources/FileGroup.tsx` | `<details>` + сетка файлов | ✓ VERIFIED | Экспортирует `FileGroup` |
| `src/components/resources/ResourcePanel.test.tsx` | Тесты хоста панели | ✓ VERIFIED | 267 строк (≥150), 14 сценариев, все зелёные |
| `src/components/resources/MusicPlaceholder.tsx` | Должен быть удалён | ✓ VERIFIED | Файл отсутствует |
| `src/components/resources/MaterialsList.tsx` | Должен быть удалён | ✓ VERIFIED | Файл отсутствует |

### Проверка ключевых связей (wiring)

| От | К | Через | Статус | Детали |
|----|---|-------|--------|--------|
| `resourceFiles.ts` | `materials.ts` | группа `esd` из `esdMaterials`, `englishFolder` | ✓ WIRED | `import { esdMaterials, englishFolder } from "./materials"` (строка 2), используется в `materialToFile` и группе `en` |
| `resourceFiles.ts` | `copy.resources.ts` | `title: resourcesCopy.groups[id]` | ✓ WIRED | `resourcesCopy.groups.esd/en/es/pt/fr` во всех пяти группах |
| `Resources.tsx` | `resources.css` | классы `resources-grid`/`resources-cell--*` | ✓ WIRED | Классы присутствуют и применяются к `RevealGroup`/`RevealItem` |
| `ResourceCard.tsx` | `copy.resources.ts` | `style="--accent"` | ✓ WIRED | `style={{ "--accent": card.accent }}` |
| `resources.css` | `.resource-card__trigger::before` | `scaleX(.34)→scaleX(1)` на hover/`:has(:focus-visible)` | ✓ WIRED | Правило присутствует дословно |
| `Resources.tsx` | `ResourcePanel.tsx` | `<ResourcePanel active={active} onClose={close} />` | ✓ WIRED | Строка 169 |
| `ResourcePanel.tsx` | `resourceFiles.ts` | `musicFiles, materialGroups, videoFiles` | ✓ WIRED | Импорт и использование в разметке трёх панелей |
| `ResourcePanel.tsx` | `document.body` | `createPortal` + классы `resources-panel-locked` | ✓ WIRED | Подтверждено тестом «блокирует прокрутку документа…» |
| `ResourcePanel.tsx` | `VideoEmbed.tsx` (фаза 10) | `<VideoGrid size="compact">` без правки `VideoEmbed.tsx` | ✓ WIRED | `VideoGrid.tsx` вызывает `VideoEmbed` с `size="compact"`; `VideoEmbed.tsx` не входит в diff трёх merge-коммитов фазы |
| `Involve.tsx` (фаза 5, не трогается) | `Resources.tsx` | делегированный клик по `a[href="#resources-materials"]` | ✓ WIRED | `copy.involve.ts:33` содержит ссылку, обработчик клика в `Resources.tsx:74-85`, тест «раскрывает панель по клику на карточку триптиха…» зелёный |

### Автоматические проверки

| Проверка | Команда | Результат |
|----------|---------|-----------|
| Типы | `npx tsc -b` | Без ошибок |
| Тесты (ресурсы, данные, involve, motionPolicy) | `npx vitest run src/components/resources src/data src/components/involve src/styles/motionPolicy.test.ts` | 8 файлов, 83 теста — все зелёные |
| Lint (весь проект) | `npm run lint` | exit 0, без предупреждений |
| Реестр `data-anim` | `motionPolicy.test.ts` | Подтверждает единственный блок `prefers-reduced-motion` в `global.css`; `resources.css` использует только `data-anim="atmosphere"` и `data-anim="particles"` из закрытого списка |

### Анти-паттерны

| Файл | Строка | Паттерн | Серьёзность | Влияние |
|------|--------|---------|--------------|---------|
| — | — | `TBD`/`FIXME`/`XXX`/`TODO`/`HACK`/`PLACEHOLDER`/`console.log` не найдены ни в одном из 14 изменённых файлов фазы | — | Чисто |
| — | — | `MusicPlaceholder`/`MaterialsList` отсутствуют в `src/` (единственные совпадения `emptyTitle` — из несвязанной секции новостей, `News.tsx`/`copy.news.ts`) | — | Ложное срабатывание grep, не относится к фазе 11 |
| — | — | `@media (prefers-reduced-motion` в `resources.css` отсутствует — по дизайну (единый блок в `global.css`), закрытие переходов на reduced motion проверено JS-веткой в `ResourcePanel.tsx` и тестом | — | Соответствует правилу фазы |

### Проверка владения файлами (git diff по трём merge-коммитам)

Три merge-коммита фазы (`9956c44` → 11-01, `80d70c8` → 11-02, `db07e23` → 11-03) в сумме затронули только файлы из списка **Files** фазы 11 в ROADMAP.md:
`Resources.tsx`, `ResourceCard.tsx`, `ResourcePanel.tsx` (новый), `FileCard.tsx` (новый), `FileGroup.tsx` (новый), `resources.css`, `Resources.test.tsx`, `VideoGrid.test.tsx`, `ResourcePanel.test.tsx` (новый), `MusicPlaceholder.tsx` (удалён), `MaterialsList.tsx` (удалён), `src/data/copy.resources.ts`, `src/data/materials.ts`, `src/data/resourceFiles.ts` (новый), `src/data/resourceFiles.test.ts` (новый), плюс `SUMMARY.md` планов.
Файлы вне владения фазы (`global.css`, `primitives.css`, `Header.css`, `VideoEmbed.tsx`) не изменены — подтверждено `git log -- <файл>`: последняя правка каждого предшествует фазе 11.

### Требования — покрытие

| Требование | План | Описание | Статус | Свидетельство |
|-----------|------|----------|--------|---------------|
| RES-01 | 11-02 | Раскладка сетки ≥1024px и колонка <1024px | ✓ SATISFIED | `resources.css`, тест «сетка и карточки по оригиналу» |
| RES-02 | 11-02 | Карточка ресурса: индикатор, контент, подчёркивание, ховер | ✓ SATISFIED | `ResourceCard.tsx`, `resources.css`, `copy.resources.ts` |
| RES-03 | 11-03 | Полноэкранные панели, шторка, scroll lock, фокус, Escape, deep link, reduced motion | ✓ SATISFIED | `ResourcePanel.tsx`, `resources.css`, `ResourcePanel.test.tsx` |
| RES-04 | 11-03 | Внутренности панели: шапка, сетка файлов, языковые группы | ✓ SATISFIED | `FileCard.tsx`, `FileGroup.tsx`, `resources.css` |
| RES-05 | 11-01, 11-03 | Наполнение (музыка/материалы/видео) дословно из спецификации, удаление `MusicPlaceholder` | ✓ SATISFIED | `resourceFiles.ts`, `materials.ts`, `copy.resources.ts`, удаление подтверждено |
| RES-06 | 11-03 | Фон секции при открытой панели, атмосфера и частицы | ✓ SATISFIED | `resources.css`, `Resources.tsx` |

Осиротевших требований фазы 11 не найдено — все шесть RES-ID заявлены в `requirements:` планов 11-01/02/03 и покрыты.

### Human Verification Required

Не требуется. Все три плана фазы содержат только `<verify><automated>` (нет `<human-check>` блоков для харвеста). Визуальная сверка с оригиналом по пикселям (Playwright, 1440×900/390×844) — по условию задачи и по ROADMAP закреплена за фазой 13 и намеренно не выполняется здесь.

### Отложенные пункты

| # | Пункт | Куда отнесено | Свидетельство |
|---|-------|----------------|----------------|
| 1 | Визуальное сравнение с оригиналом (Playwright, 1440×900 и 390×844) по RES-пунктам | Phase 13 | ROADMAP.md, Phase 13 Success Criteria п.3: «RES (прямоугольники четырёх блоков ±8px от пропорций оригинала на ширине 1152)»; п.4 «карточки ресурсов на утилите `glass-resource` (7 + 11)» |

### Итог

Все шесть критериев успеха фазы 11 и требования RES-01…06 подтверждены прямым чтением кода (не по описанию SUMMARY.md): данные и адреса файлов сверены построчно со спецификацией, сетка и карточки — по литералам CSS, полноэкранные панели — по таймингам, z-index, фокус-менеджменту и scroll lock в реализации `ResourcePanel.tsx`. `npx tsc -b`, `npm run lint` и целевой прогон `vitest` (83/83) зелёные. `MusicPlaceholder.tsx` и `MaterialsList.tsx` физически удалены. Владение файлами не нарушено. Пробелов, блокирующих переход к следующей фазе, не найдено.

---

_Проверено: 2026-09-06T08:53:32Z_
_Верификатор: Claude (gsd-verifier)_
