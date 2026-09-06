#!/usr/bin/env node
/*
 * Зонд огоньков карты фазы 15. Два режима:
 *   lights — LIGHT-01/04/06: холст `canvas.map-lights-canvas` поверх SVG, счётчики
 *            942/694/248/0, узлов SVG на странице меньше 1300, огоньков в разметке
 *            нет; кадр холста живой (два снимка через 650 мс различаются), под
 *            --reduced один статичный кадр; после Ctrl+колесо (--wheel, по
 *            умолчанию -30: у d3-zoom это масштаб около 2,3×, карта остаётся
 *            в кадре) вьюпорт получает scale(k > 1), а кадр перерисован.
 *            Пишет два PNG области карты: до зума и после;
 *   fps    — LIGHT-07: медиана requestAnimationFrame по --runs замерам на секции
 *            карты или формы. Порог 55 при CPU-троттлинге, иначе 100.
 *
 * Зависимостей в репозиторий не добавляет: playwright резолвится из PW_ROOT,
 * из кэша npx или из обычного node_modules. Троттлинг CPU идёт через CDP
 * `Emulation.setCPUThrottlingRate` и снимается перед закрытием страницы.
 * Печатает шапку стенда, одну строку JSON и итог PASS/FAIL, выходит с кодом
 * 0 (PASS), 1 (FAIL) или 2 (аргументы, браузер).
 *
 *   node .planning/phases/15-lights-canvas/qa/lights-probe.mjs lights --width 1440 --height 900
 *   node .planning/phases/15-lights-canvas/qa/lights-probe.mjs lights --width 1440 --height 900 --reduced
 *   node .planning/phases/15-lights-canvas/qa/lights-probe.mjs fps --width 390 --height 844 --cpu 4 --section map --runs 3
 *   node .planning/phases/15-lights-canvas/qa/lights-probe.mjs fps --width 1440 --height 900 --section form --runs 3
 */
