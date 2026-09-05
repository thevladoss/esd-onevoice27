import { select } from "d3-selection";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ESD_IDS } from "../../data/countries";
import { generateLights } from "../../data/lights";
import { LightsProvider, useLights } from "../../state/lights";
import { EsdMap, LIGHT_CORE_RADIUS, LIGHT_HALO_RADIUS } from "./EsdMap";
import { ZoomTransform } from "d3-zoom";

import { ZOOM_MAX, ZOOM_MIN, movedAway, zoomEventFilter } from "./useMapZoom";

const SIZE = { width: 1200, height: 700 };

// Генерация 942 огоньков идёт через rejection sampling: считаем её один раз на файл.
const lights = generateLights();

function count(selector: string): number {
  return document.querySelectorAll(selector).length;
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

  it("рисует 694 огонька людей и 248 групповых с гало", () => {
    render(<EsdMap lights={lights} size={SIZE} />);
    expect(count(".light-core")).toBe(942);
    expect(count(".light-halo")).toBe(942);
    expect(count(".light--person")).toBe(694);
    expect(count(".light--group")).toBe(248);
  });

  it("пульсирует не больше сорока огоньков и всегда пульсирует новым", async () => {
    render(
      <LightsProvider initialLights={lights}>
        <AddLightHarness />
      </LightsProvider>,
    );

    const before = count(".light.pulse");
    expect(before).toBeGreaterThanOrEqual(1);
    expect(before).toBeLessThanOrEqual(40);

    await userEvent.click(screen.getByRole("button", { name: "зажечь" }));
    expect(count(".light.pulse")).toBe(before + 1);
    expect(count(".light.is-new")).toBe(1);
  });

  it("обходится без filter на огоньках", () => {
    const { container } = render(<EsdMap lights={lights} size={SIZE} />);
    expect(container.querySelectorAll("[filter]")).toHaveLength(0);

    const cores = Array.from(container.querySelectorAll<SVGCircleElement>(".light-core"));
    expect(cores).toHaveLength(942);
    expect(cores.every((core) => core.style.filter === "")).toBe(true);
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
    render(<EsdMap lights={[]} size={SIZE} />);
    expect(screen.getByText("Пока ни одного огонька")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "форму ниже" })).toHaveAttribute("href", "#light-form");
    expect(count("path.country")).toBe(177);
    expect(count(".light-core")).toBe(0);
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

  it("делит радиусы огоньков на масштаб", () => {
    const { container } = render(<EsdMap lights={lights} size={SIZE} selectedCountryId={51} />);
    const k = readScale(container);
    expect(k).toBeGreaterThan(1);

    const core = container.querySelector(".light-core");
    const halo = container.querySelector(".light-halo");
    expect(Number(core?.getAttribute("r"))).toBeCloseTo(LIGHT_CORE_RADIUS / k, 3);
    expect(Number(halo?.getAttribute("r"))).toBeCloseTo(LIGHT_HALO_RADIUS / k, 3);
  });

  it("оставляет странице вертикальный скролл одним пальцем", () => {
    const { container } = render(<EsdMap lights={lights} size={SIZE} />);
    const svg = container.querySelector("svg");
    expect(svg?.style.getPropertyValue("touch-action")).toBe("pan-y");
  });

  it("держит камеру посетителя, когда меняется размер контейнера", () => {
    const { container, rerender } = render(<EsdMap lights={lights} size={SIZE} />);
    const svg = container.querySelector("svg") as SVGSVGElement;

    fireEvent.wheel(svg, { deltaY: -240, ctrlKey: true, clientX: 600, clientY: 350 });
    const byHand = readTransform(container);
    expect(byHand).not.toBe("translate(0,0) scale(1)");

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
