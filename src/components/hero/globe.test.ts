import {
  FRAME_MS,
  GLOBE_BACK_ALPHA,
  GLOBE_FRONT_ALPHA,
  GLOBE_GLOW_ALPHA,
  GLOBE_HALO_BACK_ALPHA,
  GLOBE_HALO_FRONT_ALPHA,
  GLOBE_HIGHLIGHT_EVERY,
  GLOBE_POINTS,
  GLOBE_POINT_MAX,
  GLOBE_POINT_MIN,
  GLOBE_SPEED,
  MAX_STEP_MS,
  angleStep,
  drawGlobe,
  fibonacciSphere,
  globeLayout,
  haloAlpha,
  haloRadius,
  latitudeColor,
  pointAlpha,
  pointSize,
  shouldAnimate,
} from "./globe";

/** Число подсвеченных точек: индексы 0, 6, 12, … до GLOBE_POINTS. */
const HIGHLIGHTS = Math.ceil(GLOBE_POINTS / GLOBE_HIGHLIGHT_EVERY);

function createMockContext() {
  return {
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    ellipse: vi.fn(),
    stroke: vi.fn(),
    setTransform: vi.fn(),
    createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    globalAlpha: 1,
    globalCompositeOperation: "source-over",
    shadowBlur: 0,
    shadowColor: "",
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 1,
  };
}

describe("fibonacciSphere", () => {
  it("раскладывает точки по единичной сфере", () => {
    const points = fibonacciSphere(GLOBE_POINTS);
    expect(points.length).toBe(GLOBE_POINTS * 3);

    for (let i = 0; i < GLOBE_POINTS; i++) {
      const x = points[i * 3];
      const y = points[i * 3 + 1];
      const z = points[i * 3 + 2];
      expect(Math.abs(Math.sqrt(x * x + y * y + z * z) - 1)).toBeLessThan(1e-5);
    }
  });

  it("на единственной точке отдаёт координаты, а не NaN", () => {
    const points = fibonacciSphere(1);

    expect(points.length).toBe(3);
    expect([...points].every(Number.isFinite)).toBe(true);
  });
});

describe("latitudeColor", () => {
  it("красит полюса и экватор цветами палитры", () => {
    expect(latitudeColor(1)).toBe("rgb(210, 142, 190)");
    expect(latitudeColor(0)).toBe("rgb(59, 77, 161)");
    expect(latitudeColor(-1)).toBe("rgb(123, 194, 199)");
  });
});

describe("angleStep", () => {
  it("держит скорость вращения на любой частоте кадров", () => {
    expect(angleStep(FRAME_MS)).toBeCloseTo(GLOBE_SPEED, 12);
    // 120Hz: вдвое чаще, значит вдвое меньший шаг.
    expect(angleStep(FRAME_MS / 2)).toBeCloseTo(GLOBE_SPEED / 2, 12);
    // Просевший кадр догоняет за один шаг.
    expect(angleStep(FRAME_MS * 3)).toBeCloseTo(GLOBE_SPEED * 3, 12);
  });

  it("не даёт глобусу прыгнуть после долгой паузы", () => {
    expect(angleStep(60_000)).toBe(angleStep(MAX_STEP_MS));
    expect(angleStep(-100)).toBe(0);
  });
});

describe("shouldAnimate", () => {
  it("крутит глобус только во вьюпорте, на видимой вкладке и без reduced motion", () => {
    expect(shouldAnimate({ inView: true, hidden: false, reducedMotion: false })).toBe(true);
    expect(shouldAnimate({ inView: false, hidden: false, reducedMotion: false })).toBe(false);
    expect(shouldAnimate({ inView: true, hidden: true, reducedMotion: false })).toBe(false);
    expect(shouldAnimate({ inView: true, hidden: false, reducedMotion: true })).toBe(false);
  });
});

describe("globeLayout", () => {
  it("держит глобус справа на десктопе", () => {
    const layout = globeLayout(1440, 800);
    expect(layout.cx).toBeCloseTo(1036.8, 6);
    expect(layout.cy).toBeCloseTo(368, 6);
    expect(layout.r).toBeCloseTo(368, 6);
  });

  it("уводит глобус в центр на узких экранах", () => {
    const layout = globeLayout(390, 700);
    expect(layout.cx).toBeCloseTo(195, 6);
    expect(layout.cy).toBeCloseTo(266, 6);
    expect(layout.r).toBeCloseTo(156, 6);
  });
});

