import {
  BRAND_COLORS,
  FLARE_RAY_THRESHOLD,
  FRAME_INTERVAL_MS,
  MAX_ELAPSED_MS,
  PALETTE,
  SHOOTING_STAR_GAP_MS,
  STATIC_SEED,
  createNebulae,
  createParticle,
  createScene,
  drawScene,
  frameElapsed,
  particleCount,
  particleFrame,
  pickColor,
  populateScene,
  seededRandom,
  shouldAnimate,
  shouldDrawFrame,
  starCount,
  type Particle,
} from "./heroParticles";

type MockGradient = { addColorStop: ReturnType<typeof vi.fn> };

/** Мок 2d-контекста: считает вызовы и запоминает градиенты вместе с их стопами. */
function createMockContext() {
  const radial: MockGradient[] = [];
  const linear: MockGradient[] = [];
  const composites: string[] = [];

  const ctx = {
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    fillRect: vi.fn(),
    stroke: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    drawImage: vi.fn(),
    setTransform: vi.fn(),
    createRadialGradient: vi.fn(() => {
      const gradient = { addColorStop: vi.fn() };
      radial.push(gradient);
      return gradient;
    }),
    createLinearGradient: vi.fn(() => {
      const gradient = { addColorStop: vi.fn() };
      linear.push(gradient);
      return gradient;
    }),
    globalAlpha: 1,
    globalCompositeOperation: "source-over",
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 1,
  };

  // Режим наложения читается в момент заливки: проверка «screen на каждом fill».
  ctx.fill.mockImplementation(() => {
    composites.push(ctx.globalCompositeOperation);
  });

  return { ctx, radial, linear, composites };
}

function asContext(ctx: ReturnType<typeof createMockContext>["ctx"]): CanvasRenderingContext2D {
  return ctx as unknown as CanvasRenderingContext2D;
}

/** Подставной offscreen-canvas: настоящий в jsdom отдаёт null вместо контекста. */
function createStaticCanvas() {
  const staticCtx = {
    setTransform: vi.fn(),
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    fillStyle: "",
  };
  const canvas = {
    width: 0,
    height: 0,
    getContext: () => staticCtx,
  } as unknown as HTMLCanvasElement;

  return { canvas, staticCtx };
}

function testParticle(overrides: Partial<Particle> = {}): Particle {
  return {
    x: 100,
    y: 100,
    radius: 1,
    alpha: 0.5,
    phase: 0,
    twinkle: 0,
    flare: false,
    flarePhase: 0,
    flareSpeed: 0,
    depthTravel: false,
    depthPhase: 0,
    depthSpeed: 0,
    driftX: 0,
    driftY: 0,
    color: PALETTE[0],
    ...overrides,
  };
}

