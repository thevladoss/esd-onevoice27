#!/usr/bin/env node
/*
 * Пиксельный зонд приёмки v1.1. Два режима:
 *   --cover <селектор>  MEDIA-01: средняя яркость 6-пиксельных полос у верхнего и
 *                       нижнего края обложки новости. Чёрные поля hqdefault дали бы
 *                       0…8, обрезанный кадр даёт заметно больше; порог 12. Рядом
 *                       зонд меряет сам исходник: высоту его чёрных полей и
 *                       пропорцию содержимого. У ролика шире 16:9 (2.3:1 и подобных)
 *                       поля в hqdefault выше 12,5 %, и обрезка 16:9 снимает не всё —
 *                       такая полоса приходит от источника, а не от вёрстки.
 *   --points            MAP: цвет полотна карты в трёх точках оболочки
 *                       (0.5/0.12, 0.08/0.5, 0.92/0.85 от её прямоугольника).
 *
 * Зависимостей в репозиторий не добавляет: playwright резолвится из PW_ROOT или из
 * кэша npx, как в map-probe.mjs фазы 8. PNG декодируется без библиотек: скриншот
 * уезжает data-URL на вторую страницу, там Image + drawImage + getImageData.
 * Яркость L = 0.2126 R + 0.7152 G + 0.0722 B.
 *
 *   node .planning/phases/13-integration-qa/qa/pixel-probe.mjs \
 *     --url https://thevladoss.github.io/esd-onevoice27/ --cover .news-card__cover --cover-index 0
 *   node .planning/phases/13-integration-qa/qa/pixel-probe.mjs --points
 */
import { existsSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

/** Высота полосы у кромки обложки, в пикселях. */
const BAND_ROWS = 6;
/** Порог средней яркости полосы: ниже — видны чёрные поля исходника 4:3. */
const BAND_FLOOR = 12;
/** Доли прямоугольника оболочки карты для трёх точек полотна. */
const MAP_FRACTIONS = [
  [0.5, 0.12],
  [0.08, 0.5],
  [0.92, 0.85],
];

const DEFAULTS = {
  url: "https://thevladoss.github.io/esd-onevoice27/",
  width: 1440,
  height: 900,
  mode: null,
  cover: ".news-card__cover",
  coverIndex: 0,
  shell: ".map-shell",
};

function parseArgs(argv) {
  const opts = { ...DEFAULTS };
  for (let i = 0; i < argv.length; i += 1) {
    const flag = argv[i];
    if (flag === "--url") opts.url = argv[(i += 1)];
    else if (flag === "--width") opts.width = Number(argv[(i += 1)]);
    else if (flag === "--height") opts.height = Number(argv[(i += 1)]);
    else if (flag === "--points") opts.mode = "points";
    else if (flag === "--shell") opts.shell = argv[(i += 1)];
    else if (flag === "--cover") {
      opts.mode = "cover";
      opts.cover = argv[(i += 1)];
    } else if (flag === "--cover-index") opts.coverIndex = Number(argv[(i += 1)]);
    else {
      console.error(`Неизвестный аргумент: ${flag}`);
      process.exit(2);
    }
  }
  if (opts.mode === null) {
    console.error("Режим: --cover <селектор> | --points");
    process.exit(2);
  }
  return opts;
}

/** Каталоги-кандидаты, в которых может лежать node_modules/playwright. */
function playwrightRoots() {
  const roots = [];
  if (process.env.PW_ROOT) roots.push(process.env.PW_ROOT);
  const npxCache = join(homedir(), ".npm", "_npx");
  if (existsSync(npxCache)) {
    for (const entry of readdirSync(npxCache)) {
      const root = join(npxCache, entry);
      if (existsSync(join(root, "node_modules", "playwright", "package.json"))) roots.push(root);
    }
  }
  return roots;
}

/** playwright — пакет CommonJS: под ESM его объект приезжает в `default`. */
const unwrap = (mod) => (mod?.chromium ? mod : mod?.default);

async function loadPlaywright() {
  for (const root of playwrightRoots()) {
    try {
      const requireFrom = createRequire(join(root, "probe.js"));
      const entry = requireFrom.resolve("playwright");
      const version = requireFrom("playwright/package.json").version;
      const api = unwrap(await import(pathToFileURL(entry).href));
      if (api?.chromium) return { api, from: entry, version };
    } catch {
      // Следующий кандидат.
    }
  }
  return null;
}

const round = (value, digits = 2) => Number(value.toFixed(digits));

/**
 * Средняя яркость прямоугольных областей скриншота. Считает вторая страница:
 * своего декодера PNG в node:* нет, а canvas есть в любом браузере.
 */
async function readAreas(context, png, areas) {
  const reader = await context.newPage();
  await reader.setContent('<canvas id="c"></canvas>');
  const values = await reader.evaluate(
    async ({ dataUrl, boxes }) => {
      const img = new Image();
      img.src = dataUrl;
      await img.decode();
      const canvas = document.getElementById("c");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(img, 0, 0);
      return boxes.map((box) => {
        const x = Math.max(0, Math.min(Math.round(box.x), canvas.width - 1));
        const y = Math.max(0, Math.min(Math.round(box.y), canvas.height - 1));
        const w = Math.max(1, Math.min(Math.round(box.width), canvas.width - x));
        const h = Math.max(1, Math.min(Math.round(box.height), canvas.height - y));
        const data = ctx.getImageData(x, y, w, h).data;
        let sum = 0;
        let r = 0;
        let g = 0;
        let b = 0;
        let black = 0;
        const pixels = w * h;
        for (let i = 0; i < pixels; i += 1) {
          const o = i * 4;
          r += data[o];
          g += data[o + 1];
          b += data[o + 2];
          sum += 0.2126 * data[o] + 0.7152 * data[o + 1] + 0.0722 * data[o + 2];
          if (data[o] < 6 && data[o + 1] < 6 && data[o + 2] < 6) black += 1;
        }
        return {
          r: r / pixels,
          g: g / pixels,
          b: b / pixels,
          L: sum / pixels,
          blackShare: black / pixels,
        };
      });
    },
    { dataUrl: `data:image/png;base64,${png.toString("base64")}`, boxes: areas },
  );
  await reader.close();
  return values;
}

/**
 * Навигация с запасом на Vercel Security Checkpoint оригинала: он подменяет
 * документ и перезагружает страницу сам, поэтому ждём целевой узел, а не load.
 */
async function open(page, url, selector) {
  await page.goto(url, { waitUntil: "commit", timeout: 120_000 });
  await page.waitForSelector(selector, { timeout: 120_000, state: "attached" });
  await page.waitForLoadState("load").catch(() => {});
}

async function runCover(context, opts) {
  const page = await context.newPage();
  await open(page, opts.url, opts.cover);
  const box = await page.evaluate(
    async ({ selector, index }) => {
      const node = document.querySelectorAll(selector)[index];
      if (!node) return null;
      node.scrollIntoView({ block: "center" });
      await new Promise((done) => setTimeout(done, 900));
      const img = node.querySelector("img");
      if (img && !img.complete) {
        await Promise.race([
          img.decode().catch(() => null),
          new Promise((done) => setTimeout(done, 2000)),
        ]);
      }
      const r = node.getBoundingClientRect();
      return {
        x: r.left,
        y: r.top,
        width: r.width,
        height: r.height,
        src: img?.currentSrc ?? null,
      };
    },
    { selector: opts.cover, index: opts.coverIndex },
  );
  if (!box) {
    console.error(`Обложка не найдена: ${opts.cover}[${opts.coverIndex}]`);
    await page.close();
    return { result: { selector: opts.cover, index: opts.coverIndex, rect: null }, pass: false };
  }
  await page.waitForTimeout(400);
  const png = await page.screenshot({ type: "png" });

  const areas = [
    { x: box.x, y: box.y, width: box.width, height: BAND_ROWS },
    { x: box.x, y: box.y + box.height - BAND_ROWS, width: box.width, height: BAND_ROWS },
    { x: box.x, y: box.y + box.height / 3, width: box.width, height: box.height / 3 },
  ];
  const [top, bottom, center] = await readAreas(context, png, areas);
  const source = box.src ? await readSourceBars(page, box.src) : null;
  await page.close();

  const topBand = round(top.L);
  const bottomBand = round(bottom.L);
  const pass = topBand > BAND_FLOOR && bottomBand > BAND_FLOOR;
  return {
    result: {
      mode: "cover",
      selector: opts.cover,
      index: opts.coverIndex,
      src: box.src,
      rect: {
        x: round(box.x),
        y: round(box.y),
        width: round(box.width),
        height: round(box.height),
      },
      ratio: round(box.width / box.height, 4),
      topBand,
      bottomBand,
      topBlackShare: round(top.blackShare, 3),
      bottomBlackShare: round(bottom.blackShare, 3),
      center: round(center.L),
      bandRows: BAND_ROWS,
      floor: BAND_FLOOR,
      source,
      pass,
    },
    pass,
  };
}

/**
 * Чёрные поля самого hqdefault.jpg: сколько строк сверху и снизу почти черны и
 * какая пропорция у содержимого. У ролика 16:9 поля ровно 12,5 % (45 строк из 360)
 * и обрезка 16:9 снимает их целиком; у более широкого ролика поля выше, и остаток
 * виден в кадре карточки.
 */
async function readSourceBars(page, src) {
  return page.evaluate(async (url) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = url;
    try {
      await img.decode();
    } catch {
      return null;
    }
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(img, 0, 0);
    const rows = [];
    for (let y = 0; y < img.naturalHeight; y += 1) {
      const data = ctx.getImageData(0, y, img.naturalWidth, 1).data;
      let sum = 0;
      for (let i = 0; i < img.naturalWidth; i += 1) {
        const o = i * 4;
        sum += 0.2126 * data[o] + 0.7152 * data[o + 1] + 0.0722 * data[o + 2];
      }
      rows.push(sum / img.naturalWidth);
    }
    let topBar = 0;
    while (topBar < rows.length && rows[topBar] < 6) topBar += 1;
    let bottomBar = 0;
    while (bottomBar < rows.length && rows[rows.length - 1 - bottomBar] < 6) bottomBar += 1;
    const expectedBar = Math.round((img.naturalHeight - (img.naturalWidth * 9) / 16) / 2);
    const contentHeight = img.naturalHeight - topBar - bottomBar;
    return {
      width: img.naturalWidth,
      height: img.naturalHeight,
      topBar,
      bottomBar,
      expectedBar,
      barsBeyond16x9: { top: topBar - expectedBar, bottom: bottomBar - expectedBar },
      contentRatio: contentHeight > 0 ? Number((img.naturalWidth / contentHeight).toFixed(3)) : null,
    };
  }, src);
}

