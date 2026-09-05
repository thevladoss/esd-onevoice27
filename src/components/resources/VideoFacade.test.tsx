import { fireEvent, render, screen } from "@testing-library/react";
import { VideoFacade } from "./VideoFacade";
import { VideoGrid } from "./VideoGrid";
import { videos } from "../../data/videos";
import { materials } from "../../data/materials";
import { resourcesCopy } from "../../data/copy.resources";

const KAMINSKY = "Единый голос-27: Михаил Каминский";

describe("VideoFacade", () => {
  it("до клика показывает постер hqdefault и кнопку play, iframe не монтируется", () => {
    render(<VideoFacade videoId="qQsgK18gKCU" title={KAMINSKY} />);

    expect(
      screen.getByRole("button", { name: "Смотреть видео: Единый голос-27: Михаил Каминский" }),
    ).toBeInTheDocument();

    const img = document.querySelector("img");
    expect(img).not.toBeNull();
    expect(img?.getAttribute("src")).toBe(
      "https://img.youtube.com/vi/qQsgK18gKCU/hqdefault.jpg",
    );
    expect(img?.getAttribute("alt")).toBe("");
    expect(img?.getAttribute("loading")).toBe("lazy");
    expect(document.querySelector("iframe")).toBeNull();
  });

  it("клик заменяет фасад плеером youtube-nocookie с автозапуском", () => {
    render(<VideoFacade videoId="qQsgK18gKCU" title={KAMINSKY} />);

    fireEvent.click(screen.getByRole("button", { name: `Смотреть видео: ${KAMINSKY}` }));

    const iframe = document.querySelector("iframe");
    expect(iframe).not.toBeNull();
    expect(iframe?.getAttribute("src")?.startsWith(
      "https://www.youtube-nocookie.com/embed/qQsgK18gKCU?autoplay=1&rel=0",
    )).toBe(true);
    expect(iframe?.getAttribute("title")).toBe(KAMINSKY);
    expect(iframe?.getAttribute("allow")).toBe("autoplay; encrypted-media; picture-in-picture");
    expect(iframe?.getAttribute("allow")).not.toContain("clipboard-write");
    expect(iframe?.getAttribute("allow")).not.toContain("web-share");
    expect(iframe?.getAttribute("sandbox")).toBe(
      "allow-scripts allow-same-origin allow-presentation allow-popups allow-popups-to-escape-sandbox",
    );
    expect(iframe?.hasAttribute("allowfullscreen")).toBe(true);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("после старта плеера отдаёт фокус iframe, а не роняет его в body", () => {
    render(<VideoFacade videoId="qQsgK18gKCU" title={KAMINSKY} />);

    const play = screen.getByRole("button", { name: `Смотреть видео: ${KAMINSKY}` });
    play.focus();
    fireEvent.click(play);

    const iframe = document.querySelector("iframe");
    expect(iframe).not.toBeNull();
    expect(document.activeElement).toBe(iframe);
  });

  it("при ошибке постера прячет картинку, но держит кнопку play и помечает фасад", () => {
    const title = "Единый голос-27: Эртон Келер";
    render(<VideoFacade videoId="dnQS3tFmCNU" title={title} />);

    const img = document.querySelector("img") as HTMLImageElement;
    fireEvent.error(img);

    expect(document.querySelector("img")).toBeNull();
    expect(screen.getByRole("button", { name: `Смотреть видео: ${title}` })).toBeInTheDocument();
    expect(document.querySelector("[data-cover]")?.getAttribute("data-cover")).toBe("failed");
  });

  it("держит id, начинающийся с дефиса, как строку в адресе постера", () => {
    render(<VideoFacade videoId="-Eo--61cx90" title="Единый голос-2027: Иван Вельгоша" />);

    expect(document.querySelector("img")?.getAttribute("src")).toContain("/vi/-Eo--61cx90/");
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

describe("VideoGrid", () => {
  it("рендерит 16 фасадов с подписями названий", () => {
    render(<VideoGrid />);

    expect(screen.getAllByRole("button", { name: /^Смотреть видео: / })).toHaveLength(16);
    expect(screen.getAllByRole("listitem")).toHaveLength(16);
    expect(screen.getByText("Единый голос-27: Дмитрий Зубков")).toBeInTheDocument();
  });
});
