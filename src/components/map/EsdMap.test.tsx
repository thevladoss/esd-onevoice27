import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { select } from "d3-selection";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ESD_IDS } from "../../data/countries";
import { generateLights } from "../../data/lights";
import { makeProjection } from "../../lib/geo";
import { LightsProvider, useLights } from "../../state/lights";
import { EsdMap } from "./EsdMap";
import { CORE_SPRITE_RADIUS, HALO_RADIUS_MAX, HALO_RADIUS_MIN } from "./lightsCanvas";
import { ZoomTransform } from "d3-zoom";

import {
  ZOOM_MAX,
  ZOOM_MIN,
  ZOOM_PAD,
  constrainTransform,
  movedAway,
  zoomEventFilter,
} from "./useMapZoom";

const SIZE = { width: 1200, height: 700 };

// Генерация 942 огоньков идёт через rejection sampling: считаем её один раз на файл.
const lights = generateLights();

function count(selector: string): number {
  return document.querySelectorAll(selector).length;
}

interface DrawSnapshot {
  alpha: number;
  args: unknown[];
}

/**
 * Мок 2d-контекста со снимками drawImage: по `mock.calls` прозрачность вызова не
 * восстановить, `globalAlpha` меняется между ними. Обвязка продублирована из
 * LightsCanvas.test.tsx намеренно, общего тестового модуля у фазы нет.
 */
function mockContext() {
  const drawCalls: DrawSnapshot[] = [];
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
    frameStarts,
  };
  ctx.clearRect = vi.fn(() => {
    frameStarts.push(drawCalls.length);
  });
  ctx.drawImage = vi.fn((...args: unknown[]) => {
    drawCalls.push({ alpha: ctx.globalAlpha, args });
  });
  return ctx;
}

type MockContext = ReturnType<typeof mockContext>;

const contexts = new Map<HTMLCanvasElement, MockContext>();

/** Свой контекст каждому холсту: в одном документе живут две карты и их спрайты. */
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

function canvasOf(container: HTMLElement): HTMLCanvasElement {
  const node = container.querySelector<HTMLCanvasElement>("canvas.map-lights-canvas");
  if (!node) throw new Error("canvas огоньков не отрисован");
  return node;
}

function contextOf(container: HTMLElement): MockContext {
  const ctx = contexts.get(canvasOf(container));
  if (!ctx) throw new Error("у canvas огоньков нет мок-контекста");
  return ctx;
}

const isCore = (call: DrawSnapshot) => call.args[3] === CORE_SPRITE_RADIUS * 2;
const spriteWidth = (call: DrawSnapshot) => call.args[3] as number;

/** Вызовы последнего кадра. */
function lastFrame(ctx: MockContext): DrawSnapshot[] {
  return ctx.drawCalls.slice(ctx.frameStarts[ctx.frameStarts.length - 1] ?? 0);
}

/** Экранные координаты ядер: по ним видно, как проекция легла в контейнер. */
function lightXs(container: HTMLElement): number[] {
  return lastFrame(contextOf(container))
    .filter(isCore)
    .map((call) => (call.args[1] as number) + (call.args[3] as number) / 2);
}

afterEach(() => {
  vi.restoreAllMocks();
  contexts.clear();
});

function span(xs: number[]): number {
  return Math.max(...xs) - Math.min(...xs);
}

function center(xs: number[]): number {
  return (Math.max(...xs) + Math.min(...xs)) / 2;
}

function AddLightHarness() {
  const { lights: current, addLight } = useLights();
  return (
    <>
      <button type="button" onClick={() => addLight({ type: "person", countryId: 643 })}>
        зажечь
      </button>
      <EsdMap lights={current} size={SIZE} />
    </>
  );
}

