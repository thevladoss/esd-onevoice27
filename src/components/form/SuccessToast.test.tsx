import { act, fireEvent, render } from "@testing-library/react";

import { SuccessToast } from "./SuccessToast";

function card(): HTMLElement | null {
  return document.querySelector<HTMLElement>(".lf-toast");
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("SuccessToast", () => {
  it("монтирует карточку только при open", () => {
    const { rerender } = render(<SuccessToast open={false} message="Готово" onClose={vi.fn()} />);
    expect(card()).toBeNull();

    rerender(<SuccessToast open message="Готово" onClose={vi.fn()} />);
    expect(card()).toHaveTextContent("Готово");
    expect(card()).toHaveAttribute("aria-hidden", "true");
  });

  it("не перезапускает автотаймер, когда у onClose меняется идентичность", () => {
    const onClose = vi.fn();
    const { rerender } = render(
      <SuccessToast open message="Готово" onClose={() => onClose()} />,
    );

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    // Инлайн-стрелка на каждом рендере: новая ссылка не должна сбрасывать отсчёт.
    rerender(<SuccessToast open message="Готово" onClose={() => onClose()} />);

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(card()).toHaveAttribute("data-state", "closing");

    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("доводит фазу ухода до конца, даже если родитель перерисовался", () => {
    const onClose = vi.fn();
    const { rerender } = render(
      <SuccessToast open message="Готово" onClose={() => onClose()} />,
    );

    fireEvent.click(card() as HTMLElement);
    expect(card()).toHaveAttribute("data-state", "closing");

    rerender(<SuccessToast open message="Готово" onClose={() => onClose()} />);

    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("снимает таймер ухода при размонтировании", () => {
    const onClose = vi.fn();
    const { unmount } = render(<SuccessToast open message="Готово" onClose={onClose} />);

    fireEvent.click(card() as HTMLElement);
    unmount();

    act(() => {
      vi.advanceTimersByTime(4200);
    });
    expect(onClose).not.toHaveBeenCalled();
  });
});
