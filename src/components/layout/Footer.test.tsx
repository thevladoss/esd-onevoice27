import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen, within } from "@testing-library/react";
import { Footer } from "./Footer";

/* Стили футера читаются с диска: vitest настроен с css: false, поэтому импорт
   CSS-модуля отдал бы пустую строку (тот же приём, что в Header.test.tsx). */
const FOOTER_CSS = readFileSync(
  resolve(process.cwd(), "src/components/layout/Footer.css"),
  "utf8",
);

const CAPTION = "Официальный сайт Церкви христиан адвентистов седьмого дня";
const LEGAL = "© 2026 Евро-Азиатский дивизион Церкви христиан-адвентистов седьмого дня";

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

  it("помечает волны и гало атрибутами реестра движения", () => {
    render(<Footer />);
    const footer = screen.getByRole("contentinfo");

    // Волны дрейфуют фоном самого footer, гало живёт отдельным узлом.
    expect(footer).toHaveAttribute("data-anim", "wave");

    const halo = footer.querySelector(".site-footer__halo");
    expect(halo).toHaveAttribute("data-anim", "halo");
    expect(halo).toHaveAttribute("aria-hidden", "true");
  });

  it("не добавляет заголовков в footer", () => {
    render(<Footer />);
    const footer = screen.getByRole("contentinfo");

    expect(within(footer).queryAllByRole("heading")).toHaveLength(0);
    expect(footer.querySelectorAll("h1, h2, h3, h4, h5, h6")).toHaveLength(0);
  });

  it("выстраивает колонку: логотип → подпись → ссылки → юридический текст", () => {
    render(<Footer />);
    const footer = screen.getByRole("contentinfo");
    const inner = footer.querySelector(".site-footer__inner");
    const children = Array.from(inner?.children ?? []);

    const wordmark = inner?.querySelector(".wordmark");
    const caption = within(footer).getByText(CAPTION);
    const nav = screen.getByRole("navigation", { name: "Внешние ссылки" });
    const legal = within(footer).getByText(LEGAL);

    expect(children).toHaveLength(4);
    expect([
      children.indexOf(wordmark as Element),
      children.indexOf(caption),
      children.indexOf(nav),
      children.indexOf(legal),
    ]).toEqual([0, 1, 2, 3]);

    expect(caption).toHaveClass("site-footer__caption");
    expect(legal).toHaveClass("site-footer__legal");
    expect(footer.querySelector(".site-footer__grid")).toBeNull();
    expect(footer.querySelector(".site-footer__brand")).toBeNull();
  });

  it("увеличивает вордмарк в футере и оставляет градиент названия", () => {
    render(<Footer />);
    const footer = screen.getByRole("contentinfo");

    expect(footer.querySelector(".wordmark")).toHaveClass("wordmark--footer");
    expect(within(footer).getByText("Единый голос 27")).toHaveClass("text-gradient-brand");
  });

  it("описывает колонку и логотип значениями оригинала в Footer.css", () => {
    for (const rule of [
      "width: min(100% - 32px, 1152px)",
      "gap: clamp(20px, 3vw, 34px)",
      "flex-direction: column",
      "clamp(190px, 26vw, 300px)",
      "clamp(72px, 10vw, 108px)",
      "drop-shadow(0 0 22px rgb(91 90 214 / .13))",
      "clamp(72px, 10vw, 124px)",
    ]) {
      expect(FOOTER_CSS).toContain(rule);
    }

    // Подпись и юридический текст держат одну ширину строки оригинала.
    expect(FOOTER_CSS.match(/min\(100%, 680px\)/g)?.length ?? 0).toBeGreaterThanOrEqual(2);
    expect(FOOTER_CSS).not.toContain("site-footer__grid");
    expect(FOOTER_CSS).not.toContain("grid-template-columns");
  });

  it("ставит ссылки столбиком и убирает линию над юридическим текстом", () => {
    render(<Footer />);
    const footer = screen.getByRole("contentinfo");
    const nav = screen.getByRole("navigation", { name: "Внешние ссылки" });

    expect(nav.querySelectorAll("ul > li")).toHaveLength(2);

    const legal = within(footer).getByText(LEGAL);
    expect(legal.tagName).toBe("P");
    expect(legal.parentElement).toHaveClass("site-footer__inner");

    for (const rule of [
      "rgb(170 217 220)",
      "rgb(248 247 251 / .92)",
      "gap: 8px",
      "text-wrap: balance",
      "rgb(239 237 245 / .66)",
      "font-size: .75rem",
    ]) {
      expect(FOOTER_CSS).toContain(rule);
    }

    expect(FOOTER_CSS).not.toContain("border-top");
    // Политика reduced motion живёт единственным блоком в global.css.
    expect(FOOTER_CSS).not.toContain("prefers-reduced-motion");
  });
});
