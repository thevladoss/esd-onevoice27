import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { render } from "@testing-library/react";

import { LightsProvider } from "../../state/lights";
import { MapBand } from "./MapBand";

function renderBand() {
  // Карта, счётчики и форма читают контекст огоньков, поэтому лента живёт под провайдером.
  return render(
    <LightsProvider>
      <MapBand />
    </LightsProvider>,
  );
}

describe("MapBand", () => {
  it("оборачивает карту и форму одной лентой", () => {
    const { container } = renderBand();
    const band = container.querySelector(".map-band") as HTMLElement;

    expect(band).not.toBeNull();
    expect(band.tagName).toBe("DIV");
    // Обёртка чисто визуальная: ни роли, ни подписи, ни aria-атрибутов.
    expect(band.attributes).toHaveLength(1);
    expect(band.getAttribute("class")).toBe("map-band");

    expect(band.children).toHaveLength(2);
    const [map, form] = Array.from(band.children);

    expect(map.tagName).toBe("SECTION");
    expect(map.id).toBe("map");
    expect(map).toHaveClass("map-section");

    expect(form.tagName).toBe("SECTION");
    expect(form.id).toBe("light-form");
    expect(form).toHaveClass("lf-section");
  });

  it("не рисует собственную подложку секции карты", () => {
    renderBand();

    expect(document.querySelector(".map-section__skew")).toBeNull();

    const orbs = Array.from(document.querySelectorAll("#map > .map-orb"));
    expect(orbs).toHaveLength(2);
    for (const orb of orbs) {
      expect(orb).toHaveAttribute("aria-hidden", "true");
    }
  });

  it("показывает контейнер карты без обёртки появления", () => {
    renderBand();
    const shell = document.querySelector(".map-shell") as HTMLElement;

    expect(shell.children).toHaveLength(1);
    expect(shell.firstElementChild).toHaveClass("map-container");
    // motion-обёртка ставила контейнеру inline opacity 0 до попадания в вид.
    expect(shell.firstElementChild?.getAttribute("style")).toBeNull();

    // Каскад остался у заголовка секции.
    const header = document.querySelector(".map-section__header") as HTMLElement;
    expect(header).not.toBeNull();
    expect(header.querySelector("h2#map-title")).not.toBeNull();
  });
});

/*
 * CSS проверяется по тексту файла: vitest настроен с css: false, вычисленных
 * стилей в jsdom нет. Тот же приём, что в src/styles/motionPolicy.test.ts.
 */
const MAP_CSS = readFileSync(resolve(process.cwd(), "src/components/map/map.css"), "utf8");

/** Тело первого правила с таким селектором. */
function ruleBody(selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = new RegExp(`${escaped}\\s*\\{([^}]*)\\}`).exec(MAP_CSS);
  expect(match, `в map.css нет правила ${selector}`).not.toBeNull();
  return (match as RegExpExecArray)[1];
}

describe("map.css: лента", () => {
  it("держит ленту изолированным контекстом под hero", () => {
    const band = ruleBody(".map-band ");

    expect(band).toContain("--map-wedge: clamp(32px, 3.2vw, 52px);");
    expect(band).toContain("isolation: isolate;");
    expect(band).toContain("overflow-x: clip;");
    expect(band).toContain("margin-top: calc(0px - var(--map-wedge) - 1px);");
  });

  it("рисует подложку ленты со скосом", () => {
    const backdrop = ruleBody(".map-band::before");

    expect(backdrop).toContain("background: rgb(18 12 52);");
    expect(backdrop).toContain(
      "clip-path: polygon(0 var(--map-wedge), 100% 0, 100% 100%, 0 100%);",
    );
    expect(backdrop).toContain("z-index: -1;");
  });

  it("гасит подложку и орб формы внутри ленты", () => {
    expect(ruleBody(".map-band .lf-section ")).toContain("background: transparent;");
    expect(ruleBody(".map-band .lf-section::before")).toContain("content: none;");
  });

  it("снимает с секции карты подложку, отступ и клип", () => {
    expect(MAP_CSS).not.toContain(".map-section__skew");

    const section = ruleBody(".map-section ");
    expect(section).not.toContain("margin-top");
    expect(section).not.toContain("overflow-x");
    expect(section).not.toContain("--map-wedge");
  });

  it("центрирует нижний орб на кромке карты", () => {
    const orb = ruleBody(".map-orb--bottom ");

    expect(orb).toContain("top: 100%;");
    expect(orb).toContain("transform: translate(38%, -50%);");
    // Полоса во всю ширину на узком экране поднимается на ту же половину высоты.
    expect(MAP_CSS).toContain("transform: translateY(-50%);");
    expect(MAP_CSS).not.toContain("translateY(50%)");
  });

  it("оставляет карте нижний скос", () => {
    expect(ruleBody(".map-shell ")).toContain("100% calc(100% - var(--map-wedge))");
  });

  it("не заводит своего блока reduced motion", () => {
    expect(MAP_CSS).not.toContain("prefers-reduced-motion");
  });
});
