import { paginate } from "./paginate";

const nine = [1, 2, 3, 4, 5, 6, 7, 8, 9];

describe("paginate", () => {
  it("отдаёт шесть элементов и две страницы для девяти новостей", () => {
    const result = paginate(nine, 1, 6);

    expect(result.items).toEqual([1, 2, 3, 4, 5, 6]);
    expect(result.page).toBe(1);
    expect(result.totalPages).toBe(2);
  });

  it("отдаёт остаток из трёх элементов на второй странице", () => {
    const result = paginate(nine, 2, 6);

    expect(result.items).toEqual([7, 8, 9]);
    expect(result.page).toBe(2);
    expect(result.totalPages).toBe(2);
  });

  it("зажимает страницу ниже первой в первую", () => {
    const result = paginate(nine, 0, 6);

    expect(result.page).toBe(1);
    expect(result.items).toHaveLength(6);
  });

  it("зажимает страницу выше последней в последнюю", () => {
    const result = paginate(nine, 99, 6);

    expect(result.page).toBe(2);
    expect(result.items).toEqual([7, 8, 9]);
  });

  it("на пустом списке отдаёт одну пустую страницу", () => {
    const result = paginate([], 1, 6);

    expect(result.items).toEqual([]);
    expect(result.page).toBe(1);
    expect(result.totalPages).toBe(1);
  });

  it("считает три страницы при perPage = 4", () => {
    const result = paginate(nine, 3, 4);

    expect(result.totalPages).toBe(3);
    expect(result.items).toEqual([9]);
  });

  it("берёт perPage = 6 по умолчанию", () => {
    expect(paginate(nine, 1)).toEqual(paginate(nine, 1, 6));
    expect(paginate(nine, 2).items).toHaveLength(3);
  });

  it("сохраняет исходный порядок и типы элементов", () => {
    const items = [{ id: "a" }, { id: "b" }, { id: "c" }];
    const result = paginate(items, 1, 2);

    expect(result.items).toEqual([{ id: "a" }, { id: "b" }]);
    expect(result.totalPages).toBe(2);
  });
});
