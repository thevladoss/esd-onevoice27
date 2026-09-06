/* eslint-disable react-refresh/only-export-components --
   formatNewsDate живёт рядом с разметкой карточки: формат даты и её вёрстка меняются вместе.
   Ценой служит fast refresh этого файла. */
import { useState } from "react";
import { newsCopy } from "../../data/copy.news";
import type { NewsItem } from "../../data/news";
import "./news.css";

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

/**
 * «2026-09-05» превращает в «5 сентября 2026».
 * `timeZone: "UTC"` обязателен: строка без времени разбирается как UTC-полночь,
 * и в западных зонах локальная дата уехала бы на сутки назад.
 * На непарсимой строке `Intl` бросает `RangeError`, поэтому битая дата отдаёт пустую
 * строку: карточка тогда рисуется без даты и не уносит с собой весь лендинг.
 */
export function formatNewsDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return dateFormatter.format(date).replace(/\s?г\.$/u, "");
}

export function NewsCard({ item }: { item: NewsItem }) {
  const [coverFailed, setCoverFailed] = useState(false);
  const date = formatNewsDate(item.date);

  return (
    <article className="news-card h-full">
      <a
        href={item.href}
        target="_blank" rel="noopener noreferrer"
        className="news-card__link group overflow-hidden focus-visible:outline-2 focus-visible:-outline-offset-3 focus-visible:outline-horizon-400"
      >
        {/* Кадр 16:9 срезает у обложки `hqdefault.jpg` (480×360) чёрные полосы по 12,5%
            сверху и снизу: `object-cover object-center` масштабирует картинку по ширине,
            а лишнюю высоту обрезает поровну. Оверлей поверх кадра рисует news.css. */}
        <div className="news-card__cover aspect-video w-full">
          {coverFailed ? (
            <div
              aria-hidden="true"
              className="news-card__fallback flex h-full w-full flex-col items-center justify-start gap-1 bg-[linear-gradient(145deg,rgb(48_63_131/.86),rgb(18_12_52/.76))] px-4 pt-5 text-center"
            >
              <p className="font-body text-xs font-bold uppercase leading-[1.4] tracking-[0.08em] text-paper/78">
                {newsCopy.coverFailedTitle}
              </p>
              <p className="font-body text-xs leading-[1.4] text-paper/78">
                {newsCopy.coverFailedBody}
              </p>
            </div>
          ) : (
            <img
              src={item.cover}
              alt=""
              loading="lazy"
              decoding="async"
              onError={() => setCoverFailed(true)}
              className="news-card__image h-full w-full max-w-full object-cover object-center motion-safe:group-hover:scale-[1.035] motion-safe:group-focus-within:scale-[1.035]"
            />
          )}
        </div>
        {/* Цвет и типографику панели держит news.css: на ховере текст темнеет вместе с
            подложкой, поэтому утилит цвета на дате и заголовке нет. */}
        <div className="news-card__panel">
          {date ? (
            <time dateTime={item.date} className="news-card__date">
              {date}
            </time>
          ) : null}
          <h3 className="news-card__title line-clamp-3">{item.title}</h3>
        </div>
      </a>
    </article>
  );
}
