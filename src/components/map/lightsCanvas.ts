/**
 * Чистая математика огоньков карты: константы спецификации, дыхание по пяти
 * корзинам, кольцо нового огонька, порог кадра и сводка по точкам.
 *
 * Почему canvas. Замер прода (docs/research/v1.2/measurements.md) насчитал на
 * странице 3109 узлов SVG, из них 1884 круга огоньков и пять корзин с
 * анимацией opacity; на 390×844 при CPU×4 карта держала 30 fps. Тот же кадр
 * canvas рисует десятками drawImage по готовым спрайтам, без узлов DOM, и
 * возвращает дыхание радиуса 7→12px оригинала, снятое fallback'ом MAP-06 в v1.1.
 *
 * Кадр `drawFrame`: clearRect, слой ореолов по пяти корзинам со своей фазой
 * дыхания, слой ядер с alpha 1, кольца новых огоньков поверх. При
 * prefers-reduced-motion кадр статичный: ореол 9px с alpha .22, ядра обычные,
 * колец нет.
 *
 * Модуль не знает ни о React, ни о DOM: спрайты приходят из фабрики, контекст
 * кадра приходит параметром. Планировщик, наблюдатели и атрибуты живут в
 * компоненте `LightsCanvas.tsx`.
 */

import type { Light, LightType } from "../../data/lights";

/** Период дыхания огонька, LIGHT-02. */
export const BREATH_PERIOD_MS = 2600;
/** Пять фазовых корзин, как пять glow-слоёв Mapbox у оригинала, LIGHT-02. */
export const LIGHT_BUCKETS = 5;
/** Радиус ореола на вдохе и на выдохе, LIGHT-02. */
export const HALO_RADIUS_MIN = 7;
export const HALO_RADIUS_MAX = 12;
/** Непрозрачность ореола на вдохе и на выдохе, LIGHT-02. */
export const HALO_ALPHA_MIN = 0.3;
export const HALO_ALPHA_MAX = 0.6;
/** Спрайт ореола рисуется по максимальному радиусу, кадр его только масштабирует, LIGHT-02. */
export const SPRITE_HALO_RADIUS = 12;
/** Непрозрачность градиента ореола в центре спрайта, LIGHT-02. */
export const SPRITE_HALO_ALPHA = 0.9;
/** Ядро огонька: круг 2,2px с белой обводкой .9px alpha .5, LIGHT-02. */
export const CORE_RADIUS = 2.2;
export const CORE_STROKE_WIDTH = 0.9;
export const CORE_STROKE_ALPHA = 0.5;
/** Половина стороны спрайта ядра: радиус плюс обводка с запасом на сглаживание. */
export const CORE_SPRITE_RADIUS = CORE_RADIUS + CORE_STROKE_WIDTH;
/** Опорный кадр цикла дыхания: 30 fps, LIGHT-04. */
export const FRAME_MS = 1000 / 30;
/** Кадр раньше 33 мс пропускается, LIGHT-04. */
export const MIN_FRAME_GAP_MS = 33;
/** Кольцо нового огонька: 900 мс, радиус 6→20,4px, alpha .5→0, LIGHT-05. */
export const RING_MS = 900;
export const RING_RADIUS_FROM = 6;
export const RING_RADIUS_TO = 20.4;
export const RING_ALPHA_FROM = 0.5;
/** Кривая кольца, та же, что у `light-arrive` в v1.1, LIGHT-05. */
export const RING_EASE: readonly [number, number, number, number] = [0.16, 1, 0.3, 1];
/** Статичный кадр при prefers-reduced-motion: ореол 9px alpha .22, LIGHT-04. */
export const REDUCED_HALO_RADIUS = 9;
export const REDUCED_HALO_ALPHA = 0.22;
/** Потолок плотности пикселей: выше двух заливка холста не окупается, LIGHT-01. */
export const MAX_DPR = 2;

