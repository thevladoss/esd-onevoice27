import { geoPath } from "d3-geo";
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";

import { mapCopy } from "../../data/copy.map";
import type { Light } from "../../data/lights";
import { isEsd, makeProjection, worldFeatures } from "../../lib/geo";
import "./map.css";

export interface EsdMapProps {
  lights: readonly Light[];
  /** Страна, подсвеченная на карте. */
  selectedCountryId?: number | null;
  /** Посетитель увёл камеру от выбранной страны вручную. */
  onUserZoomAway?: () => void;
  /** Карта не смогла отрисоваться: снаружи по этому сигналу гасятся элементы управления. */
  onError?: (hasError: boolean) => void;
  /** Размер вьюбокса в обход измерения контейнера. */
  size?: { width: number; height: number };
}

export const LIGHT_CORE_RADIUS = 2.2;
export const LIGHT_HALO_RADIUS = 6;
/** Пульсирует каждый двадцать четвёртый огонёк: около сорока анимаций на всю карту. */
export const PULSE_EVERY = 24;

/** Опорная точка проверки проекции: Москва. */
const PROBE: [number, number] = [37.6, 55.7];

interface Size {
  width: number;
  height: number;
}

export function EsdMap({ lights, selectedCountryId = null, onError, size }: EsdMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [measured, setMeasured] = useState<Size | null>(null);
  const titleId = useId();
  const descId = useId();
  const hasExternalSize = size !== undefined;

  useLayoutEffect(() => {
    if (hasExternalSize) return;

    const node = containerRef.current;
    if (!node) return;

    const read = () => {
      const rect = node.getBoundingClientRect();
      setMeasured((prev) =>
        prev && prev.width === rect.width && prev.height === rect.height
          ? prev
          : { width: rect.width, height: rect.height },
      );
    };

    read();
    if (typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(read);
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasExternalSize]);

  const resolved = size ?? measured;
  const width = resolved?.width ?? 0;
  const height = resolved?.height ?? 0;

  const projection = useMemo(
    () => (width >= 1 && height >= 1 ? makeProjection(width, height) : null),
    [width, height],
  );

  const probe = useMemo(() => projection?.(PROBE) ?? null, [projection]);
  const hasError =
    resolved !== null && (probe === null || !Number.isFinite(probe[0]) || !Number.isFinite(probe[1]));

  useEffect(() => {
    onError?.(hasError);
  }, [hasError, onError]);

  const countries = useMemo(() => {
    if (!projection) return [];
    const toPath = geoPath(projection);
    return worldFeatures.map((feature) => {
      const id = Number(feature.id);
      return { id, d: toPath(feature) ?? "", esd: isEsd(id) };
    });
  }, [projection]);

  const points = useMemo(() => {
    if (!projection) return [];
    const placed: { light: Light; x: number; y: number }[] = [];
    for (const light of lights) {
      const xy = projection([light.lon, light.lat]);
      if (!xy || !Number.isFinite(xy[0]) || !Number.isFinite(xy[1])) continue;
      placed.push({ light, x: xy[0], y: xy[1] });
    }
    return placed;
  }, [projection, lights]);

  const counts = useMemo(() => {
    let people = 0;
    let groups = 0;
    for (const light of lights) {
      if (light.type === "person") people += 1;
      else groups += 1;
    }
    return { people, groups };
  }, [lights]);

  // Масштаб вьюпорта карты: радиусы огоньков делятся на него, чтобы зум не раздувал точки.
  const scale = 1;
  const coreRadius = LIGHT_CORE_RADIUS / scale;
  const haloRadius = LIGHT_HALO_RADIUS / scale;

  if (hasError) {
    return (
      <div className="esd-map" ref={containerRef}>
        <div role="status" className="map-error">
          {mapCopy.error}
        </div>
      </div>
    );
  }

  return (
    <div className="esd-map" ref={containerRef}>
      {projection ? (
        <>
          <svg
            className="esd-map__svg"
            role="img"
            aria-labelledby={titleId}
            aria-describedby={descId}
            viewBox={`0 0 ${width} ${height}`}
            width="100%"
            height="100%"
            preserveAspectRatio="xMidYMid meet"
          >
            <title id={titleId}>{mapCopy.mapTitle}</title>
            <g className="map-viewport">
              <g className="map-countries" aria-hidden="true">
                {countries.map((country) => {
                  const selected = selectedCountryId === country.id;
                  return (
                    <path
                      key={country.id}
                      d={country.d}
                      className={
                        "country" +
                        (country.esd ? " country--esd" : "") +
                        (selected ? " country--selected" : "")
                      }
                      data-country-id={country.id}
                      data-esd={country.esd || undefined}
                      data-selected={selected || undefined}
                      vectorEffect="non-scaling-stroke"
                    />
                  );
                })}
              </g>
              <g className="map-lights" aria-hidden="true">
                {points.map(({ light, x, y }, index) => {
                  const pulse = light.isNew || index % PULSE_EVERY === 0;
                  return (
                    <g
                      key={light.id}
                      className={
                        "light light--" +
                        light.type +
                        (pulse ? " pulse" : "") +
                        (light.isNew ? " is-new" : "")
                      }
                      style={
                        pulse
                          ? { animationDelay: `${((index / PULSE_EVERY) % 12) * 200}ms` }
                          : undefined
                      }
                    >
                      <circle className="light-halo" cx={x} cy={y} r={haloRadius} />
                      <circle className="light-core" cx={x} cy={y} r={coreRadius} />
                      {light.isNew ? (
                        <circle className="light-ring" cx={x} cy={y} r={haloRadius} />
                      ) : null}
                    </g>
                  );
                })}
              </g>
            </g>
          </svg>
          <p id={descId} className="sr-only">
            {mapCopy.srDescription(counts.people, counts.groups)}
          </p>
          {lights.length === 0 ? (
            <div className="map-empty">
              <p className="map-empty__title">{mapCopy.empty.title}</p>
              <p className="map-empty__body">
                {mapCopy.empty.bodyBefore}
                <a href={mapCopy.empty.linkHref}>{mapCopy.empty.link}</a>
                {mapCopy.empty.bodyAfter}
              </p>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
