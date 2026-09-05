import { act, render, screen, waitFor } from "@testing-library/react";

import { enterViewport } from "../../test/intersection";
import { Reveal, RevealGroup, RevealItem } from "./Reveal";

// Отдельный файл: прогон без reduce не может жить рядом с прогоном при reduce,
// пока matchMedia подменяется на уровне модуля.
window.matchMedia = ((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addEventListener() {},
  removeEventListener() {},
  addListener() {},
  removeListener() {},
  dispatchEvent: () => false,
})) as unknown as typeof window.matchMedia;

/** Появление идёт 700 мс реального времени, поэтому ожиданию нужен запас. */
const REVEAL_TIMEOUT = 3000;

describe("Reveal без prefers-reduced-motion", () => {
  it("прячет блок до пересечения с областью просмотра", () => {
    const { container } = render(
      <Reveal>
        <p>Текст</p>
      </Reveal>,
    );

    const root = container.firstElementChild as HTMLElement;
    expect(root.style.opacity).toBe("0");
    expect(screen.getByText("Текст")).toBeInTheDocument();
  });

  it("доводит блок до opacity 1, когда наблюдатель сообщил о пересечении", async () => {
    const { container } = render(
      <Reveal>
        <p>Текст</p>
      </Reveal>,
    );

    const root = container.firstElementChild as HTMLElement;
    act(() => enterViewport());

    await waitFor(() => expect(root.style.opacity).toBe("1"), { timeout: REVEAL_TIMEOUT });
    expect(root.style.transform ?? "").not.toContain("24px");
  });

  it("рендерит детей группы и держит каждого в скрытом состоянии", () => {
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
    const items = Array.from(root.children) as HTMLElement[];
    expect(items).toHaveLength(3);
    for (const item of items) {
      expect(item.style.opacity).toBe("0");
    }
  });

  it("раздаёт видимое состояние всем карточкам группы после пересечения", async () => {
    const { container } = render(
      <RevealGroup>
        <RevealItem>A</RevealItem>
        <RevealItem>B</RevealItem>
        <RevealItem>C</RevealItem>
      </RevealGroup>,
    );

    const root = container.firstElementChild as HTMLElement;
    const items = Array.from(root.children) as HTMLElement[];
    act(() => enterViewport());

    await waitFor(
      () => {
        for (const item of items) {
          expect(item.style.opacity).toBe("1");
        }
      },
      { timeout: REVEAL_TIMEOUT },
    );

    for (const item of items) {
      expect(item.style.transform ?? "").not.toContain("24px");
    }
  });
});
