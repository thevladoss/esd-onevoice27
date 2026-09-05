import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Header } from "./Header";

/** `documentTop` — позиция секции в координатах документа: rect.top + scrollY. */
function addSection(id: string, documentTop: number) {
  const section = document.createElement("section");
  section.id = id;
  section.getBoundingClientRect = () =>
    ({ top: documentTop - window.scrollY, bottom: 0, left: 0, right: 0, width: 0, height: 0, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect;
  document.body.appendChild(section);
  return section;
}

function setScrollY(value: number) {
  Object.defineProperty(window, "scrollY", { value, writable: true, configurable: true });
}

describe("Header", () => {
  const scrollTo = vi.mocked(window.scrollTo);

  beforeEach(() => {
    scrollTo.mockClear();
    setScrollY(0);
  });

  afterEach(() => {
    document.querySelectorAll("body > section").forEach((section) => section.remove());
    history.pushState(null, "", location.pathname);
  });

  it("рендерит ландмарку banner и навигацию с подписью", () => {
    render(<Header />);

    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Основная навигация" })).toBeInTheDocument();
  });

  it("показывает четыре якоря меню в порядке из copy", () => {
    render(<Header />);
    const nav = screen.getByRole("navigation", { name: "Основная навигация" });
    const links = within(nav).getAllByRole("link");

    expect(links).toHaveLength(4);
    expect(links.map((link) => link.textContent)).toEqual([
      "Что это?",
      "Участвовать",
      "Новости",
      "Материалы",
    ]);
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "#about",
      "#involve",
      "#news",
      "#resources",
    ]);
  });

  it("делает вордмарк ссылкой на верх страницы", () => {
    render(<Header />);
    const brand = screen.getByRole("link", { name: "Единый голос 27, на главную" });

    expect(brand).toHaveAttribute("href", "#top");
    expect(within(brand).getByText("Единый голос 27")).toBeInTheDocument();
    expect(within(brand).getByText("МИССИЯ ДЛЯ ВСЕХ")).toBeInTheDocument();
  });

  it("прокручивает к секции по клику на пункт меню", async () => {
    const user = userEvent.setup();
    addSection("about", 1200);
    render(<Header />);

    await user.click(screen.getByRole("link", { name: "Что это?" }));

    expect(scrollTo).toHaveBeenCalledTimes(1);
    expect(scrollTo).toHaveBeenCalledWith({ top: 1100, behavior: "smooth" });
  });

  it("пишет якорь в адрес и переносит фокус в секцию", async () => {
    const user = userEvent.setup();
    const section = addSection("about", 1200);
    render(<Header />);

    await user.click(screen.getByRole("link", { name: "Что это?" }));

    expect(location.hash).toBe("#about");
    expect(section).toHaveAttribute("tabindex", "-1");
    expect(document.activeElement).toBe(section);
  });

  it("убирает якорь из адреса по клику на вордмарк", async () => {
    const user = userEvent.setup();
    history.pushState(null, "", "#about");
    render(<Header />);

    await user.click(screen.getByRole("link", { name: "Единый голос 27, на главную" }));

    expect(location.hash).toBe("");
  });

  it("молчит по клику на пункт, у которого нет секции", async () => {
    const user = userEvent.setup();
    render(<Header />);

    const hashBefore = location.hash;
    await user.click(screen.getByRole("link", { name: "Новости" }));

    expect(scrollTo).not.toHaveBeenCalled();
    expect(location.hash).toBe(hashBefore);
  });

  it("возвращает страницу наверх по клику на вордмарк", async () => {
    const user = userEvent.setup();
    render(<Header />);

    await user.click(screen.getByRole("link", { name: "Единый голос 27, на главную" }));

    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
  });

  it("уплотняет пилюлю после скролла больше 24px", () => {
    render(<Header />);
    const header = screen.getByRole("banner");

    expect(header).toHaveAttribute("data-scrolled", "false");

    setScrollY(80);
    fireEvent.scroll(window);
    expect(header).toHaveAttribute("data-scrolled", "true");

    setScrollY(10);
    fireEvent.scroll(window);
    expect(header).toHaveAttribute("data-scrolled", "false");
  });

  it("даёт бургеру подпись и связь с оверлеем", () => {
    render(<Header />);
    const burger = screen.getByRole("button", { name: "Открыть меню" });

    expect(burger).toHaveAttribute("aria-expanded", "false");
    expect(burger).toHaveAttribute("aria-controls", "mobile-menu");
    expect(burger).toHaveAttribute("type", "button");
  });
});

describe("Header: десктопная навигация", () => {
  const defaultMatchMedia = window.matchMedia;
  let notify: IntersectionObserverCallback | null = null;

  /** matchMedia, который отвечает `true` только на запросы из `truthy`. */
  function mockMatchMedia(truthy: string) {
    window.matchMedia = ((query: string) => ({
      matches: query.includes(truthy),
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })) as unknown as typeof window.matchMedia;
  }

  function enters(id: string) {
    const target = document.getElementById(id);
    if (!target || !notify) {
      throw new Error(`Нет цели #${id} или наблюдателя`);
    }

    const rect = target.getBoundingClientRect();
    const callback = notify;
    act(() =>
      callback(
        [
          {
            target,
            isIntersecting: true,
            intersectionRatio: 0.05,
            boundingClientRect: rect,
            intersectionRect: rect,
            rootBounds: null,
            time: 0,
          },
        ],
        null as unknown as IntersectionObserver,
      ),
    );
  }

  beforeEach(() => {
    notify = null;
    mockMatchMedia("min-width: 768px");

    class ObserverSpy {
      constructor(callback: IntersectionObserverCallback) {
        notify = callback;
      }
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
      takeRecords = () => [];
    }

    vi.stubGlobal("IntersectionObserver", ObserverSpy);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    window.matchMedia = defaultMatchMedia;
    document.querySelectorAll("body > section").forEach((section) => section.remove());
  });

  it("наблюдает за секциями только на широком экране", () => {
    addSection("about", 1200);
    render(<Header />);
    expect(notify).not.toBeNull();

    notify = null;
    mockMatchMedia("(никогда не совпадёт)");
    render(<Header />);
    expect(notify).toBeNull();
  });

  it("помечает aria-current пункт секции, на которую смотрит посетитель", () => {
    addSection("about", 1200);
    addSection("involve", 2400);
    render(<Header />);

    const about = screen.getByRole("link", { name: "Что это?" });
    const involve = screen.getByRole("link", { name: "Участвовать" });
    expect(about).not.toHaveAttribute("aria-current");

    enters("about");
    expect(about).toHaveAttribute("aria-current", "true");
    expect(involve).not.toHaveAttribute("aria-current");

    enters("involve");
    expect(about).toHaveAttribute("aria-current", "true");
    expect(involve).not.toHaveAttribute("aria-current");
  });
});

