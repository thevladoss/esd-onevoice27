import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen } from "@testing-library/react";
import { aboutSteps } from "../../data/about";
import { aboutCopy } from "../../data/copy.about";
import { About } from "./About";

/* vitest настроен с css: false, поэтому значения свойств проверяются по тексту
   исходника с диска — тем же приёмом, что в src/styles/motionPolicy.test.ts. */
const ABOUT_CSS = readFileSync(resolve(process.cwd(), "src/components/about/about.css"), "utf8");

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

describe("Секция About", () => {
  it("рендерит секцию #about с надзаголовком, H2 и лидом", () => {
    const { container } = render(<About />);

    expect(container.querySelector("section#about")).not.toBeNull();
    expect(screen.getByRole("heading", { level: 2, name: aboutCopy.title })).toBeInTheDocument();
    expect(screen.getByText(aboutCopy.eyebrow)).toBeInTheDocument();

    const lead = screen.getByText(aboutCopy.lead);
    expect(lead).toHaveClass("ab-lead");
    expect(lead.textContent).toMatch(/сентябре 2027 года/);
    expect(lead.textContent).toMatch(/2000-летие крещения Иисуса/);
  });

  it("называет секцию её заголовком через aria-labelledby", () => {
    render(<About />);
    const section = document.getElementById("about");
    expect(section).toHaveAttribute("aria-labelledby", "about-title");
    expect(screen.getByRole("heading", { level: 2 })).toHaveAttribute("id", "about-title");
    expect(screen.getByRole("region", { name: aboutCopy.title })).toBe(section);
  });

  it("не пропускает уровни заголовков: один H2 и три H3", () => {
    render(<About />);

    const levels = screen.getAllByRole("heading").map((heading) => heading.tagName);
    expect(levels).toEqual(["H2", "H3", "H3", "H3"]);
  });

  // Единственный градиентный заголовок секции по GLASS-06: у остальных секций он плоский.
  it("несёт градиентный заголовок, а не плоский вариант остальных секций", () => {
    render(<About />);

    const heading = screen.getByRole("heading", { level: 2, name: aboutCopy.title });
    expect(heading).toHaveClass("gradient-title", "gradient-title--section-gradient");
    expect(heading).not.toHaveClass("gradient-title--section");
  });

  it("держит видео за фасадом: кнопка есть, iframe нет", () => {
    const { container } = render(<About />);

    expect(screen.getByRole("button", { name: "Смотреть видео: Единый голос 27" })).toBeInTheDocument();
    expect(container.querySelector("iframe")).toBeNull();
  });

  it("рендерит три карточки шагов с номерами, пунктами и итогами", () => {
    const { container } = render(<About />);

    const headings = screen.getAllByRole("heading", { level: 3 });
    expect(headings.map((heading) => heading.textContent)).toEqual([
      "Проект",
      "Подготовка",
      "Цель",
    ]);

    expect(screen.getAllByRole("listitem")).toHaveLength(9);

    for (const step of aboutSteps) {
      expect(screen.getByText(step.summary)).toBeInTheDocument();
    }

    const numbers = Array.from(container.querySelectorAll(".ab-step-num")).map(
      (node) => node.textContent,
    );
    expect(numbers).toEqual(["1", "2", "3"]);
  });
});

describe("стекло карточек шагов (GLASS-02)", () => {
  it("ставит все три карточки на общую стеклянную поверхность", () => {
    const { container } = render(<About />);

    const steps = container.querySelectorAll(".ab-step");
    expect(steps).toHaveLength(3);
    for (const step of Array.from(steps)) {
      expect(step).toHaveClass("glass-card", "glass");
    }
  });

  it("не перекрывает поверхность утилиты собственным фоном", () => {
    expect(block(ABOUT_CSS, ".ab-step {")).not.toContain("background");
  });

  it("светлит рамку и добавляет тень при наведении за 420ms", () => {
    expect(block(ABOUT_CSS, ".ab-step {")).toContain(
      "border-color 420ms cubic-bezier(0.22, 1, 0.36, 1)",
    );

    const hover = block(ABOUT_CSS, ".ab-step:hover {");
    expect(hover).toContain("border-color: rgb(143 157 214 / .34);");
    expect(hover).toContain("0 24px 52px rgb(3 2 18 / .30)");
  });

  it("сохраняет акцентную линию и разделитель карточки", () => {
    const rules = flat(ABOUT_CSS);
    expect(rules).toContain(".ab-step::after {");
    expect(rules).toContain(".ab-step-rule {");
    expect(ABOUT_CSS).not.toContain("rgb(184 192 230 / .34)");
  });
});
