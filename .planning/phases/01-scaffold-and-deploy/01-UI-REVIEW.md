# Фаза 1 — UI Review

**Дата аудита:** 2026-09-05
**База сравнения:** `01-UI-SPEC.md` (дизайн-контракт)
**Скриншоты:** предоставлены оркестратором (`docs/qa/phase1-live-desktop.jpeg`, `phase1-live-mobile.jpeg`, `phase1-live-mobile-menu.jpeg`, `phase1-live-footer.jpeg`), живой сайт `https://thevladoss.github.io/esd-onevoice27/`. Dev-сервер на `localhost:3000` не поднят — новых скриншотов агент не снимал, аудит опирается на живые скриншоты и код.

**Область аудита:** дизайн-система (токены, типографика, примитивы `Section`/`Eyebrow`/`GradientTitle`/`Button`/`GlassCard`), header-пилюля с мобильным оверлеем, footer с волнами, метаданные `index.html`. Секции `hero`/`map`/`form`/`about`/`involve`/`news`/`resources`/`quote` заменены более поздними фазами — из аудита исключены.

---

## Pillar Scores

| Pillar | Score | Key Finding |
|--------|-------|-------------|
| 1. Copywriting | 4/4 | Все строки оболочки и метаданные `index.html` совпадают с контрактом дословно, запрещённых заглушек не найдено |
| 2. Visuals | 3/4 | Иерархия и aria-label на бургере в порядке, но скос пилюли сделан `transform: skewX()` вместо контрактного `clip-path: polygon()` — углы скруглены, а не срезаны |
| 3. Color | 4/4 | Акцент встречается ровно в семи местах, разрешённых контрактом, посторонних hex-цветов нет |
| 4. Typography | 4/4 | Используются только заявленные токены размеров и насыщенность 900 не выходит за пределы вордмарка и `GradientTitle` |
| 5. Spacing | 4/4 | Все отступы трассируются к шкале 4px и допущенным исключениям контракта |
| 6. Experience Design | 3/4 | Индикатор активного пункта меню «залипает» на `#about` после прокрутки мимо секций без пункта меню — подтверждено скриншотом footer |

**Overall: 22/24**

---

## Top 3 Priority Fixes

1. **`useActiveSection` не сбрасывает и не продвигает активную секцию, когда наблюдатель теряет все пересечения** — пользователь видит подсветку «ЧТО ЭТО?» (`#about`), находясь в самом низу страницы у footer, хотя должен быть виден пункт «Материалы» или вообще ничего — нарушает контрактное требование `aria-current="true"` у соответствующего пункта. Концретный фикс: в `src/lib/useActiveSection.ts` при `visible.length === 0` не выходить молча, а определять ближайшую уже пройденную секцию по `getBoundingClientRect().top` относительно `ROOT_MARGIN`, либо расширить полосу наблюдения так, чтобы последняя секция (`quote`) гарантированно попадала в неё; добавить regression-тест на прокрутку через все восемь секций подряд.
2. **Скос header реализован через `transform: skewX()` на `::before`/`::after`, а не через `clip-path: polygon(...)` из контракта** (`src/components/layout/Header.css:264-272` vs `01-UI-SPEC.md`, раздел Header) — визуально скос есть (подтверждено на `phase1-live-desktop.jpeg`), но `border-radius: inherit` на скошенном псевдоэлементе даёт скруглённые углы параллелограмма вместо острых срезанных углов оригинала. Фикс: либо перейти на `clip-path: polygon()` по формуле контракта на внешней оболочке пилюли, либо явно задокументировать технику `skewX()` как согласованное отступление в `01-UI-SPEC.md`, чтобы следующий аудит не спотыкался об это же расхождение.
3. **z-index мобильного оверлея не совпадает с таблицей контракта** — `01-UI-SPEC.md` фиксирует оверлей на слое 45, а `.mobile-menu` в `Header.css:168` имеет `z-index: 1` внутри собственного стекового контекста `header` (50). Сегодня это работает благодаря вложенности, но расходится с буквальным значением таблицы и рискует сломаться, если кто-то добавит fixed-элемент с z-index 46–49 в другом месте документа, ожидая, что он окажется выше меню. Фикс: либо выставить `z-index: 45` явно, либо обновить таблицу z-index в `01-UI-SPEC.md` с пометкой «вложенный контекст header».

---

## Detailed Findings

### Pillar 1: Copywriting (4/4)

