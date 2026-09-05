import { render, screen } from "@testing-library/react";

import { Reveal, RevealGroup, RevealItem } from "./Reveal";

// Мок стоит до первого рендера: motion читает matchMedia один раз, при первом вызове
// useReducedMotion, и держит ответ в модульном синглтоне до конца файла.
window.matchMedia = ((query: string) => ({
  matches: query.includes("prefers-reduced-motion"),
  media: query,
  onchange: null,
  addEventListener() {},
  removeEventListener() {},
  addListener() {},
  removeListener() {},
  dispatchEvent: () => false,
})) as unknown as typeof window.matchMedia;

/** Все узлы поддерева вместе с корнем: inline-стили проверяем на каждом. */
function allNodes(root: HTMLElement): HTMLElement[] {
  return [root, ...Array.from(root.querySelectorAll<HTMLElement>("*"))];
}

describe("Reveal при prefers-reduced-motion: reduce", () => {
  it("показывает контент сразу и не ставит inline opacity 0", () => {
    const { container } = render(
      <Reveal>
        <p>Текст</p>
      </Reveal>,
    );

    expect(screen.getByText("Текст")).toBeInTheDocument();

    const root = container.firstElementChild as HTMLElement;
    expect(root.style.opacity).not.toBe("0");
    expect(root.getAttribute("style") ?? "").not.toContain("transform");
  });

  it("рендерит все карточки группы без скрытого состояния", () => {
    const { container } = render(
      <RevealGroup>
        <RevealItem>A</RevealItem>
        <RevealItem>B</RevealItem>
        <RevealItem>C</RevealItem>
      </RevealGroup>,
    );

    for (const text of ["A", "B", "C"]) {
      expect(screen.getByText(text)).toBeInTheDocument();
    }

    const root = container.firstElementChild as HTMLElement;
    for (const node of allNodes(root)) {
      expect(node.style.opacity).not.toBe("0");
    }
  });

  it("держит семантику из пропа as и класс из className", () => {
    const { container } = render(
      <Reveal as="section" className="x">
        <p>Секция</p>
      </Reveal>,
    );

    expect(container.querySelector("section.x")).not.toBeNull();
  });
});
