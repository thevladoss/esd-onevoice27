/** Тип иконки строки материала: документ, изображение, книга, телефон, папка. */
export type MaterialKind = "document" | "image" | "book" | "phone" | "folder";

export type MaterialItem = {
  id: string;
  title: string;
  /** Подпись под названием: формат файла или где лежит материал. */
  caption: string;
  href: string;
  kind: MaterialKind;
};

/** Материалы дивизиона: реальные адреса esd.onevoice27.org и файловых хранилищ. */
export const materials: readonly MaterialItem[] = [
  {
    id: "project-description",
    title: "Описание проекта (на русском)",
    caption: "DOCX",
    href: "https://hope-documents.fra1.digitaloceanspaces.com/65e8ec8ed9988b1907692c05/mGS1787822852554.docx",
    kind: "document",
  },
  {
    id: "banners",
    title: "Баннеры к 5 сентября 2026",
    caption: "Страница ЕАД",
    href: "https://esd.onevoice27.org/materials/banners",
    kind: "image",
  },
  {
    id: "desire-of-ages",
    title: "Вопросы по книге «Желание веков»",
    caption: "Страница ЕАД",
    href: "https://esd.onevoice27.org/materials/desire-of-ages",
    kind: "book",
  },
  {
    id: "wallpapers",
    title: "Заставка для телефона",
    caption: "Страница ЕАД",
    href: "https://esd.onevoice27.org/materials/wallpapers",
    kind: "phone",
  },
  {
    id: "english",
    title: "Материалы (на английском)",
    caption: "SharePoint, английский",
    href: "https://gcsda.sharepoint.com/:f:/s/digitalmediateam/EtNk5tgXbZRMiJ7Nk1nOlRsBhAq-Xx8Oc7vfWiJzI86OJA?e=sSsYtg",
    kind: "folder",
  },
] as const;
