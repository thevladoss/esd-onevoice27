import { DESKTOP_MIN_PX_FALLBACK, desktopMinPx, desktopQuery } from "./breakpoints";

describe("breakpoints", () => {
  afterEach(() => {
    document.documentElement.style.removeProperty("--breakpoint-desktop");
  });

  it("берёт границу из CSS-переменной --breakpoint-desktop", () => {
    document.documentElement.style.setProperty("--breakpoint-desktop", "900px");

    expect(desktopMinPx()).toBe(900);
    expect(desktopQuery()).toBe("(min-width: 900px)");
  });

  it("отдаёт запасные 768px, когда стили не подключены", () => {
    expect(desktopMinPx()).toBe(DESKTOP_MIN_PX_FALLBACK);
    expect(desktopQuery()).toBe("(min-width: 768px)");
  });
});
