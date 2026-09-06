import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Resources } from "./Resources";
import { Involve } from "../involve/Involve";
import { esdMaterials } from "../../data/materials";
import { musicFiles } from "../../data/resourceFiles";
import type { ResourceKey } from "../../data/copy.resources";
import { resourcesCopy } from "../../data/copy.resources";

const CARD_MUSIC = /Пойте вместе/;
const CARD_MATERIALS = /Будьте готовы/;
const CARD_VIDEO = /Смотрите и делитесь/;
const FACADE = /^Смотреть видео: /;

/** Порядок блоков в сетке: он же порядок колонки на узком экране. */
const CARD_ORDER: readonly ResourceKey[] = ["music", "materials", "video"];

/* Размеры и тайминги секции — свойство CSS, а не разметки, поэтому файл читается
   с диска: vitest настроен с css: false и отдаёт содержимое CSS-модуля пустой
   строкой даже по запросу ?raw (тот же приём, что в src/styles/motionPolicy.test.ts). */
const RESOURCES_CSS = readFileSync(
  resolve(process.cwd(), "src/components/resources/resources.css"),
  "utf8",
);

function cardButtons() {
  return Array.from(document.querySelectorAll<HTMLButtonElement>("button[data-kind]"));
}

function resourcesSection() {
  const section = document.querySelector<HTMLElement>("section#resources");
  expect(section).not.toBeNull();
  return section as HTMLElement;
}

/** Панель уезжает порталом в body, поэтому ищется по документу, а не внутри секции. */
function panelDialog() {
  return screen.getByRole("dialog");
}

function queryPanelDialog() {
  return screen.queryByRole("dialog");
}

function panelsContainer() {
  return document.querySelector<HTMLElement>(".resources-panels");
}

/** Список явный: планировщик React ходит через MessageChannel, и подменять его не нужно. */
function useShutterTimers() {
  vi.useFakeTimers({
    toFake: ["setTimeout", "clearTimeout", "requestAnimationFrame", "cancelAnimationFrame"],
  });
}

