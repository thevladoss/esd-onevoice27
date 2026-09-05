import { act, fireEvent, render, screen } from "@testing-library/react";

import { formCopy } from "../../data/copy.form";
import { LightForm } from "./LightForm";

/**
 * Отдельный файл: здесь `addLight` всегда отказывает, чтобы проверить ветку, до которой из
 * формы не дотянуться руками — валидация не пропускает страну вне справочника. Контракт
 * «диспатч всегда успешен» нигде не закреплён, поэтому форма обязана считаться с ответом.
 */
const addLight = vi.fn(() => false);

vi.mock("../../state/lights", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../state/lights")>();

  return {
    ...actual,
    useLights: () => ({ lights: [], counts: { people: 0, groups: 0 }, addLight }),
  };
});

function control(name: string): HTMLInputElement {
  const element = document.querySelector<HTMLInputElement>(`[name="${name}"]`);
  if (!element) {
    throw new Error(`Нет контрола ${name}`);
  }

  return element;
}

function fillValidForm() {
  fireEvent.change(control("firstName"), { target: { value: "Иван" } });
  fireEvent.change(control("lastName"), { target: { value: "Иванов" } });
  fireEvent.change(document.querySelector("select[name='countryId']") as HTMLSelectElement, {
    target: { value: "643" },
  });
  fireEvent.change(control("city"), { target: { value: "Москва" } });
  fireEvent.change(control("email"), { target: { value: "ivan@example.org" } });
  fireEvent.click(control("consent"));
}

beforeEach(() => {
  vi.useFakeTimers();
  addLight.mockClear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("LightForm, когда огонёк не зажёгся", () => {
  it("показывает ошибку вместо подтверждения и не чистит форму", () => {
    render(<LightForm />);

    fillValidForm();
    fireEvent.click(screen.getByRole("button", { name: /Зажечь свой свет/ }));
    act(() => {
      vi.advanceTimersByTime(1200);
    });

    expect(addLight).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("alert")).toHaveTextContent(formCopy.failure);
    expect(document.querySelector(".lf-toast")).toBeNull();
    expect(screen.getByRole("status")).toHaveTextContent("");
    // Введённое остаётся на месте: посетителю есть что поправить.
    expect(control("firstName").value).toBe("Иван");
    expect(control("email").value).toBe("ivan@example.org");
  });

  it("убирает сообщение об отказе, как только посетитель правит поле", () => {
    render(<LightForm />);

    fillValidForm();
    fireEvent.click(screen.getByRole("button", { name: /Зажечь свой свет/ }));
    act(() => {
      vi.advanceTimersByTime(1200);
    });
    expect(screen.getByRole("alert")).toBeInTheDocument();

    fireEvent.change(control("city"), { target: { value: "Тула" } });

    expect(screen.queryByRole("alert")).toBeNull();
  });
});
