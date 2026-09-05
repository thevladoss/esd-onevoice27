import { render, screen } from "@testing-library/react";

import { LightsProvider } from "../../state/lights";
import { MapSection } from "./MapSection";

function renderSection() {
  return render(
    <LightsProvider>
      <MapSection />
    </LightsProvider>,
  );
}

describe("MapSection", () => {
  it("рендерит секцию #map с надзаголовком и заголовком второго уровня", () => {
    renderSection();
    const section = document.getElementById("map");
    expect(section).not.toBeNull();
    expect(section?.tagName).toBe("SECTION");
    expect(screen.getByText("Все вместе")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
      "Зажигаем свет по всему дивизиону",
    );
  });

  it("показывает счётчики дивизиона", () => {
    renderSection();
    expect(screen.getByText("ЧЕЛОВЕК")).toBeInTheDocument();
    expect(screen.getByText("ГРУПП")).toBeInTheDocument();
    expect(screen.getByText("694")).toBeInTheDocument();
  });

  it("сообщает об ошибке карты, когда контейнер без размеров", () => {
    renderSection();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Карта не загрузилась. Обновите страницу, чтобы попробовать снова.",
    );
  });

  it("держит скошенный слой внутри секции", () => {
    renderSection();
    expect(document.querySelectorAll("#map .map-section__skew")).toHaveLength(1);
  });
});
