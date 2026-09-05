import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  REDUCED_MOTION_QUERY,
  prefersReducedMotion,
  usePrefersReducedMotion,
} from "./useReducedMotion";

const originalMatchMedia = window.matchMedia;

function stubMatchMedia(matches: boolean): void {
  window.matchMedia = vi.fn((query: string) => ({
    matches: query === REDUCED_MOTION_QUERY ? matches : false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

afterEach(() => {
  window.matchMedia = originalMatchMedia;
});

describe("usePrefersReducedMotion", () => {
  it("возвращает true, когда система просит меньше движения", () => {
    stubMatchMedia(true);

    expect(renderHook(() => usePrefersReducedMotion()).result.current).toBe(true);
    expect(prefersReducedMotion()).toBe(true);
  });

  it("возвращает false, когда ограничения нет", () => {
    stubMatchMedia(false);

    expect(renderHook(() => usePrefersReducedMotion()).result.current).toBe(false);
    expect(prefersReducedMotion()).toBe(false);
  });
});
