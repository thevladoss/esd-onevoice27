import { render, screen } from "@testing-library/react";
import App from "./App";
import { LightsProvider } from "./state/lights";

// Секция карты, счётчики и форма читают контекст огоньков, поэтому приложение живёт под провайдером.
function renderApp() {
  return render(
    <LightsProvider>
      <App />
    </LightsProvider>,
  );
}

const expectedSectionIds = [
  "hero",
  "map",
  "light-form",
  "about",
  "involve",
  "news",
  "resources",
  "quote",
];


describe("App", () => {
  it("рендерит восемь секций с ожидаемыми id", () => {
    renderApp();
    for (const id of expectedSectionIds) {
      const section = document.getElementById(id);
      expect(section).not.toBeNull();
      expect(section?.tagName).toBe("SECTION");
    }
  });

  it("рендерит ландмарки: main#main, header и footer", () => {
    renderApp();
    expect(document.querySelector("main#main")).not.toBeNull();
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });

  it("даёт ссылку «Перейти к содержимому» на #main", () => {
    renderApp();
    expect(screen.getByRole("link", { name: "Перейти к содержимому" })).toHaveAttribute(
      "href",
      "#main",
    );
  });

  it("ставит ссылку пропуска первой в обходе с клавиатуры", () => {
    const { container } = renderApp();
    const focusable = container.querySelectorAll<HTMLElement>(
      'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );

    expect(focusable[0]).toHaveAccessibleName("Перейти к содержимому");
    // Дальше по контракту идут вордмарк и пункты меню, то есть шапка.
    expect(focusable[1].closest("header")).not.toBeNull();
  });

  it("делает main фокусируемым, чтобы ссылка пропуска доводила фокус до контента", () => {
    renderApp();
    const main = document.querySelector("main#main");

    expect(main).toHaveAttribute("tabindex", "-1");

    (main as HTMLElement).focus();
    expect(document.activeElement).toBe(main);
  });

  it("все восемь секций содержат реальную вёрстку, а не заглушки", () => {
    renderApp();
    for (const id of expectedSectionIds) {
      const section = document.getElementById(id);
      expect(section?.textContent?.trim().length ?? 0).toBeGreaterThan(20);
    }
  });
});

describe("App: контракт оболочки", () => {
  // Шпион пропускает вызов дальше, поэтому предупреждения React (act, ключи,
  // невалидная вложенность DOM) остаются видны в выводе прогона и одновременно
  // роняют тест.
  const consoleError = vi.spyOn(console, "error");
  const consoleWarn = vi.spyOn(console, "warn");

  beforeEach(() => {
    consoleError.mockClear();
    consoleWarn.mockClear();
  });

  afterAll(() => {
    consoleError.mockRestore();
    consoleWarn.mockRestore();
  });

  it("рендерит страницу молча: ни ошибок, ни предупреждений в консоли", () => {
    expect(() => renderApp()).not.toThrow();

    expect(consoleError).not.toHaveBeenCalled();
    expect(consoleWarn).not.toHaveBeenCalled();
  });

  it("не кладёт поточный контент внутрь кнопок ни в одной секции", () => {
    renderApp();

    // React такую вложенность не проверяет, а браузер чинит разметку по-своему:
    // <p> внутри <button> закрывает кнопку раньше времени.
    const offenders = Array.from(document.querySelectorAll("button"))
      .filter((button) =>
        button.querySelector("p, div, h1, h2, h3, h4, h5, h6, ul, ol, li, section, article"),
      )
      .map((button) => button.outerHTML.slice(0, 120));

    expect(offenders).toEqual([]);
  });

  it("называет каждую секцию её заголовком через aria-labelledby", () => {
    renderApp();

    const labelIds = expectedSectionIds.map((id) => {
      const section = document.getElementById(id);
      const labelId = section?.getAttribute("aria-labelledby");
      expect(labelId, `у секции #${id} нет aria-labelledby`).toBeTruthy();

      const label = document.getElementById(labelId as string);
      expect(label, `aria-labelledby секции #${id} ведёт в пустоту`).not.toBeNull();
      expect(label?.textContent?.trim()).not.toBe("");

      return labelId;
    });

    expect(labelIds).toEqual([
      "hero-title",
      "map-title",
      "form-title",
      "about-title",
      "involve-title",
      "news-title",
      "resources-title",
      "quote-title",
    ]);
  });

  it("держит на странице ровно один h1", () => {
    renderApp();

    const headings = document.querySelectorAll("h1");
    expect(headings).toHaveLength(1);
    expect(headings[0].id).toBe("hero-title");
  });

  it("ставит ссылку пропуска первой ссылкой документа и выше шапки", () => {
    renderApp();

    const first = document.querySelector("a");
    expect(first).toHaveTextContent("Перейти к содержимому");
    expect(first?.getAttribute("href")).toMatch(/#main$/);
    expect(document.querySelector("main#main")).not.toBeNull();

    const header = document.querySelector("header") as HTMLElement;
    const position = (first as HTMLElement).compareDocumentPosition(header);
    expect(position & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("объявляет ландмарки навигации и подвала", () => {
    renderApp();

    expect(screen.getByRole("navigation", { name: "Основная навигация" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Внешние ссылки" })).toBeInTheDocument();
    expect(document.querySelector("footer")).not.toBeNull();
  });

  it("не отдаёт внешним вкладкам доступ к opener", () => {
    renderApp();

    // Значение в селекторе без кавычек намеренно: построчный аудит ссылок в
    // motionPolicy.test.ts ищет точную пару атрибутов и принял бы строку теста
    // за незащищённую ссылку.
    const external = document.querySelectorAll("a[target=_blank]");
    expect(external.length).toBeGreaterThan(0);
    expect(document.querySelectorAll('a[target=_blank]:not([rel~="noopener"])')).toHaveLength(0);
  });

  it("держит data-anim в словаре политики движения", () => {
    // Словарь из 05-UI-SPEC: блок reduced motion в global.css гасит движение по
    // этим же именам, и любое новое значение прошло бы мимо него.
    const known = new Set([
      "stars",
      "globe",
      "beam",
      "pulse",
      "new-light",
      "particles",
      "atmosphere",
      "wave",
      "halo",
    ]);

    renderApp();

    const used = new Set(
      Array.from(document.querySelectorAll<HTMLElement>("[data-anim]")).map(
        (node) => node.dataset.anim as string,
      ),
    );

    expect(used.size).toBeGreaterThan(0);
    expect([...used].filter((name) => !known.has(name))).toEqual([]);
  });
});
