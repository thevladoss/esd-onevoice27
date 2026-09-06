export type ResourceKey = "music" | "materials" | "video";

/** Языковые группы панели «Материалы» в порядке оригинала. */
export type ResourceGroupId = "esd" | "en" | "es" | "pt" | "fr";

/** Порядок карточек в секции ресурсов. */
export const resourceKeys: readonly ResourceKey[] = ["music", "materials", "video"] as const;

type ResourceCard = {
  label: string;
  title: string;
  description: string;
  cta: string;
  /**
   * Цвет точки-индикатора и рамки активной карточки: уходит в custom property `--accent`
   * карточки. Записан литералом из спецификации (RES-02), потому что токены палитры
   * проекта сдвинуты на шаг относительно палитры оригинала.
   */
  accent: string;
};

export const resourcesCopy: {
  eyebrow: string;
  title: string;
  body: string;
  cards: Record<ResourceKey, ResourceCard>;
  panels: Record<ResourceKey, { title: string; description: string }>;
  groups: Record<ResourceGroupId, string>;
  panel: {
    close: string;
    closeLabel: string;
    back: string;
    download: string;
    open: string;
  };
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
      accent: "rgb(143 157 214)",
    },
    materials: {
      label: "МАТЕРИАЛЫ",
      title: "Будьте готовы",
      description: "Скачайте материалы для церкви, малых групп и соцсетей.",
      cta: "Открыть материалы",
      accent: "rgb(123 194 199)",
    },
    video: {
      label: "ВИДЕО",
      title: "Смотрите и делитесь",
      description: "16 роликов дивизиона: от приветствий руководителей до свидетельств.",
      cta: "Открыть видео",
      accent: "rgb(210 142 190)",
    },
  },
  /** Шапка полноэкранной панели: заголовок и описание под ним, тексты из RES-05. */
  panels: {
    music: {
      title: "Музыка",
      description:
        "Официальная песня движения и материалы к ней. Пока это материалы глобального проекта на английском: версия дивизиона готовится.",
    },
    materials: {
      title: "Материалы",
      description:
        "Материалы дивизиона на русском и ресурсы глобального проекта на других языках, готовые к скачиванию.",
    },
    video: {
      title: "Видео",
      description: "16 роликов дивизиона и видеофоны глобального проекта.",
    },
  },
  /** Заголовки языковых групп в панели материалов. */
  groups: {
    esd: "Материалы ЕАД (на русском)",
    en: "English resources",
    es: "Spanish resources",
    pt: "Portuguese resources",
    fr: "French resources",
  },
  panel: {
    /** Читает старый ResourcePanel, снимает план 11-03. */
    close: "Свернуть",
    /** Читает старый ResourcePanel, снимает план 11-03. */
    closeLabel: "Свернуть панель",
    back: "Назад",
    download: "Скачать",
    open: "Открыть",
  },
  /** Читает MusicPlaceholder, снимает план 11-03. */
  music: {
    emptyTitle: "Песня ещё в работе",
    emptyBody:
      "Официальная песня «Единого голоса 27» скоро появится здесь. Следите за новостями дивизиона.",
  },
};
