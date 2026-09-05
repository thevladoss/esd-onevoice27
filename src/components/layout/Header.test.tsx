import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HEADER_OFFSET_FALLBACK } from "../../lib/headerOffset";
import { Header } from "./Header";

/* Стили шапки читаются с диска: vitest настроен с css: false, поэтому импорт
   CSS-модуля отдал бы пустую строку (тот же приём, что в motionPolicy.test.ts). */
const HEADER_CSS = readFileSync(
  resolve(process.cwd(), "src/components/layout/Header.css"),
  "utf8",
);

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
    expect(scrollTo).toHaveBeenCalledWith({
      top: 1200 - HEADER_OFFSET_FALLBACK,
      behavior: "smooth",
    });
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

  it("собирает пилюлю из контейнера, вордмарка и обёртки бургера", () => {
    render(<Header />);
    const header = screen.getByRole("banner");
    const content = header.querySelector(".site-header__content");

    expect(header).toHaveClass("site-header");
    expect(content).not.toBeNull();
    expect(content?.querySelector(".site-header__brand")).not.toBeNull();
    // Бургер прячет CSS с 1024px, поэтому в jsdom проверяется обёртка-колонка.
    expect(content?.querySelector(".site-header__toggler .burger")).not.toBeNull();
  });

  it("заворачивает подпись пункта в span: по нему едет градиент", () => {
    render(<Header />);
    const nav = screen.getByRole("navigation", { name: "Основная навигация" });
    const links = within(nav).getAllByRole("link");

    expect(nav).toHaveClass("site-nav");
    for (const link of links) {
      expect(link).toHaveClass("site-nav__link");
      expect(link.firstElementChild?.tagName).toBe("SPAN");
      expect(link.firstElementChild?.textContent).toBe(link.textContent);
    }
  });

  it("красит вордмарк шапки однотонным, без градиента футера", () => {
    render(<Header />);
    const brand = screen.getByRole("link", { name: "Единый голос 27, на главную" });

    expect(within(brand).getByText("Единый голос 27")).not.toHaveClass("text-gradient-brand");
  });

  it("прячет шапку при прокрутке вниз и возвращает при прокрутке вверх", () => {
    // Кадр анимации выполняется сразу: отрисовки, которая его запустила бы, в
    // jsdom нет.
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    });
    vi.stubGlobal("cancelAnimationFrame", vi.fn());

    try {
      render(<Header />);
      const header = screen.getByRole("banner");

      expect(header).not.toHaveClass("is-header-hidden");

      setScrollY(400);
      fireEvent.scroll(window);
      expect(header).toHaveClass("is-header-hidden");

      setScrollY(200);
      fireEvent.scroll(window);
      expect(header).not.toHaveClass("is-header-hidden");
    } finally {
      vi.unstubAllGlobals();
      setScrollY(0);
    }
  });

  it("возвращает шапку на экран, когда меню открывают из спрятанного состояния", () => {
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    });
    vi.stubGlobal("cancelAnimationFrame", vi.fn());

    try {
      render(<Header />);
      const header = screen.getByRole("banner");

      setScrollY(400);
      fireEvent.scroll(window);
      expect(header).toHaveClass("is-header-hidden");

      fireEvent.click(screen.getByRole("button", { name: "Открыть меню" }));

      // Оверлей фиксирован внутри шапки: пока на ландмарке висит transform, меню
      // считает координаты от коробки пилюли, а не от вьюпорта.
      expect(header).not.toHaveClass("is-header-hidden");
      expect(header).toHaveClass("is-menu-open");
    } finally {
      vi.unstubAllGlobals();
      setScrollY(0);
    }
  });

  it("возвращает спрятанную шапку, когда фокус попадает на её ссылку", () => {
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    });
    vi.stubGlobal("cancelAnimationFrame", vi.fn());

    try {
      render(<Header />);
      const header = screen.getByRole("banner");

      setScrollY(400);
      fireEvent.scroll(window);
      expect(header).toHaveClass("is-header-hidden");

      // Спрятанная шапка остаётся в обходе Tab: кольцо фокуса рисовалось бы за
      // верхней границей экрана при нулевой прозрачности.
      act(() => screen.getByRole("link", { name: "Единый голос 27, на главную" }).focus());

      expect(header).not.toHaveClass("is-header-hidden");
    } finally {
      vi.unstubAllGlobals();
      setScrollY(0);
    }
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
    mockMatchMedia("min-width: 1024px");

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

  it("переключает состояние классами: is-open у оверлея, is-menu-open у шапки", () => {
    render(<Header />);
    const header = screen.getByRole("banner");

    expect(header).not.toHaveClass("is-menu-open");
    expect(overlay()).not.toHaveClass("is-open");

    const burger = openMenu();
    // Крест бургера и видимость оверлея CSS ловит именно по этим классам.
    expect(header).toHaveClass("is-menu-open");
    expect(overlay()).toHaveClass("is-open");

    fireEvent.click(burger);
    expect(header).not.toHaveClass("is-menu-open");
    expect(overlay()).not.toHaveClass("is-open");
  });

  it("рисует бургер тремя линиями иконки 64×28, скрытой от скринридера", () => {
    render(<Header />);
    const icon = screen.getByRole("button", { name: "Открыть меню" }).querySelector("svg");

    expect(icon).toHaveAttribute("viewBox", "0 0 64 28");
    expect(icon).toHaveAttribute("aria-hidden", "true");
    expect(icon).toHaveAttribute("focusable", "false");
    expect(icon?.querySelectorAll("rect")).toHaveLength(3);
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
    expect(scrollTo).toHaveBeenLastCalledWith({
      top: 900 - HEADER_OFFSET_FALLBACK,
      behavior: "smooth",
    });
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
    let wide = false;

    window.matchMedia = ((query: string) => ({
      get matches() {
        return query.includes("min-width: 1024px") ? wide : false;
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
        wide = true;
        listeners.forEach((listener) =>
          listener({ matches: true, media: "(min-width: 1024px)" } as MediaQueryListEvent),
        );
      });

      expect(burger).toHaveAttribute("aria-expanded", "false");
      expect(document.body.style.overflow).toBe("scroll");
    } finally {
      window.matchMedia = defaultMatchMedia;
    }
  });
});

