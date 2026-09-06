import { render, screen } from "@testing-library/react";
import { VideoGrid } from "./VideoGrid";
import { videos } from "../../data/videos";

describe("VideoGrid", () => {
  it("рендерит 16 фасадов с подписями названий", () => {
    render(<VideoGrid />);

    expect(screen.getAllByRole("button", { name: /^Смотреть видео: / })).toHaveLength(16);
    expect(screen.getAllByRole("listitem")).toHaveLength(16);
    expect(screen.getByText("Единый голос-27: Дмитрий Зубков")).toBeInTheDocument();
  });

  it("отдаёт плиткам компактный фасад и держит две колонки по умолчанию", () => {
    const { container } = render(<VideoGrid items={videos.slice(0, 2)} />);

    const list = container.querySelector("ul");
    expect(list?.className).toContain("grid-cols-2");
    expect(container.querySelectorAll(".ve--compact")).toHaveLength(2);
  });

  it("до клика не обращается к youtube-nocookie", () => {
    const { container } = render(<VideoGrid items={videos.slice(0, 3)} />);

    expect(container.querySelector("iframe")).toBeNull();
    for (const poster of Array.from(container.querySelectorAll("img"))) {
      expect(poster.getAttribute("src")).toContain("https://img.youtube.com/vi/");
    }
  });
});

