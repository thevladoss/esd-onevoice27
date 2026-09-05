import { render } from "@testing-library/react";
import { GLOBE_POINTS } from "./globe";
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
