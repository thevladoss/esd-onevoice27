/*
 * Снимок приёмки v1.2 (GLOBE, LIGHT, MOB) на любом из двух сайтов.
 *
 * Файл — одно выражение: стрелочная функция с параметром `site`
 * ("prod" | "orig"). Тело уезжает в страницу двумя способами:
 *   - Playwright MCP: содержимое файла подставляется в browser_evaluate как есть,
 *     вызов вида ((site) => {...})("orig");
 *   - Node + playwright: драйвер v12-run.mjs читает файл и зовёт
 *     page.evaluate(`(${src})("prod")`).
 *
 * Столбец таблицы селекторов выбирает параметр: у прода узлы фаз 14–16
 * (video[data-anim="globe"], canvas[data-anim="stars"], canvas.map-lights-canvas),
 * у оригинала первое видео страницы, первый canvas в hero и #ov-map-element;
 * огоньки оригинала рисует Mapbox WebGL, поэтому блок lights у него null.
 *
 * Частоту кадров canvas снимок считает подменой ctx.clearRect на самом объекте
 * контекста: drawScene зовёт clearRect один раз за кадр. После замера свойство
 * удаляется и метод возвращается из прототипа.
 *
 * Состояние страницы снимок не трогает: ни кликов по форме, ни открытия панелей.
 * Прокрутка есть только одна — к карте и обратно наверх, иначе цикл огоньков
 * стоит по IntersectionObserver и кадры не считаются.
 */