describe("Header: переходы и клавиатура через user-event", () => {
  const scrollTo = vi.mocked(window.scrollTo);
  const defaultMatchMedia = window.matchMedia;

  /** matchMedia, который отвечает на запрос уменьшенного движения заданным значением. */
  function stubReducedMotion(reduced: boolean) {
    window.matchMedia = ((query: string) => ({
      matches: query.includes("prefers-reduced-motion") ? reduced : false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })) as unknown as typeof window.matchMedia;
  }

  function openMenu() {
    return screen.getByRole("button", { name: "Открыть меню" });
  }

  beforeEach(() => {
    scrollTo.mockClear();
    setScrollY(0);
    document.body.style.overflow = "";
  });

  afterEach(() => {
    window.matchMedia = defaultMatchMedia;
    document.body.style.overflow = "";
    document.querySelectorAll("body > section").forEach((section) => section.remove());
    history.pushState(null, "", location.pathname);
  });

  it("ведёт к секции плавно, пока движение разрешено", async () => {
    const user = userEvent.setup();
    stubReducedMotion(false);
    addSection("about", 1200);
    render(<Header />);

    await user.click(screen.getByRole("link", { name: "Что это?" }));

    expect(scrollTo).toHaveBeenCalledTimes(1);
    expect(scrollTo).toHaveBeenCalledWith(
      expect.objectContaining({
        top: expect.any(Number),
        behavior: expect.stringMatching(/^(smooth|auto)$/),
      }),
    );
    expect(scrollTo).toHaveBeenCalledWith(expect.objectContaining({ behavior: "smooth" }));
  });

  it("убирает плавность, когда система просит уменьшить движение", async () => {
    const user = userEvent.setup();
    stubReducedMotion(true);
    addSection("involve", 900);
    render(<Header />);

    await user.click(screen.getByRole("link", { name: "Участвовать" }));

    expect(scrollTo).toHaveBeenCalledWith(
      expect.objectContaining({ top: 900 - HEADER_OFFSET_FALLBACK, behavior: "auto" }),
    );
  });

  it("открывает оверлей бургером и замораживает страницу", async () => {
    const user = userEvent.setup();
    render(<Header />);
    const burger = openMenu();

    expect(burger).toHaveAttribute("aria-expanded", "false");
    expect(burger).toHaveAttribute("aria-controls", "mobile-menu");

    await user.click(burger);

    expect(screen.getByRole("button", { name: "Закрыть меню" })).toBe(burger);
    expect(burger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("dialog", { name: "Меню" })).toHaveAttribute("id", "mobile-menu");
    expect(document.body.style.overflow).toBe("hidden");
  });

  it("закрывает оверлей по Escape, возвращает фокус на бургер и отдаёт скролл", async () => {
    const user = userEvent.setup();
    render(<Header />);
    const burger = openMenu();

    await user.click(burger);
    await user.keyboard("{Escape}");

    expect(burger).toHaveAttribute("aria-expanded", "false");
    expect(burger).toHaveFocus();
    expect(document.body.style.overflow).toBe("");
  });

  it("по пункту оверлея закрывает меню и уводит к секции", async () => {
    const user = userEvent.setup();
    addSection("news", 2000);
    render(<Header />);
    const burger = openMenu();

    await user.click(burger);
    const dialog = screen.getByRole("dialog", { name: "Меню" });
    await user.click(within(dialog).getByRole("link", { name: "Новости" }));

    expect(burger).toHaveAttribute("aria-expanded", "false");
    // Первым вызовом снимается заморозка страницы, вторым идёт переход к секции.
    expect(scrollTo).toHaveBeenLastCalledWith(
      expect.objectContaining({ top: 2000 - HEADER_OFFSET_FALLBACK, behavior: "smooth" }),
    );
    expect(document.body.style.overflow).toBe("");
  });
});

