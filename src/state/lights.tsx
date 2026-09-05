/* eslint-disable react-refresh/only-export-components -- провайдер огоньков, хук useLights и чистые функции живут в одном модуле; fast refresh перезагружает страницу вместо горячей замены */
import { geoContains } from "d3-geo";
import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useMemo, useReducer } from "react";

import { countryById } from "../data/countries";
import type { Light, LightType } from "../data/lights";
import { generateLights } from "../data/lights";
import { featureById } from "../lib/geo";

export interface LightsState {
  lights: Light[];
}

export interface AddLightInput {
  type: LightType;
  countryId: number;
}

export type LightsAction = { type: "add"; input: AddLightInput };

export interface LightCounts {
  people: number;
  groups: number;
}

export interface LightsValue {
  lights: Light[];
  counts: LightCounts;
  addLight: (input: AddLightInput) => void;
}

export function countLights(lights: readonly Light[]): LightCounts {
  let people = 0;
  let groups = 0;

  for (const light of lights) {
    if (light.type === "person") {
      people += 1;
    } else {
      groups += 1;
    }
  }

  return { people, groups };
}

/** Золотой угол: соседние огоньки одной страны расходятся по спирали, а не ложатся друг на друга. */
const GOLDEN_ANGLE = 2.39996;

/**
 * Огонёк посетителя. Координата считается от центра страны, а не приходит из формы:
 * снаружи доходят только тип и код страны.
 */
export function createLight(lights: readonly Light[], input: AddLightInput): Light {
  const country = countryById(input.countryId);
  if (!country) {
    throw new Error(`Unknown ESD country: ${input.countryId}`);
  }

  const taken = lights.reduce((acc, light) => (light.countryId === country.id ? acc + 1 : acc), 0);
  const angle = taken * GOLDEN_ANGLE;
  const radius = 0.3 + 0.9 * ((taken % 4) / 3);
  const lon = country.center[0] + radius * Math.cos(angle);
  const lat = country.center[1] + radius * Math.sin(angle);

  const feature = featureById(country.id);
  const inside = !feature || geoContains(feature, [lon, lat]);

  return {
    id: `n${lights.length}`,
    type: input.type,
    countryId: country.id,
    lon: inside ? lon : country.center[0],
    lat: inside ? lat : country.center[1],
    isNew: true,
  };
}

export function lightsReducer(state: LightsState, action: LightsAction): LightsState {
  switch (action.type) {
    case "add":
      return { lights: [...state.lights, createLight(state.lights, action.input)] };
    default:
      return state;
  }
}

const LightsContext = createContext<LightsValue | null>(null);

export function LightsProvider({
  children,
  initialLights,
}: {
  children: ReactNode;
  initialLights?: Light[];
}) {
  const [state, dispatch] = useReducer(lightsReducer, initialLights, (init) => ({
    lights: init ?? generateLights(),
  }));

  const counts = useMemo(() => countLights(state.lights), [state.lights]);
  const addLight = useCallback((input: AddLightInput) => {
    dispatch({ type: "add", input });
  }, []);

  const value = useMemo<LightsValue>(
    () => ({ lights: state.lights, counts, addLight }),
    [state.lights, counts, addLight],
  );

  return <LightsContext.Provider value={value}>{children}</LightsContext.Provider>;
}

export function useLights(): LightsValue {
  const value = useContext(LightsContext);
  if (!value) {
    throw new Error("useLights must be used within <LightsProvider>");
  }

  return value;
}