describe("Header: мобильный оверлей", () => {
  const scrollTo = vi.mocked(window.scrollTo);

  function openMenu() {
    const burger = screen.getByRole("button", { name: "Открыть меню" });
    fireEvent.click(burger);
    return burger;
  }

  function overlay() {
    return within(screen.getByRole("banner")).getByRole("dialog", { hidden: true });
  }

  beforeEach(() => {
    scrollTo.mockClear();
    document.body.style.overflow = "scroll";
  });

  afterEach(() => {
    document.body.style.overflow = "";
    document.querySelectorAll("body > section").forEach((section) => section.remove());
  });

  it("держит оверлей внутри ландмарки banner", () => {
    render(<Header />);

    expect(overlay()).toHaveAttribute("id", "mobile-menu");
  });

  it("не объявляет оверлей модальным: кнопка закрытия лежит снаружи диалога", () => {
    render(<Header />);
    openMenu();

    expect(screen.getByRole("dialog", { name: "Меню" })).not.toHaveAttribute("aria-modal");
  });

  it("выключает остальную страницу из обхода, пока оверлей открыт", () => {
    const page = document.createElement("main");
    page.textContent = "Контент страницы";
    const { container } = render(<Header />);
    container.append(page);

    openMenu();
    expect(page).toHaveAttribute("inert");

    fireEvent.keyDown(document, { key: "Escape" });
    expect(page).not.toHaveAttribute("inert");
  });

  it("прячет закрытый оверлей от скринридера и клавиатуры", () => {
    render(<Header />);

    expect(overlay()).toHaveAttribute("aria-hidden", "true");
    expect(overlay()).toHaveAttribute("inert");
  });

  it("открывает меню кнопкой, блокирует скролл и уводит фокус в оверлей", () => {
    render(<Header />);
    openMenu();

    const dialog = screen.getByRole("dialog", { name: "Меню" });
    expect(screen.getByRole("button", { name: "Закрыть меню" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(document.body.style.overflow).toBe("hidden");
    expect(dialog).toHaveAttribute("aria-hidden", "false");
    expect(dialog).not.toHaveAttribute("inert");
    expect(document.activeElement).toBe(within(dialog).getAllByRole("link")[0]);
  });

  it("закрывает меню по Escape и возвращает фокус на бургер", () => {
    render(<Header />);
    const burger = openMenu();

    fireEvent.keyDown(document, { key: "Escape" });

    expect(burger).toHaveAttribute("aria-expanded", "false");
    expect(document.activeElement).toBe(burger);
    expect(document.body.style.overflow).toBe("scroll");
  });

  it("закрывает меню кликом по фону оверлея", () => {
    render(<Header />);
    const burger = openMenu();

    fireEvent.click(overlay());

    expect(burger).toHaveAttribute("aria-expanded", "false");
  });

  it("по клику на пункт оверлея закрывает меню и прокручивает к секции", () => {
    addSection("involve", 900);
    render(<Header />);
    const burger = openMenu();

    fireEvent.click(within(screen.getByRole("dialog", { name: "Меню" })).getByText("Участвовать"));

    expect(burger).toHaveAttribute("aria-expanded", "false");
    // Первый вызов возвращает страницу с зафиксированной позиции, второй ведёт к секции.
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 800, behavior: "smooth" });
  });

  it("замыкает фокус по кругу между ссылками оверлея и бургером", () => {
    render(<Header />);
    const burger = openMenu();
    const links = within(screen.getByRole("dialog", { name: "Меню" })).getAllByRole("link");
    const lastLink = links[links.length - 1];

    lastLink.focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(document.activeElement).toBe(burger);

    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(lastLink);
  });

  it("закрывает меню, когда экран становится десктопным", () => {
    const defaultMatchMedia = window.matchMedia;
    const listeners = new Set<(event: MediaQueryListEvent) => void>();
    let desktop = false;

    window.matchMedia = ((query: string) => ({
      get matches() {
        return query.includes("min-width: 768px") ? desktop : false;
      },
      media: query,
      onchange: null,
      addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) =>
        listeners.add(listener),
      removeEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) =>
        listeners.delete(listener),
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia;

    try {
      render(<Header />);
      const burger = openMenu();
      expect(burger).toHaveAttribute("aria-expanded", "true");

      act(() => {
        desktop = true;
        listeners.forEach((listener) =>
          listener({ matches: true, media: "(min-width: 768px)" } as MediaQueryListEvent),
        );
      });

      expect(burger).toHaveAttribute("aria-expanded", "false");
      expect(document.body.style.overflow).toBe("scroll");
    } finally {
      window.matchMedia = defaultMatchMedia;
    }
  });
});
