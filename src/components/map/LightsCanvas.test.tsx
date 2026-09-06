import { act, render } from "@testing-library/react";
import { ZoomTransform, zoomIdentity } from "d3-zoom";
import { createRef } from "react";

import { generateLights, type Light } from "../../data/lights";
import { enterViewport } from "../../test/intersection";
import {
  CORE_SPRITE_RADIUS,
  HALO_RADIUS_MAX,
  HALO_RADIUS_MIN,
  LIGHT_COLORS,
  REDUCED_HALO_ALPHA,
  REDUCED_HALO_RADIUS,
  RING_RADIUS_FROM,
  type LightPoint,
} from "./lightsCanvas";
// Расширение обязательно: без него путь на файловой системе macOS ложится
// в чистый модуль lightsCanvas.ts, а не в компонент.
import { LightsCanvas, type LightsCanvasHandle } from "./LightsCanvas.tsx";

const SIZE = { width: 1200, height: 700 };
const TAU = Math.PI * 2;

// Огоньки строятся один раз на файл: rejection sampling в generateLights дорогой.
const lights = generateLights();
// Проекция тестам не нужна: точки раскладываются сеткой 40 в ряд внутри 1200×700.
const points: LightPoint[] = lights.map((light, index) => ({
  light,
  x: 10 + (index % 40) * 25,
  y: 10 + Math.floor(index / 40) * 25,
}));

const newLight: Light = {
  id: "n942",
  type: "person",
  countryId: 643,
  lon: 0,
  lat: 0,
  isNew: true,
};
const withNew: LightPoint[] = [...points, { light: newLight, x: 300, y: 200 }];

interface DrawSnapshot {
  alpha: number;
  args: unknown[];
}

interface ArcSnapshot {
  alpha: number;
  strokeStyle: unknown;
  lineWidth: number;
  args: number[];
}

/**
 * Мок 2d-контекста со снимками вызовов: по `mock.calls` прозрачность вызова не
 * восстановить, `globalAlpha` меняется между ними. Обвязка продублирована из
 * lightsCanvas.test.ts намеренно, общего тестового модуля у фазы нет.
 */
function mockContext() {
  const drawCalls: DrawSnapshot[] = [];
  const arcCalls: ArcSnapshot[] = [];
  // Смещения начала кадров: кадр открывается clearRect, по ним берётся последний.
  const frameStarts: number[] = [];
  const ctx = {
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    scale: vi.fn(),
    fillRect: vi.fn(),
    setTransform: vi.fn(),
    createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    drawImage: vi.fn(),
    globalAlpha: 1,
    fillStyle: "" as unknown,
    strokeStyle: "" as unknown,
    lineWidth: 1,
    drawCalls,
    arcCalls,
    frameStarts,
  };
  ctx.clearRect = vi.fn(() => {
    frameStarts.push(drawCalls.length);
  });
  ctx.drawImage = vi.fn((...args: unknown[]) => {
    drawCalls.push({ alpha: ctx.globalAlpha, args });
  });
  ctx.arc = vi.fn((...args: number[]) => {
    arcCalls.push({
      alpha: ctx.globalAlpha,
      strokeStyle: ctx.strokeStyle,
      lineWidth: ctx.lineWidth,
      args,
    });
  });
  return ctx;
}

type MockContext = ReturnType<typeof mockContext>;

const contexts = new Map<HTMLCanvasElement, MockContext>();

/** Свой контекст каждому холсту: спрайты рисуются в offscreen, кадр — в основном. */
function mockCanvasContexts() {
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(function (
    this: HTMLCanvasElement,
  ) {
    const existing = contexts.get(this);
    if (existing) return existing as unknown as CanvasRenderingContext2D;
    const created = mockContext();
    contexts.set(this, created);
    return created as unknown as CanvasRenderingContext2D;
  } as unknown as HTMLCanvasElement["getContext"]);
}

const realMatchMedia = window.matchMedia;

/**
 * Подмена идёт присваиванием, а не через vi.spyOn: matchMedia в setup.ts сам
 * замокан, spyOn возвращает тот же мок, и restoreAllMocks оставляет reduce
 * включённым для следующих тестов файла.
 */
function mockReducedMotion(reduce: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: reduce && query.includes("reduce"),
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

function setHidden(hidden: boolean) {
  Object.defineProperty(document, "hidden", { value: hidden, configurable: true });
}

/** Перехват кадров: колбэки копятся, id кадра равен его номеру. */
function captureFrames(): FrameRequestCallback[] {
  const frames: FrameRequestCallback[] = [];
  vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
    frames.push(callback);
    return frames.length;
  });
  return frames;
}

function canvasNode(): HTMLCanvasElement {
  const node = document.querySelector<HTMLCanvasElement>("canvas.map-lights-canvas");
  if (!node) throw new Error("canvas огоньков не отрисован");
  return node;
}

