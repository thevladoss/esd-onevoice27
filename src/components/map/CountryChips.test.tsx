import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { CountryChips } from "./CountryChips";
import { ZoomHint } from "./ZoomHint";

const ORDER = [
  "Весь дивизион",
  "Россия",
  "Казахстан",
  "Беларусь",
  "Молдова",
  "Узбекистан",
  "Кыргызстан",
  "Таджикистан",
  "Грузия",
  "Армения",
  "Азербайджан",
  "Туркменистан",
  "Афганистан",
];

function chips(): HTMLElement[] {
  return screen.getAllByRole("button");
}

describe("CountryChips", () => {
  it("собирает чипы в группу с подписью и отмечает весь дивизион", () => {
    render(<CountryChips selectedId={null} onSelect={vi.fn()} />);

    expect(screen.getByRole("group", { name: "Показать страну на карте" })).toBeInTheDocument();
    const buttons = chips();
    expect(buttons).toHaveLength(13);
    expect(buttons[0]).toHaveAttribute("aria-pressed", "true");
    for (const button of buttons.slice(1)) {
      expect(button).toHaveAttribute("aria-pressed", "false");
    }
  });

  it("держит порядок стран по убыванию веса", () => {
    render(<CountryChips selectedId={null} onSelect={vi.fn()} />);
    expect(chips().map((button) => button.textContent)).toEqual(ORDER);
  });

  it("выбирает страну по клику и переносит на неё отметку", async () => {
    const onSelect = vi.fn();
    const { rerender } = render(<CountryChips selectedId={null} onSelect={onSelect} />);

    await userEvent.click(screen.getByRole("button", { name: "Россия" }));
    expect(onSelect).toHaveBeenCalledWith(643);

    rerender(<CountryChips selectedId={643} onSelect={onSelect} />);
    expect(screen.getByRole("button", { name: "Россия" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Весь дивизион" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("возвращает обзор дивизиона", async () => {
    const onSelect = vi.fn();
    render(<CountryChips selectedId={643} onSelect={onSelect} />);

    await userEvent.click(screen.getByRole("button", { name: "Весь дивизион" }));
    expect(onSelect).toHaveBeenCalledWith(null);
  });

  it("выбирает страну с клавиатуры по Enter и пробелу", async () => {
    const onSelect = vi.fn();
    render(<CountryChips selectedId={null} onSelect={onSelect} />);

    // Весь дивизион, Россия, Казахстан, Беларусь.
    await userEvent.tab();
    await userEvent.tab();
    await userEvent.tab();
    await userEvent.tab();
    expect(screen.getByRole("button", { name: "Беларусь" })).toHaveFocus();

    await userEvent.keyboard("{Enter}");
    expect(onSelect).toHaveBeenCalledWith(112);

    onSelect.mockClear();
    await userEvent.keyboard(" ");
    expect(onSelect).toHaveBeenCalledWith(112);
  });

  it("гасит чипы, когда карта не отрисовалась, но оставляет их в таб-порядке", async () => {
    const onSelect = vi.fn();
    render(<CountryChips selectedId={null} onSelect={onSelect} disabled />);

    const buttons = chips();
    expect(buttons).toHaveLength(13);
    for (const button of buttons) {
      expect(button).toHaveAttribute("aria-disabled", "true");
      expect(button).not.toHaveAttribute("disabled");
    }

    await userEvent.click(screen.getByRole("button", { name: "Россия" }));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("переносит отметку на Казахстан и отдаёт его код наверх", async () => {
    const onSelect = vi.fn();
    const { rerender } = render(<CountryChips selectedId={null} onSelect={onSelect} />);

    const kazakhstan = screen.getByRole("button", { name: "Казахстан" });
    await userEvent.click(kazakhstan);
    expect(onSelect).toHaveBeenCalledWith(398);

    rerender(<CountryChips selectedId={398} onSelect={onSelect} />);
    expect(screen.getByRole("button", { name: "Казахстан" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(chips().filter((button) => button.getAttribute("aria-pressed") === "true")).toHaveLength(
      1,
    );
  });

  it("срабатывает по Enter на сфокусированном чипе Казахстана", async () => {
    const onSelect = vi.fn();
    render(<CountryChips selectedId={null} onSelect={onSelect} />);

    const kazakhstan = screen.getByRole("button", { name: "Казахстан" });
    kazakhstan.focus();
    expect(kazakhstan).toHaveFocus();

    await userEvent.keyboard("{Enter}");
    expect(onSelect).toHaveBeenCalledWith(398);
  });
});

describe("ZoomHint", () => {
  it("объясняет жесты и мышью, и пальцами", () => {
    const { container } = render(<ZoomHint />);

    const hint = container.querySelector(".map-hint");
    expect(hint).toBeInTheDocument();
    expect(hint?.querySelectorAll("span")).toHaveLength(2);
    expect(screen.getByText("Масштаб: ⌘ / Ctrl + колесо. Сдвиг: перетаскивание")).toBeInTheDocument();
    expect(screen.getByText("Два пальца: масштаб и сдвиг")).toBeInTheDocument();
  });
});
