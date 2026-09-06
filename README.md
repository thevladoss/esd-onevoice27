# Единый голос 27 — лендинг Евро-Азиатского дивизиона

Прототип редизайна onevoice27.org с русскоязычным контентом Евро-Азиатского дивизиона Церкви христиан адвентистов седьмого дня. Данные замоканы, бэкенда нет: форма, карта и новости работают на локальных мок-данных. Собирается в статический билд и публикуется на GitHub Pages.

## Запуск

```bash
npm ci          # установка зависимостей по package-lock.json
npm run dev     # дев-сервер Vite
npm test        # прогон тестов Vitest
npm run build   # проверка типов и продакшен-билд в dist
npm run preview # локальный просмотр собранного билда
```

Нужен Node 22 или новее.

## Деплой

Сайт живёт по адресу https://thevladoss.github.io/esd-onevoice27/.

Пуш в ветку `main` запускает workflow `.github/workflows/deploy.yml`: он ставит зависимости через `npm ci`, гоняет `npm run lint` и `npm test`, собирает `npm run build`, проверяет сборку командой `npm run check:dist` и публикует папку `dist` на GitHub Pages. Публикация идёт через OIDC, секреты и токены не нужны. Билд собирается с базовым путём `/esd-onevoice27/`, поэтому ассеты подтягиваются из подпапки репозитория.

## Проверка

### Тесты

```bash
npm test
```

Ожидание: все файлы зелёные, в выводе нет предупреждений `act` и строк `Warning`.

### Сборка

```bash
npm run build
```

Ожидание: код выхода 0, ни одного предупреждения о размере чанков. В `dist/assets` лежат `index-*.css`, `index-*.js` и отдельный чанк `vendor-map-*.js`: в него уходят d3, topojson-client и границы стран из world-atlas, иначе главный чанк перерастает порог Vite в 500 КБ.

### Проверка dist

```bash
npm run check:dist
```

Запускается после `npm run build`, читает только `dist` и ничего не пересобирает. Одиннадцать проверок: `lang="ru"`, заголовок вкладки, `description` и og-теги, ссылки на ассеты под `/esd-onevoice27/assets/` и наличие самих файлов, отсутствие ссылок от корня, чанк `vendor-map`, потолок 500 КБ на каждый JS-чанк, id восьми секций в бандле, `<noscript>` и белый список внешних хостов. Ожидание: код выхода 0 и последняя строка `OK: 11 проверок`.

### Локальный просмотр

```bash
npx vite preview --port 4173 --strictPort
```

Адрес страницы http://localhost:4173/esd-onevoice27/ (корень отдаёт 404: билд живёт в подпапке, как на Pages).

### Браузерный smoke

Чеклист приёмки лежит в `docs/qa/SMOKE.md`: восемь секций, консоль, сеть, горизонтальный скролл на пяти ширинах, reveal, reduced motion, якоря меню, обход табом, контраст и четыре скриншота. Прогоняется по preview, затем по проду, через Playwright MCP или вручную в DevTools. Результаты вписываются в тот же файл.

Раздел «Фаза 13 / v1.1» в том же файле сравнивает прод с оригиналом onevoice27.org по шести правкам
редизайна — стекло карточек, лента карты и огоньки, форма, превью новостей и видео, ресурсы с
полноэкранными панелями, футер — на вьюпортах 1440×900 и 390×844. Скриншоты приёмки лежат рядом:
`docs/qa/v11-desktop.jpeg`, `v11-mobile.jpeg`, `v11-full.jpeg`, `v11-form-group.jpeg`,
`v11-panel-materials.jpeg`, `v11-map-bottom.jpeg`, `v11-footer.jpeg`. Скрипты замеров лежат в
`.planning/phases/13-integration-qa/qa/` и запускаются против прода:

```bash
QA=.planning/phases/13-integration-qa/qa
node $QA/v11-run.mjs --site prod --width 1440 --height 900 --out $QA/results/prod-1440.json
node $QA/v11-interactive.mjs --site prod --out $QA/results/prod-interactive-1440.json
node $QA/pixel-probe.mjs --cover .news-card__cover --cover-index 1
node $QA/v11-shots.mjs --out docs/qa
```

`playwright` берётся из кэша npx или из каталога в `PW_ROOT`; в зависимости репозитория он не добавляется.

### Деплой и живой сайт

После пуша в `main` проверьте прогон и живой сайт:

```bash
gh run list --workflow deploy.yml --limit 1        # id последнего прогона и его sha
gh run watch <id> --exit-status                    # ждать до конца, ненулевой код при падении
curl -sI https://thevladoss.github.io/esd-onevoice27/ | head -1   # ожидаем 200
```

Что смотреть:

- прогон завершился `success`, а его `headSha` совпадает с `git rev-parse HEAD`;
- живой URL отвечает `200`, а не отдаёт 404-страницу GitHub Pages;
- в HTML стоит `lang="ru"`, `<title>Единый голос 27 — Евро-Азиатский дивизион</title>` и `og:url` на адрес Pages;
- ссылки на скрипт и стили ведут в `/esd-onevoice27/assets/`, каждая отдаёт `200`, как и `/esd-onevoice27/favicon.svg`;
- набор хэшей ассетов совпадает с локальным `npm run preview` на том же коммите;
- на открытой странице видны header с меню и footer с волнами, консоль браузера без ошибок и без 404.

Ссылки на ассеты от корня (`/assets/...` вместо `/esd-onevoice27/assets/...`) означают, что билд собрался без `base`, и Pages отдаст белый экран.

## Структура

```
index.html                 метаданные страницы, шрифты Google Fonts, точка входа
src/main.tsx               монтирование React и импорт глобальных стилей
src/App.tsx                композиция страницы: SkipLink, Header, main#main, Footer
src/components/layout/     оболочка и примитивы: SkipLink, Wordmark, Header, Footer
src/components/hero/       первый экран
src/components/map/        карта дивизиона, лента `MapBand` с формой и огоньки
src/components/form/       форма «Зажгите свет»
src/components/about/      рассказ о проекте
src/components/involve/    пути участия
src/components/news/       лента новостей
src/components/resources/  музыка, материалы, видео и полноэкранные панели
src/components/quote/      цитата
src/data/copy.ts           весь пользовательский текст
src/styles/tokens.css      палитра, шрифты, размеры, радиусы и тени в @theme
src/styles/global.css      базовые стили, утилиты, keyframes, reduced motion
src/test/setup.ts          моки браузерных API для jsdom
```

Тесты лежат рядом с компонентами в файлах `*.test.tsx`.
