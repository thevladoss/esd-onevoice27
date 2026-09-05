/** Чистая математика глобуса: без DOM, чтобы считаться и тестироваться отдельно от canvas. */

export const GLOBE_POINTS = 1800;
export const GLOBE_TILT = (23 * Math.PI) / 180;
export const GLOBE_SPEED = 0.0008;

const TAU = Math.PI * 2;
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

/** Цвета по широте: север — signal-300, экватор — unity-500, юг — horizon-400. */
const NORTH: RGB = [210, 142, 190];
const EQUATOR: RGB = [59, 77, 161];
const SOUTH: RGB = [123, 194, 199];

/** Наклоны трёх орбитальных дуг в радианах. */
const ARC_ROTATIONS = [-28, 14, 52].map((deg) => (deg * Math.PI) / 180);

type RGB = [number, number, number];

export type GlobeLayout = { cx: number; cy: number; r: number };

export type GlobeMotionFlags = {
  inView: boolean;
  hidden: boolean;
  reducedMotion: boolean;
};

/** Равномерная спираль Фибоначчи: `n` триплетов x, y, z на единичной сфере. */
export function fibonacciSphere(n: number): Float32Array {
  const points = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2;
    const ring = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = GOLDEN_ANGLE * i;
    points[i * 3] = Math.cos(theta) * ring;
    points[i * 3 + 1] = y;
    points[i * 3 + 2] = Math.sin(theta) * ring;
  }
  return points;
}

function mix(from: RGB, to: RGB, t: number): string {
  const r = Math.round(from[0] + (to[0] - from[0]) * t);
  const g = Math.round(from[1] + (to[1] - from[1]) * t);
  const b = Math.round(from[2] + (to[2] - from[2]) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

/** Цвет точки по широте `y` из отрезка [-1, 1]. */
export function latitudeColor(y: number): string {
  const clamped = Math.max(-1, Math.min(1, y));
  return clamped >= 0 ? mix(EQUATOR, NORTH, clamped) : mix(EQUATOR, SOUTH, -clamped);
}

/** Глобус крутится только во вьюпорте, на видимой вкладке и без reduced motion. */
export function shouldAnimate(flags: GlobeMotionFlags): boolean {
  return flags.inView && !flags.hidden && !flags.reducedMotion;
}

/** До 768px глобус уходит в центр над текстом, дальше смещается вправо. */
export function globeLayout(width: number, height: number): GlobeLayout {
  if (width < 768) {
    return { cx: width * 0.5, cy: height * 0.38, r: Math.min(width, height) * 0.4 };
  }
  return { cx: width * 0.72, cy: height * 0.46, r: Math.min(width, height) * 0.46 };
}

/** Кадр глобуса: три орбитальные дуги и точки, повёрнутые на `angle` вокруг наклонённой оси. */
export function drawGlobe(
  ctx: CanvasRenderingContext2D,
  points: Float32Array,
  angle: number,
  layout: GlobeLayout,
  width: number,
  height: number,
): void {
  const { cx, cy, r } = layout;

  ctx.clearRect(0, 0, width, height);
  ctx.globalCompositeOperation = "lighter";

  ctx.strokeStyle = "rgb(170 217 220 / .18)";
  ctx.lineWidth = 1;
  for (const rotation of ARC_ROTATIONS) {
    ctx.beginPath();
    ctx.ellipse(cx, cy, r * 1.12, r * 0.32, rotation, 0, TAU);
    ctx.stroke();
  }

  const cosA = Math.cos(angle);
  const sinA = Math.sin(angle);
  const cosT = Math.cos(GLOBE_TILT);
  const sinT = Math.sin(GLOBE_TILT);
  const count = Math.floor(points.length / 3);

  for (let i = 0; i < count; i++) {
    const x = points[i * 3];
    const y = points[i * 3 + 1];
    const z = points[i * 3 + 2];

    const rx = x * cosA + z * sinA;
    const rz = -x * sinA + z * cosA;
    const ty = y * cosT - rz * sinT;
    const depth = y * sinT + rz * cosT;

    const sx = cx + rx * r;
    const sy = cy - ty * r;
    const size = 1 + (depth + 1) * 0.6;
    const color = latitudeColor(y);

    ctx.globalAlpha = depth >= 0 ? 0.9 : 0.18;
    ctx.fillStyle = color;
    if (i % 12 === 0) {
      ctx.shadowBlur = 8;
      ctx.shadowColor = color;
    } else {
      ctx.shadowBlur = 0;
    }

    ctx.beginPath();
    ctx.arc(sx, sy, size / 2, 0, TAU);
    ctx.fill();
  }

  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
  ctx.globalCompositeOperation = "source-over";
}
