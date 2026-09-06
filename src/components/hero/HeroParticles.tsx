import { useEffect, useRef } from "react";
import {
  FIRST_SHOOTING_STAR_GAP_MS,
  MAX_PIXEL_RATIO,
  VIEWPORT_ROOT_MARGIN,
  createScene,
  drawScene,
  frameElapsed,
  populateScene,
  randomBetween,
  shouldAnimate,
  shouldDrawFrame,
} from "./heroParticles";
import { REDUCED_MOTION_QUERY } from "../../lib/useReducedMotion";

export function HeroParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    // Без 2d-контекста (jsdom, старый браузер) слой молчит: ни сцены, ни наблюдателей,
    // hero остаётся с видео и фоном секции.
    if (!ctx) return;

    const scene = createScene(document.createElement("canvas"));
    const motionQuery = window.matchMedia(REDUCED_MOTION_QUERY);

    // Первый кадр рисуется до ответа наблюдателя, поэтому видимость стартует с true.
    let visible = true;
    let hidden = document.hidden;
    let reduce = motionQuery.matches;
    let frameId = 0;
    let lastTime = 0;

    // Стрелки вместо объявлений функций: так TypeScript сохраняет сужение
    // `canvas` и `ctx` до ненулевых типов внутри замыканий.
    const running = () => shouldAnimate({ visible, hidden, reduce });

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      const nextWidth = Math.max(1, Math.round(bounds.width));
      const nextHeight = Math.max(1, Math.round(bounds.height));
      const nextRatio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);

      if (
        nextWidth === scene.width &&
        nextHeight === scene.height &&
        nextRatio === scene.pixelRatio
      ) {
        return;
      }

      canvas.width = Math.round(nextWidth * nextRatio);
      canvas.height = Math.round(nextHeight * nextRatio);
      ctx.setTransform(nextRatio, 0, 0, nextRatio, 0, 0);
      populateScene(scene, nextWidth, nextHeight, nextRatio);

      if (scene.nextShootingStar === 0) {
        scene.nextShootingStar =
          performance.now() +
          randomBetween(FIRST_SHOOTING_STAR_GAP_MS[0], FIRST_SHOOTING_STAR_GAP_MS[1]);
      }

      drawScene(ctx, scene, performance.now(), 0, !running());
    };

    // Шаг 30 fps и потолок 40 мс взяты у оригинала: на телефоне более частый кадр
    // с этой сценой съедает бюджет, а длинная пауза иначе разом сдвинула бы весь дрейф.
    const animate = (time: number) => {
      frameId = 0;

      if (!shouldDrawFrame(lastTime, time)) {
        frameId = window.requestAnimationFrame(animate);
        return;
      }

      const elapsed = frameElapsed(lastTime, time);
      lastTime = time;
      drawScene(ctx, scene, time, elapsed, false);

      if (running()) {
        frameId = window.requestAnimationFrame(animate);
      }
    };

    const updateAnimation = () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
        frameId = 0;
      }

      // Пауза рвёт отсчёт: иначе первый кадр после возврата прыгнет на всю её длину.
      lastTime = 0;

      if (running()) {
        frameId = window.requestAnimationFrame(animate);
      } else {
        drawScene(ctx, scene, performance.now(), 0, true);
      }
    };

    const handleVisibility = () => {
      hidden = document.hidden;
      updateAnimation();
    };

    const handleMotionChange = (event: MediaQueryListEvent) => {
      reduce = event.matches;
      updateAnimation();
    };

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(canvas);
    } else {
      window.addEventListener("resize", resize, { passive: true });
    }

    let viewObserver: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== "undefined") {
      viewObserver = new IntersectionObserver(
        (entries) => {
          const last = entries[entries.length - 1];
          if (last) visible = last.isIntersecting;
          updateAnimation();
        },
        // Наблюдается секция, а не сам canvas: запас 100px гасит цикл ещё до того,
        // как hero полностью уйдёт с экрана, и возвращает его чуть раньше прокрутки.
        { rootMargin: VIEWPORT_ROOT_MARGIN },
      );
      viewObserver.observe(canvas.closest("section") ?? canvas);
    }

    document.addEventListener("visibilitychange", handleVisibility);
    motionQuery.addEventListener?.("change", handleMotionChange);

    resize();
    updateAnimation();

    return () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
        frameId = 0;
      }
      resizeObserver?.disconnect();
      viewObserver?.disconnect();
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", handleVisibility);
      motionQuery.removeEventListener?.("change", handleMotionChange);
    };
  }, []);

  // Значение stars из закрытого реестра переезжает сюда со слоёв звёздного поля.
  // Цикл живёт в кадрах браузера, а не в CSS, поэтому атрибут объявляет слой
  // декоративным, а остановку при reduce делает сам компонент.
  return <canvas ref={canvasRef} className="hero__particles" data-anim="stars" aria-hidden="true" />;
}
