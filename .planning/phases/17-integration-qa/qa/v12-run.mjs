#!/usr/bin/env node
/*
 * Драйвер приёмки v1.2: три режима над живой страницей прода или оригинала.
 *
 *   measure — снимок v12-measure.js: видео-глобус, canvas частиц, canvas огоньков,
 *             узлы SVG, реестр data-anim, аудит целей касания. Пишет JSON;
 *   fps     — медиана requestAnimationFrame по секциям (hero, карта, форма, about,
 *             потолок стенда на статичной секции). CPU-троттлинг через CDP
 *             `Emulation.setCPUThrottlingRate`, сброс в rate 1 в finally;
 *   shots   — скриншоты hero и карты в JPEG качества 70.
 *
 * Зависимостей в репозиторий не добавляет: playwright резолвится из PW_ROOT или
 * из кэша npx (как v11-run.mjs фазы 13 и lights-probe.mjs фазы 15).
 *
 * Оригинал onevoice27.org стоит за Vercel Security Checkpoint: обычный
 * chromium.launch() получает «Failed to verify your browser. Code 21». Проходит
 * постоянный профиль с выключенным AutomationControlled и без --enable-automation;
 * навигация с waitUntil "commit", затем ожидание #ov-main-header до 150 с, три
 * попытки. Если challenge не пропустил, скрипт пишет { "unavailable": "vercel
 * challenge" } и выходит с кодом 3.
 *
 *   Q=.planning/phases/17-integration-qa/qa
 *   node $Q/v12-run.mjs measure --site prod --width 390 --height 844 --out $Q/results/prod-measure-390.json
 *   node $Q/v12-run.mjs fps --site prod --width 390 --height 844 --cpu 4 --runs 3
 *   node $Q/v12-run.mjs shots --site prod --width 1440 --height 900 --out-dir docs/qa
 */
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { homedir, tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));

const URLS = {
  prod: "https://thevladoss.github.io/esd-onevoice27/",
  orig: "https://onevoice27.org/",
};
/** Якорь готовности страницы: у прода цитата в конце, у оригинала шапка. */
const ANCHORS = { prod: "#quote", orig: "#ov-main-header" };
/** Challenge оригинала перезагружает страницу сам, поэтому ждём долго. */
const CHALLENGE_TIMEOUT_MS = 150_000;
const CHALLENGE_ATTEMPTS = 3;
const PROD_TIMEOUT_MS = 60_000;

/** Секции для замера fps: прокрутка по этим селекторам, hero — к верху страницы. */
const SECTIONS = {
  prod: {
    hero: null,
    map: ".map-shell",
    "light-form": "#light-form",
    about: "#about",
    quote: "#quote",
  },
  orig: {
    hero: null,
    map: "#ov-map-element",
    "light-form": "#ov-light-form-container",
    about: "#ov-about",
    quote: "#ov-main-footer-content",
  },
};
/** Полотна, чьи кадры считаются параллельно с fps. */
const CANVAS = {
  prod: { particles: 'canvas[data-anim="stars"]', lights: "canvas.map-lights-canvas" },
  orig: { particles: "canvas", lights: null },
};
const MAP_SHELL = { prod: ".map-shell", orig: "#ov-map-element" };
/** Бюджет LIGHT-07: под троттлингом 55, без него 100. */
const FLOOR_THROTTLED = 55;
const FLOOR_PLAIN = 100;
/** Секции, по которым считается вердикт; about и quote информационные. */
const GATED = ["hero", "map", "light-form"];
const SAMPLE_MS = 2000;
const SETTLE_MS = 2000;

const USAGE = `Режимы: measure | fps | shots
  --site prod|orig     сайт (по умолчанию prod)
  --url <url>          переопределить адрес
  --width <n>          ширина вьюпорта (1440)
  --height <n>         высота вьюпорта (900)
  --cpu <n>            троттлинг CPU через CDP, только fps (1)
  --runs <n>           замеров на секцию, только fps (3)
  --sections a,b,c     секции fps (hero,map,light-form,about,quote)
  --reduced            контекст с prefers-reduced-motion: reduce
  --out <file>         файл JSON для measure и fps
  --out-dir <dir>      каталог скриншотов для shots (docs/qa)`;

