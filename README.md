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
