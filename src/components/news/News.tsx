import { useState } from "react";
import { newsCopy } from "../../data/copy.news";
import { news } from "../../data/news";
import type { NewsItem } from "../../data/news";
import { paginate } from "../../lib/paginate";
import { Button } from "../layout/Button";
import { Eyebrow } from "../layout/Eyebrow";
import { GradientTitle } from "../layout/GradientTitle";
import { Reveal, RevealGroup, RevealItem } from "../layout/Reveal";
import { NewsCard } from "./NewsCard";
import { NewsPagination } from "./NewsPagination";

const PER_PAGE = 6;

export function News({ items = news }: { items?: NewsItem[] } = {}) {
  const [page, setPage] = useState(1);
  const result = paginate(items, page, PER_PAGE);
  /** `paginate` зажимает страницу в границы, поэтому сырое состояние выше `totalPages` значит одно:
   *  список укоротился под ногами, и пользователь стоит на исчезнувшей странице. Только в этом
   *  случае возврат к первой странице что-то меняет, поэтому кнопку показываем там же. */
  const outOfRange = page > result.totalPages;
  const isEmpty = outOfRange || result.items.length === 0;

  return (
    <section
      id="news"
      aria-labelledby="news-title"
      className="relative -mt-6 bg-midnight-900 [clip-path:polygon(0_24px,100%_0,100%_100%,0_100%)] md:-mt-12 md:[clip-path:polygon(0_48px,100%_0,100%_100%,0_100%)]"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_88%_18%,rgb(84_164_172/.14),transparent_38%),radial-gradient(circle_at_8%_72%,rgb(48_63_131/.22),transparent_42%)]"
      />
      <div className="relative mx-auto max-w-[72rem] px-4 pt-[calc(4rem+24px)] pb-16 md:px-8 md:pt-[calc(6rem+48px)] md:pb-24">
        <Reveal className="max-w-[34rem]">
          <Eyebrow>{newsCopy.eyebrow}</Eyebrow>
          <GradientTitle as="h2" variant="section" className="mt-2">
            {/* id живёт на внутреннем span: GradientTitle в этой волне правит план 05-03,
                а имя секции считается по тексту элемента, на который смотрит aria-labelledby. */}
            <span id="news-title">{newsCopy.title}</span>
          </GradientTitle>
          <p className="mt-4 font-body text-base leading-[1.5] text-paper/78">{newsCopy.body}</p>
        </Reveal>

        {isEmpty ? (
          <div className="mt-12 rounded-card border border-[var(--glass-border)] p-8 text-center">
            <p className="font-body text-base leading-[1.5] text-paper/78">{newsCopy.emptyTitle}</p>
            {page > 1 ? (
              <Button
                variant="ghost"
                as="button"
                type="button"
                className="mt-6"
                onClick={() => setPage(1)}
              >
                {newsCopy.emptyAction}
              </Button>
            ) : null}
          </div>
        ) : (
          // Ключ по номеру страницы пересобирает группу на каждом переходе. Без этого
          // карточки следующей страницы остаются с opacity 0 навсегда: motion раздаёт
          // вариант «visible» детям один раз, в момент пересечения группы с областью
          // просмотра, а ребёнок, смонтированный позже, наследует только initial="hidden".
          <RevealGroup
            key={result.page}
            as="ul"
            className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8"
          >
            {result.items.map((item) => (
              <RevealItem as="li" key={item.id} className="min-w-0">
                <NewsCard item={item} />
              </RevealItem>
            ))}
          </RevealGroup>
        )}

        <p role="status" className="sr-only">
          {newsCopy.pageStatus(result.page, result.totalPages)}
        </p>

        <Reveal delay={0.1} className="mt-12">
          <NewsPagination page={result.page} totalPages={result.totalPages} onChange={setPage} />
        </Reveal>
      </div>
    </section>
  );
}