function parseArgs(argv) {
  const opts = {
    mode: null,
    site: "prod",
    url: null,
    width: 1440,
    height: 900,
    cpu: 1,
    runs: 3,
    sections: ["hero", "map", "light-form", "about", "quote"],
    reduced: false,
    out: null,
    outDir: "docs/qa",
  };
  for (let i = 0; i < argv.length; i += 1) {
    const flag = argv[i];
    if (!opts.mode && !flag.startsWith("--")) opts.mode = flag;
    else if (flag === "--site") opts.site = argv[(i += 1)];
    else if (flag === "--url") opts.url = argv[(i += 1)];
    else if (flag === "--width") opts.width = Number(argv[(i += 1)]);
    else if (flag === "--height") opts.height = Number(argv[(i += 1)]);
    else if (flag === "--cpu") opts.cpu = Number(argv[(i += 1)]);
    else if (flag === "--runs") opts.runs = Number(argv[(i += 1)]);
    else if (flag === "--sections") opts.sections = argv[(i += 1)].split(",").map((s) => s.trim());
    else if (flag === "--reduced") opts.reduced = true;
    else if (flag === "--out") opts.out = argv[(i += 1)];
    else if (flag === "--out-dir") opts.outDir = argv[(i += 1)];
    else {
      console.error(`Неизвестный аргумент: ${flag}\n${USAGE}`);
      process.exit(2);
    }
  }
  if (!opts.mode || !["measure", "fps", "shots"].includes(opts.mode)) {
    console.error(USAGE);
    process.exit(2);
  }
  if (opts.site !== "prod" && opts.site !== "orig") {
    console.error(`--site: prod | orig\n${USAGE}`);
    process.exit(2);
  }
  opts.url = opts.url ?? URLS[opts.site];
  if (!opts.out && opts.mode !== "shots") {
    const suffix = `${opts.cpu > 1 ? `-cpu${opts.cpu}` : ""}${opts.reduced ? "-reduced" : ""}`;
    opts.out = join(HERE, "results", `${opts.site}-${opts.mode}-${opts.width}${suffix}.json`);
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

/** Навигация с обходом challenge: коммит документа, затем ожидание якоря. */
async function openPage(page, url, anchor, attempts, timeout) {
  const errors = [];
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      try {
        await page.goto(url, { waitUntil: "commit", timeout });
      } catch (error) {
        // Challenge перезагружает страницу прямо во время навигации: goto падает,
        // хотя документ уже открывается. Ждём якорь, а не хороним попытку.
        if (!/interrupted by another navigation/.test(error.message)) throw error;
      }
      await page.waitForSelector(anchor, { timeout, state: "attached" });
      return { ok: true, attempt };
    } catch (error) {
      errors.push(`попытка ${attempt}: ${error.message.split("\n")[0]}`);
      console.error(`# ${errors[errors.length - 1]}`);
    }
  }
  return { ok: false, errors };
}

/** Баннер cookie оригинала держит подложку с перехватом кликов: снимаем его. */
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

/** Прокрутка до низа и обратно: reveal открыты, ленивые картинки загружены. */
async function warmUp(page) {
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
}

/** Прямоугольник узла в координатах документа: с ним clip работает при fullPage. */
async function pageRect(page, selector) {
  return page.evaluate((sel) => {
    const node = document.querySelector(sel);
    if (!node) return null;
    const r = node.getBoundingClientRect();
    return {
      x: Math.max(0, Math.round(r.left + window.scrollX)),
      y: Math.max(0, Math.round(r.top + window.scrollY)),
      width: Math.round(r.width),
      height: Math.round(r.height),
    };
  }, selector);
}

const round = (value, digits = 1) => Number(value.toFixed(digits));

/**
 * Один замер в странице: цикл requestAnimationFrame на sampleMs с параллельным
 * счётчиком clearRect у обоих полотен. Подмена живёт только на объекте контекста
 * и снимается сразу после замера.
 */
