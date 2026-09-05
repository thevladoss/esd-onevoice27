import { render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { copy } from "../data/copy";
import { Hero } from "./hero/Hero";
import { LightForm } from "./form/LightForm";
import { About } from "./about/About";
import { Involve } from "./involve/Involve";
import { News } from "./news/News";
import { Resources } from "./resources/Resources";
import { Quote } from "./quote/Quote";

type Placeholder = {
  name: string;
  Component: () => ReactElement;
  id: string;
  headingLevel: 1 | 2;
  text: { eyebrow: string; title: string; body: string };
};

const placeholders: Placeholder[] = [
  { name: "Hero", Component: Hero, id: "hero", headingLevel: 1, text: copy.sections.hero },
  {
    name: "LightForm",
    Component: LightForm,
    id: "light-form",
    headingLevel: 2,
    text: copy.sections.lightForm,
  },
  { name: "About", Component: About, id: "about", headingLevel: 2, text: copy.sections.about },
  {
    name: "Involve",
    Component: Involve,
    id: "involve",
    headingLevel: 2,
    text: copy.sections.involve,
  },
  { name: "News", Component: News, id: "news", headingLevel: 2, text: copy.sections.news },
  {
    name: "Resources",
    Component: Resources,
    id: "resources",
    headingLevel: 2,
    text: copy.sections.resources,
  },
  { name: "Quote", Component: Quote, id: "quote", headingLevel: 2, text: copy.sections.quote },
];

const forbiddenWords = ["скоро", "coming soon", "todo", "lorem"];

for (const { name, Component, id, headingLevel, text } of placeholders) {
  describe(`Заглушка ${name}`, () => {
    it("рендерит секцию с надзаголовком, заголовком и телом из copy.ts", () => {
      render(<Component />);
      const section = document.getElementById(id);
      expect(section).not.toBeNull();
      expect(section?.tagName).toBe("SECTION");
      expect(section?.querySelector("p.eyebrow")).toHaveTextContent(text.eyebrow);
      expect(
        screen.getByRole("heading", { level: headingLevel, name: text.title }),
      ).toBeInTheDocument();
      expect(screen.getByText(text.body)).toBeInTheDocument();
    });

    it("держит тело в стеклянной карточке", () => {
      render(<Component />);
      const card = document.querySelector(`#${id} .glass-card`);
      expect(card).not.toBeNull();
      expect(card).toHaveTextContent(text.body);
    });

    it("говорит, что появится, без извиняющихся формулировок", () => {
      render(<Component />);
      const rendered = (document.body.textContent ?? "").toLowerCase();
      for (const word of forbiddenWords) {
        expect(rendered).not.toContain(word);
      }
    });

    if (headingLevel === 2) {
      it("не содержит заголовка первого уровня", () => {
        render(<Component />);
        expect(screen.queryByRole("heading", { level: 1 })).toBeNull();
      });
    }
  });
}

describe("Hero", () => {
  it("держит единственный заголовок первого уровня", () => {
    render(<Hero />);
    expect(
      screen.getByRole("heading", { level: 1, name: copy.sections.hero.title }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("heading")).toHaveLength(1);
  });

  it("даёт кнопку-ссылку на форму внутри той же карточки, что и тело", () => {
    render(<Hero />);
    const link = screen.getByRole("link", { name: copy.cta.lightYourLight.label });
    expect(link).toHaveAttribute("href", copy.cta.lightYourLight.href);
    expect(link).toHaveClass("btn", "btn--primary");
    const card = document.querySelector(".glass-card");
    expect(card).toContainElement(link as HTMLElement);
    expect(card).toHaveTextContent(copy.sections.hero.body);
  });
});