afterEach(() => {
  vi.useRealTimers();
  history.replaceState(null, "", window.location.pathname);
  document.documentElement.classList.remove("resources-panel-locked");
  document.body.classList.remove("resources-panel-locked");
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
    expect(queryPanelDialog()).toBeNull();
  });

  it("клик по «Материалы» раскрывает панель с материалами ЕАД и отдаёт фокус кнопке «Назад»", () => {
    render(<Resources />);

    const materialsBtn = screen.getByRole("button", { name: CARD_MATERIALS });
    fireEvent.click(materialsBtn);

    expect(materialsBtn.getAttribute("aria-expanded")).toBe("true");

    const panel = panelDialog();
    const labelId = panel.getAttribute("aria-labelledby");
    expect(labelId).toBeTruthy();
    expect(document.getElementById(labelId as string)).toHaveTextContent(
      resourcesCopy.panels.materials.title,
    );

    const esd = document.querySelector<HTMLElement>("#resources-group-esd");
    expect(esd).toHaveAttribute("open");

    const links = Array.from((esd as HTMLElement).querySelectorAll("a"));
    expect(links.map((link) => link.getAttribute("href"))).toEqual(
      esdMaterials.map((material) => material.href),
    );
    for (const link of links) {
      expect(link.getAttribute("target")).toBe("_blank");
      expect(link.getAttribute("rel")).toBe("noopener noreferrer");
    }

    expect(panel).toHaveAttribute("tabindex", "-1");
    expect(screen.getByRole("button", { name: "Назад" })).toHaveFocus();
  });

  it("повторный клик по активной карточке закрывает панель", () => {
    useShutterTimers();
    render(<Resources />);

    const materialsBtn = screen.getByRole("button", { name: CARD_MATERIALS });
    fireEvent.click(materialsBtn);
    expect(panelDialog()).toBeInTheDocument();

    fireEvent.click(materialsBtn);
    expect(materialsBtn.getAttribute("aria-expanded")).toBe("false");
    expect(panelsContainer()).toHaveClass("is-closing");

    act(() => {
      vi.advanceTimersByTime(900);
    });

    expect(queryPanelDialog()).toBeNull();
  });

  it("клик по «Видео» показывает 16 фасадов и переключает aria-expanded между карточками", () => {
    render(<Resources />);

    const materialsBtn = screen.getByRole("button", { name: CARD_MATERIALS });
    const videoBtn = screen.getByRole("button", { name: CARD_VIDEO });

    fireEvent.click(videoBtn);

    let panel = panelDialog();
    expect(panel).toHaveAttribute("data-kind", "video");
    expect(within(panel).getAllByRole("button", { name: FACADE })).toHaveLength(16);
    expect(videoBtn.getAttribute("aria-expanded")).toBe("true");
    expect(materialsBtn.getAttribute("aria-expanded")).toBe("false");

    fireEvent.click(materialsBtn);

    panel = panelDialog();
    expect(panel).toHaveAttribute("data-kind", "materials");
    expect(panel.querySelectorAll("details.resources-group")).toHaveLength(5);
    expect(within(panel).queryAllByRole("button", { name: FACADE })).toHaveLength(0);
    expect(materialsBtn.getAttribute("aria-expanded")).toBe("true");
    expect(videoBtn.getAttribute("aria-expanded")).toBe("false");
  });

  it("клик по «Музыка» показывает три файла оригинала", () => {
    render(<Resources />);

    fireEvent.click(screen.getByRole("button", { name: CARD_MUSIC }));

    const panel = panelDialog();
    expect(within(panel).getByText(resourcesCopy.panels.music.description)).toBeInTheDocument();

    const links = within(panel).getAllByRole("link");
    expect(links.map((link) => link.getAttribute("href"))).toEqual(
      musicFiles.map((file) => file.href),
    );
    expect(screen.queryByText("Песня ещё в работе")).toBeNull();
  });

  it("не держит вложенных ссылок и кнопок внутри карточек-кнопок", () => {
    render(<Resources />);

    const cards = cardButtons();
    expect(cards).toHaveLength(3);
    for (const card of cards) {
      expect(card.querySelector("a, button")).toBeNull();
    }
  });

  it("держит id панели на диалоге, а aria-controls — на раскрытой карточке", () => {
    render(<Resources />);

    const materialsBtn = screen.getByRole("button", { name: CARD_MATERIALS });
    expect(materialsBtn.getAttribute("aria-controls")).toBeNull();

    fireEvent.click(materialsBtn);

    const panel = panelDialog();
    expect(panel.getAttribute("id")).toBe("resources-panel");
    expect(document.getElementById("resources-panel")).toBe(panel);
    expect(materialsBtn.getAttribute("aria-controls")).toBe("resources-panel");

    for (const card of cardButtons().filter((card) => card !== materialsBtn)) {
      expect(card.getAttribute("aria-controls")).toBeNull();
      expect(card.getAttribute("aria-expanded")).toBe("false");
    }
  });

  it("показывает кнопку «Назад» при раскрытой панели", () => {
    render(<Resources />);

    fireEvent.click(screen.getByRole("button", { name: CARD_MATERIALS }));

    expect(screen.getByRole("button", { name: "Назад" })).toBeInTheDocument();
  });

  it("блокирует прокрутку документа, пока панель открыта", () => {
    useShutterTimers();
    render(<Resources />);

    fireEvent.click(screen.getByRole("button", { name: CARD_MATERIALS }));

    expect(document.documentElement).toHaveClass("resources-panel-locked");
    expect(document.body).toHaveClass("resources-panel-locked");

    fireEvent.click(screen.getByRole("button", { name: "Назад" }));
    act(() => {
      vi.advanceTimersByTime(900);
    });

    expect(document.documentElement).not.toHaveClass("resources-panel-locked");
    expect(document.body).not.toHaveClass("resources-panel-locked");
  });
});

