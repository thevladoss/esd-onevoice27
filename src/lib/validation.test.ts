import { ESD_COUNTRIES } from "../data/countries";
import {
  EMAIL_RE,
  LIGHT_FORM_FIELD_ORDER,
  initialLightFormValues,
  toLightType,
  validateLightForm,
  type LightFormValues,
} from "./validation";

const valid: LightFormValues = {
  type: "group",
  orgName: "Община Твери",
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
      "consent",
      "countryId",
      "email",
      "firstName",
      "lastName",
      "type",
    ]);
    expect(errors.type).toBe("Выберите тип света");
    expect(errors.firstName).toBe("Введите имя");
    expect(errors.lastName).toBe("Введите фамилию");
    expect(errors.countryId).toBe("Выберите страну");
    expect(errors.email).toBe("Введите корректный email");
    expect(errors.consent).toBe("Нужно согласие на обработку данных");
    // Город необязателен: звёздочки у него нет, значит и ошибки быть не должно.
    expect(errors.city).toBeUndefined();
  });

  it("стартует без выбранного типа и без организации", () => {
    expect(initialLightFormValues.type).toBe("");
    expect(initialLightFormValues.orgName).toBe("");
  });

  it("не трогает переданный объект значений", () => {
    const values = { ...initialLightFormValues };
    validateLightForm(values);
    expect(values).toEqual(initialLightFormValues);
  });

  it("на пустом типе даёт одну ошибку и не трогает остальные поля", () => {
    const errors = validateLightForm({ ...valid, type: "" });

    expect(Object.keys(errors)).toEqual(["type"]);
    expect(errors.type).toBe("Выберите тип света");
  });

  it("требует название организации только у группового маяка", () => {
    expect(validateLightForm({ ...valid, type: "group", orgName: "" }).orgName).toBe(
      "Укажите название организации",
    );
    expect(validateLightForm({ ...valid, type: "group", orgName: " О " }).orgName).toBe(
      "Укажите название организации",
    );
    expect(
      validateLightForm({ ...valid, type: "group", orgName: "Община" }).orgName,
    ).toBeUndefined();
    expect(validateLightForm({ ...valid, type: "individual", orgName: "" }).orgName).toBeUndefined();
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

  it("проверяет страну и согласие, а город пропускает даже пустым", () => {
    expect(validateLightForm({ ...valid, countryId: "" }).countryId).toBe("Выберите страну");
    expect(validateLightForm({ ...valid, countryId: "643" }).countryId).toBeUndefined();
    expect(validateLightForm({ ...valid, city: "" }).city).toBeUndefined();
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

describe("LIGHT_FORM_FIELD_ORDER", () => {
  it("ведёт фокус от типа и организации к остальным полям", () => {
    expect(LIGHT_FORM_FIELD_ORDER).toEqual([
      "type",
      "orgName",
      "firstName",
      "lastName",
      "countryId",
      "city",
      "email",
      "consent",
    ]);
  });
});

describe("toLightType", () => {
  it("переводит тип карточки в тип огонька", () => {
    expect(toLightType("individual")).toBe("person");
    expect(toLightType("group")).toBe("group");
  });
});
