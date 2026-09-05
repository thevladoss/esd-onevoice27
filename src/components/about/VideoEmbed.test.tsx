import { fireEvent, render, screen } from "@testing-library/react";
import { VideoEmbed } from "./VideoEmbed";

const videoId = "YpLD6p-z00g";
const title = "Единый голос 27";
const playName = "Смотреть видео: Единый голос 27";
const posterSrc = "https://img.youtube.com/vi/YpLD6p-z00g/hqdefault.jpg";
const frameSrc = "https://www.youtube-nocookie.com/embed/YpLD6p-z00g?autoplay=1&rel=0";

function renderEmbed(className?: string) {
  return render(<VideoEmbed videoId={videoId} title={title} className={className} />);
}

describe("VideoEmbed", () => {
  it("показывает постер и кнопку запуска, iframe до клика не монтирует", () => {
    const { container } = renderEmbed();

    const button = screen.getByRole("button", { name: playName });
    expect(button).toHaveAttribute("type", "button");

    const poster = container.querySelector("img");
    expect(poster).toHaveAttribute("src", posterSrc);
    expect(poster).toHaveAttribute("alt", "");
    expect(poster).toHaveAttribute("loading", "lazy");
    expect(poster).toHaveAttribute("width");
    expect(poster).toHaveAttribute("height");

    expect(container.querySelector("iframe")).toBeNull();
  });

  it("по клику заменяет постер на nocookie iframe", () => {
    const { container } = renderEmbed();

    fireEvent.click(screen.getByRole("button", { name: playName }));

    const frames = container.querySelectorAll("iframe");
    expect(frames).toHaveLength(1);
    const frame = frames[0];
    expect(frame).toHaveAttribute("src", frameSrc);
    expect(frame).toHaveAttribute("title", title);
    expect(frame.getAttribute("allow")).toBe("autoplay; encrypted-media; picture-in-picture");
    expect(frame.hasAttribute("allowfullscreen")).toBe(true);

    expect(screen.queryByRole("button", { name: playName })).toBeNull();
    expect(container.querySelector("img")).toBeNull();
  });

  it("при ошибке постера показывает заглушку и оставляет кнопку рабочей", () => {
    const { container } = renderEmbed();

    const poster = container.querySelector("img");
    expect(poster).not.toBeNull();
    fireEvent.error(poster as HTMLImageElement);

    expect(container.querySelector("img")).toBeNull();
    const fallback = container.querySelector(".ve-fallback");
    expect(fallback).not.toBeNull();
    expect(fallback).toHaveTextContent(title);

    fireEvent.click(screen.getByRole("button", { name: playName }));
    expect(container.querySelector("iframe")).toHaveAttribute("src", frameSrc);
  });

  it("прокидывает className на корневой элемент", () => {
    const { container } = renderEmbed("ab-video");

    expect(container.firstElementChild).toHaveClass("ve", "ab-video");
  });

  it("ничего не рендерит, если id не похож на id ролика YouTube", () => {
    for (const badId of ["YpLD6p-z00g?list=PL", "../../watch", "short", "YpLD6p z00g", ""]) {
      const { container, unmount } = render(<VideoEmbed videoId={badId} title={title} />);

      expect(container.firstElementChild).toBeNull();
      unmount();
    }
  });
});
