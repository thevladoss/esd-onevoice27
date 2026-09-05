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

Пуш в ветку `main` запускает workflow `.github/workflows/deploy.yml`: он ставит зависимости через `npm ci`, гоняет `npm test`, собирает `npm run build` и публикует папку `dist` на GitHub Pages. Публикация идёт через OIDC, секреты и токены не нужны. Билд собирается с базовым путём `/esd-onevoice27/`, поэтому ассеты подтягиваются из подпапки репозитория.

## Проверка деплоя

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
src/components/map/        карта дивизиона
src/components/form/       форма «Зажгите свет»
src/components/about/      рассказ о проекте
src/components/involve/    пути участия
src/components/news/       лента новостей
src/components/resources/  музыка, материалы, видео
src/components/quote/      цитата
src/data/copy.ts           весь пользовательский текст
src/styles/tokens.css      палитра, шрифты, размеры, радиусы и тени в @theme
src/styles/global.css      базовые стили, утилиты, keyframes, reduced motion
src/test/setup.ts          моки браузерных API для jsdom
```

Тесты лежат рядом с компонентами в файлах `*.test.tsx`.
