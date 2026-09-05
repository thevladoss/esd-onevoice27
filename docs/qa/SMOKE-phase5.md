# Smoke фазы 5 (браузер, Playwright)

## После волны 1 (коммит 9b0b3b8, бандл index-D57SdMCf.js)

| Проверка | Результат |
|---|---|
| Яркость canvas глобуса, область 55–95% × 15–75% | средняя 125/255, освещённых сэмплов 100% (до фазы 5: 10/255 и 7%); сфера читается, не пересвечена (phase5-live-hero.jpeg) |
| `data-anim` на слоях | stars, globe, beam, pulse, wave, halo (particles/atmosphere добавит план 05-04) |
| Reveal | карточки #about видимы (opacity 1) после прокрутки к секции |
| prefers-reduced-motion: reduce | цитата видна сразу (opacity 1), анимация волн футера `none` |
| Ошибки консоли | 0 |

## После волны 2 (коммит 1f36371, бандл index-7ztBT3w7.js)

| Проверка | Результат |
|---|---|
| `section[aria-labelledby]` | все 8 секций: hero, map, light-form, about, involve, news, resources, quote |
| `data-anim` в ресурсах | atmosphere, particles ×3 |
| Мобильный 390: горизонтальный скролл / высота страницы | нет / 13 200px, секции стекуются (phase5-live-mobile-full.jpeg) |
| Форма на 1440 | стеклянная карточка, радио-карточки, резерв под строку ошибки (phase5-live-form.jpeg) |
| Ошибки консоли | 0 |
