import { fireEvent, render, screen, within } from "@testing-library/react";
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
