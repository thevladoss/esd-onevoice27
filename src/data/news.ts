export type NewsItem = {
  id: string;
  title: string;
  /** ISO-дата YYYY-MM-DD, разбирается как UTC-полночь. */
  date: string;
  cover: string;
  href: string;
  source: string;
  /** Дополнительный масштаб обложки: ролики шире 16:9 несут в `hqdefault.jpg` поля
   *  выше стандартных 45 строк, и кроп 16:9 их не снимает. Значение подбирается по
   *  высоте полей исходника (см. docs/qa/SMOKE.md, отклонение №9 фазы 13). */
  coverZoom?: number;
  /** `object-position` обложки, когда содержимое ролика смещено от центра кадра. */
  coverPosition?: string;
};

/** Id ролика экранируется: в адрес постера и в параметр `v` он попадает значением, а не
 *  куском разметки адреса. */
const cover = (videoId: string) =>
  `https://img.youtube.com/vi/${encodeURIComponent(videoId)}/hqdefault.jpg`;
const watch = (videoId: string) =>
  `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;

const YOUTUBE = "YouTube ЕАД";
const SITE = "esd.onevoice27.org";

/** Девять новостей дивизиона, от свежих к старым. */
export const news: NewsItem[] = [
  {
    id: "day-of-prayer",
    title: "5 сентября — всемирный день молитвы «Единый голос 27»",
    date: "2026-09-05",
    cover: cover("YpLD6p-z00g"),
    href: watch("YpLD6p-z00g"),
    source: YOUTUBE,
    // Кадр 2,41:1: в постере 94 строки поля сверху и 67 снизу, содержимое ниже центра.
    coverZoom: 1.5,
    coverPosition: "50% 55%",
  },
  {
    id: "kaminsky",
    title: "Михаил Каминский: почему дивизион присоединяется к движению",
    date: "2026-08-28",
    cover: cover("qQsgK18gKCU"),
    href: watch("qQsgK18gKCU"),
    source: YOUTUBE,
  },
  {
    id: "koehler",
    title: "Эртон Келер о «Едином голосе 27»: одна весть на всех языках",
    date: "2026-08-21",
    cover: cover("dnQS3tFmCNU"),
    href: watch("dnQS3tFmCNU"),
    source: YOUTUBE,
  },
  {
    id: "leaders",
    title: "Руководители Адвентистской церкви — о проекте",
    date: "2026-08-14",
    cover: cover("GK_RXxwZxEc"),
    href: watch("GK_RXxwZxEc"),
    source: YOUTUBE,
    // Кадр 2,33:1: поля по 77 строк сверху и снизу.
    coverZoom: 1.4,
  },
  {
    id: "expectations",
    title: "Что мы ожидаем от проекта «Единый голос 27»?",
    date: "2026-08-07",
    cover: cover("xH3MMwox8cU"),
    href: watch("xH3MMwox8cU"),
    source: YOUTUBE,
  },
  {
    id: "departments",
    title: "Как отделы церкви поддерживают проект",
    date: "2026-07-31",
    cover: cover("gwqe_QH6KX0"),
    href: watch("gwqe_QH6KX0"),
    source: YOUTUBE,
  },
  {
    id: "how-to-support",
    title: "Как я могу поддержать «Единый голос 27»?",
    date: "2026-07-24",
    cover: cover("1MN5Gml00QU"),
    href: watch("1MN5Gml00QU"),
    source: YOUTUBE,
  },
  {
    id: "banners",
    title: "Опубликованы баннеры к 5 сентября 2026",
    date: "2026-07-10",
    cover: cover("-Eo--61cx90"),
    href: "https://esd.onevoice27.org/materials/banners",
    source: SITE,
  },
  {
    id: "desire-of-ages",
    title: "Вопросы по книге «Желание веков»: материалы для малых групп",
    date: "2026-06-26",
    cover: cover("VjwJfHAqIxQ"),
    href: "https://esd.onevoice27.org/materials/desire-of-ages",
    source: SITE,
  },
];
