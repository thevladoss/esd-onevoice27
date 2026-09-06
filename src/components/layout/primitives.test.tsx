import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen } from "@testing-library/react";
import { Section } from "./Section";
import { Eyebrow } from "./Eyebrow";
import { GradientTitle } from "./GradientTitle";
import { Button } from "./Button";
import { GlassCard } from "./GlassCard";

/* vitest настроен с css: false и отдаёт содержимое стилей пустой строкой, поэтому
   значения свойств проверяются по тексту исходника с диска — тем же приёмом, что
   в src/styles/motionPolicy.test.ts. */
const readSource = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

const GLOBAL_CSS = readSource("src/styles/global.css");
const PRIMITIVES_CSS = readSource("src/components/layout/primitives.css");
const HEADER_CSS = readSource("src/components/layout/Header.css");
const MAP_CSS = readSource("src/components/map/map.css");
const COUNTERS_TSX = readSource("src/components/map/Counters.tsx");

/** Схлопывает любые пробельные последовательности в один пробел. */
const flat = (css: string) => css.replace(/\s+/g, " ");

/** Тело первого правила, чей заголовок с открывающей скобкой равен head. */
function block(css: string, head: string): string {
  const source = flat(css);
  const start = source.indexOf(head);
  if (start === -1) {
    throw new Error(`Правило ${head} в CSS не найдено`);
  }
  const end = source.indexOf("}", start + head.length);
  if (end === -1) {
    throw new Error(`У правила ${head} нет закрывающей скобки`);
  }
  return source.slice(start + head.length, end);
}

