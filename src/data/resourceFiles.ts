import { type ResourceGroupId, resourcesCopy } from "./copy.resources";
import { type MaterialItem, esdMaterials, englishFolder } from "./materials";

/** Бейдж формата на карточке файла. `web` — внешняя страница, а не файл. */
export type ResourceFileType = "pdf" | "zip" | "mov" | "pptx" | "png" | "mp4" | "docx" | "web";

/** Что делает кнопка карточки: скачивает файл или открывает страницу. */
export type ResourceFileAction = "download" | "open";

export type ResourceFile = {
  id: string;
  /** Название на языке оригинала: файлы глобального проекта не переводим. */
  name: string;
  type: ResourceFileType;
  href: string;
  action: ResourceFileAction;
};

export type ResourceGroup = {
  id: ResourceGroupId;
  title: string;
  files: readonly ResourceFile[];
  /** Группа раскрыта при открытии панели. */
  open?: boolean;
};

/**
 * Хранилище файлов глобального проекта onevoice27.org. Адреса взяты из спецификации
 * (раздел 5, RES-05) дословно, имена файлов не сокращаем.
 */
const HOPE = "https://hope-documents.fra1.digitaloceanspaces.com/67054013a60919c92d92c959/";

/** Панель «Музыка»: три файла оригинала, версии дивизиона пока нет. */
export const musicFiles: readonly ResourceFile[] = [
  {
    id: "music-sheet",
    name: "OneVoice27 Song — Sheet Music",
    type: "pdf",
    href: HOPE + "PIl1787819788226.pdf",
    action: "download",
  },
  {
    id: "music-no-vocals",
    name: "One Voice Theme Song (no vocals)",
    type: "zip",
    href: HOPE + "vVx1787819861503.zip",
    action: "download",
  },
  {
    id: "music-lyrics-video",
    name: "Video Music 2 — Music Lyrics",
    type: "mov",
    href: "https://gcsda.sharepoint.com/sites/digitalmediateam/Public/OneVoice%202027/Music/Video%20Music%202%20-%20OneVoice27%20-%20Music%20Lyrics.mov&download=1",
    action: "download",
  },
] as const;

/**
 * Группа ЕАД строится из `esdMaterials`, чтобы адреса дивизиона жили в одном месте:
 * DOCX скачивается, страницы esd.onevoice27.org открываются с бейджем WEB.
 */
const materialToFile = (item: MaterialItem): ResourceFile => {
  const isDocx = item.href.endsWith(".docx");
  return {
    id: `esd-${item.id}`,
    name: item.title,
    type: isDocx ? "docx" : "web",
    href: item.href,
    action: isDocx ? "download" : "open",
  };
};

