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
const POLICY_TEST_PATH = join(SRC, "styles", "motionPolicy.test.ts");
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
      ".btn[data-beam]::after",
      '[data-anim="particles"]',
    ]) {
      expect(GLOBAL_CSS).toContain(selector);
    }
  });
});

describe("кнопка с лучом", () => {
  it("ведёт луч по рамке, а точки — под конической маской на том же угле", () => {
    expect(GLOBAL_CSS.match(/@property --ov-hero-beam \{/g)).toHaveLength(1);
    expect(GLOBAL_CSS).toContain("mask-image: conic-gradient(from var(--ov-hero-beam)");
    expect(GLOBAL_CSS.match(/background-size: 7px 7px/g)).toHaveLength(1);
    expect(GLOBAL_CSS).toContain(") border-box;");
    expect(GLOBAL_CSS.match(/animation: hero-beam 3s linear infinite;/g)).toHaveLength(2);
  });

  it("останавливает и луч, и маску точек при reduced motion", () => {
    expect(GLOBAL_CSS).toMatch(
      /\.btn\[data-beam\],\s*\.btn\[data-beam\]::after \{\s*animation: none;/,
    );
  });

  it("даёт submit формы отдельный размер той же кнопки", () => {
    expect(GLOBAL_CSS).toContain('.btn[data-beam][data-size="form"]');
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
    // new-light остаётся в реестре ради селектора блока reduce в global.css,
    // но кольцо нового огонька с фазы 15 рисует canvas: узла в DOM нет.
    for (const value of ["stars", "globe", "beam", "pulse", "wave", "halo"]) {
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

  it("защищает каждую ссылку в новую вкладку от reverse tabnabbing", () => {
    const unprotected = filesWithExt([".tsx"]).flatMap((path) =>
      readFileSync(path, "utf8")
        .split("\n")
        .filter((line) => line.includes('target="_blank"') && !line.includes("noopener noreferrer"))
        .map((line) => `${path}: ${line.trim()}`),
    );

    // Пара атрибутов держится в одной строке: так пропажу rel видно на ревью.
    expect(unprotected).toEqual([]);
  });

  it("нигде в исходниках не снимает обводку фокуса, кроме цели ссылки пропуска", () => {
    /* Все способы погасить кольцо, а не только `outline: none`: правило для main когда-то
       переписали на прозрачный цвет ровно затем, чтобы пройти этот тест текстом. */
    const ringOff = /outline:\s*(none|0)|outline-width:\s*0|outline-color:\s*transparent|\boutline-none\b/;

    /* Единственное согласованное исключение — программный фокус на <main> после ссылки
       пропуска. Разрешено ровно это правило целиком, а не файл: любая другая строка в
       global.css, гасящая кольцо, тест роняет. */
    const allowedRule = "main:focus,\nmain:focus-visible {\n  outline-color: transparent;\n}";
    expect(GLOBAL_CSS).toContain(allowedRule);
    expect(GLOBAL_CSS.split(allowedRule)).toHaveLength(2);

    const offenders = filesWithExt([".css", ".ts", ".tsx"])
      // Сам файл политики держит образцы запрещённых правил, иначе искать было бы нечем.
      .filter((path) => path !== POLICY_TEST_PATH)
      .filter((path) => {
        const source = readFileSync(path, "utf8");
        return ringOff.test(path === GLOBAL_CSS_PATH ? source.replace(allowedRule, "") : source);
      });

    expect(offenders).toEqual([]);
  });
});
