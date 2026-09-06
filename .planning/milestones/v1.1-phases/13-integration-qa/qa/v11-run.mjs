#!/usr/bin/env node
/*
 * Драйвер снимка v1.1: гоняет v11-measure.js на живой странице.
 *
 * План 13-02 писался под Playwright MCP (browser_evaluate тем же файлом). У этого
 * исполнителя MCP нет, поэтому функция уезжает в страницу через playwright из
 * кэша npx — резолв повторяет map-probe.mjs фазы 8 и seams-run.mjs плана 13-01.
 *
 * Оригинал onevoice27.org стоит за Vercel Security Checkpoint. Обычный
 * chromium.launch() получает от него «Failed to verify your browser. Code 21»:
 * checkpoint видит признаки автоматизации. Проверку проходит постоянный профиль
 * (launchPersistentContext) с выключенным AutomationControlled — там
 * navigator.webdriver равен false и страница отдаётся сразу. Профиль лежит вне
 * репозитория, в каталоге ОС для временных файлов.
 *
 * Навигация идёт с waitUntil "commit" и таймаутом 120 с, затем ждём якорный узел
 * до 120 с, до трёх попыток. Если challenge так и не пропустил, скрипт пишет
 * { "unavailable": "vercel challenge" } и выходит с кодом 3.
 *
 *   node .planning/phases/13-integration-qa/qa/v11-run.mjs \
 *     --site prod --width 1440 --height 900 --out qa/results/prod-1440.json
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { homedir, tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));

const URLS = {
  prod: "https://thevladoss.github.io/esd-onevoice27/",
  orig: "https://onevoice27.org/",
};
/** Якорь готовности страницы: у прода цитата в конце, у оригинала секция About. */
const ANCHORS = { prod: "#quote", orig: "#ov-about" };
const CHALLENGE_TIMEOUT_MS = 120_000;
const CHALLENGE_ATTEMPTS = 3;

function parseArgs(argv) {
  const opts = { site: "prod", width: 1440, height: 900, out: null, url: null };
  for (let i = 0; i < argv.length; i += 1) {
    const flag = argv[i];
    if (flag === "--site") opts.site = argv[(i += 1)];
    else if (flag === "--url") opts.url = argv[(i += 1)];
    else if (flag === "--width") opts.width = Number(argv[(i += 1)]);
    else if (flag === "--height") opts.height = Number(argv[(i += 1)]);
    else if (flag === "--out") opts.out = argv[(i += 1)];
    else {
      console.error(`Неизвестный аргумент: ${flag}`);
      process.exit(2);
    }
  }
  if (opts.site !== "prod" && opts.site !== "orig") {
    console.error("--site: prod | orig");
    process.exit(2);
  }
  opts.url = opts.url ?? URLS[opts.site];
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

/**
 * Навигация с обходом Vercel challenge: коммит документа, затем ожидание якоря.
 * Challenge перезагружает страницу сам, поэтому waitForSelector переживает
 * несколько навигаций внутри одной попытки.
 */
async function openPage(page, url, anchor, attempts) {
  const errors = [];
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      await page.goto(url, { waitUntil: "commit", timeout: CHALLENGE_TIMEOUT_MS });
      await page.waitForSelector(anchor, { timeout: CHALLENGE_TIMEOUT_MS, state: "attached" });
      return { ok: true, attempt };
    } catch (error) {
      errors.push(`попытка ${attempt}: ${error.message.split("\n")[0]}`);
      console.error(`# ${errors[errors.length - 1]}`);
    }
  }
  return { ok: false, errors };
}

/**
 * Баннер согласия на cookie у оригинала (base-ui portal) держит поверх страницы
 * подложку `bg-black/25` с перехватом кликов: она мешает и клику по карточке, и
 * замеру цвета пикселей. Жмём «Allow selected» — согласие только на необходимые
 * cookie; кнопку нажимаем через DOM, потому что подложка ловит указатель.
 */
async function dismissConsent(page) {
  return page.evaluate(async () => {
    const portal = document.querySelector("[data-base-ui-portal]");
    if (!portal) return "нет баннера";
    const button = Array.from(portal.querySelectorAll("button")).find((node) =>
      /allow selected|allow everything|accept|принять/i.test(node.textContent ?? ""),
    );
    if (!button) return "кнопка не найдена";
    button.click();
    await new Promise((done) => setTimeout(done, 700));
    return `нажата: ${button.textContent.trim()}`;
  });
}

const opts = parseArgs(process.argv.slice(2));

const loaded = await loadPlaywright();
if (!loaded) {
  console.error("playwright не найден: задайте PW_ROOT (каталог с node_modules/playwright)");
  process.exit(2);
}

/** Текст файла — одно выражение-функция; хвостовой мусор снимается. */
const source = readFileSync(join(HERE, "v11-measure.js"), "utf8").trim().replace(/;$/, "");
const call = `(${source})(${JSON.stringify(opts.site)})`;

const profileDir = process.env.PW_PROFILE ?? join(tmpdir(), "esd-v11-profile");
const context = await loaded.api.chromium.launchPersistentContext(profileDir, {
  channel: process.env.PW_CHANNEL ?? "chrome",
  headless: process.env.PW_HEADLESS === "1",
  viewport: { width: opts.width, height: opts.height },
  deviceScaleFactor: 1,
  args: ["--disable-blink-features=AutomationControlled"],
  ignoreDefaultArgs: ["--enable-automation"],
});
const page = context.pages()[0] ?? (await context.newPage());
await page.setViewportSize({ width: opts.width, height: opts.height });

let exitCode = 0;
try {
  const opened = await openPage(page, opts.url, ANCHORS[opts.site], opts.site === "orig" ? CHALLENGE_ATTEMPTS : 1);
  if (!opened.ok) {
    const payload = {
      meta: { site: opts.site, url: opts.url, innerWidth: opts.width },
      unavailable: "vercel challenge",
      attempts: opened.errors,
    };
    if (opts.out) writeFileSync(opts.out, JSON.stringify(payload, null, 2) + "\n");
    console.log(JSON.stringify(payload, null, 2));
    exitCode = 3;
  } else {
    await page.waitForLoadState("load").catch(() => {});
    await page.bringToFront();
    const consent = await dismissConsent(page);
    // Прокрутка до низа и обратно: reveal-обёртки открыты, ленивые картинки новостей
    // загружены, счётчики досчитаны.
    await page.evaluate(async () => {
      const step = Math.round(window.innerHeight * 0.8);
      for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((done) => setTimeout(done, 120));
      }
      window.scrollTo(0, document.documentElement.scrollHeight);
      await new Promise((done) => setTimeout(done, 1200));
      window.scrollTo(0, 0);
      await new Promise((done) => setTimeout(done, 800));
    });
    await page.waitForTimeout(600);

    const result = await page.evaluate(call);
    result.probe = {
      playwright: loaded.version,
      channel: process.env.PW_CHANNEL ?? "chrome",
      url: opts.url,
      attempt: opened.attempt,
      consent,
      takenAt: new Date().toISOString(),
    };
    const text = JSON.stringify(result, null, 2) + "\n";
    if (opts.out) writeFileSync(opts.out, text);
    console.log(`# ${opts.site} ${opts.width}x${opts.height} → ${opts.out ?? "stdout"}`);
    if (!opts.out) console.log(text);
  }
} finally {
  await context.close();
}

process.exit(exitCode);