import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { homedir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

/** Огоньков на карте: 694 человека + 248 групп из src/data/lights.ts. */
const EXPECTED_LIGHTS = 942;
const EXPECTED_PEOPLE = 694;
const EXPECTED_GROUPS = 248;
/** Новых огоньков до первой отправки формы нет. */
const EXPECTED_NEW = 0;
/** Стран в SVG карты после переезда огоньков на холст. */
const EXPECTED_COUNTRIES = 177;
/** Потолок узлов SVG на странице по LIGHT-07: до фазы было 3109. */
const SVG_NODE_LIMIT = 1300;
/** Потолок плотности битмапа: MAX_DPR в lightsCanvas.ts. */
const DPR_CAP = 2;
/** Пауза между снимками кадра: четверть периода дыхания 2.6 с. */
const BREATH_GAP_MS = 650;
/** Пороги LIGHT-07: телефон под троттлингом и десктоп без него. */
const FPS_FLOOR_THROTTLED = 55;
const FPS_FLOOR_DESKTOP = 100;
/** Длина одного замера rAF. */
const SAMPLE_MS = 2000;
/** Ожидание reveal, счётчиков и скрытия шапки после прокрутки к секции. */
const SETTLE_MS = 2500;
/** Ширина, ниже которой браузер эмулирует телефон. */
const MOBILE_WIDTH = 768;

const SECTION_SELECTOR = { map: ".map-shell", form: "#light-form" };

const DEFAULTS = {
  url: "http://localhost:4175/esd-onevoice27/",
  width: 1440,
  height: 900,
  dpr: 1,
  cpu: 1,
  section: "map",
  runs: 3,
  wheel: -30,
  reduced: false,
  out: fileURLToPath(new URL("./results/", import.meta.url)),
};

function usage() {
  console.error("Режим: lights | fps");
  console.error(
    "  node lights-probe.mjs <lights|fps> [--url URL] [--width 1440] [--height 900]" +
      " [--dpr 1] [--cpu 1] [--section map|form] [--runs 3] [--wheel -30] [--reduced] [--out DIR]",
  );
  process.exit(2);
}

function parseArgs(argv) {
  const mode = argv[0];
  if (mode !== "lights" && mode !== "fps") usage();
  const opts = { ...DEFAULTS, mode };
  for (let i = 1; i < argv.length; i += 1) {
    const flag = argv[i];
    if (flag === "--reduced") {
      opts.reduced = true;
    } else if (flag === "--url") {
      opts.url = argv[(i += 1)];
    } else if (flag === "--width") {
      opts.width = Number(argv[(i += 1)]);
    } else if (flag === "--height") {
      opts.height = Number(argv[(i += 1)]);
    } else if (flag === "--dpr") {
      opts.dpr = Number(argv[(i += 1)]);
    } else if (flag === "--cpu") {
      opts.cpu = Number(argv[(i += 1)]);
    } else if (flag === "--runs") {
      opts.runs = Number(argv[(i += 1)]);
    } else if (flag === "--wheel") {
      opts.wheel = Number(argv[(i += 1)]);
    } else if (flag === "--out") {
      opts.out = argv[(i += 1)];
    } else if (flag === "--section") {
      opts.section = argv[(i += 1)];
      if (!SECTION_SELECTOR[opts.section]) {
        console.error(`Секция: map | form (получено: ${opts.section})`);
        process.exit(2);
      }
    } else {
      console.error(`Неизвестный аргумент: ${flag}`);
      process.exit(2);
    }
  }
  return opts;
}

/** Имя файла результата: суффиксы cpu и dpr появляются только при значениях ≠ 1. */
function outName(opts) {
  const parts = [opts.mode];
  if (opts.mode === "fps") parts.push(opts.section);
  parts.push(`${opts.width}x${opts.height}`);
  if (opts.cpu !== 1) parts.push(`cpu${opts.cpu}`);
  if (opts.dpr !== 1) parts.push(`dpr${opts.dpr}`);
  if (opts.reduced) parts.push("reduced");
  return `${parts.join("-")}.json`;
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
  try {
    const api = unwrap(await import("playwright"));
    if (api?.chromium) return { api, from: "playwright", version: "неизвестна" };
  } catch {
    // Пакета нет ни в одном из перечисленных мест.
  }
  return null;
}

function missingPlaywright() {
  const scratch = join(homedir(), "pw-probe");
  console.error("playwright не найден. Поставьте его вне репозитория:");
  console.error(
    `  mkdir -p ${scratch} && cd ${scratch} && npm init -y && npm i playwright@1.63.0 && npx playwright install chromium`,
  );
  console.error(`  PW_ROOT=${scratch} node ${process.argv[1]} lights`);
  process.exit(2);
}

/**
 * Запуск браузера. Сначала канал из PW_CHANNEL (по умолчанию установленный Chrome),
 * затем встроенный chromium; при PW_HEADLESS=1 берётся headless.
 */
async function launchBrowser(chromium) {
  const channel = process.env.PW_CHANNEL ?? "chrome";
  const wantHeadless = process.env.PW_HEADLESS === "1";
  const attempts = wantHeadless
    ? [
        { channel, headless: true },
        { channel: null, headless: true },
      ]
    : [
        { channel, headless: false },
        { channel: null, headless: false },
        { channel: null, headless: true },
      ];

  const failures = [];
  for (const attempt of attempts) {
    try {
      const browser = await chromium.launch({
        headless: attempt.headless,
        ...(attempt.channel ? { channel: attempt.channel } : {}),
      });
      return { browser, channel: attempt.channel ?? "chromium", headless: attempt.headless };
    } catch (error) {
      failures.push(
        `${attempt.channel ?? "chromium"}/${attempt.headless ? "headless" : "окно"}: ${error.message.split("\n")[0]}`,
      );
    }
  }
  console.error(`Браузер не запустился:\n  ${failures.join("\n  ")}`);
  process.exit(2);
}

const round = (value, digits = 2) => Number(value.toFixed(digits));

/**
 * Снимок кадра холста: сколько пикселей зажжено и какова сумма альфы.
 * Функция уезжает в браузер, поэтому замыканий снаружи не держит.
 */
const frameSignature = () => {
  const canvas = document.querySelector("canvas.map-lights-canvas");
  if (!canvas) return null;
  const ctx = canvas.getContext("2d");
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  let lit = 0;
  let sum = 0;
  for (let i = 3; i < data.length; i += 4) {
    const alpha = data[i];
    if (alpha > 0) {
      lit += 1;
      sum += alpha;
    }
  }
  return { lit, sum };
};

/** Троттлинг CPU для страницы: rate 1 снимает нагрузку обратно. */
async function throttleCpu(page, rate) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate });
  return cdp;
}

