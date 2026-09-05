import { render } from "@testing-library/react";
import { FRAME_MS, GLOBE_POINTS, GLOBE_POINT_MAX, fibonacciSphere } from "./globe";
import { GlobeCanvas } from "./GlobeCanvas";

function mockContext() {
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

function mockCanvasSize(width: number, height: number) {
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
    width,
    height,
    top: 0,
    left: 0,
    right: width,
    bottom: height,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  } as DOMRect);
}

function mockReducedMotion(reduce: boolean) {
  vi.spyOn(window, "matchMedia").mockImplementation(
    (query: string) =>
      ({
        matches: reduce && query.includes("reduce"),
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }) as unknown as MediaQueryList,
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("GlobeCanvas", () => {
  it("переживает отсутствие 2d-контекста", () => {
    expect(() => render(<GlobeCanvas />)).not.toThrow();
    const canvas = document.querySelector("canvas.globe-canvas");
    expect(canvas).not.toBeNull();
    expect(canvas).toHaveAttribute("aria-hidden", "true");
  });

  it("рисует один статичный кадр при prefers-reduced-motion", () => {
    const ctx = mockContext();
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      ctx as unknown as CanvasRenderingContext2D,
    );
    mockCanvasSize(1200, 600);
    mockReducedMotion(true);
    const raf = vi.spyOn(window, "requestAnimationFrame");

    render(<GlobeCanvas />);

    expect(ctx.arc.mock.calls.length).toBeGreaterThanOrEqual(GLOBE_POINTS);
    expect(raf).not.toHaveBeenCalled();
  });

  it("вращает глобус по времени кадра, а не по их числу", () => {
    const ctx = mockContext();
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      ctx as unknown as CanvasRenderingContext2D,
    );
    mockCanvasSize(1200, 600);
    mockReducedMotion(false);

    const frames: FrameRequestCallback[] = [];
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      frames.push(callback);
      return frames.length;
    });

    render(<GlobeCanvas />);

    // Точка, которую поворот вокруг оси смещает сильнее всего: она лежит около
    // экватора и в момент отсчёта смотрит вбок. У полюса и у точки перед
    // зрителем сдвиг за кадр второго порядка, и отношение шагов поплывёт.
    const sphere = fibonacciSphere(GLOBE_POINTS);
    let probe = 0;
    for (let i = 0; i < GLOBE_POINTS; i++) {
      const sideways = Math.abs(sphere[i * 3 + 2]);
      if (Math.abs(sphere[i * 3 + 1]) < 0.2 && sideways > Math.abs(sphere[probe * 3 + 2])) {
        probe = i;
      }
    }

    let next = 0;
    const runFrame = (now: number): number => {
      const before = ctx.arc.mock.calls.length;
      frames[next]!(now);
      next += 1;
      // Кадр рисует ещё диск атмосферы и лимб: они отличаются радиусом на
      // порядок, поэтому точки отбираются по нему, а не по позиции в вызовах.
      const dots = ctx.arc.mock.calls
        .slice(before)
        .filter((call) => (call[2] as number) <= GLOBE_POINT_MAX);
      return dots[probe][0] as number;
    };

    const first = runFrame(1000);
    const second = runFrame(1000 + FRAME_MS);
    const third = runFrame(1000 + FRAME_MS * 3);

    // Кадр вдвое длиннее сдвигает точку вдвое дальше.
    expect((third - second) / (second - first)).toBeCloseTo(2, 2);
  });

  it("запускает rAF-цикл и снимает его при размонтировании", () => {
    const ctx = mockContext();
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      ctx as unknown as CanvasRenderingContext2D,
    );
    mockCanvasSize(1200, 600);
    mockReducedMotion(false);
    const raf = vi.spyOn(window, "requestAnimationFrame").mockImplementation(() => 1);
    const cancel = vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});

    const { unmount } = render(<GlobeCanvas />);
    expect(raf).toHaveBeenCalled();

    unmount();
    expect(cancel).toHaveBeenCalledWith(1);
  });
});
