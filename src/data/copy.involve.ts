export type InvolveCardId = "personal" | "toolkit" | "sharing";

export interface InvolveCardCopy {
  id: InvolveCardId;
  title: string;
  action: string;
  href: "#about" | "#resources" | "#news";
}

export interface InvolveCopy {
  eyebrow: string;
  title: string;
  lead: string;
  cards: readonly InvolveCardCopy[];
}

export const involveCopy = {
  eyebrow: "Как включиться",
  title: "От убеждения к действию",
  lead: "Подготовьтесь лично, снабдите свою общину и делитесь «Единым голосом 27» единым голосом.",
  cards: [
    {
      id: "personal",
      title: "Личное преображение",
      action: "Начать путь",
      href: "#about",
    },
    {
      id: "toolkit",
      title: "Материалы для церкви",
      action: "Скачать материалы",
      href: "#resources",
    },
    {
      id: "sharing",
      title: "Делиться",
      action: "Узнать, как делиться",
      href: "#news",
    },
  ],
} as const satisfies InvolveCopy;
