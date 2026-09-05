import { describe, expect, it } from "vitest";

import { mulberry32 } from "./rng";

function take(rng: () => number, count: number): number[] {
  return Array.from({ length: count }, () => rng());
}

describe("mulberry32", () => {
  it("даёт одинаковую последовательность при одинаковом seed", () => {
    expect(take(mulberry32(27), 10)).toEqual(take(mulberry32(27), 10));
  });

  it("держит значения в диапазоне [0, 1)", () => {
    const rng = mulberry32(27);

    for (let i = 0; i < 1000; i += 1) {
      const value = rng();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it("расходится на разных seed", () => {
    expect(take(mulberry32(27), 5)).not.toEqual(take(mulberry32(28), 5));
  });
});
