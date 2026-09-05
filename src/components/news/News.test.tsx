import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { enterViewport } from "../../test/intersection";
import { News } from "./News";
import { formatNewsDate } from "./NewsCard";
import { news } from "../../data/news";

beforeEach(() => {
  vi.mocked(window.scrollTo).mockClear();
  vi.mocked(Element.prototype.scrollIntoView).mockClear();
});

describe("News", () => {
  it("рендерит шапку секции и шесть карточек на первой странице", () => {
    render(<News />);

    expect(document.getElementById("news")).not.toBeNull();
    expect(screen.getByText("На каждом канале")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "Каждая платформа становится голосом" }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("article")).toHaveLength(6);
  });

  it("открывает каждую новость в новой вкладке и показывает дату машиночитаемо", () => {
    render(<News />);

    for (const article of screen.getAllByRole("article")) {
      const link = within(article).getByRole("link");
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
      expect(link).toHaveAttribute("href", expect.stringMatching(/^https:\/\//));

      const time = article.querySelector("time");
      expect(time).not.toBeNull();
      expect(time?.getAttribute("dateTime")).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("переключает страницу по клику на цифру, не трогая скролл и фокус", () => {
    render(<News />);

    const firstPage = screen.getByRole("button", { name: "Страница 1" });
    expect(firstPage).toHaveAttribute("aria-current", "page");

    const secondPage = screen.getByRole("button", { name: "Страница 2" });
    secondPage.focus();
    fireEvent.click(secondPage);

    expect(screen.getAllByRole("article")).toHaveLength(3);
    expect(screen.getByRole("button", { name: "Страница 2" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("button", { name: "Страница 1" })).not.toHaveAttribute("aria-current");
    expect(screen.getByRole("button", { name: "Следующая страница" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    expect(screen.getByRole("status")).toHaveTextContent("Страница 2 из 2");
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Страница 2" }));
    expect(window.scrollTo).not.toHaveBeenCalled();
    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();
  });

  it("ведёт стрелкой на следующую страницу и гасит её на последней", () => {
    render(<News />);

    const next = screen.getByRole("button", { name: "Следующая страница" });
    expect(next).toHaveAttribute("aria-disabled", "false");

    fireEvent.click(next);

    expect(screen.getAllByRole("article")).toHaveLength(3);
    expect(screen.getByRole("button", { name: "Следующая страница" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });

  it("держит погашенную стрелку в дереве фокуса и не листает дальше последней страницы", () => {
    render(<News />);

    const next = screen.getByRole("button", { name: "Следующая страница" });
    next.focus();
    fireEvent.click(next);

    const quenched = screen.getByRole("button", { name: "Следующая страница" });
    expect(quenched).toHaveAttribute("aria-disabled", "true");
    expect(document.activeElement).toBe(quenched);

    fireEvent.click(quenched);

    expect(screen.getByRole("status")).toHaveTextContent("Страница 2 из 2");
    expect(screen.getAllByRole("article")).toHaveLength(3);
    expect(document.activeElement).toBe(quenched);
  });

  it("именует секцию заголовком и держит кольцо фокуса внутри обрезанной карточки", () => {
    render(<News />);

    const section = document.getElementById("news") as HTMLElement;
    expect(section).toHaveAttribute("aria-labelledby", "news-title");

    const label = document.getElementById("news-title");
    expect(label).not.toBeNull();
    expect(label).toHaveTextContent("Каждая платформа становится голосом");
    expect(label?.closest("h2")).not.toBeNull();

    for (const article of screen.getAllByRole("article")) {
      const link = within(article).getByRole("link");
      expect(link.className).toContain("-outline-offset-3");
      expect(link.className).toContain("overflow-hidden");
    }
  });

  it("держит обложку в пропорции 4:5 и не даёт ей растянуться", () => {
    render(<News />);

    for (const article of screen.getAllByRole("article")) {
      const frame = article.querySelector("div.aspect-\\[4\\/5\\]");
      expect(frame).not.toBeNull();

      const image = article.querySelector("img");
      expect(image?.className).toContain("object-cover");
      expect(image?.className).toContain("max-w-full");
    }
  });

  it("подписывает навигацию пагинации", () => {
    render(<News />);

    expect(screen.getByRole("navigation", { name: "Пагинация новостей" })).toBeInTheDocument();
  });

  it("держит обложку декоративной, а заголовок и дату — в правильном порядке", () => {
    render(<News />);

    for (const article of screen.getAllByRole("article")) {
      const image = article.querySelector("img");
      expect(image).toHaveAttribute("alt", "");
      expect(image).toHaveAttribute("loading", "lazy");

      const heading = within(article).getByRole("heading", { level: 3 });
      expect(heading.textContent?.trim().length ?? 0).toBeGreaterThan(0);

      const marked = article.querySelectorAll("time, h3");
      expect(marked[0].tagName).toBe("TIME");
      expect(marked[1].tagName).toBe("H3");
    }
  });

  it("заменяет упавшую обложку плашкой, сохраняя ссылку и заголовок", () => {
    render(<News />);

    const [first] = screen.getAllByRole("article");
    const image = first.querySelector("img");
    expect(image).not.toBeNull();

    fireEvent.error(image as HTMLImageElement);

    expect(first.querySelector("img")).toBeNull();
    expect(within(first).getByText("Обложка недоступна")).toBeInTheDocument();
    expect(
      within(first).getByText("Заголовок и ссылка на месте — откройте новость"),
    ).toBeInTheDocument();
    expect(within(first).getByRole("link")).toHaveAttribute("rel", "noopener noreferrer");
    expect(within(first).getByRole("heading", { level: 3 })).toBeInTheDocument();
    expect(screen.getAllByRole("article")).toHaveLength(6);
  });

  it("рисует карточку с битой датой без <time> и не роняет секцию", () => {
    render(
      <News
        items={[
          {
            id: "broken-date",
            title: "Новость с испорченной датой",
            date: "2026-13-45",
            cover: "https://img.youtube.com/vi/YpLD6p-z00g/hqdefault.jpg",
            href: "https://esd.onevoice27.org/",
            source: "esd.onevoice27.org",
          },
        ]}
      />,
    );

    const [article] = screen.getAllByRole("article");
    expect(article.querySelector("time")).toBeNull();
    expect(
      within(article).getByRole("heading", { level: 3, name: "Новость с испорченной датой" }),
    ).toBeInTheDocument();
  });

  it("объясняет пустой список без мёртвой кнопки возврата на ту же страницу", () => {
    render(<News items={[]} />);

    expect(screen.queryAllByRole("article")).toHaveLength(0);
    expect(screen.getByText("На этой странице новостей нет")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Вернуться к первой странице" })).toBeNull();
    expect(screen.getByRole("button", { name: "Страница 1" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.queryByRole("button", { name: "Страница 2" })).toBeNull();
    expect(screen.getByRole("button", { name: "Следующая страница" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    expect(screen.getByRole("status")).toHaveTextContent("Страница 1 из 1");
  });

  it("после укорочения списка показывает пустое состояние и рабочий возврат на первую страницу", () => {
    const { rerender } = render(<News />);

    fireEvent.click(screen.getByRole("button", { name: "Страница 2" }));
    expect(screen.getAllByRole("article")).toHaveLength(3);

    rerender(<News items={news.slice(0, 3)} />);

    expect(screen.queryAllByRole("article")).toHaveLength(0);
    expect(screen.getByText("На этой странице новостей нет")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Вернуться к первой странице" }));

    expect(screen.getAllByRole("article")).toHaveLength(3);
    expect(screen.queryByText("На этой странице новостей нет")).toBeNull();
    expect(screen.getByRole("status")).toHaveTextContent("Страница 1 из 1");
  });
});

describe("News: появление карточек при скролле", () => {
  /** Появление идёт 700 мс реального времени, поэтому ожиданию нужен запас. */
  const REVEAL_TIMEOUT = 3000;

  function cardCells() {
    return screen.getAllByRole("article").map((article) => article.closest("li") as HTMLElement);
  }

  it("показывает карточки второй страницы, а не оставляет пустую сетку", async () => {
    render(<News />);

    act(() => enterViewport());
    await waitFor(
      () => {
        for (const cell of cardCells()) {
          expect(cell.style.opacity).toBe("1");
        }
      },
      { timeout: REVEAL_TIMEOUT },
    );

    fireEvent.click(screen.getByRole("button", { name: "Страница 2" }));
    // Браузер сообщает о пересечении и той группе, за которой начал наблюдать после клика.
    act(() => enterViewport());

    await waitFor(
      () => {
        const cells = cardCells();
        expect(cells).toHaveLength(3);
        for (const cell of cells) {
          expect(cell.style.opacity).toBe("1");
        }
      },
      { timeout: REVEAL_TIMEOUT },
    );

    for (const cell of cardCells()) {
      expect(cell.style.transform ?? "").not.toContain("24px");
    }
  });
});

describe("formatNewsDate", () => {
  it("превращает ISO-дату в русскую запись без сокращения «г.»", () => {
    expect(formatNewsDate("2026-09-05")).toBe("5 сентября 2026");
    expect(formatNewsDate("2026-06-26")).toBe("26 июня 2026");
  });

  it("на непарсимой дате отдаёт пустую строку вместо RangeError", () => {
    expect(formatNewsDate("2026-13-45")).toBe("");
    expect(formatNewsDate("")).toBe("");
    expect(formatNewsDate("вчера")).toBe("");
  });
});
