import { newsCopy } from "../../data/copy.news";

const BUTTON_BASE =
  "inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg font-body text-xs font-bold uppercase leading-[1.4] tracking-[0.08em] transition-colors duration-[240ms] ease-header focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-horizon-400";

function ChevronRight() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M7.5 4.5 13 10l-5.5 5.5" />
    </svg>
  );
}

export function NewsPagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);
  const isLast = page >= totalPages;

  return (
    <nav aria-label={newsCopy.paginationLabel}>
      <ul className="flex items-center justify-center gap-2">
        {pages.map((n) => {
          const isCurrent = n === page;
          return (
            <li key={n}>
              <button
                type="button"
                aria-label={newsCopy.pageLabel(n)}
                aria-current={isCurrent ? "page" : undefined}
                onClick={() => onChange(n)}
                className={
                  BUTTON_BASE +
                  (isCurrent
                    ? " bg-[image:var(--gradient-action)] text-paper shadow-[0_10px_24px_rgb(59_77_161/.34)]"
                    : " text-paper/62 hover:bg-[rgb(33_26_62/.44)] hover:text-paper")
                }
              >
                {n}
              </button>
            </li>
          );
        })}
        <li>
          {/* На последней странице стрелка гасится через `aria-disabled`, а не `disabled`:
              нативный `disabled` выбрасывает кнопку из дерева фокуса, браузер отдаёт фокус
              в `body`, и клавиатурный пользователь после клика начинает обход с начала страницы. */}
          <button
            type="button"
            aria-label={newsCopy.nextPage}
            aria-disabled={isLast}
            onClick={() => {
              if (!isLast) {
                onChange(page + 1);
              }
            }}
            className={
              BUTTON_BASE +
              " text-paper/62 hover:bg-[rgb(33_26_62/.44)] hover:text-paper aria-disabled:cursor-not-allowed aria-disabled:opacity-[.38] aria-disabled:hover:bg-transparent aria-disabled:hover:text-paper/62"
            }
          >
            <ChevronRight />
          </button>
        </li>
      </ul>
    </nav>
  );
}
