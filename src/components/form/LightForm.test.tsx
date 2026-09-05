import { act, fireEvent, render, screen } from "@testing-library/react";

import { formCopy } from "../../data/copy.form";
import { LightsProvider, useLights } from "../../state/lights";
import { LightForm } from "./LightForm";

/** Счётчики и последний огонёк читаются прямо из контекста: карта в этом тесте не нужна. */
function CountsProbe() {
  const { counts, lights } = useLights();
  const last = lights[lights.length - 1];

  return (
    <div>
      <span data-testid="probe-people">{counts.people}</span>
      <span data-testid="probe-groups">{counts.groups}</span>
      <span data-testid="probe-last">
        {JSON.stringify({ type: last.type, countryId: last.countryId })}
      </span>
    </div>
  );
}

function renderForm() {
  return render(
    <LightsProvider>
      <LightForm />
      <CountsProbe />
    </LightsProvider>,
  );
}

function control(name: string): HTMLInputElement {
  const element = document.getElementById(`light-form-${name}`);
  if (!element) {
    throw new Error(`Нет контрола light-form-${name}`);
  }

  return element as HTMLInputElement;
}

function errorNodes(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>('[id^="light-form-"][id$="-error"]'));
}

function submitButton(): HTMLButtonElement {
  return document.getElementById("light-form-submit") as HTMLButtonElement;
}

function clickSubmit() {
  fireEvent.click(screen.getByRole("button", { name: /Зажечь свой свет/ }));
}

/** Визуальная карточка тоста: она aria-hidden, поэтому ищется по классу, а не по роли. */
function toastCard(): HTMLElement | null {
  return document.querySelector<HTMLElement>(".lf-toast");
}

/** Живой регион формы: смонтирован всегда, текст появляется только после успеха. */
function liveRegion(): HTMLElement {
  return screen.getByRole("status");
}

function fillValidForm() {
  fireEvent.click(screen.getByRole("radio", { name: /Групповой маяк/ }));
  fireEvent.change(control("firstName"), { target: { value: "Иван" } });
  fireEvent.change(control("lastName"), { target: { value: "Иванов" } });
  fireEvent.change(control("countryId"), { target: { value: "643" } });
  fireEvent.change(control("city"), { target: { value: "Москва" } });
  fireEvent.change(control("email"), { target: { value: "ivan@example.org" } });
  fireEvent.click(control("consent"));
}

