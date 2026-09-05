import { useState } from "react";
import { newsCopy } from "../../data/copy.news";
import { news } from "../../data/news";
import type { NewsItem } from "../../data/news";
import { paginate } from "../../lib/paginate";
import { Button } from "../layout/Button";
import { Eyebrow } from "../layout/Eyebrow";
import { GradientTitle } from "../layout/GradientTitle";
import { NewsCard } from "./NewsCard";
import { NewsPagination } from "./NewsPagination";

const PER_PAGE = 6;

export function News({ items = news }: { items?: NewsItem[] } = {}) {
  const [page, setPage] = useState(1);
  const result = paginate(items, page, PER_PAGE);

  return (
    <section
      id="news"
      className="relative -mt-6 bg-midnight-900 [clip-path:polygon(0_24px,100%_0,100%_100%,0_100%)] md:-mt-12 md:[clip-path:polygon(0_48px,100%_0,100%_100%,0_100%)]"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_88%_18%,rgb(84_164_172/.14),transparent_38%),radial-gradient(circle_at_8%_72%,rgb(48_63_131/.22),transparent_42%)]"
      />
      <div className="relative mx-auto max-w-[72rem] px-4 pt-[calc(4rem+24px)] pb-16 md:px-8 md:pt-[calc(6rem+48px)] md:pb-24">
        <div className="max-w-[34rem]">
          <Eyebrow>{newsCopy.eyebrow}</Eyebrow>
          <GradientTitle as="h2" variant="section" className="mt-2">
            {newsCopy.title}
          </GradientTitle>
          <p className="mt-4 font-body text-base leading-[1.5] text-paper/80">{newsCopy.body}</p>
        </div>

        {result.items.length === 0 ? (
          <div className="mt-12 rounded-card border border-[var(--glass-border)] p-8 text-center">
            <p className="font-body text-base leading-[1.5] text-paper/80">{newsCopy.emptyTitle}</p>
            <Button
              variant="ghost"
              as="button"
              type="button"
              className="mt-6"
              onClick={() => setPage(1)}
            >
              {newsCopy.emptyAction}
            </Button>
          </div>
        ) : (
          <ul className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
            {result.items.map((item) => (
              <li key={item.id}>
                <NewsCard item={item} />
              </li>
            ))}
          </ul>
        )}

        <p role="status" className="sr-only">
          {newsCopy.pageStatus(result.page, result.totalPages)}
        </p>

        <div className="mt-12">
          <NewsPagination page={result.page} totalPages={result.totalPages} onChange={setPage} />
        </div>
      </div>
    </section>
  );
}
