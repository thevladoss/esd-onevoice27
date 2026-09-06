import type { ZoomTransform } from "d3-zoom";
import type { Ref } from "react";
import { useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef } from "react";

import { REDUCED_MOTION_QUERY, prefersReducedMotion } from "../../lib/useReducedMotion";
import type { LightPoint, LightSprites, Ring } from "./lightsCanvas";
import {
  clampDpr,
  drawFrame,
  frameDue,
  makeSprites,
  ringState,
  shouldAnimate,
  splitBuckets,
  summarize,
} from "./lightsCanvas";

/** Кадр жеста и полёта рисуется мимо React: карта зовёт draw из обработчика d3. */
export interface LightsCanvasHandle {
  draw(transform: ZoomTransform): void;
}

export interface LightsCanvasProps {
  points: readonly LightPoint[];
  /** Состояние камеры из useMapZoom: источник трансформа при рендере React. */
  transform: ZoomTransform;
  width: number;
  height: number;
  ref?: Ref<LightsCanvasHandle>;
}

/** Всё, что компонент отдаёт движку между рендерами. */
interface Scene {
  points: readonly LightPoint[];
  buckets: ReadonlyArray<readonly LightPoint[]>;
  transform: ZoomTransform;
  width: number;
  height: number;
}

/** Движок кадра: подписки, планировщик и спрайты живут в замыкании, а не в состоянии. */
interface Engine {
  draw(transform: ZoomTransform): void;
  onScene(): void;
  dispose(): void;
}

/** Кольцо в работе: точка ищется по id, потому что массив точек пересобирается. */
interface PendingRing {
  id: string;
  startedAt: number;
}

function createEngine(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  sceneRef: { current: Scene },
): Engine {
  let sprites: LightSprites | null = null;
  let spritesDpr = 0;
  let bitmapWidth = 0;
  let bitmapHeight = 0;

  // Без наблюдателя слой считается видимым. С наблюдателем цикл ждёт его первого
  // отчёта: браузер шлёт запись сразу после observe, поэтому задержки нет, зато
  // карта за пределами экрана не начинает дышать до первой прокрутки.
  let inView = typeof IntersectionObserver === "undefined";
  let hidden = document.hidden;
  let reduced = prefersReducedMotion();

  let frameId: number | null = null;
  let lastAt: number | null = null;
  let ringsActive = false;

  let currentTransform: ZoomTransform = sceneRef.current.transform;
  let lastPropTransform = currentTransform;

  const seen = new Set<string>();
  let rings: PendingRing[] = [];
  let pointById = new Map<string, LightPoint>();

  const motionQuery =
    typeof window.matchMedia === "function" ? window.matchMedia(REDUCED_MOTION_QUERY) : null;
  let dprQuery: MediaQueryList | null = null;

  /** Битмап под текущий размер и dpr; true, если что-то из этого поменялось. */
  const resize = (): boolean => {
    const { width, height } = sceneRef.current;
    if (width < 1 || height < 1) return false;

    const dpr = clampDpr(window.devicePixelRatio);
    const bw = Math.round(width * dpr);
    const bh = Math.round(height * dpr);
    if (bw === bitmapWidth && bh === bitmapHeight && dpr === spritesDpr) return false;

    canvas.width = bw;
    canvas.height = bh;
    // Смена размера битмапа сбрасывает состояние контекста, поэтому масштаб ставится после.
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (dpr !== spritesDpr) {
      sprites = makeSprites(dpr);
      spritesDpr = dpr;
    }
    bitmapWidth = bw;
    bitmapHeight = bh;
    return true;
  };

  const render = (now: number): void => {
    const scene = sceneRef.current;
    if (!sprites || scene.width < 1 || scene.height < 1) return;

    const resolved: Ring[] = [];
    for (const ring of rings) {
      const point = pointById.get(ring.id);
      // Огонёк пропал из данных: кольцу больше не за что держаться.
      if (point) resolved.push({ point, startedAt: ring.startedAt });
    }

    const result = drawFrame(ctx, sprites, {
      points: scene.points,
      buckets: scene.buckets,
      transform: currentTransform,
      now,
      rings: resolved,
      reduced,
      width: scene.width,
      height: scene.height,
    });

    ringsActive = result.ringsActive;
    lastAt = now;
    if (rings.length > 0) {
      rings = rings.filter((ring) => !ringState(now - ring.startedAt).done);
    }
  };

  /** Указатель по id и кольца для огоньков, которых в прошлой сцене не было. */
  const collect = (): void => {
    const next = new Map<string, LightPoint>();
    const now = performance.now();
    for (const point of sceneRef.current.points) {
      next.set(point.light.id, point);
      if (point.light.isNew !== true || seen.has(point.light.id)) continue;
      seen.add(point.light.id);
      rings.push({ id: point.light.id, startedAt: now });
    }
    pointById = next;
  };

  const tick = (now: number): void => {
    frameId = null;
    if (!shouldAnimate({ inView, hidden, reducedMotion: reduced })) return;

    // Дыхание идёт на 30 fps, а пока расходится кольцо нового огонька — на
    // полной частоте rAF: 900 мс плавного круга стоят дешевле рваной дуги.
    if (!ringsActive && lastAt !== null && !frameDue(now - lastAt)) {
      frameId = window.requestAnimationFrame(tick);
      return;
    }

    render(now);
    frameId = window.requestAnimationFrame(tick);
  };

  const sync = (): void => {
    if (shouldAnimate({ inView, hidden, reducedMotion: reduced })) {
      if (frameId === null) frameId = window.requestAnimationFrame(tick);
      return;
    }

    if (frameId !== null) {
      window.cancelAnimationFrame(frameId);
      frameId = null;
    }
    // Пауза рвёт отсчёт: после возврата первый кадр рисуется сразу.
    lastAt = null;
    // Статичный кадр бережного движения: ореол 9px alpha .22, ядра обычные, без колец.
    if (reduced) render(performance.now());
  };

  const onScene = (): void => {
    const scene = sceneRef.current;
    if (scene.transform !== lastPropTransform) {
      // Новое состояние камеры после жеста или полёта. Та же ссылка значит
      // промежуточный рендер посреди жеста, и кадр жеста не откатывается.
      currentTransform = scene.transform;
      lastPropTransform = scene.transform;
    }

    resize();
    collect();
    // Новый огонёк, новый размер и новая камера видны сразу, не с ближайшего кадра.
    render(performance.now());
    sync();
  };

  const draw = (next: ZoomTransform): void => {
    currentTransform = next;
    // Порог 30 fps кадру жеста не мешает: иначе огоньки отстают от стран.
    // lastAt внутри render не даёт циклу нарисовать второй кадр в ту же миллисекунду.
    render(performance.now());
  };

  const handleResize = (): void => {
    if (resize()) render(performance.now());
  };

  const handleVisibility = (): void => {
    hidden = document.hidden;
    sync();
  };

  const handleMotionChange = (event: MediaQueryListEvent): void => {
    reduced = event.matches;
    sync();
  };

  const handleDprChange = (): void => {
    watchDpr();
    if (resize()) render(performance.now());
  };

  /** Слежение за плотностью экрана: окно переносят между дисплеями с разным dpr. */
  function watchDpr(): void {
    dprQuery?.removeEventListener?.("change", handleDprChange);
    dprQuery = null;
    if (typeof window.matchMedia !== "function") return;

    const ratio = window.devicePixelRatio || 1;
    dprQuery = window.matchMedia(`(resolution: ${ratio}dppx)`);
    dprQuery.addEventListener?.("change", handleDprChange);
  }

  let sizeObserver: ResizeObserver | null = null;
  if (typeof ResizeObserver !== "undefined") {
    sizeObserver = new ResizeObserver(handleResize);
    sizeObserver.observe(canvas);
  }

  let viewObserver: IntersectionObserver | null = null;
  if (typeof IntersectionObserver !== "undefined") {
    viewObserver = new IntersectionObserver(
      (entries) => {
        const last = entries[entries.length - 1];
        if (last) inView = last.isIntersecting;
        sync();
      },
      // Порог 0: карта дышит, как только в экран заходит её первая полоса.
      { threshold: 0 },
    );
    viewObserver.observe(canvas);
  }

  document.addEventListener("visibilitychange", handleVisibility);
  motionQuery?.addEventListener?.("change", handleMotionChange);
  watchDpr();

  resize();
  collect();
  // Первый кадр без ожидания rAF: у SVG огоньки стояли на карте с первой отрисовки.
  render(performance.now());
  sync();

  return {
    draw,
    onScene,
    dispose(): void {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
        frameId = null;
      }
      sizeObserver?.disconnect();
      viewObserver?.disconnect();
      document.removeEventListener("visibilitychange", handleVisibility);
      motionQuery?.removeEventListener?.("change", handleMotionChange);
      dprQuery?.removeEventListener?.("change", handleDprChange);
      dprQuery = null;
    },
  };
}

