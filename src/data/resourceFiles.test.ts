import { materialGroups, musicFiles, videoFiles } from "./resourceFiles";
import type { ResourceFile, ResourceFileType } from "./resourceFiles";
import { esdMaterials, englishFolder, materials } from "./materials";
import { resourcesCopy } from "./copy.resources";
import { videos } from "./videos";

const HOPE = "https://hope-documents.fra1.digitaloceanspaces.com/67054013a60919c92d92c959/";

const groupById = (id: string) => {
  const group = materialGroups.find((item) => item.id === id);
  if (!group) throw new Error(`группа ${id} не найдена`);
  return group;
};

const countType = (files: readonly ResourceFile[], type: ResourceFileType) =>
  files.filter((file) => file.type === type).length;

describe("musicFiles", () => {
  it("отдаёт три файла оригинала с адресами из спецификации", () => {
    expect(musicFiles).toHaveLength(3);
    expect(musicFiles.map((file) => file.type)).toEqual(["pdf", "zip", "mov"]);
    expect(musicFiles.every((file) => file.action === "download")).toBe(true);
    expect(musicFiles[0].href).toBe(`${HOPE}PIl1787819788226.pdf`);
    expect(musicFiles[1].href).toBe(`${HOPE}vVx1787819861503.zip`);
    expect(musicFiles[2].href).toContain("Music%20Lyrics.mov");
  });
});

describe("materialGroups", () => {
  it("держит пять групп в порядке оригинала и раскрывает только ЕАД", () => {
    expect(materialGroups.map((group) => group.id)).toEqual(["esd", "en", "es", "pt", "fr"]);
    for (const group of materialGroups) {
      expect(group.title).toBe(resourcesCopy.groups[group.id]);
    }
    expect(materialGroups.filter((group) => group.open === true).map((group) => group.id)).toEqual([
      "esd",
    ]);
  });

  it("собирает группу ЕАД из esdMaterials: DOCX на скачивание, страницы на открытие", () => {
    const esd = groupById("esd");

    expect(esd.files).toHaveLength(4);
    expect(esd.files.map((file) => file.href)).toEqual(esdMaterials.map((item) => item.href));
    expect(esd.files[0].type).toBe("docx");
    expect(esd.files[0].action).toBe("download");
    for (const file of esd.files.slice(1)) {
      expect(file.type).toBe("web");
      expect(file.action).toBe("open");
    }
  });

  it("заканчивает English папкой SharePoint", () => {
    const en = groupById("en");

    expect(en.files).toHaveLength(7);
    const last = en.files[en.files.length - 1];
    expect(last.type).toBe("web");
    expect(last.action).toBe("open");
    expect(last.href).toBe(englishFolder.href);
    for (const type of ["pptx", "pdf", "png", "zip"] as const) {
      expect(en.files.map((file) => file.type)).toContain(type);
    }
  });

  it("даёт Spanish, Portuguese и French по пять файлов одного состава", () => {
    for (const id of ["es", "pt", "fr"]) {
      const group = groupById(id);

      expect(group.files).toHaveLength(5);
      expect(countType(group.files, "png")).toBe(2);
      expect(countType(group.files, "pdf")).toBe(2);
      expect(countType(group.files, "pptx")).toBe(1);
      expect(group.files.every((file) => file.action === "download")).toBe(true);
    }
  });
});

describe("videoFiles", () => {
  it("отдаёт один архив видеофонов", () => {
    expect(videoFiles).toHaveLength(1);
    expect(videoFiles[0].type).toBe("zip");
    expect(videoFiles[0].action).toBe("download");
    expect(videoFiles[0].href).toContain("Video%2DBackgrounds%2Ezip");
  });
});

describe("наборы файлов целиком", () => {
  it("держит уникальные id, абсолютные адреса и типы из закрытого списка", () => {
    const all = [
      ...musicFiles,
      ...materialGroups.flatMap((group) => [...group.files]),
      ...videoFiles,
    ];
    const types = ["pdf", "zip", "mov", "pptx", "png", "mp4", "docx", "web"];

    expect(all.length).toBe(30);
    expect(new Set(all.map((file) => file.id)).size).toBe(all.length);
    for (const file of all) {
      expect(file.href.startsWith("https://")).toBe(true);
      expect(types).toContain(file.type);
      expect(file.name.trim().length).toBeGreaterThan(0);
    }
  });
});

describe("данные ресурсов", () => {
  it("videos содержит 16 уникальных роликов ЕАД", () => {
    expect(videos.length).toBe(16);
    expect(new Set(videos.map((video) => video.id)).size).toBe(16);
    for (const video of videos) {
      expect(video.id).toMatch(/^[A-Za-z0-9_-]{11}$/);
      expect(video.title.length).toBeGreaterThan(0);
    }
    expect(videos[0]).toEqual({
      id: "YpLD6p-z00g",
      title: "Международный день молитвы – Единый голос27",
    });
  });

  it("materials разделён на материалы ЕАД и папку SharePoint", () => {
    expect(esdMaterials).toHaveLength(4);
    const esdHrefs = esdMaterials.map((item) => item.href);
    expect(esdHrefs.filter((href) => href.endsWith(".docx")).length).toBe(1);
    expect(esdHrefs.some((href) => href.includes("/materials/banners"))).toBe(true);
    expect(esdHrefs.some((href) => href.includes("/materials/desire-of-ages"))).toBe(true);
    expect(esdHrefs.some((href) => href.includes("/materials/wallpapers"))).toBe(true);
    expect(esdHrefs.some((href) => href.includes("sharepoint.com"))).toBe(false);

    expect(englishFolder.href).toContain("sharepoint.com");
    expect(englishFolder.kind).toBe("folder");
    expect(materials).toHaveLength(5);
  });

  it("resourcesCopy отдаёт строки карточек и панелей", () => {
    expect(resourcesCopy.cards.materials.cta).toBe("Открыть материалы");
    expect(resourcesCopy.cards.music.label).toBe("МУЗЫКА");
    expect(resourcesCopy.cards.music.accent).toBe("rgb(143 157 214)");
    expect(resourcesCopy.panels.music.title).toBe("Музыка");
    expect(resourcesCopy.panel.back).toBe("Назад");
    expect(resourcesCopy.panel.download).toBe("Скачать");
    expect(resourcesCopy.panel.open).toBe("Открыть");
  });
});
