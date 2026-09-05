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

  it("в дев-сборке пишет в консоль ошибку и стек компонентов", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    );

    const ours = errorSpy.mock.calls.find(([first]) => first === "Рендер упал:");
    expect(ours, "componentDidCatch не залогировал падение").toBeDefined();
    expect((ours?.[1] as Error).message).toBe("поломка рендера");
    expect(String(ours?.[2])).toContain("Boom");

    errorSpy.mockRestore();
  });

  it("в продакшн-сборке молчит", () => {
    vi.stubEnv("DEV", false);
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    );

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(errorSpy.mock.calls.some(([first]) => first === "Рендер упал:")).toBe(false);

    errorSpy.mockRestore();
    vi.unstubAllEnvs();
  });
});
