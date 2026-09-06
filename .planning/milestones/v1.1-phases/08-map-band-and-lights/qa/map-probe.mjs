#!/usr/bin/env node
/*
 * Зонд карты фазы 8. Три режима:
 *   band   — MAP-01/03/04: карта в первом кадре, отсутствие второй линии на стыке
 *            карты и формы (пиксельная выборка), отсутствие горизонтальной прокрутки;
 *   fps    — MAP-06: счётчик requestAnimationFrame за 2 с на сцене карты;
 *   lights — MAP-05/06/07: пять корзин с градиентными ореолами, обводка ядра,
 *            живое дыхание радиуса и прозрачности, цвета огоньков и счётчиков;
 *            с --reduced анимации нет, а ореол статичен.
 *
 * Зависимостей в репозиторий не добавляет: playwright резолвится из PW_ROOT,
 * из кэша npx или из обычного node_modules. Печатает одну строку JSON и итог
 * PASS/FAIL, выходит с кодом 0 (PASS), 1 (FAIL) или 2 (браузер не найден).
 *
 *   node .planning/phases/08-map-band-and-lights/qa/map-probe.mjs band --width 1440 --height 900
 *   node .planning/phases/08-map-band-and-lights/qa/map-probe.mjs fps --runs 3
 *   node .planning/phases/08-map-band-and-lights/qa/map-probe.mjs lights --reduced
 */
import { existsSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { homedir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

/** Огоньков на карте: 694 человека + 248 групп из src/data/lights.ts. */
const EXPECTED_LIGHTS = 942;
/** Фазовых корзин ореолов: LIGHT_BUCKETS из EsdMap.tsx. */
const LIGHT_BUCKETS = 5;
/** Пауза между двумя замерами дыхания: четверть периода 2.6s. */
const BREATH_GAP_MS = 650;
/** Порог перепада яркости между соседними строками: скачок > 6 считается видимой линией. */
const JUMP_THRESHOLD = 6;
/** Полуширина окна вокруг линии скоса: сам скос перепад давать обязан. */
const SKEW_WINDOW = 3;
/** Сколько строк под окном берётся в плато для замера высоты ступеньки скоса. */
const PLATEAU_ROWS = 12;
/** Нижняя граница медианы fps по MAP-06. */
const FPS_FLOOR = 50;
/** Высота выборки: 6 строк над линией скоса и 120 под ней. */
const SAMPLE_ABOVE = 6;
const SAMPLE_BELOW = 120;

const DEFAULTS = {
  url: "http://localhost:4173/esd-onevoice27/",
  width: 1440,
  height: 900,
  runs: 3,
  reduced: false,
};

function parseArgs(argv) {
  const mode = argv[0];
  if (mode !== "band" && mode !== "fps" && mode !== "lights") {
    console.error("Режим: band | fps | lights");
    process.exit(2);
  }
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
    } else if (flag === "--runs") {
      opts.runs = Number(argv[(i += 1)]);
    } else {
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
  console.error(`  PW_ROOT=${scratch} node ${process.argv[1]} band`);
  process.exit(2);
}

/**
 * Запуск браузера. Сначала канал из PW_CHANNEL (по умолчанию установленный Chrome),
 * затем встроенный chromium; при PW_HEADLESS=0 сперва пробуется окно, потом headless.
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
      failures.push(`${attempt.channel ?? "chromium"}/${attempt.headless ? "headless" : "окно"}: ${error.message.split("\n")[0]}`);
    }
  }
  console.error(`Браузер не запустился:\n  ${failures.join("\n  ")}`);
  process.exit(2);
}

const round = (value, digits = 2) => Number(value.toFixed(digits));

/** Ширина скоса: тот же clamp(32px, 3.2vw, 52px), что в map.css. */
const wedgeFor = (width) => Math.min(Math.max(32, 0.032 * width), 52);

async function runBand(context, opts) {
  const page = await context.newPage();
  await page.goto(opts.url, { waitUntil: "load" });
  await page.bringToFront();
  await page.evaluate(() => new Promise((done) => requestAnimationFrame(() => done(null))));

  // Первый кадр: карта видна без прокрутки, огоньки на месте, скосы живые.
  const firstFrame = await page.evaluate((expected) => {
    const container = document.querySelector(".map-container");
    const shell = document.querySelector(".map-shell");
    const band = document.querySelector(".map-band");
    return {
      mapOpaque: container !== null && getComputedStyle(container).opacity === "1",
      mapWithoutInlineStyle: container !== null && !container.hasAttribute("style"),
      lightsRendered: document.querySelectorAll(".light-core").length === expected,
      lightsCount: document.querySelectorAll(".light-core").length,
      shellWedge: shell !== null && getComputedStyle(shell).clipPath.includes("calc(100% - "),
      bandBackdrop:
        band !== null && getComputedStyle(band, "::before").clipPath.startsWith("polygon("),
    };
  }, EXPECTED_LIGHTS);

  // Низ карты выводится в середину окна: шапка успевает спрятаться, заголовок формы — проявиться.
  await page.evaluate(() => {
    const shell = document.querySelector(".map-shell");
    window.scrollTo(0, shell.getBoundingClientRect().bottom + window.scrollY - 450);
  });
  await page.waitForTimeout(1500);

  const rect = await page.evaluate(() => {
    const r = document.querySelector(".map-shell").getBoundingClientRect();
    return { top: r.top, bottom: r.bottom, width: r.width, height: r.height };
  });

  const wedge = wedgeFor(opts.width);
  const abscissas = opts.width >= 768 ? [200, 1240] : [20, opts.width - 20];
  const samples = abscissas
    .filter((x) => x >= 0 && x < opts.width)
    .map((x) => {
      // Полигон .map-shell: слева низ на 0 100%, справа на 100% calc(100% - wedge).
      const ySkew = rect.bottom - (wedge * x) / rect.width;
      return { x, ySkew, y0: Math.floor(ySkew - SAMPLE_ABOVE), rows: SAMPLE_ABOVE + SAMPLE_BELOW + 1 };
    });

  const shot = await page.screenshot({ type: "png" });
  const reader = await context.newPage();
  await reader.setContent('<canvas id="c"></canvas>');
  const columns = await reader.evaluate(
    async ({ dataUrl, points }) => {
      const img = new Image();
      img.src = dataUrl;
      await img.decode();
      const canvas = document.getElementById("c");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(img, 0, 0);
      return points.map((point) => {
        const y0 = Math.max(0, Math.min(point.y0, canvas.height - 1));
        const rows = Math.max(1, Math.min(point.rows, canvas.height - y0));
        const data = ctx.getImageData(Math.min(point.x, canvas.width - 1), y0, 1, rows).data;
        const luminance = [];
        for (let i = 0; i < rows; i += 1) {
          const o = i * 4;
          luminance.push(0.2126 * data[o] + 0.7152 * data[o + 1] + 0.0722 * data[o + 2]);
        }
        return { x: point.x, y0, rows, luminance };
      });
    },
    { dataUrl: `data:image/png;base64,${shot.toString("base64")}`, points: samples },
  );
  await reader.close();

  const scans = columns.map((column, index) => {
    const { ySkew } = samples[index];
    const jumps = [];
    let skewJump = 0;
    let maxJumpOutsideSkew = 0;
    for (let i = 0; i + 1 < column.luminance.length; i += 1) {
      const y = column.y0 + i + 1;
      const delta = Math.abs(column.luminance[i + 1] - column.luminance[i]);
      if (y >= ySkew - SKEW_WINDOW && y <= ySkew + SKEW_WINDOW) {
        skewJump = Math.max(skewJump, delta);
        continue;
      }
      maxJumpOutsideSkew = Math.max(maxJumpOutsideSkew, delta);
      if (delta > JUMP_THRESHOLD) jumps.push({ y, delta: round(delta) });
    }

    /*
     * Высота самой ступеньки скоса. Считается по плато с двух сторон окна, а не по
     * максимуму построчной разницы: линия наклонена на 1px каждые 31px, сглаживание
     * размазывает ступеньку на две строки, и построчный максимум занижает её вдвое.
     */
    const plateau = (keep) => {
      const values = column.luminance.filter((_, i) => keep(column.y0 + i));
      return values.length === 0
        ? null
        : values.reduce((sum, value) => sum + value, 0) / values.length;
    };
    const above = plateau((y) => y < ySkew - SKEW_WINDOW);
    const below = plateau(
      (y) => y > ySkew + SKEW_WINDOW && y <= ySkew + SKEW_WINDOW + PLATEAU_ROWS,
    );
    const skewStep = above === null || below === null ? 0 : Math.abs(above - below);

    return {
      x: column.x,
      ySkew: round(ySkew, 1),
      window: [column.y0, column.y0 + column.rows - 1],
      skewStep: round(skewStep),
      skewJump: round(skewJump),
      maxJumpOutsideSkew: round(maxJumpOutsideSkew),
      jumps,
    };
  });

  const scroll = await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
    return {
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    };
  });

  const firstFrameOk = Object.entries(firstFrame)
    .filter(([key]) => key !== "lightsCount")
    .every(([, value]) => value === true);
  const noScrollbar = scroll.scrollWidth <= scroll.innerWidth + 1;
  const strict = opts.width >= 768;
  const cleanBand = scans.every((scan) => scan.jumps.length === 0);
  // Хотя бы на одной абсциссе скос обязан быть виден, иначе выборка легла мимо кромки.
  const skewVisible = scans.some((scan) => scan.skewStep > JUMP_THRESHOLD);
  const pass = strict
    ? firstFrameOk && noScrollbar && cleanBand && skewVisible
    : firstFrameOk && noScrollbar;

  await page.close();
  return {
    result: {
      mode: "band",
      viewport: { width: opts.width, height: opts.height },
      wedge: round(wedge),
      shell: { top: round(rect.top, 1), bottom: round(rect.bottom, 1), width: round(rect.width, 1) },
      firstFrame,
      scans,
      scrollWidth: scroll.scrollWidth,
      innerWidth: scroll.innerWidth,
      noScrollbar,
      strict,
      cleanBand,
      skewVisible,
    },
    pass,
  };
}

