/*
 * Снимок шести пунктов приёмки v1.1 (GLASS, MAP, FORM, MEDIA, RES, FOOT)
 * на любом из двух сайтов.
 *
 * Файл — одно выражение: стрелочная функция с параметром `site`
 * ("prod" | "orig"). Тело уезжает в страницу двумя способами:
 *   - Playwright MCP: содержимое файла подставляется в browser_evaluate как есть,
 *     вызов вида ((site) => {...})("orig");
 *   - Node + playwright: драйвер v11-run.mjs читает файл и зовёт
 *     page.evaluate(`(${src})("prod")`).
 *
 * Столбец таблицы селекторов выбирает параметр: у оригинала свои id
 * (#ov-about, #ov-resources-card-music, #ov-news-feed, #ov-main-footer-content),
 * у прода классы фаз 7–12 (.ab-step, .resources-cell--video, .site-footer__inner).
 *
 * Функция кликает только по карточкам типа формы (individual и group), чтобы
 * снять оба списка полей. Панели ресурсов открывает отдельный сценарий
 * v11-interactive.js.
 */
async (site) => {
  const isOrig = site === "orig";

  /** Пауза: переходы карточек типа формы длятся 420 мс. */
  const wait = (ms) => new Promise((done) => setTimeout(done, ms));

  const PROD = {
    aboutCard: "#about .ab-step",
    resourceCard: "#resources .resource-card",
    triptychFrame: "#involve .inv-triptych",
    triptychItem: "#involve .inv-card",
    aboutTitle: "#about-title",
    flatTitles: {
      map: "#map-title",
      form: "#form-title",
      involve: "#involve-title",
      news: "#news-title",
      resources: "#resources-title",
    },
    mapShell: ".map-shell",
    mapBand: ".map-band",
    mapCanvas: ".map-container",
    formRoot: "#light-form form",
    typeIndividual: '.lf-type[data-type="individual"]',
    typeGroup: '.lf-type[data-type="group"]',
    firstName: '#light-form input[name="firstName"]',
    submit: '#light-form button[type="submit"]',
    newsCover: ".news-card__cover",
    newsImage: ".news-card__image",
    resCopy: ".resources-copy",
    resMusic: ".resources-cell--music",
    resMaterials: ".resources-cell--materials",
    resVideo: ".resources-cell--video",
    resGrid: ".resources-grid",
    footInner: ".site-footer__inner",
    footLogo: ".wordmark--footer",
    footLegal: ".site-footer__legal",
  };

  const ORIG = {
    aboutCard: "#ov-about .ov-about-step-card",
    resourceCard: "#ov-resources .ov-resources-card",
    triptychFrame: "#ov-involve .ov-involve-triptych",
    triptychItem: "#ov-involve .ov-involve-item",
    aboutTitle: "#ov-about .ov-about-title",
    aboutTitleFallback: "#ov-about h2",
    flatTitles: {
      map: "#ov-map-copy h2",
      form: "#ov-form-map-copy h2",
      involve: "#ov-involve h2",
      news: "#ov-news h2",
      resources: "#ov-resources-copy h2",
    },
    mapShell: "#ov-map-element",
    mapBand: "#ov-map",
    mapCanvas: "#ov-map-element .awe-map",
    formRoot: "#ov-light-form-container form",
    typeIndividual: 'label[for="LIGHT_TYPE-individual"]',
    typeGroup: 'label[for="LIGHT_TYPE-group"]',
    firstName: "#FIRSTNAME",
    submit: '#ov-light-form-container button[type="submit"]',
    newsCover: "#ov-news-feed article > div:first-child",
    newsImage: "img",
    resCopy: "#ov-resources-copy",
    resMusic: "#ov-resources-card-music",
    resMaterials: "#ov-resources-card-materials",
    resVideo: "#ov-resources-card-video",
    resGrid: "#ov-resources-content",
    footInner: "#ov-main-footer-content > footer > div",
    footLogo: "#ov-main-footer-content > footer > div > div:first-child",
    footLegal: "#ov-main-footer-content > footer > div > div:last-child",
  };

  const S = isOrig ? ORIG : PROD;

  const q = (selector, root) => (selector ? (root ?? document).querySelector(selector) : null);
  const qa = (selector, root) =>
    selector ? Array.from((root ?? document).querySelectorAll(selector)) : [];

  /** Выбранные свойства getComputedStyle; для псевдоэлемента третьим аргументом. */
  const cs = (el, props, pseudo) => {
    if (!el) return null;
    const style = getComputedStyle(el, pseudo ?? null);
    const out = {};
    for (const prop of props) out[prop] = style[prop];
    return out;
  };

  const r2 = (value) => Number(value.toFixed(2));

  const rect = (el) => {
    if (!el) return null;
    const box = el.getBoundingClientRect();
    return {
      x: r2(box.left),
      y: r2(box.top),
      width: r2(box.width),
      height: r2(box.height),
    };
  };

  const ratio = (el) => {
    const box = el?.getBoundingClientRect();
    return box && box.height ? Number((box.width / box.height).toFixed(4)) : null;
  };

  /**
   * Видимые контролы формы в порядке DOM. Скрытые input оригинала (комбобокс
   * base-ui держит зеркальный input с aria-hidden) исключаются.
   */
  const visibleControls = (root) => {
    if (!root) return [];
    return qa('input:not([type="hidden"]), select, textarea', root)
      .filter(
        (node) =>
          node.getClientRects().length > 0 && node.getAttribute("aria-hidden") !== "true",
      )
      .map((node) => ({
        name: node.getAttribute("name") ?? null,
        id: node.id || null,
        type: node.getAttribute("type") ?? node.tagName.toLowerCase(),
        required: node.required === true || node.getAttribute("aria-required") === "true",
        role: node.getAttribute("role") ?? null,
      }));
  };

  /** Вершины polygon(): запятые верхнего уровня, скобки calc() не считаются. */
  const countVertices = (clipPath) => {
    const inner = /polygon\(([\s\S]*)\)\s*$/.exec(clipPath ?? "");
    if (!inner) return 0;
    let depth = 0;
    let vertices = 1;
    for (const char of inner[1]) {
      if (char === "(") depth += 1;
      else if (char === ")") depth -= 1;
      else if (char === "," && depth === 0) vertices += 1;
    }
    return vertices;
  };

  const CARD_PROPS = [
    "backgroundImage",
    "backgroundColor",
    "borderTopWidth",
    "borderTopStyle",
    "borderTopColor",
    "borderRadius",
    "boxShadow",
    "backdropFilter",
  ];
  const TITLE_PROPS = [
    "backgroundImage",
    "color",
    "webkitTextFillColor",
    "fontWeight",
    "fontSize",
  ];

  const meta = {
    site,
    href: location.href,
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
    devicePixelRatio: window.devicePixelRatio,
    scrollWidth: document.documentElement.scrollWidth,
    documentHeight: document.documentElement.scrollHeight,
    userAgent: navigator.userAgent,
  };

  // --- GLASS ---------------------------------------------------------------
  const titleNode = (selector) => {
    const node = q(selector);
    return node ? (node.closest("h2") ?? node) : null;
  };

  const titles = { about: cs(q(S.aboutTitle) ?? q(S.aboutTitleFallback), TITLE_PROPS) };
  for (const [key, selector] of Object.entries(S.flatTitles)) {
    titles[key] = cs(titleNode(selector), TITLE_PROPS);
  }

  const glass = {
    aboutCard: cs(q(S.aboutCard), CARD_PROPS),
    aboutCardCount: qa(S.aboutCard).length,
    resourceCard: cs(q(S.resourceCard), CARD_PROPS),
    resourceCardCount: qa(S.resourceCard).length,
    triptychItem: cs(q(S.triptychItem), CARD_PROPS),
    triptychItemCount: qa(S.triptychItem).length,
    triptychFrame: cs(q(S.triptychFrame), CARD_PROPS),
    // Оригинал уносит свечение и тень рамки в ::before с inset -18px и blur;
    // у нас они на самом узле. Снимаем оба места, чтобы строки сравнивались.
    triptychFrameBefore: cs(
      q(S.triptychFrame),
      ["boxShadow", "backgroundImage", "borderRadius", "filter", "inset"],
      "::before",
    ),
    titles,
  };

  // --- MAP -----------------------------------------------------------------
  const shell = q(S.mapShell);
  const shellRect = rect(shell);
  const bandBefore = cs(q(S.mapBand), ["clipPath", "backgroundColor"], "::before");

  const buckets = qa(".light-bucket");
  const bucketStyle = cs(buckets[0], ["animationName", "animationDuration", "opacity"]);

  // Имена keyframes: чужие таблицы стилей (Google Fonts) кидают SecurityError.
  const keyframes = [];
  for (const sheet of Array.from(document.styleSheets)) {
    let rules = null;
    try {
      rules = sheet.cssRules;
    } catch {
      continue;
    }
    for (const rule of Array.from(rules ?? [])) {
      if (rule instanceof CSSKeyframesRule) keyframes.push(rule.name);
    }
  }

  const fractions = [
    [0.5, 0.12],
    [0.08, 0.5],
    [0.92, 0.85],
  ];
  const samplePoints = shellRect
    ? fractions.map(([fx, fy]) => ({
        fx,
        fy,
        x: Math.round(shellRect.x + shellRect.width * fx),
        y: Math.round(shellRect.y + shellRect.height * fy),
      }))
    : [];

  const map = {
    shellClipPath: shell ? getComputedStyle(shell).clipPath : null,
    shellVertices: shell ? countVertices(getComputedStyle(shell).clipPath) : 0,
    shellRect,
    bandBeforeClipPath: bandBefore?.clipPath ?? null,
    bandBeforeBackgroundColor: bandBefore?.backgroundColor ?? null,
    shellBackgroundColor: cs(shell, ["backgroundColor"])?.backgroundColor ?? null,
    canvasBackgroundColor: cs(q(S.mapCanvas), ["backgroundColor"])?.backgroundColor ?? null,
    bucketCount: buckets.length,
    buckets: buckets.map((node) => node.getAttribute("data-bucket")),
    bucketAnimationName: bucketStyle?.animationName ?? null,
    bucketAnimationDuration: bucketStyle?.animationDuration ?? null,
    haloCount: qa(".light-halo").length,
    coreCount: qa(".light-core").length,
    pulseCount: qa(".light.pulse").length,
    keyframes,
    hasBreathe: keyframes.includes("light-breathe"),
    hasPulse: keyframes.includes("light-pulse"),
    samplePoints,
    scrollY: Math.round(window.scrollY),
  };

  // --- FORM ----------------------------------------------------------------
  const formRoot = q(S.formRoot);
  const groupCard = q(S.typeGroup);
  const individualCard = q(S.typeIndividual);

  const TYPE_PROPS = [
    "backgroundColor",
    "borderTopColor",
    "borderTopWidth",
    "borderRadius",
    "minHeight",
    "padding",
    "boxShadow",
  ];

  const scrollBeforeForm = window.scrollY;
  const fields = { initial: visibleControls(formRoot) };
  const typeCardIdle = cs(groupCard, TYPE_PROPS);

  if (individualCard) individualCard.click();
  await wait(500);
  fields.individual = visibleControls(formRoot);
  if (groupCard) groupCard.click();
  // Переход border-color и box-shadow карточки — 420 мс: читаем после него.
  await wait(600);
  fields.group = visibleControls(formRoot);
  const typeCardChecked = cs(groupCard, TYPE_PROPS);

  const firstNameNode = q(S.firstName);
  const labelNode = firstNameNode?.id
    ? q(`label[for="${CSS.escape(firstNameNode.id)}"]`)
    : null;
  const submitNode = q(S.submit);
  const formRect = rect(formRoot);

  const form = {
    fields,
    typeCardIdle,
    typeCardChecked,
    typeCardRect: rect(groupCard),
    field: cs(firstNameNode, [
      "minHeight",
      "height",
      "borderRadius",
      "backgroundColor",
      "borderTopColor",
      "borderTopWidth",
      "padding",
      "fontSize",
      "fontWeight",
      "color",
    ]),
    fieldRect: rect(firstNameNode),
    label: cs(labelNode, ["fontWeight", "fontSize", "color", "textTransform"]),
    labelText: labelNode?.textContent?.trim() ?? null,
    submit: {
      ...(cs(submitNode, ["minHeight", "borderRadius", "fontWeight"]) ?? {}),
      width: rect(submitNode)?.width ?? null,
      text: submitNode?.textContent?.trim() ?? null,
    },
    glassWrapper: formRoot ? qa(".glass-card", formRoot).length : null,
    formWidth: formRect?.width ?? null,
  };

  // Клик по карточке типа фокусирует скрытое радио и подтягивает секцию в кадр:
  // возвращаем прокрутку, чтобы прямоугольники ниже считались от той же точки.
  window.scrollTo(0, scrollBeforeForm);
  await wait(200);

  // --- MEDIA ---------------------------------------------------------------
  const covers = qa(S.newsCover).slice(0, 6);
  const mediaCards = covers.map((cover, index) => {
    const img = q(S.newsImage, cover) ?? (isOrig ? q("img", cover) : null);
    return {
      index,
      ratio: ratio(cover),
      rect: rect(cover),
      objectFit: img ? getComputedStyle(img).objectFit : null,
      objectPosition: img ? getComputedStyle(img).objectPosition : null,
      naturalWidth: img?.naturalWidth ?? null,
      naturalHeight: img?.naturalHeight ?? null,
      currentSrc: img?.currentSrc ?? null,
    };
  });

  const media = {
    cards: mediaCards,
    count: qa(S.newsCover).length,
    coverRects: [0, 3]
      .map((index) => (covers[index] ? { index, rect: rect(covers[index]) } : null))
      .filter(Boolean),
    scrollY: Math.round(window.scrollY),
  };

  // --- RES -----------------------------------------------------------------
  const REFS = {
    music: [320, 296],
    copy: [528, 523],
    materials: [272, 336],
    video: [368, 256],
  };

  const resBlock = (key, selector) => {
    const node = q(selector);
    const box = rect(node);
    const inner = node && !isOrig ? rect(q(".resource-card", node)) : null;
    const [rw, rh] = REFS[key];
    return {
      rect: box,
      cardRect: inner,
      dw: box ? r2((inner ?? box).width - rw) : null,
      dh: box ? r2((inner ?? box).height - rh) : null,
    };
  };

  const gridNode = q(S.resGrid);
  const res = {
    music: resBlock("music", S.resMusic),
    copy: resBlock("copy", S.resCopy),
    materials: resBlock("materials", S.resMaterials),
    video: resBlock("video", S.resVideo),
    ...cs(gridNode, [
      "gridTemplateColumns",
      "columnGap",
      "rowGap",
      "justifyContent",
      "alignItems",
      "display",
    ]),
    gridWidth: rect(gridNode)?.width ?? null,
    copyStyle: cs(q(S.resCopy), [
      "borderTopStyle",
      "borderTopColor",
      "borderTopWidth",
      "backgroundColor",
      "borderRadius",
      "padding",
    ]),
    panelsPresent: !!q(isOrig ? "#ov-resources-panels" : ".resources-panels"),
  };

  // --- FOOT ----------------------------------------------------------------
  const footInner = q(S.footInner);
  const footChildren = footInner
    ? Array.from(footInner.children)
        .filter((node) => node.getClientRects().length > 0)
        .map((node) => {
          const box = node.getBoundingClientRect();
          return {
            name: node.className
              ? String(node.className)
              : node.tagName.toLowerCase(),
            tag: node.tagName.toLowerCase(),
            order: getComputedStyle(node).order,
            rect: rect(node),
            centerDx: r2(Math.abs(box.left + box.width / 2 - window.innerWidth / 2)),
          };
        })
    : [];

  const logoNode = q(S.footLogo);
  const linksList = isOrig ? null : q("ul", q(".site-footer__links"));

  const foot = {
    ...(cs(footInner, [
      "display",
      "flexDirection",
      "alignItems",
      "textAlign",
      "gap",
      "justifyContent",
    ]) ?? {}),
    width: rect(footInner)?.width ?? null,
    children: footChildren,
    logo: {
      ...(rect(logoNode) ?? {}),
      filter: logoNode ? getComputedStyle(logoNode).filter : null,
      beforeFilter: logoNode ? getComputedStyle(logoNode, "::before").filter : null,
    },
    linksDirection: linksList ? getComputedStyle(linksList).flexDirection : null,
    linksCount: linksList ? linksList.querySelectorAll("li").length : null,
    legalBorderTop: cs(q(S.footLegal), ["borderTopWidth"])?.borderTopWidth ?? null,
  };

  return { meta, glass, map, form, media, res, foot };
}
