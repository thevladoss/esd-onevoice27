import { ESD_COUNTRIES } from "../data/countries";
import {
  EMAIL_RE,
  initialLightFormValues,
  toLightType,
  validateLightForm,
  type LightFormValues,
} from "./validation";

const valid: LightFormValues = {
  type: "group",
  firstName: "Иван",
  lastName: "Иванов",
  countryId: "643",
  city: "Москва",
  email: "ivan@example.org",
  consent: true,
};

describe("validateLightForm", () => {
  it("на пустой форме возвращает шесть ошибок на русском", () => {
    const errors = validateLightForm(initialLightFormValues);

    expect(Object.keys(errors).sort()).toEqual([
      "city",
      "consent",
      "countryId",
      "email",
      "firstName",
      "lastName",
    ]);
    expect(errors.firstName).toBe("Введите имя");
    expect(errors.lastName).toBe("Введите фамилию");
    expect(errors.countryId).toBe("Выберите страну");
    expect(errors.city).toBe("Укажите город");
    expect(errors.email).toBe("Введите корректный email");
    expect(errors.consent).toBe("Нужно согласие на обработку данных");
  });

  it("не трогает переданный объект значений", () => {
    const values = { ...initialLightFormValues };
    validateLightForm(values);
    expect(values).toEqual(initialLightFormValues);
  });

  it("требует минимум два символа в имени и фамилии после trim", () => {
    expect(validateLightForm({ ...valid, firstName: " И " }).firstName).toBe("Введите имя");
    expect(validateLightForm({ ...valid, firstName: "Иван" }).firstName).toBeUndefined();
    expect(validateLightForm({ ...valid, lastName: " И " }).lastName).toBe("Введите фамилию");
    expect(validateLightForm({ ...valid, lastName: "Иванов" }).lastName).toBeUndefined();
  });

  it("отбраковывает неполные адреса email", () => {
    for (const email of ["ivan@", "ivan@mail", "ivan mail@x.ru"]) {
      expect(validateLightForm({ ...valid, email }).email).toBe("Введите корректный email");
    }

    expect(validateLightForm({ ...valid, email: "ivan@example.org" }).email).toBeUndefined();
    expect(EMAIL_RE.test("ivan@example.org")).toBe(true);
  });

  it("проверяет страну, город и согласие", () => {
    expect(validateLightForm({ ...valid, countryId: "" }).countryId).toBe("Выберите страну");
    expect(validateLightForm({ ...valid, countryId: "643" }).countryId).toBeUndefined();
    expect(validateLightForm({ ...valid, city: "М" }).city).toBe("Укажите город");
    expect(validateLightForm({ ...valid, city: "Москва" }).city).toBeUndefined();
    expect(validateLightForm({ ...valid, consent: false }).consent).toBe(
      "Нужно согласие на обработку данных",
    );
    expect(validateLightForm({ ...valid, consent: true }).consent).toBeUndefined();
  });

  it("принимает только двенадцать стран дивизиона", () => {
    for (const country of ESD_COUNTRIES) {
      const errors = validateLightForm({ ...valid, countryId: String(country.id) });
      expect(errors.countryId).toBeUndefined();
    }

    // Значение select меняет не только пользователь: autofill, расширение браузера, DevTools.
    for (const countryId of ["840", "0", "-643", "643.5", "643abc", "abc", " ", "Infinity"]) {
      expect(validateLightForm({ ...valid, countryId }).countryId).toBe("Выберите страну");
    }
  });

  it("на валидном наборе возвращает пустой объект", () => {
    expect(validateLightForm(valid)).toEqual({});
  });
});

describe("toLightType", () => {
  it("переводит тип карточки в тип огонька", () => {
    expect(toLightType("individual")).toBe("person");
    expect(toLightType("group")).toBe("group");
  });
});
