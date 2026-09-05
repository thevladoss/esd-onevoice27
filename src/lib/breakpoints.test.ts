import { NAV_MIN_PX_FALLBACK, navMinPx, navQuery } from "./breakpoints";

describe("breakpoints", () => {
  afterEach(() => {
    document.documentElement.style.removeProperty("--breakpoint-nav");
  });

  it("берёт границу из CSS-переменной --breakpoint-nav", () => {
    document.documentElement.style.setProperty("--breakpoint-nav", "900px");

    expect(navMinPx()).toBe(900);
    expect(navQuery()).toBe("(min-width: 900px)");
  });

  it("отдаёт запасные 1024px, когда стили не подключены", () => {
    expect(navMinPx()).toBe(NAV_MIN_PX_FALLBACK);
    expect(navQuery()).toBe("(min-width: 1024px)");
  });
});
