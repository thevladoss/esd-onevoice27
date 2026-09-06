#!/usr/bin/env node
/*
 * Интерактивные сценарии приёмки v1.1: панель ресурсов, deep link, панель «Видео»,
 * reduced motion и форма в состоянии «Групповой маяк» — на проде и на оригинале.
 *
 * План 13-02 писался под Playwright MCP; у этого исполнителя MCP нет, поэтому
 * клики, Escape и чтение состояния идут через playwright из кэша npx. Оригинал за
 * Vercel Security Checkpoint открывается постоянным профилем с выключенным
 * AutomationControlled — иначе checkpoint отдаёт «Code 21».
 *
 *   node .planning/phases/13-integration-qa/qa/v11-interactive.mjs \
 *     --site prod --out qa/results/prod-interactive-1440.json
 */
import { existsSync, readdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const URLS = {
  prod: "https://thevladoss.github.io/esd-onevoice27/",
  orig: "https://onevoice27.org/",
};
const ANCHORS = { prod: "#resources", orig: "#ov-resources" };

const SELECTORS = {
  prod: {
    panels: ".resources-panels",
    panel: "#resources-panel",
    back: ".resources-panel__back",
    materials: '.resource-card button[data-kind="materials"]',
    video: '.resource-card button[data-kind="video"]',
    lockClass: "resources-panel-locked",
    typeGroup: '.lf-type[data-type="group"]',
    typeIndividual: '.lf-type[data-type="individual"]',
    submit: '#light-form button[type="submit"]',
    form: "#light-form",
  },
  orig: {
    panels: "#ov-resources-panels",
    panel: "#ov-resources-panels .ov-resources-panel.is-active",
    back: "#ov-resources-panels .ov-resources-back-action",
    materials: "#ov-resources-card-materials .ov-resources-panel-trigger",
    video: "#ov-resources-card-video .ov-resources-panel-trigger",
    lockClass: "ov-resources-panel-locked",
    typeGroup: 'label[for="LIGHT_TYPE-group"]',
    typeIndividual: 'label[for="LIGHT_TYPE-individual"]',
    submit: '#ov-light-form-container button[type="submit"]',
    form: "#ov-light-form-container",
  },
};

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

async function open(page, url, anchor, attempts) {
  const errors = [];
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      await page.goto(url, { waitUntil: "commit", timeout: 120_000 });
      await page.waitForSelector(anchor, { timeout: 120_000, state: "attached" });
      await page.waitForLoadState("load").catch(() => {});
      return { ok: true, attempt };
    } catch (error) {
      errors.push(`попытка ${attempt}: ${error.message.split("\n")[0]}`);
      console.error(`# ${errors[errors.length - 1]}`);
    }
  }
  return { ok: false, errors };
}

/** Состояние открытой панели: слои, замок прокрутки, фокус, перекрытие шапки. */
const readPanel = (S) => {
  const panels = document.querySelector(S.panels);
  const panel = document.querySelector(S.panel);
  const active = document.activeElement;
  const css = (node, pseudo) => (node ? getComputedStyle(node, pseudo ?? null) : null);
  const panels_ = css(panels);
  return {
    present: !!panels,
    className: panels ? String(panels.className) : null,
    visibility: panels_?.visibility ?? null,
    position: panels_?.position ?? null,
    zIndex: panels_?.zIndex ?? null,
    beforeDuration: css(panels, "::before")?.transitionDuration ?? null,
    beforeTiming: css(panels, "::before")?.transitionTimingFunction ?? null,
    beforeTransform: css(panels, "::before")?.transform ?? null,
    afterDelay: css(panels, "::after")?.transitionDelay ?? null,
    panelDelay: css(panel)?.transitionDelay ?? null,
    panelOpacity: css(panel)?.opacity ?? null,
    panelTransform: css(panel)?.transform ?? null,
    htmlLocked:
      document.documentElement.classList.contains(S.lockClass) &&
      getComputedStyle(document.documentElement).overflow === "hidden",
    bodyLocked:
      document.body.classList.contains(S.lockClass) &&
      getComputedStyle(document.body).overflow === "hidden",
    htmlClass: document.documentElement.className,
    activeClass: active ? String(active.className) : null,
    activeTag: active ? active.tagName.toLowerCase() : null,
    activeText: active ? (active.textContent ?? "").trim().slice(0, 40) : null,
    activeIsBack: !!(active && active.closest && active.closest(S.back) !== null),
    coversHeader: (() => {
      const node = document.elementFromPoint(Math.round(window.innerWidth / 2), 40);
      return !!(node && panels && panels.contains(node));
    })(),
    scrollY: Math.round(window.scrollY),
  };
};

