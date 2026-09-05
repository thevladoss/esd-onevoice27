import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useCountUp } from "./useCountUp";

/** Кадр анимации это таймер на 16ms: фейковые таймеры двигают счётчик шаг за шагом. */
function mockFrames() {
  const raf = vi
    .spyOn(window, "requestAnimationFrame")
    .mockImplementation(
      (callback: FrameRequestCallback) =>
        window.setTimeout(() => callback(Date.now()), 16) as unknown as number,
    );
  const cancel = vi.spyOn(window, "cancelAnimationFrame").mockImplementation((id: number) => {
    window.clearTimeout(id);
  });

  return { raf, cancel };
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("useCountUp", () => {
  it("при prefers-reduced-motion отдаёт конечное значение без единого кадра", () => {
    const { raf } = mockFrames();

    const { result } = renderHook(() => useCountUp(1150, { reduced: true }));

    expect(result.current).toBe(1150);
    expect(raf).not.toHaveBeenCalled();
  });

  it("держит ноль, пока анимация не активирована", () => {
    const { raf } = mockFrames();

    const { result } = renderHook(() => useCountUp(1150, { active: false }));

    expect(result.current).toBe(0);
    expect(raf).not.toHaveBeenCalled();
  });

  it("растёт к цели и доходит до неё за 1600ms", () => {
    mockFrames();

    const { result } = renderHook(() => useCountUp(1150));

    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(result.current).toBeGreaterThan(0);
    expect(result.current).toBeLessThan(1150);

    const frames: number[] = [result.current];
    for (let step = 0; step < 13; step += 1) {
      act(() => {
        vi.advanceTimersByTime(100);
      });
      frames.push(result.current);
    }

    expect(frames).toEqual([...frames].sort((a, b) => a - b));
    expect(result.current).toBe(1150);
  });

  it("после первой анимации показывает новое значение сразу", () => {
    const { raf } = mockFrames();

    const { result, rerender } = renderHook(({ target }) => useCountUp(target), {
      initialProps: { target: 1150 },
    });

    act(() => {
      vi.advanceTimersByTime(1700);
    });
    expect(result.current).toBe(1150);

    const framesPlayed = raf.mock.calls.length;
    rerender({ target: 1151 });

    expect(result.current).toBe(1151);
    expect(raf.mock.calls).toHaveLength(framesPlayed);
  });

  it("снимает кадр при размонтировании посреди анимации", () => {
    const { cancel } = mockFrames();

    const { unmount } = renderHook(() => useCountUp(1150));
    act(() => {
      vi.advanceTimersByTime(100);
    });
    unmount();

    expect(cancel).toHaveBeenCalled();
  });
});
