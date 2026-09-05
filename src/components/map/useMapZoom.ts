import { select } from "d3-selection";
import type { D3ZoomEvent, ZoomBehavior, ZoomTransform } from "d3-zoom";
import { zoom, zoomIdentity, zoomTransform } from "d3-zoom";
import type { RefObject } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { easeOutQuint } from "../../lib/easing";

export const ZOOM_MIN = 1;
export const ZOOM_MAX = 8;
/** Запас в пикселях, на который карту можно увести за край контейнера. */
export const ZOOM_PAD = 200;
/** Длительность полёта камеры к стране. */
export const FLIGHT_MS = 600;
/** Насколько посетитель должен изменить масштаб, чтобы выбор страны сбросился. */
export const ZOOM_AWAY_RATIO = 0.15;
/** На сколько пикселей страна должна уехать по экрану, чтобы выбор сбросился. */
export const ZOOM_AWAY_PX = 48;

/**
 * Камера ушла от страны, к которой её привёл полёт: масштаб изменился заметно
 * или страна уехала по экрану. Уезд считается по точке, которая стояла в центре
 * вьюбокса: при панораме d3 шлёт тот же k, и по одному масштабу уход не виден.
 */
export function movedAway(
  base: ZoomTransform,
  next: ZoomTransform,
  width: number,
  height: number,
): boolean {
  if (base.k <= 0) return false;

  const scaled = Math.abs(next.k / base.k - 1) > ZOOM_AWAY_RATIO;
  const center: [number, number] = [width / 2, height / 2];
  const [x, y] = next.apply(base.invert(center));
  const drifted = Math.hypot(x - center[0], y - center[1]) > ZOOM_AWAY_PX;

  return scaled || drifted;
}

export interface UseMapZoomOptions {
  width: number;
  height: number;
  /** false, пока карта не измерена или не отрисовалась. */
  enabled: boolean;
  /** Вызывается только на жестах посетителя, не на программном полёте. */
  onUserZoom?: (transform: ZoomTransform) => void;
}

export interface MapZoomApi {
  transform: ZoomTransform;
  dragging: boolean;
  zoomTo: (target: ZoomTransform, animate: boolean) => void;
}

/** Событие указателя, колеса или касания в том виде, в каком его отдаёт d3-zoom. */
export type ZoomSourceEvent = Partial<WheelEvent & TouchEvent & MouseEvent> & { type: string };

/**
 * Колесо масштабирует только с Ctrl или ⌘, палец на экране — только вдвоём.
 * Иначе карта съедает обычный скролл страницы.
 */
export function zoomEventFilter(event: ZoomSourceEvent): boolean {
  if (event.type === "wheel") {
    return Boolean(event.ctrlKey || event.metaKey);
  }

  if (event.type.startsWith("touch")) {
    return (event.touches?.length ?? 0) >= 2;
  }

  // Ctrl+click на macOS открывает контекстное меню: панорама под ним увела бы карту.
  return !event.ctrlKey && !event.button;
}

function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t;
}

export function useMapZoom(
  svgRef: RefObject<SVGSVGElement | null>,
  { width, height, enabled, onUserZoom }: UseMapZoomOptions,
): MapZoomApi {
  const [transform, setTransform] = useState<ZoomTransform>(zoomIdentity);
  const [dragging, setDragging] = useState(false);
  const behaviorRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const flightRef = useRef<number | null>(null);
  const onUserZoomRef = useRef(onUserZoom);

  useEffect(() => {
    onUserZoomRef.current = onUserZoom;
  }, [onUserZoom]);

  const cancelFlight = useCallback(() => {
    if (flightRef.current !== null) {
      cancelAnimationFrame(flightRef.current);
      flightRef.current = null;
    }
  }, []);

  useEffect(() => {
    const node = svgRef.current;
    if (!enabled || !node || width < 1 || height < 1) return;

    const svg = select<SVGSVGElement, unknown>(node);
    const behavior = zoom<SVGSVGElement, unknown>()
      .scaleExtent([ZOOM_MIN, ZOOM_MAX])
      // extent задан явно: без layout измерение через getBoundingClientRect даёт нули.
      .extent([
        [0, 0],
        [width, height],
      ])
      .translateExtent([
        [-ZOOM_PAD, -ZOOM_PAD],
        [width + ZOOM_PAD, height + ZOOM_PAD],
      ])
      .filter(zoomEventFilter)
      .on("start", (event: D3ZoomEvent<SVGSVGElement, unknown>) => {
        if (event.sourceEvent?.type === "mousedown") setDragging(true);
      })
      .on("zoom", (event: D3ZoomEvent<SVGSVGElement, unknown>) => {
        setTransform(event.transform);
        // sourceEvent есть только у жестов: программный полёт сюда не попадает.
        if (event.sourceEvent) onUserZoomRef.current?.(event.transform);
      })
      .on("end", () => setDragging(false));

    svg.call(behavior);
    // d3-zoom ставит touch-action: none; возвращаем pan-y, чтобы один палец скроллил страницу.
    svg.style("touch-action", "pan-y");
    behaviorRef.current = behavior;

    return () => {
      cancelFlight();
      svg.on(".zoom", null);
      svg.style("touch-action", null);
      behaviorRef.current = null;
    };
  }, [svgRef, width, height, enabled, cancelFlight]);

  const zoomTo = useCallback(
    (target: ZoomTransform, animate: boolean) => {
      const behavior = behaviorRef.current;
      const node = svgRef.current;
      if (!behavior || !node) return;

      cancelFlight();
      const svg = select<SVGSVGElement, unknown>(node);

      if (!animate) {
        behavior.transform(svg, target);
        return;
      }

      const from = zoomTransform(node);
      if (from.k === target.k && from.x === target.x && from.y === target.y) return;

      const startedAt = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - startedAt) / FLIGHT_MS);
        const eased = easeOutQuint(t);
        const current = zoomIdentity
          .translate(lerp(from.x, target.x, eased), lerp(from.y, target.y, eased))
          .scale(lerp(from.k, target.k, eased));

        behavior.transform(svg, current);
        flightRef.current = t < 1 ? requestAnimationFrame(step) : null;
      };

      flightRef.current = requestAnimationFrame(step);
    },
    [svgRef, cancelFlight],
  );

  return useMemo(() => ({ transform, dragging, zoomTo }), [transform, dragging, zoomTo]);
}