const sampleFrames = async ({ sampleMs, particlesSel, lightsSel, shellSel }) => {
  const hook = (selector) => {
    const canvas = selector ? document.querySelector(selector) : null;
    if (!canvas) return { count: () => null, release: () => {} };
    let ctx = null;
    try {
      ctx = canvas.getContext("2d");
    } catch {
      ctx = null;
    }
    if (!ctx) return { count: () => null, release: () => {} };
    let n = 0;
    const inherited = ctx.clearRect;
    ctx.clearRect = function counted(...args) {
      n += 1;
      return inherited.apply(this, args);
    };
    return {
      count: () => n,
      release: () => {
        delete ctx.clearRect;
      },
    };
  };

  const stars = hook(particlesSel);
  const lights = hook(lightsSel);
  const sample = await new Promise((done) => {
    const start = performance.now();
    let previous = start;
    let frames = 0;
    let maxGapMs = 0;
    let slowFrames = 0;
    const tick = (now) => {
      frames += 1;
      const gap = now - previous;
      if (gap > 20) slowFrames += 1;
      maxGapMs = Math.max(maxGapMs, gap);
      previous = now;
      if (now - start < sampleMs) requestAnimationFrame(tick);
      else done({ frames, elapsedMs: now - start, maxGapMs, slowFrames });
    };
    requestAnimationFrame(tick);
  });

  const shell = shellSel ? document.querySelector(shellSel) : null;
  const box = shell?.getBoundingClientRect() ?? null;
  const out = {
    ...sample,
    starsDraws: stars.count(),
    lightsDraws: lights.count(),
    scrollY: Math.round(window.scrollY),
    mapIntersects: box ? box.bottom > 0 && box.top < window.innerHeight : null,
  };
  stars.release();
  lights.release();
  return out;
};

const opts = parseArgs(process.argv.slice(2));

const loaded = await loadPlaywright();
if (!loaded) {
  console.error("playwright не найден: задайте PW_ROOT (каталог с node_modules/playwright)");
  process.exit(2);
}

const profileDir = process.env.PW_PROFILE ?? join(tmpdir(), "esd-v12-profile");
const context = await loaded.api.chromium.launchPersistentContext(profileDir, {
  channel: process.env.PW_CHANNEL ?? "chrome",
  headless: process.env.PW_HEADLESS === "1",
  viewport: { width: opts.width, height: opts.height },
  deviceScaleFactor: 1,
  isMobile: opts.width < 768,
  hasTouch: opts.width < 768,
  reducedMotion: opts.reduced ? "reduce" : "no-preference",
  args: ["--disable-blink-features=AutomationControlled"],
  ignoreDefaultArgs: ["--enable-automation"],
});
const page = context.pages()[0] ?? (await context.newPage());
await page.setViewportSize({ width: opts.width, height: opts.height });