- `src/data/copy.ts` — вордмарк, тег-лайн, четыре пункта меню, тексты бургера, подпись/ссылки/юр.строка footer и CTA совпадают с таблицами контракта `01-UI-SPEC.md` посимвольно.
- `index.html:6-19` — `lang="ru"`, `title`, `description`, `theme-color`, `og:title/description/type/url/locale` совпадают с контрактом дословно, включая пунктуацию и кавычки-«ёлочки».
- `index.html:29` — текст `<noscript>` совпадает с требованием Error state контракта.
- Grep по `src/components/layout` и `copy.ts` на «Submit/Click Here/OK/Cancel/Save/TODO/coming soon/в разработке/lorem ipsum» — совпадений нет.
- Аудит намеренно не оценивает заглушки секций `hero…quote` (они вне области, заменены фазами 2–4), хотя часть из них ещё показывает placeholder-текст на живом сайте (например, `quote`) — это ответственность соответствующей фазы, не фазы 1.

### Pillar 2: Visuals (3/4)

- `BurgerButton.tsx:19` — иконка-бургер получает `aria-label`, который переключается между «Открыть меню»/«Закрыть меню» — соответствует контракту.
- Иерархия текста подтверждена скриншотами: вордмарк (Onest 900, градиент) выделяется над пунктами меню (Onest 700, uppercase, 16px) и тег-лайном (10px); в footer подпись (400) визуально легче ссылок (700).
- `Footer.css:10` — клин верхней грани реализован через `clip-path: polygon(0 var(--footer-wedge), 100% 0, 100% 100%, 0 100%)`, буквально как в контракте.
- `Header.css:264-272` — скос пилюли на `≥1024px` сделан через `transform: skewX(calc(-1 * var(--header-skew-angle)))` на `::before`/`::after`, а не через `clip-path: polygon(...)`, как задано в контракте. На `phase1-live-desktop.jpeg` скос виден (углы пилюли слегка срезаны), но `border-radius: inherit` на трансформированном псевдоэлементе скругляет то, что в оригинале должно быть острым срезом. Технически решение обосновано в `01-03-SUMMARY.md` (сохранить `position: fixed` от вьюпорта), но визуальный результат отличается от буквы контракта.

### Pillar 3: Color (4/4)

- Grep по `signal-|horizon-4|horizon-6|unity-500|gradient-` в `src/components/layout` и `src/styles` показал ровно семь мест использования акцента: градиент вордмарка (`Wordmark.tsx:6`), световая полоса пилюли (`Header.css:52-57`), подчёркивание пункта меню (`Header.css:102`), заливка `.btn--primary` (`primitives.css:70`), `GradientTitle` (`primitives.css:16`), волны/гало footer (`Footer.css:20-24, 40-42`), радиальные пятна оверлея (`Header.css:171-172`) — все семь совпадают со списком «Accent reserved for» контракта, лишних мест нет.
- `horizon-200` (фокус/hover) используется отдельно и последовательно во всех интерактивных элементах (`Header.css:92,135,219`, `Footer.css:92`, `global.css:32,55,90`) — соответствует контракту.
- Все hex-значения в `tokens.css` и `global.css` — это объявления самих токенов/градиентов из контракта, посторонних hardcoded цветов не найдено.
- Незначительное замечание вне подсчёта очков: CSS «луча» кнопки фазы 2 (`global.css:133-234`, `@property --beam`, `.btn[data-beam="true"]`) уже лежит в файле фазы 1, хотя контракт прямо называет это функциональностью фазы 2. Сегодня блок неактивен (ни один компонент фазы 1 не ставит `data-beam="true"`), но это смешение границ фаз в общем файле стоит иметь в виду.

### Pillar 4: Typography (4/4)

- Используемые размеры текста в `src/components/layout` — только объявленные роли контракта: `--text-xs`, `--text-sm`, `--text-base`, `--text-section`, `--text-wordmark`, `--text-tagline`, плюс два буквальных `clamp()` из самого контракта (`clamp(1.25rem, 6vw, 1.75rem)` для пункта меню в оверлее — `Header.css:208`, и `clamp(2.75rem, 8vw, 4.5rem)` для варианта `hero` — `primitives.css:38`). Посторонних размеров нет.
- Насыщенность 900 встречается только в `.wordmark__title` (`global.css:68`) и `.gradient-title` (`primitives.css:9`) — оба пункта входят в разрешённый список контракта («Насыщенность 900 разрешена только здесь»). В `.btn`, `.site-header__link`, `.mobile-menu__link` насыщенность зафиксирована на 700 — запрет на 900 в кнопках и пунктах меню соблюдён.
- Рабочая пара 400/700 подтверждена по всем текстовым ролям footer/header (caption 400, ссылки/пункты меню 700).

