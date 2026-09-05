import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

/*
 * Политика движения — свойство CSS проекта целиком, а не одного компонента,
 * поэтому проверяется по тексту исходников. Файлы читаются с диска, а не через
 * import.meta.glob: vitest настроен с css: false и отдаёт содержимое
 * CSS-модулей пустой строкой даже по запросу ?raw.
 */
const SRC = resolve(process.cwd(), "src");
const GLOBAL_CSS_PATH = join(SRC, "styles", "global.css");
const GLOBAL_CSS = readFileSync(GLOBAL_CSS_PATH, "utf8");

/** Пути всех файлов `src` с одним из расширений, рекурсивно. */
function filesWithExt(extensions: readonly string[], dir: string = SRC): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      found.push(...filesWithExt(extensions, path));
    } else if (extensions.some((ext) => entry.name.endsWith(ext))) {
      found.push(path);
    }
  }
  return found;
}

describe("политика reduced motion", () => {
  it("живёт в единственном блоке единственного файла", () => {
    const withMedia = filesWithExt([".css"]).filter((path) =>
      readFileSync(path, "utf8").includes("prefers-reduced-motion"),
    );

    expect(withMedia).toEqual([GLOBAL_CSS_PATH]);
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

describe("реестр data-anim", () => {
  /** Закрытый список из 05-UI-SPEC: значения вне его блок reduce не гасит. */
  const REGISTRY = [
    "stars",
    "globe",
    "beam",
    "pulse",
    "new-light",
    "particles",
    "atmosphere",
    "wave",
    "halo",
  ];

  const used = new Set(
    filesWithExt([".css", ".ts", ".tsx"])
      .flatMap((path) => readFileSync(path, "utf8").match(/data-anim="[a-z-]+"/g) ?? [])
      .map((match) => match.slice('data-anim="'.length, -1)),
  );

  it("не заводит значений вне закрытого списка", () => {
    expect([...used].filter((value) => !REGISTRY.includes(value))).toEqual([]);
  });

  it("проставлен на всех декоративных слоях оболочки, hero и карты", () => {
    // particles и atmosphere проставляет план 05-04 в секции ресурсов.
    for (const value of ["stars", "globe", "beam", "pulse", "new-light", "wave", "halo"]) {
      expect(used).toContain(value);
    }
  });
});

describe("оболочка страницы", () => {
  it("объявляет токены reveal, включая укороченный сдвиг на узком экране", () => {
    expect(GLOBAL_CSS).toContain("--dur-reveal: 700ms");
    expect(GLOBAL_CSS).toContain("--ease-reveal: cubic-bezier(0.22, 1, 0.36, 1)");
    expect(GLOBAL_CSS).toContain("--stagger-reveal: 80ms");
    expect(GLOBAL_CSS).toContain("--reveal-shift: 24px");
    expect(GLOBAL_CSS).toMatch(
      /@media \(max-width: 767px\) \{\s*:root \{\s*--reveal-shift: 16px;/,
    );
  });

  it("режет горизонтальную прокрутку через clip, а не hidden", () => {
    expect(GLOBAL_CSS).toContain("overflow-x: clip");
    expect(GLOBAL_CSS).not.toContain("overflow-x: hidden");
  });

  it("держит кольцо фокуса и в утилите, и глобальным правилом", () => {
    expect(GLOBAL_CSS.match(/outline: 2px solid var\(--color-horizon-200\)/g)).toHaveLength(2);
    expect(GLOBAL_CSS).toContain("outline-offset: 4px");
  });

  it("нигде в исходниках не снимает обводку фокуса", () => {
    // Скобки вокруг дефиса нужны, чтобы сам тест не попал под свой же поиск.
    const ringOff = /outline:\s*none|outline-width:\s*0|\boutline[-]none\b/;
    const offenders = filesWithExt([".css", ".ts", ".tsx"]).filter((path) =>
      ringOff.test(readFileSync(path, "utf8")),
    );

    expect(offenders).toEqual([]);
  });
});
