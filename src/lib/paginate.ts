export type PaginationResult<T> = {
  items: T[];
  page: number;
  totalPages: number;
};

/**
 * Режет список на страницы по `perPage`.
 * `page` зажимается в диапазон [1, totalPages], а `perPage` — в целое число от одного,
 * поэтому вызывающему коду не нужно сторожить границы: пустой список отдаёт одну пустую
 * страницу, `perPage = 0` больше не даёт `totalPages: Infinity`, а отрицательный `perPage`
 * не срезает хвост списка через `slice(0, -2)`.
 */
export function paginate<T>(items: T[], page: number, perPage = 6): PaginationResult<T> {
  const size = Math.max(1, Math.trunc(perPage) || 1);
  const totalPages = Math.max(1, Math.ceil(items.length / size));
  const safePage = Math.min(Math.max(1, Math.trunc(page) || 1), totalPages);
  const start = (safePage - 1) * size;

  return {
    items: items.slice(start, start + size),
    page: safePage,
    totalPages,
  };
}