async function runFps(context, opts) {
  const page = await context.newPage();
  await page.goto(opts.url, { waitUntil: "load" });
  await page.bringToFront();
  await page.evaluate(
    (selector) => document.querySelector(selector)?.scrollIntoView({ block: "center" }),
    SECTION_SELECTOR[opts.section],
  );
  await page.waitForTimeout(SETTLE_MS);

  const canvasState = await page.evaluate(() => {
    const canvas = document.querySelector("canvas.map-lights-canvas");
    return canvas
      ? {
          lightCount: canvas.getAttribute("data-light-count"),
          canvasBitmap: { width: canvas.width, height: canvas.height },
        }
      : { lightCount: null, canvasBitmap: null };
  });

  let cdp = null;
  if (opts.cpu > 1) {
    cdp = await throttleCpu(page, opts.cpu);
    await page.waitForTimeout(300);
  }

  const runs = [];
  for (let i = 0; i < opts.runs; i += 1) {
    if (i > 0) await page.waitForTimeout(300);
    const sample = await page.evaluate(
      (sampleMs) =>
        new Promise((done) => {
          const start = performance.now();
          let previous = start;
          let frames = 0;
          let maxGapMs = 0;
          const tick = (now) => {
            frames += 1;
            maxGapMs = Math.max(maxGapMs, now - previous);
            previous = now;
            if (now - start < sampleMs) {
              requestAnimationFrame(tick);
            } else {
              done({ frames, elapsedMs: now - start, maxGapMs });
            }
          };
          requestAnimationFrame(tick);
        }),
      SAMPLE_MS,
    );
    runs.push({
      fps: round(sample.frames / (sample.elapsedMs / 1000), 1),
      maxGapMs: round(sample.maxGapMs, 1),
      frames: sample.frames,
    });
  }

  if (cdp) {
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
    await cdp.detach();
  }

  const sorted = runs.map((run) => run.fps).sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  const maxGapMs = Math.max(...runs.map((run) => run.maxGapMs));
  const floor = opts.cpu > 1 ? FPS_FLOOR_THROTTLED : FPS_FLOOR_DESKTOP;

  await page.close();
  return {
    result: {
      mode: "fps",
      section: opts.section,
      selector: SECTION_SELECTOR[opts.section],
      viewport: { width: opts.width, height: opts.height },
      cpu: opts.cpu,
      dpr: opts.dpr,
      lightCount: canvasState.lightCount,
      canvasBitmap: canvasState.canvasBitmap,
      runs,
      median,
      maxGapMs,
      floor,
    },
    pass: median >= floor,
  };
}

/**
 * Структура холста и остатков SVG. Функция уезжает в браузер целиком,
 * поэтому пороги приходят аргументом.
 */
