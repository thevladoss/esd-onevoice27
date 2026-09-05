import { describe, expect, it } from "vitest";

import { formatCount } from "./format";

describe("formatCount", () => {
  it("оставляет числа до тысячи без разделителя", () => {
    expect(formatCount(0)).toBe("0");
    expect(formatCount(694)).toBe("694");
  });

  it("группирует тысячи узким неразрывным пробелом", () => {
    expect(formatCount(1150)).toBe("1\u202F150");
    expect(formatCount(4268)).toBe("4\u202F268");
    expect(formatCount(1000000)).toBe("1\u202F000\u202F000");
  });

  it("округляет дробные значения счётчика", () => {
    expect(formatCount(12.7)).toBe("13");
  });
});
