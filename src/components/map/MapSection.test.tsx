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

  it("называет секцию её заголовком через aria-labelledby", () => {
    renderSection();
    const section = document.getElementById("map");
    expect(section).toHaveAttribute("aria-labelledby", "map-title");
    expect(screen.getByRole("heading", { level: 2 })).toHaveAttribute("id", "map-title");
    expect(screen.getByRole("region", { name: "Зажигаем свет по всему дивизиону" })).toBe(section);
  });

  it("показывает счётчики дивизиона", () => {
    renderSection();
    expect(screen.getByText("ЧЕЛОВЕК")).toBeInTheDocument();
    expect(screen.getByText("ГРУПП")).toBeInTheDocument();
    expect(screen.getByText("Людей: 694")).toBeInTheDocument();
  });

  it("молчит про ошибку, пока контейнер не измерен", () => {
    renderSection();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();

    for (const chip of screen.getAllByRole("button")) {
      expect(chip).not.toHaveAttribute("aria-disabled");
    }
  });

  it("не несёт собственной подложки: скос рисует лента", () => {
    renderSection();
    // Подложка переехала на `.map-band`: две непрозрачные секции давали вторую
    // прямую линию на стыке карты и формы.
    expect(document.querySelectorAll("#map .map-section__skew")).toHaveLength(0);
  });

  it("рисует контейнер карты прямым ребёнком .map-shell без inline-стилей", () => {
    renderSection();
    const shell = document.querySelector(".map-shell") as HTMLElement;

    expect(shell.children).toHaveLength(1);
    expect(shell.firstElementChild).toHaveClass("map-container");
    // Обёртка появления ставила контейнеру opacity 0, и огоньки пропадали при прокрутке.
    expect(shell.firstElementChild?.getAttribute("style")).toBeNull();
  });

  it("выносит карту из колонки 72rem, а чипы и счётчики оставляет в ней", () => {
    renderSection();
    const section = document.getElementById("map") as HTMLElement;
    const inner = section.querySelector(".map-section__inner") as HTMLElement;
    const shell = section.querySelector(".map-shell") as HTMLElement;

    expect(shell).not.toBeNull();
    // Карта идёт во всю ширину окна, поэтому она вне колонки заголовка и чипов.
    expect(inner.contains(shell)).toBe(false);
    expect(shell.querySelector(".map-container")).not.toBeNull();
    expect(inner.querySelector(".chips")).not.toBeNull();
    expect(section.querySelectorAll(".map-stage__panel .counters")).toHaveLength(1);
  });

  it("держит оба ореола границ декоративными узлами секции", () => {
    renderSection();
    const orbs = Array.from(document.querySelectorAll("#map > .map-orb"));

    expect(orbs).toHaveLength(2);
    for (const orb of orbs) {
      expect(orb).toHaveAttribute("aria-hidden", "true");
      expect(orb.children).toHaveLength(0);
    }
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
