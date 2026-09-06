import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { select } from "d3-selection";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ESD_IDS } from "../../data/countries";
import { generateLights } from "../../data/lights";
import { LightsProvider, useLights } from "../../state/lights";
import { EsdMap, LIGHT_BUCKETS, LIGHT_CORE_RADIUS, LIGHT_HALO_RADIUS } from "./EsdMap";
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

/** Сколько ореолов лежит в каждой из пяти корзин, по порядку data-bucket. */
function haloPerBucket(): number[] {
  return Array.from(document.querySelectorAll(".light-bucket")).map(
    (bucket) => bucket.querySelectorAll(".light-halo").length,
  );
}

/** Экранные координаты огоньков: по ним видно, как проекция легла в контейнер. */
function lightXs(container: HTMLElement): number[] {
  return Array.from(container.querySelectorAll<SVGCircleElement>(".light-core")).map((core) =>
    Number(core.getAttribute("cx")),
  );
}

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

  it("рисует 694 огонька людей и 248 групповых с гало", () => {
    render(<EsdMap lights={lights} size={SIZE} />);
    expect(count(".light-core")).toBe(942);
    expect(count(".light-halo")).toBe(942);
    expect(count(".light--person")).toBe(694);
    expect(count(".light--group")).toBe(248);
  });

  it("раскладывает ореолы по пяти фазовым корзинам", async () => {
    render(
      <LightsProvider initialLights={lights}>
        <AddLightHarness />
      </LightsProvider>,
    );

    expect(count(".light-bucket")).toBe(LIGHT_BUCKETS);
    expect(count(".light-bucket")).toBe(5);
    expect(
      Array.from(document.querySelectorAll(".light-bucket")).map((bucket) =>
        bucket.getAttribute("data-bucket"),
      ),
    ).toEqual(["0", "1", "2", "3", "4"]);
    expect(count('.light-bucket[data-anim="pulse"]')).toBe(5);

    // 942 = 5 × 188 + 2: первые две корзины получают по огоньку сверх ровной доли.
    const perBucket = haloPerBucket();
    expect(perBucket).toEqual([189, 189, 188, 188, 188]);
    expect(perBucket.reduce((sum, value) => sum + value, 0)).toBe(942);
    expect(count(".light-cores .light-core")).toBe(942);
    // Старой пульсации каждого двадцать четвёртого огонька больше нет.
    expect(count(".light.pulse")).toBe(0);

    await userEvent.click(screen.getByRole("button", { name: "зажечь" }));
    expect(count(".light-halo")).toBe(943);
    expect(count(".light.is-new")).toBe(1);
    expect(count('.light.is-new .light-ring[data-anim="new-light"]')).toBe(1);
    // 942 % 5 = 2: новый огонёк попадает в третью корзину.
    expect(haloPerBucket()).toEqual([189, 189, 189, 188, 188]);
  });

  it("держит data-anim только на корзинах и кольце нового огонька", async () => {
    render(
      <LightsProvider initialLights={lights}>
        <AddLightHarness />
      </LightsProvider>,
    );

    // Атрибут стоит на корзине, а не на каждом круге внутри неё: под reduce
    // гаснут пять анимаций вместо 942.
    expect(count('[data-anim="pulse"]')).toBe(5);
    expect(count('g.light-bucket[data-anim="pulse"]')).toBe(5);
    expect(count('circle[data-anim="pulse"]')).toBe(0);
    expect(count(".light[data-anim]")).toBe(0);

    await userEvent.click(screen.getByRole("button", { name: "зажечь" }));
    expect(count('.light.is-new circle[data-anim="new-light"]')).toBe(1);
  });

  it("красит ореол радиальным градиентом типа, ядро оставляет на currentColor", () => {
    const { container } = render(<EsdMap lights={lights} size={SIZE} />);

    for (const id of ["light-halo-person", "light-halo-group"]) {
      const gradient = container.querySelector(`radialGradient#${id}`);
      expect(gradient).not.toBeNull();
      const stops = Array.from(gradient?.querySelectorAll("stop") ?? []);
      expect(stops.map((stop) => stop.getAttribute("stop-opacity"))).toEqual(["0.9", "0"]);
      expect(stops.every((stop) => stop.getAttribute("stop-color") === "currentColor")).toBe(true);
    }

    const halos = Array.from(container.querySelectorAll(".light-halo"));
    expect(halos.every((halo) => halo.closest(".light-bucket") !== null)).toBe(true);
    const fills = halos.map((halo) => halo.getAttribute("fill"));
    expect(fills.filter((fill) => fill === "url(#light-halo-person)")).toHaveLength(694);
    expect(fills.filter((fill) => fill === "url(#light-halo-group)")).toHaveLength(248);

    // Ядро цвета не знает: его задаёт класс типа на родительской группе.
    const cores = Array.from(container.querySelectorAll(".light-core"));
    expect(cores.every((core) => !core.hasAttribute("fill"))).toBe(true);
    expect(count(".light--person")).toBe(694);
    expect(count(".light--group")).toBe(248);
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

  it("считает проекцию по фактической ширине контейнера", () => {
    // Контейнер карты идёт во всю ширину окна и шире колонки 72rem: вьюбокс
    // повторяет его размер, а дивизион остаётся по центру.
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

  it("делит радиусы огоньков на масштаб", () => {
    const { container } = render(<EsdMap lights={lights} size={SIZE} selectedCountryId={51} />);
    const k = readScale(container);
    expect(k).toBeGreaterThan(1);

    const core = container.querySelector(".light-core");
    const halo = container.querySelector(".light-halo");
    expect(Number(core?.getAttribute("r"))).toBeCloseTo(LIGHT_CORE_RADIUS / k, 3);
    expect(Number(halo?.getAttribute("r"))).toBeCloseTo(LIGHT_HALO_RADIUS / k, 3);
  });

  it("на кадре жеста двигает только вьюпорт, а огоньки не пересобирает", () => {
    const { container } = render(<EsdMap lights={lights} size={SIZE} />);
    const svg = container.querySelector("svg") as SVGSVGElement;
    const core = container.querySelector(".light-core") as SVGCircleElement;
    const radiusBefore = core.getAttribute("r");

    fireEvent.wheel(svg, { deltaY: -240, ctrlKey: true, clientX: 600, clientY: 350 });

    const viewport = container.querySelector("g.map-viewport") as SVGGElement;
    expect(viewport.getAttribute("transform")).toContain("scale(8)");
    expect(viewport.style.getPropertyValue("--zoom-k")).toBe("8");
    // Атрибут r у 942 кругов на кадрах жеста не переписывается: радиус считает CSS.
    expect(core.getAttribute("r")).toBe(radiusBefore);
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
 * Дыхание живёт в CSS целиком: jsdom анимаций не считает и `r` из calc не
 * разрешает, поэтому правила проверяются по тексту файла — тем же способом,
 * что и политика движения в src/styles/motionPolicy.test.ts.
 */
const MAP_CSS = readFileSync(resolve(process.cwd(), "src/components/map/map.css"), "utf8");

describe("map.css: дыхание огоньков", () => {
  it("регистрирует множитель радиуса как число", () => {
    expect(MAP_CSS.match(/@property --halo-k \{/g)).toHaveLength(1);
    const block = /@property --halo-k \{([\s\S]*?)\}/.exec(MAP_CSS)?.[1] ?? "";
    expect(block).toContain('syntax: "<number>";');
    expect(block).toContain("inherits: true;");
    expect(block).toContain("initial-value: 1;");
  });

  it("дышит радиусом и прозрачностью в одном кейфрейме", () => {
    // Радиус 6px → 12px и opacity корзины .30 → .60 за период 2.6s.
    expect(MAP_CSS).toMatch(
      /@keyframes light-breathe \{[\s\S]*?--halo-k: 1;\s*opacity: \.3;[\s\S]*?--halo-k: 2;\s*opacity: \.6;/,
    );
  });

  it("сдвигает фазу корзин отрицательной задержкой", () => {
    expect(MAP_CSS).toMatch(
      /\.light-bucket \{\s*animation: light-breathe 2\.6s ease-in-out infinite;/,
    );
    expect(MAP_CSS).toContain("animation-delay: calc(-2.6s * 3 / 5);");
    expect(MAP_CSS.match(/animation-delay: calc\(-2\.6s \* /g)).toHaveLength(4);
  });

  it("считает радиус ореола через множитель и не перебивает заливку градиента", () => {
    const block = /\.light-halo \{([\s\S]*?)\}/.exec(MAP_CSS)?.[1] ?? "";
    expect(block).toContain("var(--halo-k, 1)");
    expect(block).not.toContain("fill:");
  });

  it("даёт ядру белую обводку постоянной толщины", () => {
    const block = /\.light-core \{([\s\S]*?)\}/.exec(MAP_CSS)?.[1] ?? "";
    expect(block).toContain("stroke: #fff;");
    expect(block).toContain("stroke-width: .9px;");
    expect(block).toContain("stroke-opacity: .5;");
    expect(block).toContain("vector-effect: non-scaling-stroke;");
  });

  it("убрал старую пульсацию и сохранил кольцо нового огонька", () => {
    expect(MAP_CSS).not.toContain("light-pulse");
    expect(MAP_CSS).toContain("@keyframes light-arrive");
  });

  it("держит цвета огоньков и акценты счётчиков литералами", () => {
    for (const literal of [
      "--light-person: rgb(158 67 154);",
      "--light-group: rgb(84 164 172);",
      "--counter-accent: rgb(210 142 190);",
      "--counter-accent: rgb(123 194 199);",
    ]) {
      expect(MAP_CSS).toContain(literal);
    }
  });

  it("отдаёт гашение под reduce глобальному файлу", () => {
    // Единственный медиазапрос бережного движения живёт в global.css и находит
    // корзины по data-anim="pulse".
    expect(MAP_CSS).not.toContain("prefers-reduced-motion");
  });
});
