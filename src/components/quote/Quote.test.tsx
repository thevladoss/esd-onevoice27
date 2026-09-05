import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { quoteCopy } from "../../data/copy.quote";
import { Quote } from "./Quote";

function renderQuote(): HTMLElement {
  render(<Quote />);
  const section = document.querySelector<HTMLElement>("section#quote");
  expect(section).not.toBeNull();
  return section as HTMLElement;
}

describe("Quote", () => {
  it("рендерит секцию #quote", () => {
    const section = renderQuote();
    expect(section.tagName).toBe("SECTION");
  });

  it("держит два абзаца цитаты внутри figure > blockquote", () => {
    const section = renderQuote();
    const figure = section.querySelector("figure");
    expect(figure).not.toBeNull();

    const blockquote = figure?.querySelector("blockquote");
    expect(blockquote).not.toBeNull();

    const paragraphs = blockquote?.querySelectorAll("p") ?? [];
    expect(paragraphs).toHaveLength(2);
    expect(paragraphs[0]).toHaveTextContent(
      "Пусть каждый работник в винограднике Господа исследует, планирует, разрабатывает методы работы с людьми. Нам необходимо предпринимать нечто выходящее за рамки обычного порядка вещей.",
    );
    expect(paragraphs[1]).toHaveTextContent(
      "Мы обязаны приковывать внимание людей. Нам следует быть чрезвычайно серьезными. Мы стоим на самом пороге времени бедствий и смут, которые трудно вообразить.",
    );
    expect(quoteCopy.paragraphs).toHaveLength(2);
  });

  it("подписывает источник в figcaption > cite", () => {
    const section = renderQuote();
    const figcaption = section.querySelector("figcaption");
    expect(figcaption).not.toBeNull();

    const cite = figcaption?.querySelector("cite");
    expect(cite).not.toBeNull();
    expect(cite).toHaveTextContent("Эллен Уайт, «Евангелизм», стр. 122");
  });

  it("показывает надзаголовок «Слово на дорогу» абзацем", () => {
    const section = renderQuote();
    const eyebrow = section.querySelector("p.eyebrow");
    expect(eyebrow).not.toBeNull();
    expect(eyebrow).toHaveTextContent("Слово на дорогу");
  });

  it("прячет силуэт карты от скринридера и клавиатуры", () => {
    const section = renderQuote();
    const svg = section.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg).toHaveAttribute("focusable", "false");
    expect(svg).toHaveAttribute("preserveAspectRatio", "xMidYMid slice");

    const path = svg?.querySelector("path");
    expect(path).not.toBeNull();
    const d = path?.getAttribute("d") ?? "";
    expect(d.length).toBeGreaterThan(1000);
  });

  it("рисует декоративную кавычку мимо скринридера", () => {
    const section = renderQuote();
    const decorations = Array.from(section.querySelectorAll('[aria-hidden="true"]'));
    const quoteMark = decorations.find((el) => el.textContent?.includes("“"));
    expect(quoteMark).toBeDefined();
  });

  it("именует секцию скрытым заголовком второго уровня", () => {
    const section = renderQuote();

    expect(section).toHaveAttribute("aria-labelledby", "quote-title");

    const heading = screen.getByRole("heading", { level: 2, name: "Слово на дорогу" });
    expect(heading).toHaveAttribute("id", "quote-title");
    expect(heading).toHaveClass("sr-only");
    expect(section.contains(heading)).toBe(true);
  });

  it("держит содержимое в колонке max-w-3xl и режет вылет силуэта", () => {
    const section = renderQuote();

    expect(section.className).toContain("overflow-hidden");
    expect(section.querySelector("figure")?.className).toContain("max-w-3xl");
  });
});