/** Цвета огоньков в компонентах: person — signal, group — horizon, LIGHT-02. */
export const LIGHT_RGB: Record<LightType, readonly [number, number, number]> = {
  person: [158, 67, 154],
  group: [84, 164, 172],
};

/** Те же цвета строками спецификации: их читают тесты швов и зонд. */
export const LIGHT_COLORS: Record<LightType, string> = {
  person: "rgb(158 67 154)",
  group: "rgb(84 164 172)",
};

const TAU = Math.PI * 2;

/** Точка огонька в координатах проекции: тот же элемент, что `points` в `EsdMap.tsx`. */
export interface LightPoint {
  light: Light;
  x: number;
  y: number;
}

/** Структурная часть `ZoomTransform` из d3-zoom: модулю хватает `apply`. */
export interface PointTransform {
  apply(point: [number, number]): [number, number];
}

/** Флаги паузы цикла, LIGHT-04. */
export interface MotionFlags {
  inView: boolean;
  hidden: boolean;
  reducedMotion: boolean;
}

/** Кадр кольца нового огонька. */
export interface RingState {
  radius: number;
  alpha: number;
  done: boolean;
}

/** Сводка для data-атрибутов canvas, LIGHT-06. */
export interface LightsSummary {
  count: number;
  people: number;
  groups: number;
  fresh: number;
}

/**
 * Цвет с непрозрачностью в форме `rgba(r, g, b, a)`. Запятые вместо пробелов:
 * такой синтаксис в `fillStyle` разбирают все движки canvas, включая старые Safari.
 */
export function colorWithAlpha(type: LightType, alpha: number): string {
  const [r, g, b] = LIGHT_RGB[type];
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Белая обводка ядра той же формы. */
export function whiteWithAlpha(alpha: number): string {
  return `rgba(255, 255, 255, ${alpha})`;
}

/**
 * Фаза дыхания корзины `bucket` в момент `nowMs`: значение от 0 до 1.
 * Корзины сдвинуты на пятую часть периода, поэтому поле светится волной.
 */
export function breath(nowMs: number, bucket: number): number {
  const phase = (TAU * nowMs) / BREATH_PERIOD_MS - (TAU * bucket) / LIGHT_BUCKETS;
  return (1 + Math.sin(phase)) / 2;
}

/** Радиус ореола по фазе дыхания: 7px на выдохе, 12px на вдохе. */
export function haloRadius(s: number): number {
  return HALO_RADIUS_MIN + (HALO_RADIUS_MAX - HALO_RADIUS_MIN) * s;
}

/** Непрозрачность ореола по фазе дыхания. */
export function haloAlpha(s: number): number {
  return HALO_ALPHA_MIN + (HALO_ALPHA_MAX - HALO_ALPHA_MIN) * s;
}

/** Корзина огонька равна остатку его позиции в `points`. */
export function bucketOf(index: number): number {
  return index % LIGHT_BUCKETS;
}

/** Раскладка точек по корзинам с сохранением порядка внутри каждой. */
export function splitBuckets<T>(points: readonly T[]): T[][] {
  const rows: T[][] = Array.from({ length: LIGHT_BUCKETS }, () => []);
  points.forEach((point, index) => {
    rows[bucketOf(index)].push(point);
  });
  return rows;
}

/**
 * Решатель кривой CSS `cubic-bezier(x1, y1, x2, y2)`: для x методом Ньютона
 * ищется параметр t, затем по нему считается y. Восемь итераций дают ошибку
 * ниже тысячной, при нулевой производной итерации останавливаются.
 */
export function cubicBezier(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): (x: number) => number {
  const a = (c1: number, c2: number) => 1 - 3 * c2 + 3 * c1;
  const b = (c1: number, c2: number) => 3 * c2 - 6 * c1;
  const c = (c1: number) => 3 * c1;
  const value = (t: number, c1: number, c2: number) =>
    ((a(c1, c2) * t + b(c1, c2)) * t + c(c1)) * t;
  const slope = (t: number, c1: number, c2: number) =>
    3 * a(c1, c2) * t * t + 2 * b(c1, c2) * t + c(c1);

  return (x: number): number => {
    if (!(x > 0)) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i += 1) {
      const derivative = slope(t, x1, x2);
      if (derivative === 0) break;
      t -= (value(t, x1, x2) - x) / derivative;
    }
    return value(t, y1, y2);
  };
}

