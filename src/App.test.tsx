import { render, screen } from "@testing-library/react";
import App from "./App";

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
    render(<App />);
    for (const id of expectedSectionIds) {
      const section = document.getElementById(id);
      expect(section).not.toBeNull();
      expect(section?.tagName).toBe("SECTION");
    }
  });

  it("рендерит ландмарки: main#main, header и footer", () => {
    render(<App />);
    expect(document.querySelector("main#main")).not.toBeNull();
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });

  it("даёт ссылку «Перейти к содержимому» на #main", () => {
    render(<App />);
    expect(screen.getByRole("link", { name: "Перейти к содержимому" })).toHaveAttribute(
      "href",
      "#main",
    );
  });

  it("показывает стеклянные карточки во всех секциях", () => {
    render(<App />);
    expect(document.querySelectorAll(".glass-card").length).toBeGreaterThanOrEqual(8);
    for (const id of expectedSectionIds) {
      expect(document.getElementById(id)?.querySelector(".glass-card")).not.toBeNull();
    }
  });
});