async function runFps(context, opts) {
  const page = await context.newPage();
  await page.goto(opts.url, { waitUntil: "load" });
  await page.bringToFront();
  await page.evaluate(() =>
    document.querySelector(".map-shell").scrollIntoView({ block: "center" }),
  );
  // Ждём конца reveal, счёта счётчиков и скрытия шапки.
  await page.waitForTimeout(2500);

  const runs = [];
  for (let i = 0; i < opts.runs; i += 1) {
    if (i > 0) await page.waitForTimeout(300);
    const sample = await page.evaluate(
      () =>
        new Promise((done) => {
          const start = performance.now();
          let previous = start;
          let frames = 0;
          let maxGapMs = 0;
          const tick = (now) => {
            frames += 1;
            maxGapMs = Math.max(maxGapMs, now - previous);
            previous = now;
            if (now - start < 2000) {
              requestAnimationFrame(tick);
            } else {
              done({ frames, elapsedMs: now - start, maxGapMs });
            }
          };
          requestAnimationFrame(tick);
        }),
    );
    runs.push({
      fps: round(sample.frames / (sample.elapsedMs / 1000), 1),
      maxGapMs: round(sample.maxGapMs, 1),
      frames: sample.frames,
    });
  }

  const sorted = runs.map((run) => run.fps).sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  const maxGapMs = Math.max(...runs.map((run) => run.maxGapMs));

  await page.close();
  return {
    result: {
      mode: "fps",
      viewport: { width: opts.width, height: opts.height },
      runs,
      median,
      maxGapMs,
      floor: FPS_FLOOR,
    },
    pass: median >= FPS_FLOOR,
  };
}

