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
  /**
   * Кадр жеста или полёта. Сюда уходит императивная отрисовка вьюпорта: состояние
   * React обновляется один раз в конце, иначе каждый кадр пересобирает всю карту.
   */
  onFrame?: (transform: ZoomTransform) => void;
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

/** Границы вьюбокса и разрешённой области для заданного размера карты. */
function zoomExtents(width: number, height: number) {
  return {
    extent: [
      [0, 0],
      [width, height],
    ] as [[number, number], [number, number]],
    translateExtent: [
      [-ZOOM_PAD, -ZOOM_PAD],
      [width + ZOOM_PAD, height + ZOOM_PAD],
    ] as [[number, number], [number, number]],
  };
}

/**
 * Ограничение из d3-zoom (defaultConstrain), повторённое здесь: behavior.transform
 * пишет трансформ напрямую и через constrain не проходит, поэтому программный полёт
 * вставал за краем разрешённой области, а первый же жест рывком возвращал карту внутрь.
 */
export function constrainTransform(
  transform: ZoomTransform,
  extent: [[number, number], [number, number]],
  translateExtent: [[number, number], [number, number]],
): ZoomTransform {
  const dx0 = transform.invertX(extent[0][0]) - translateExtent[0][0];
  const dx1 = transform.invertX(extent[1][0]) - translateExtent[1][0];
  const dy0 = transform.invertY(extent[0][1]) - translateExtent[0][1];
  const dy1 = transform.invertY(extent[1][1]) - translateExtent[1][1];

  return transform.translate(
    dx1 > dx0 ? (dx0 + dx1) / 2 : Math.min(0, dx0) || Math.max(0, dx1),
    dy1 > dy0 ? (dy0 + dy1) / 2 : Math.min(0, dy0) || Math.max(0, dy1),
  );
}

export function useMapZoom(
  svgRef: RefObject<SVGSVGElement | null>,
  { width, height, enabled, onUserZoom, onFrame }: UseMapZoomOptions,
): MapZoomApi {
  const [transform, setTransform] = useState<ZoomTransform>(zoomIdentity);
  const [dragging, setDragging] = useState(false);
  const behaviorRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const flightRef = useRef<number | null>(null);
  const onUserZoomRef = useRef(onUserZoom);
  const onFrameRef = useRef(onFrame);

  useEffect(() => {
    onUserZoomRef.current = onUserZoom;
    onFrameRef.current = onFrame;
  }, [onUserZoom, onFrame]);

  const cancelFlight = useCallback(() => {
    if (flightRef.current === null) return;

    cancelAnimationFrame(flightRef.current);
    flightRef.current = null;

    // Полёт оборвали на середине: состояние догоняет то, что уже нарисовано,
    // иначе следующий рендер вернул бы вьюпорт к позиции до полёта.
    const node = svgRef.current;
    if (node) setTransform(zoomTransform(node));
  }, [svgRef]);

  useEffect(() => {
    const node = svgRef.current;
    if (!enabled || !node || width < 1 || height < 1) return;

    const svg = select<SVGSVGElement, unknown>(node);
    const { extent, translateExtent } = zoomExtents(width, height);
    const behavior = zoom<SVGSVGElement, unknown>()
      .scaleExtent([ZOOM_MIN, ZOOM_MAX])
      // extent задан явно: без layout измерение через getBoundingClientRect даёт нули.
      .extent(extent)
      .translateExtent(translateExtent)
      .filter(zoomEventFilter)
      .on("start", (event: D3ZoomEvent<SVGSVGElement, unknown>) => {
        if (event.sourceEvent?.type === "mousedown") setDragging(true);
      })
      .on("zoom", (event: D3ZoomEvent<SVGSVGElement, unknown>) => {
        // Кадр рисуется мимо React: setTransform на каждый кадр пересобирал бы
        // около 2900 узлов SVG, и на телефоне жест превращался в слайдшоу.
        onFrameRef.current?.(event.transform);
        // sourceEvent есть только у жестов: программный полёт сюда не попадает.
        if (event.sourceEvent) onUserZoomRef.current?.(event.transform);
      })
      .on("end", (event: D3ZoomEvent<SVGSVGElement, unknown>) => {
        setDragging(false);
        // Конец полёта состояние ставит сам: здесь ждём только конца жеста.
        if (flightRef.current === null) setTransform(event.transform);
      });

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
      const { extent, translateExtent } = zoomExtents(width, height);
      // Полёт держится в тех же границах, что и жесты: иначе первый жест дёрнет карту внутрь.
      const bounded = constrainTransform(target, extent, translateExtent);

      if (!animate) {
        behavior.transform(svg, bounded);
        return;
      }

      const from = zoomTransform(node);
      if (from.k === bounded.k && from.x === bounded.x && from.y === bounded.y) return;

      const startedAt = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - startedAt) / FLIGHT_MS);
        const eased = easeOutQuint(t);
        const current = zoomIdentity
          .translate(lerp(from.x, bounded.x, eased), lerp(from.y, bounded.y, eased))
          .scale(lerp(from.k, bounded.k, eased));

        const frame = constrainTransform(current, extent, translateExtent);
        behavior.transform(svg, frame);

        if (t < 1) {
          flightRef.current = requestAnimationFrame(step);
          return;
        }

        flightRef.current = null;
        setTransform(frame);
      };

      flightRef.current = requestAnimationFrame(step);
    },
    [svgRef, cancelFlight, width, height],
  );

  return useMemo(() => ({ transform, dragging, zoomTo }), [transform, dragging, zoomTo]);
}
