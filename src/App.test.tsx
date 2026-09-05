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

// Секции с готовой вёрсткой: у них своя раскладка вместо стеклянной карточки-заглушки.
const finishedSectionIds = ["hero"];
const placeholderSectionIds = expectedSectionIds.filter((id) => !finishedSectionIds.includes(id));

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

  it("показывает стеклянные карточки в секциях-заглушках", () => {
    render(<App />);
    expect(document.querySelectorAll(".glass-card").length).toBeGreaterThanOrEqual(
      placeholderSectionIds.length,
    );
    for (const id of placeholderSectionIds) {
      expect(document.getElementById(id)?.querySelector(".glass-card")).not.toBeNull();
    }
  });
});
