/* eslint-disable react-refresh/only-export-components --
   formatNewsDate живёт рядом с разметкой карточки: формат даты и её вёрстка меняются вместе.
   Ценой служит fast refresh этого файла. */
import { useState } from "react";
import { newsCopy } from "../../data/copy.news";
import type { NewsItem } from "../../data/news";

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
    <article className="h-full">
      <a
        href={item.href}
        target="_blank" rel="noopener noreferrer"
        className="group relative block h-full overflow-hidden rounded-card border border-[var(--glass-border)] bg-midnight-900 transition-colors duration-[420ms] ease-header hover:border-[rgb(123_194_199/.4)] focus-within:border-[rgb(123_194_199/.4)] focus-visible:outline-2 focus-visible:-outline-offset-3 focus-visible:outline-horizon-400"
      >
        <div className="aspect-[4/5] w-full overflow-hidden">
          {coverFailed ? (
            <div
              aria-hidden="true"
              className="flex h-full w-full flex-col items-center justify-center gap-1 bg-[linear-gradient(145deg,rgb(48_63_131/.86),rgb(18_12_52/.76))] px-4 pb-20 text-center"
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
              className="h-full w-full max-w-full object-cover object-center transition-transform duration-[520ms] ease-header motion-safe:group-hover:scale-[1.04]"
            />
          )}
        </div>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_38%,rgb(7_2_16/.9)_100%)]"
        />
        <div className="absolute inset-x-4 bottom-4 flex flex-col gap-2">
          {date ? (
            <time
              dateTime={item.date}
              className="font-body text-xs font-bold uppercase leading-[1.4] tracking-[0.08em] text-horizon-200"
            >
              {date}
            </time>
          ) : null}
          <h3 className="line-clamp-4 font-display text-[22px] font-extrabold leading-[1.15] tracking-[-0.03em] text-paper [text-wrap:balance]">
            {item.title}
          </h3>
        </div>
      </a>
    </article>
  );
}
