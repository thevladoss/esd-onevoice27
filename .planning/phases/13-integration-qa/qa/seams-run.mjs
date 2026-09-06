#!/usr/bin/env node
/*
 * Драйвер снимка стыков: гоняет seams.evaluate.js на живой странице.
 *
 * План 13-01 писался под Playwright MCP (browser_evaluate тем же файлом). У этого
 * исполнителя MCP нет, поэтому та же функция уезжает в страницу через playwright
 * из кэша npx — резолв повторяет map-probe.mjs фазы 8.
 *
 * Три захода за один запуск браузера: базовый снимок, клик по карточке «Видео»,
 * переход на #resources-materials. Результаты сливаются в один JSON на stdout.
 *
 *   node .planning/phases/13-integration-qa/qa/seams-run.mjs \
 *     --url http://localhost:4173/esd-onevoice27/ --width 1440 --height 900
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));

const DEFAULTS = {
  url: "http://localhost:4173/esd-onevoice27/",
  width: 1440,
  height: 900,
};

function parseArgs(argv) {
  const opts = { ...DEFAULTS };
  for (let i = 0; i < argv.length; i += 1) {
    const flag = argv[i];
    if (flag === "--url") opts.url = argv[(i += 1)];
    else if (flag === "--width") opts.width = Number(argv[(i += 1)]);
    else if (flag === "--height") opts.height = Number(argv[(i += 1)]);
    else {
      console.error(`Неизвестный аргумент: ${flag}`);
      process.exit(2);
    }
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

const opts = parseArgs(process.argv.slice(2));

const loaded = await loadPlaywright();
if (!loaded) {
  console.error("playwright не найден: задайте PW_ROOT (каталог с node_modules/playwright)");
  process.exit(2);
}

/** Текст файла — одно выражение-функция; хвостовой мусор снимается, чтобы `(src)()` был валиден. */
const source = readFileSync(join(HERE, "seams.evaluate.js"), "utf8").trim().replace(/;$/, "");
const call = `(${source})()`;

const browser = await loaded.api.chromium.launch({
  channel: process.env.PW_CHANNEL ?? "chrome",
  headless: process.env.PW_HEADLESS !== "0",
});
const page = await browser.newPage({ viewport: { width: opts.width, height: opts.height } });

try {
  await page.goto(opts.url, { waitUntil: "load" });
  // Дыхание корзин и шторка панели — CSS-переходы: даём кадрам устояться.
  await page.waitForTimeout(400);

  const base = await page.evaluate(call);

  await page.click('#resources button[data-kind="video"]');
  await page.waitForSelector('#resources-panel[data-kind="video"] .ve-poster');
  await page.waitForTimeout(900);
  const video = await page.evaluate(call);

  await page.keyboard.press("Escape");
  await page.waitForTimeout(900);

  await page.goto(`${opts.url}#resources-materials`, { waitUntil: "load" });
  await page.waitForSelector('#resources-panel[data-kind="materials"]');
  await page.waitForTimeout(900);
  const materials = await page.evaluate(call);

  const result = {
    ...base,
    videoPanel: video.videoPanel,
    deepLink: materials.deepLink,
    probe: {
      playwright: loaded.version,
      from: loaded.from,
      channel: process.env.PW_CHANNEL ?? "chrome",
      headless: process.env.PW_HEADLESS !== "0",
      url: opts.url,
    },
  };

  console.log(JSON.stringify(result, null, 2));
} finally {
  await browser.close();
}