describe("Section", () => {
  it("рендерит секцию с id, надзаголовком, заголовком и содержимым", () => {
    render(
      <Section id="about" eyebrow="Глобальное влияние" title="Что такое Единый голос 27?">
        Тело
      </Section>,
    );
    const section = document.getElementById("about");
    expect(section).not.toBeNull();
    expect(section?.tagName).toBe("SECTION");
    expect(section?.querySelector("p.eyebrow")).toHaveTextContent("Глобальное влияние");
    expect(
      screen.getByRole("heading", { level: 2, name: "Что такое Единый голос 27?" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Тело")).toBeInTheDocument();
  });

  it("по titleId связывает секцию с её заголовком", () => {
    render(
      <Section id="about" titleId="about-title" title="Что такое Единый голос 27?">
        Тело
      </Section>,
    );
    const section = document.getElementById("about");
    expect(section).toHaveAttribute("aria-labelledby", "about-title");
    expect(screen.getByRole("heading", { level: 2 })).toHaveAttribute("id", "about-title");
    expect(
      screen.getByRole("region", { name: "Что такое Единый голос 27?" }),
    ).toBe(section);
  });

  it("без titleId не ставит aria-labelledby", () => {
    render(<Section id="news">Тело</Section>);
    expect(document.getElementById("news")).not.toHaveAttribute("aria-labelledby");
  });

  it("без надзаголовка и заголовка не рендерит ни h2, ни p.eyebrow", () => {
    render(<Section id="map">Только тело</Section>);
    expect(screen.queryByRole("heading")).toBeNull();
    expect(document.querySelector("p.eyebrow")).toBeNull();
    expect(screen.getByText("Только тело")).toBeInTheDocument();
  });

  it("держит контентную ширину 72rem и добавляет переданный className к секции", () => {
    render(
      <Section id="news" className="min-h-[40vh]">
        Тело
      </Section>,
    );
    const section = document.getElementById("news");
    expect(section).toHaveClass("min-h-[40vh]");
    expect(section?.firstElementChild?.className).toContain("max-w-[72rem]");
  });
});

describe("Eyebrow", () => {
  it("рендерит абзац с классом eyebrow и текстом", () => {
    render(<Eyebrow>Все вместе</Eyebrow>);
    const eyebrow = screen.getByText("Все вместе");
    expect(eyebrow.tagName).toBe("P");
    expect(eyebrow).toHaveClass("eyebrow");
  });
});

describe("GradientTitle", () => {
  it("вариант hero рендерит h1 с классами градиента", () => {
    render(
      <GradientTitle as="h1" variant="hero">
        Вместе, единым голосом
      </GradientTitle>,
    );
    const heading = screen.getByRole("heading", { level: 1, name: "Вместе, единым голосом" });
    expect(heading.tagName).toBe("H1");
    expect(heading).toHaveClass("gradient-title", "gradient-title--hero");
  });

  it("вариант section рендерит h2 с классом gradient-title--section", () => {
    render(
      <GradientTitle as="h2" variant="section">
        Зажгите свет
      </GradientTitle>,
    );
    const heading = screen.getByRole("heading", { level: 2, name: "Зажгите свет" });
    expect(heading.tagName).toBe("H2");
    expect(heading).toHaveClass("gradient-title", "gradient-title--section");
  });
});

describe("Button", () => {
  it("как ссылка ведёт по href и получает классы primary", () => {
    render(
      <Button as="a" href="#light-form">
        Зажечь свой свет
      </Button>,
    );
    const link = screen.getByRole("link", { name: "Зажечь свой свет" });
    expect(link).toHaveAttribute("href", "#light-form");
    expect(link).toHaveClass("btn", "btn--primary");
  });

  it("без as рендерит кнопку с type=button", () => {
    render(<Button>Отправить</Button>);
    const button = screen.getByRole("button", { name: "Отправить" });
    expect(button.tagName).toBe("BUTTON");
    expect(button).toHaveAttribute("type", "button");
  });

  it("вариант ghost даёт класс btn--ghost", () => {
    render(<Button variant="ghost">Отправить</Button>);
    expect(screen.getByRole("button", { name: "Отправить" })).toHaveClass("btn", "btn--ghost");
  });

  it("объявляет луч только у основного варианта", () => {
    const { rerender } = render(<Button>Отправить</Button>);
    const primary = screen.getByRole("button", { name: "Отправить" });
    expect(primary).toHaveAttribute("data-beam", "true");
    expect(primary).toHaveAttribute("data-anim", "beam");

    rerender(<Button variant="ghost">Отправить</Button>);
    const ghost = screen.getByRole("button", { name: "Отправить" });
    expect(ghost).not.toHaveAttribute("data-beam");
    expect(ghost).not.toHaveAttribute("data-anim");
  });

  it("заворачивает подпись в span, чтобы она шла поверх сетки точек", () => {
    render(<Button>Отправить</Button>);
    const label = screen.getByRole("button", { name: "Отправить" }).firstElementChild;
    expect(label?.tagName).toBe("SPAN");
    expect(label).toHaveClass("btn__label");
    expect(label).toHaveTextContent("Отправить");
  });

  it("size=form размечает кнопку формы, без него атрибута нет", () => {
    const { rerender } = render(<Button size="form">Отправить</Button>);
    expect(screen.getByRole("button", { name: "Отправить" })).toHaveAttribute(
      "data-size",
      "form",
    );

    rerender(<Button>Отправить</Button>);
    expect(screen.getByRole("button", { name: "Отправить" })).not.toHaveAttribute("data-size");
  });

  it("пробрасывает disabled на кнопку", () => {
    render(<Button disabled>Отправить</Button>);
    expect(screen.getByRole("button", { name: "Отправить" })).toBeDisabled();
  });
});

describe("GlassCard", () => {
  it("рендерит детей внутри стеклянной карточки", () => {
    render(<GlassCard>Содержимое</GlassCard>);
    const card = document.querySelector(".glass-card");
    expect(card).not.toBeNull();
    expect(card?.tagName).toBe("DIV");
    expect(card).toHaveClass("glass");
    expect(card).toHaveTextContent("Содержимое");
  });

  it("interactive добавляет класс наведения, as меняет тег", () => {
    render(
      <GlassCard interactive as="article" className="max-w-[60ch]">
        Содержимое
      </GlassCard>,
    );
    const card = document.querySelector(".glass-card");
    expect(card?.tagName).toBe("ARTICLE");
    expect(card).toHaveClass("glass-card--interactive", "max-w-[60ch]");
  });
});

describe("токены и утилиты стекла (GLASS-01, GLASS-03)", () => {
  it("держит поверхность, рамку и тень карточки оригинала", () => {
    const tokens = flat(GLOBAL_CSS);
    expect(tokens).toContain("--glass-border: rgb(239 237 245 / .18);");
    expect(tokens).toContain(
      "--glass-surface: linear-gradient(180deg, rgb(49 41 77 / .44), rgb(18 12 52 / .62));",
    );
    expect(tokens).toContain(
      "--shadow-card: inset 0 1px 0 rgb(255 255 255 / .035), 0 20px 46px rgb(3 2 18 / .24);",
    );
  });

  it("собирает утилиту glass из блика и токенов", () => {
    const glass = block(GLOBAL_CSS, "@utility glass {");
    expect(glass).toContain(
      "linear-gradient(145deg, rgb(255 255 255 / .045), transparent 30%), var(--glass-surface);",
    );
    expect(glass).toContain("border: 1px solid var(--glass-border);");
    expect(glass).toContain("border-radius: var(--radius-card);");
    expect(glass).toContain("box-shadow: var(--shadow-card);");
    expect(glass).toContain("backdrop-filter: blur(14px) saturate(112%);");
  });

  it("даёт фазе 11 утилиту glass-resource с верхним бликом и своей насыщенностью", () => {
    const resource = block(GLOBAL_CSS, "@utility glass-resource {");
    expect(resource).toContain(
      "linear-gradient(180deg, rgb(255 255 255 / .075), transparent 34%), " +
        "linear-gradient(145deg, rgb(49 41 77 / .44), rgb(18 12 52 / .62));",
    );
    expect(resource).toContain("border: 1px solid var(--glass-border);");
    expect(resource).toContain("border-radius: var(--radius-card);");
    expect(resource).toContain("box-shadow: var(--shadow-card);");
    expect(resource).toContain("backdrop-filter: blur(14px) saturate(125%);");
  });

  it("не оставляет непрозрачного индиго прошлой версии", () => {
    expect(GLOBAL_CSS).not.toContain("rgb(48 63 131 / .86)");
    expect(GLOBAL_CSS).not.toContain("rgb(184 192 230 / .22)");
  });

  it("рисует блик карточки светом сверху слева и тенью снизу справа", () => {
    const highlight = block(PRIMITIVES_CSS, ".glass-card::before {");
    expect(highlight).toContain(
      "inset 1px 1px 0 rgb(255 255 255 / .075), inset -1px -1px 0 rgb(3 2 18 / .30);",
    );
    expect(highlight).toContain("opacity: .58;");
  });

  it("светлит рамку и смягчает тень при наведении за 420ms", () => {
    expect(block(PRIMITIVES_CSS, ".glass-card--interactive {")).toContain(
      "border-color 420ms cubic-bezier(0.22, 1, 0.36, 1)",
    );

    const hover = block(PRIMITIVES_CSS, ".glass-card--interactive:hover {");
    expect(hover).toContain("border-color: rgb(143 157 214 / .34);");
    expect(hover).toContain(
      "inset 0 1px 0 rgb(255 255 255 / .055), 0 24px 52px rgb(3 2 18 / .30);",
    );
  });
});

/* Файлы шапки, карты и счётчиков читаются, но фазой 7 не правятся: шапка держит
   собственные литералы стекла, а счётчики совпали с оригиналом ещё в v1.0. */
describe("стекло не трогает шапку и счётчики (GLASS-05)", () => {
  it("шапка не читает ни токенов стекла, ни радиуса карточки", () => {
    expect(HEADER_CSS).not.toContain("var(--glass-");
    expect(HEADER_CSS).not.toContain("var(--shadow-card)");
    expect(HEADER_CSS).not.toContain("radius-card");
  });

  it("карта не читает токенов стекла и держит правило счётчика на месте", () => {
    expect(MAP_CSS).not.toContain("var(--glass-");
    expect(MAP_CSS).not.toContain("var(--shadow-card)");
    expect(() => block(MAP_CSS, ".counter {")).not.toThrow();
  });

  it("счётчики не стоят на стеклянной поверхности", () => {
    expect(COUNTERS_TSX).not.toContain("glass");
  });
});
