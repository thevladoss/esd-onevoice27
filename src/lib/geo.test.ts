import { geoContains } from "d3-geo";
import { describe, expect, it } from "vitest";

import { ESD_COUNTRIES, ESD_IDS } from "../data/countries";
import {
  esdCollection,
  esdFeatures,
  featureById,
  isEsd,
  makeProjection,
  randomPointIn,
  worldFeatures,
} from "./geo";
import { mulberry32 } from "./rng";

const WIDTH = 1200;
const HEIGHT = 700;

describe("features world-atlas", () => {
  it("разбирает 177 стран и отбирает 12 стран ЕАД", () => {
    expect(worldFeatures).toHaveLength(177);
    expect(esdFeatures).toHaveLength(12);
    expect(esdCollection.features).toHaveLength(12);
    expect(new Set(esdFeatures.map((f) => Number(f.id)))).toEqual(new Set(ESD_IDS));
  });

  it("отвечает на isEsd и featureById", () => {
    expect(isEsd(643)).toBe(true);
    expect(isEsd(840)).toBe(false);
    expect(featureById(999)).toBeUndefined();
    expect(featureById(643)).toBeDefined();
  });

  it("держит сумму весов стран равной единице", () => {
    const sum = ESD_COUNTRIES.reduce((acc, c) => acc + c.weight, 0);
    expect(sum).toBeCloseTo(1, 10);
  });
});

describe("makeProjection", () => {
  it("укладывает центры всех 12 стран внутрь вьюбокса без NaN", () => {
    const project = makeProjection(WIDTH, HEIGHT);

    for (const country of ESD_COUNTRIES) {
      const point = project(country.center);
      expect(point, country.name).not.toBeNull();

      const [x, y] = point!;
      expect(Number.isFinite(x), country.name).toBe(true);
      expect(Number.isFinite(y), country.name).toBe(true);
      expect(x, country.name).toBeGreaterThanOrEqual(0);
      expect(x, country.name).toBeLessThanOrEqual(WIDTH);
      expect(y, country.name).toBeGreaterThanOrEqual(0);
      expect(y, country.name).toBeLessThanOrEqual(HEIGHT);
    }
  });

  it("не рвёт Чукотку на антимеридиане", () => {
    const project = makeProjection(WIDTH, HEIGHT);
    const east = project([179.5, 66])!;
    const west = project([-179, 66])!;

    expect(Math.abs(east[0] - west[0])).toBeLessThan(40);
  });
});

describe("границы стран", () => {
  it("держит опорный центр каждой страны внутри её границ", () => {
    for (const country of ESD_COUNTRIES) {
      const feature = featureById(country.id);
      expect(feature, country.name).toBeDefined();
      expect(geoContains(feature!, country.center), country.name).toBe(true);
    }
  });
});

describe("randomPointIn", () => {
  it("кладёт 200 точек подряд внутрь России, несмотря на bbox через 180°", () => {
    const feature = featureById(643)!;
    const rng = mulberry32(1);

    for (let i = 0; i < 200; i += 1) {
      const point = randomPointIn(feature, rng);
      expect(point[0]).toBeGreaterThanOrEqual(-180);
      expect(point[0]).toBeLessThanOrEqual(180);
      expect(geoContains(feature, point)).toBe(true);
    }
  });
});