/** Состояние после закрытия: контейнер снят, замок снят, фокус вернулся на карточку. */
const readClosed = ({ S, kind }) => {
  const panels = document.querySelector(S.panels);
  const active = document.activeElement;
  const trigger = document.querySelector(kind);
  const panelsStyle = panels ? getComputedStyle(panels) : null;
  return {
    containerGone: panels === null,
    containerHidden: panelsStyle ? panelsStyle.visibility === "hidden" : null,
    lockCleared:
      !document.documentElement.classList.contains(S.lockClass) &&
      getComputedStyle(document.documentElement).overflow !== "hidden" &&
      !document.body.classList.contains(S.lockClass),
    activeClass: active ? String(active.className) : null,
    activeText: active ? (active.textContent ?? "").trim().slice(0, 40) : null,
    focusOnCard: active !== null && trigger !== null && active === trigger,
    ariaExpanded: trigger?.getAttribute("aria-expanded") ?? null,
  };
};

async function scenarioPanel(page, S, opts, trigger) {
  await page.evaluate((sel) => {
    document.querySelector(sel)?.scrollIntoView({ block: "center" });
  }, opts.site === "prod" ? "#resources" : "#ov-resources");
  await page.waitForTimeout(700);
  // Playwright сам подтягивает элемент в кадр перед кликом: делаем это заранее,
  // иначе «прокрутка не изменилась» мерила бы прокрутку самого клика.
  await page.locator(trigger).scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  const scrollYBefore = await page.evaluate(() => Math.round(window.scrollY));

  await page.click(trigger);
  await page.waitForTimeout(100);
  const early = await page.evaluate(readPanel, S);
  await page.waitForTimeout(900);
  const open_ = await page.evaluate(readPanel, S);

  return { scrollYBefore, early, open: open_ };
}

async function closeWith(page, S, trigger, how) {
  if (how === "escape") await page.keyboard.press("Escape");
  else await page.click(S.back);
  await page.waitForTimeout(50);
  const closing = await page.evaluate(readPanel, S);
  await page.waitForTimeout(1200);
  const closed = await page.evaluate(readClosed, { S, kind: trigger });
  return {
    closingSeen: (closing.className ?? "").includes("is-closing"),
    closingClass: closing.className,
    ...closed,
  };
}

/** Медиана fps по трём замерам requestAnimationFrame за 2 с. */
async function measureFps(page, runs) {
  const values = [];
  for (let i = 0; i < runs; i += 1) {
    if (i > 0) await page.waitForTimeout(300);
    const sample = await page.evaluate(
      () =>
        new Promise((done) => {
          const start = performance.now();
          let frames = 0;
          const tick = (now) => {
            frames += 1;
            if (now - start < 2000) requestAnimationFrame(tick);
            else done({ frames, elapsedMs: now - start });
          };
          requestAnimationFrame(tick);
        }),
    );
    values.push(Number((sample.frames / (sample.elapsedMs / 1000)).toFixed(1)));
  }
  const sorted = [...values].sort((a, b) => a - b);
  return { runs: values, median: sorted[Math.floor(sorted.length / 2)] };
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
const S = SELECTORS[opts.site];
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
    viewport: { width: opts.width, height: opts.height },
    deviceScaleFactor: 1,
    args: ["--disable-blink-features=AutomationControlled"],
    ignoreDefaultArgs: ["--enable-automation"],
  },
);
const page = context.pages()[0] ?? (await context.newPage());
await page.setViewportSize({ width: opts.width, height: opts.height });

const result = { meta: { site: opts.site, url: opts.url, viewport: { width: opts.width, height: opts.height } } };
let exitCode = 0;

