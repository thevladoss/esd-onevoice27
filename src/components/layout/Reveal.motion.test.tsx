import { render, screen } from "@testing-library/react";

import { Reveal, RevealGroup, RevealItem } from "./Reveal";

// Отдельный файл: motion кэширует первый ответ matchMedia на уровне модуля, поэтому
// прогон без reduce не может жить рядом с прогоном при reduce.
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

describe("Reveal без prefers-reduced-motion", () => {
  it("прячет блок до пересечения с областью просмотра", () => {
    // Мок IntersectionObserver событий не шлёт, поэтому whileInView не срабатывает
    // и начальное состояние остаётся на узле.
    const { container } = render(
      <Reveal>
        <p>Текст</p>
      </Reveal>,
    );

    const root = container.firstElementChild as HTMLElement;
    expect(root.style.opacity).toBe("0");
    expect(screen.getByText("Текст")).toBeInTheDocument();
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
});