async function runPoints(context, opts) {
  const page = await context.newPage();
  await open(page, opts.url, opts.shell);
  const box = await page.evaluate(async (selector) => {
    const node = document.querySelector(selector);
    if (!node) return null;
    node.scrollIntoView({ block: "center" });
    await new Promise((done) => setTimeout(done, 900));
    const r = node.getBoundingClientRect();
    return { x: r.left, y: r.top, width: r.width, height: r.height };
  }, opts.shell);
  if (!box) {
    console.error(`Оболочка карты не найдена: ${opts.shell}`);
    await page.close();
    return { result: { mode: "points", shell: opts.shell, points: [] }, pass: false };
  }
  await page.waitForTimeout(600);
  const png = await page.screenshot({ type: "png" });

  const areas = MAP_FRACTIONS.map(([fx, fy]) => ({
    x: box.x + box.width * fx,
    y: box.y + box.height * fy,
    width: 1,
    height: 1,
  }));
  const values = await readAreas(context, png, areas);
  await page.close();

  const points = values.map((value, index) => ({
    fx: MAP_FRACTIONS[index][0],
    fy: MAP_FRACTIONS[index][1],
    x: Math.round(areas[index].x),
    y: Math.round(areas[index].y),
    r: Math.round(value.r),
    g: Math.round(value.g),
    b: Math.round(value.b),
    L: round(value.L),
  }));
  return {
    result: {
      mode: "points",
      shell: opts.shell,
      rect: {
        x: round(box.x),
        y: round(box.y),
        width: round(box.width),
        height: round(box.height),
      },
      points,
    },
    pass: points.length === MAP_FRACTIONS.length,
  };
}

const opts = parseArgs(process.argv.slice(2));
const loaded = await loadPlaywright();
if (loaded === null) {
  console.error("playwright не найден: задайте PW_ROOT (каталог с node_modules/playwright)");
  process.exit(2);
}

/*
 * Постоянный профиль с выключенным AutomationControlled: Vercel Security Checkpoint
 * оригинала отдаёт обычному chromium.launch() «Code 21».
 */
const context = await loaded.api.chromium.launchPersistentContext(
  process.env.PW_PROFILE ?? join(tmpdir(), "esd-v11-profile"),
  {
    channel: process.env.PW_CHANNEL ?? "chrome",
    headless: process.env.PW_HEADLESS === "1",
    viewport: { width: opts.width, height: opts.height },
    deviceScaleFactor: 1,
    args: ["--disable-blink-features=AutomationControlled"],
    ignoreDefaultArgs: ["--enable-automation"],
  },
);

let outcome;
try {
  outcome = opts.mode === "cover" ? await runCover(context, opts) : await runPoints(context, opts);
} finally {
  await context.close();
}

console.log(JSON.stringify({ ...outcome.result, url: opts.url, viewport: { width: opts.width, height: opts.height } }));
console.log(outcome.pass ? "PASS" : "FAIL");
process.exit(outcome.pass ? 0 : 1);