let exitCode = 0;
try {
  const opened = await openPage(
    page,
    opts.url,
    ANCHORS[opts.site],
    opts.site === "orig" ? CHALLENGE_ATTEMPTS : 1,
    opts.site === "orig" ? CHALLENGE_TIMEOUT_MS : PROD_TIMEOUT_MS,
  );

  if (!opened.ok) {
    const payload = {
      meta: { site: opts.site, url: opts.url, mode: opts.mode, innerWidth: opts.width },
      unavailable: "vercel challenge",
      attempts: opened.errors,
    };
    if (opts.out) writeFileSync(opts.out, JSON.stringify(payload, null, 2) + "\n");
    console.error("# оригинал недоступен: Vercel Security Checkpoint");
    exitCode = 3;
  } else {
    await page.waitForLoadState("load").catch(() => {});
    await page.bringToFront();
    const consent = await dismissConsent(page);
    await warmUp(page);
    await page.waitForTimeout(600);

    if (opts.mode === "measure") {
      const src = readFileSync(join(HERE, "v12-measure.js"), "utf8").trim().replace(/;$/, "");
      const result = await page.evaluate(`(${src})(${JSON.stringify(opts.site)})`);
      result.probe = {
        playwright: loaded.version,
        channel: process.env.PW_CHANNEL ?? "chrome",
        url: opts.url,
        attempt: opened.attempt,
        consent,
        reduced: opts.reduced,
        takenAt: new Date().toISOString(),
      };
      writeFileSync(opts.out, JSON.stringify(result, null, 2) + "\n");
      console.log(
        `# ${opts.site} ${opts.width}x${opts.height}${opts.reduced ? " reduced" : ""}: ` +
          `playing=${result.globe.playing} видео=${result.globe.rect?.width}x${result.globe.rect?.height} ` +
          `${result.globe.objectFit} частицы=${result.particles.drawsPerSecond}/с ` +
          `огоньки=${result.lights?.drawsPerSecond ?? "—"}/с svg=${result.svg.nodes} ` +
          `цели<44=${result.touch.small.length} → ${opts.out}`,
      );
    } else if (opts.mode === "fps") {
      const floor = opts.cpu > 1 ? FLOOR_THROTTLED : FLOOR_PLAIN;
      const sections = {};
      let cdp = null;
      try {
        if (opts.cpu > 1) {
          cdp = await context.newCDPSession(page);
          await cdp.send("Emulation.setCPUThrottlingRate", { rate: opts.cpu });
          await page.waitForTimeout(300);
        }
        for (const name of opts.sections) {
          const selector = SECTIONS[opts.site][name];
          if (selector === undefined) {
            console.error(`# неизвестная секция: ${name}`);
            continue;
          }
          await page.evaluate((sel) => {
            if (!sel) window.scrollTo(0, 0);
            else document.querySelector(sel)?.scrollIntoView({ block: "center" });
          }, selector);
          await page.waitForTimeout(SETTLE_MS);

          const runs = [];
          let last = null;
          for (let i = 0; i < opts.runs; i += 1) {
            if (i > 0) await page.waitForTimeout(300);
            last = await page.evaluate(sampleFrames, {
              sampleMs: SAMPLE_MS,
              particlesSel: CANVAS[opts.site].particles,
              lightsSel: CANVAS[opts.site].lights,
              shellSel: MAP_SHELL[opts.site],
            });
            runs.push({
              fps: round(last.frames / (last.elapsedMs / 1000)),
              maxGapMs: round(last.maxGapMs),
              slowShare: round(last.slowFrames / last.frames, 3),
              frames: last.frames,
              starsDraws: last.starsDraws,
              lightsDraws: last.lightsDraws,
            });
          }
          const median = [...runs].map((r) => r.fps).sort((a, b) => a - b)[Math.floor(runs.length / 2)];
          sections[name] = {
            runs,
            median,
            floor: GATED.includes(name) ? floor : null,
            pass: GATED.includes(name) ? median >= floor : null,
            mapIntersects: last?.mapIntersects ?? null,
            scrollY: last?.scrollY ?? null,
          };
          await page.waitForTimeout(300);
        }
      } finally {
        if (cdp) {
          await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
          await cdp.detach().catch(() => {});
        }
      }
      const passAll = GATED.filter((n) => sections[n]).every((n) => sections[n].pass);
      const payload = {
        meta: {
          site: opts.site,
          url: opts.url,
          width: opts.width,
          height: opts.height,
          cpu: opts.cpu,
          dpr: 1,
          reduced: opts.reduced,
          runs: opts.runs,
          sampleMs: SAMPLE_MS,
          playwright: loaded.version,
          takenAt: new Date().toISOString(),
        },
        sections,
        ceiling: sections.quote?.median ?? null,
        passAll,
      };
      writeFileSync(opts.out, JSON.stringify(payload, null, 2) + "\n");
      const line = Object.entries(sections)
        .map(([name, s]) => `${name} ${s.median}`)
        .join(" | ");
      console.log(`# ${passAll ? "PASS" : "FAIL"} ${opts.site} ${opts.width} cpu×${opts.cpu}: ${line} → ${opts.out}`);
      if (!passAll) exitCode = 1;
    } else {
      const written = [];
      const shot = (name, options) =>
        page
          .screenshot({ path: join(opts.outDir, `${name}.jpeg`), type: "jpeg", quality: 70, ...options })
          .then(() => written.push(name));

      if (opts.site === "prod") {
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.waitForTimeout(2500);
        await shot(`v12-hero-${opts.width}`);
        const shell = await pageRect(page, MAP_SHELL.prod);
        if (shell) await shot(`v12-map-${opts.width}`, { fullPage: true, clip: shell });
      } else {
        const shell = await pageRect(page, MAP_SHELL.orig);
        if (shell) await shot(`v12-orig-map-${opts.width}`, { fullPage: true, clip: shell });
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.waitForTimeout(2500);
        await shot(`v12-orig-hero-${opts.width}`);
      }
      for (const name of written) {
        const path = join(opts.outDir, `${name}.jpeg`);
        console.log(`${name}.jpeg ${statSync(path).size} байт`);
      }
    }
  }
} catch (error) {
  console.error(`# ошибка: ${error.message.split("\n")[0]}`);
  exitCode = 1;
} finally {
  await context.close();
}

process.exit(exitCode);
