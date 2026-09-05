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

// Секции с готовой вёрсткой: у них своя раскладка вместо стеклянной карточки-заглушки.
const finishedSectionIds = ["hero", "map", "light-form", "about", "involve", "news", "quote"];
const placeholderSectionIds = expectedSectionIds.filter((id) => !finishedSectionIds.includes(id));

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

  it("показывает стеклянные карточки в секциях-заглушках", () => {
    renderApp();
    expect(document.querySelectorAll(".glass-card").length).toBeGreaterThanOrEqual(
      placeholderSectionIds.length,
    );
    for (const id of placeholderSectionIds) {
      expect(document.getElementById(id)?.querySelector(".glass-card")).not.toBeNull();
    }
  });
});
