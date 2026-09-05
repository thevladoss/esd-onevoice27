export type PaginationResult<T> = {
  items: T[];
  page: number;
  totalPages: number;
};

/**
 * Режет список на страницы по `perPage`.
 * `page` зажимается в диапазон [1, totalPages], поэтому вызывающему коду
 * не нужно сторожить границы: пустой список отдаёт одну пустую страницу.
 */
export function paginate<T>(items: T[], page: number, perPage = 6): PaginationResult<T> {
  const totalPages = Math.max(1, Math.ceil(items.length / perPage));
  const safePage = Math.min(Math.max(1, Math.trunc(page) || 1), totalPages);
  const start = (safePage - 1) * perPage;

  return {
    items: items.slice(start, start + perPage),
    page: safePage,
    totalPages,
  };
}