describe("панель: клавиатура и deep link", () => {
  it("Esc закрывает панель и возвращает фокус на карточку-триггер", () => {
    render(<Resources />);

    const materialsBtn = screen.getByRole("button", { name: CARD_MATERIALS });
    fireEvent.click(materialsBtn);

    // Слушатель висит на документе: фокус в этот момент стоит на кнопке «Назад» внутри портала.
    fireEvent.keyDown(document, { key: "Escape" });

    expect(panelsContainer()).toHaveClass("is-closing");
    expect(materialsBtn.getAttribute("aria-expanded")).toBe("false");
    expect(materialsBtn).toHaveFocus();
  });

  it("кнопка «Назад» закрывает панель и возвращает фокус на карточку-триггер", () => {
    render(<Resources />);

    const videoBtn = screen.getByRole("button", { name: CARD_VIDEO });
    fireEvent.click(videoBtn);

    fireEvent.click(screen.getByRole("button", { name: "Назад" }));

    expect(panelsContainer()).toHaveClass("is-closing");
    expect(videoBtn.getAttribute("aria-expanded")).toBe("false");
    expect(videoBtn).toHaveFocus();
  });

  it("адрес с #resources-materials открывает панель материалов сразу при монтировании", () => {
    window.location.hash = "#resources-materials";

    render(<Resources />);

    expect(panelDialog()).toHaveAttribute("data-kind", "materials");
    expect(document.querySelectorAll("#resources-group-esd a")).toHaveLength(4);
    expect(
      screen.getByRole("button", { name: CARD_MATERIALS }).getAttribute("aria-expanded"),
    ).toBe("true");
  });

  it("открывает панель материалов, когда хэш меняют снаружи разметки", () => {
    render(<Resources />);
    expect(queryPanelDialog()).toBeNull();

    // Событие шлётся руками намеренно: так выглядит вход через «Назад», закладку
    // или адресную строку. Клик по внутренней ссылке проверяет сценарий выше —
    // на нём браузер hashchange не шлёт, если адрес уже равен целевому.
    window.location.hash = "#resources-materials";
    fireEvent(window, new Event("hashchange"));

    expect(panelDialog()).toHaveAttribute("data-kind", "materials");
    expect(document.querySelectorAll("#resources-group-esd a")).toHaveLength(4);
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
    expect(panelDialog()).toHaveAttribute("data-kind", "materials");

    fireEvent.click(screen.getByRole("button", { name: "Назад" }));
    expect(panelsContainer()).toHaveClass("is-closing");

    // Хэш уже равен целевому, поэтому hashchange браузер не шлёт: панель держится
    // на делегированном клике, а не на смене адреса. Панель ещё уезжает — второй клик
    // разворачивает её обратно, не дожидаясь конца анимации.
    await user.click(link);
    expect(panelDialog()).toHaveAttribute("data-kind", "materials");
    expect(panelsContainer()).not.toHaveClass("is-closing");
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

describe("сетка и карточки по оригиналу", () => {
  it("держит порядок блоков copy → music → materials → video на обёртках сетки", () => {
    render(<Resources />);

    const grid = resourcesSection().querySelector<HTMLElement>(".resources-grid");
    expect(grid).not.toBeNull();

    const cells = Array.from((grid as HTMLElement).children) as HTMLElement[];
    expect(cells).toHaveLength(4);
    expect(cells[0].classList.contains("resources-copy")).toBe(true);

    // Порядок в разметке и есть порядок колонки на узком экране; на широком блоки
    // расставляет grid-area, поэтому классы ячеек проверяются по тому же порядку.
    cells.slice(1).forEach((cell, index) => {
      expect(cell.classList.contains("resources-cell")).toBe(true);
      expect(cell.classList.contains(`resources-cell--${CARD_ORDER[index]}`)).toBe(true);
    });
  });

  it("размечает карточку: индикатор с точкой, контент внизу, действие с подчёркиванием", () => {
    render(<Resources />);

    for (const kind of CARD_ORDER) {
      const card = document.querySelector<HTMLElement>(`.resource-card[data-kind="${kind}"]`);
      expect(card).not.toBeNull();

      const element = card as HTMLElement;
      const copy = resourcesCopy.cards[kind];

      // Поверхность приходит из пары утилит, поэтому обе обязаны быть на карточке.
      expect(element.classList.contains("glass")).toBe(true);
      expect(element.classList.contains("glass-resource")).toBe(true);
      expect(element.style.getPropertyValue("--accent")).toBe(copy.accent);

      const indicator = element.firstElementChild as HTMLElement;
      expect(indicator.classList.contains("resource-card__indicator")).toBe(true);
      expect(indicator).toHaveTextContent(copy.label);

      const dot = indicator.querySelector(".resource-card__dot");
      expect(dot).not.toBeNull();
      expect(dot).toHaveAttribute("aria-hidden", "true");

      const content = element.querySelector<HTMLElement>(".resource-card__content");
      expect(content).not.toBeNull();

      const title = (content as HTMLElement).querySelector("h3.resource-card__title");
      expect(title).toHaveTextContent(copy.title);
      expect(title).toHaveAttribute("id", `resource-card-title-${kind}`);

      const description = (content as HTMLElement).querySelector("p.resource-card__description");
      expect(description).toHaveTextContent(copy.description);

      const trigger = (content as HTMLElement).querySelector(
        ".resource-card__actions .resource-card__trigger",
      );
      expect(trigger).toHaveTextContent(copy.cta);
    }
  });

  it("задаёт сетку и пропорции оригинала в CSS", () => {
    for (const value of [
      "@media (min-width: 64rem)",
      "grid-template-columns: minmax(0, 320fr) minmax(0, 528fr) minmax(0, 272fr)",
      "padding-block: clamp(88px, 10vw, 144px) clamp(88px, 10vw, 152px)",
      "aspect-ratio: 528 / 523",
      "aspect-ratio: 320 / 296",
      "aspect-ratio: 272 / 336",
      "aspect-ratio: 368 / 256",
      "width: min(69.697%, 368px)",
      "width: min(100%, 328px)",
      "height: 248px",
      "border: 1px dotted rgb(84 164 172 / .25)",
      "background: rgb(84 164 172 / .05)",
      "transform: scaleX(.34)",
      "transform: translateY(-4px)",
      "420ms cubic-bezier(.22, 1, .36, 1)",
      "padding: 24px",
      "padding: 20px",
    ]) {
      expect(RESOURCES_CSS).toContain(value);
    }
  });

  it("поднимает карточку и раскрывает подчёркивание на ховере и фокусе", () => {
    // Кнопка карточки — прозрачный слой внутри неё, поэтому фокус ловится через :has.
    expect(RESOURCES_CSS).toMatch(
      /\.resource-card:hover,\s*\.resource-card:has\(:focus-visible\),\s*\.resource-card\[data-open="true"\] \{[^}]*border-color: var\(--accent\);[^}]*transform: translateY\(-4px\);/,
    );
    expect(RESOURCES_CSS).toMatch(
      /\.resource-card:hover \.resource-card__trigger::before,\s*\.resource-card:has\(:focus-visible\) \.resource-card__trigger::before \{\s*transform: scaleX\(1\);/,
    );
  });

  it("не рисует собственный фон карточки и не заводит reduce-блок", () => {
    expect(RESOURCES_CSS).not.toMatch(/\.resource-card \{[^}]*background/);
    expect(RESOURCES_CSS).not.toContain("prefers-reduced-motion");
    expect(RESOURCES_CSS).not.toContain("var(--color-");
  });
});
