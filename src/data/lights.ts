import { featureById, randomPointIn } from "../lib/geo";
import { mulberry32 } from "../lib/rng";
import { ESD_COUNTRIES } from "./countries";

export type LightType = "person" | "group";

export interface Light {
  id: string;
  type: LightType;
  countryId: number;
  lon: number;
  lat: number;
  /** Огонёк зажжён посетителем в этой сессии: карта показывает расходящееся кольцо. */
  isNew?: boolean;
}

export const DEFAULT_SEED = 27;
export const DEFAULT_PEOPLE = 694;
export const DEFAULT_GROUPS = 248;

/**
 * Метод наибольших остатков: доли округляются вниз, остаток раздаётся
 * странам с наибольшей дробной частью, поэтому сумма ровно равна total.
 */
export function allocateByWeight(total: number, weights: readonly number[]): number[] {
  // Сумма долей держится только на весах, дающих единицу: при большей сумме
  // остаток отрицателен и раздача не идёт, при меньшей остаток уходит по второму
  // кругу одним и тем же странам. Обе поломки молчаливые, поэтому проверка здесь.
  const sum = weights.reduce((a, b) => a + b, 0);
  if (Math.abs(sum - 1) > 1e-9) {
    throw new Error(`Weights must sum to 1, got ${sum}`);
  }

  const raw = weights.map((w) => w * total);
  const alloc = raw.map((value) => Math.floor(value));
  const order = raw
    .map((value, index) => ({ index, frac: value - Math.floor(value) }))
    .sort((a, b) => b.frac - a.frac || a.index - b.index);

  let rest = total - alloc.reduce((a, b) => a + b, 0);
  for (let k = 0; rest > 0 && order.length > 0; k += 1, rest -= 1) {
    alloc[order[k % order.length].index] += 1;
  }

  return alloc;
}

/**
 * Моки огоньков дивизиона. Порядок обхода стран фиксирован:
 * детерминизм держится на последовательности вызовов rng.
 */
export function generateLights(
  seed: number = DEFAULT_SEED,
  people: number = DEFAULT_PEOPLE,
  groups: number = DEFAULT_GROUPS,
): Light[] {
  const rng = mulberry32(seed);
  const weights = ESD_COUNTRIES.map((c) => c.weight);
  const peopleAlloc = allocateByWeight(people, weights);
  const groupAlloc = allocateByWeight(groups, weights);

  const lights: Light[] = [];
  let personIndex = 0;
  let groupIndex = 0;

  ESD_COUNTRIES.forEach((country, i) => {
    const feature = featureById(country.id);
    if (!feature) {
      throw new Error(`Missing world-atlas feature for ESD country: ${country.id}`);
    }

    for (let k = 0; k < peopleAlloc[i]; k += 1) {
      const [lon, lat] = randomPointIn(feature, rng);
      lights.push({ id: `p${personIndex}`, type: "person", countryId: country.id, lon, lat });
      personIndex += 1;
    }

    for (let k = 0; k < groupAlloc[i]; k += 1) {
      const [lon, lat] = randomPointIn(feature, rng);
      lights.push({ id: `g${groupIndex}`, type: "group", countryId: country.id, lon, lat });
      groupIndex += 1;
    }
  });

  return lights;
}
