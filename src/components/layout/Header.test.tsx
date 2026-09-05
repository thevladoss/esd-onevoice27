import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Header } from "./Header";

function addSection(id: string, offsetTop: number) {
  const section = document.createElement("section");
  section.id = id;
  Object.defineProperty(section, "offsetTop", { value: offsetTop, configurable: true });
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
    expect(scrollTo).toHaveBeenCalledWith({ top: 1184, behavior: "smooth" });
  });

  it("молчит по клику на пункт, у которого нет секции", async () => {
    const user = userEvent.setup();
    render(<Header />);

    await user.click(screen.getByRole("link", { name: "Новости" }));

    expect(scrollTo).not.toHaveBeenCalled();
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
    expect(overlay()).toHaveAttribute("aria-modal", "true");
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
    expect(scrollTo).toHaveBeenCalledTimes(1);
    expect(scrollTo).toHaveBeenCalledWith({ top: 884, behavior: "smooth" });
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
