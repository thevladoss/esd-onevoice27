export type ResourceKey = "music" | "materials" | "video";

/** Порядок карточек в секции ресурсов. */
export const resourceKeys: readonly ResourceKey[] = ["music", "materials", "video"] as const;

type ResourceCard = {
  label: string;
  title: string;
  description: string;
  cta: string;
  /** Цвет точки-индикатора и рамки активной карточки: ссылка на токен палитры. */
  accent: string;
};

export const resourcesCopy: {
  eyebrow: string;
  title: string;
  body: string;
  cards: Record<ResourceKey, ResourceCard>;
  panel: { close: string; closeLabel: string };
  music: { emptyTitle: string; emptyBody: string };
} = {
  eyebrow: "Ресурсы",
  title: "Всё, что нужно для старта",
  body: "Музыка, видео и материалы, которые помогут рассказать об инициативе в вашей церкви и городе.",
  cards: {
    music: {
      label: "МУЗЫКА",
      title: "Пойте вместе",
      description: "Официальная песня и версии для общинного пения.",
      cta: "Открыть музыку",
      accent: "var(--color-unity-200)",
    },
    materials: {
      label: "МАТЕРИАЛЫ",
      title: "Будьте готовы",
      description: "Скачайте материалы для церкви, малых групп и соцсетей.",
      cta: "Открыть материалы",
      accent: "var(--color-horizon-400)",
    },
    video: {
      label: "ВИДЕО",
      title: "Смотрите и делитесь",
      description: "16 роликов дивизиона: от приветствий руководителей до свидетельств.",
      cta: "Открыть видео",
      accent: "var(--color-signal-300)",
    },
  },
  panel: {
    close: "Свернуть",
    closeLabel: "Свернуть панель",
  },
  music: {
    emptyTitle: "Песня ещё в работе",
    emptyBody:
      "Официальная песня «Единого голоса 27» скоро появится здесь. Следите за новостями дивизиона.",
  },
};
