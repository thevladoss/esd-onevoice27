import { useEffect, useRef } from "react";
import {
  GLOBE_POINTS,
  GLOBE_SPEED,
  drawGlobe,
  fibonacciSphere,
  globeLayout,
  shouldAnimate,
  type GlobeLayout,
} from "./globe";

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

export function GlobeCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    // Без 2d-контекста (jsdom, старый браузер) hero остаётся со звёздным полем.
    if (!ctx) return;

    const points = fibonacciSphere(GLOBE_POINTS);
    const motionQuery = window.matchMedia(REDUCED_MOTION);

    let angle = 0;
    let inView = true;
    let hidden = document.hidden;
    let reduced = motionQuery.matches;
    let frameId: number | null = null;
    let width = 0;
    let height = 0;
    let layout: GlobeLayout = globeLayout(0, 0);

    // Стрелки вместо объявлений функций: так TypeScript сохраняет сужение
    // `canvas` и `ctx` до ненулевых типов внутри замыканий.
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      if (width <= 0 || height <= 0) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      layout = globeLayout(width, height);
    };

    const renderFrame = () => {
      if (width <= 0 || height <= 0) return;
      drawGlobe(ctx, points, angle, layout, width, height);
    };

    const tick = () => {
      angle += GLOBE_SPEED;
      renderFrame();
      frameId = window.requestAnimationFrame(tick);
    };

    const sync = () => {
      if (shouldAnimate({ inView, hidden, reducedMotion: reduced })) {
        if (frameId === null) frameId = window.requestAnimationFrame(tick);
        return;
      }
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
        frameId = null;
      }
      if (reduced) renderFrame();
    };

    const handleResize = () => {
      resize();
      renderFrame();
      sync();
    };

    const handleVisibility = () => {
      hidden = document.hidden;
      sync();
    };

    const handleMotionChange = (event: MediaQueryListEvent) => {
      reduced = event.matches;
      sync();
    };

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(canvas);
    } else {
      window.addEventListener("resize", handleResize);
    }

    let viewObserver: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== "undefined") {
      viewObserver = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) inView = entry.isIntersecting;
          sync();
        },
        { threshold: 0 },
      );
      viewObserver.observe(canvas);
    }

    document.addEventListener("visibilitychange", handleVisibility);
    motionQuery.addEventListener?.("change", handleMotionChange);

    resize();
    sync();

    return () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
        frameId = null;
      }
      resizeObserver?.disconnect();
      viewObserver?.disconnect();
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", handleVisibility);
      motionQuery.removeEventListener?.("change", handleMotionChange);
    };
  }, []);

  return <canvas ref={canvasRef} className="globe-canvas" aria-hidden="true" />;
}