describe("EsdMap", () => {
  it("даёт карте роль изображения с названием дивизиона", () => {
    render(<EsdMap lights={lights} size={SIZE} />);
    expect(screen.getByRole("img", { name: "Карта Евро-Азиатского дивизиона" })).toBeInTheDocument();
  });

  it("рисует 177 стран и помечает 12 стран ЕАД", () => {
    render(<EsdMap lights={lights} size={SIZE} />);
    expect(count("path.country")).toBe(177);

    const esd = Array.from(document.querySelectorAll<SVGPathElement>('path[data-esd="true"]'));
    expect(esd).toHaveLength(12);
    const ids = new Set(esd.map((node) => Number(node.getAttribute("data-country-id"))));
    expect(ids).toEqual(new Set(ESD_IDS));
    for (const node of esd) {
      expect(node.getAttribute("d")).not.toBe("");
    }
  });

  it("рисует огоньки на canvas поверх SVG и считает их в атрибутах", () => {
    const { container } = render(<EsdMap lights={lights} size={SIZE} />);

    const canvas = canvasOf(container);
    expect(canvas.parentElement).toHaveClass("esd-map");
    expect(canvas.previousElementSibling?.tagName.toLowerCase()).toBe("svg");
    expect(canvas).toHaveAttribute("data-anim", "pulse");
    expect(canvas).toHaveAttribute("aria-hidden", "true");
    expect(canvas).toHaveAttribute("data-light-count", "942");
    expect(canvas).toHaveAttribute("data-people", "694");
    expect(canvas).toHaveAttribute("data-groups", "248");
    expect(canvas).toHaveAttribute("data-new", "0");

    // В SVG остались только страны: 1884 круга и градиенты уехали на холст.
    expect(count("circle")).toBe(0);
    expect(count(".map-lights")).toBe(0);
    expect(count("defs")).toBe(0);
    expect(count("radialGradient")).toBe(0);
    expect(count(".light-core")).toBe(0);
    expect(count(".light-bucket")).toBe(0);
  });

  it("после зажигания нового огонька обновляет атрибуты и не трогает rAF", async () => {
    const raf = vi.spyOn(window, "requestAnimationFrame");
    const { container } = render(
      <LightsProvider initialLights={lights}>
        <AddLightHarness />
      </LightsProvider>,
    );

    const canvas = canvasOf(container);
    expect(canvas).toHaveAttribute("data-light-count", "942");

    await userEvent.click(screen.getByRole("button", { name: "зажечь" }));

    expect(canvas).toHaveAttribute("data-light-count", "943");
    expect(canvas).toHaveAttribute("data-people", "695");
    expect(canvas).toHaveAttribute("data-groups", "248");
    expect(canvas).toHaveAttribute("data-new", "1");
    // Кольцо нового огонька рисует холст: узла с ним в DOM больше нет.
    expect(count('[data-anim="new-light"]')).toBe(0);
    // getContext в jsdom отдаёт null: цикл кадров не запускается.
    expect(raf).not.toHaveBeenCalled();
  });

  it("держит data-anim только на canvas огоньков", async () => {
    const { container } = render(
      <LightsProvider initialLights={lights}>
        <AddLightHarness />
      </LightsProvider>,
    );

    // Весь декоративный слой карты — один узел: под reduce гаснет одна запись
    // реестра вместо пяти корзин и кольца.
    const map = container.querySelector(".esd-map") as HTMLElement;
    expect(count('[data-anim="pulse"]')).toBe(1);
    expect(document.querySelector('[data-anim="pulse"]')).toBe(canvasOf(container));
    expect(map.querySelectorAll("[data-anim]")).toHaveLength(1);

    await userEvent.click(screen.getByRole("button", { name: "зажечь" }));
    expect(count('[data-anim="pulse"]')).toBe(1);
    expect(map.querySelectorAll("[data-anim]")).toHaveLength(1);
  });

  it("обходится без filter и без кругов SVG", () => {
    const { container } = render(<EsdMap lights={lights} size={SIZE} />);
    expect(container.querySelectorAll("[filter]")).toHaveLength(0);
    expect(container.querySelectorAll("svg circle")).toHaveLength(0);
    expect(container.querySelectorAll("svg path.country")).toHaveLength(177);
  });

  it("описывает карту скрытым абзацем с числами огоньков", () => {
    render(<EsdMap lights={lights} size={SIZE} />);
    const description = screen.getByText(/694 огоньков людей и 248 групповых маяков/);
    expect(description).toHaveClass("sr-only");

    const svg = screen.getByRole("img", { name: "Карта Евро-Азиатского дивизиона" });
    expect(svg.getAttribute("aria-describedby")).toBe(description.id);
    expect(description.id).not.toBe("");
  });

  it("зовёт зажечь первый свет, когда огоньков нет", () => {
    const { container } = render(<EsdMap lights={[]} size={SIZE} />);
    expect(screen.getByText("Пока ни одного огонька")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "форму ниже" })).toHaveAttribute("href", "#light-form");
    expect(count("path.country")).toBe(177);
    expect(canvasOf(container)).toHaveAttribute("data-light-count", "0");
  });

  it("молчит про ошибку, пока контейнер не измерен", () => {
    const onError = vi.fn();
    const { container } = render(
      <EsdMap lights={lights} size={{ width: 0, height: 0 }} onError={onError} />,
    );

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(container.querySelector("svg")).toBeNull();
    expect(onError).toHaveBeenCalledWith(false);
    expect(onError).not.toHaveBeenCalledWith(true);
  });

  it("показывает ошибку, когда проекция вернула не-число", () => {
    const onError = vi.fn();
    // Бесконечный контейнер уводит fitExtent в NaN: это и есть сломанная проекция.
    const broken = { width: Number.POSITIVE_INFINITY, height: Number.POSITIVE_INFINITY };
    const { container } = render(<EsdMap lights={lights} size={broken} onError={onError} />);

    expect(screen.getByRole("status")).toHaveTextContent(
      "Карта не загрузилась. Обновите страницу, чтобы попробовать снова.",
    );
    expect(container.querySelector("svg")).toBeNull();
    expect(onError).toHaveBeenCalledWith(true);
  });

  it("считает проекцию по фактической ширине контейнера", () => {
    // Контейнер карты идёт во всю ширину окна и шире колонки 72rem: вьюбокс
    // повторяет его размер, а дивизион остаётся по центру.
    mockCanvasContexts();
    vi.spyOn(window, "requestAnimationFrame").mockImplementation(() => 1);

    const narrow = render(<EsdMap lights={lights} size={{ width: 1200, height: 700 }} />);
    const wide = render(<EsdMap lights={lights} size={{ width: 1920, height: 700 }} />);

    expect(wide.container.querySelector("svg")?.getAttribute("viewBox")).toBe("0 0 1920 700");

    const narrowXs = lightXs(narrow.container);
    const wideXs = lightXs(wide.container);
    // Масштаб упирается в высоту контейнера, поэтому дивизион не растягивается
    // по ширине, а вся картинка сдвигается к новому центру.
    expect(span(wideXs)).toBeCloseTo(span(narrowXs), 6);
    expect(center(wideXs) - center(narrowXs)).toBeCloseTo(360, 6);
  });

  it("подсвечивает выбранную страну", () => {
    render(<EsdMap lights={lights} size={SIZE} selectedCountryId={643} />);
    const selected = Array.from(document.querySelectorAll<SVGPathElement>('path[data-selected="true"]'));
    expect(selected).toHaveLength(1);
    expect(selected[0]).toHaveAttribute("data-country-id", "643");
    expect(selected[0]).toHaveClass("country--selected");
  });
});

