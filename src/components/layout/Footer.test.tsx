import { render, screen, within } from "@testing-library/react";
import { Footer } from "./Footer";

describe("Footer", () => {
  it("рендерит ландмарк contentinfo с вордмарком, подписью и юридической строкой", () => {
    render(<Footer />);
    const footer = screen.getByRole("contentinfo");

    expect(within(footer).getByText("Единый голос 27")).toBeInTheDocument();
    expect(within(footer).getByText("МИССИЯ ДЛЯ ВСЕХ")).toBeInTheDocument();
    expect(
      within(footer).getByText("Официальный сайт Церкви христиан адвентистов седьмого дня"),
    ).toBeInTheDocument();
    expect(
      within(footer).getByText(
        "© 2026 Евро-Азиатский дивизион Церкви христиан-адвентистов седьмого дня",
      ),
    ).toBeInTheDocument();
  });

  it("собирает внешние ссылки в навигации «Внешние ссылки»", () => {
    render(<Footer />);
    const nav = screen.getByRole("navigation", { name: "Внешние ссылки" });
    const links = within(nav).getAllByRole("link");

    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute("href", "https://esd.adventist.org");
    expect(links[0]).toHaveAccessibleName(/^Евро-Азиатский дивизион/);
    expect(links[1]).toHaveAttribute("href", "https://onevoice27.org");
    expect(links[1]).toHaveAccessibleName(/^OneVoice27 \(глобальный сайт\)/);
  });

  it("открывает внешние ссылки в новой вкладке с защитой от reverse tabnabbing", () => {
    render(<Footer />);
    const nav = screen.getByRole("navigation", { name: "Внешние ссылки" });

    for (const link of within(nav).getAllByRole("link")) {
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");

      const hint = within(link).getByText("(откроется в новой вкладке)");
      expect(hint).toHaveClass("sr-only");
    }
  });

  it("не добавляет заголовков в footer", () => {
    render(<Footer />);
    const footer = screen.getByRole("contentinfo");

    expect(within(footer).queryAllByRole("heading")).toHaveLength(0);
    expect(footer.querySelectorAll("h1, h2, h3, h4, h5, h6")).toHaveLength(0);
  });
});
