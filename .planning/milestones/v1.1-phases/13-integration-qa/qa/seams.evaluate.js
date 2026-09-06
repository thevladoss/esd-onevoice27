/*
 * Снимок стыков фаз 7–12 в живом браузере.
 *
 * Файл — одно выражение: стрелочная функция без аргументов. Её тело уезжает
 * в страницу двумя способами:
 *   - Playwright MCP: содержимое файла подставляется в browser_evaluate как есть;
 *   - Node + playwright: драйвер читает файл и зовёт page.evaluate(`(${src})()`).
 *
 * Функция вызывается трижды за заход: до открытия панелей (band, заголовки,
 * стекло, корзины), после клика по карточке «Видео» (videoPanel) и после
 * перехода на #resources-materials (deepLink). Ключи, которых в этом заходе нет,
 * приходят null — драйвер сливает три ответа в один JSON.
 */
() => {
  const css = (node, pseudo) => (node ? getComputedStyle(node, pseudo) : null);
  const pick = (node, pseudo, props) => {
    const style = css(node, pseudo);
    if (!style) return null;
    const out = {};
    for (const prop of props) out[prop] = style[prop];
    return out;
  };

  const bandNode = document.querySelector("main > .map-band");
  const lightForm = document.querySelector("#light-form");
  const shell = document.querySelector(".map-shell");
  const card = document.querySelector(".resource-card");

  const band = {
    present: !!bandNode,
    childIds: bandNode ? Array.from(bandNode.children).map((child) => child.id) : [],
    formBackgroundColor: css(lightForm)?.backgroundColor ?? null,
    formBeforeContent: css(lightForm, "::before")?.content ?? null,
  };

  const bandBefore = pick(bandNode, "::before", ["backgroundColor", "clipPath"]);
  const shellClip = css(shell)?.clipPath ?? null;

  const resourceCard = pick(card, null, [
    "backdropFilter",
    "backgroundImage",
    "borderTopColor",
    "borderRadius",
  ]);

  const titles = {};
  for (const id of ["about-title", "form-title", "map-title", "involve-title"]) {
    titles[id] = pick(document.getElementById(id), null, [
      "backgroundImage",
      "color",
      "webkitTextFillColor",
    ]);
  }

  const bucketNodes = Array.from(document.querySelectorAll(".light-bucket"));
  const firstBucket = css(bucketNodes[0]);
  const buckets = {
    count: bucketNodes.length,
    order: bucketNodes.map((node) => node.getAttribute("data-bucket")),
    animationName: firstBucket?.animationName ?? null,
    animationDuration: firstBucket?.animationDuration ?? null,
  };

  // Имена keyframes читаются из таблиц стилей: чужие (шрифты Google) кидают
  // SecurityError на cssRules, поэтому каждая обёрнута отдельно.
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

  const pulse = {
    count: document.querySelectorAll(".light.pulse").length,
    keyframes,
    hasBreathe: keyframes.includes("light-breathe"),
    hasPulse: keyframes.includes("light-pulse"),
  };

  const panels = document.querySelector(".resources-panels");
  const panel = document.querySelector("#resources-panel");
  const kind = panel?.getAttribute("data-kind") ?? null;

  let videoPanel = null;
  if (panels && kind === "video") {
    const embeds = panel.querySelectorAll(".ve");
    const firstEmbed = embeds[0];
    const rect = firstEmbed?.getBoundingClientRect() ?? null;
    const poster = panel.querySelector(".ve-poster");
    const posterStyle = css(poster);
    videoPanel = {
      zIndex: css(panels)?.zIndex ?? null,
      position: css(panels)?.position ?? null,
      veCount: embeds.length,
      ratio: rect && rect.height ? Number((rect.width / rect.height).toFixed(4)) : null,
      objectFit: posterStyle?.objectFit ?? null,
      objectPosition: posterStyle?.objectPosition ?? null,
    };
  }

  let deepLink = null;
  if (panels && kind === "materials") {
    const esdGroup = document.querySelector("#resources-group-esd");
    deepLink = {
      kind,
      ariaExpanded:
        document.querySelector('button[data-kind="materials"]')?.getAttribute("aria-expanded") ??
        null,
      groups: panel.querySelectorAll("details.resources-group").length,
      esdOpen: esdGroup instanceof HTMLDetailsElement ? esdGroup.open : null,
    };
  }

  return {
    href: location.href,
    viewport: { width: innerWidth, height: innerHeight },
    band,
    bandBefore,
    shellClip,
    resourceCard,
    titles,
    buckets,
    pulse,
    videoPanel,
    deepLink,
  };
}