const readStructure = (limits) => {
  const canvas = document.querySelector(".esd-map > canvas.map-lights-canvas");
  const svgNodes = document.querySelectorAll("svg, svg *").length;
  const mapCircles = document.querySelectorAll(".esd-map circle").length;
  const legacyNodes = document.querySelectorAll(
    ".map-lights, .light-bucket, .light-core, .light-ring, .esd-map defs, .esd-map radialGradient",
  ).length;
  const countries = document.querySelectorAll(".esd-map path.country").length;

  if (!canvas) {
    return { canvas: null, svgNodes, mapCircles, legacyNodes, countries };
  }

  const rect = canvas.getBoundingClientRect();
  const style = getComputedStyle(canvas);
  const expectedDpr = Math.min(window.devicePixelRatio, limits.dprCap);
  return {
    canvas: {
      anim: canvas.dataset.anim,
      ariaHidden: canvas.getAttribute("aria-hidden"),
      lightCount: canvas.getAttribute("data-light-count"),
      people: canvas.getAttribute("data-people"),
      groups: canvas.getAttribute("data-groups"),
      fresh: canvas.getAttribute("data-new"),
      position: style.position,
      pointerEvents: style.pointerEvents,
      inset: [style.top, style.right, style.bottom, style.left],
      cssSize: { width: Math.round(rect.width), height: Math.round(rect.height) },
      bitmap: { width: canvas.width, height: canvas.height },
      devicePixelRatio: window.devicePixelRatio,
      expectedBitmap: {
        width: Math.round(rect.width * expectedDpr),
        height: Math.round(rect.height * expectedDpr),
      },
      previousSibling: canvas.previousElementSibling?.tagName.toLowerCase() ?? null,
    },
    svgNodes,
    mapCircles,
    legacyNodes,
    countries,
  };
};

async function runLights(context, opts) {
  const page = await context.newPage();
  await page.goto(opts.url, { waitUntil: "load" });
  await page.bringToFront();
  await page.evaluate(() => new Promise((done) => requestAnimationFrame(() => done(null))));

  // Карта в центре экрана: вне экрана цикл дыхания стоит по IntersectionObserver.
  await page.evaluate(() =>
    document.querySelector(".map-shell")?.scrollIntoView({ block: "center" }),
  );
  await page.waitForTimeout(SETTLE_MS);

  const structure = await page.evaluate(readStructure, { dprCap: DPR_CAP });
  const canvas = structure.canvas;

  // Дыхание: два снимка кадра через четверть периода.
  const before = await page.evaluate(frameSignature);
  await page.waitForTimeout(BREATH_GAP_MS);
  const after = await page.evaluate(frameSignature);
  const alive = Boolean(before && after && before.lit > 0 && before.sum !== after.sum);
  const isStatic = Boolean(before && after && before.lit > 0 && before.sum === after.sum);

  // Зум проверяется без reduce: под бережным движением кадр один и снимки совпадают.
  let zoom = null;
  if (!opts.reduced) {
    const shell = await page.locator(".map-shell").boundingBox();
    const mapBox = await page.locator(".esd-map").boundingBox();
    if (shell) {
      await page.screenshot({
        clip: {
          x: Math.max(0, shell.x),
          y: Math.max(0, shell.y),
          width: Math.min(shell.width, opts.width - Math.max(0, shell.x)),
          height: Math.min(shell.height, opts.height - Math.max(0, shell.y)),
        },
        path: join(opts.out, `lights-${opts.width}x${opts.height}-map.png`),
      });
    }
    if (mapBox) {
      await page.mouse.move(mapBox.x + mapBox.width / 2, mapBox.y + mapBox.height / 2);
      await page.keyboard.down("Control");
      await page.mouse.wheel(0, opts.wheel);
      await page.keyboard.up("Control");
      await page.waitForTimeout(150);
    }
    const transform = await page.evaluate(
      () => document.querySelector("g.map-viewport")?.getAttribute("transform") ?? null,
    );
    const k = transform ? Number(/scale\(([\d.]+)\)/.exec(transform)?.[1] ?? NaN) : NaN;
    const zoomed = await page.evaluate(frameSignature);
    if (shell) {
      await page.screenshot({
        clip: {
          x: Math.max(0, shell.x),
          y: Math.max(0, shell.y),
          width: Math.min(shell.width, opts.width - Math.max(0, shell.x)),
          height: Math.min(shell.height, opts.height - Math.max(0, shell.y)),
        },
        path: join(opts.out, `lights-${opts.width}x${opts.height}-zoomed.png`),
      });
    }
    zoom = {
      wheel: opts.wheel,
      transform,
      k: Number.isFinite(k) ? round(k, 3) : null,
      litAfter: zoomed ? zoomed.lit : 0,
      changed: Boolean(zoomed && after && zoomed.sum !== after.sum),
    };
  }

  const checks = {
    canvasPresent: Boolean(canvas),
    canvasAfterSvg: canvas?.previousSibling === "svg",
    animPulse: canvas?.anim === "pulse",
    ariaHidden: canvas?.ariaHidden === "true",
    lightCount: canvas?.lightCount === String(EXPECTED_LIGHTS),
    people: canvas?.people === String(EXPECTED_PEOPLE),
    groups: canvas?.groups === String(EXPECTED_GROUPS),
    fresh: canvas?.fresh === String(EXPECTED_NEW),
    positionAbsolute: canvas?.position === "absolute",
    pointerEventsNone: canvas?.pointerEvents === "none",
    insetZero: canvas ? canvas.inset.every((side) => side === "0px") : false,
    bitmapMatchesDpr: canvas
      ? canvas.bitmap.width === canvas.expectedBitmap.width &&
        canvas.bitmap.height === canvas.expectedBitmap.height
      : false,
    svgNodesUnderLimit: structure.svgNodes < SVG_NODE_LIMIT,
    noMapCircles: structure.mapCircles === 0,
    noLegacyLightNodes: structure.legacyNodes === 0,
    countries: structure.countries === EXPECTED_COUNTRIES,
    breath: opts.reduced ? isStatic : alive,
  };
  if (!opts.reduced) {
    checks.zoomScaled = Boolean(zoom && zoom.k !== null && zoom.k > 1);
    checks.zoomRedrawn = Boolean(zoom && zoom.litAfter > 0 && zoom.changed);
  }

  await page.close();
  return {
    result: {
      mode: "lights",
      viewport: { width: opts.width, height: opts.height },
      dpr: opts.dpr,
      structure: canvas,
      svgNodes: structure.svgNodes,
      svgNodeLimit: SVG_NODE_LIMIT,
      mapCircles: structure.mapCircles,
      legacyNodes: structure.legacyNodes,
      countries: structure.countries,
      breath: { before, after, gapMs: BREATH_GAP_MS, alive, static: isStatic },
      zoom,
      checks,
      failed: Object.entries(checks)
        .filter(([, value]) => value !== true)
        .map(([key]) => key),
    },
    pass: Object.values(checks).every((value) => value === true),
  };
}

