import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { act, fireEvent, render, screen } from "@testing-library/react";

import { formCopy } from "../../data/copy.form";
import { LightsProvider, useLights } from "../../state/lights";
import { Counters } from "../map/Counters";
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

/** id полей теперь уникальны на экземпляр формы (useId), поэтому контролы ищем по name. */
function control(name: string): HTMLInputElement {
  const element = document.querySelector<HTMLInputElement>(`[name="${name}"]`);
  if (!element) {
    throw new Error(`Нет контрола ${name}`);
  }

  return element;
}

function countrySelect(): HTMLSelectElement {
  const element = document.querySelector<HTMLSelectElement>('select[name="countryId"]');
  if (!element) {
    throw new Error("Нет select страны");
  }

  return element;
}

/** Текст ошибки поля: связь идёт через aria-describedby, а не через угаданный id. */
function errorFor(name: string): HTMLElement | null {
  const errorId = control(name).getAttribute("aria-describedby");

  return errorId === null ? null : document.getElementById(errorId);
}

function errorNodes(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>(".lf-error"));
}

function submitButton(): HTMLButtonElement {
  const element = document.querySelector<HTMLButtonElement>('button[type="submit"]');
  if (!element) {
    throw new Error("Нет кнопки отправки");
  }

  return element;
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
  fireEvent.change(control("orgName"), { target: { value: "Община Твери" } });
  fireEvent.change(control("firstName"), { target: { value: "Иван" } });
  fireEvent.change(control("lastName"), { target: { value: "Иванов" } });
  fireEvent.change(countrySelect(), { target: { value: "643" } });
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

    expect(screen.getByRole("radiogroup", { name: "Тип света" })).toBeInTheDocument();

    // При загрузке тип не выбран, как в оригинале: посетитель делает выбор сам.
    const individual = screen.getByRole("radio", { name: /Личный свет/ });
    const group = screen.getByRole("radio", { name: /Групповой маяк/ });
    expect(individual).not.toBeChecked();
    expect(group).not.toBeChecked();
    expect(
      screen.getByText("Я лично посвящаю себя молитве, изучению Библии и миссии там, где живу."),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Церковь, школа, малая группа, семья или коллектив, которые посвящают себя вместе.",
      ),
    ).toBeInTheDocument();
  });

  it("называет секцию её заголовком через aria-labelledby", () => {
    renderForm();

    const section = document.getElementById("light-form");
    expect(section).toHaveAttribute("aria-labelledby", "form-title");
    expect(screen.getByRole("heading", { level: 2 })).toHaveAttribute("id", "form-title");
    expect(screen.getByRole("region", { name: formCopy.title })).toBe(section);
  });

  it("даёт select из двенадцати стран дивизиона с плейсхолдером", () => {
    renderForm();

    const select = countrySelect();
    expect(select.options).toHaveLength(13);
    expect(select.options[0].value).toBe("");
    expect(select.options[0].textContent).toBe("Выберите страну");
    expect(select.value).toBe("");

    const russia = Array.from(select.options).find((option) => option.value === "643");
    expect(russia?.textContent).toBe("Россия");
  });

  it("даёт двум формам на странице непересекающиеся id", () => {
    render(
      <LightsProvider>
        <LightForm />
        <LightForm />
      </LightsProvider>,
    );

    // Подпись и описание ошибки должны вести к своему контролу, а не к первой форме.
    const names = screen.getAllByLabelText(/^Имя/);
    expect(names).toHaveLength(2);
    expect(names[0].id).not.toBe(names[1].id);

    // Якорь секции #light-form общий по замыслу, а вот id контролов пересекаться не должны.
    const ids = Array.from(document.querySelectorAll("form")).flatMap((form) =>
      Array.from(form.querySelectorAll<HTMLElement>("[id]")).map((node) => node.id),
    );
    // Одиннадцать на форму: группа типа и её подпись, две радио-карточки,
    // пять полей, согласие и кнопка отправки.
    expect(ids).toHaveLength(22);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("связывает каждый контрол с видимой подписью через htmlFor", () => {
    const { container } = renderForm();

    function labelledControls() {
      const controls = Array.from(
        container.querySelectorAll<HTMLInputElement>("form input, form select"),
      );

      for (const node of controls) {
        const label = container.querySelector(`label[for="${node.id}"]`);
        expect(label, `нет подписи для контрола #${node.id}`).not.toBeNull();
        expect(label?.textContent?.trim()).not.toBe("");
      }

      return controls;
    }

    fireEvent.click(screen.getByRole("radio", { name: /Личный свет/ }));
    expect(labelledControls()).toHaveLength(8);

    fireEvent.click(screen.getByRole("radio", { name: /Групповой маяк/ }));
    expect(labelledControls()).toHaveLength(9);

    const orgLabel = container.querySelector(`label[for="${control("orgName").id}"]`);
    expect(orgLabel?.textContent?.trim().startsWith("Название организации")).toBe(true);
  });

  it("стоит на секции без стеклянной карточки", () => {
    renderForm();

    expect(document.querySelector("#light-form .glass-card")).toBeNull();

    const form = document.querySelector<HTMLFormElement>("#light-form form");
    expect(form).not.toBeNull();
    // Форма лежит прямо в обёртке появления: слоя карточки между ними больше нет.
    expect(form?.parentElement?.className ?? "").not.toContain("glass");
  });

  it("несёт в карточке типа строку «название + точка»", () => {
    renderForm();

    const rows = Array.from(document.querySelectorAll(".lf-type .lf-type-row"));
    expect(rows).toHaveLength(2);
    for (const row of rows) {
      expect(row.querySelector(".lf-type-title")).not.toBeNull();
      expect(row.querySelector('.lf-type-dot[aria-hidden="true"]')).not.toBeNull();
    }

    const cards = Array.from(document.querySelectorAll<HTMLElement>(".lf-type"));
    expect(cards.map((card) => card.dataset.type)).toEqual(["individual", "group"]);
  });

  it("даёт согласию нативный видимый чекбокс", () => {
    renderForm();

    const consent = control("consent");
    expect(consent.classList.contains("lf-checkbox")).toBe(true);
    expect(consent.classList.contains("sr-only")).toBe(false);
    expect(document.querySelector(".lf-check-box")).toBeNull();
  });

  it("ставит поля в сетку шести колонок", () => {
    renderForm();

    const halves = [control("firstName"), control("lastName"), countrySelect(), control("city")];
    for (const node of halves) {
      expect(node.closest(".lf-field")).toHaveClass("lf-col-3");
    }
    expect(control("email").closest(".lf-field")).toHaveClass("lf-span");

    fireEvent.click(screen.getByRole("radio", { name: /Групповой маяк/ }));

    const orgField = control("orgName").closest(".lf-field");
    const nameField = control("firstName").closest(".lf-field");
    expect(orgField).toHaveClass("lf-span");
    // Организация стоит в разметке раньше имени, как в оригинале.
    const position = orgField?.compareDocumentPosition(nameField as Node) ?? 0;
    expect(position & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
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
  it("на пустой отправке показывает шесть ошибок и уводит фокус на группу типа", () => {
    renderForm();
    clickSubmit();

    expect(errorNodes().map((node) => node.textContent)).toEqual([
      "Выберите тип света",
      "Введите имя",
      "Введите фамилию",
      "Выберите страну",
      "Введите корректный email",
      "Нужно согласие на обработку данных",
    ]);

    const invalid = Array.from(document.querySelectorAll('[aria-invalid="true"]'));
    expect(invalid).toHaveLength(6);
    for (const node of invalid) {
      expect(node.getAttribute("aria-describedby")).toBe(`${node.id}-error`);
    }

    expect(document.activeElement).toBe(screen.getByRole("radiogroup"));
    expect(screen.getByTestId("probe-groups")).toHaveTextContent("248");
  });

  it("выбор типа гасит ошибку группы и не приносит поле организации", () => {
    renderForm();
    clickSubmit();
    expect(errorNodes()).toHaveLength(6);

    fireEvent.click(screen.getByRole("radio", { name: /Личный свет/ }));

    expect(screen.queryByText("Выберите тип света")).toBeNull();
    expect(errorNodes()).toHaveLength(5);
    expect(document.querySelector('[name="orgName"]')).toBeNull();
  });

  it("групповой маяк требует название организации", () => {
    renderForm();

    fireEvent.click(screen.getByRole("radio", { name: /Групповой маяк/ }));
    expect(control("orgName")).toHaveAttribute("placeholder", "Например, община в Твери");

    clickSubmit();

    expect(errorNodes().map((node) => node.textContent)).toEqual([
      "Укажите название организации",
      "Введите имя",
      "Введите фамилию",
      "Выберите страну",
      "Введите корректный email",
      "Нужно согласие на обработку данных",
    ]);
    expect(document.activeElement).toBe(control("orgName"));
  });

  it("возврат к личному свету убирает поле организации вместе с ошибкой", () => {
    renderForm();

    fireEvent.click(screen.getByRole("radio", { name: /Групповой маяк/ }));
    clickSubmit();
    expect(errorFor("orgName")).toHaveTextContent("Укажите название организации");

    fireEvent.click(screen.getByRole("radio", { name: /Личный свет/ }));

    expect(document.querySelector('[name="orgName"]')).toBeNull();
    expect(screen.queryByText("Укажите название организации")).toBeNull();
  });

  it("повторный выбор группы даёт пустое поле организации", () => {
    renderForm();

    fireEvent.click(screen.getByRole("radio", { name: /Групповой маяк/ }));
    fireEvent.change(control("orgName"), { target: { value: "Община" } });
    expect(control("orgName").value).toBe("Община");

    fireEvent.click(screen.getByRole("radio", { name: /Личный свет/ }));
    fireEvent.click(screen.getByRole("radio", { name: /Групповой маяк/ }));

    expect(control("orgName").value).toBe("");
  });

  it("уводит фокус на согласие, когда всё остальное заполнено", () => {
    renderForm();
    fillValidForm();
    fireEvent.click(control("consent"));
    clickSubmit();

    expect(errorNodes().map((node) => node.textContent)).toEqual([
      "Нужно согласие на обработку данных",
    ]);
    expect(document.activeElement).toBe(control("consent"));
  });

  it("перепроверяет поле на blur только после первой попытки", () => {
    renderForm();

    fireEvent.change(control("firstName"), { target: { value: "И" } });
    fireEvent.blur(control("firstName"));
    expect(errorNodes()).toHaveLength(0);

    clickSubmit();
    expect(errorNodes()).toHaveLength(6);

    fireEvent.change(control("firstName"), { target: { value: "Иван" } });
    expect(errorFor("firstName")).toBeNull();
    expect(errorNodes()).toHaveLength(5);

    fireEvent.change(control("firstName"), { target: { value: "И" } });
    expect(errorFor("firstName")).toBeNull();

    fireEvent.blur(control("firstName"));
    expect(errorFor("firstName")).toHaveTextContent("Введите имя");
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

    expect(control("orgName").value).toBe("");
    expect(control("firstName").value).toBe("");
    expect(control("lastName").value).toBe("");
    expect(control("city").value).toBe("");
    expect(control("email").value).toBe("");
    expect(countrySelect().value).toBe("");
    expect(control("consent")).not.toBeChecked();
    expect(screen.getByRole("radio", { name: /Групповой маяк/ })).toBeChecked();

    expect(submitButton()).toBeEnabled();
    expect(submitButton()).toHaveTextContent("Зажечь свой свет");
    expect(submitButton()).not.toHaveAttribute("aria-busy");
    expect(document.activeElement).toBe(submitButton());
  });

  it("блокирует поля на время отправки и снова открывает их после успеха", () => {
    renderForm();
    fillValidForm();
    clickSubmit();

    expect(control("firstName")).toBeDisabled();
    expect(control("consent")).toBeDisabled();
    expect(countrySelect()).toBeDisabled();
    expect(screen.getByRole("radio", { name: /Групповой маяк/ })).toBeDisabled();

    act(() => {
      vi.advanceTimersByTime(1200);
    });

    expect(control("firstName")).toBeEnabled();
    expect(control("consent")).toBeEnabled();
    expect(screen.getByRole("radio", { name: /Групповой маяк/ })).toBeEnabled();
  });

  it("не отбирает фокус, если пользователь ушёл в другое место страницы", () => {
    renderForm();
    fillValidForm();
    clickSubmit();

    const outside = document.createElement("button");
    document.body.append(outside);
    outside.focus();

    act(() => {
      vi.advanceTimersByTime(1200);
    });

    expect(document.activeElement).toBe(outside);
    outside.remove();
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

describe("LightForm: подсказка ошибки и счётчики карты", () => {
  /** Счётчики карты рядом с формой: огонёк посетителя должен долететь до них через контекст. */
  function renderWithCounters() {
    return render(
      <LightsProvider>
        <Counters />
        <LightForm />
      </LightsProvider>,
    );
  }

  /** Личный свет: тип при загрузке не выбран, поэтому карточку жмём первым делом. */
  function fillIndividual() {
    fireEvent.click(screen.getByRole("radio", { name: /Личный свет/ }));
    fireEvent.change(control("firstName"), { target: { value: "Анна" } });
    fireEvent.change(control("lastName"), { target: { value: "Петрова" } });
    fireEvent.change(countrySelect(), { target: { value: "398" } });
    fireEvent.change(control("city"), { target: { value: "Алматы" } });
    fireEvent.change(control("email"), { target: { value: "anna@example.org" } });
    fireEvent.click(control("consent"));
  }

  it("ведёт от невалидного поля к тексту ошибки и держит на нём фокус", () => {
    renderForm();
    // Тип выбран, поэтому первым невалидным полем оказывается имя, а не группа карточек.
    fireEvent.click(screen.getByRole("radio", { name: /Личный свет/ }));
    clickSubmit();

    const firstName = control("firstName");
    expect(firstName).toHaveAttribute("aria-invalid", "true");
    expect(firstName).toHaveFocus();

    const hint = errorFor("firstName");
    expect(hint).toHaveTextContent("Введите имя");
    expect(firstName.getAttribute("aria-describedby")).toBe(hint?.id);
  });

  it("растит счётчик «Человек» на один и объявляет успех", () => {
    renderWithCounters();

    // Число под аудио-подписью — настоящее состояние: видимый span считает от нуля
    // на requestAnimationFrame и в jsdom без пересечений остаётся на старте.
    expect(screen.getByText("Людей: 694")).toBeInTheDocument();
    expect(screen.getByText("Групп: 248")).toBeInTheDocument();

    fillIndividual();
    clickSubmit();
    act(() => {
      vi.advanceTimersByTime(1200);
    });

    expect(screen.getByText("Людей: 695")).toBeInTheDocument();
    expect(screen.getByText("Групп: 248")).toBeInTheDocument();
    expect(liveRegion().textContent).toMatch(/^Ваш свет зажжён/);
  });
});

describe("LightForm: пометка обязательных полей", () => {
  function labelFor(name: string): HTMLElement {
    const label = document.querySelector<HTMLElement>(`label[for="${control(name).id}"]`);
    if (!label) {
      throw new Error(`Нет подписи для контрола ${name}`);
    }

    return label;
  }

  function expectRequired(name: string) {
    const label = labelFor(name);
    const mark = label.querySelector<HTMLElement>(".lf-required");

    expect(mark, `нет звёздочки у поля ${name}`).not.toBeNull();
    expect(mark).toHaveAttribute("title", "Обязательно");
    expect(mark).toHaveAttribute("aria-hidden", "true");
    expect(mark?.querySelector("svg")).not.toBeNull();
    // Слово для скринридера стоит сразу за значком, через пробел.
    expect(label.querySelector(".lf-required + .sr-only")).toHaveTextContent("обязательно");
    expect(control(name)).toHaveAttribute("aria-required", "true");
  }

  it("ставит звёздочку у каждого обязательного поля и у согласия", () => {
    renderForm();
    fireEvent.click(screen.getByRole("radio", { name: /Групповой маяк/ }));

    for (const name of ["orgName", "firstName", "lastName", "countryId", "email", "consent"]) {
      expectRequired(name);
    }
  });

  it("оставляет город без пометки", () => {
    renderForm();

    expect(labelFor("city").querySelector(".lf-required")).toBeNull();
    expect(control("city")).not.toHaveAttribute("aria-required");
  });

  it("добавляет «обязательно» в доступное имя поля", () => {
    renderForm();

    expect(screen.getByRole("textbox", { name: "Имя обязательно" })).toBe(control("firstName"));
    expect(screen.getByRole("combobox", { name: "Страна обязательно" })).toBe(countrySelect());
  });
});

/*
 * Значения оригинала — свойство самого CSS, а не отрендеренного дерева: vitest настроен
 * с css: false, поэтому в jsdom правил формы нет. Файл читается с диска тем же приёмом,
 * что и в motionPolicy.test.ts.
 */
describe("light-form.css: значения оригинала", () => {
  const CSS = readFileSync(resolve(process.cwd(), "src/components/form/light-form.css"), "utf8");

  it("не держит ни политики движения, ни следов стеклянной карточки", () => {
    for (const forbidden of [
      "prefers-reduced-motion",
      ".lf-section::before",
      ".lf-card",
      ".lf-check-box",
      ".lf-legend",
      "data-anim",
      "--color-signal-400",
      "--color-horizon-400",
    ]) {
      expect(CSS, `в CSS остался ${forbidden}`).not.toContain(forbidden);
    }
  });

  it("оставляет секцию прозрачной: подложку кладёт лента карты", () => {
    const section = CSS.match(/\.lf-section \{([^}]*)\}/);
    expect(section).not.toBeNull();
    expect(section?.[1]).not.toContain("background");
  });

  it("переносит значения полей, карточек и шапки из спецификации", () => {
    for (const value of [
      "--field-height: 54px",
      "--field-radius: 16px",
      "rgb(33 26 62 / .58)",
      "rgb(239 237 245 / .18)",
      "rgb(49 41 77 / .7)",
      "0 0 0 3px rgb(123 194 199 / .12)",
      "--field-border-focus: rgb(170 217 220)",
      "rgb(33 26 62 / .42)",
      "rgb(123 194 199 / .72)",
      "0 0 24px var(--halo)",
      "translateY(-2px)",
      "width: 40px",
      "radial-gradient(circle, var(--beacon) 0 2px, transparent 3px)",
      "--beacon: rgb(170 217 220)",
      "--beacon: rgb(227 175 210)",
      "0 0 10px var(--beacon)",
      "accent-color: rgb(170 217 220)",
      "--form-width: 42rem",
      "padding-block: 64px",
      "margin-bottom: 48px",
      "18px/1.65",
      "rgb(219 215 232)",
      "repeat(6, minmax(0, 1fr))",
      "grid-column: span 3",
      "rgb(252 165 165)",
      "min-height: 190px",
    ]) {
      expect(CSS, `в CSS нет значения ${value}`).toContain(value);
    }
  });

  it("оставляет ширину кнопки примитиву и добавляет только отступ сверху", () => {
    const submit = CSS.match(/\.lf-submit \{([^}]*)\}/);
    expect(submit?.[1]).toContain("margin-top: 8px");
    expect(submit?.[1]).not.toContain("width");
  });

  it("держит три брейкпоинта 768px: карточки в две колонки, их высота и сетка полей", () => {
    expect(CSS.match(/@media \(min-width: 768px\)/g)?.length).toBeGreaterThanOrEqual(3);
  });
});
