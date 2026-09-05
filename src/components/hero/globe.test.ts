import {
  FRAME_MS,
  GLOBE_POINTS,
  GLOBE_SPEED,
  MAX_STEP_MS,
  angleStep,
  drawGlobe,
  fibonacciSphere,
  globeLayout,
  latitudeColor,
  shouldAnimate,
} from "./globe";

function createMockContext() {
  return {
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    ellipse: vi.fn(),
    stroke: vi.fn(),
    setTransform: vi.fn(),
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
  it("раскладывает 1800 точек по единичной сфере", () => {
    const points = fibonacciSphere(GLOBE_POINTS);
    expect(points.length).toBe(5400);

    for (let i = 0; i < GLOBE_POINTS; i++) {
      const x = points[i * 3];
      const y = points[i * 3 + 1];
      const z = points[i * 3 + 2];
      expect(Math.abs(Math.sqrt(x * x + y * y + z * z) - 1)).toBeLessThan(1e-5);
    }
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

describe("drawGlobe", () => {
  it("рисует одну дугу на точку и три орбитальные дуги", () => {
    const ctx = createMockContext();
    drawGlobe(
      ctx as unknown as CanvasRenderingContext2D,
      fibonacciSphere(GLOBE_POINTS),
      0,
      globeLayout(1200, 600),
      1200,
      600,
    );

    expect(ctx.arc).toHaveBeenCalledTimes(GLOBE_POINTS);
    expect(ctx.ellipse).toHaveBeenCalledTimes(3);
    expect(ctx.clearRect).toHaveBeenCalledWith(0, 0, 1200, 600);
    expect(ctx.globalAlpha).toBe(1);
  });
});