describe("яркость сферы", () => {
  it("держит переднюю сторону непрозрачной, а заднюю просвечивающей", () => {
    // Контракт фазы 5: замер после фазы 2 показал 10/255 на области глобуса.
    expect(GLOBE_FRONT_ALPHA).toBeGreaterThanOrEqual(0.85);
    expect(GLOBE_BACK_ALPHA).toBeCloseTo(0.25, 2);
    expect(pointAlpha(0.4)).toBe(GLOBE_FRONT_ALPHA);
    expect(pointAlpha(0)).toBe(GLOBE_FRONT_ALPHA);
    expect(pointAlpha(-0.4)).toBe(GLOBE_BACK_ALPHA);
  });

  it("держит размер точки в диапазоне 1.4–2.6px и растит его с глубиной", () => {
    expect(GLOBE_POINT_MIN).toBeGreaterThanOrEqual(1.4);
    expect(GLOBE_POINT_MAX).toBeLessThanOrEqual(2.6);
    expect(pointSize(-1)).toBeCloseTo(GLOBE_POINT_MIN, 6);
    expect(pointSize(1)).toBeCloseTo(GLOBE_POINT_MAX, 6);
    expect(pointSize(0)).toBeCloseTo((GLOBE_POINT_MIN + GLOBE_POINT_MAX) / 2, 6);
    // Значения за пределами отрезка не раздувают точку.
    expect(pointSize(4)).toBeCloseTo(GLOBE_POINT_MAX, 6);
  });

  it("делает ореол крупнее любой точки и тусклее на дальней стороне", () => {
    // Порог, по которому тесты отличают ореол от точки: радиус ореола самой
    // мелкой точки больше радиуса самой крупной.
    expect(haloRadius(GLOBE_POINT_MIN)).toBeGreaterThan(GLOBE_POINT_MAX / 2);
    expect(haloAlpha(0.3)).toBe(GLOBE_HALO_FRONT_ALPHA);
    expect(haloAlpha(-0.3)).toBe(GLOBE_HALO_BACK_ALPHA);
    expect(GLOBE_HALO_FRONT_ALPHA).toBeLessThan(GLOBE_FRONT_ALPHA);
  });
});

describe("drawGlobe", () => {
  it("рисует точку, ореол каждой шестой, свечение, лимб и три орбитальные дуги", () => {
    const ctx = createMockContext();
    drawGlobe(
      ctx as unknown as CanvasRenderingContext2D,
      fibonacciSphere(GLOBE_POINTS),
      0,
      globeLayout(1200, 600),
      1200,
      600,
    );

    // Точки, их ореолы, диск атмосферы и лимб по краю.
    expect(ctx.arc).toHaveBeenCalledTimes(GLOBE_POINTS + HIGHLIGHTS + 2);
    expect(ctx.ellipse).toHaveBeenCalledTimes(3);
    expect(ctx.clearRect).toHaveBeenCalledWith(0, 0, 1200, 600);
    expect(ctx.globalAlpha).toBe(1);
  });

  it("рисует ореолы плоскими кругами без shadowBlur", () => {
    const ctx = createMockContext();
    const blurs: number[] = [];
    ctx.fill.mockImplementation(() => blurs.push(ctx.shadowBlur));

    drawGlobe(
      ctx as unknown as CanvasRenderingContext2D,
      fibonacciSphere(GLOBE_POINTS),
      0,
      globeLayout(1440, 820),
      1440,
      820,
    );

    // Замер 05-08: каждая размытая заливка стоит ~1,5 мс на GPU, кадр не влезает в 16 мс.
    expect(blurs.length).toBeGreaterThan(0);
    expect(new Set(blurs)).toEqual(new Set([0]));

    const halos = ctx.arc.mock.calls.filter((call) => {
      const radius = call[2] as number;
      return radius > GLOBE_POINT_MAX / 2 && radius <= haloRadius(GLOBE_POINT_MAX);
    });
    expect(halos).toHaveLength(HIGHLIGHTS);
  });

  it("складывает свечение с точками вместо перекрытия", () => {
    const ctx = createMockContext();
    const composites: string[] = [];
    // Режим пишется в свойство: снимаем его значение на каждой отрисовке точки.
    ctx.fill.mockImplementation(() => composites.push(ctx.globalCompositeOperation));

    drawGlobe(
      ctx as unknown as CanvasRenderingContext2D,
      fibonacciSphere(GLOBE_POINTS),
      0,
      globeLayout(1200, 600),
      1200,
      600,
    );

    expect(new Set(composites)).toEqual(new Set(["lighter"]));
    // После кадра режим возвращается к обычному, иначе следующий clearRect неполон.
    expect(ctx.globalCompositeOperation).toBe("source-over");
  });

  it("подкладывает под точки атмосферный диск заявленной яркости", () => {
    const ctx = createMockContext();

    drawGlobe(
      ctx as unknown as CanvasRenderingContext2D,
      fibonacciSphere(GLOBE_POINTS),
      0,
      globeLayout(1440, 800),
      1440,
      800,
    );

    expect(ctx.createRadialGradient).toHaveBeenCalledTimes(1);

    const gradient = ctx.createRadialGradient.mock.results[0].value;
    const stops = gradient.addColorStop.mock.calls;
    // Ядро диска светит на заявленную непрозрачность, край сходит в прозрачный.
    expect(stops[0][0]).toBe(0);
    expect(stops[0][1]).toContain(String(GLOBE_GLOW_ALPHA));
    expect(stops[stops.length - 1][0]).toBe(1);
    expect(stops[stops.length - 1][1]).toContain("0)");
  });
});
