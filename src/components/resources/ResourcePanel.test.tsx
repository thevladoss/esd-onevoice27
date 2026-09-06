import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { resourcesCopy } from "../../data/copy.resources";
import { englishFolder } from "../../data/materials";
import { materialGroups, musicFiles, videoFiles } from "../../data/resourceFiles";
import { ResourcePanel } from "./ResourcePanel";

const FACADE = /^Смотреть видео: /;
const LOCK = "resources-panel-locked";

/** Контейнер шторки живёт порталом в body, поэтому ищется по документу, а не в RTL-контейнере. */
function container() {
  return document.querySelector<HTMLElement>(".resources-panels");
}

function dialog() {
  return screen.getByRole("dialog");
}

function backButton() {
  return screen.getByRole("button", { name: "Назад" });
}

/** Конец поездки верхнего слоя. jsdom не отдаёт `propertyName` и `pseudoElement` через
 *  конструктор события, поэтому поля дописываются руками. */
function fireLayerTransitionEnd(node: Element) {
  const event = Object.assign(new Event("transitionend", { bubbles: true }), {
    propertyName: "transform",
    pseudoElement: "::after",
  });
  fireEvent(node, event);
}

const realMatchMedia = window.matchMedia;

/** Подмена медиазапроса для сценария с reduced motion: хук читает matchMedia на каждом рендере. */
function mockReducedMotion() {
  window.matchMedia = ((query: string) => ({
    matches: query.includes("prefers-reduced-motion"),
    media: query,
    onchange: null,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

beforeEach(() => {
  // Список явный: планировщик React ходит через MessageChannel, и подменять его не нужно.
  vi.useFakeTimers({
    toFake: ["setTimeout", "clearTimeout", "requestAnimationFrame", "cancelAnimationFrame"],
  });
});

afterEach(() => {
  vi.useRealTimers();
  window.matchMedia = realMatchMedia;
  document.documentElement.classList.remove(LOCK);
  document.body.classList.remove(LOCK);
});

/** Доводит панель до фазы `open`: кадр между `is-opening` и `is-open` идёт через rAF. */
function settleOpen() {
  act(() => {
    vi.advanceTimersByTime(20);
  });
}

describe("ResourcePanel: содержимое трёх панелей", () => {
  it("«Музыка» показывает три файла оригинала порталом в body и отдаёт фокус кнопке «Назад»", () => {
    const { container: rtlContainer } = render(<ResourcePanel active="music" onClose={vi.fn()} />);

    const panel = dialog();
    expect(document.body).toContainElement(panel);
    expect(rtlContainer).not.toContainElement(panel);
    expect(panel).toHaveAttribute("aria-modal", "true");
    expect(panel).toHaveAttribute("data-kind", "music");

    const labelId = panel.getAttribute("aria-labelledby");
    expect(document.getElementById(labelId as string)).toHaveTextContent(
      resourcesCopy.panels.music.title,
    );
    expect(
      within(panel).getByText(resourcesCopy.panels.music.description),
    ).toBeInTheDocument();

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(3);
    expect(links.map((link) => link.getAttribute("href"))).toEqual(
      musicFiles.map((file) => file.href),
    );
    for (const [index, link] of links.entries()) {
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
      expect(link).toHaveAccessibleName(`Скачать: ${musicFiles[index].name}`);
    }

    const badges = Array.from(panel.querySelectorAll("[data-file-type]"));
    expect(badges.map((badge) => badge.textContent)).toEqual(["PDF", "ZIP", "MOV"]);

    expect(backButton()).toHaveFocus();
  });

  it("«Материалы» показывает раскрытую группу ЕАД и четыре языковые группы", () => {
    render(<ResourcePanel active="materials" onClose={vi.fn()} />);

    const groups = Array.from(document.querySelectorAll<HTMLElement>("details.resources-group"));
    expect(groups.map((group) => group.id)).toEqual([
      "resources-group-esd",
      "resources-group-en",
      "resources-group-es",
      "resources-group-pt",
      "resources-group-fr",
    ]);
    expect(groups.filter((group) => group.hasAttribute("open")).map((group) => group.id)).toEqual([
      "resources-group-esd",
    ]);
    expect(groups.map((group) => group.querySelector(".resources-group__title")?.textContent)).toEqual(
      materialGroups.map((group) => resourcesCopy.groups[group.id]),
    );

    // Свёрнутый <details> в jsdom не прячет содержимое от дерева доступности, поэтому
    // ссылки внутри групп считаются селектором, а не ролью.
    const [esd, en, es, pt, fr] = groups;

    const esdFiles = Array.from(esd.querySelectorAll("li.resources-file"));
    expect(esdFiles).toHaveLength(4);
    expect(esdFiles[0].querySelector("[data-file-type]")).toHaveTextContent("DOCX");
    expect(esdFiles[0].querySelector("a")).toHaveAccessibleName(
      `Скачать: ${materialGroups[0].files[0].name}`,
    );
    for (const file of esdFiles.slice(1)) {
      expect(file.querySelector("[data-file-type]")).toHaveTextContent("WEB");
      expect(file.querySelector("a")?.getAttribute("aria-label")).toMatch(/^Открыть: /);
    }

    const enLinks = Array.from(en.querySelectorAll("a"));
    expect(enLinks).toHaveLength(7);
    expect(enLinks[6]).toHaveAttribute("href", englishFolder.href);

    for (const group of [es, pt, fr]) {
      expect(group.querySelectorAll("a")).toHaveLength(5);
    }
  });

  it("«Видео» показывает 16 фасадов и карточку архива видеофонов", () => {
    render(<ResourcePanel active="video" onClose={vi.fn()} />);

    expect(screen.getAllByRole("button", { name: FACADE })).toHaveLength(16);

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAccessibleName(`Скачать: ${videoFiles[0].name}`);
    expect(links[0]).toHaveAttribute("href", videoFiles[0].href);
    expect(
      links[0].closest("li")?.querySelector("[data-file-type]"),
    ).toHaveTextContent("ZIP");

    // Плеер монтируется только после клика по фасаду: до него запросов к YouTube нет.
    expect(document.querySelector("iframe")).toBeNull();
  });
});

describe("ResourcePanel: фазы шторки", () => {
  it("переходит из is-opening в is-open по кадру и блокирует прокрутку документа", () => {
    render(<ResourcePanel active="music" onClose={vi.fn()} />);

    expect(container()).toHaveClass("resources-panels", "is-opening");
    expect(document.documentElement).toHaveClass(LOCK);
    expect(document.body).toHaveClass(LOCK);

    settleOpen();

    expect(container()).toHaveClass("is-open");
    expect(container()).not.toHaveClass("is-opening");
  });

  it("на закрытии держит панель в DOM до конца анимации и снимает блокировку", () => {
    const onClose = vi.fn();
    const { rerender } = render(<ResourcePanel active="music" onClose={onClose} />);
    settleOpen();

    rerender(<ResourcePanel active={null} onClose={onClose} />);

    expect(container()).toHaveClass("is-closing");
    expect(dialog()).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(900);
    });

    expect(container()).toBeNull();
    expect(document.documentElement).not.toHaveClass(LOCK);
    expect(document.body).not.toHaveClass(LOCK);
  });

  it("закрывается по transitionend верхнего слоя раньше страховочного таймера", () => {
    const onClose = vi.fn();
    const { rerender } = render(<ResourcePanel active="materials" onClose={onClose} />);
    settleOpen();

    rerender(<ResourcePanel active={null} onClose={onClose} />);
    const closing = container() as HTMLElement;
    expect(closing).toHaveClass("is-closing");

    fireLayerTransitionEnd(closing);

    expect(container()).toBeNull();
    expect(document.body).not.toHaveClass(LOCK);
  });

  it("при prefers-reduced-motion открывается и закрывается без промежуточных фаз", () => {
    mockReducedMotion();

    const onClose = vi.fn();
    const { rerender } = render(<ResourcePanel active="music" onClose={onClose} />);

    expect(container()).toHaveClass("is-open");

    rerender(<ResourcePanel active={null} onClose={onClose} />);

    expect(container()).toBeNull();
    expect(document.documentElement).not.toHaveClass(LOCK);
  });
});

describe("ResourcePanel: клавиатура и фокус", () => {
  it("Escape закрывает панель один раз и молчит, пока она уезжает", () => {
    const onClose = vi.fn();
    const { rerender } = render(<ResourcePanel active="music" onClose={onClose} />);
    settleOpen();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);

    rerender(<ResourcePanel active={null} onClose={onClose} />);
    fireEvent.keyDown(document, { key: "Escape" });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("не выпускает Tab за пределы диалога", () => {
    render(<ResourcePanel active="music" onClose={vi.fn()} />);
    settleOpen();

    const links = screen.getAllByRole("link");
    const last = links[links.length - 1];
    last.focus();

    fireEvent.keyDown(dialog(), { key: "Tab" });
    expect(backButton()).toHaveFocus();

    fireEvent.keyDown(dialog(), { key: "Tab", shiftKey: true });
    expect(last).toHaveFocus();
  });

  it("отдаёт закрытие вызывающей стороне по клику на «Назад»", () => {
    const onClose = vi.fn();
    render(<ResourcePanel active="video" onClose={onClose} />);
    settleOpen();

    fireEvent.click(backButton());

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
