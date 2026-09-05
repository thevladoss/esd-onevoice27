import { geoContains } from "d3-geo";
import { describe, expect, it } from "vitest";

import { featureById } from "../lib/geo";
import { ESD_COUNTRIES, ESD_IDS } from "./countries";
import { DEFAULT_GROUPS, DEFAULT_PEOPLE, allocateByWeight, generateLights } from "./lights";

const WEIGHTS = ESD_COUNTRIES.map((c) => c.weight);

describe("allocateByWeight", () => {
  it("раздаёт целые доли без потери суммы", () => {
    for (const total of [DEFAULT_PEOPLE, DEFAULT_GROUPS]) {
      const alloc = allocateByWeight(total, WEIGHTS);

      expect(alloc).toHaveLength(WEIGHTS.length);
      expect(alloc.every((n) => Number.isInteger(n) && n >= 0)).toBe(true);
      expect(alloc.reduce((a, b) => a + b, 0)).toBe(total);
    }
  });
});

describe("generateLights", () => {
  it("даёт 694 человека и 248 групп", () => {
    const lights = generateLights();

    expect(lights).toHaveLength(DEFAULT_PEOPLE + DEFAULT_GROUPS);
    expect(lights.filter((l) => l.type === "person")).toHaveLength(DEFAULT_PEOPLE);
    expect(lights.filter((l) => l.type === "group")).toHaveLength(DEFAULT_GROUPS);
  });

  // Четыре прогона генератора с geoContains по 942 точкам: под нагрузкой параллельных процессов не укладываются в 5 с по умолчанию.
  it("детерминирован по seed", { timeout: 30_000 }, () => {
    expect(generateLights(27)).toEqual(generateLights(27));
    expect(generateLights(28)).not.toEqual(generateLights(27));
  });

  it("даёт уникальные id и точки внутри своей страны", { timeout: 30_000 }, () => {
    const lights = generateLights();

    expect(new Set(lights.map((l) => l.id)).size).toBe(lights.length);

    for (const light of lights) {
      expect(ESD_IDS.has(light.countryId)).toBe(true);
      expect(geoContains(featureById(light.countryId)!, [light.lon, light.lat])).toBe(true);
    }
  });

  it("раскладывает огоньки по странам ровно по весам", () => {
    const lights = generateLights();
    const expectedRu =
      allocateByWeight(DEFAULT_PEOPLE, WEIGHTS)[0] + allocateByWeight(DEFAULT_GROUPS, WEIGHTS)[0];

    expect(lights.filter((l) => l.countryId === 643)).toHaveLength(expectedRu);
  });
});