/** Кривая кольца нового огонька. */
export const ringEase = cubicBezier(...RING_EASE);

/** Кадр кольца по времени с момента появления огонька, LIGHT-05. */
export function ringState(elapsedMs: number): RingState {
  const p = Math.min(1, Math.max(0, elapsedMs / RING_MS));
  const e = ringEase(p);
  return {
    radius: RING_RADIUS_FROM + (RING_RADIUS_TO - RING_RADIUS_FROM) * e,
    alpha: RING_ALPHA_FROM * (1 - e),
    done: elapsedMs >= RING_MS,
  };
}

/** Кадр рисуется, если с прошлого прошло не меньше 33 мс, LIGHT-04. */
export function frameDue(elapsedMs: number): boolean {
  return elapsedMs >= MIN_FRAME_GAP_MS;
}

/** Огоньки дышат только во вьюпорте, на видимой вкладке и без reduced motion. */
export function shouldAnimate(flags: MotionFlags): boolean {
  return flags.inView && !flags.hidden && !flags.reducedMotion;
}

/** Плотность пикселей холста: не меньше 1, не больше 2. */
export function clampDpr(ratio: number | undefined): number {
  if (typeof ratio !== "number" || !Number.isFinite(ratio) || ratio <= 0) return 1;
  return Math.min(ratio, MAX_DPR);
}

/** Счётчики огоньков для data-атрибутов canvas за один проход, LIGHT-06. */
export function summarize(points: readonly LightPoint[]): LightsSummary {
  let people = 0;
  let groups = 0;
  let fresh = 0;
  for (const { light } of points) {
    if (light.type === "person") people += 1;
    else groups += 1;
    if (light.isNew === true) fresh += 1;
  }
  return { count: points.length, people, groups, fresh };
}

/** Точка попадает в холст с полем допуска в радиус рисунка; NaN даёт false. */
export function isOnCanvas(
  x: number,
  y: number,
  width: number,
  height: number,
  margin: number,
): boolean {
  return x >= -margin && x <= width + margin && y >= -margin && y <= height + margin;
}

/** Offscreen-рисунок огонька: холст и радиус в CSS-пикселях, половина стороны. */
export interface Sprite {
  canvas: HTMLCanvasElement;
  radius: number;
}

/** Четыре спрайта кадра: ореол и ядро для каждого типа огонька. */
export interface LightSprites {
  dpr: number;
  halo: Record<LightType, Sprite>;
  core: Record<LightType, Sprite>;
}

/** Источник offscreen-холстов: в тестах подменяется моком. */
export type CanvasFactory = () => HTMLCanvasElement;

/** Кольцо нового огонька от момента его появления в `lights`. */
export interface Ring {
  point: LightPoint;
  startedAt: number;
}

/** Всё, что нужно кадру: точки, их корзины, трансформ карты, время и размер холста. */
export interface FrameInput {
  points: readonly LightPoint[];
  buckets: ReadonlyArray<readonly LightPoint[]>;
  transform: PointTransform;
  now: number;
  rings: readonly Ring[];
  reduced: boolean;
  width: number;
  height: number;
}

/**
 * Четыре offscreen-спрайта под текущий dpr. Перерисовываются только при смене
 * размера или dpr — это решает вызывающая сторона, LIGHT-02. Порядок создания:
 * ореол person, ореол group, ядро person, ядро group.
 */
