import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { heroCopy } from "../../data/copy.hero";
import { Hero } from "./Hero";

/*
 * CSS читается с диска: vitest настроен с css: false и отдаёт содержимое CSS-модулей
 * пустой строкой даже по запросу ?raw (тот же приём, что в motionPolicy.test.ts).
 */
const HERO_CSS = readFileSync(resolve(process.cwd(), "src/components/hero/hero.css"), "utf8");

function mockReducedMotion(reduce: boolean) {
  vi.spyOn(window, "matchMedia").mockImplementation(
    (query: string) =>
      ({
        matches: reduce && query.includes("reduce"),
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }) as unknown as MediaQueryList,
  );
}

function heroVideo() {
  return document.querySelector<HTMLVideoElement>("#hero .hero__video > video");
}

/* jsdom не реализует play и pause: без заглушек каждый рендер печатает
   «Not implemented: HTMLMediaElement.prototype.play». */
let play: ReturnType<typeof vi.spyOn>;
let pause: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  play = vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(() => Promise.resolve());
  pause = vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Hero", () => {
  it("рендерит секцию #hero с надзаголовком", () => {
    render(<Hero />);
    const section = document.getElementById("hero");
    expect(section).not.toBeNull();
    expect(section?.tagName).toBe("SECTION");
    expect(screen.getByText("Единое глобальное движение")).toBeInTheDocument();
  });

  it("называет секцию её заголовком через aria-labelledby", () => {
    render(<Hero />);
    const section = document.getElementById("hero");
    expect(section).toHaveAttribute("aria-labelledby", "hero-title");
    expect(screen.getByRole("heading", { level: 1 })).toHaveAttribute("id", "hero-title");
    expect(screen.getByRole("region", { name: heroCopy.title })).toBe(section);
  });

  it("держит заголовок первого уровня «Вместе, единым голосом»", () => {
    render(<Hero />);
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent("Вместе, единым голосом");
    expect(screen.getAllByRole("heading")).toHaveLength(1);
  });

  it("показывает подзаголовок про Евро-Азиатский дивизион", () => {
    render(<Hero />);
    expect(
      screen.getByText(
        "Единая весть. Евро-Азиатский дивизион присоединяется к всемирному движению: один человек и одна группа за раз.",
      ),
    ).toBeInTheDocument();
  });

  it("ведёт кнопкой «Зажечь свой свет» на #light-form", () => {
    render(<Hero />);
    const link = screen.getByRole("link", { name: "Зажечь свой свет" });
    expect(link.getAttribute("href")).toMatch(/#light-form$/);
    expect(link).toHaveClass("btn", "btn--primary");
  });

  it("включает луч по границе CTA", () => {
    render(<Hero />);
    expect(screen.getByRole("link", { name: heroCopy.cta })).toHaveAttribute("data-beam", "true");
  });

  it("кладёт на первый экран видео глобуса с атрибутами автовоспроизведения", () => {
    render(<Hero />);
    const video = heroVideo();

    expect(video).not.toBeNull();
    expect(video).toHaveAttribute("data-anim", "globe");
    expect(video).toHaveAttribute("aria-hidden", "true");
    expect(video).toHaveAttribute("tabindex", "-1");
    expect(video).toHaveAttribute("preload", "auto");
    for (const flag of [
      "autoplay",
      "loop",
      "playsinline",
      "disablepictureinpicture",
      "disableremoteplayback",
    ]) {
      expect(video).toHaveAttribute(flag);
    }
  });

  it("подключает webm и mp4 из public под BASE_URL", () => {
    render(<Hero />);
    const sources = Array.from(heroVideo()?.querySelectorAll("source") ?? []);

    expect(sources).toHaveLength(2);
    // Сверяем со значением BASE_URL, а не с литералом: base приходит из vite.config.ts.
    expect(sources[0]).toHaveAttribute("src", `${import.meta.env.BASE_URL}hero-globe.webm`);
    expect(sources[0]).toHaveAttribute("type", "video/webm");
    expect(sources[1]).toHaveAttribute("src", `${import.meta.env.BASE_URL}hero-globe.mp4`);
    expect(sources[1]).toHaveAttribute("type", "video/mp4");
    for (const source of sources) {
      expect(source.getAttribute("src")?.startsWith("/")).toBe(true);
    }
    expect(sources[0].getAttribute("src")?.endsWith("hero-globe.webm")).toBe(true);
    expect(sources[1].getAttribute("src")?.endsWith("hero-globe.mp4")).toBe(true);
  });

  it("складывает слои: видео, частицы, текст", () => {
    render(<Hero />);
    const section = document.getElementById("hero");
    const [video, particles, content] = Array.from(section?.children ?? []);

    expect(video).toHaveClass("hero__video");
    expect(particles.tagName).toBe("CANVAS");
    expect(particles).toHaveClass("hero__particles");
    expect(particles).toHaveAttribute("data-anim", "stars");
    expect(particles).toHaveAttribute("aria-hidden", "true");
    expect(content).toHaveClass("hero__content");
  });

  it("без reduce запускает видео и дублирует muted через ref", () => {
    mockReducedMotion(false);
    render(<Hero />);

    expect(heroVideo()?.muted).toBe(true);
    expect(play).toHaveBeenCalledTimes(1);
    expect(pause).not.toHaveBeenCalled();
  });

  it("при reduce держит видео на первом кадре после loadeddata", () => {
    mockReducedMotion(true);
    render(<Hero />);
    const video = heroVideo();

    expect(video).not.toBeNull();
    expect(play).not.toHaveBeenCalled();

    video!.currentTime = 3;
    fireEvent(video!, new Event("loadeddata"));

    expect(pause).toHaveBeenCalledTimes(1);
    expect(video!.currentTime).toBe(0);
  });

  it("при saveData не подключает источники", () => {
    Object.defineProperty(navigator, "connection", {
      value: { saveData: true },
      configurable: true,
    });

    try {
      render(<Hero />);
      const video = heroVideo();

      expect(video).not.toBeNull();
      expect(video?.querySelectorAll("source")).toHaveLength(0);
      expect(video).toHaveAttribute("preload", "none");
      expect(document.querySelector("#hero canvas.hero__particles")).not.toBeNull();
    } finally {
      delete (navigator as { connection?: unknown }).connection;
    }

    // Без подсказки об экономии трафика источники возвращаются.
    document.body.innerHTML = "";
    render(<Hero />);
    expect(heroVideo()?.querySelectorAll("source")).toHaveLength(2);
  });

  it("hero.css: высота секции, видео по трём брейкпоинтам, без звёздного поля", () => {
    const css = HERO_CSS;

    for (const rule of [
      "min-height: 100svh",
      "min-height: max(600px, 65svh)",
      "min-height: max(600px, 64vh)",
      "background: #070210",
      "filter: saturate(1.18) contrast(1.28) brightness(0.96)",
      "@media (min-width: 40rem)",
      "object-position: 72% center",
      "transform-origin: 72% 46%",
      "@media (min-width: 80rem)",
      "max-width: min(100%, 1920px)",
      "aspect-ratio: 16 / 9",
      "object-fit: contain",
      "object-position: right top",
      "mix-blend-mode: screen",
      "-webkit-mask-image:",
      "-webkit-mask-composite: source-in",
      "mask-composite: intersect",
      ".hero__particles {",
      "opacity: .72",
    ]) {
      expect(css).toContain(rule);
    }

    expect(css).not.toContain("starfield");
    expect(css).not.toContain("star-drift");
    expect(css).not.toContain("globe-canvas");
    expect(css).not.toContain("clamp(600px, 92vh, 820px)");
    // Единственный блок reduce живёт в global.css, политика движения это стережёт.
    expect(css).not.toContain("prefers-reduced-motion");
  });

  it("берёт все тексты из heroCopy, а не из JSX", () => {
    render(<Hero />);
    expect(screen.getByText(heroCopy.eyebrow)).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(heroCopy.title);
    expect(screen.getByText(heroCopy.subtitle)).toBeInTheDocument();
    const link = screen.getByRole("link", { name: heroCopy.cta });
    expect(link.getAttribute("href")).toMatch(new RegExp(`${heroCopy.ctaHref}$`));
  });

  it("по клику по CTA скроллит к форме вместо прыжка по якорю", async () => {
    const user = userEvent.setup();
    const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    const form = document.createElement("div");
    form.id = "light-form";
    document.body.append(form);

    render(<Hero />);
    await user.click(screen.getByRole("link", { name: heroCopy.cta }));

    expect(scrollTo).toHaveBeenCalledTimes(1);
    form.remove();
    scrollTo.mockRestore();
  });
});
