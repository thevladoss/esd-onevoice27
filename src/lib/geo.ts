import type { GeoProjection } from "d3-geo";
import { geoBounds, geoCentroid, geoContains, geoMercator } from "d3-geo";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import { feature as toFeature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import topology from "world-atlas/countries-110m.json";

import { ESD_COUNTRIES, ESD_IDS } from "../data/countries";

export type CountryFeature = Feature<Geometry, { name: string }>;

// world-atlas разбирается один раз на импорте модуля: сети в рантайме нет.
const topo = topology as unknown as Topology;
const world = toFeature(
  topo,
  topo.objects.countries as GeometryCollection<{ name: string }>,
) as unknown as FeatureCollection<Geometry, { name: string }>;

export const worldFeatures: CountryFeature[] = world.features as CountryFeature[];

// id в атласе — строки с ведущими нулями ("004"), поэтому ключ приводится к числу.
const BY_ID = new Map<number, CountryFeature>(worldFeatures.map((f) => [Number(f.id), f]));

/** Страны ЕАД в порядке ESD_COUNTRIES: он же порядок чипов и обхода генератора. */
export const esdFeatures: CountryFeature[] = ESD_COUNTRIES.map((c) => BY_ID.get(c.id)).filter(
  (f): f is CountryFeature => f !== undefined,
);

export const esdCollection: FeatureCollection<Geometry, { name: string }> = {
  type: "FeatureCollection",
  features: esdFeatures,
};

export function featureById(id: number): CountryFeature | undefined {
  return BY_ID.get(id);
}

export function isEsd(id: number): boolean {
  return ESD_IDS.has(id);
}

/**
 * Меркатор с поворотом на 90° на восток: разрыв проекции уходит в Атлантику,
 * и Чукотка остаётся цельной. fitExtent вписывает 12 стран ЕАД в вьюбокс.
 */
export function makeProjection(width: number, height: number, pad = 24): GeoProjection {
  return geoMercator()
    .rotate([-90, 0])
    .fitExtent(
      [
        [pad, pad],
        [width - pad, height - pad],
      ],
      esdCollection,
    );
}

/**
 * Случайная точка [lon, lat] внутри страны: rejection sampling по bbox.
 * У России bbox пересекает 180°, поэтому долгота набирается через антимеридиан.
 * После maxTries попыток возвращается центроид, чтобы цикл не висел.
 */
export function randomPointIn(
  feature: CountryFeature,
  rng: () => number,
  maxTries = 50,
): [number, number] {
  const [[x0, y0], [x1, y1]] = geoBounds(feature);
  const lonSpan = x0 > x1 ? 180 - x0 + (x1 + 180) : x1 - x0;

  for (let i = 0; i < maxTries; i += 1) {
    let lon = x0 + rng() * lonSpan;
    if (lon > 180) lon -= 360;
    const lat = y0 + rng() * (y1 - y0);

    if (geoContains(feature, [lon, lat])) {
      return [lon, lat];
    }
  }

  return geoCentroid(feature) as [number, number];
}
