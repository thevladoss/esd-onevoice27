/*
 * Порт скрипта частиц оригинала: docs/research/v1.2/orig-hero-motion.js.
 *
 * Модуль чистый: DOM он не ищет и не подписывается на события, а рисует по переданному
 * контексту и объекту Scene. Наблюдатели и цикл кадров живут в HeroParticles.tsx, поэтому
 * тесты гоняют те же формулы, что и браузер.
 *
 * Палитра задана литералами (спека GLOBE-04): оригинал читает CSS-переменные через
 * getComputedStyle, у нас разрешённые значения зашиты, как и в остальных стилях hero.
 */

export type RGB = readonly [number, number, number];
export type Random = () => number;

export const BRAND_COLORS: { light: RGB; signal: RGB; unity: RGB; horizon: RGB } = {
  light: [248, 247, 251],
  signal: [227, 175, 210],
  unity: [184, 192, 230],
  horizon: [170, 217, 220],
};

/** Порядок оригинала: pickColor берёт индекс floor(random() * 4). */
export const PALETTE: readonly RGB[] = [
  BRAND_COLORS.light,
  BRAND_COLORS.signal,
  BRAND_COLORS.unity,
  BRAND_COLORS.horizon,
];

/** Шаг кадра 30 fps: оригинал держит эту частоту, чтобы не жечь батарею на телефоне. */
export const FRAME_INTERVAL_MS = 1000 / 30;
/** Потолок шага: после паузы дрейф не должен прыгать на всю длину простоя. */
export const MAX_ELAPSED_MS = 40;
export const MAX_PIXEL_RATIO = 1.75;
export const STATIC_MAX_PIXEL_RATIO = 1.25;
export const STATIC_SEED = 270927;
export const TABLET_MIN_WIDTH = 768;
export const DESKTOP_MIN_WIDTH = 1280;
export const STAR_MAX = { phone: 220, tablet: 340, desktop: 520 } as const;
export const PARTICLE_MAX = { phone: 70, tablet: 100, desktop: 140 } as const;
/** Доля звёзд статичного поля, сдвинутая к глобусу справа. */
export const STATIC_RIGHT_SHARE = 0.62;
export const PARTICLE_RIGHT_SHARE = 0.58;
export const SHOOTING_STAR_GAP_MS: readonly [number, number] = [4200, 9200];
export const FIRST_SHOOTING_STAR_GAP_MS: readonly [number, number] = [1600, 4800];
export const FLARE_RAY_THRESHOLD = 0.34;
export const VIEWPORT_ROOT_MARGIN = "100px";

const TWO_PI = Math.PI * 2;