export function makeSprites(
  dpr: number,
  createCanvas: CanvasFactory = () => document.createElement("canvas"),
): LightSprites | null {
  const paintSprite = (
    radius: number,
    paint: (ctx: CanvasRenderingContext2D) => void,
  ): Sprite | null => {
    const side = Math.ceil(radius * 2 * dpr);
    const canvas = createCanvas();
    canvas.width = side;
    canvas.height = side;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    // Спрайт рисуется в CSS-пикселях, плотность отдаётся масштабу контекста.
    ctx.scale(dpr, dpr);
    paint(ctx);
    return { canvas, radius };
  };

  const paintHalo = (type: LightType) =>
    paintSprite(SPRITE_HALO_RADIUS, (ctx) => {
      const r = SPRITE_HALO_RADIUS;
      const gradient = ctx.createRadialGradient(r, r, 0, r, r, r);
      gradient.addColorStop(0, colorWithAlpha(type, SPRITE_HALO_ALPHA));
      gradient.addColorStop(1, colorWithAlpha(type, 0));
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, r * 2, r * 2);
    });

  const paintCore = (type: LightType) =>
    paintSprite(CORE_SPRITE_RADIUS, (ctx) => {
      const c = CORE_SPRITE_RADIUS;
      ctx.beginPath();
      ctx.arc(c, c, CORE_RADIUS, 0, TAU);
      ctx.fillStyle = colorWithAlpha(type, 1);
      ctx.fill();
      ctx.lineWidth = CORE_STROKE_WIDTH;
      ctx.strokeStyle = whiteWithAlpha(CORE_STROKE_ALPHA);
      ctx.stroke();
    });

  const haloPerson = paintHalo("person");
  const haloGroup = paintHalo("group");
  const corePerson = paintCore("person");
  const coreGroup = paintCore("group");
  if (!haloPerson || !haloGroup || !corePerson || !coreGroup) return null;

  return {
    dpr,
    halo: { person: haloPerson, group: haloGroup },
    core: { person: corePerson, group: coreGroup },
  };
}

/**
 * Один кадр огоньков. Ореолы рисуются слоями по корзинам, чтобы `globalAlpha`
 * менялся пять раз на кадр, а не на каждый огонёк; ядра идут поверх сплошным
 * проходом. Размер `drawImage` зависит только от радиуса рисунка, а не от
 * масштаба карты, LIGHT-03.
 */
export function drawFrame(
  ctx: CanvasRenderingContext2D,
  sprites: LightSprites,
  input: FrameInput,
): { ringsActive: boolean } {
  const { points, buckets, transform, now, rings, reduced, width, height } = input;

  ctx.clearRect(0, 0, width, height);

  buckets.forEach((bucket, n) => {
    let r = REDUCED_HALO_RADIUS;
    if (reduced) {
      ctx.globalAlpha = REDUCED_HALO_ALPHA;
    } else {
      const s = breath(now, n);
      r = haloRadius(s);
      ctx.globalAlpha = haloAlpha(s);
    }
    const size = r * 2;
    for (const point of bucket) {
      const [sx, sy] = transform.apply([point.x, point.y]);
      if (!isOnCanvas(sx, sy, width, height, r)) continue;
      ctx.drawImage(sprites.halo[point.light.type].canvas, sx - r, sy - r, size, size);
    }
  });

  ctx.globalAlpha = 1;
  for (const point of points) {
    const d = sprites.core[point.light.type].radius;
    const [sx, sy] = transform.apply([point.x, point.y]);
    if (!isOnCanvas(sx, sy, width, height, d)) continue;
    ctx.drawImage(sprites.core[point.light.type].canvas, sx - d, sy - d, d * 2, d * 2);
  }

  let ringsActive = false;
  if (!reduced) {
    for (const ring of rings) {
      const state = ringState(now - ring.startedAt);
      if (state.done) continue;
      ringsActive = true;
      const [sx, sy] = transform.apply([ring.point.x, ring.point.y]);
      ctx.globalAlpha = state.alpha;
      ctx.strokeStyle = colorWithAlpha(ring.point.light.type, 1);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(sx, sy, state.radius, 0, TAU);
      ctx.stroke();
    }
  }

  ctx.globalAlpha = 1;
  return { ringsActive };
}
