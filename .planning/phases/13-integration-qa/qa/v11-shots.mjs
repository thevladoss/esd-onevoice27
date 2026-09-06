#!/usr/bin/env node
/*
 * Семь скриншотов приёмки v1.1 в docs/qa/: JPEG качества 80, DPR 1.
 *
 * План 13-02 писался под Playwright MCP (browser_take_screenshot). У этого
 * исполнителя MCP нет, поэтому кадры снимает playwright из кэша npx: качество
 * задаётся напрямую в page.screenshot, файлы сразу пишутся в docs/qa/ и в корне
 * репозитория ничего не остаётся.
 *
 *   node .planning/phases/13-integration-qa/qa/v11-shots.mjs --out docs/qa
 */
import { existsSync, readdirSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const DEFAULTS = {
  url: "https://thevladoss.github.io/esd-onevoice27/",
  out: "docs/qa",
};
/** Полуполоса вокруг нижней кромки карты: стык карты и формы, орб, линия скоса. */
const MAP_BOTTOM_HALF = 260;

function parseArgs(argv) {
  const opts = { ...DEFAULTS };
  for (let i = 0; i < argv.length; i += 1) {
    const flag = argv[i];
    if (flag === "--url") opts.url = argv[(i += 1)];
    else if (flag === "--out") opts.out = argv[(i += 1)];
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

/** Прокрутка страницы до низа и обратно: reveal открыты, счётчики досчитаны. */
async function warmUp(page) {
  await page.evaluate(async () => {
    const step = Math.round(window.innerHeight * 0.8);
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((done) => setTimeout(done, 120));
    }
    window.scrollTo(0, document.documentElement.scrollHeight);
    await new Promise((done) => setTimeout(done, 1500));
    window.scrollTo(0, 0);
    await new Promise((done) => setTimeout(done, 900));
  });
}

/** Прямоугольник узла в координатах документа: с ним clip работает при fullPage. */
async function pageRect(page, selector, pad = 0) {
  return page.evaluate(
    ({ sel, pad }) => {
      const node = document.querySelector(sel);
      if (!node) return null;
      const r = node.getBoundingClientRect();
      return {
        x: Math.max(0, Math.round(r.left + window.scrollX) - pad),
        y: Math.max(0, Math.round(r.top + window.scrollY) - pad),
        width: Math.round(r.width) + pad * 2,
        height: Math.round(r.height) + pad * 2,
      };
    },
    { sel: selector, pad },
  );
}

const opts = parseArgs(process.argv.slice(2));
const loaded = await loadPlaywright();
if (!loaded) {
  console.error("playwright не найден: задайте PW_ROOT (каталог с node_modules/playwright)");
  process.exit(2);
}

const context = await loaded.api.chromium.launchPersistentContext(
  process.env.PW_PROFILE ?? join(tmpdir(), "esd-v11-profile"),
  {
    channel: process.env.PW_CHANNEL ?? "chrome",
    headless: process.env.PW_HEADLESS === "1",
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    args: ["--disable-blink-features=AutomationControlled"],
    ignoreDefaultArgs: ["--enable-automation"],
  },
);
const page = context.pages()[0] ?? (await context.newPage());
const shot = (name, options) =>
  page.screenshot({ path: join(opts.out, `${name}.jpeg`), type: "jpeg", quality: 80, ...options });

try {
  // 1. Первый экран 1440×900.
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(opts.url, { waitUntil: "load" });
  await page.waitForTimeout(2500);
  await shot("v11-desktop");

  // 2. Первый экран 390×844.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(opts.url, { waitUntil: "load" });
  await page.waitForTimeout(2500);
  await shot("v11-mobile");

  // 3. Вся страница 1440 после прогрева.
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(opts.url, { waitUntil: "load" });
  await page.waitForTimeout(1500);
  await page.bringToFront();
  await warmUp(page);
  await shot("v11-full", { fullPage: true });

  // 4. Стык карты и формы: полоса ±260px вокруг нижней кромки карты.
  const shell = await pageRect(page, ".map-shell");
  await shot("v11-map-bottom", {
    fullPage: true,
    clip: {
      x: 0,
      y: shell.y + shell.height - MAP_BOTTOM_HALF,
      width: 1440,
      height: MAP_BOTTOM_HALF * 2,
    },
  });

  // 5. Футер целиком.
  const footer = await pageRect(page, "footer.site-footer");
  await shot("v11-footer", { fullPage: true, clip: footer });

  // 6. Форма в состоянии «Групповой маяк».
  await page.evaluate(() =>
    document.querySelector('.lf-type[data-type="group"]').click(),
  );
  await page.waitForTimeout(900);
  const form = await pageRect(page, "#light-form");
  await shot("v11-form-group", { fullPage: true, clip: form });

  // 7. Открытая панель материалов: вьюпорт в фазе is-open.
  await page.goto(`${opts.url}#resources-materials`, { waitUntil: "load" });
  await page.waitForSelector('#resources-panel[data-kind="materials"]');
  await page.waitForTimeout(1500);
  await shot("v11-panel-materials");
} finally {
  await context.close();
}

for (const name of [
  "v11-desktop",
  "v11-mobile",
  "v11-full",
  "v11-form-group",
  "v11-panel-materials",
  "v11-map-bottom",
  "v11-footer",
]) {
  const path = join(opts.out, `${name}.jpeg`);
  console.log(`${name}.jpeg ${statSync(path).size} байт`);
}
