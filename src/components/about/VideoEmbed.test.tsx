import { readFileSync } from "node:fs";
import { resolve } from "node:path";
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

  it("отдаёт кнопке всю плитку, а не один круг play", () => {
    const { container } = renderEmbed();

    const button = screen.getByRole("button", { name: playName });
    expect(button.querySelector("img")).toBe(container.querySelector("img"));
    expect(button.querySelector(".ve-play")).not.toBeNull();
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

  it("держит права плеера в узком списке и запирает его в песочницу", () => {
    const { container } = renderEmbed();

    fireEvent.click(screen.getByRole("button", { name: playName }));

    const frame = container.querySelector("iframe");
    expect(frame?.getAttribute("allow")).not.toContain("clipboard-write");
    expect(frame?.getAttribute("allow")).not.toContain("web-share");
    expect(frame?.getAttribute("allow")).not.toContain("accelerometer");
    expect(frame?.getAttribute("sandbox")).toBe(
      "allow-scripts allow-same-origin allow-presentation allow-popups allow-popups-to-escape-sandbox",
    );
    expect(frame?.getAttribute("referrerpolicy")).toBe("strict-origin-when-cross-origin");
  });

  it("после старта плеера отдаёт фокус iframe, а не роняет его в body", () => {
    const { container } = renderEmbed();

    const play = screen.getByRole("button", { name: playName });
    play.focus();
    fireEvent.click(play);

    expect(document.activeElement).toBe(container.querySelector("iframe"));
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
    expect(container.firstElementChild).toHaveAttribute("data-cover", "failed");

    fireEvent.click(screen.getByRole("button", { name: playName }));
    expect(container.querySelector("iframe")).toHaveAttribute("src", frameSrc);
  });

  it("прокидывает className на корневой элемент", () => {
    const { container } = renderEmbed("ab-video");

    expect(container.firstElementChild).toHaveClass("ve", "ab-video");
  });

  it("уменьшает фасад по пропу size=compact", () => {
    const { container } = render(
      <VideoEmbed videoId={videoId} title={title} size="compact" />,
    );

    expect(container.firstElementChild).toHaveClass("ve", "ve--compact");
  });

  it("держит id, начинающийся с дефиса, как строку в адресе постера", () => {
    const { container } = render(
      <VideoEmbed videoId="-Eo--61cx90" title="Единый голос-2027: Иван Вельгоша" />,
    );

    expect(container.querySelector("img")?.getAttribute("src")).toContain("/vi/-Eo--61cx90/");
  });

  it("ничего не рендерит, если id не похож на id ролика YouTube", () => {
    const badIds = [
      "YpLD6p-z00g?list=PL",
      "abc?list=PL&x=1",
      "../../watch",
      "short",
      "YpLD6p z00g",
      "",
    ];

    for (const badId of badIds) {
      const { container, unmount } = render(<VideoEmbed videoId={badId} title={title} />);

      expect(container.firstElementChild).toBeNull();
      unmount();
    }
  });
});

/* Постер `hqdefault.jpg` приходит 480×360 с чёрными полосами по 12,5% сверху и снизу.
   Контейнер 16:9 с `object-fit: cover` срезает ровно их, поэтому кроп проверяется по
   тексту CSS: vitest настроен с `css: false` и computed style в jsdom пустой. */
const VIDEO_EMBED_CSS = readFileSync(
  resolve(process.cwd(), "src/components/about/video-embed.css"),
  "utf8",
);

/** Тело правила по селектору: до первой закрывающей скобки. */
function ruleBody(pattern: RegExp): string {
  return pattern.exec(VIDEO_EMBED_CSS)?.[1] ?? "";
}

describe("VideoEmbed: кроп постера 16:9", () => {
  it("отдаёт постер тем же классом и размером и в обычном фасаде, и в компактном", () => {
    const { container, unmount } = renderEmbed();

    expect(container.firstElementChild).toHaveClass("ve");
    const poster = container.querySelector("img");
    expect(poster).toHaveClass("ve-poster");
    expect(poster).toHaveAttribute("width", "480");
    expect(poster).toHaveAttribute("height", "360");
    expect(poster?.getAttribute("src")).toMatch(/\/hqdefault\.jpg$/);
    unmount();

    const compact = render(<VideoEmbed videoId={videoId} title={title} size="compact" />);

    expect(compact.container.firstElementChild).toHaveClass("ve", "ve--compact");
    const compactPoster = compact.container.querySelector("img");
    expect(compactPoster).toHaveClass("ve-poster");
    expect(compactPoster).toHaveAttribute("width", "480");
    expect(compactPoster).toHaveAttribute("height", "360");
  });

  it("держит кадр 16:9 и кроет его постером по центру", () => {
    const ve = ruleBody(/\.ve \{([^}]*)\}/);
    expect(ve).toContain("aspect-ratio: 16 / 9");
    expect(ve).toContain("overflow: hidden");

    const poster = ruleBody(/\.ve-poster \{([^}]*)\}/);
    expect(poster).toContain("width: 100%");
    expect(poster).toContain("height: 100%");
    expect(poster).toContain("object-fit: cover");
    expect(poster).toContain("object-position: center");
  });

  it("не даёт компактному варианту переопределить пропорцию и кроп", () => {
    const compact = ruleBody(/\.ve--compact \{([^}]*)\}/);

    expect(compact).not.toBe("");
    expect(compact).not.toContain("aspect-ratio");
    expect(compact).not.toContain("object-fit");
  });

  it("сажает плеер в тот же кадр, что и постер", () => {
    expect(ruleBody(/\.ve-frame \{([^}]*)\}/)).toContain("inset: 0");
  });

  it("не заводит второй политики сокращённого движения", () => {
    expect(VIDEO_EMBED_CSS).not.toContain("prefers-reduced-motion");
  });
});
