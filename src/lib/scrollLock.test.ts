import { isProgrammaticScroll } from "./programmaticScroll";
import { lockScroll, unlockScroll } from "./scrollLock";

function setScrollY(value: number) {
  Object.defineProperty(window, "scrollY", { value, writable: true, configurable: true });
}

describe("scrollLock", () => {
  const scrollTo = vi.mocked(window.scrollTo);

  beforeEach(() => {
    scrollTo.mockClear();
    setScrollY(0);
    document.body.removeAttribute("style");
  });

  afterEach(() => {
    unlockScroll();
    document.body.removeAttribute("style");
  });

  it("фиксирует body на текущей позиции", () => {
    setScrollY(640);
    lockScroll();

    expect(document.body.style.overflow).toBe("hidden");
    expect(document.body.style.position).toBe("fixed");
    expect(document.body.style.top).toBe("-640px");
    expect(document.body.style.width).toBe("100%");
  });

  it("отмечает возврат позиции программной прокруткой", () => {
    setScrollY(640);
    lockScroll();
    expect(isProgrammaticScroll()).toBe(false);

    // Прыжок обратно на 640px без отметки хук скрытия шапки прочёл бы как жест вниз.
    unlockScroll();
    expect(isProgrammaticScroll()).toBe(true);
  });

  it("возвращает прежние стили и позицию прокрутки", () => {
    document.body.style.overflow = "scroll";
    setScrollY(640);

    lockScroll();
    unlockScroll();

    expect(document.body.style.overflow).toBe("scroll");
    expect(document.body.style.position).toBe("");
    expect(document.body.style.top).toBe("");
    expect(scrollTo).toHaveBeenCalledWith({ top: 640, behavior: "auto" });
  });

  it("не блокирует дважды и не разблокирует без блокировки", () => {
    setScrollY(300);
    lockScroll();
    setScrollY(0);
    lockScroll();
    unlockScroll();

    expect(scrollTo).toHaveBeenCalledTimes(1);
    expect(scrollTo).toHaveBeenCalledWith({ top: 300, behavior: "auto" });

    unlockScroll();
    expect(scrollTo).toHaveBeenCalledTimes(1);
  });
});