const realMatchMedia = window.matchMedia;

/** Полёт камеры при reduced motion применяется мгновенно: тесту не нужны кадры rAF. */
function stubReducedMotion() {
  window.matchMedia = vi.fn((query: string) => ({
    matches: query.includes("prefers-reduced-motion"),
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

function readTransform(container: HTMLElement): string {
  return container.querySelector("g.map-viewport")?.getAttribute("transform") ?? "";
}

function readScale(container: HTMLElement): number {
  return Number(/scale\(([\d.]+)\)/.exec(readTransform(container))?.[1]);
}

function fakeEvent(event: Record<string, unknown>): Event {
  return event as unknown as Event;
}

describe("зум карты", () => {
  beforeEach(stubReducedMotion);
  afterEach(() => {
    window.matchMedia = realMatchMedia;
  });

  it("держит вьюпорт в исходном положении, пока страна не выбрана", () => {
    const { container } = render(<EsdMap lights={lights} size={SIZE} selectedCountryId={null} />);
    expect(readTransform(container)).toBe("translate(0,0) scale(1)");
  });

  it("приближает выбранную страну в пределах масштаба", () => {
    const { container, rerender } = render(
      <EsdMap lights={lights} size={SIZE} selectedCountryId={643} />,
    );
    // Россия занимает почти весь вьюбокс: её собственный масштаб упирается в нижний предел.
    const russia = readScale(container);
    expect(russia).toBe(ZOOM_MIN);
    expect(readTransform(container)).not.toBe("translate(0,0) scale(1)");

    rerender(<EsdMap lights={lights} size={SIZE} selectedCountryId={398} />);
    const kazakhstan = readScale(container);
    expect(kazakhstan).toBeGreaterThan(russia);
    expect(kazakhstan).toBeLessThanOrEqual(ZOOM_MAX);

    rerender(<EsdMap lights={lights} size={SIZE} selectedCountryId={51} />);
    expect(readScale(container)).toBeGreaterThan(kazakhstan);
    expect(readScale(container)).toBe(ZOOM_MAX);
  });

  it("рисует огоньки в кадре жеста по новому трансформу, размер спрайта от масштаба не зависит", () => {
    mockCanvasContexts();
    vi.spyOn(window, "requestAnimationFrame").mockImplementation(() => 1);

    const { container } = render(<EsdMap lights={lights} size={SIZE} />);
    const ctx = contextOf(container);
    const drawnBefore = ctx.drawCalls.length;

    const svg = container.querySelector("svg") as SVGSVGElement;
    fireEvent.wheel(svg, { deltaY: -240, ctrlKey: true, clientX: 600, clientY: 350 });

    // Кадр нарисован синхронно внутри события колеса, до любого rAF.
    const frame = ctx.drawCalls.slice(drawnBefore);
    expect(frame.length).toBeGreaterThan(0);

    const moved = /translate\(([-\d.e]+),([-\d.e]+)\) scale\(([-\d.e]+)\)/.exec(
      readTransform(container),
    );
    expect(moved).not.toBeNull();
    const [tx, ty, k] = [Number(moved?.[1]), Number(moved?.[2]), Number(moved?.[3])];
    expect(k).toBe(8);

    // Опорный огонёк берётся тот же, что рисует карта: проекция из lib/geo,
    // позиция на экране — k·x + tx, как её считает transform.apply.
    const projection = makeProjection(SIZE.width, SIZE.height);
    const probe = lights
      .map((light) => projection([light.lon, light.lat]))
      .find((xy): xy is [number, number] => {
        if (!xy || !Number.isFinite(xy[0]) || !Number.isFinite(xy[1])) return false;
        const sx = k * xy[0] + tx;
        const sy = k * xy[1] + ty;
        return sx > 20 && sx < SIZE.width - 20 && sy > 20 && sy < SIZE.height - 20;
      });
    expect(probe).toBeDefined();

    const cores = frame.filter(isCore);
    const core = cores.find(
      (call) => Math.abs((call.args[1] as number) - (k * (probe?.[0] ?? 0) + tx - CORE_SPRITE_RADIUS)) < 1e-6,
    );
    expect(core).toBeDefined();
    expect(core?.args[2]).toBeCloseTo(k * (probe?.[1] ?? 0) + ty - CORE_SPRITE_RADIUS, 3);
    expect(core?.args[3]).toBeCloseTo(CORE_SPRITE_RADIUS * 2, 3);

    // Ореолы держат экранный размер дыхания при любом масштабе карты.
    const halos = frame.filter((call) => !isCore(call));
    expect(halos.length).toBeGreaterThan(0);
    expect(
      halos.every(
        (call) =>
          spriteWidth(call) >= HALO_RADIUS_MIN * 2 && spriteWidth(call) <= HALO_RADIUS_MAX * 2,
      ),
    ).toBe(true);
  });

  it("на кадре жеста двигает только вьюпорт, а огоньки не пересобирает", () => {
    const { container } = render(<EsdMap lights={lights} size={SIZE} />);
    const svg = container.querySelector("svg") as SVGSVGElement;
    const canvas = canvasOf(container);

    fireEvent.wheel(svg, { deltaY: -240, ctrlKey: true, clientX: 600, clientY: 350 });

    const viewport = container.querySelector("g.map-viewport") as SVGGElement;
    expect(viewport.getAttribute("transform")).toContain("scale(8)");
    // Переменных масштаба на вьюпорте больше нет: размер огоньков считает холст.
    expect(viewport.getAttribute("style")).toBeNull();
    // Холст остаётся тем же узлом, счётчики не пересобираются.
    expect(canvasOf(container)).toBe(canvas);
    expect(canvas).toHaveAttribute("data-light-count", "942");
  });

  it("оставляет странице вертикальный скролл одним пальцем", () => {
    const { container } = render(<EsdMap lights={lights} size={SIZE} />);
    const svg = container.querySelector("svg");
    expect(svg?.style.getPropertyValue("touch-action")).toBe("pan-y");
  });

  it("не улетает в NaN на стране вне дивизиона", () => {
    // 840 это США: диплинк или параметр хеша могут привести любой номер страны.
    const { container } = render(<EsdMap lights={lights} size={SIZE} selectedCountryId={840} />);

    expect(readTransform(container)).toBe("translate(0,0) scale(1)");
    expect(readTransform(container)).not.toContain("NaN");
    // Карта остаётся на месте: полёт в пустые границы стирал её целиком.
    expect(container.querySelectorAll("path.country")).toHaveLength(177);
  });

  it("держит камеру посетителя, когда меняется размер контейнера", () => {
    const { container, rerender } = render(<EsdMap lights={lights} size={SIZE} />);
    const svg = container.querySelector("svg") as SVGSVGElement;

    fireEvent.wheel(svg, { deltaY: -240, ctrlKey: true, clientX: 600, clientY: 350 });
    const byHand = readTransform(container);
    expect(byHand).not.toBe("translate(0,0) scale(1)");

    // Карта идёт во всю ширину окна, поэтому ресайз меняет ширину заметно.
    rerender(<EsdMap lights={lights} size={{ width: 1920, height: 520 }} />);
    expect(readTransform(container)).toBe(byHand);

    rerender(<EsdMap lights={lights} size={{ width: 900, height: 520 }} />);
    expect(readTransform(container)).toBe(byHand);
  });

  it("не сбрасывает выбор во время программного полёта", () => {
    const onUserZoomAway = vi.fn();
    const { rerender } = render(
      <EsdMap
        lights={lights}
        size={SIZE}
        selectedCountryId={643}
        onUserZoomAway={onUserZoomAway}
      />,
    );

    rerender(
      <EsdMap lights={lights} size={SIZE} selectedCountryId={51} onUserZoomAway={onUserZoomAway} />,
    );
    expect(onUserZoomAway).not.toHaveBeenCalled();
  });

  it("вешает обработчики зума и переживает повторное монтирование", () => {
    const first = render(<EsdMap lights={lights} size={SIZE} />);
    const svg = first.container.querySelector("svg") as SVGSVGElement;
    expect(typeof select(svg).on("wheel.zoom")).toBe("function");
    expect(typeof select(svg).on("mousedown.zoom")).toBe("function");

    first.unmount();
    expect(select(svg).on("wheel.zoom")).toBeUndefined();
    expect(() => render(<EsdMap lights={lights} size={SIZE} />)).not.toThrow();
  });

  it("держит программный полёт в разрешённой области", () => {
    const extent: [[number, number], [number, number]] = [
      [0, 0],
      [SIZE.width, SIZE.height],
    ];
    const translateExtent: [[number, number], [number, number]] = [
      [-ZOOM_PAD, -ZOOM_PAD],
      [SIZE.width + ZOOM_PAD, SIZE.height + ZOOM_PAD],
    ];

    // Внутри границ трансформ остаётся как есть.
    const inside = new ZoomTransform(2, -100, -80);
    const kept = constrainTransform(inside, extent, translateExtent);
    expect([kept.k, kept.x, kept.y]).toEqual([inside.k, inside.x, inside.y]);

    // Камера за левым краем возвращается ровно на границу запаса.
    const outside = new ZoomTransform(1, 500, 0);
    const pulled = constrainTransform(outside, extent, translateExtent);
    expect(pulled.k).toBe(1);
    expect(pulled.invertX(0)).toBe(-ZOOM_PAD);
  });

  it("считает уходом камеры и масштаб, и сдвиг", () => {
    const { width, height } = SIZE;
    const base = new ZoomTransform(4, 100, 100);

    /** Масштаб вокруг центра вьюбокса: точка в центре остаётся на месте. */
    function zoomAtCenter(k: number): ZoomTransform {
      return new ZoomTransform(
        k,
        width / 2 - (k * (width / 2 - base.x)) / base.k,
        height / 2 - (k * (height / 2 - base.y)) / base.k,
      );
    }

    expect(movedAway(base, base, width, height)).toBe(false);
    // Мелкий сдвиг и мелкий доворот масштаба выбор не снимают.
    expect(movedAway(base, new ZoomTransform(4, 130, 100), width, height)).toBe(false);
    expect(movedAway(base, zoomAtCenter(4.4), width, height)).toBe(false);
    // Панорама идёт с тем же k: по одному масштабу такой уход не виден.
    expect(movedAway(base, new ZoomTransform(4, 400, 100), width, height)).toBe(true);
    expect(movedAway(base, new ZoomTransform(4, 100, 400), width, height)).toBe(true);
    expect(movedAway(base, zoomAtCenter(6), width, height)).toBe(true);
  });

  it("пропускает колесо только с Ctrl или ⌘, а touch только двумя пальцами", () => {
    expect(zoomEventFilter(fakeEvent({ type: "wheel", ctrlKey: false, metaKey: false }))).toBe(false);
    expect(zoomEventFilter(fakeEvent({ type: "wheel", ctrlKey: true, metaKey: false }))).toBe(true);
    expect(zoomEventFilter(fakeEvent({ type: "wheel", ctrlKey: false, metaKey: true }))).toBe(true);
    expect(zoomEventFilter(fakeEvent({ type: "touchstart", touches: { length: 1 } }))).toBe(false);
    expect(zoomEventFilter(fakeEvent({ type: "touchmove", touches: { length: 2 } }))).toBe(true);
    expect(zoomEventFilter(fakeEvent({ type: "mousedown", button: 0 }))).toBe(true);
    expect(zoomEventFilter(fakeEvent({ type: "mousedown", button: 2 }))).toBe(false);
    // На macOS ctrl+click приходит как mousedown с button 0 и открывает контекстное меню.
    expect(zoomEventFilter(fakeEvent({ type: "mousedown", button: 0, ctrlKey: true }))).toBe(false);
  });
});

/*
 * Правила огоньков из файла ушли вместе с кругами SVG: дыхание и кольцо считает
 * lightsCanvas.ts. По тексту файла проверяется то, что осталось, — тем же
 * способом, что и политика движения в src/styles/motionPolicy.test.ts, потому
 * что vitest с css: false вычисленных стилей не даёт.
 */
const MAP_CSS = readFileSync(resolve(process.cwd(), "src/components/map/map.css"), "utf8");

describe("map.css: canvas огоньков", () => {
  it("кладёт холст поверх SVG и не даёт ему ловить жесты", () => {
    const block = /\.map-lights-canvas \{([\s\S]*?)\}/.exec(MAP_CSS)?.[1] ?? "";
    expect(block).toContain("position: absolute;");
    expect(block).toContain("inset: 0;");
    expect(block).toContain("width: 100%;");
    expect(block).toContain("height: 100%;");
    expect(block).toContain("pointer-events: none;");
  });

  it("не держит ни одного правила огоньков SVG", () => {
    for (const rule of [
      "@property --halo-k",
      "light-breathe",
      "light-arrive",
      "light-pulse",
      ".light-core",
      ".light-halo",
      ".light-bucket",
      ".light-ring",
      "--light-person",
      "--light-group",
      "--zoom-k",
    ]) {
      expect(MAP_CSS).not.toContain(rule);
    }
  });

  it("держит акценты счётчиков литералами", () => {
    expect(MAP_CSS).toContain("--counter-accent: rgb(210 142 190);");
    expect(MAP_CSS).toContain("--counter-accent: rgb(123 194 199);");
  });

  it("отдаёт гашение под reduce глобальному файлу", () => {
    // Единственный медиазапрос бережного движения живёт в global.css; цикл кадров
    // холста снимает сам компонент по matchMedia.
    expect(MAP_CSS).not.toContain("prefers-reduced-motion");
  });
});

describe("map.css: полотно карты", () => {
  it("красит оболочку карты почти чёрным под тем же скосом", () => {
    // Вода у оригинала — rgb(5 4 15); прозрачный SVG показывал бы вместо неё
    // подложку ленты, и нижняя кромка скоса терялась бы вне суши.
    const block = /\.map-shell \{([\s\S]*?)\}/.exec(MAP_CSS)?.[1] ?? "";
    expect(block).toContain("background: rgb(5 4 15);");
    expect(block).toContain("clip-path: polygon(");
  });
});
