/** Чистая математика глобуса: без DOM, чтобы считаться и тестироваться отдельно от canvas. */

export const GLOBE_POINTS = 2200;
export const GLOBE_TILT = (23 * Math.PI) / 180;
export const GLOBE_SPEED = 0.0008;

/*
 * Яркость сферы. Замер живой страницы после фазы 2 (docs/qa/SMOKE-phase2.md)
 * дал среднюю яркость области глобуса 10/255 и 7% освещённых сэмплов: сфера не
 * читалась, различались только орбитальные дуги. Значения ниже подняты под
 * контракт фазы 5: точка передней стороны почти непрозрачна, задняя
 * просвечивает, объём даёт атмосферное свечение под точками и лимб по краю.
 */

/** Непрозрачность точки на обращённой к зрителю стороне. */
export const GLOBE_FRONT_ALPHA = 0.92;
/** Дальняя сторона просвечивает сквозь сферу, но остаётся различимой. */
export const GLOBE_BACK_ALPHA = 0.25;
/** Диаметр точки на дальнем и на ближнем краю сферы. */
export const GLOBE_POINT_MIN = 1.4;
export const GLOBE_POINT_MAX = 2.6;
/** Радиус атмосферного свечения в долях радиуса сферы. */
export const GLOBE_GLOW_SCALE = 1.06;
/** Непрозрачность свечения в центре диска. */
export const GLOBE_GLOW_ALPHA = 0.78;
/** Каждая шестая точка светится ореолом: сфера искрится, а не мерцает целиком. */
export const GLOBE_HIGHLIGHT_EVERY = 6;
/** Опорный кадр 60Hz: скорость вращения задана на него. */
export const FRAME_MS = 1000 / 60;
/** Потолок дельты: после свёрнутой вкладки глобус не должен прыгать на накопленное время. */
export const MAX_STEP_MS = 100;

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

/**
 * Приращение угла за кадр. Скорость задана на 60Hz, поэтому на 120Hz шаг вдвое
 * меньше, а на просевших кадрах — больше: глобус крутится одинаково на любом дисплее.
 */
export function angleStep(dtMs: number): number {
  const clamped = Math.min(Math.max(dtMs, 0), MAX_STEP_MS);
  return GLOBE_SPEED * (clamped / FRAME_MS);
}

/** Глобус крутится только во вьюпорте, на видимой вкладке и без reduced motion. */
export function shouldAnimate(flags: GlobeMotionFlags): boolean {
  return flags.inView && !flags.hidden && !flags.reducedMotion;
}

/**
 * Непрозрачность точки по её глубине `depth` из отрезка [-1, 1]: ближняя
 * половина сферы почти непрозрачна, дальняя просвечивает.
 */
export function pointAlpha(depth: number): number {
  return depth >= 0 ? GLOBE_FRONT_ALPHA : GLOBE_BACK_ALPHA;
}

/** Диаметр точки по глубине: дальний край мельче ближнего, отсюда объём. */
export function pointSize(depth: number): number {
  const clamped = Math.max(-1, Math.min(1, depth));
  return GLOBE_POINT_MIN + ((clamped + 1) / 2) * (GLOBE_POINT_MAX - GLOBE_POINT_MIN);
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
  // Свечение и точки складываются, а не перекрывают друг друга: на чёрном фоне
  // hero это единственный способ получить читаемую сферу из редких точек.
  ctx.globalCompositeOperation = "lighter";

  // Атмосфера: диск под точками, от которого сфера читается как тело, а не как
  // облако. Цвета — unity-500 в ядре и horizon-400 у лимба.
  const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * GLOBE_GLOW_SCALE);
  glow.addColorStop(0, `rgba(84, 110, 196, ${GLOBE_GLOW_ALPHA})`);
  glow.addColorStop(0.58, `rgba(66, 92, 178, ${GLOBE_GLOW_ALPHA * 0.7})`);
  glow.addColorStop(0.88, `rgba(112, 178, 196, ${GLOBE_GLOW_ALPHA * 0.42})`);
  glow.addColorStop(1, "rgba(112, 178, 196, 0)");
  ctx.globalAlpha = 1;
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(cx, cy, r * GLOBE_GLOW_SCALE, 0, TAU);
  ctx.fill();

  // Лимб: тонкая яркая грань по краю диска задаёт силуэт шара.
  ctx.strokeStyle = "rgba(170, 217, 220, 0.5)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, TAU);
  ctx.stroke();

  ctx.strokeStyle = "rgba(170, 217, 220, 0.3)";
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
    const size = pointSize(depth);
    const color = latitudeColor(y);

    ctx.globalAlpha = pointAlpha(depth);
    ctx.fillStyle = color;
    if (i % GLOBE_HIGHLIGHT_EVERY === 0) {
      ctx.shadowBlur = 12;
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
