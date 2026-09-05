import { render, screen } from "@testing-library/react";

import { generateLights } from "../../data/lights";
import { LightsProvider } from "../../state/lights";
import { Counters } from "./Counters";

function renderCounters(people = 1150, groups = 12) {
  return render(
    <LightsProvider initialLights={generateLights(27, people, groups)}>
      <Counters />
    </LightsProvider>,
  );
}

describe("Counters", () => {
  it("показывает значения из контекста с узким неразрывным пробелом", () => {
    const { container } = renderCounters();
    const values = Array.from(container.querySelectorAll(".counter__value")).map(
      (node) => node.textContent,
    );
    expect(values).toEqual(["1\u202F150", "12"]);
  });

  it("подписывает карточки «ЧЕЛОВЕК» и «ГРУПП»", () => {
    renderCounters();
    expect(screen.getByText("ЧЕЛОВЕК")).toBeInTheDocument();
    expect(screen.getByText("ГРУПП")).toBeInTheDocument();
  });

  it("объявляет оба числа скринридеру", () => {
    const { container } = renderCounters();
    const live = Array.from(container.querySelectorAll('[aria-live="polite"]'));
    expect(live).toHaveLength(2);
    expect(live.map((node) => node.textContent)).toEqual(["1\u202F150", "12"]);
  });

  it("даёт карточкам классы людей и групп", () => {
    const { container } = renderCounters();
    expect(container.querySelectorAll(".counter--people")).toHaveLength(1);
    expect(container.querySelectorAll(".counter--groups")).toHaveLength(1);
  });
});
