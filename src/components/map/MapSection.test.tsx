import { render, screen } from "@testing-library/react";
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
