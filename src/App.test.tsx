import { render, screen } from "@testing-library/react";
import App from "./App";
import { LightsProvider } from "./state/lights";

// Секция карты, счётчики и форма читают контекст огоньков, поэтому приложение живёт под провайдером.
function renderApp() {
  return render(
    <LightsProvider>
      <App />
    </LightsProvider>,
  );
}

const expectedSectionIds = [
  "hero",
  "map",
  "light-form",
  "about",
  "involve",
  "news",
  "resources",
  "quote",
];


describe("App", () => {
  it("рендерит восемь секций с ожидаемыми id", () => {
    renderApp();
    for (const id of expectedSectionIds) {
      const section = document.getElementById(id);
      expect(section).not.toBeNull();
      expect(section?.tagName).toBe("SECTION");
    }
  });

  it("рендерит ландмарки: main#main, header и footer", () => {
    renderApp();
    expect(document.querySelector("main#main")).not.toBeNull();
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });

  it("даёт ссылку «Перейти к содержимому» на #main", () => {
    renderApp();
    expect(screen.getByRole("link", { name: "Перейти к содержимому" })).toHaveAttribute(
      "href",
      "#main",
    );
  });

  it("ставит ссылку пропуска первой в обходе с клавиатуры", () => {
    const { container } = renderApp();
    const focusable = container.querySelectorAll<HTMLElement>(
      'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );

    expect(focusable[0]).toHaveAccessibleName("Перейти к содержимому");
    // Дальше по контракту идут вордмарк и пункты меню, то есть шапка.
    expect(focusable[1].closest("header")).not.toBeNull();
  });

  it("делает main фокусируемым, чтобы ссылка пропуска доводила фокус до контента", () => {
    renderApp();
    const main = document.querySelector("main#main");

    expect(main).toHaveAttribute("tabindex", "-1");

    (main as HTMLElement).focus();
    expect(document.activeElement).toBe(main);
  });

  it("все восемь секций содержат реальную вёрстку, а не заглушки", () => {
    renderApp();
    for (const id of expectedSectionIds) {
      const section = document.getElementById(id);
      expect(section?.textContent?.trim().length ?? 0).toBeGreaterThan(20);
    }
  });
});
