import { render, screen } from "@testing-library/react";
import App from "./App";
import { LightsProvider } from "./state/lights";

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

function renderApp() {
  return render(
    <LightsProvider>
      <App />
    </LightsProvider>,
  );
}

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

  it("показывает стеклянные карточки во всех секциях", () => {
    renderApp();
    expect(document.querySelectorAll(".glass-card").length).toBeGreaterThanOrEqual(8);
    for (const id of expectedSectionIds) {
      expect(document.getElementById(id)?.querySelector(".glass-card")).not.toBeNull();
    }
  });
});
