import { act, renderHook } from "@testing-library/react";
import { markProgrammaticScroll } from "./programmaticScroll";
import { useHeaderHide } from "./useHeaderHide";

function setScrollY(value: number) {
  Object.defineProperty(window, "scrollY", { value, writable: true, configurable: true });
}

/** Прокрутка до позиции с событием, которое хук обрабатывает в кадре анимации. */
function scrollTo(value: number) {
  act(() => {
    setScrollY(value);
    window.dispatchEvent(new Event("scroll"));
  });
}

describe("useHeaderHide", () => {
  beforeEach(() => {
    setScrollY(0);
    // Кадр анимации выполняется сразу: иначе результат скролла пришлось бы ждать
    // отрисовки, которой в jsdom нет.
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    });
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    setScrollY(0);
  });

  it("прячет шапку при прокрутке вниз дальше порога", () => {
    const { result } = renderHook(() => useHeaderHide({ menuOpen: false }));

    expect(result.current).toBe(false);

    scrollTo(300);
    expect(result.current).toBe(true);
  });

  it("возвращает шапку при прокрутке вверх", () => {
    const { result } = renderHook(() => useHeaderHide({ menuOpen: false }));

    scrollTo(300);
    expect(result.current).toBe(true);

    scrollTo(100);
    expect(result.current).toBe(false);
  });

  it("держит шапку на первом экране, сколько бы ни листали вниз", () => {
    const { result } = renderHook(() => useHeaderHide({ menuOpen: false }));

    scrollTo(40);
    expect(result.current).toBe(false);

    scrollTo(70);
    expect(result.current).toBe(false);
  });

  it("не реагирует на дрожание в пару пикселей", () => {
    const { result } = renderHook(() => useHeaderHide({ menuOpen: false }));

    scrollTo(300);
    scrollTo(150);
    expect(result.current).toBe(false);

    scrollTo(152);
    expect(result.current).toBe(false);
  });

  it("не прячет шапку, пока идёт переход по пункту меню", () => {
    // Плавный переход шлёт десятки событий scroll: без окна молчания хук читал бы
    // их как жест вниз и убирал шапку посреди перехода.
    const now = vi.spyOn(performance, "now").mockReturnValue(0);

    try {
      const { result } = renderHook(() => useHeaderHide({ menuOpen: false }));

      markProgrammaticScroll();
      scrollTo(300);
      scrollTo(600);
      expect(result.current).toBe(false);

      // За окном молчания жест снова главный, и считается он от последней позиции.
      now.mockReturnValue(1000);
      scrollTo(900);
      expect(result.current).toBe(true);
    } finally {
      now.mockRestore();
    }
  });

  it("держит шапку на экране, пока открыто меню", () => {
    const { result, rerender } = renderHook(
      ({ menuOpen }: { menuOpen: boolean }) => useHeaderHide({ menuOpen }),
      { initialProps: { menuOpen: false } },
    );

    scrollTo(300);
    expect(result.current).toBe(true);

    rerender({ menuOpen: true });
    expect(result.current).toBe(false);

    scrollTo(600);
    expect(result.current).toBe(false);
  });

  it("после закрытия меню не прячет шапку задним числом", () => {
    const { result, rerender } = renderHook(
      ({ menuOpen }: { menuOpen: boolean }) => useHeaderHide({ menuOpen }),
      { initialProps: { menuOpen: false } },
    );

    scrollTo(300);
    rerender({ menuOpen: true });
    rerender({ menuOpen: false });

    expect(result.current).toBe(false);
  });

  it("возвращает спрятанную шапку на фокус внутри ландмарки", () => {
    const header = document.createElement("header");
    const link = document.createElement("a");
    link.href = "#top";
    header.append(link);
    document.body.append(header);
    const ref = { current: header };

    try {
      const { result } = renderHook(() => useHeaderHide({ menuOpen: false, header: ref }));

      scrollTo(300);
      expect(result.current).toBe(true);

      act(() => link.focus());
      expect(result.current).toBe(false);
    } finally {
      header.remove();
    }
  });

  it("снимает слушатель скролла при размонтировании", () => {
    const remove = vi.spyOn(window, "removeEventListener");
    const { unmount } = renderHook(() => useHeaderHide({ menuOpen: false }));

    unmount();

    expect(remove).toHaveBeenCalledWith("scroll", expect.any(Function));
    remove.mockRestore();
  });
});
