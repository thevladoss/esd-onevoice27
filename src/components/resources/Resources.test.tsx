import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Resources } from "./Resources";
import { Involve } from "../involve/Involve";
import { materials } from "../../data/materials";

const CARD_MUSIC = /Пойте вместе/;
const CARD_MATERIALS = /Будьте готовы/;
const CARD_VIDEO = /Смотрите и делитесь/;
const FACADE = /^Смотреть видео: /;

function cardButtons() {
  return Array.from(document.querySelectorAll<HTMLButtonElement>("button[data-kind]"));
}

/** Именованная секция сама стала ландмарком region, поэтому панель ищем внутри неё. */
function resourcesSection() {
  const section = document.querySelector<HTMLElement>("section#resources");
  expect(section).not.toBeNull();
  return section as HTMLElement;
}

function panelRegion() {
  return within(resourcesSection()).getByRole("region");
}

function queryPanelRegion() {
  return within(resourcesSection()).queryByRole("region");
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
    expect(queryPanelRegion()).toBeNull();
  });

  it("клик по «Материалы» раскрывает панель с пятью внешними ссылками и отдаёт ей фокус", () => {
    render(<Resources />);

    const materialsBtn = screen.getByRole("button", { name: CARD_MATERIALS });
    fireEvent.click(materialsBtn);

    expect(materialsBtn.getAttribute("aria-expanded")).toBe("true");

    const region = panelRegion();
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

    expect(region).toHaveAttribute("tabindex", "-1");
    expect(region).toHaveFocus();
  });

  it("повторный клик по активной карточке закрывает панель", () => {
    render(<Resources />);

    const materialsBtn = screen.getByRole("button", { name: CARD_MATERIALS });
    fireEvent.click(materialsBtn);
    expect(panelRegion()).toBeInTheDocument();

    fireEvent.click(materialsBtn);
    expect(materialsBtn.getAttribute("aria-expanded")).toBe("false");
    expect(queryPanelRegion()).toBeNull();
  });

  it("клик по «Видео» показывает 16 фасадов и переключает aria-expanded между карточками", () => {
    render(<Resources />);

    const materialsBtn = screen.getByRole("button", { name: CARD_MATERIALS });
    const videoBtn = screen.getByRole("button", { name: CARD_VIDEO });

    fireEvent.click(videoBtn);

    let region = panelRegion();
    expect(within(region).getAllByRole("button", { name: FACADE })).toHaveLength(16);
    expect(videoBtn.getAttribute("aria-expanded")).toBe("true");
    expect(materialsBtn.getAttribute("aria-expanded")).toBe("false");

    fireEvent.click(materialsBtn);

    region = panelRegion();
    expect(within(region).getAllByRole("link")).toHaveLength(5);
    expect(within(region).queryAllByRole("button", { name: FACADE })).toHaveLength(0);
    expect(materialsBtn.getAttribute("aria-expanded")).toBe("true");
    expect(videoBtn.getAttribute("aria-expanded")).toBe("false");
  });

  it("клик по «Музыка» показывает честную заглушку без ссылок", () => {
    render(<Resources />);

    fireEvent.click(screen.getByRole("button", { name: CARD_MUSIC }));

    const region = panelRegion();
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

  it("держит id панели на элементе с role=region, а aria-controls — на раскрытой карточке", () => {
    render(<Resources />);

    const materialsBtn = screen.getByRole("button", { name: CARD_MATERIALS });
    expect(materialsBtn.getAttribute("aria-controls")).toBeNull();

    fireEvent.click(materialsBtn);

    const region = panelRegion();
    expect(region.getAttribute("id")).toBe("resources-panel");
    expect(document.getElementById("resources-panel")).toBe(region);
    expect(materialsBtn.getAttribute("aria-controls")).toBe("resources-panel");

    for (const card of cardButtons().filter((card) => card !== materialsBtn)) {
      expect(card.getAttribute("aria-controls")).toBeNull();
      expect(card.getAttribute("aria-expanded")).toBe("false");
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

    const region = panelRegion();
    fireEvent.keyDown(region, { key: "Escape" });

    expect(queryPanelRegion()).toBeNull();
    expect(materialsBtn.getAttribute("aria-expanded")).toBe("false");
    expect(materialsBtn).toHaveFocus();
  });

  it("кнопка «Свернуть панель» закрывает панель и возвращает фокус на карточку-триггер", () => {
    render(<Resources />);

    const videoBtn = screen.getByRole("button", { name: CARD_VIDEO });
    fireEvent.click(videoBtn);

    fireEvent.click(screen.getByRole("button", { name: "Свернуть панель" }));

    expect(queryPanelRegion()).toBeNull();
    expect(videoBtn.getAttribute("aria-expanded")).toBe("false");
    expect(videoBtn).toHaveFocus();
  });

  it("адрес с #resources-materials открывает панель материалов сразу при монтировании", () => {
    window.location.hash = "#resources-materials";

    render(<Resources />);

    const region = panelRegion();
    expect(within(region).getAllByRole("link")).toHaveLength(5);
    expect(
      screen.getByRole("button", { name: CARD_MATERIALS }).getAttribute("aria-expanded"),
    ).toBe("true");
  });

  it("открывает панель материалов по смене хэша внутри уже открытой страницы", () => {
    render(<Resources />);
    expect(queryPanelRegion()).toBeNull();

    window.location.hash = "#resources-materials";
    fireEvent(window, new Event("hashchange"));

    const region = panelRegion();
    expect(within(region).getAllByRole("link")).toHaveLength(5);
    expect(
      screen.getByRole("button", { name: CARD_MATERIALS }).getAttribute("aria-expanded"),
    ).toBe("true");
  });

  it("раскрывает панель по клику на карточку триптиха и повторяет это на втором клике", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Involve />
        <Resources />
      </>,
    );

    const link = screen.getByRole("link", { name: "Скачать материалы" });

    await user.click(link);
    expect(panelRegion()).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Свернуть панель" }));
    expect(queryPanelRegion()).toBeNull();

    // Хэш уже равен целевому, поэтому hashchange браузер не шлёт: панель держится
    // на делегированном клике, а не на смене адреса.
    await user.click(link);
    expect(panelRegion()).toBeInTheDocument();
  });

  it("снимает слушателя хэша при размонтировании", () => {
    const { unmount } = render(<Resources />);
    unmount();

    window.location.hash = "#resources-materials";
    fireEvent(window, new Event("hashchange"));

    expect(document.querySelector("section#resources")).toBeNull();
    expect(document.getElementById("resources-panel")).toBeNull();
  });

  it("держит слой частиц в декоративном фоне секции", () => {
    render(<Resources />);

    const section = document.querySelector("section#resources") as HTMLElement;
    expect(section).not.toBeNull();
    // Звёздное поле собрано в один узел: пять градиентов точек живут в его фоне.
    expect(
      section.querySelectorAll("[data-particles] > span[aria-hidden='true']"),
    ).toHaveLength(1);
  });

  it("красит секцию под акцент открытой карточки", () => {
    render(<Resources />);

    const section = document.querySelector("section#resources") as HTMLElement;
    expect(section.className).not.toContain("-active");

    fireEvent.click(screen.getByRole("button", { name: CARD_VIDEO }));
    expect(section.className).toContain("is-video-active");

    fireEvent.click(screen.getByRole("button", { name: CARD_VIDEO }));
    expect(section.className).not.toContain("-active");
  });

  it("помечает частицы и атмосферу атрибутами политики движения", () => {
    render(<Resources />);

    const section = document.querySelector("section#resources") as HTMLElement;

    const particles = Array.from(section.querySelectorAll('[data-anim="particles"]'));
    expect(particles).toHaveLength(1);
    for (const layer of particles) {
      expect(layer).toHaveAttribute("aria-hidden", "true");
    }

    const atmosphere = section.querySelector('[data-anim="atmosphere"]');
    expect(atmosphere).not.toBeNull();
    expect(atmosphere).toHaveAttribute("aria-hidden", "true");
    expect(atmosphere).toHaveAttribute("data-kind", "none");
    expect(atmosphere?.className).toContain("pointer-events-none");
  });

  it("переводит атмосферу на акцент открытой карточки и возвращает обратно", () => {
    render(<Resources />);

    const atmosphere = document.querySelector('[data-anim="atmosphere"]') as HTMLElement;
    const videoBtn = screen.getByRole("button", { name: CARD_VIDEO });

    fireEvent.click(videoBtn);
    expect(atmosphere).toHaveAttribute("data-kind", "video");

    fireEvent.click(videoBtn);
    expect(atmosphere).toHaveAttribute("data-kind", "none");
  });

  it("держит три заголовка карточек в документе и даёт кнопке имя по заголовку", () => {
    render(<Resources />);

    for (const title of ["Пойте вместе", "Будьте готовы", "Смотрите и делитесь"]) {
      const heading = screen.getByRole("heading", { level: 3, name: title });
      expect(heading.closest("button")).toBeNull();
    }

    for (const card of cardButtons()) {
      // Модель содержимого button — поточный контент: ни абзацев, ни заголовков, ни блоков.
      expect(card.querySelector("p, div, h1, h2, h3, h4, h5, h6, ul, ol, section, article")).toBeNull();

      const labelId = card.getAttribute("aria-labelledby");
      expect(labelId).toBeTruthy();
      const label = document.getElementById(labelId as string);
      expect(label?.tagName).toBe("H3");
      expect(card).toHaveAccessibleName(label?.textContent as string);
    }
  });

  it("именует секцию заголовком и не прячет заголовки внутрь кнопок", () => {
    render(<Resources />);

    const section = document.querySelector("section#resources") as HTMLElement;
    expect(section).toHaveAttribute("aria-labelledby", "resources-title");

    const label = document.getElementById("resources-title");
    expect(label).toHaveTextContent("Всё, что нужно для старта");
    expect(label?.closest("h2")).not.toBeNull();

    for (const card of cardButtons()) {
      expect(card.querySelector("h1, h2, h3, h4, h5, h6")).toBeNull();
    }
  });
});
