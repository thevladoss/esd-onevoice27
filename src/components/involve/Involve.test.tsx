import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { involveCopy } from "../../data/copy.involve";
import { Involve } from "./Involve";

/* vitest настроен с css: false, поэтому значения свойств проверяются по тексту
   исходника с диска — тем же приёмом, что в src/styles/motionPolicy.test.ts. */
const INVOLVE_CSS = readFileSync(resolve(process.cwd(), "src/components/involve/involve.css"), "utf8");

/** Схлопывает любые пробельные последовательности в один пробел. */
const flat = (css: string) => css.replace(/\s+/g, " ");

/** Тело первого правила, чей заголовок с открывающей скобкой равен head. */
function block(css: string, head: string): string {
  const source = flat(css);
  const start = source.indexOf(head);
  if (start === -1) {
    throw new Error(`Правило ${head} в CSS не найдено`);
  }
  const end = source.indexOf("}", start + head.length);
  if (end === -1) {
    throw new Error(`У правила ${head} нет закрывающей скобки`);
  }
  return source.slice(start + head.length, end);
}

const expectedHrefs: Record<string, string> = {
  "Начать путь": "#about",
  "Скачать материалы": "#resources-materials",
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

  it("называет секцию её заголовком через aria-labelledby", () => {
    render(<Involve />);
    const section = document.getElementById("involve");
    expect(section).toHaveAttribute("aria-labelledby", "involve-title");
    expect(screen.getByRole("heading", { level: 2 })).toHaveAttribute("id", "involve-title");
    expect(screen.getByRole("region", { name: involveCopy.title })).toBe(section);
  });

  it("не пропускает уровни заголовков: один H2 и три H3", () => {
    render(<Involve />);

    const levels = screen.getAllByRole("heading").map((heading) => heading.tagName);
    expect(levels).toEqual(["H2", "H3", "H3", "H3"]);
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

    const hashBefore = window.location.hash;
    for (const article of Array.from(container.querySelectorAll("article"))) {
      expect(article.getAttribute("href")).toBeNull();
      expect(article.getAttribute("role")).toBeNull();
      expect(article.getAttribute("tabindex")).toBeNull();

      // Единственный интерактив внутри карточки — ссылка действия.
      expect(within(article as HTMLElement).getAllByRole("link")).toHaveLength(1);
      expect(article.querySelectorAll("button, [role='button'], input, [tabindex]")).toHaveLength(0);

      // Проверяем поведение, а не свойство onclick: React вешает обработчики
      // делегированием на корень и в onclick узла ничего не пишет.
      fireEvent.click(article);
      expect(window.location.hash).toBe(hashBefore);
    }
  });

  it("держит три декоративные SVG-иллюстрации без текста и растровых вставок", () => {
    const { container } = render(<Involve />);

    const arts = container.querySelectorAll<SVGSVGElement>(
      'svg[aria-hidden="true"][role="presentation"]',
    );
    expect(arts).toHaveLength(3);

    for (const art of Array.from(arts)) {
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

describe("стекло триптиха (GLASS-04)", () => {
  it("держит три карточки внутри одной стеклянной рамки", () => {
    const { container } = render(<Involve />);

    const frame = container.querySelector(".inv-triptych");
    expect(frame).not.toBeNull();
    expect(frame).toHaveClass("glass-card", "glass");
    expect(frame?.querySelectorAll("article.inv-card")).toHaveLength(3);
  });

  it("снимает размытие с рамки и оставляет ей кольцо и тень", () => {
    const frame = block(INVOLVE_CSS, ".inv-triptych {");
    expect(frame).toContain("backdrop-filter: none;");
    expect(frame).toContain("padding: 4px;");
    expect(frame).toContain(
      "box-shadow: 0 34px 76px rgb(2 2 12 / .58), 0 0 54px rgb(59 77 161 / .22);",
    );
    expect(block(INVOLVE_CSS, ".inv-section {")).toContain("--triptych-radius: 18px;");
  });

  it("даёт каждой карточке поверхность, шов и радиус на 4px меньше рамки", () => {
    const card = block(INVOLVE_CSS, ".inv-card {");
    expect(card).toContain("background: rgb(33 26 62 / .48);");
    expect(card).toContain("border: 1px solid rgb(239 237 245 / .15);");
    expect(card).toContain("border-radius: calc(var(--triptych-radius) - 4px);");
    expect(block(INVOLVE_CSS, ".inv-card:hover {")).toContain(
      "background: rgb(49 41 77 / .54);",
    );
  });

  it("больше не рисует шов соседством слотов и не читает токен рамки стекла", () => {
    expect(INVOLVE_CSS).not.toContain(".inv-slot + .inv-slot");
    expect(INVOLVE_CSS).not.toContain("var(--glass-border)");
    expect(INVOLVE_CSS).not.toContain("--triptych-surface");
  });
});
