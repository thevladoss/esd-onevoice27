export const sectionIds = [
  "hero",
  "map",
  "light-form",
  "about",
  "involve",
  "news",
  "resources",
  "quote",
] as const;

export type SectionId = (typeof sectionIds)[number];

export const copy = {
  shell: {
    wordmark: "Единый голос 27",
    tagline: "МИССИЯ ДЛЯ ВСЕХ",
    wordmarkAriaLabel: "Единый голос 27, на главную",
    skipLink: "Перейти к содержимому",
    navLabel: "Основная навигация",
    menuOpen: "Открыть меню",
    menuClose: "Закрыть меню",
    menuDialogLabel: "Меню",
    nav: [
      { label: "Что это?", href: "#about" },
      { label: "Участвовать", href: "#involve" },
      { label: "Новости", href: "#news" },
      { label: "Материалы", href: "#resources" },
    ],
  },
  footer: {
    caption: "Официальный сайт Церкви христиан адвентистов седьмого дня",
    linksLabel: "Внешние ссылки",
    newTabHint: "(откроется в новой вкладке)",
    links: [
      { label: "Евро-Азиатский дивизион", href: "https://esd.adventist.org" },
      { label: "OneVoice27 (глобальный сайт)", href: "https://onevoice27.org" },
    ],
    legal: "© 2026 Евро-Азиатский дивизион Церкви христиан-адвентистов седьмого дня",
  },
  cta: {
    lightYourLight: { label: "Зажечь свой свет", href: "#light-form" },
  },
  sections: {
    hero: {
      eyebrow: "Единое глобальное движение",
      title: "Вместе, единым голосом",
      body: "Единая весть. Евро-Азиатский дивизион присоединяется к этому движению.",
    },
    map: {
      eyebrow: "Все вместе",
      title: "Зажигаем свет по всему дивизиону",
      body: "Здесь загорится карта двенадцати стран дивизиона со счётчиками участников.",
    },
    lightForm: {
      eyebrow: "Участвуйте с нами",
      title: "Зажгите свет",
      body: "Здесь появится форма: выбрать индивидуальный свет или групповой маяк и отметить себя на карте.",
    },
    about: {
      eyebrow: "Глобальное влияние",
      title: "Что такое Единый голос 27?",
      body: "Здесь появится рассказ о сентябре 2027 года и видео о проекте.",
    },
    involve: {
      eyebrow: "Как включиться",
      title: "От убеждения к действию",
      body: "Здесь появятся три пути участия: личное преображение, материалы для церкви и то, чем делиться с другими.",
    },
    news: {
      eyebrow: "На каждом канале",
      title: "Каждая платформа становится голосом",
      body: "Здесь появится лента новостей Евро-Азиатского дивизиона.",
    },
    resources: {
      eyebrow: "Ресурсы",
      title: "Всё, что нужно для старта",
      body: "Здесь появятся музыка, материалы и видео для церквей и групп.",
    },
    quote: {
      eyebrow: "Вдохновение",
      title: "Слово, с которого всё начинается",
      body: "Здесь появится цитата из книги «Евангелизм».",
    },
  },
} as const;

export type NavItem = (typeof copy.shell.nav)[number];
