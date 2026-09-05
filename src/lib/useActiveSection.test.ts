import { act, renderHook } from "@testing-library/react";
import { useActiveSection } from "./useActiveSection";

const ids = ["about", "involve", "news"] as const;

describe("useActiveSection", () => {
  let observe: ReturnType<typeof vi.fn>;
  let disconnect: ReturnType<typeof vi.fn>;
  let constructed: number;
  let notify: IntersectionObserverCallback | null;

  /** Запись наблюдателя: хуку важны только цель и признак попадания в полосу. */
  function entry(
    id: string,
    isIntersecting: boolean,
    intersectionRatio = 0,
  ): IntersectionObserverEntry {
    const target = document.getElementById(id);
    if (!target) {
      throw new Error(`Секции #${id} нет в документе`);
    }

    const rect = target.getBoundingClientRect();
    return {
      target,
      isIntersecting,
      intersectionRatio,
      boundingClientRect: rect,
      intersectionRect: rect,
      rootBounds: null,
      time: 0,
    };
  }

  function emit(...entries: IntersectionObserverEntry[]) {
    if (!notify) {
      throw new Error("Наблюдатель не создан: колбэк дёргать нечем");
    }
    const callback = notify;
    act(() => callback(entries, null as unknown as IntersectionObserver));
  }

  beforeEach(() => {
    observe = vi.fn();
    disconnect = vi.fn();
    constructed = 0;
    notify = null;

    class ObserverSpy {
      constructor(callback: IntersectionObserverCallback) {
        constructed += 1;
        notify = callback;
      }
      observe = observe;
      unobserve = vi.fn();
      disconnect = disconnect;
      takeRecords = () => [];
    }

    vi.stubGlobal("IntersectionObserver", ObserverSpy);
    ids.forEach((id) => {
      const section = document.createElement("section");
      section.id = id;
      document.body.appendChild(section);
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    document.body.innerHTML = "";
  });

  it("не создаёт наблюдателя и отдаёт null, пока выключен", () => {
    const { result } = renderHook(() => useActiveSection(ids, false));

    expect(result.current).toBeNull();
    expect(constructed).toBe(0);
  });

  it("наблюдает за каждой секцией из списка, когда включён", () => {
    renderHook(() => useActiveSection(ids, true));

    expect(constructed).toBe(1);
    expect(observe).toHaveBeenCalledTimes(ids.length);
  });

  it("отключает наблюдателя при размонтировании", () => {
    const { unmount } = renderHook(() => useActiveSection(ids, true));
    unmount();

    expect(disconnect).toHaveBeenCalledTimes(1);
  });

  it("подсвечивает секцию, попавшую в полосу внимания", () => {
    const { result } = renderHook(() => useActiveSection(ids, true));

    emit(entry("involve", true));

    expect(result.current).toBe("involve");
  });

  it("выбирает верхнюю по документу секцию, а не самую крупную по площади", () => {
    const { result } = renderHook(() => useActiveSection(ids, true));

    // Короткая секция закрывает полосу целиком (ratio 1), длинная даёт 0.05.
    emit(entry("news", true, 1), entry("about", true, 0.05));

    expect(result.current).toBe("about");
  });

  it("помнит секции из прошлых батчей", () => {
    const { result } = renderHook(() => useActiveSection(ids, true));

    emit(entry("about", true));
    emit(entry("involve", true));
    expect(result.current).toBe("about");

    // В новом батче приходит только about: involve обязан остаться учтённым.
    emit(entry("about", false));
    expect(result.current).toBe("involve");
  });

  it("оставляет прежнюю секцию, когда полоса пуста", () => {
    const { result } = renderHook(() => useActiveSection(ids, true));

    emit(entry("news", true));
    emit(entry("news", false));

    expect(result.current).toBe("news");
  });
});
