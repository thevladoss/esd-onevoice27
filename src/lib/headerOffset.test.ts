import { HEADER_OFFSET_FALLBACK, headerOffset } from "./headerOffset";

describe("headerOffset", () => {
  afterEach(() => {
    document.documentElement.style.removeProperty("--header-offset");
  });

  it("берёт значение из CSS-переменной --header-offset", () => {
    document.documentElement.style.setProperty("--header-offset", "132px");

    expect(headerOffset()).toBe(132);
  });

  it("отдаёт запасное значение, когда переменной нет", () => {
    expect(headerOffset()).toBe(HEADER_OFFSET_FALLBACK);
  });
});
