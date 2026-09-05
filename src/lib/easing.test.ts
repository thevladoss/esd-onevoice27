import { describe, expect, it } from "vitest";

import { easeOutCubic, easeOutQuint } from "./easing";

const GRID = Array.from({ length: 11 }, (_, i) => i / 10);

describe("easing", () => {
  it("держит края и середину кривых", () => {
    expect(easeOutCubic(0)).toBe(0);
    expect(easeOutCubic(1)).toBe(1);
    expect(easeOutCubic(0.5)).toBe(0.875);
    expect(easeOutQuint(0)).toBe(0);
    expect(easeOutQuint(1)).toBe(1);
    expect(easeOutQuint(0.5)).toBe(0.96875);
  });

  it("растёт монотонно на сетке 0..1", () => {
    for (const ease of [easeOutCubic, easeOutQuint]) {
      for (let i = 1; i < GRID.length; i += 1) {
        expect(ease(GRID[i])).toBeGreaterThan(ease(GRID[i - 1]));
      }
    }
  });

  it("клампит выходы за диапазон", () => {
    expect(easeOutCubic(-1)).toBe(0);
    expect(easeOutQuint(2)).toBe(1);
  });
});
