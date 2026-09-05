import { renderHook } from "@testing-library/react";
import type { Mock } from "vitest";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useInViewOnce } from "./useInViewOnce";

interface ObserverSpy {
  constructed: number;
  options: IntersectionObserverInit | undefined;
  observe: Mock<(target: Element) => void>;
  disconnect: Mock<() => void>;
}

/** Подменяет глобальный IntersectionObserver: `intersecting = null` значит «коллбэк не вызывается». */
function stubObserver(intersecting: boolean | null): ObserverSpy {
  const spy: ObserverSpy = {
    constructed: 0,
    options: undefined,
    observe: vi.fn<(target: Element) => void>(),
    disconnect: vi.fn<() => void>(),
  };

  class ObserverStub {
    private readonly callback: IntersectionObserverCallback;

    constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
      this.callback = callback;
      spy.constructed += 1;
      spy.options = options;
    }

    observe(target: Element): void {
      spy.observe(target);
      if (intersecting === null) {
        return;
      }

      this.callback(
        [{ isIntersecting: intersecting, target } as IntersectionObserverEntry],
        this as unknown as IntersectionObserver,
      );
    }

    unobserve(): void {}

    disconnect(): void {
      spy.disconnect();
    }

    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  }

  vi.stubGlobal("IntersectionObserver", ObserverStub);
  return spy;
}

function elementRef() {
  return { current: document.createElement("div") };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useInViewOnce", () => {
  it("считает элемент видимым, когда IntersectionObserver недоступен", () => {
    vi.stubGlobal("IntersectionObserver", undefined);
    const ref = elementRef();

    const { result } = renderHook(() => useInViewOnce(ref));

    expect(result.current).toBe(true);
  });

  it("срабатывает при пересечении и сразу отключает наблюдателя", () => {
    const spy = stubObserver(true);
    const ref = elementRef();

    const { result } = renderHook(() => useInViewOnce(ref));

    expect(result.current).toBe(true);
    expect(spy.observe).toHaveBeenCalledTimes(1);
    expect(spy.disconnect).toHaveBeenCalledTimes(1);
  });

  it("молчит, пока элемент не пересёк порог 0.4", () => {
    const spy = stubObserver(false);
    const ref = elementRef();

    const { result } = renderHook(() => useInViewOnce(ref));

    expect(result.current).toBe(false);
    expect(spy.disconnect).not.toHaveBeenCalled();
    expect(spy.constructed).toBe(1);
    expect(spy.options).toEqual({ threshold: 0.4 });
  });
});
