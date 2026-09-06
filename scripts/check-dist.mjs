#!/usr/bin/env node
/**
 * Проверка собранного билда перед публикацией на GitHub Pages.
 *
 * Запуск: node scripts/check-dist.mjs [--dist <путь>]
 *
 * Скрипт только читает файлы: ни сети, ни зависимостей, ни записи в dist.
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";

const BASE = "/esd-onevoice27/";
const ASSETS_PREFIX = "/esd-onevoice27/assets/";
const MAX_JS_BYTES = 500 * 1024;
const TITLE = "<title>Единый голос 27 — Евро-Азиатский дивизион</title>";
const OG_URL = 'property="og:url" content="https://thevladoss.github.io/esd-onevoice27/"';
const SECTION_IDS = ["hero", "map", "light-form", "about", "involve", "news", "resources", "quote"];
const ALLOWED_HOSTS = ["fonts.googleapis.com", "fonts.gstatic.com", "thevladoss.github.io"];
const HERO_VIDEO = ["hero-globe.webm", "hero-globe.mp4"];
/** Файлы в public весят 1,9 и 2,9 МБ: порог ловит усечённую копию. */
const MIN_VIDEO_BYTES = 1024 * 1024;
/** Минификатор перекладывает строковые литералы в кавычки любого вида, включая обратные. */
const QUOTES = ['"', "'", "`"];

function parseDistArg(argv) {
  const index = argv.indexOf("--dist");
  if (index === -1) {
    return "dist";
  }
  const value = argv[index + 1];
  if (!value) {
    console.log("FAIL аргументы: после --dist нужен путь");
    process.exit(1);
  }
  return value;
}

function plural(count, one, few, many) {
  const tail = count % 10;
  const hundred = count % 100;
  if (tail === 1 && hundred !== 11) {
    return one;
  }
  if (tail >= 2 && tail <= 4 && (hundred < 12 || hundred > 14)) {
    return few;
  }
  return many;
}

function kb(bytes) {
  return `${(bytes / 1024).toFixed(1)} КБ`;
}

function jsAssets(distDir) {
  const dir = join(distDir, "assets");
  if (!existsSync(dir)) {
    return [];
  }
  return readdirSync(dir)
    .filter((name) => name.endsWith(".js"))
    .sort();
}

/** Весь JS билда одной строкой: имена чанков хешируются, искать нужно по содержимому. */
function bundleText(distDir) {
  return jsAssets(distDir)
    .map((name) => readFileSync(join(distDir, "assets", name), "utf8"))
    .join("\n");
}

function urlsOf(html) {
  const urls = [];
  const pattern = /(?:src|href)="([^"]+)"/g;
  let match = pattern.exec(html);
  while (match !== null) {
    urls.push(match[1]);
    match = pattern.exec(html);
  }
  return urls;
}

function checkLang(html) {
  const ok = html.includes('<html lang="ru"');
  return { name: 'атрибут lang="ru"', ok, detail: ok ? "" : "у тега <html> нет lang=\"ru\"" };
}

function checkTitle(html) {
  const ok = html.includes(TITLE);
  return { name: "заголовок страницы", ok, detail: ok ? "" : `ожидался ${TITLE}` };
}

function checkMeta(html) {
  const required = [
    ['<meta name="description"', "description"],
    ['property="og:title"', "og:title"],
    [OG_URL, "og:url на адрес Pages"],
  ];
  const missing = required.filter(([needle]) => !html.includes(needle)).map(([, label]) => label);
  return {
    name: "метаданные description, og:title, og:url",
    ok: missing.length === 0,
    detail: missing.length === 0 ? "" : `не хватает: ${missing.join(", ")}`,
  };
}

function checkAssetLinks(html, distDir) {
  const assetUrls = urlsOf(html).filter((url) => url.includes("assets/"));
  if (assetUrls.length === 0) {
    return { name: "ссылки на ассеты", ok: false, detail: "в index.html нет ни одной ссылки на assets/" };
  }
  const problems = [];
  for (const url of assetUrls) {
    if (!url.startsWith(ASSETS_PREFIX)) {
      problems.push(`${url} не начинается с ${ASSETS_PREFIX}`);
      continue;
    }
    if (!existsSync(join(distDir, url.slice(BASE.length)))) {
      problems.push(`${url} — файла нет в ${distDir}`);
    }
  }
  return {
    name: `ссылки на ассеты под ${ASSETS_PREFIX}`,
    ok: problems.length === 0,
    detail: problems.length === 0 ? `проверено ссылок: ${assetUrls.length}` : problems.join("; "),
  };
}

function checkBaseKept(html) {
  const lost = urlsOf(html).filter((url) => url.startsWith("/assets/"));
  return {
    name: "base не потерян",
    ok: lost.length === 0,
    detail: lost.length === 0 ? "" : `ссылки от корня: ${lost.join(", ")}`,
  };
}