describe("Header: контракт стилей пилюли", () => {
  it("гасит переход шапки, пока открыто меню", () => {
    // Оверлей меню фиксирован внутри ландмарки: анимированный transform на ней
    // все 420 мс держал бы меню в коробке пилюли.
    expect(HEADER_CSS).toMatch(/\.site-header\.is-menu-open \{[^}]*transition: none;/);
  });

  it("выводит спрятанную шапку на экран, пока фокус внутри неё", () => {
    expect(HEADER_CSS).toMatch(
      /\.site-header\.is-header-hidden:focus-within \{[^}]*transform: none;[^}]*opacity: 1;/,
    );
  });

  it("не заводит на пилюле backdrop root: стекло и оверлей видят страницу под собой", () => {
    expect(HEADER_CSS).not.toMatch(/\.site-header__content \{[^}]*isolation:/);
    expect(HEADER_CSS).toMatch(/backdrop-filter: blur\(18px\) saturate\(135%\);/);
  });

  it("держит бургер над оверлеем внутри стекового контекста ландмарки", () => {
    expect(HEADER_CSS).toMatch(/\.site-header \{[^}]*z-index: 40;/);
    expect(HEADER_CSS).toMatch(/\.site-header__toggler \{[^}]*z-index: 42;/);
    expect(HEADER_CSS).toMatch(/\.mobile-menu \{[^}]*z-index: 40;/);
    // Рамка и стекло пилюли остаются под контентом: у обоих псевдоэлементов
    // отрицательный z-index.
    expect(HEADER_CSS).toMatch(/\.site-header__content::after \{\s*z-index: -1;/);
  });
});
