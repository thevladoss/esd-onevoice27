import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { generateLights } from "../../data/lights";
import { REDUCED_MOTION_QUERY } from "../../lib/useReducedMotion";
import { LightsProvider, useLights } from "../../state/lights";
import { Counters } from "./Counters";

const originalMatchMedia = window.matchMedia;
const originalObserver = window.IntersectionObserver;

function stubMatchMedia(reduced: boolean): void {
  window.matchMedia = vi.fn((query: string) => ({
    matches: query === REDUCED_MOTION_QUERY ? reduced : false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

/** Наблюдатель, который сразу сообщает о пересечении: счётчик стартует без прокрутки. */
function stubIntersectingObserver(): void {
  class ObserverStub {
    private readonly callback: IntersectionObserverCallback;

    constructor(callback: IntersectionObserverCallback) {
      this.callback = callback;
    }

    observe(target: Element): void {
      this.callback(
        [{ isIntersecting: true, target } as IntersectionObserverEntry],
        this as unknown as IntersectionObserver,
      );
    }

    unobserve(): void {}

    disconnect(): void {}

    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  }

  vi.stubGlobal("IntersectionObserver", ObserverStub);
}

/** Кадр анимации это таймер на 16ms: фейковые таймеры доводят счёт до конца. */
function mockFrames() {
  const raf = vi
    .spyOn(window, "requestAnimationFrame")
    .mockImplementation(
      (callback: FrameRequestCallback) =>
        window.setTimeout(() => callback(Date.now()), 16) as unknown as number,
    );
  vi.spyOn(window, "cancelAnimationFrame").mockImplementation((id: number) => {
    window.clearTimeout(id);
  });

  return raf;
}

function AddGroupButton() {
  const { addLight } = useLights();

  return (
    <button type="button" onClick={() => addLight({ type: "group", countryId: 643 })}>
      Зажечь групповой огонёк
    </button>
  );
}

function renderCounters(people = 1150, groups = 12) {
  return render(
    <LightsProvider initialLights={generateLights(27, people, groups)}>
      <Counters />
      <AddGroupButton />
    </LightsProvider>,
  );
}

function visibleValue(container: HTMLElement, card: string): string | null {
  const node = container.querySelector(`.${card} .counter__value span[aria-hidden="true"]`);

  return node?.textContent ?? null;
}

function liveValue(container: HTMLElement, card: string): string | null {
  const node = container.querySelector(`.${card} .counter__value [aria-live="polite"]`);

  return node?.textContent ?? null;
}

afterEach(() => {
  window.matchMedia = originalMatchMedia;
  vi.stubGlobal("IntersectionObserver", originalObserver);
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("Counters", () => {
  it("при prefers-reduced-motion показывает конечные значения без анимации", () => {
    stubMatchMedia(true);
    const raf = mockFrames();

    const { container } = renderCounters();

    expect(visibleValue(container, "counter--people")).toBe("1\u202F150");
    expect(visibleValue(container, "counter--groups")).toBe("12");
    expect(raf).not.toHaveBeenCalled();
  });

  it("держит ноль до появления в вьюпорте, но объявляет конечное значение", () => {
    const { container } = renderCounters();

    expect(visibleValue(container, "counter--people")).toBe("0");
    expect(liveValue(container, "counter--people")).toBe("1\u202F150");
  });

  it("досчитывает до цели за 1600ms после появления в вьюпорте", () => {
    vi.useFakeTimers();
    stubIntersectingObserver();
    mockFrames();

    const { container } = renderCounters();
    act(() => {
      vi.advanceTimersByTime(1700);
    });

    expect(visibleValue(container, "counter--people")).toBe("1\u202F150");
    expect(visibleValue(container, "counter--groups")).toBe("12");
  });

  it("сохраняет подписи, классы карточек и два объявления для скринридера", () => {
    const { container } = renderCounters();

    expect(screen.getByText("ЧЕЛОВЕК")).toBeInTheDocument();
    expect(screen.getByText("ГРУПП")).toBeInTheDocument();
    expect(container.querySelectorAll(".counter--people")).toHaveLength(1);
    expect(container.querySelectorAll(".counter--groups")).toHaveLength(1);
    expect(container.querySelectorAll('[aria-live="polite"]')).toHaveLength(2);
  });

  it("показывает новый огонёк сразу после добавления", () => {
    stubMatchMedia(true);
    const { container } = renderCounters();

    fireEvent.click(screen.getByRole("button", { name: "Зажечь групповой огонёк" }));

    expect(visibleValue(container, "counter--groups")).toBe("13");
  });
});