/** Панель «Материалы»: группы в порядке оригинала, раскрыта только первая. */
export const materialGroups: readonly ResourceGroup[] = [
  {
    id: "esd",
    title: resourcesCopy.groups.esd,
    files: esdMaterials.map(materialToFile),
    open: true,
  },
  {
    id: "en",
    title: resourcesCopy.groups.en,
    files: [
      {
        id: "en-template",
        name: "OneVoice27 template",
        type: "pptx",
        href: HOPE + "S4z1787584266485.pptx",
        action: "download",
      },
      {
        id: "en-presentation",
        name: "OneVoice27 Presentation",
        type: "pdf",
        href: HOPE + "R4n1787584270370.pdf",
        action: "download",
      },
      {
        id: "en-brochure",
        name: "OneVoice27 Brochure",
        type: "pdf",
        href: HOPE + "pGK1787584274551.pdf",
        action: "download",
      },
      {
        id: "en-logo",
        name: "ENG logo",
        type: "png",
        href: HOPE + "omL1787584642273.png",
        action: "download",
      },
      {
        id: "en-logo-adventist",
        name: "ENG logo Adventist",
        type: "png",
        href: HOPE + "wiS1787584642347.png",
        action: "download",
      },
      {
        id: "en-files",
        name: "OneVoice27 files",
        type: "zip",
        href: HOPE + "uq31788340270047.zip",
        action: "download",
      },
      // Папку SharePoint берём из materials.ts: адрес общий с секцией материалов.
      {
        id: "en-sharepoint",
        name: "Materials (English)",
        type: "web",
        href: englishFolder.href,
        action: "open",
      },
    ],
  },
  {
    id: "es",
    title: resourcesCopy.groups.es,
    files: [
      {
        id: "es-logotype-1",
        name: "Logotype 1",
        type: "png",
        href: HOPE + "FDj1787819159965.png",
        action: "download",
      },
      {
        id: "es-logotype-2",
        name: "Logotype 2",
        type: "png",
        href: HOPE + "IVv1787819160044.png",
        action: "download",
      },
      {
        id: "es-folleto",
        name: "UnaVoz27 Folleto",
        type: "pdf",
        href: HOPE + "Ofg1787819160083.pdf",
        action: "download",
      },
      {
        id: "es-plantilla",
        name: "UnaVoz27 Plantilla",
        type: "pptx",
        href: HOPE + "sg61787819160553.pptx",
        action: "download",
      },
      {
        id: "es-presentacion",
        name: "UnaVoz27 Presentación",
        type: "pdf",
        href: HOPE + "aPl1787819163536.pdf",
        action: "download",
      },
    ],
  },
  {
    id: "pt",
    title: resourcesCopy.groups.pt,
    files: [
      {
        id: "pt-logo-1",
        name: "Logo 1",
        type: "png",
        href: HOPE + "xO01787818991806.png",
        action: "download",
      },
      {
        id: "pt-logo-2",
        name: "Logo 2",
        type: "png",
        href: HOPE + "jON1787818991847.png",
        action: "download",
      },
      {
        id: "pt-apresentacao",
        name: "UmaVoz27 Apresentação",
        type: "pdf",
        href: HOPE + "Ta71787818991954.pdf",
        action: "download",
      },
      {
        id: "pt-folheto",
        name: "UmaVoz27 Folheto",
        type: "pdf",
        href: HOPE + "HKu1787818996618.pdf",
        action: "download",
      },
      {
        id: "pt-plantilha",
        name: "UmaVoz27 Plantilha",
        type: "pptx",
        href: HOPE + "vdv1787818996782.pptx",
        action: "download",
      },
    ],
  },
  {
    id: "fr",
    title: resourcesCopy.groups.fr,
    files: [
      {
        id: "fr-logo-1",
        name: "Logo 1",
        type: "png",
        href: HOPE + "AaN1787818396083.png",
        action: "download",
      },
      {
        id: "fr-logo-2",
        name: "Logo 2",
        type: "png",
        href: HOPE + "NNA1787818396147.png",
        action: "download",
      },
      {
        id: "fr-brochure",
        name: "UneVoix27 Brochure",
        type: "pdf",
        href: HOPE + "KtA1787818396181.pdf",
        action: "download",
      },
      {
        id: "fr-modele",
        name: "UneVoix27 Modèle",
        type: "pptx",
        href: HOPE + "Wy91787818396696.pptx",
        action: "download",
      },
      {
        id: "fr-presentation",
        name: "UneVoix27 Présentation",
        type: "pdf",
        href: HOPE + "0iv1787818401338.pdf",
        action: "download",
      },
    ],
  },
] as const;

/** Панель «Видео»: под сеткой роликов ЕАД лежит архив видеофонов оригинала. */
export const videoFiles: readonly ResourceFile[] = [
  {
    id: "video-backgrounds",
    name: "Video backgrounds",
    type: "zip",
    href: "https://gcsda.sharepoint.com/sites/digitalmediateam/Public/Forms/AllItems.aspx?viewid=9de9ca49%2D7ff1%2D4e2c%2Da9c7%2D62b9d5ad1201&ga=1&id=%2Fsites%2Fdigitalmediateam%2FPublic%2FOneVoice%202027%2FVideo%2DBackgrounds%2Ezip&parent=%2Fsites%2Fdigitalmediateam%2FPublic%2FOneVoice%202027",
    action: "download",
  },
] as const;