/**
 * Слой огоньков карты. 942 огонька рисуются спрайтами на canvas поверх SVG:
 * узлов DOM у них нет, дыхание и кольцо считает lightsCanvas.ts, а кадр жеста
 * приходит императивно из EsdMap.
 */
export function LightsCanvas({ points, transform, width, height, ref }: LightsCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);

  const buckets = useMemo(() => splitBuckets(points), [points]);
  const summary = useMemo(() => summarize(points), [points]);
  const sceneRef = useRef<Scene>({ points, buckets, transform, width, height });

  // Сцена обновляется в layout-эффекте, а не записью в ref во время рендера:
  // рендер React бывает отброшен, а движок кадр уже нарисовал бы.
  useLayoutEffect(() => {
    sceneRef.current = { points, buckets, transform, width, height };
    engineRef.current?.onScene();
  }, [points, buckets, transform, width, height]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    // Без 2d-контекста (jsdom, движок без canvas) остаются только data-атрибуты:
    // ни подписок, ни rAF компонент не заводит.
    if (!ctx) return;

    const engine = createEngine(canvas, ctx, sceneRef);
    engineRef.current = engine;

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      draw: (next: ZoomTransform) => engineRef.current?.draw(next),
    }),
    [],
  );

  // Счётчики объявлены разметкой: они обновляются на каждое изменение огоньков
  // и без 2d-контекста, поэтому тесты читают их вместо узлов SVG.
  // Значение pulse держит слой в закрытом реестре движения; блок бережного
  // движения в global.css гасит только CSS-анимации, а цикл rAF компонент
  // снимает сам по matchMedia.
  return (
    <canvas
      ref={canvasRef}
      className="map-lights-canvas"
      data-anim="pulse"
      aria-hidden="true"
      data-light-count={summary.count}
      data-people={summary.people}
      data-groups={summary.groups}
      data-new={summary.fresh}
    />
  );
}