function checkVendorMap(distDir) {
  const chunks = jsAssets(distDir).filter((name) => /^vendor-map-.*\.js$/.test(name));
  return {
    name: "чанк vendor-map",
    ok: chunks.length === 1,
    detail: chunks.length === 1 ? chunks[0] : `подходящих файлов: ${chunks.length}`,
  };
}

function checkJsSize(distDir) {
  const files = jsAssets(distDir).map((name) => ({
    name,
    size: statSync(join(distDir, "assets", name)).size,
  }));
  if (files.length === 0) {
    return { name: "размер JS-чанков", ok: false, detail: "в dist/assets нет ни одного .js" };
  }
  const heavy = files.filter((file) => file.size > MAX_JS_BYTES);
  const biggest = files.reduce((max, file) => (file.size > max.size ? file : max));
  return {
    name: `размер JS-чанков, порог ${kb(MAX_JS_BYTES)}`,
    ok: heavy.length === 0,
    detail:
      heavy.length === 0
        ? `самый большой ${biggest.name} — ${kb(biggest.size)}`
        : heavy.map((file) => `${file.name} — ${kb(file.size)}`).join("; "),
  };
}

function checkSectionIds(distDir) {
  const bundle = bundleText(distDir);
  const missing = SECTION_IDS.filter(
    (id) => !QUOTES.some((quote) => bundle.includes(`${quote}${id}${quote}`)),
  );
  return {
    name: `id секций в бандле, всего ${SECTION_IDS.length}`,
    ok: missing.length === 0,
    detail: missing.length === 0 ? "" : `не найдены: ${missing.join(", ")}`,
  };
}

/*
 * Видео hero: Vite копирует public/ в корень dist, а ссылка из Hero.tsx через
 * import.meta.env.BASE_URL после сборки становится строкой с именем файла.
 */
function checkHeroVideo(distDir) {
  const bundle = bundleText(distDir);
  const problems = [];
  const sizes = [];
  for (const name of HERO_VIDEO) {
    const path = join(distDir, name);
    if (!existsSync(path)) {
      problems.push(`${name} — нет файла в ${distDir}`);
      continue;
    }
    const { size } = statSync(path);
    sizes.push(`${name} — ${kb(size)}`);
    if (size < MIN_VIDEO_BYTES) {
      problems.push(`${name} — меньше 1 МБ (${kb(size)})`);
    }
    if (!bundle.includes(name)) {
      problems.push(`${name} — нет ссылки в JS`);
    }
  }
  return {
    name: `видео глобуса ${HERO_VIDEO.join(", ")} в dist и ссылки в бандле`,
    ok: problems.length === 0,
    detail: problems.length === 0 ? sizes.join("; ") : problems.join("; "),
  };
}

function checkNoscript(html) {
  const ok = html.includes("<noscript>");
  return { name: "запасной текст в <noscript>", ok, detail: ok ? "" : "тега <noscript> нет" };
}

function checkHosts(html) {
  const hosts = new Set();
  const pattern = /https?:\/\/([^/"'\s)]+)/g;
  let match = pattern.exec(html);
  while (match !== null) {
    hosts.add(match[1]);
    match = pattern.exec(html);
  }
  const extra = [...hosts].filter((host) => !ALLOWED_HOSTS.includes(host));
  return {
    name: "внешние хосты в index.html",
    ok: extra.length === 0,
    detail: extra.length === 0 ? [...hosts].join(", ") : `вне белого списка: ${extra.join(", ")}`,
  };
}

function run(argv) {
  const distDir = parseDistArg(argv);
  const htmlPath = join(distDir, "index.html");

  if (!existsSync(htmlPath)) {
    console.log(`FAIL index.html: файл не найден (${htmlPath})`);
    console.log("FAIL: проверять нечего, соберите билд командой npm run build");
    return 1;
  }

  // Атрибуты meta переносятся на несколько строк, поэтому пробелы схлопываются перед поиском.
  const html = readFileSync(htmlPath, "utf8").replace(/\s+/g, " ");
  const results = [
    { name: "index.html найден", ok: true, detail: htmlPath },
    checkLang(html),
    checkTitle(html),
    checkMeta(html),
    checkAssetLinks(html, distDir),
    checkBaseKept(html),
    checkVendorMap(distDir),
    checkJsSize(distDir),
    checkSectionIds(distDir),
    checkHeroVideo(distDir),
    checkNoscript(html),
    checkHosts(html),
  ];

  for (const result of results) {
    console.log(`${result.ok ? "OK" : "FAIL"} ${result.name}${result.detail ? `: ${result.detail}` : ""}`);
  }

  const failed = results.filter((result) => !result.ok).length;
  if (failed > 0) {
    console.log(
      `FAIL: ${failed} ${plural(failed, "проверка", "проверки", "проверок")} из ${results.length} не прошли`,
    );
    return 1;
  }
  console.log(`OK: ${results.length} ${plural(results.length, "проверка", "проверки", "проверок")}`);
  return 0;
}

process.exit(run(process.argv.slice(2)));