describe("seededRandom", () => {
  it("повторяет одну и ту же последовательность на одном зерне", () => {
    const first = Array.from({ length: 5 }, seededRandom(STATIC_SEED));
    const second = Array.from({ length: 5 }, seededRandom(STATIC_SEED));

    expect(first).toEqual(second);
    for (const value of first) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it("разводит разные зёрна", () => {
    expect(seededRandom(1)()).not.toBe(seededRandom(2)());
  });
});

describe("счёт звёзд и частиц", () => {
  it("держит звёзды между полом 140 и потолком брейкпоинта", () => {
    expect(starCount(390, 844)).toBe(140);
    expect(starCount(1024, 700)).toBe(199);
    expect(starCount(1440, 600)).toBe(240);
    expect(starCount(1920, 1080)).toBe(520);
  });

  it("держит живые частицы между полом 48 и потолком брейкпоинта", () => {
    expect(particleCount(390, 844)).toBe(48);
    expect(particleCount(1024, 700)).toBe(60);
    expect(particleCount(1440, 600)).toBe(72);
    expect(particleCount(1920, 1080)).toBe(140);
  });
});

describe("палитра", () => {
  it("состоит из четырёх литералов оригинала", () => {
    expect(PALETTE).toEqual([
      [248, 247, 251],
      [227, 175, 210],
      [184, 192, 230],
      [170, 217, 220],
    ]);
    expect(BRAND_COLORS.light).toEqual([248, 247, 251]);
  });

  it("выбирает цвет по индексу от генератора", () => {
    expect(pickColor(() => 0)).toEqual(BRAND_COLORS.light);
    expect(pickColor(() => 0.99)).toEqual(BRAND_COLORS.horizon);
    expect(PALETTE).toContain(pickColor());
  });
});

describe("шаг кадра", () => {
  it("пропускает кадр раньше 33 мс и рисует первый без задержки", () => {
    expect(shouldDrawFrame(0, 16)).toBe(true);
    expect(shouldDrawFrame(1000, 1030)).toBe(false);
    expect(shouldDrawFrame(1000, 1034)).toBe(true);
    expect(FRAME_INTERVAL_MS).toBeCloseTo(33.333, 3);
  });

  it("режет длину шага потолком 40 мс", () => {
    expect(frameElapsed(0, 500)).toBe(0);
    expect(frameElapsed(1000, 1020)).toBe(20);
    expect(frameElapsed(1000, 1500)).toBe(MAX_ELAPSED_MS);
  });

  it("крутит цикл только на видимой секции, открытой вкладке и без reduce", () => {
    expect(shouldAnimate({ visible: true, hidden: false, reduce: false })).toBe(true);
    expect(shouldAnimate({ visible: false, hidden: false, reduce: false })).toBe(false);
    expect(shouldAnimate({ visible: true, hidden: true, reduce: false })).toBe(false);
    expect(shouldAnimate({ visible: true, hidden: false, reduce: true })).toBe(false);
  });
});

describe("createParticle", () => {
  it("сдвигает частицу вправо и вниз, когда просят место у глобуса", () => {
    const random = seededRandom(7);

    for (let index = 0; index < 20; index += 1) {
      const particle = createParticle(1440, 600, true, random);

      expect(particle.x).toBeGreaterThanOrEqual(0.44 * 1440);
      expect(particle.x).toBeLessThanOrEqual(0.98 * 1440);
      expect(particle.y).toBeGreaterThanOrEqual(0.3 * 600);
      expect(particle.y).toBeLessThanOrEqual(0.92 * 600);
      expect(particle.radius).toBeGreaterThanOrEqual(0.45);
      expect(particle.radius).toBeLessThanOrEqual(1.65);
      expect(particle.alpha).toBeGreaterThanOrEqual(0.18);
      expect(particle.alpha).toBeLessThanOrEqual(0.74);
      expect(PALETTE).toContain(particle.color);
    }
  });

  it("раскидывает частицу по всему полю без просьбы", () => {
    const random = seededRandom(11);

    for (let index = 0; index < 20; index += 1) {
      const particle = createParticle(390, 844, false, random);

      expect(particle.x).toBeGreaterThanOrEqual(0);
      expect(particle.x).toBeLessThanOrEqual(390);
      expect(particle.y).toBeGreaterThanOrEqual(0);
      expect(particle.y).toBeLessThanOrEqual(844);
    }
  });
});

describe("createNebulae", () => {
  it("отдаёт три облака оригинала с их цветами и долями", () => {
    const nebulae = createNebulae();

    expect(nebulae).toHaveLength(3);
    expect(nebulae.map((cloud) => cloud.color)).toEqual([
      BRAND_COLORS.signal,
      BRAND_COLORS.unity,
      BRAND_COLORS.horizon,
    ]);
    expect(nebulae.map((cloud) => [cloud.x, cloud.y, cloud.radius])).toEqual([
      [0.25, 0.46, 0.62],
      [0.66, 0.31, 0.54],
      [0.82, 0.68, 0.48],
    ]);
  });
});

describe("populateScene", () => {
  it("рисует статичное поле на offscreen-canvas с обрезанным dpr", () => {
    const { canvas, staticCtx } = createStaticCanvas();
    const scene = createScene(canvas);

    populateScene(scene, 1440, 600, 1.75);

    // dpr статичного поля обрезан до 1,25: 1440 × 1,25 = 1800, 600 × 1,25 = 750.
    expect(canvas.width).toBe(1800);
    expect(canvas.height).toBe(750);
    expect(staticCtx.arc).toHaveBeenCalledTimes(starCount(1440, 600));
    expect(scene.particles).toHaveLength(particleCount(1440, 600));
    expect(scene.nebulae).toHaveLength(3);
  });
});

describe("drawScene", () => {
  it("чистит холст, кладёт туманности и складывает слои по свету", () => {
    const { ctx, composites } = createMockContext();
    const scene = createScene(null);
    populateScene(scene, 1440, 600, 1);

    drawScene(asContext(ctx), scene, 1000, 0, false, seededRandom(5));

    expect(ctx.clearRect).toHaveBeenCalledTimes(1);
    expect(ctx.clearRect).toHaveBeenCalledWith(0, 0, 1440, 600);
    expect(ctx.createRadialGradient.mock.calls.length).toBeGreaterThanOrEqual(3);
    expect(ctx.drawImage).not.toHaveBeenCalled();
    expect(composites.length).toBeGreaterThan(0);
    expect(composites.every((mode) => mode === "screen")).toBe(true);
    expect(ctx.save).toHaveBeenCalledTimes(1);
    expect(ctx.restore).toHaveBeenCalledTimes(1);
  });

  it("держит стопы туманности на значениях оригинала", () => {
    const { ctx, radial } = createMockContext();
    const scene = createScene(null);
    populateScene(scene, 1440, 600, 1);
    scene.particles = [];
    scene.nextShootingStar = Number.POSITIVE_INFINITY;

    drawScene(asContext(ctx), scene, 1000, 0, false);

    expect(radial).toHaveLength(3);
    expect(radial[0].addColorStop.mock.calls).toEqual([
      [0, "rgba(227,175,210,0.085)"],
      [0.38, "rgba(227,175,210,0.050)"],
      [0.72, "rgba(227,175,210,0.018)"],
      [1, "rgba(227,175,210,0)"],
    ]);
  });

  it("сбрасывает падающие звёзды на статичном кадре", () => {
    const { ctx } = createMockContext();
    const scene = createScene(null);
    populateScene(scene, 1440, 600, 1);
    scene.shootingStars = [
      { x: 0, y: 0, velocityX: 0.5, velocityY: 0.5, length: 100, born: 0, lifetime: 680 },
    ];
    scene.nextShootingStar = 0;

    drawScene(asContext(ctx), scene, 1000, 16, true);

    expect(scene.shootingStars).toHaveLength(0);
    expect(ctx.createLinearGradient).not.toHaveBeenCalled();
  });

  it("запускает новую падающую звезду и назначает следующую через 4,2–9,2 с", () => {
    const { ctx } = createMockContext();
    const scene = createScene(null);
    populateScene(scene, 1440, 600, 1);
    scene.particles = [];
    // Отжившая звезда: её кадр снимает, на холсте остаётся только новая.
    scene.shootingStars = [
      { x: 0, y: 0, velocityX: 0.5, velocityY: 0.5, length: 100, born: 0, lifetime: 680 },
    ];
    scene.nextShootingStar = 0;

    drawScene(asContext(ctx), scene, 1000, 16, false, seededRandom(3));

    expect(scene.shootingStars).toHaveLength(1);
    expect(ctx.createLinearGradient).toHaveBeenCalledTimes(1);
    expect(scene.nextShootingStar).toBeGreaterThanOrEqual(1000 + SHOOTING_STAR_GAP_MS[0]);
    expect(scene.nextShootingStar).toBeLessThanOrEqual(1000 + SHOOTING_STAR_GAP_MS[1]);
  });

  it("рисует лучи вспышки и молчит без неё", () => {
    const { ctx } = createMockContext();
    const scene = createScene(null);
    populateScene(scene, 200, 200, 1);
    scene.shootingStars = [];
    scene.nextShootingStar = 10_000;
    scene.particles = [testParticle({ flare: true, flarePhase: Math.PI / 2 })];

    drawScene(asContext(ctx), scene, 1000, 0, false);

    expect(ctx.moveTo.mock.calls.length).toBeGreaterThanOrEqual(2);
    expect(ctx.lineTo.mock.calls.length).toBeGreaterThanOrEqual(2);
    expect(ctx.stroke.mock.calls.length).toBeGreaterThanOrEqual(1);

    const quiet = createMockContext();
    scene.particles = [testParticle({ flare: false })];
    scene.nextShootingStar = 10_000;

    drawScene(asContext(quiet.ctx), scene, 1000, 0, false);

    expect(quiet.ctx.moveTo).not.toHaveBeenCalled();
  });
});

describe("particleFrame", () => {
  it("считает мерцание и прозрачность частицы без вспышки", () => {
    // pulse = 0,64 + sin(1) · 0,36 = 0,9429295545; depth = 1, значит drawRadius = radius,
    // alpha = 0,5 · pulse · 1 = 0,4714647773.
    const frame = particleFrame(
      testParticle({ radius: 2, alpha: 0.5, twinkle: 0.001 }),
      1000,
    );

    expect(frame.pulse).toBeCloseTo(0.9429295545, 9);
    expect(frame.flare).toBe(0);
    expect(frame.depth).toBe(1);
    expect(frame.drawRadius).toBeCloseTo(2, 9);
    expect(frame.alpha).toBeCloseTo(0.4714647773, 9);
  });

  it("раздувает радиус на дальней глубине и подмешивает вспышку в прозрачность", () => {
    // sin(π/2) = 1: pulse = 1 и flare = 1; sin(−π/2) = −1, значит depth = 0,
    // drawRadius = 1 · (1 + 1 · 3,2) = 4,2; alpha = (0,6 + 0,86) · 0,28 = 0,4088.
    const frame = particleFrame(
      testParticle({
        radius: 1,
        alpha: 0.6,
        phase: Math.PI / 2,
        flare: true,
        flarePhase: Math.PI / 2,
        depthTravel: true,
        depthPhase: -Math.PI / 2,
      }),
      2000,
    );

    expect(frame.pulse).toBeCloseTo(1, 9);
    expect(frame.flare).toBeCloseTo(1, 9);
    expect(frame.depth).toBeCloseTo(0, 9);
    expect(frame.drawRadius).toBeCloseTo(4.2, 9);
    expect(frame.alpha).toBeCloseTo(0.4088, 9);
    expect(frame.flare).toBeGreaterThan(FLARE_RAY_THRESHOLD);
  });
});
