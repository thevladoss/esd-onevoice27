import { render, screen } from "@testing-library/react";
import { Section } from "./Section";
import { Eyebrow } from "./Eyebrow";
import { GradientTitle } from "./GradientTitle";
import { Button } from "./Button";
import { GlassCard } from "./GlassCard";

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
    expect(screen.getByRole("button", { name: "Отправить" })).toHaveAttribute(
      "data-anim",
      "beam",
    );

    rerender(<Button variant="ghost">Отправить</Button>);
    expect(screen.getByRole("button", { name: "Отправить" })).not.toHaveAttribute("data-anim");
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
