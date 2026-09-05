import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { heroCopy } from "../../data/copy.hero";
import { Hero } from "./Hero";

describe("Hero", () => {
  it("рендерит секцию #hero с надзаголовком", () => {
    render(<Hero />);
    const section = document.getElementById("hero");
    expect(section).not.toBeNull();
    expect(section?.tagName).toBe("SECTION");
    expect(screen.getByText("Единое глобальное движение")).toBeInTheDocument();
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

  it("кладёт в секцию декоративное звёздное поле", () => {
    render(<Hero />);
    const starfield = document.querySelector("#hero .starfield");
    expect(starfield).not.toBeNull();
    expect(starfield).toHaveAttribute("aria-hidden", "true");
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
