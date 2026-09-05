import { render, screen } from "@testing-library/react";

import { ErrorBoundary } from "./ErrorBoundary";

function Boom(): never {
  throw new Error("поломка рендера");
}

describe("ErrorBoundary", () => {
  it("пропускает детей, пока всё цело", () => {
    render(
      <ErrorBoundary>
        <p>секции страницы</p>
      </ErrorBoundary>,
    );

    expect(screen.getByText("секции страницы")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("ловит исключение рендера и показывает аварийный экран вместо белого", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Страница не загрузилась");
    expect(screen.getByRole("alert")).toHaveTextContent("Обновите страницу");
    expect(errorSpy).toHaveBeenCalled();

    errorSpy.mockRestore();
  });
});