function mainContext(): MockContext {
  const ctx = contexts.get(canvasNode());
  if (!ctx) throw new Error("у canvas огоньков нет мок-контекста");
  return ctx;
}

/** Вызовы drawImage последнего кадра. */
function lastFrame(ctx: MockContext): DrawSnapshot[] {
  return ctx.drawCalls.slice(ctx.frameStarts[ctx.frameStarts.length - 1] ?? 0);
}

const isCore = (call: DrawSnapshot) => call.args[3] === CORE_SPRITE_RADIUS * 2;
const width = (call: DrawSnapshot) => call.args[3] as number;

function draws(ctx: MockContext): number {
  return ctx.frameStarts.length;
}

function renderCanvas(next: readonly LightPoint[] = points, ref?: React.Ref<LightsCanvasHandle>) {
  return render(
    <LightsCanvas
      ref={ref}
      points={next}
      transform={zoomIdentity}
      width={SIZE.width}
      height={SIZE.height}
    />,
  );
}

afterEach(() => {
  vi.restoreAllMocks();
  window.matchMedia = realMatchMedia;
  contexts.clear();
  setHidden(false);
});

describe("LightsCanvas: разметка без 2d-контекста", () => {
  it("считает огоньки в data-атрибутах и не заводит кадр", () => {
    const raf = vi.spyOn(window, "requestAnimationFrame");

    const { rerender } = renderCanvas();

    const canvas = canvasNode();
    expect(canvas).toHaveAttribute("data-anim", "pulse");
    expect(canvas).toHaveAttribute("aria-hidden", "true");
    expect(canvas).toHaveAttribute("data-light-count", "942");
    expect(canvas).toHaveAttribute("data-people", "694");
    expect(canvas).toHaveAttribute("data-groups", "248");
    expect(canvas).toHaveAttribute("data-new", "0");
    // getContext в jsdom отдаёт null: рисовать нечем, цикл не запускается.
    expect(raf).not.toHaveBeenCalled();

    rerender(
      <LightsCanvas
        points={withNew}
        transform={zoomIdentity}
        width={SIZE.width}
        height={SIZE.height}
      />,
    );

    expect(canvas).toHaveAttribute("data-light-count", "943");
    expect(canvas).toHaveAttribute("data-people", "695");
    expect(canvas).toHaveAttribute("data-groups", "248");
    expect(canvas).toHaveAttribute("data-new", "1");
    expect(raf).not.toHaveBeenCalled();
  });

  it("переживает размонтирование без контекста", () => {
    const view = renderCanvas();
    expect(() => view.unmount()).not.toThrow();
  });
});

describe("LightsCanvas: первый кадр и цикл", () => {
  it("рисует кадр сразу, а цикл заводит только в экране", () => {
    mockCanvasContexts();
    const raf = vi.spyOn(window, "requestAnimationFrame").mockImplementation(() => 1);

    renderCanvas();

    const canvas = canvasNode();
    // jsdom отдаёт devicePixelRatio 1: битмап равен логическому размеру.
    expect(canvas.width).toBe(SIZE.width);
    expect(canvas.height).toBe(SIZE.height);

    const ctx = mainContext();
    expect(ctx.setTransform).toHaveBeenCalledWith(1, 0, 0, 1, 0, 0);
    // 942 ореола плюс 942 ядра в первом же кадре, без ожидания rAF.
    expect(ctx.drawImage.mock.calls.length).toBeGreaterThanOrEqual(1884);
    expect(raf).not.toHaveBeenCalled();

    act(() => {
      enterViewport();
    });
    expect(raf).toHaveBeenCalledTimes(1);
  });

  it("пропускает кадр раньше 33 мс", () => {
    mockCanvasContexts();
    vi.spyOn(performance, "now").mockReturnValue(900);
    const frames = captureFrames();

    renderCanvas();
    act(() => {
      enterViewport();
    });

    const ctx = mainContext();
    const start = draws(ctx);

    act(() => {
      frames[0](1000);
    });
    expect(draws(ctx)).toBe(start + 1);

    act(() => {
      frames[1](1016);
    });
    expect(draws(ctx)).toBe(start + 1);

    act(() => {
      frames[2](1034);
    });
    expect(draws(ctx)).toBe(start + 2);
  });

  it("под prefers-reduced-motion рисует один статичный кадр без цикла", () => {
    mockCanvasContexts();
    mockReducedMotion(true);
    const raf = vi.spyOn(window, "requestAnimationFrame").mockImplementation(() => 1);

    renderCanvas();

    const ctx = mainContext();
    const frame = lastFrame(ctx);
    const halos = frame.filter((call) => !isCore(call));
    const cores = frame.filter(isCore);

    expect(halos).toHaveLength(942);
    expect(halos.every((call) => width(call) === REDUCED_HALO_RADIUS * 2)).toBe(true);
    expect(halos.every((call) => Math.abs(call.alpha - REDUCED_HALO_ALPHA) < 1e-9)).toBe(true);
    expect(cores).toHaveLength(942);
    expect(cores.every((call) => call.alpha === 1)).toBe(true);
    // Кольца новых огоньков под reduce не рисуются, а спрайты живут на своих холстах.
    expect(ctx.arc).not.toHaveBeenCalled();

    act(() => {
      enterViewport();
    });
    expect(raf).not.toHaveBeenCalled();
  });
});

