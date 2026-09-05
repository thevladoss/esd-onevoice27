import { render, screen } from "@testing-library/react";
import { aboutSteps } from "../../data/about";
import { aboutCopy } from "../../data/copy.about";
import { About } from "./About";

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
