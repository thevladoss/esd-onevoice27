import { render, screen, within } from "@testing-library/react";
import { involveCopy } from "../../data/copy.involve";
import { Involve } from "./Involve";

const expectedHrefs: Record<string, string> = {
  "Начать путь": "#about",
  "Скачать материалы": "#resources",
  "Узнать, как делиться": "#news",
};

describe("Секция «От убеждения к действию»", () => {
  it("рендерит секцию #involve с надзаголовком, H2 и лидом", () => {
    const { container } = render(<Involve />);

    const section = container.querySelector("section#involve");
    expect(section).not.toBeNull();
    expect(
      screen.getByRole("heading", { level: 2, name: involveCopy.title }),
    ).toBeInTheDocument();
    expect(screen.getByText(involveCopy.eyebrow)).toBeInTheDocument();
    expect(screen.getByText(involveCopy.lead)).toBeInTheDocument();
  });

  it("рендерит триптих из трёх карточек с заголовками в порядке из copy", () => {
    const { container } = render(<Involve />);

    const titles = screen
      .getAllByRole("heading", { level: 3 })
      .map((heading) => heading.textContent);
    expect(titles).toEqual(involveCopy.cards.map((card) => card.title));
    expect(container.querySelectorAll("article")).toHaveLength(3);
  });

  it("даёт по одной ссылке-действию на карточку и не делает кликабельной всю карточку", () => {
    const { container } = render(<Involve />);

    for (const card of involveCopy.cards) {
      const link = screen.getByRole("link", { name: card.action });
      expect(link).toHaveAttribute("href", expectedHrefs[card.action]);
    }

    const section = container.querySelector("section#involve") as HTMLElement;
    expect(within(section).getAllByRole("link")).toHaveLength(3);

    for (const article of container.querySelectorAll("article")) {
      expect(article.getAttribute("href")).toBeNull();
      expect(article.getAttribute("role")).toBeNull();
      expect(article.getAttribute("tabindex")).toBeNull();
      expect((article as HTMLElement).onclick).toBeNull();
    }
  });

  it("держит три декоративные SVG-иллюстрации без текста и растровых вставок", () => {
    const { container } = render(<Involve />);

    const arts = container.querySelectorAll<SVGSVGElement>(
      'svg[aria-hidden="true"][role="presentation"]',
    );
    expect(arts).toHaveLength(3);

    for (const art of arts) {
      expect(art.getAttribute("viewBox")).toBe("0 0 400 300");
      expect(art.getAttribute("focusable")).toBe("false");
      expect(art.querySelectorAll("text, image, foreignObject, script")).toHaveLength(0);
    }
  });

  it("выносит стрелку в декоративный span, поэтому имя ссылки без «→»", () => {
    const { container } = render(<Involve />);

    for (const card of involveCopy.cards) {
      const link = screen.getByRole("link", { name: card.action });
      expect(link.textContent).toContain("→");
      const arrow = link.querySelector('span[aria-hidden="true"]');
      expect(arrow).not.toBeNull();
      expect(arrow?.textContent).toBe("→");
    }

    expect(container.querySelectorAll('a span[aria-hidden="true"]')).toHaveLength(3);
  });
});
