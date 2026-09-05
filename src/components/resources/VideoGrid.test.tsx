import { render, screen } from "@testing-library/react";
import { VideoGrid } from "./VideoGrid";
import { videos } from "../../data/videos";
import { materials } from "../../data/materials";
import { resourcesCopy } from "../../data/copy.resources";

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

describe("данные ресурсов", () => {
  it("videos содержит 16 уникальных роликов ЕАД", () => {
    expect(videos.length).toBe(16);
    expect(new Set(videos.map((video) => video.id)).size).toBe(16);
    for (const video of videos) {
      expect(video.id).toMatch(/^[A-Za-z0-9_-]{11}$/);
      expect(video.title.length).toBeGreaterThan(0);
    }
    expect(videos[0]).toEqual({
      id: "YpLD6p-z00g",
      title: "Международный день молитвы – Единый голос27",
    });
  });

  it("materials содержит 5 внешних ссылок ЕАД с типом иконки", () => {
    expect(materials.length).toBe(5);
    const kinds = ["document", "image", "book", "phone", "folder"];
    for (const material of materials) {
      expect(material.href.startsWith("https://")).toBe(true);
      expect(kinds).toContain(material.kind);
    }
    const hrefs = materials.map((material) => material.href);
    expect(hrefs.filter((href) => href.endsWith(".docx")).length).toBe(1);
    expect(hrefs.some((href) => href.includes("esd.onevoice27.org/materials/banners"))).toBe(true);
    expect(hrefs.some((href) => href.includes("/materials/desire-of-ages"))).toBe(true);
    expect(hrefs.some((href) => href.includes("/materials/wallpapers"))).toBe(true);
    expect(hrefs.some((href) => href.includes("sharepoint.com"))).toBe(true);
  });

  it("resourcesCopy отдаёт строки карточек и заглушки музыки", () => {
    expect(resourcesCopy.cards.materials.cta).toBe("Открыть материалы");
    expect(resourcesCopy.cards.music.label).toBe("МУЗЫКА");
    expect(resourcesCopy.music.emptyTitle).toBe("Песня ещё в работе");
  });
});
