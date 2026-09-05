import { countryById } from "../data/countries";
import { formCopy } from "../data/copy.form";
import type { LightType as MapLightType } from "../data/lights";

/** Тип света в форме: карточка выбора. На карте он превращается в person или group. */
export type LightType = "individual" | "group";

export interface LightFormValues {
  type: LightType;
  firstName: string;
  lastName: string;
  countryId: string;
  city: string;
  email: string;
  consent: boolean;
}

export type LightFormField = Exclude<keyof LightFormValues, "type">;
export type LightFormErrors = Partial<Record<LightFormField, string>>;

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Порядок полей в разметке: по нему ищется первое невалидное поле для фокуса. */
export const LIGHT_FORM_FIELD_ORDER: readonly LightFormField[] = [
  "firstName",
  "lastName",
  "countryId",
  "city",
  "email",
  "consent",
];

export const initialLightFormValues: LightFormValues = {
  type: "individual",
  firstName: "",
  lastName: "",
  countryId: "",
  city: "",
  email: "",
  consent: false,
};

export function toLightType(type: LightType): MapLightType {
  return type === "group" ? "group" : "person";
}

const MIN_TEXT_LENGTH = 2;

/** Чистая проверка: ни DOM, ни сети, аргумент не меняется. Пустой объект означает «валидно». */
export function validateLightForm(values: LightFormValues): LightFormErrors {
  const errors: LightFormErrors = {};

  if (values.firstName.trim().length < MIN_TEXT_LENGTH) {
    errors.firstName = formCopy.errors.firstName;
  }

  if (values.lastName.trim().length < MIN_TEXT_LENGTH) {
    errors.lastName = formCopy.errors.lastName;
  }

  // Членство в справочнике проверяем здесь: дальше id уходит в createLight, а тот
  // на неизвестной стране бросает исключение прямо внутри reducer'а.
  const countryId = Number(values.countryId);
  if (
    values.countryId.trim() === "" ||
    !Number.isInteger(countryId) ||
    countryById(countryId) === undefined
  ) {
    errors.countryId = formCopy.errors.countryId;
  }

  if (values.city.trim().length < MIN_TEXT_LENGTH) {
    errors.city = formCopy.errors.city;
  }

  if (!EMAIL_RE.test(values.email.trim())) {
    errors.email = formCopy.errors.email;
  }

  if (!values.consent) {
    errors.consent = formCopy.errors.consent;
  }

  return errors;
}