/** Линейный конгруэнтный генератор оригинала: одинаковое поле звёзд на каждой загрузке. */
export function seededRandom(seed: number): Random {
  let value = seed >>> 0;

  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

export function randomBetween(min: number, max: number, random: Random = Math.random): number {
  return min + random() * (max - min);
}

export function isDesktop(width: number): boolean {
  return width >= DESKTOP_MIN_WIDTH;
}

/** Плотность звёзд по площади с полом 140 и потолком по брейкпоинту. */
export function starCount(width: number, height: number): number {
  const maximum =
    width < TABLET_MIN_WIDTH
      ? STAR_MAX.phone
      : isDesktop(width)
        ? STAR_MAX.desktop
        : STAR_MAX.tablet;

  return Math.min(maximum, Math.max(140, Math.round((width * height) / 3600)));
}

/** Живых частиц на порядок меньше звёзд: каждую перерисовывает кадр. */
export function particleCount(width: number, height: number): number {
  const maximum =
    width < TABLET_MIN_WIDTH
      ? PARTICLE_MAX.phone
      : isDesktop(width)
        ? PARTICLE_MAX.desktop
        : PARTICLE_MAX.tablet;

  return Math.min(maximum, Math.max(48, Math.round((width * height) / 12000)));
}

export function pickColor(random: Random = Math.random): RGB {
  return PALETTE[Math.floor(random() * PALETTE.length)];
}

/** Ноль в lastTime значит «цикл только что запущен»: первый кадр рисуется без задержки. */
export function shouldDrawFrame(lastTime: number, time: number): boolean {
  if (lastTime === 0) return true;

  return time - lastTime >= FRAME_INTERVAL_MS;
}

export function frameElapsed(lastTime: number, time: number): number {
  if (lastTime === 0) return 0;

  return Math.min(time - lastTime, MAX_ELAPSED_MS);
}

export function shouldAnimate(flags: {
  visible: boolean;
  hidden: boolean;
  reduce: boolean;
}): boolean {
  return flags.visible && !flags.hidden && !flags.reduce;
}

export type Particle = {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  phase: number;
  twinkle: number;
  flare: boolean;
  flarePhase: number;
  flareSpeed: number;
  depthTravel: boolean;
  depthPhase: number;
  depthSpeed: number;
  driftX: number;
  driftY: number;
  color: RGB;
};

export type Nebula = {
  x: number;
  y: number;
  radius: number;
  phase: number;
  speed: number;
  color: RGB;
};

export type ShootingStar = {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  length: number;
  born: number;
  lifetime: number;
};

export type Scene = {
  width: number;
  height: number;
  pixelRatio: number;
  particles: Particle[];
  nebulae: Nebula[];
  shootingStars: ShootingStar[];
  nextShootingStar: number;
  staticCanvas: HTMLCanvasElement | null;
  staticContext: CanvasRenderingContext2D | null;
};

function rgba(color: RGB, alpha: number | string): string {
  return `rgba(${color[0]},${color[1]},${color[2]},${alpha})`;
}

export function createParticle(
  width: number,
  height: number,
  preferRight: boolean,
  random: Random = Math.random,
): Particle {
  return {
    x: preferRight ? width * randomBetween(0.44, 0.98, random) : random() * width,
    y: preferRight ? height * randomBetween(0.3, 0.92, random) : random() * height,
    radius: randomBetween(0.45, 1.65, random),
    alpha: randomBetween(0.18, 0.74, random),
    phase: random() * TWO_PI,
    twinkle: randomBetween(0.00045, 0.00125, random),
    flare: random() < 0.14,
    flarePhase: random() * TWO_PI,
    flareSpeed: randomBetween(0.00016, 0.00034, random),
    depthTravel: random() < 0.34,
    depthPhase: random() * TWO_PI,
    depthSpeed: randomBetween(0.00008, 0.0002, random),
    driftX: randomBetween(-0.0025, 0.005, random),
    driftY: randomBetween(-0.009, -0.0025, random),
    color: pickColor(random),
  };
}

/** Три облака оригинала: доли ширины и высоты, радиус — доля большей стороны. */
export function createNebulae(): Nebula[] {
  return [
    { x: 0.25, y: 0.46, radius: 0.62, phase: 0.8, speed: 0.000014, color: BRAND_COLORS.signal },
    { x: 0.66, y: 0.31, radius: 0.54, phase: 3.1, speed: 0.00001, color: BRAND_COLORS.unity },
    { x: 0.82, y: 0.68, radius: 0.48, phase: 5.2, speed: 0.000017, color: BRAND_COLORS.horizon },
  ];
}

export function createShootingStar(
  width: number,
  height: number,
  time: number,
  random: Random = Math.random,
): ShootingStar {
  const angle = randomBetween(0.42, 0.68, random);
  const speed = randomBetween(0.42, 0.62, random);

  return {
    x: randomBetween(-width * 0.08, width * 0.72, random),
    y: randomBetween(height * 0.04, height * 0.38, random),
    velocityX: Math.cos(angle) * speed,
    velocityY: Math.sin(angle) * speed,
    length: randomBetween(90, 170, random),
    born: time,
    lifetime: randomBetween(680, 980, random),
  };
}

export function createScene(staticCanvas: HTMLCanvasElement | null): Scene {
  return {
    width: 0,
    height: 0,
    pixelRatio: 1,
    particles: [],
    nebulae: [],
    shootingStars: [],
    nextShootingStar: 0,
    staticCanvas,
    staticContext: staticCanvas?.getContext("2d", { alpha: true }) ?? null,
  };
}

/**
 * Звёздное поле рисуется один раз на offscreen-canvas и потом кладётся кадром целиком:
 * сотни кругов в каждом кадре съели бы весь бюджет 30 fps.
 */
export function renderStaticField(scene: Scene): void {
  const { staticCanvas, staticContext, width, height } = scene;
  if (!staticCanvas || !staticContext) return;

  const ratio = Math.min(scene.pixelRatio, STATIC_MAX_PIXEL_RATIO);
  const desktop = isDesktop(width);
  const count = starCount(width, height);
  const random = seededRandom(STATIC_SEED);

  staticCanvas.width = Math.round(width * ratio);
  staticCanvas.height = Math.round(height * ratio);
  staticContext.setTransform(ratio, 0, 0, ratio, 0, 0);
  staticContext.clearRect(0, 0, width, height);

  for (let index = 0; index < count; index += 1) {
    // Хвост поля уходит вправо, под глобус: там оригинал держит звёзды плотнее.
    const favorRight = desktop && index >= count * STATIC_RIGHT_SHARE;
    const x = width * (favorRight ? 0.44 + random() * 0.54 : random());
    const y = height * (favorRight ? 0.3 + random() * 0.62 : random());
    const radius = 0.28 + random() * 0.72;
    const alpha = 0.16 + random() * 0.38;
    const color = pickColor(random);

    staticContext.fillStyle = rgba(color, alpha);
    staticContext.beginPath();
    staticContext.arc(x, y, radius, 0, TWO_PI);
    staticContext.fill();
  }
}

export function populateScene(
  scene: Scene,
  width: number,
  height: number,
  pixelRatio: number,
): void {
  scene.width = width;
  scene.height = height;
  scene.pixelRatio = pixelRatio;

  const desktop = isDesktop(width);
  const count = particleCount(width, height);

  scene.particles = Array.from({ length: count }, (_, index) =>
    createParticle(width, height, desktop && index >= count * PARTICLE_RIGHT_SHARE),
  );
  scene.nebulae = createNebulae();
  renderStaticField(scene);
}

export type ParticleFrame = {
  pulse: number;
  flare: number;
  depth: number;
  drawRadius: number;
  alpha: number;
};

/**
 * Значения частицы на момент времени. Вынесено из кадра отдельно, чтобы числа мерцания,
 * вспышки и глубины проверялись тестом напрямую, а не по следам вызовов контекста.
 */
export function particleFrame(particle: Particle, time: number): ParticleFrame {
  const pulse = 0.64 + Math.sin(particle.phase + time * particle.twinkle) * 0.36;
  const flare = particle.flare
    ? Math.max(0, Math.sin(particle.flarePhase + time * particle.flareSpeed)) ** 14
    : 0;
  const depth = particle.depthTravel
    ? 0.5 + Math.sin(particle.depthPhase + time * particle.depthSpeed) * 0.5
    : 1;
  const drawRadius = particle.radius * (1 + (1 - depth) * 3.2);
  const alpha = Math.min(1, (particle.alpha * pulse + flare * 0.86) * (0.28 + depth * 0.72));

  return { pulse, flare, depth, drawRadius, alpha };
}

function drawNebulae(
  ctx: CanvasRenderingContext2D,
  scene: Scene,
  time: number,
  staticFrame: boolean,
): void {
  const { width, height } = scene;

  for (const cloud of scene.nebulae) {
    // Статичный кадр берёт фазу без дрейфа: облака стоят там, где их застала пауза.
    const drift = staticFrame ? cloud.phase : cloud.phase + time * cloud.speed;
    const x = width * (cloud.x + Math.sin(drift) * 0.055);
    const y = height * (cloud.y + Math.cos(drift * 0.76) * 0.045);
    const radius = Math.max(width, height) * cloud.radius;
    const nebula = ctx.createRadialGradient(x, y, 0, x, y, radius);

    nebula.addColorStop(0, rgba(cloud.color, "0.085"));
    nebula.addColorStop(0.38, rgba(cloud.color, "0.050"));
    nebula.addColorStop(0.72, rgba(cloud.color, "0.018"));
    nebula.addColorStop(1, rgba(cloud.color, 0));
    ctx.fillStyle = nebula;
    ctx.fillRect(0, 0, width, height);
  }
}

function drawShootingStars(
  ctx: CanvasRenderingContext2D,
  scene: Scene,
  time: number,
  elapsed: number,
  staticFrame: boolean,
  random: Random,
): void {
  if (staticFrame) {
    scene.shootingStars = [];
    return;
  }

  if (time >= scene.nextShootingStar) {
    scene.shootingStars.push(createShootingStar(scene.width, scene.height, time, random));
    scene.nextShootingStar =
      time + randomBetween(SHOOTING_STAR_GAP_MS[0], SHOOTING_STAR_GAP_MS[1], random);
  }

  scene.shootingStars = scene.shootingStars.filter((star) => {
    const progress = (time - star.born) / star.lifetime;
    if (progress >= 1) return false;

    star.x += star.velocityX * elapsed;
    star.y += star.velocityY * elapsed;

    const distance = Math.hypot(star.velocityX, star.velocityY);
    const tailX = star.x - (star.velocityX / distance) * star.length;
    const tailY = star.y - (star.velocityY / distance) * star.length;
    const opacity = Math.sin(progress * Math.PI) * 0.82;
    const streak = ctx.createLinearGradient(tailX, tailY, star.x, star.y);

    streak.addColorStop(0, rgba(BRAND_COLORS.horizon, 0));
    streak.addColorStop(0.72, rgba(BRAND_COLORS.unity, opacity * 0.38));
    streak.addColorStop(1, rgba(BRAND_COLORS.light, opacity));

    ctx.strokeStyle = streak;
    ctx.lineWidth = 1.35;
    ctx.beginPath();
    ctx.moveTo(tailX, tailY);
    ctx.lineTo(star.x, star.y);
    ctx.stroke();
    return true;
  });
}

/**
 * Кадр целиком. staticFrame — пауза: облака стоят на фазе, падающие звёзды сброшены;
 * его рисуют при reduce, вне экрана и в скрытой вкладке.
 */
export function drawScene(
  ctx: CanvasRenderingContext2D,
  scene: Scene,
  time: number,
  elapsed: number,
  staticFrame: boolean,
  random: Random = Math.random,
): void {
  const { width, height } = scene;

  ctx.clearRect(0, 0, width, height);
  ctx.save();
  // Слои складываются по свету: частицы поверх видео не гасят его, а высветляют.
  ctx.globalCompositeOperation = "screen";
  drawNebulae(ctx, scene, time, staticFrame);

  if (scene.staticCanvas && scene.staticContext) {
    ctx.drawImage(
      scene.staticCanvas,
      0,
      0,
      scene.staticCanvas.width,
      scene.staticCanvas.height,
      0,
      0,
      width,
      height,
    );
  }

  for (const particle of scene.particles) {
    if (elapsed) {
      particle.x += particle.driftX * elapsed;
      particle.y += particle.driftY * elapsed;
      // Ушедшая за край частица возвращается с противоположной стороны.
      if (particle.y < -4) particle.y = height + 4;
      if (particle.x < -4) particle.x = width + 4;
      if (particle.x > width + 4) particle.x = -4;
    }

    const { flare, depth, drawRadius, alpha } = particleFrame(particle, time);
    const color = particle.color;

    if (particle.radius > 1.15 || depth < 0.72) {
      const glow = ctx.createRadialGradient(
        particle.x,
        particle.y,
        0,
        particle.x,
        particle.y,
        drawRadius * 5,
      );

      glow.addColorStop(0, rgba(color, alpha));
      glow.addColorStop(1, rgba(color, 0));
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, drawRadius * 5, 0, TWO_PI);
      ctx.fill();
    } else {
      ctx.fillStyle = rgba(color, alpha);
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, drawRadius, 0, TWO_PI);
      ctx.fill();
    }

    if (flare > FLARE_RAY_THRESHOLD) {
      const ray = particle.radius * (4 + flare * 5);

      ctx.strokeStyle = rgba(color, flare * 0.58);
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      ctx.moveTo(particle.x - ray, particle.y);
      ctx.lineTo(particle.x + ray, particle.y);
      ctx.moveTo(particle.x, particle.y - ray);
      ctx.lineTo(particle.x, particle.y + ray);
      ctx.stroke();
    }
  }

  drawShootingStars(ctx, scene, time, elapsed, staticFrame, random);
  ctx.restore();
}