try {
  const opened = await open(page, opts.url, ANCHORS[opts.site], opts.site === "orig" ? 3 : 1);
  if (!opened.ok) {
    result.unavailable = "vercel challenge";
    result.attempts = opened.errors;
    exitCode = 3;
  } else {
    result.consent = await dismissConsent(page);
    await page.waitForTimeout(500);

    // 1. Панель материалов: открытие.
    const opening = await scenarioPanel(page, S, opts, S.materials);
    result.panelOpen = {
      ...opening.open,
      earlyClassName: opening.early.className,
      beforeDuration: opening.early.beforeDuration,
      beforeTiming: opening.early.beforeTiming,
      afterDelay: opening.early.afterDelay,
      panelDelay: opening.early.panelDelay,
      scrollYBefore: opening.scrollYBefore,
      scrollYAfter: opening.open.scrollY,
    };

    // 2. Закрытие по Escape.
    result.panelEscape = await closeWith(page, S, S.materials, "escape");

    // 3. Закрытие кнопкой «Назад».
    await page.click(S.materials);
    await page.waitForTimeout(1000);
    result.panelBack = await closeWith(page, S, S.materials, "back");

    if (opts.site === "prod") {
      // 4. Deep link: панель материалов открывается полной навигацией по хешу.
      await page.goto(`${opts.url}#resources-materials`, { waitUntil: "load" });
      await page.waitForTimeout(1200);
      result.deepLink = await page.evaluate(() => {
        const panel = document.querySelector("#resources-panel");
        const esd = document.querySelector("#resources-group-esd");
        return {
          kind: panel?.getAttribute("data-kind") ?? null,
          expanded:
            document.querySelector('button[data-kind="materials"]')?.getAttribute("aria-expanded") ??
            null,
          groups: document.querySelectorAll("details.resources-group").length,
          esdOpen: esd instanceof HTMLDetailsElement ? esd.open : null,
          esdLinks: esd ? esd.querySelectorAll("a.resources-file__action").length : 0,
        };
      });
      await page.keyboard.press("Escape");
      await page.waitForTimeout(1200);
    }

    // 5. Панель «Видео»: превью 16:9.
    await page.evaluate((sel) => {
      document.querySelector(sel)?.scrollIntoView({ block: "center" });
    }, opts.site === "prod" ? "#resources" : "#ov-resources");
    await page.waitForTimeout(600);
    await page.click(S.video);
    await page.waitForTimeout(1400);
    result.videoPanel = await page.evaluate((site) => {
      const panel = document.querySelector(
        site === "prod" ? "#resources-panel" : "#ov-resources-panels .ov-resources-panel.is-active",
      );
      if (!panel) return { count: 0 };
      const frames = Array.from(
        panel.querySelectorAll(site === "prod" ? ".ve" : "img, video, iframe"),
      );
      const ratios = frames
        .map((node) => {
          const r = node.getBoundingClientRect();
          return r.height ? Number((r.width / r.height).toFixed(4)) : null;
        })
        .filter((value) => value !== null);
      const poster = panel.querySelector(site === "prod" ? ".ve-poster" : "img");
      const posterStyle = poster ? getComputedStyle(poster) : null;
      return {
        count: frames.length,
        ratios,
        ratioMin: ratios.length ? Math.min(...ratios) : null,
        ratioMax: ratios.length ? Math.max(...ratios) : null,
        objectFit: posterStyle?.objectFit ?? null,
        objectPosition: posterStyle?.objectPosition ?? null,
        naturalWidth: poster?.naturalWidth ?? null,
        naturalHeight: poster?.naturalHeight ?? null,
        fileCards: panel.querySelectorAll("li.resources-file").length,
      };
    }, opts.site);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(1200);

    // 6. Форма в состоянии «Групповой маяк».
    await page.evaluate((sel) => {
      document.querySelector(sel)?.scrollIntoView({ block: "center" });
    }, S.form);
    await page.waitForTimeout(600);
    await page.click(S.typeGroup);
    await page.waitForTimeout(600);
    result.formGroup = await page.evaluate((site) => {
      const org =
        site === "prod"
          ? document.querySelector('input[name="orgName"]')
          : document.querySelector("#ORG_NAME");
      const first =
        site === "prod"
          ? document.querySelector('input[name="firstName"]')
          : document.querySelector("#FIRSTNAME");
      const wrap = org?.closest(site === "prod" ? ".lf-field" : "div");
      const label = org?.id
        ? document.querySelector(`label[for="${CSS.escape(org.id)}"]`)
        : null;
      const controls = Array.from(
        document.querySelectorAll(
          site === "prod"
            ? '#light-form input:not([type="hidden"]), #light-form select'
            : '#ov-light-form-container input:not([type="hidden"]), #ov-light-form-container select',
        ),
      ).filter(
        (node) => node.getClientRects().length > 0 && node.getAttribute("aria-hidden") !== "true",
      );
      return {
        orgVisible: !!org && org.getClientRects().length > 0,
        orgName: org?.getAttribute("name") ?? org?.id ?? null,
        orgBeforeFirstName:
          !!org && !!first && (org.compareDocumentPosition(first) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0,
        orgSpan: wrap ? String(wrap.className).includes("lf-span") : null,
        labelText: (label?.textContent ?? "").trim(),
        requiredMark: !!label?.querySelector('.lf-required[title="Обязательно"]'),
        fields: controls.map((node) => node.getAttribute("name") ?? node.id),
      };
    }, opts.site);

    if (opts.site === "prod") {
      // Отправка с пустыми полями: ошибка рядом с полем организации.
      await page.click(S.submit);
      await page.waitForTimeout(700);
      result.formGroup.emptyError = await page.evaluate(() => {
        const org = document.querySelector('input[name="orgName"]');
        const described = org?.getAttribute("aria-describedby");
        const error = described ? document.getElementById(described.split(" ")[0]) : null;
        return (error?.textContent ?? "").trim();
      });
      await page.click(S.typeIndividual);
      await page.waitForTimeout(600);
      result.formGroup.orgGoneAfterIndividual = await page.evaluate(
        () => document.querySelector('input[name="orgName"]') === null,
      );
    } else {
      result.formGroup.fieldsGroup = result.formGroup.fields;
      await page.click(S.typeIndividual);
      await page.waitForTimeout(600);
      result.formGroup.fieldsIndividual = await page.evaluate(() =>
        Array.from(
          document.querySelectorAll(
            '#ov-light-form-container input:not([type="hidden"]), #ov-light-form-container select',
          ),
        )
          .filter(
            (node) =>
              node.getClientRects().length > 0 && node.getAttribute("aria-hidden") !== "true",
          )
          .map((node) => node.getAttribute("name") ?? node.id),
      );
    }

    // 7. fps сцены карты: три замера rAF по 2 с.
    await page.evaluate((sel) => {
      document.querySelector(sel)?.scrollIntoView({ block: "center" });
    }, opts.site === "prod" ? ".map-shell" : "#ov-map-element");
    await page.waitForTimeout(2500);
    result.fps = await measureFps(page, 3);

    if (opts.site === "prod") {
      // 8. Reduced motion: панель открывается сразу, без фазы is-opening.
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(opts.url, { waitUntil: "load" });
      await page.evaluate(() => document.querySelector("#resources")?.scrollIntoView({ block: "center" }));
      await page.waitForTimeout(700);
      await page.click(S.materials);
      await page.waitForTimeout(20);
      result.reducedMotion = await page.evaluate((sel) => {
        const panels = document.querySelector(sel.panels);
        return {
          firstClass: panels ? String(panels.className) : null,
          layerDuration: panels ? getComputedStyle(panels, "::before").transitionDuration : null,
          panelOpacity: panels
            ? getComputedStyle(document.querySelector(sel.panel)).opacity
            : null,
        };
      }, S);
      await page.emulateMedia({ reducedMotion: null });
    }

    result.probe = {
      playwright: loaded.version,
      channel: process.env.PW_CHANNEL ?? "chrome",
      attempt: opened.attempt,
      takenAt: new Date().toISOString(),
    };
  }
} finally {
  await context.close();
}

const text = JSON.stringify(result, null, 2) + "\n";
if (opts.out) writeFileSync(opts.out, text);
console.log(opts.out ? `# ${opts.site} → ${opts.out}` : text);
process.exit(exitCode);
