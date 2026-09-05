import { geoNaturalEarth1, geoPath } from "d3-geo";
import type { FeatureCollection, Geometry } from "geojson";

import { worldFeatures } from "../../lib/geo";

const WIDTH = 960;
const HEIGHT = 480;

const world: FeatureCollection<Geometry, { name: string }> = {
  type: "FeatureCollection",
  features: worldFeatures,
};

// Проекция и путь считаются один раз на импорте модуля: SVG статичен,
// пересчёт по размеру контейнера заменён фиксированным viewBox и slice.
const projection = geoNaturalEarth1().fitSize([WIDTH, HEIGHT], world);

// Все 177 стран одним path: 177 отдельных элементов дороже, а силуэт декоративный.
const outline = geoPath(projection)(world) ?? "";

export function WorldSilhouette({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      preserveAspectRatio="xMidYMid slice"
      className={"pointer-events-none" + (className ? " " + className : "")}
    >
      <path
        d={outline}
        fill="rgb(248 247 251 / 0.05)"
        stroke="rgb(248 247 251 / 0.1)"
        strokeWidth={0.5}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
