import {
  isProgrammaticScroll,
  markProgrammaticScroll,
  resetProgrammaticScroll,
} from "./programmaticScroll";

describe("отметка программной прокрутки", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    resetProgrammaticScroll();
  });

  it("молчит, пока страница никуда себя не увозила", () => {
    expect(isProgrammaticScroll()).toBe(false);
  });

  it("держит окно 700 мс и отпускает сразу за ним", () => {
    const now = vi.spyOn(performance, "now").mockReturnValue(1000);

    markProgrammaticScroll();
    expect(isProgrammaticScroll()).toBe(true);

    now.mockReturnValue(1699);
    expect(isProgrammaticScroll()).toBe(true);

    now.mockReturnValue(1700);
    expect(isProgrammaticScroll()).toBe(false);
  });

  it("снимается сбросом: тесты идут быстрее окна", () => {
    vi.spyOn(performance, "now").mockReturnValue(1000);
    markProgrammaticScroll();

    resetProgrammaticScroll();

    expect(isProgrammaticScroll()).toBe(false);
  });
});