### Pillar 5: Spacing (4/4)

- Отступы header/footer/оверлея (12, 16, 20, 24, 32, 48, 64, 96px плюс исключения 12/20/28/40px) трассируются к шкале контракта; вычисляемые значения (`calc(32px + var(--header-skew-inset))` в `Header.css:261`, `calc(var(--footer-wedge) + clamp(72px, 10vw, 124px))` в `Footer.css:6`) построены только из уже одобренных токенов.
- `.mobile-menu` padding (`calc(88px + 16px)` сверху, `clamp(24px, 7vw, 56px)` по бокам/снизу — `Header.css:169`) совпадает с контрактом буквально.
- Grep на произвольные bracket-значения в `src/components/layout/*.tsx` не нашёл ничего, кроме контрактного `max-w-[72rem]` (`Section.tsx:21`, `Footer.tsx:8`) и тестового `max-w-[60ch]`.
- `Section.tsx:24,28` — зазор eyebrow→title (`mt-2` = 8px) и title→контент (`mt-6` = 24px) совпадает с контрактными 8px/24px.

### Pillar 6: Experience Design (3/4)

- **Проблема:** `src/lib/useActiveSection.ts:32-46` — колбэк `IntersectionObserver` обновляет `active` только когда есть хотя бы одна пересекающаяся секция в узкой полосе `-40%/-55%` (`ROOT_MARGIN`, строка 4). Если после прокрутки мимо секций `involve`/`news`/`resources`/`quote` наблюдатель ни разу не поймал пересечение (например, из-за высоты этих секций или скорости прокрутки), `visible.length === 0` и функция молча выходит, оставляя `active` равным последнему поймaнному значению. На `docs/qa/phase1-live-footer.jpeg` видно: пользователь находится в секции `quote`/footer, но пункт «ЧТО ЭТО?» (`#about`) всё ещё подсвечен подчёркиванием — на верхнем скриншоте `phase1-live-desktop.jpeg` (в самом верху страницы, hero) подсветки корректно нет ни у одного пункта, значит расхождение появляется именно в процессе скролла, а не при начальной загрузке. Это прямое нарушение пункта контракта «Активная секция: … `aria-current="true"` у соответствующего пункта».
- **В порядке:** фокус-трап по Tab/Shift+Tab с учётом бургера (`MobileMenu.tsx:20-23,61-79`), возврат фокуса на бургер при закрытии (`MobileMenu.tsx:39-47`), восстановление `body.style.overflow` в исходное (а не в пустую строку) значение (`MobileMenu.tsx:32-36`), `inert`/`aria-hidden` на закрытом диалоге (`MobileMenu.tsx:121-122`), автозакрытие при ресайзе на десктоп (`MobileMenu.tsx:87-105`), состояние `disabled`/`aria-disabled` в `.btn` (`primitives.css:101-106`), глобальный `prefers-reduced-motion` (`global.css:122-131`) плюс точечный для волн footer (`Footer.css:105-114`).
- **Минус балла также за:** несовпадение z-index оверлея с таблицей контракта (45 в спеке vs `z-index: 1` вложенно в `Header.css:168`) — сегодня работает благодаря вложенному стековому контексту header, но расходится с буквальным значением, которое проверяющие будут искать по таблице.

---

## Files Audited

- `.planning/phases/01-scaffold-and-deploy/01-UI-SPEC.md`, `01-CONTEXT.md`, `01-0{1..5}-PLAN.md`, `01-0{1..5}-SUMMARY.md`
- `docs/qa/SMOKE-phase1.md`, `docs/qa/phase1-live-desktop.jpeg`, `phase1-live-mobile.jpeg`, `phase1-live-mobile-menu.jpeg`, `phase1-live-footer.jpeg`
- `src/styles/tokens.css`, `src/styles/global.css`
- `src/components/layout/Header.tsx`, `Header.css`, `BurgerButton.tsx`, `MobileMenu.tsx`, `Wordmark.tsx`
- `src/components/layout/Footer.tsx`, `Footer.css`
- `src/components/layout/Section.tsx`, `Eyebrow.tsx`, `GradientTitle.tsx`, `Button.tsx`, `GlassCard.tsx`, `primitives.css`
- `src/data/copy.ts`, `src/App.tsx`, `index.html`
- `src/lib/scrollToSection.ts`, `src/lib/useActiveSection.ts`
- `src/components/layout/Header.test.tsx` (выборочно)

Registry audit: `components.json` не найден — shadcn не инициализирован, проверка Registry Safety не требуется (подтверждено также разделом «Registry Safety» в `01-UI-SPEC.md`).
