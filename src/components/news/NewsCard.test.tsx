import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { NewsCard } from "./NewsCard";
import { news } from "../../data/news";

/* Vitest настроен с `css: false`, поэтому computed style из news.css в jsdom пустой.
   Разметка проверяется по классам и атрибутам, а значения спецификации — по тексту
   CSS-файла, как это делает src/styles/motionPolicy.test.ts. */
const NEWS_CSS = readFileSync(resolve(process.cwd(), "src/components/news/news.css"), "utf8");

/** Значения из раздела 4 (MEDIA) спецификации: карточка оригинала повторяется литералами. */
const EXPECTED_DECLARATIONS = [
  "inset: auto 4px 4px",
  "padding: clamp(18px, 2.4vw, 28px)",
  "border-radius: 12px",
  "font-weight: 800",
  "font-size: clamp(1.125rem, 1.6vw, 1.375rem)",
  "letter-spacing: -0.03em",
  "line-height: 1.08",
  "rgb(170 217 220)",
  "linear-gradient(180deg, rgb(50 16 47 / .10) 18%, rgb(50 16 47 / .52) 62%, rgb(3 3 12 / .96) 100%)",
  "transition: scale 760ms cubic-bezier(.16, 1, .3, 1)",
  "rgb(247 239 232 / .96)",
  "rgb(18 12 52)",
  "0 12px 30px rgb(2 2 12 / .24)",
  "rgb(143 157 214 / .38)",
  "240ms ease",
];

/** Адрес обложки: постер ролика на YouTube, 480×360 с чёрными полосами по 12,5%. */
const HQDEFAULT_RE = /^https:\/\/img\.youtube\.com\/vi\/[\w%-]+\/hqdefault\.jpg$/;

function renderCard(item = news[0], priority = false) {
  return render(<NewsCard item={item} priority={priority} />);
}

describe("NewsCard", () => {
  it("дополнительный кроп обложки: transform и object-position только у роликов шире 16:9", () => {
    // День молитвы снят в 2,41:1: поля постера выше стандартных, кроп 16:9 их не снимает.
    const wide = news.find((item) => item.id === "day-of-prayer");
    const standard = news.find((item) => item.id === "kaminsky");
    if (!wide || !standard) throw new Error("ожидались записи day-of-prayer и kaminsky");

    const { unmount } = renderCard(wide);
    const zoomed = screen.getByRole("link").querySelector("img");
    expect(zoomed?.style.transform).toBe("scale(1.45)");
    expect(zoomed?.style.objectPosition).toBe("50% 65%");
    unmount();

    renderCard(standard);
    const plain = screen.getByRole("link").querySelector("img");
    expect(plain?.getAttribute("style")).toBeNull();
  });

  it("держит обложку в кадре 16:9 и кроет его картинкой по центру", () => {
    const { container } = renderCard();

    const cover = container.querySelector("div.news-card__cover");
    expect(cover).not.toBeNull();
    expect(cover?.className).toContain("aspect-video");
    expect(container.querySelector("div.aspect-\\[4\\/5\\]")).toBeNull();

    const image = container.querySelector("img");
    expect(image?.className).toContain("object-cover");
    expect(image?.className).toContain("object-center");
  });

  it("берёт обложку с img.youtube.com и не трогает источник hqdefault", () => {
    const { container } = renderCard();

    expect(container.querySelector("img")).toHaveAttribute("src", news[0].cover);
    expect(news[0].cover).toContain("hqdefault.jpg");

    for (const item of news) {
      expect(item.cover).toMatch(HQDEFAULT_RE);
    }
  });
});

describe("NewsCard: ховер и фокус", () => {
  it("растит картинку только там, где движение разрешено", () => {
    const { container } = renderCard();

    const imageClass = container.querySelector("img")?.className ?? "";
    expect(imageClass).toContain("motion-safe:group-hover:scale-[1.035]");
    expect(imageClass).toContain("motion-safe:group-focus-within:scale-[1.035]");
    // Вариант без motion-safe оставил бы масштаб включённым при сокращённом движении.
    expect(imageClass).not.toMatch(/(^|\s)group-hover:scale/);
  });

  it("делает ссылку группой, за которой следит картинка", () => {
    const { container } = renderCard();

    const link = screen.getByRole("link");
    expect(link).toHaveClass("news-card__link", "group");
    expect(container.querySelector("img")?.closest("a")).toBe(link);
  });
});

