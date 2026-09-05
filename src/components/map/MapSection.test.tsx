import { createEvent, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { LightsProvider } from "../../state/lights";
import { MapSection } from "./MapSection";

function renderSection() {
  return render(
    <LightsProvider>
      <MapSection />
    </LightsProvider>,
  );
}

describe("MapSection", () => {
  it("рендерит секцию #map с надзаголовком и заголовком второго уровня", () => {
    renderSection();
    const section = document.getElementById("map");
    expect(section).not.toBeNull();
    expect(section?.tagName).toBe("SECTION");
    expect(screen.getByText("Все вместе")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
      "Зажигаем свет по всему дивизиону",
    );
  });

  it("показывает счётчики дивизиона", () => {
    renderSection();
    expect(screen.getByText("ЧЕЛОВЕК")).toBeInTheDocument();
    expect(screen.getByText("ГРУПП")).toBeInTheDocument();
    expect(screen.getByText("694")).toBeInTheDocument();
  });

  it("молчит про ошибку, пока контейнер не измерен", () => {
    renderSection();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();

    for (const chip of screen.getAllByRole("button")) {
      expect(chip).not.toHaveAttribute("aria-disabled");
    }
  });

  it("держит скошенный слой внутри секции", () => {
    renderSection();
    expect(document.querySelectorAll("#map .map-section__skew")).toHaveLength(1);
  });
});

const realMatchMedia = window.matchMedia;

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

function stubSize(width: number, height: number) {
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
    width,
    height,
    x: 0,
    y: 0,
    top: 0,
    left: 0,
    right: width,
    bottom: height,
    toJSON: () => ({}),
  } as DOMRect);
}

function readTransform(): string {
  return document.querySelector("g.map-viewport")?.getAttribute("transform") ?? "";
}

function readScale(): number {
  return Number(/scale\(([\d.]+)\)/.exec(readTransform())?.[1]);
}

/**
 * Панорама мышью. d3-zoom вешает движение и отпускание на event.view, а jsdom
 * не принимает окно vitest в конструктор события: view подставляется вручную.
 */
function dragMap(dx: number): void {
  const svg = document.querySelector("svg") as SVGSVGElement;
  const target = window as unknown as Element;

  const down = createEvent.mouseDown(svg, { button: 0, clientX: 600, clientY: 350 });
  Object.defineProperty(down, "view", { value: window });
  fireEvent(svg, down);

  const move = createEvent.mouseMove(document, { clientX: 600 + dx, clientY: 350 });
  Object.defineProperty(move, "view", { value: window });
  fireEvent(target, move);

  const up = createEvent.mouseUp(document, { clientX: 600 + dx, clientY: 350 });
  Object.defineProperty(up, "view", { value: window });
  fireEvent(target, up);
}

describe("MapSection: выбор страны чипами", () => {
  beforeEach(() => {
    stubReducedMotion();
    stubSize(1200, 700);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.matchMedia = realMatchMedia;
  });

  it("рисует карту и активные чипы, когда контейнер измерен", () => {
    renderSection();

    expect(screen.getByRole("img", { name: "Карта Евро-Азиатского дивизиона" })).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();

    const chips = screen.getAllByRole("button");
    expect(chips).toHaveLength(13);
    for (const chip of chips) {
      expect(chip).not.toHaveAttribute("aria-disabled");
    }
  });

  it("подсвечивает страну и уводит к ней камеру по клику на чип", async () => {
    renderSection();

    await userEvent.click(screen.getByRole("button", { name: "Россия" }));
    expect(screen.getByRole("button", { name: "Россия" })).toHaveAttribute("aria-pressed", "true");

    const selected = document.querySelectorAll('path[data-selected="true"]');
    expect(selected).toHaveLength(1);
    expect(selected[0]).toHaveAttribute("data-country-id", "643");
    expect(readTransform()).not.toBe("translate(0,0) scale(1)");
  });

  it("приближает страну поменьше сильнее обзора дивизиона", async () => {
    renderSection();

    await userEvent.click(screen.getByRole("button", { name: "Казахстан" }));
    const k = readScale();
    expect(k).toBeGreaterThan(1);
    expect(k).toBeLessThanOrEqual(8);
    expect(document.querySelector('path[data-selected="true"]')).toHaveAttribute(
      "data-country-id",
      "398",
    );
  });

  it("возвращает обзор дивизиона по чипу «Весь дивизион»", async () => {
    renderSection();

    await userEvent.click(screen.getByRole("button", { name: "Армения" }));
    expect(readScale()).toBeGreaterThan(1);

    await userEvent.click(screen.getByRole("button", { name: "Весь дивизион" }));
    expect(readTransform()).toBe("translate(0,0) scale(1)");
    expect(screen.getByRole("button", { name: "Весь дивизион" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(document.querySelector('path[data-selected="true"]')).toBeNull();
  });

  it("снимает выбор страны, когда посетитель утаскивает карту", async () => {
    renderSection();

    await userEvent.click(screen.getByRole("button", { name: "Казахстан" }));
    const framed = readTransform();

    dragMap(-300);

    expect(screen.getByRole("button", { name: "Казахстан" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    // Камера остаётся там, куда её увёл посетитель: обзор дивизиона обратно не возвращается.
    expect(readTransform()).not.toBe(framed);
    expect(readTransform()).not.toBe("translate(0,0) scale(1)");
  });

  it("возвращает камеру к стране повторным кликом по активному чипу", async () => {
    renderSection();

    await userEvent.click(screen.getByRole("button", { name: "Армения" }));
    const framed = readTransform();

    // Сдвиг меньше порога: чип остаётся активным, а вид уже другой.
    dragMap(30);
    expect(screen.getByRole("button", { name: "Армения" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(readTransform()).not.toBe(framed);

    await userEvent.click(screen.getByRole("button", { name: "Армения" }));
    expect(readTransform()).toBe(framed);
  });

  it("держит подсказку о жестах внутри сцены карты", () => {
    renderSection();
    expect(document.querySelectorAll(".map-stage .map-hint")).toHaveLength(1);
  });
});

describe("MapSection: карта не отрисовалась", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("гасит чипы вместе с картой", () => {
    // Бесконечный размер уводит fitExtent в NaN: проекция считается сломанной.
    stubSize(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY);
    renderSection();

    expect(screen.getByRole("status")).toBeInTheDocument();
    const chips = screen.getAllByRole("button");
    expect(chips).toHaveLength(13);
    for (const chip of chips) {
      expect(chip).toHaveAttribute("aria-disabled", "true");
    }
  });
});
