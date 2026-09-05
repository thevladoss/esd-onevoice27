import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

// Корень vitest совпадает с корнем проекта: путь к исходникам считается от него,
// а не от import.meta.url, который в jsdom приходит не файловым URL.
const SRC = resolve(process.cwd(), "src");
const GLOBAL_CSS = readFileSync(join(SRC, "styles/global.css"), "utf8");

/** Все файлы `src` с одним из расширений, рекурсивно. */
function filesWithExt(dir: string, extensions: readonly string[]): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      found.push(...filesWithExt(path, extensions));
    } else if (extensions.some((ext) => entry.name.endsWith(ext))) {
      found.push(path);
    }
  }
  return found;
}

describe("политика reduced motion", () => {
  it("живёт в единственном блоке единственного файла", () => {
    const withMedia = filesWithExt(SRC, [".css"]).filter((path) =>
      readFileSync(path, "utf8").includes("prefers-reduced-motion"),
    );

    expect(withMedia).toHaveLength(1);
    expect(withMedia[0].endsWith("styles/global.css")).toBe(true);
    expect(GLOBAL_CSS.match(/@media \(prefers-reduced-motion: reduce\)/g)).toHaveLength(1);
  });

  it("гасит анимацию любого слоя с data-anim и держит страховку на весь документ", () => {
    expect(GLOBAL_CSS).toContain("animation-duration: 0.01ms !important");
    expect(GLOBAL_CSS).toContain("transition-duration: 0.01ms !important");
    expect(GLOBAL_CSS).toMatch(
      /\[data-anim\],\s*\[data-anim\]::before,\s*\[data-anim\]::after \{\s*animation: none !important;/,
    );
  });

  it("оставляет статичные конечные кадры вместо анимации", () => {
    for (const selector of [
      '[data-anim="halo"]',
      '[data-anim="pulse"] circle',
      '[data-anim="beam"]::before',
      '[data-anim="particles"]',
    ]) {
      expect(GLOBAL_CSS).toContain(selector);
    }
  });
});

describe("оболочка страницы", () => {
  it("объявляет токены reveal, включая укороченный сдвиг на узком экране", () => {
    expect(GLOBAL_CSS).toContain("--dur-reveal: 700ms");
    expect(GLOBAL_CSS).toContain("--ease-reveal: cubic-bezier(0.22, 1, 0.36, 1)");
    expect(GLOBAL_CSS).toContain("--stagger-reveal: 80ms");
    expect(GLOBAL_CSS).toContain("--reveal-shift: 24px");
    expect(GLOBAL_CSS).toMatch(/@media \(max-width: 767px\) \{\s*:root \{\s*--reveal-shift: 16px;/);
  });

  it("режет горизонтальную прокрутку через clip, а не hidden", () => {
    expect(GLOBAL_CSS).toContain("overflow-x: clip");
    expect(GLOBAL_CSS).not.toContain("overflow-x: hidden");
  });

  it("держит кольцо фокуса и в утилите, и глобальным правилом", () => {
    expect(
      GLOBAL_CSS.match(/outline: 2px solid var\(--color-horizon-200\)/g),
    ).toHaveLength(2);
    expect(GLOBAL_CSS).toContain("outline-offset: 4px");
  });

  it("нигде в исходниках не снимает обводку фокуса", () => {
    const sources = filesWithExt(SRC, [".css", ".ts", ".tsx"]);
    const offenders = sources.filter((path) =>
      /outline:\s*none|outline-width:\s*0|\boutline-none\b/.test(readFileSync(path, "utf8")),
    );

    expect(offenders).toEqual([]);
  });
});
