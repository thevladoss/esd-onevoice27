import { fireEvent, render, screen, within } from "@testing-library/react";
import { Resources } from "./Resources";
import { materials } from "../../data/materials";

const CARD_MUSIC = /Пойте вместе/;
const CARD_MATERIALS = /Будьте готовы/;
const CARD_VIDEO = /Смотрите и делитесь/;
const FACADE = /^Смотреть видео: /;

function cardButtons() {
  return Array.from(
    document.querySelectorAll<HTMLButtonElement>('button[aria-controls="resources-panel"]'),
  );
}

afterEach(() => {
  history.replaceState(null, "", window.location.pathname);
});

describe("Resources: карточки и панели", () => {
  it("рендерит секцию с надзаголовком, H2 и тремя карточками без раскрытой панели", () => {
    render(<Resources />);

    expect(document.querySelector("section#resources")).not.toBeNull();
    expect(
      screen.getByRole("heading", { level: 2, name: "Всё, что нужно для старта" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Ресурсы")).toBeInTheDocument();

    const cards = cardButtons();
    expect(cards).toHaveLength(3);
    for (const card of cards) {
      expect(card.getAttribute("aria-expanded")).toBe("false");
    }
    expect(screen.queryByRole("region")).toBeNull();
  });

  it("клик по «Материалы» раскрывает панель с пятью внешними ссылками и отдаёт ей фокус", () => {
    render(<Resources />);

    const materialsBtn = screen.getByRole("button", { name: CARD_MATERIALS });
    fireEvent.click(materialsBtn);

    expect(materialsBtn.getAttribute("aria-expanded")).toBe("true");

    const region = screen.getByRole("region");
    const labelId = region.getAttribute("aria-labelledby");
    expect(labelId).toBeTruthy();
    expect(document.getElementById(labelId as string)).toHaveTextContent("Будьте готовы");

    const links = within(region).getAllByRole("link");
    expect(links).toHaveLength(5);
    expect(links.map((link) => link.getAttribute("href"))).toEqual(
      materials.map((material) => material.href),
    );
    for (const link of links) {
      expect(link.getAttribute("target")).toBe("_blank");
      expect(link.getAttribute("rel")).toBe("noopener noreferrer");
    }

    expect(document.activeElement).toBe(region);
  });

  it("повторный клик по активной карточке закрывает панель", () => {
    render(<Resources />);

    const materialsBtn = screen.getByRole("button", { name: CARD_MATERIALS });
    fireEvent.click(materialsBtn);
    expect(screen.getByRole("region")).toBeInTheDocument();

    fireEvent.click(materialsBtn);
    expect(materialsBtn.getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByRole("region")).toBeNull();
  });

  it("клик по «Видео» показывает 16 фасадов и переключает aria-expanded между карточками", () => {
    render(<Resources />);

    const materialsBtn = screen.getByRole("button", { name: CARD_MATERIALS });
    const videoBtn = screen.getByRole("button", { name: CARD_VIDEO });

    fireEvent.click(videoBtn);

    let region = screen.getByRole("region");
    expect(within(region).getAllByRole("button", { name: FACADE })).toHaveLength(16);
    expect(videoBtn.getAttribute("aria-expanded")).toBe("true");
    expect(materialsBtn.getAttribute("aria-expanded")).toBe("false");

    fireEvent.click(materialsBtn);

    region = screen.getByRole("region");
    expect(within(region).getAllByRole("link")).toHaveLength(5);
    expect(within(region).queryAllByRole("button", { name: FACADE })).toHaveLength(0);
    expect(materialsBtn.getAttribute("aria-expanded")).toBe("true");
    expect(videoBtn.getAttribute("aria-expanded")).toBe("false");
  });

  it("клик по «Музыка» показывает честную заглушку без ссылок", () => {
    render(<Resources />);

    fireEvent.click(screen.getByRole("button", { name: CARD_MUSIC }));

    const region = screen.getByRole("region");
    expect(within(region).getByText("Песня ещё в работе")).toBeInTheDocument();
    expect(
      within(region).getByText(
        "Официальная песня «Единого голоса 27» скоро появится здесь. Следите за новостями дивизиона.",
      ),
    ).toBeInTheDocument();
    expect(within(region).queryAllByRole("link")).toHaveLength(0);
  });

  it("не держит вложенных ссылок и кнопок внутри карточек-кнопок", () => {
    render(<Resources />);

    const cards = cardButtons();
    expect(cards).toHaveLength(3);
    for (const card of cards) {
      expect(card.querySelector("a, button")).toBeNull();
    }
  });

  it("показывает кнопку «Свернуть панель» при раскрытой панели", () => {
    render(<Resources />);

    fireEvent.click(screen.getByRole("button", { name: CARD_MATERIALS }));

    expect(screen.getByRole("button", { name: "Свернуть панель" })).toBeInTheDocument();
  });
});

describe("панель: клавиатура и deep link", () => {
  it("Esc внутри панели закрывает её и возвращает фокус на карточку-триггер", () => {
    render(<Resources />);

    const materialsBtn = screen.getByRole("button", { name: CARD_MATERIALS });
    fireEvent.click(materialsBtn);

    const region = screen.getByRole("region");
    fireEvent.keyDown(region, { key: "Escape" });

    expect(screen.queryByRole("region")).toBeNull();
    expect(materialsBtn.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(materialsBtn);
  });

  it("кнопка «Свернуть панель» закрывает панель и возвращает фокус на карточку-триггер", () => {
    render(<Resources />);

    const videoBtn = screen.getByRole("button", { name: CARD_VIDEO });
    fireEvent.click(videoBtn);

    fireEvent.click(screen.getByRole("button", { name: "Свернуть панель" }));

    expect(screen.queryByRole("region")).toBeNull();
    expect(videoBtn.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(videoBtn);
  });

  it("адрес с #resources-materials открывает панель материалов сразу при монтировании", () => {
    window.location.hash = "#resources-materials";

    render(<Resources />);

    const region = screen.getByRole("region");
    expect(within(region).getAllByRole("link")).toHaveLength(5);
    expect(
      screen.getByRole("button", { name: CARD_MATERIALS }).getAttribute("aria-expanded"),
    ).toBe("true");
  });

  it("держит три слоя частиц в декоративном фоне секции", () => {
    render(<Resources />);

    const section = document.querySelector("section#resources") as HTMLElement;
    expect(section).not.toBeNull();
    expect(
      section.querySelectorAll("[data-particles] > span[aria-hidden='true']"),
    ).toHaveLength(3);
  });
});
