import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ESD_IDS } from "../../data/countries";
import { generateLights } from "../../data/lights";
import { LightsProvider, useLights } from "../../state/lights";
import { EsdMap } from "./EsdMap";

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

  it("показывает ошибку вместо карты при нулевом контейнере", () => {
    const onError = vi.fn();
    const { container } = render(
      <EsdMap lights={lights} size={{ width: 0, height: 0 }} onError={onError} />,
    );

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
