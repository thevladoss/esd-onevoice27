import { renderHook } from "@testing-library/react";
import { useActiveSection } from "./useActiveSection";

const ids = ["about", "involve"] as const;

describe("useActiveSection", () => {
  let observe: ReturnType<typeof vi.fn>;
  let disconnect: ReturnType<typeof vi.fn>;
  let constructed: number;

  beforeEach(() => {
    observe = vi.fn();
    disconnect = vi.fn();
    constructed = 0;

    class ObserverSpy {
      constructor() {
        constructed += 1;
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
});