const RUNNERS = { lights: runLights, fps: runFps };

const opts = parseArgs(process.argv.slice(2));
mkdirSync(opts.out, { recursive: true });

const playwright = await loadPlaywright();
if (playwright === null) missingPlaywright();

const { browser, channel, headless } = await launchBrowser(playwright.api.chromium);
console.log(
  `# ${opts.mode}${opts.mode === "fps" ? ` ${opts.section}` : ""} | ${channel} ${headless ? "headless" : "окно"}` +
    ` | playwright ${playwright.version} (${playwright.from}) | ${opts.width}x${opts.height}` +
    ` | dpr ${opts.dpr} | cpu ×${opts.cpu} | reduced: ${opts.reduced}`,
);

const context = await browser.newContext({
  viewport: { width: opts.width, height: opts.height },
  deviceScaleFactor: opts.dpr,
  ...(opts.width < MOBILE_WIDTH ? { isMobile: true, hasTouch: true } : {}),
  ...(opts.reduced ? { reducedMotion: "reduce" } : {}),
});

let outcome;
try {
  outcome = await RUNNERS[opts.mode](context, opts);
} finally {
  await context.close();
  await browser.close();
}

const result = {
  ...outcome.result,
  url: opts.url,
  reduced: opts.reduced,
  runs: outcome.result.runs,
  stand: {
    channel,
    headless,
    playwright: playwright.version,
    playwrightFrom: playwright.from,
    deviceScaleFactor: opts.dpr,
    cpuThrottling: opts.cpu,
    mobileEmulation: opts.width < MOBILE_WIDTH,
  },
  recordedAt: new Date().toISOString(),
};
if (result.runs === undefined) delete result.runs;

const outFile = join(opts.out, outName(opts));
writeFileSync(outFile, JSON.stringify(result, null, 2));

console.log(JSON.stringify(result));
console.log(`# записано: ${outFile}`);
console.log(outcome.pass ? "PASS" : "FAIL");
process.exit(outcome.pass ? 0 : 1);
