export type CountryCode =
  | "RU"
  | "KZ"
  | "BY"
  | "MD"
  | "UZ"
  | "KG"
  | "TJ"
  | "GE"
  | "AM"
  | "AZ"
  | "TM"
  | "AF";

export interface EsdCountry {
  /** ISO 3166-1 numeric, совпадает с Number(feature.id) в world-atlas. */
  id: number;
  code: CountryCode;
  /** Название по-русски: чипы карты и select формы. */
  name: string;
  /** Доля огоньков страны, сумма по всем странам равна 1. */
  weight: number;
  /** Опорная точка [lon, lat] внутри границ страны. */
  center: [number, number];
}

/** 12 стран Евро-Азиатского дивизиона по убыванию веса: этот порядок задаёт чипы карты. */
export const ESD_COUNTRIES: readonly EsdCountry[] = [
  // Для России взят Москва, а не геометрический центроид: тот лежит в Арктике.
  { id: 643, code: "RU", name: "Россия", weight: 0.55, center: [37.6, 55.7] },
  { id: 398, code: "KZ", name: "Казахстан", weight: 0.08, center: [67.2, 48.4] },
  { id: 112, code: "BY", name: "Беларусь", weight: 0.07, center: [28.0, 53.5] },
  { id: 498, code: "MD", name: "Молдова", weight: 0.06, center: [28.4, 47.2] },
  { id: 860, code: "UZ", name: "Узбекистан", weight: 0.05, center: [63.4, 41.8] },
  { id: 417, code: "KG", name: "Кыргызстан", weight: 0.04, center: [74.6, 41.5] },
  { id: 762, code: "TJ", name: "Таджикистан", weight: 0.03, center: [71.0, 38.6] },
  { id: 268, code: "GE", name: "Грузия", weight: 0.03, center: [43.5, 42.2] },
  { id: 51, code: "AM", name: "Армения", weight: 0.03, center: [45.0, 40.2] },
  { id: 31, code: "AZ", name: "Азербайджан", weight: 0.02, center: [47.6, 40.2] },
  { id: 795, code: "TM", name: "Туркменистан", weight: 0.02, center: [59.3, 39.1] },
  { id: 4, code: "AF", name: "Афганистан", weight: 0.02, center: [66.0, 33.8] },
];

export const ESD_IDS: ReadonlySet<number> = new Set(ESD_COUNTRIES.map((c) => c.id));

const BY_ID = new Map<number, EsdCountry>(ESD_COUNTRIES.map((c) => [c.id, c]));

export function countryById(id: number): EsdCountry | undefined {
  return BY_ID.get(id);
}
