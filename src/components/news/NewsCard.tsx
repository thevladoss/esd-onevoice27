/* eslint-disable react-refresh/only-export-components --
   formatNewsDate живёт рядом с разметкой карточки: формат даты и её вёрстка меняются вместе.
   Ценой служит fast refresh этого файла. */
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
 */
export function formatNewsDate(iso: string): string {
  return dateFormatter.format(new Date(iso)).replace(/\s?г\.$/u, "");
}

export function NewsCard({ item }: { item: NewsItem }) {
  return (
    <article className="h-full">
      <a
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative block h-full overflow-hidden rounded-card border border-[var(--glass-border)] bg-midnight-900 transition-colors duration-[420ms] ease-header hover:border-[rgb(123_194_199/.4)] focus-within:border-[rgb(123_194_199/.4)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-horizon-400"
      >
        <div className="aspect-[4/5] w-full overflow-hidden">
          <img
            src={item.cover}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover object-center transition-transform duration-[520ms] ease-header motion-safe:group-hover:scale-[1.04]"
          />
        </div>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_38%,rgb(7_2_16/.82)_100%)]"
        />
        <div className="absolute inset-x-4 bottom-4 flex flex-col gap-2">
          <time
            dateTime={item.date}
            className="font-body text-xs font-bold uppercase leading-[1.4] tracking-[0.08em] text-horizon-200"
          >
            {formatNewsDate(item.date)}
          </time>
          <h3 className="line-clamp-4 font-display text-[22px] font-extrabold leading-[1.15] tracking-[-0.03em] text-paper [text-wrap:balance]">
            {item.title}
          </h3>
        </div>
      </a>
    </article>
  );
}
