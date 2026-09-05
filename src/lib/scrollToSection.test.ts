import { HEADER_OFFSET_FALLBACK } from "./headerOffset";
import { isProgrammaticScroll } from "./programmaticScroll";
import { scrollToSection } from "./scrollToSection";

function setScrollY(value: number) {
  Object.defineProperty(window, "scrollY", { value, writable: true, configurable: true });
}

/** `documentTop` — позиция секции в координатах документа: rect.top + scrollY. */
function addSection(id: string, documentTop: number) {
  const section = document.createElement("section");
  section.id = id;
  section.getBoundingClientRect = () =>
    ({ top: documentTop - window.scrollY, bottom: 0, left: 0, right: 0, width: 0, height: 0, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect;
  document.body.appendChild(section);
  return section;
}

describe("scrollToSection", () => {
  const scrollTo = vi.mocked(window.scrollTo);
  const defaultMatchMedia = window.matchMedia;

  beforeEach(() => {
    scrollTo.mockClear();
    setScrollY(0);
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
    window.matchMedia = defaultMatchMedia;
  });

  it("отмечает переход программной прокруткой, чтобы шапка не уехала посреди него", () => {
    addSection("about", 1200);
    expect(isProgrammaticScroll()).toBe(false);

    scrollToSection("#about", 104);
    expect(isProgrammaticScroll()).toBe(true);
  });

  it("отмечает и возврат наверх по якорю #top", () => {
    scrollToSection("#top");

    expect(isProgrammaticScroll()).toBe(true);
  });

  it("не отмечает ничего, когда секции нет в документе", () => {
    expect(scrollToSection("#nowhere")).toBe(false);
    expect(isProgrammaticScroll()).toBe(false);
  });

  it("прокручивает к секции по формуле позиция минус отступ header", () => {
    addSection("about", 1200);

    expect(scrollToSection("#about", 104)).toBe(true);
    expect(scrollTo).toHaveBeenCalledTimes(1);
    expect(scrollTo).toHaveBeenCalledWith({ top: 1096, behavior: "smooth" });
  });

  it("считает позицию от документа, а не от вьюпорта: учитывает текущий scrollY", () => {
    setScrollY(2000);
    addSection("about", 3000);

    expect(scrollToSection("#about", 104)).toBe(true);
    expect(scrollTo).toHaveBeenCalledWith({ top: 2896, behavior: "smooth" });
  });

  it("обрезает отрицательный результат до нуля", () => {
    addSection("about", 40);

    expect(scrollToSection("#about", 104)).toBe(true);
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
  });

  it("молча выходит, когда цели нет в документе", () => {
    const hashBefore = window.location.hash;
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const consoleWarn = vi.spyOn(console, "warn").mockImplementation(() => {});

    expect(scrollToSection("#missing", 104)).toBe(false);
    expect(scrollTo).not.toHaveBeenCalled();
    expect(window.location.hash).toBe(hashBefore);
    expect(consoleError).not.toHaveBeenCalled();
    expect(consoleWarn).not.toHaveBeenCalled();
  });

  it("для якоря #top прокручивает страницу в самый верх", () => {
    expect(scrollToSection("#top", 104)).toBe(true);
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
  });

  it("переключает behavior на auto при prefers-reduced-motion", () => {
    // Свойство подменяется целиком: vi.spyOn поверх мока из setup.ts вернул бы
    // тот же мок и затёр бы его реализацию для остальных тестов.
    window.matchMedia = ((query: string) => ({
      matches: query.includes("prefers-reduced-motion"),
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })) as unknown as typeof window.matchMedia;
    addSection("about", 1200);

    expect(scrollToSection("#about", 104)).toBe(true);
    expect(scrollTo).toHaveBeenCalledWith({ top: 1096, behavior: "auto" });
  });

  it("работает без ведущего символа решётки", () => {
    addSection("news", 600);

    expect(scrollToSection("news", 100)).toBe(true);
    expect(scrollTo).toHaveBeenCalledWith({ top: 500, behavior: "smooth" });
  });

  it("без второго аргумента берёт отступ из --header-offset", () => {
    addSection("about", 1200);
    document.documentElement.style.setProperty("--header-offset", "140px");

    expect(scrollToSection("#about")).toBe(true);
    expect(scrollTo).toHaveBeenCalledWith({ top: 1060, behavior: "smooth" });

    document.documentElement.style.removeProperty("--header-offset");
    scrollTo.mockClear();
    expect(scrollToSection("#about")).toBe(true);
    expect(scrollTo).toHaveBeenCalledWith({
      top: 1200 - HEADER_OFFSET_FALLBACK,
      behavior: "smooth",
    });
  });
});
