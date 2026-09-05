import { act, renderHook } from "@testing-library/react";
import { geoContains } from "d3-geo";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { countryById } from "../data/countries";
import type { Light } from "../data/lights";
import { DEFAULT_GROUPS, DEFAULT_PEOPLE, generateLights } from "../data/lights";
import { featureById } from "../lib/geo";
import { LightsProvider, countLights, lightsReducer, useLights } from "./lights";

const ARMENIA = 51;
const RUSSIA = 643;

function wrapper({ children }: { children: ReactNode }) {
  return <LightsProvider initialLights={[]}>{children}</LightsProvider>;
}

describe("countLights", () => {
  it("считает людей и группы в сгенерированных огоньках", () => {
    expect(countLights(generateLights())).toEqual({
      people: DEFAULT_PEOPLE,
      groups: DEFAULT_GROUPS,
    });
  });
});

describe("lightsReducer", () => {
  it("добавляет огонёк и растит нужный счётчик", () => {
    const lights = generateLights();
    const next = lightsReducer(
      { lights },
      { type: "add", input: { type: "group", countryId: ARMENIA } },
    );

    expect(next.lights).toHaveLength(lights.length + 1);

    const counts = countLights(next.lights);
    expect(counts.groups).toBe(DEFAULT_GROUPS + 1);
    expect(counts.people).toBe(DEFAULT_PEOPLE);

    const added = next.lights.at(-1) as Light;
    expect(added.isNew).toBe(true);
    expect(added.countryId).toBe(ARMENIA);
  });

  it("даёт уникальные id при нескольких добавлениях", () => {
    const first = lightsReducer(
      { lights: generateLights() },
      { type: "add", input: { type: "person", countryId: ARMENIA } },
    );
    const second = lightsReducer(first, {
      type: "add",
      input: { type: "person", countryId: ARMENIA },
    });

    const ids = second.lights.map((l) => l.id);
    expect(ids.at(-1)).not.toBe(ids.at(-2));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("ставит огонёк внутрь выбранной страны", () => {
    const { lights } = lightsReducer(
      { lights: [] },
      { type: "add", input: { type: "group", countryId: ARMENIA } },
    );
    const added = lights[0];
    const center = countryById(ARMENIA)!.center;
    const inside = geoContains(featureById(ARMENIA)!, [added.lon, added.lat]);

    expect(inside || (added.lon === center[0] && added.lat === center[1])).toBe(true);
  });

  it("не зажигает свет в стране вне дивизиона и не роняет страницу", () => {
    const state = { lights: [] };
    const next = lightsReducer(state, { type: "add", input: { type: "person", countryId: 840 } });

    // Состояние возвращается тем же объектом: исключение в фазе рендера снесло бы корень React.
    expect(next).toBe(state);
    expect(next.lights).toHaveLength(0);
  });
});

describe("LightsProvider", () => {
  it("отдаёт счётчики и addLight потребителям", () => {
    const { result } = renderHook(() => useLights(), { wrapper });

    expect(result.current.counts).toEqual({ people: 0, groups: 0 });

    act(() => {
      result.current.addLight({ type: "person", countryId: RUSSIA });
    });

    expect(result.current.counts.people).toBe(1);
    expect(result.current.lights).toHaveLength(1);
  });

  it("падает с понятной ошибкой вне провайдера", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => renderHook(() => useLights())).toThrow(/LightsProvider/);

    errorSpy.mockRestore();
  });
});
