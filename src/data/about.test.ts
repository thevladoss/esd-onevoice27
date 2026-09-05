import { aboutSteps } from "./about";

describe("aboutSteps", () => {
  it("описывает три шага в порядке 1, 2, 3", () => {
    expect(aboutSteps).toHaveLength(3);
    expect(aboutSteps.map((step) => step.number)).toEqual([1, 2, 3]);
    expect(aboutSteps.map((step) => step.title)).toEqual(["Проект", "Подготовка", "Цель"]);
  });

  it("даёт по три пункта и непустой итог у каждого шага", () => {
    for (const step of aboutSteps) {
      expect(step.items).toHaveLength(3);
      expect(step.summary.trim().length).toBeGreaterThan(0);
    }
    expect(aboutSteps[1].items[1]).toContain("Желание веков");
    expect(aboutSteps[0].summary).toBe(
      "Крупнейшая евангельская инициатива Церкви адвентистов седьмого дня в нашем поколении",
    );
  });
});
