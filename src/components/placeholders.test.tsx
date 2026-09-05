import { render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { copy } from "../data/copy";
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

// Готовые секции (hero, map, light-form, about, involve) живут в собственных наборах тестов
// рядом с компонентами; здесь проверяются только оставшиеся заглушки фазы 1.
const placeholders: Placeholder[] = [
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
      const haystack = `${text.eyebrow} ${text.title} ${text.body}`.toLowerCase();
      for (const word of forbiddenWords) {
        expect(haystack).not.toContain(word);
      }
    });
  });
}
