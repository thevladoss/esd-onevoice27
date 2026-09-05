import { fireEvent, render, screen, within } from "@testing-library/react";
import { News } from "./News";
import { formatNewsDate } from "./NewsCard";

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
    expect(screen.getByRole("button", { name: "Следующая страница" })).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent("Страница 2 из 2");
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Страница 2" }));
    expect(window.scrollTo).not.toHaveBeenCalled();
    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();
  });

  it("ведёт стрелкой на следующую страницу и гасит её на последней", () => {
    render(<News />);

    const next = screen.getByRole("button", { name: "Следующая страница" });
    expect(next).toBeEnabled();

    fireEvent.click(next);

    expect(screen.getAllByRole("article")).toHaveLength(3);
    expect(screen.getByRole("button", { name: "Следующая страница" })).toBeDisabled();
  });

  it("подписывает навигацию пагинации", () => {
    render(<News />);

    expect(screen.getByRole("navigation", { name: "Пагинация новостей" })).toBeInTheDocument();
  });
});

describe("formatNewsDate", () => {
  it("превращает ISO-дату в русскую запись без сокращения «г.»", () => {
    expect(formatNewsDate("2026-09-05")).toBe("5 сентября 2026");
    expect(formatNewsDate("2026-06-26")).toBe("26 июня 2026");
  });
});