/**
 * Текущее состояние дыхания: радиус первого ореола и прозрачность его корзины.
 * Функция уезжает в браузер, поэтому замыканий снаружи не держит.
 */
const readBreath = () => {
  const halo = document.querySelector(".light-halo");
  const bucket = document.querySelector('.light-bucket[data-bucket="0"]');
  return {
    haloR: getComputedStyle(halo).r,
    haloOpacity: getComputedStyle(halo).opacity,
    bucketOpacity: getComputedStyle(bucket).opacity,
  };
};

async function runLights(context, opts) {
  const page = await context.newPage();

  // MAP-07: карта и огоньки живут уже в первом кадре, без плейсхолдеров.
  await page.goto(opts.url, { waitUntil: "domcontentloaded" });
  const early = await page.evaluate(
    () =>
      new Promise((done) =>
        requestAnimationFrame(() =>
          done({
            cores: document.querySelectorAll(".light-core").length,
            buckets: document.querySelectorAll(".light-bucket").length,
          }),
        ),
      ),
  );
  const firstFrame = early.cores === EXPECTED_LIGHTS && early.buckets === LIGHT_BUCKETS;

  await page.waitForLoadState("load");
  await page.bringToFront();
  await page.evaluate(() =>
    document.querySelector(".map-shell").scrollIntoView({ block: "center" }),
  );
  await page.waitForTimeout(1000);

  const structure = await page.evaluate(() => {
    const buckets = Array.from(document.querySelectorAll(".light-bucket"));
    const halos = Array.from(document.querySelectorAll(".light-halo"));
    const fills = halos.map((halo) => halo.getAttribute("fill"));
    return {
      buckets: buckets.length,
      bucketOrder: buckets.map((bucket) => bucket.getAttribute("data-bucket")),
      bucketsMarked: buckets.filter((bucket) => bucket.dataset.anim === "pulse").length,
      halos: halos.length,
      halosInBuckets: halos.filter((halo) => halo.closest(".light-bucket") !== null).length,
      haloFillsOk: fills.every((fill) => /^url\(#light-halo-(person|group)\)$/.test(fill ?? "")),
      haloPerson: fills.filter((fill) => fill === "url(#light-halo-person)").length,
      haloGroup: fills.filter((fill) => fill === "url(#light-halo-group)").length,
      cores: document.querySelectorAll(".light-cores .light-core").length,
      pulseClass: document.querySelectorAll(".light.pulse").length,
      // Считаем градиенты самой карты: у иллюстраций секции «как участвовать»
      // есть свои, и document-wide счёт ловил бы их тоже.
      gradients: document.querySelectorAll(".esd-map__svg radialGradient").length,
      gradientIds: Array.from(document.querySelectorAll(".esd-map__svg radialGradient")).map(
        (node) => node.id,
      ),
    };
  });

  const styles = await page.evaluate(() => {
    const read = (selector, property) => {
      const node = document.querySelector(selector);
      return node === null ? null : getComputedStyle(node)[property];
    };
    return {
      supportsProperty: typeof CSS.registerProperty === "function",
      animationNames: Array.from(document.querySelectorAll(".light-bucket")).map(
        (bucket) => getComputedStyle(bucket).animationName,
      ),
      animationDuration: read('.light-bucket[data-bucket="0"]', "animationDuration"),
      animationDelay3: read('.light-bucket[data-bucket="3"]', "animationDelay"),
      coreStroke: read(".light-core", "stroke"),
      coreStrokeWidth: read(".light-core", "strokeWidth"),
      coreStrokeOpacity: read(".light-core", "strokeOpacity"),
      personFill: read(".light--person .light-core", "fill"),
      groupFill: read(".light--group .light-core", "fill"),
      peopleAccent: read(".counter--people .counter__value", "color"),
      groupsAccent: read(".counter--groups .counter__value", "color"),
      shellBackground: read(".map-shell", "backgroundColor"),
    };
  });

  const before = await page.evaluate(readBreath);
  await page.waitForTimeout(BREATH_GAP_MS);
  const after = await page.evaluate(readBreath);

  // Общее для обоих режимов: разметка, цвета и обводка ядра от движения не зависят.
  const checks = {
    firstFrame,
    buckets: structure.buckets === LIGHT_BUCKETS,
    bucketOrder: structure.bucketOrder.join(",") === "0,1,2,3,4",
    bucketsMarked: structure.bucketsMarked === LIGHT_BUCKETS,
    halos: structure.halos === EXPECTED_LIGHTS,
    halosInBuckets: structure.halosInBuckets === EXPECTED_LIGHTS,
    haloFills: structure.haloFillsOk && structure.haloPerson > 0 && structure.haloGroup > 0,
    cores: structure.cores === EXPECTED_LIGHTS,
    noPulseClass: structure.pulseClass === 0,
    gradients:
      structure.gradients === 2 &&
      structure.gradientIds.join(",") === "light-halo-person,light-halo-group",
    coreStroke: styles.coreStroke === "rgb(255, 255, 255)",
    coreStrokeWidth: styles.coreStrokeWidth === "0.9px",
    coreStrokeOpacity: styles.coreStrokeOpacity === "0.5",
    lightColors:
      styles.personFill === "rgb(158, 67, 154)" && styles.groupFill === "rgb(84, 164, 172)",
    counterAccents:
      styles.peopleAccent === "rgb(210, 142, 190)" &&
      styles.groupsAccent === "rgb(123, 194, 199)",
  };

  if (opts.reduced) {
    // Гасит глобальный блок по data-anim="pulse": анимации нет, ореол статичен.
    checks.animationOff = styles.animationNames.every((name) => name === "none");
    checks.bucketOpaque = before.bucketOpacity === "1";
    checks.haloStaticOpacity = before.haloOpacity === "0.22";
    checks.haloStaticRadius = before.haloR === "9px";
    checks.haloStill = before.haloR === after.haloR;
  } else {
    checks.animationName = styles.animationNames.every((name) => name === "light-breathe");
    checks.animationDuration = styles.animationDuration === "2.6s";
    checks.animationDelay3 = styles.animationDelay3 === "-1.56s";
    checks.supportsProperty = styles.supportsProperty;
    // Fallback MAP-06: радиус статичный (9px), дышит только opacity корзины.
    checks.radiusStatic = before.haloR === after.haloR && before.haloR === "9px";
    checks.opacityBreathes = before.bucketOpacity !== after.bucketOpacity;
  }

  await page.close();
  return {
    result: {
      mode: "lights",
      viewport: { width: opts.width, height: opts.height },
      firstFrame,
      firstFrameCounts: early,
      ...structure,
      ...styles,
      breath: { before, after, gapMs: BREATH_GAP_MS },
      checks,
      failed: Object.entries(checks)
        .filter(([, value]) => value !== true)
        .map(([key]) => key),
    },
    pass: Object.values(checks).every((value) => value === true),
  };
}

const RUNNERS = { band: runBand, fps: runFps, lights: runLights };

const opts = parseArgs(process.argv.slice(2));
const playwright = await loadPlaywright();
if (playwright === null) missingPlaywright();

const { browser, channel, headless } = await launchBrowser(playwright.api.chromium);
console.log(
  `# ${opts.mode} | ${channel} ${headless ? "headless" : "окно"} | playwright ${playwright.version} (${playwright.from}) | ${opts.width}x${opts.height} | reduced: ${opts.reduced}`,
);

const context = await browser.newContext({
  viewport: { width: opts.width, height: opts.height },
  deviceScaleFactor: 1,
  ...(opts.reduced ? { reducedMotion: "reduce" } : {}),
});

let outcome;
try {
  outcome = await RUNNERS[opts.mode](context, opts);
} finally {
  await context.close();
  await browser.close();
}

console.log(JSON.stringify({ ...outcome.result, channel, headless, reduced: opts.reduced }));
console.log(outcome.pass ? "PASS" : "FAIL");
process.exit(outcome.pass ? 0 : 1);
