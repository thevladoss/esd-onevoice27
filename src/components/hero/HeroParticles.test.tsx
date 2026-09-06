import { render } from "@testing-library/react";
import { IntersectionObserverMock } from "../../test/intersection";
import { VIEWPORT_ROOT_MARGIN } from "./heroParticles";
/*
 * Расширение указано явно. Имена heroParticles.ts и HeroParticles.tsx различаются только
 * регистром, на macOS файловая система регистр не различает, а Vite перебирает расширения
 * в порядке .ts → .tsx, поэтому путь "./HeroParticles" привёл бы к чистому модулю без
 * компонента. Hero.tsx в плане 14-02 обязан импортировать компонент так же.
 */
import { HeroParticles } from "./HeroParticles.tsx";

/*
 * Хелперы повторяют GlobeCanvas.test.tsx: тот файл удаляет план 14-02, поэтому они
 * скопированы, а не импортированы.
 */
function mockContext() {
  return {
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
    createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    globalAlpha: 1,
    globalCompositeOperation: "source-over",
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 1,
  };
}

function mockCanvasContext() {
  const ctx = mockContext();
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
    ctx as unknown as CanvasRenderingContext2D,
  );
  return ctx;
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

/** Кадры не выполняются сами: тест сам зовёт колбэк с нужной меткой времени. */
function collectFrames() {
  const frames: FrameRequestCallback[] = [];
  const raf = vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
    frames.push(callback);
    return frames.length;
  });
  const cancel = vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});

  return { frames, raf, cancel };
}

function setHidden(hidden: boolean) {
  Object.defineProperty(document, "hidden", { value: hidden, configurable: true });
  document.dispatchEvent(new Event("visibilitychange"));
}

afterEach(() => {
  vi.restoreAllMocks();
  Object.defineProperty(document, "hidden", { value: false, configurable: true });
});

describe("HeroParticles", () => {
  it("переживает отсутствие 2d-контекста и не просит кадров", () => {
    const raf = vi.spyOn(window, "requestAnimationFrame");

    expect(() => render(<HeroParticles />)).not.toThrow();

    const canvas = document.querySelector("canvas.hero__particles");
    expect(canvas).not.toBeNull();
    expect(canvas).toHaveAttribute("data-anim", "stars");
    expect(canvas).toHaveAttribute("aria-hidden", "true");
    expect(raf).not.toHaveBeenCalled();
  });

  it("рисует один статичный кадр при prefers-reduced-motion", () => {
    const ctx = mockCanvasContext();
    mockCanvasSize(1200, 600);
    mockReducedMotion(true);
    const raf = vi.spyOn(window, "requestAnimationFrame");

    render(<HeroParticles />);

    expect(ctx.clearRect).toHaveBeenCalled();
    expect(ctx.createRadialGradient.mock.calls.length).toBeGreaterThanOrEqual(3);
    expect(raf).not.toHaveBeenCalled();
  });

  it("держит шаг 30 fps и снимает кадр при размонтировании", () => {
    const ctx = mockCanvasContext();
    mockCanvasSize(1200, 600);
    mockReducedMotion(false);
    const { frames, cancel } = collectFrames();

    const { unmount } = render(<HeroParticles />);
    expect(frames).toHaveLength(1);

    const runFrame = (time: number) => {
      const before = ctx.clearRect.mock.calls.length;
      frames[frames.length - 1]!(time);
      return ctx.clearRect.mock.calls.length - before;
    };

    expect(runFrame(1000)).toBe(1);
    // 10 мс после кадра — рано: кадр пропущен, но следующий запрошен.
    expect(runFrame(1010)).toBe(0);
    expect(frames).toHaveLength(3);
    expect(runFrame(1040)).toBe(1);

    const lastId = frames.length;
    unmount();
    expect(cancel).toHaveBeenCalledWith(lastId);
  });

  it("останавливает цикл в скрытой вкладке и возвращает его после", () => {
    const ctx = mockCanvasContext();
    mockCanvasSize(1200, 600);
    mockReducedMotion(false);
    const { raf, cancel } = collectFrames();

    render(<HeroParticles />);
    expect(raf).toHaveBeenCalledTimes(1);

    const before = ctx.clearRect.mock.calls.length;
    setHidden(true);

    expect(cancel).toHaveBeenCalledWith(1);
    expect(ctx.clearRect.mock.calls.length).toBe(before + 1);
    expect(raf).toHaveBeenCalledTimes(1);

    setHidden(false);
    expect(raf).toHaveBeenCalledTimes(2);
  });

  it("наблюдает секцию hero с запасом 100px", () => {
    mockCanvasContext();
    mockCanvasSize(1200, 600);
    mockReducedMotion(true);

    const margins: (string | undefined)[] = [];
    const targets: Element[] = [];

    class RecordingObserver extends IntersectionObserverMock {
      constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
        super(callback);
        margins.push(options?.rootMargin);
      }

      override observe(target: Element): void {
        targets.push(target);
        super.observe(target);
      }
    }

    // Подмена точечная и с возвратом: vi.unstubAllGlobals снял бы и мок из setup.ts.
    const original = globalThis.IntersectionObserver;
    globalThis.IntersectionObserver = RecordingObserver as unknown as typeof IntersectionObserver;

    try {
      render(
        <section>
          <HeroParticles />
        </section>,
      );
    } finally {
      globalThis.IntersectionObserver = original;
    }

    expect(margins).toEqual([VIEWPORT_ROOT_MARGIN]);
    expect(targets).toHaveLength(1);
    expect(targets[0]!.tagName).toBe("SECTION");
  });
});