async (site) => {
  const isOrig = site === "orig";

  /** Пауза: прирост currentTime меряется за 1500 мс, кадры canvas — за 2000 мс. */
  const wait = (ms) => new Promise((done) => setTimeout(done, ms));

  const PROD = {
    hero: "section#hero",
    video: 'video[data-anim="globe"]',
    particles: 'canvas[data-anim="stars"]',
    lights: ".esd-map > canvas.map-lights-canvas",
    mapShell: ".map-shell",
    form: "#light-form",
    about: "#about",
    quote: "#quote",
    anchor: "#quote",
    footerLinks: ".site-footer__links a",
    consentLabel: "#light-form label.lf-check",
    checkbox: "input.lf-checkbox",
    brand: "a.site-header__brand",
    tagline: ".site-header .wordmark__tagline",
    newsImage: ".news-card__image",
  };

  const ORIG = {
    hero: null,
    video: "video",
    particles: "canvas",
    lights: null,
    mapShell: "#ov-map-element",
    form: "#ov-light-form-container",
    about: "#ov-about",
    quote: "#ov-main-footer-content",
    anchor: "#ov-main-header",
    footerLinks: null,
    consentLabel: null,
    checkbox: null,
    brand: null,
    tagline: null,
    newsImage: null,
  };

  const S = isOrig ? ORIG : PROD;

  const q = (selector, root) => (selector ? (root ?? document).querySelector(selector) : null);
  const qa = (selector, root) =>
    selector ? Array.from((root ?? document).querySelectorAll(selector)) : [];

  /** Выбранные свойства getComputedStyle. */
  const cs = (el, props) => {
    if (!el) return null;
    const style = getComputedStyle(el);
    const out = {};
    for (const prop of props) out[prop] = style[prop];
    return out;
  };

  const r2 = (value) => Number(value.toFixed(2));

  const rect = (el) => {
    if (!el) return null;
    const box = el.getBoundingClientRect();
    return { x: r2(box.left), y: r2(box.top), width: r2(box.width), height: r2(box.height) };
  };

  const box2 = (el) => {
    const r = rect(el);
    return r ? { w: r.width, h: r.height } : null;
  };

  /**
   * Кадров в секунду у canvas: счётчик вызовов clearRect за `ms`.
   * Второй getContext("2d") отдаёт тот же объект, что взял компонент, поэтому
   * подмена ловит реальные кадры. У WebGL-полотна 2d-контекста нет: тогда
   * возвращается тип контекста и null вместо частоты.
   */
  const countDraws = async (canvas, ms) => {
    if (!canvas) return { drawsPerSecond: null, contextType: null };
    let ctx = null;
    try {
      ctx = canvas.getContext("2d");
    } catch {
      ctx = null;
    }
    if (!ctx) {
      let kind = null;
      for (const name of ["webgl2", "webgl", "bitmaprenderer"]) {
        try {
          if (canvas.getContext(name)) {
            kind = name;
            break;
          }
        } catch {
          // Следующий кандидат.
        }
      }
      return { drawsPerSecond: null, contextType: kind };
    }
    let count = 0;
    const inherited = ctx.clearRect;
    ctx.clearRect = function counted(...args) {
      count += 1;
      return inherited.apply(this, args);
    };
    await wait(ms);
    delete ctx.clearRect;
    return { drawsPerSecond: Number((count / (ms / 1000)).toFixed(1)), contextType: "2d" };
  };

  const dpr = window.devicePixelRatio || 1;
  const expectedBitmap = (r, cap) => {
    if (!r) return null;
    const ratio = Math.min(dpr, cap);
    return {
      width: Math.round(Math.round(r.width) * ratio),
      height: Math.round(Math.round(r.height) * ratio),
    };
  };

  // ── GLOBE: видео ───────────────────────────────────────────────────────────
  const video = q(S.video);
  const heroNode = isOrig
    ? (video?.closest("section") ?? video?.parentElement?.parentElement ?? null)
    : q(S.hero);
  const heroRect = rect(heroNode);

  let globe = { found: false };
  if (video) {
    const before = video.currentTime;
    const style = cs(video, [
      "objectFit",
      "objectPosition",
      "mixBlendMode",
      "filter",
      "transformOrigin",
      "maskImage",
      "webkitMaskImage",
      "width",
      "height",
    ]);
    // Маска задана дважды (`mask-image` и `-webkit-mask-image`), Chrome отдаёт обе
    // строки: слои считаются по одной, иначе их число удваивается.
    const maskText = [style.maskImage, style.webkitMaskImage].find(
      (value) => value && value !== "none",
    ) ?? "none";
    const videoRect = rect(video);
    await wait(1500);
    const after = video.currentTime;
    const delta = r2(after - before);
    globe = {
      found: true,
      paused: video.paused,
      ended: video.ended,
      muted: video.muted,
      autoplay: video.autoplay,
      loop: video.loop,
      playsInline: video.playsInline,
      preload: video.preload,
      readyState: video.readyState,
      videoWidth: video.videoWidth,
      videoHeight: video.videoHeight,
      duration: video.duration ? r2(video.duration) : null,
      currentSrc: video.currentSrc ? video.currentSrc.split("/").pop() : null,
      currentTime0: r2(before),
      currentTime1: r2(after),
      delta,
      playing: !video.paused && !video.ended && delta >= 1,
      rect: videoRect,
      heroRect,
      rightGap: videoRect ? r2(window.innerWidth - (videoRect.x + videoRect.width)) : null,
      topInHero: videoRect && heroRect ? r2(videoRect.y - heroRect.y) : null,
      aspect: videoRect && videoRect.height ? Number((videoRect.width / videoRect.height).toFixed(4)) : null,
      objectFit: style.objectFit,
      objectPosition: style.objectPosition,
      mixBlendMode: style.mixBlendMode,
      filter: style.filter,
      transformOrigin: style.transformOrigin,
      hasMask: /linear-gradient/.test(maskText),
      maskLayers: (maskText.match(/linear-gradient/g) ?? []).length,
      sourceCount: video.querySelectorAll("source").length,
      attributes: {
        disablepictureinpicture: video.getAttribute("disablepictureinpicture"),
        disableremoteplayback: video.getAttribute("disableremoteplayback"),
        tabindex: video.getAttribute("tabindex"),
        ariaHidden: video.getAttribute("aria-hidden"),
        dataAnim: video.getAttribute("data-anim"),
      },
    };
  }

  // ── GLOBE: canvas частиц ───────────────────────────────────────────────────
  // У оригинала полотно частиц лежит не внутри секции видео, а рядом с ней:
  // если в hero canvas нет, берётся первое широкое полотно, перекрывающее полосу hero.
  const particlesNode = isOrig
    ? (q(S.particles, heroNode ?? document) ??
        qa("canvas").find((node) => {
          const b = node.getBoundingClientRect();
          return heroRect
            ? b.width > 100 && b.top < heroRect.y + heroRect.height && b.bottom > heroRect.y
            : false;
        }) ??
        null)
    : q(S.particles);
  const particlesRect = rect(particlesNode);
  const particlesStyle = cs(particlesNode, ["opacity", "mixBlendMode", "position", "zIndex", "inset"]);
  const particlesDraws = await countDraws(particlesNode, 2000);
  const particles = {
    found: Boolean(particlesNode),
    rect: particlesRect,
    bitmap: particlesNode ? { width: particlesNode.width, height: particlesNode.height } : null,
    expectedBitmap: expectedBitmap(particlesRect, 1.75),
    opacity: particlesStyle?.opacity ?? null,
    mixBlendMode: particlesStyle?.mixBlendMode ?? null,
    position: particlesStyle?.position ?? null,
    zIndex: particlesStyle?.zIndex ?? null,
    inset: particlesStyle?.inset ?? null,
    dataAnim: particlesNode?.getAttribute("data-anim") ?? null,
    drawsPerSecond: particlesDraws.drawsPerSecond,
    contextType: particlesDraws.contextType,
  };

  // ── LIGHT: canvas огоньков (у оригинала точки рисует Mapbox) ───────────────
  let lights = null;
  if (!isOrig) {
    const node = q(S.lights);
    const shell = q(S.mapShell);
    shell?.scrollIntoView({ block: "center" });
    await wait(1200);
    const nodeRect = rect(node);
    const draws = await countDraws(node, 2000);
    const style = cs(node, ["position", "pointerEvents", "inset", "zIndex"]);
    lights = {
      found: Boolean(node),
      dataset: {
        lightCount: node?.getAttribute("data-light-count") ?? null,
        people: node?.getAttribute("data-people") ?? null,
        groups: node?.getAttribute("data-groups") ?? null,
        fresh: node?.getAttribute("data-new") ?? null,
      },
      anim: node?.getAttribute("data-anim") ?? null,
      ariaHidden: node?.getAttribute("aria-hidden") ?? null,
      position: style?.position ?? null,
      pointerEvents: style?.pointerEvents ?? null,
      inset: style?.inset ?? null,
      rect: nodeRect,
      bitmap: node ? { width: node.width, height: node.height } : null,
      expectedBitmap: expectedBitmap(nodeRect, 2),
      previousIsSvg: node?.previousElementSibling?.tagName?.toLowerCase() === "svg",
      mapCircles: qa(".esd-map svg circle").length,
      legacyNodes: qa(".map-lights, .light-bucket, .light-core, .light-ring, .esd-map svg defs").length,
      countries: qa(".esd-map svg path").length,
      drawsPerSecond: draws.drawsPerSecond,
      contextType: draws.contextType,
    };
    window.scrollTo(0, 0);
    await wait(600);
  }

  // ── SVG и реестр data-anim ────────────────────────────────────────────────
  const svg = {
    nodes: document.querySelectorAll("svg, svg *").length,
    roots: document.querySelectorAll("svg").length,
  };

  const anim = {};
  for (const node of qa("[data-anim]")) {
    const key = node.getAttribute("data-anim");
    anim[key] = (anim[key] ?? 0) + 1;
  }

  // ── MOB: цели касания ─────────────────────────────────────────────────────
  const targets = qa(
    'a[href], button, input:not([type="hidden"]), select, textarea, label:has(input)',
  );
  const small = [];
  const hidden = [];
  const viaLabel = [];
  let checked = 0;
  for (const node of targets) {
    if (node.getClientRects().length === 0) continue;
    if (getComputedStyle(node).visibility === "hidden") continue;
    if (node.closest('[aria-hidden="true"]')) continue;
    checked += 1;
    const b = node.getBoundingClientRect();
    const w = r2(b.width);
    const h = r2(b.height);
    const info = {
      tag: node.tagName.toLowerCase(),
      id: node.id || null,
      className: typeof node.className === "string" ? node.className || null : null,
      text: (node.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 40),
      w,
      h,
    };
    if (w <= 1 && h <= 1) {
      hidden.push(info);
      continue;
    }
    if (Math.min(w, h) >= 44) continue;
    if (node.tagName === "INPUT" && node.getAttribute("type") === "checkbox") {
      const label = node.closest("label");
      const labelH = label ? r2(label.getBoundingClientRect().height) : 0;
      if (labelH >= 44) {
        viaLabel.push({ ...info, labelH });
        continue;
      }
    }
    small.push(info);
  }

  const news = qa(S.newsImage)
    .slice(0, 3)
    .map((img) => ({
      width: img.getAttribute("width"),
      height: img.getAttribute("height"),
      loading: img.getAttribute("loading"),
      fetchpriority: img.getAttribute("fetchpriority"),
      decoding: img.getAttribute("decoding"),
      src: (img.getAttribute("src") ?? "").split("/").pop(),
    }));

  const touch = {
    checked,
    small,
    hidden,
    viaLabel,
    footerLinks: qa(S.footerLinks).map((node) => box2(node)),
    consentLabel: box2(q(S.consentLabel)),
    checkbox: box2(q(S.checkbox)),
    brand: box2(q(S.brand)),
    taglineFontSize: cs(q(S.tagline), ["fontSize"])?.fontSize ?? null,
    news,
  };

  return {
    meta: {
      site,
      href: location.href,
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      devicePixelRatio: dpr,
      scrollWidth: document.documentElement.scrollWidth,
      documentHeight: document.documentElement.scrollHeight,
      userAgent: navigator.userAgent,
      nodes: document.querySelectorAll("*").length,
      anchorFound: Boolean(q(S.anchor)),
      takenAt: new Date().toISOString(),
    },
    globe,
    particles,
    lights,
    svg,
    anim,
    touch,
  };
};
