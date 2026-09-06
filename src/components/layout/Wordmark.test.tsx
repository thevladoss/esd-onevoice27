import { render, screen } from "@testing-library/react";
import { Wordmark } from "./Wordmark";

describe("Wordmark", () => {
  it("показывает название и подпись", () => {
    render(<Wordmark />);
    expect(screen.getByText("Единый голос 27")).toBeInTheDocument();
    expect(screen.getByText("МИССИЯ ДЛЯ ВСЕХ")).toBeInTheDocument();
  });

  it("вешает класс wordmark на корень и градиент на заголовок", () => {
    const { container } = render(<Wordmark />);
    expect(container.firstElementChild).toHaveClass("wordmark");
    expect(screen.getByText("Единый голос 27")).toHaveClass("text-gradient-brand");
  });

  it("снимает градиент с названия в однотонном варианте", () => {
    render(<Wordmark tone="solid" />);

    expect(screen.getByText("Единый голос 27")).toHaveClass("wordmark__title");
    expect(screen.getByText("Единый голос 27")).not.toHaveClass("text-gradient-brand");
  });

  it("добавляет переданный className к корню", () => {
    const { container } = render(<Wordmark className="header__wordmark" />);
    expect(container.firstElementChild).toHaveClass("wordmark", "header__wordmark");
  });

  it("по умолчанию не вешает модификатор размера", () => {
    const { container } = render(<Wordmark />);
    const root = container.firstElementChild as HTMLElement;

    expect(root).toHaveClass("wordmark");
    expect(root).not.toHaveClass("wordmark--footer");
    expect(root.className).toBe("wordmark");
  });

  it("в размере footer добавляет wordmark--footer и сохраняет градиент названия", () => {
    const { container } = render(<Wordmark size="footer" />);

    expect(container.firstElementChild).toHaveClass("wordmark", "wordmark--footer");
    expect(screen.getByText("Единый голос 27")).toHaveClass("text-gradient-brand");
  });

  it("совмещает размер footer с className и однотонным названием", () => {
    const { container } = render(<Wordmark size="footer" tone="solid" className="x" />);

    expect(container.firstElementChild).toHaveClass("wordmark", "wordmark--footer", "x");
    expect(screen.getByText("Единый голос 27")).not.toHaveClass("text-gradient-brand");
  });
});