/** По умолчанию движение разрешено: тост проходит фазу ухода в 200 мс. */
function mockReducedMotion(reduced: boolean) {
  window.matchMedia = vi.fn((query: string) => ({
    matches: reduced && query.includes("prefers-reduced-motion"),
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

beforeEach(() => {
  vi.useFakeTimers();
  mockReducedMotion(false);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("LightForm: структура секции", () => {
  it("рендерит секцию #light-form с надзаголовком, H2 и двумя типами света", () => {
    renderForm();

    const section = document.getElementById("light-form");
    expect(section).not.toBeNull();
    expect(section?.tagName).toBe("SECTION");
    expect(screen.getByRole("heading", { level: 2, name: formCopy.title })).toBeInTheDocument();
    expect(screen.getByText(formCopy.eyebrow)).toBeInTheDocument();

    const individual = screen.getByRole("radio", { name: /Индивидуальный свет/ });
    const group = screen.getByRole("radio", { name: /Групповой маяк/ });
    expect(individual).toBeChecked();
    expect(group).not.toBeChecked();
    expect(
      screen.getByText("Я лично посвящаю себя молитве, изучению и миссии там, где живу."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Церковь, школа, малая группа, семья или коллектив, которые идут вместе."),
    ).toBeInTheDocument();
  });

  it("даёт select из двенадцати стран дивизиона с плейсхолдером", () => {
    renderForm();

    const select = document.getElementById("light-form-countryId") as HTMLSelectElement;
    expect(select.options).toHaveLength(13);
    expect(select.options[0].value).toBe("");
    expect(select.options[0].textContent).toBe("Выберите страну");
    expect(select.value).toBe("");

    const russia = Array.from(select.options).find((option) => option.value === "643");
    expect(russia?.textContent).toBe("Россия");
  });

  it("не отправляет форму по сети: без action и method", () => {
    renderForm();

    const form = document.getElementById("light-form")?.querySelector("form");
    expect(form).not.toBeNull();
    expect(form?.hasAttribute("action")).toBe(false);
    expect(form?.hasAttribute("method")).toBe(false);
  });
});

describe("LightForm: валидация", () => {
  it("на пустой отправке показывает шесть ошибок и уводит фокус на имя", () => {
    renderForm();
    clickSubmit();

    expect(errorNodes().map((node) => node.textContent)).toEqual([
      "Введите имя",
      "Введите фамилию",
      "Выберите страну",
      "Укажите город",
      "Введите корректный email",
      "Нужно согласие на обработку данных",
    ]);

    const invalid = Array.from(document.querySelectorAll('[aria-invalid="true"]'));
    expect(invalid).toHaveLength(6);
    for (const node of invalid) {
      expect(node.getAttribute("aria-describedby")).toBe(`${node.id}-error`);
    }

    expect(document.activeElement).toBe(control("firstName"));
    expect(screen.getByTestId("probe-groups")).toHaveTextContent("248");
  });

  it("перепроверяет поле на blur только после первой попытки", () => {
    renderForm();

    fireEvent.change(control("firstName"), { target: { value: "И" } });
    fireEvent.blur(control("firstName"));
    expect(errorNodes()).toHaveLength(0);

    clickSubmit();
    expect(errorNodes()).toHaveLength(6);

    fireEvent.change(control("firstName"), { target: { value: "Иван" } });
    expect(document.getElementById("light-form-firstName-error")).toBeNull();
    expect(errorNodes()).toHaveLength(5);

    fireEvent.change(control("firstName"), { target: { value: "И" } });
    expect(document.getElementById("light-form-firstName-error")).toBeNull();

    fireEvent.blur(control("firstName"));
    expect(document.getElementById("light-form-firstName-error")).toHaveTextContent("Введите имя");
  });
});

describe("LightForm: успешная отправка", () => {
  it("зажигает групповой маяк, растит счётчик и сбрасывает поля", () => {
    renderForm();
    fillValidForm();
    clickSubmit();

    expect(submitButton()).toBeDisabled();
    expect(submitButton()).toHaveAttribute("aria-busy", "true");
    expect(submitButton()).toHaveTextContent("Зажигаем…");
    expect(screen.getByTestId("probe-groups")).toHaveTextContent("248");

    act(() => {
      vi.advanceTimersByTime(1200);
    });

    expect(screen.getByTestId("probe-groups")).toHaveTextContent("249");
    expect(screen.getByTestId("probe-people")).toHaveTextContent("694");
    expect(screen.getByTestId("probe-last")).toHaveTextContent(
      '{"type":"group","countryId":643}',
    );

    expect(liveRegion()).toHaveTextContent("Ваш свет зажжён! Огонёк уже на карте.");
    expect(toastCard()).toHaveTextContent("Ваш свет зажжён! Огонёк уже на карте.");

    expect(control("firstName").value).toBe("");
    expect(control("lastName").value).toBe("");
    expect(control("city").value).toBe("");
    expect(control("email").value).toBe("");
    expect((document.getElementById("light-form-countryId") as HTMLSelectElement).value).toBe("");
    expect(control("consent")).not.toBeChecked();
    expect(screen.getByRole("radio", { name: /Групповой маяк/ })).toBeChecked();

    expect(submitButton()).toBeEnabled();
    expect(submitButton()).toHaveTextContent("Зажечь свой свет");
    expect(submitButton()).not.toHaveAttribute("aria-busy");
    expect(document.activeElement).toBe(submitButton());
  });
});

describe("LightForm: объявление успеха", () => {
  it("держит живой регион пустым до отправки и наполняет его после успеха", () => {
    renderForm();

    const region = liveRegion();
    expect(region).toBeInTheDocument();
    expect(region).toHaveAttribute("aria-live", "polite");
    expect(region.textContent).toBe("");

    fillValidForm();
    clickSubmit();
    act(() => {
      vi.advanceTimersByTime(1200);
    });

    expect(liveRegion()).toBe(region);
    expect(region.textContent).toBe("Ваш свет зажжён! Огонёк уже на карте.");
  });

  it("прячет визуальную карточку от скринридера и оставляет одну живую область", () => {
    renderForm();
    fillValidForm();
    clickSubmit();
    act(() => {
      vi.advanceTimersByTime(1200);
    });

    expect(toastCard()).toHaveAttribute("aria-hidden", "true");
    expect(screen.getAllByRole("status")).toHaveLength(1);
  });

  it("очищает живой регион, когда тост закрылся", () => {
    renderForm();
    fillValidForm();
    clickSubmit();
    act(() => {
      vi.advanceTimersByTime(1200);
    });
    act(() => {
      vi.advanceTimersByTime(4000 + 200);
    });

    expect(toastCard()).toBeNull();
    expect(liveRegion().textContent).toBe("");
  });
});

describe("LightForm: тост", () => {
  it("убирает тост через четыре секунды", () => {
    renderForm();
    fillValidForm();
    clickSubmit();

    act(() => {
      vi.advanceTimersByTime(1200);
    });
    expect(toastCard()).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(toastCard()).toHaveAttribute("data-state", "closing");

    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(toastCard()).toBeNull();
  });

  it("закрывает тост по клику раньше таймера", () => {
    renderForm();
    fillValidForm();
    clickSubmit();

    act(() => {
      vi.advanceTimersByTime(1200);
    });

    fireEvent.click(toastCard() as HTMLElement);
    expect(toastCard()).toHaveAttribute("data-state", "closing");

    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(toastCard()).toBeNull();

    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(toastCard()).toBeNull();
  });

  it("при уменьшенном движении убирает тост по клику без фазы ухода", () => {
    mockReducedMotion(true);
    renderForm();
    fillValidForm();
    clickSubmit();

    act(() => {
      vi.advanceTimersByTime(1200);
    });
    expect(toastCard()).toHaveAttribute("data-state", "open");

    fireEvent.click(toastCard() as HTMLElement);
    expect(toastCard()).toBeNull();

    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(toastCard()).toBeNull();
  });
});
