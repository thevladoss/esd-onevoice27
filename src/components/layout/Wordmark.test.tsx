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
});