describe("LightsCanvas: кадр жеста", () => {
  it("рисует кадр по draw(transform), размер спрайта от масштаба не зависит", () => {
    mockCanvasContexts();
    vi.spyOn(window, "requestAnimationFrame").mockImplementation(() => 1);
    const ref = createRef<LightsCanvasHandle>();

    renderCanvas(points, ref);

    const ctx = mainContext();
    act(() => {
      ref.current?.draw(new ZoomTransform(2, 10, 20));
    });

    const frame = lastFrame(ctx);
    const cores = frame.filter(isCore);
    expect(cores.length).toBeGreaterThan(0);

    const first = cores[0];
    expect(first.args[1]).toBeCloseTo(2 * points[0].x + 10 - CORE_SPRITE_RADIUS, 5);
    expect(first.args[2]).toBeCloseTo(2 * points[0].y + 20 - CORE_SPRITE_RADIUS, 5);
    expect(first.args[3]).toBeCloseTo(CORE_SPRITE_RADIUS * 2, 5);

    const halos = frame.filter((call) => !isCore(call));
    expect(halos.length).toBeGreaterThan(0);
    expect(
      halos.every(
        (call) => width(call) >= HALO_RADIUS_MIN * 2 && width(call) <= HALO_RADIUS_MAX * 2,
      ),
    ).toBe(true);
  });
});

describe("LightsCanvas: кольцо нового огонька", () => {
  it("живёт одну прокрутку и на это время держит полную частоту", () => {
    mockCanvasContexts();
    vi.spyOn(performance, "now").mockReturnValue(5000);
    const frames = captureFrames();

    const { rerender } = renderCanvas();
    const ctx = mainContext();
    expect(ctx.arc).not.toHaveBeenCalled();

    rerender(
      <LightsCanvas
        points={withNew}
        transform={zoomIdentity}
        width={SIZE.width}
        height={SIZE.height}
      />,
    );

    const ring = ctx.arcCalls[ctx.arcCalls.length - 1];
    expect(ring.args).toEqual([300, 200, RING_RADIUS_FROM, 0, TAU]);
    expect(ring.alpha).toBeCloseTo(0.5, 5);
    expect(ring.strokeStyle).toBe("rgba(158, 67, 154, 1)");
    expect(LIGHT_COLORS.person).toBe("rgb(158 67 154)");

    act(() => {
      enterViewport();
    });
    const start = draws(ctx);

    // Кольцо идёт: кадр через 10 мс рисуется, порог 33 мс на это время снят.
    act(() => {
      frames[0](5010);
    });
    expect(draws(ctx)).toBe(start + 1);

    const arcs = ctx.arcCalls.length;
    act(() => {
      frames[1](5950);
    });
    expect(draws(ctx)).toBe(start + 2);
    expect(ctx.arcCalls).toHaveLength(arcs);

    // Кольцо отыграло, порог вернулся.
    act(() => {
      frames[2](5960);
    });
    expect(draws(ctx)).toBe(start + 2);
  });
});

describe("LightsCanvas: паузы и уборка", () => {
  it("снимает кадр в скрытой вкладке и возвращает его назад", () => {
    mockCanvasContexts();
    const frames = captureFrames();
    const raf = vi.spyOn(window, "requestAnimationFrame");
    const cancel = vi.spyOn(window, "cancelAnimationFrame");

    renderCanvas();
    act(() => {
      enterViewport();
    });
    expect(frames).toHaveLength(1);

    setHidden(true);
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(cancel).toHaveBeenCalledWith(1);

    const scheduled = raf.mock.calls.length;
    setHidden(false);
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(raf.mock.calls.length).toBe(scheduled + 1);
  });

  it("на размонтировании снимает кадр и отпускает наблюдателей", () => {
    mockCanvasContexts();
    captureFrames();
    const cancel = vi.spyOn(window, "cancelAnimationFrame");
    const viewOff = vi.spyOn(IntersectionObserver.prototype, "disconnect");
    const sizeOff = vi.spyOn(ResizeObserver.prototype, "disconnect");

    const view = renderCanvas();
    act(() => {
      enterViewport();
    });

    view.unmount();

    expect(cancel).toHaveBeenCalledWith(1);
    expect(viewOff).toHaveBeenCalledTimes(1);
    expect(sizeOff).toHaveBeenCalledTimes(1);
  });
});