describe("NewsCard: панель заголовка", () => {
  it("рисует панель с датой перед заголовком и обрезает его тремя строками", () => {
    const { container } = renderCard();

    const panel = container.querySelector("div.news-card__panel");
    expect(panel).not.toBeNull();

    const marked = (panel as HTMLElement).querySelectorAll("time, h3");
    expect(marked[0].tagName).toBe("TIME");
    expect(marked[0]).toHaveClass("news-card__date");
    expect(marked[1].tagName).toBe("H3");
    expect(marked[1]).toHaveClass("news-card__title");
    expect(marked[1].className).toContain("line-clamp-3");
    expect(marked[1].className).not.toContain("line-clamp-4");
  });

  it("отдаёт оверлей обложки псевдоэлементу, а не пустому span в разметке", () => {
    renderCard();

    const link = screen.getByRole("link");
    expect(link.querySelector("span[aria-hidden]")).toBeNull();
  });
});

describe("NewsCard: контракт news.css", () => {
  it("держит значения карточки оригинала литералами", () => {
    for (const declaration of EXPECTED_DECLARATIONS) {
      expect(NEWS_CSS).toContain(declaration);
    }
  });

  it("включает активное состояние и на ховере, и на фокусе", () => {
    expect(NEWS_CSS).toContain("@media (hover: hover)");
    expect(NEWS_CSS).toContain(".news-card__link:focus-within");
  });

  it("не заводит второй политики сокращённого движения", () => {
    expect(NEWS_CSS).not.toContain("prefers-reduced-motion");
  });
});

describe("NewsCard: упавшая обложка", () => {
  it("заменяет обложку плашкой внутри того же кадра, сохраняя ссылку и заголовок", () => {
    const { container } = renderCard();

    const image = container.querySelector("img");
    expect(image).not.toBeNull();

    fireEvent.error(image as HTMLImageElement);

    const cover = container.querySelector("div.news-card__cover");
    expect(container.querySelector("img")).toBeNull();
    expect(cover?.querySelector("div.news-card__fallback")).not.toBeNull();

    const article = screen.getByRole("article");
    expect(within(article).getByText("Обложка недоступна")).toBeInTheDocument();
    expect(within(article).getByRole("link")).toHaveAttribute("rel", "noopener noreferrer");
    expect(within(article).getByRole("heading", { level: 3, name: news[0].title })).toBeInTheDocument();
  });
});

describe("NewsCard: атрибуты обложки", () => {
  it("несёт размеры постера и грузит обложку лениво по умолчанию", () => {
    const standard = news.find((item) => item.id === "kaminsky");
    if (!standard) throw new Error("ожидалась запись kaminsky");

    const { container } = renderCard(standard);
    const image = container.querySelector("img");

    // Пропорция 480×360 известна браузеру до загрузки, поэтому кадр не прыгает.
    expect(image).toHaveAttribute("width", "480");
    expect(image).toHaveAttribute("height", "360");
    expect(image).toHaveAttribute("decoding", "async");
    expect(image).toHaveAttribute("loading", "lazy");
    expect(image).not.toHaveAttribute("fetchpriority");
    expect(image?.getAttribute("style")).toBeNull();
  });

  it("грузит приоритетную обложку сразу и не теряет кроп", () => {
    const wide = news.find((item) => item.id === "day-of-prayer");
    if (!wide) throw new Error("ожидалась запись day-of-prayer");

    const { container } = renderCard(wide, true);
    const image = container.querySelector("img");

    expect(image).toHaveAttribute("loading", "eager");
    expect(image).toHaveAttribute("fetchpriority", "high");
    expect(image).toHaveAttribute("width", "480");
    expect(image).toHaveAttribute("height", "360");
    expect(image).toHaveAttribute("decoding", "async");
    expect(image?.style.transform).toBe("scale(1.45)");
    expect(image?.style.objectPosition).toBe("50% 65%");
  });
});
