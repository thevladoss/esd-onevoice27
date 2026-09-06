import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { act, fireEvent, render } from "@testing-library/react";

import App from "./App";
import {
  BREATH_PERIOD_MS,
  HALO_ALPHA_MAX,
  HALO_ALPHA_MIN,
  HALO_RADIUS_MAX,
  HALO_RADIUS_MIN,
  LIGHT_BUCKETS,
} from "./components/map/lightsCanvas";
import { LightsProvider } from "./state/lights";

/* Стыки шести фаз проверяются на рендере всего приложения: по отдельности каждая
   фаза зелёная, а ломаются именно их границы — прозрачность формы внутри ленты
   карты, утилита стекла на карточке ресурсов, вариант заголовка, превью в панели. */
function renderApp() {
  return render(
    <LightsProvider>
      <App />
    </LightsProvider>,
  );
}

/* Карта строит проекцию только по измеренному контейнеру, а jsdom отдаёт нули: без
   подменённого прямоугольника SVG не рендерится. Подмена узкая — её видят только div
   с классом esd-map — и снимается в finally, как в тесте карты блока v1.1. */
function renderMeasuredApp() {
  const realRect = HTMLDivElement.prototype.getBoundingClientRect;
  HTMLDivElement.prototype.getBoundingClientRect = function measured(this: HTMLDivElement) {
    if (!this.classList.contains("esd-map")) return realRect.call(this);
    return new DOMRect(0, 0, 1200, 700);
  };

  try {
    return renderApp();
  } finally {
    HTMLDivElement.prototype.getBoundingClientRect = realRect;
  }
}

/* vitest настроен с css: false, вычисленных стилей в jsdom нет: значения свойств
   читаются из текста файла тем же приёмом, что в About.test.tsx и MapBand.test.tsx. */
const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

const LIGHT_FORM_CSS = read("src/components/form/light-form.css");
const MAP_CSS = read("src/components/map/map.css");
const GLOBAL_CSS = read("src/styles/global.css");
const PRIMITIVES_CSS = read("src/components/layout/primitives.css");
const VIDEO_EMBED_CSS = read("src/components/about/video-embed.css");
const HERO_CSS = read("src/components/hero/hero.css");
const FOOTER_CSS = read("src/components/layout/Footer.css");

/** Схлопывает пробельные последовательности в один пробел. */
const flat = (css: string) => css.replace(/\s+/g, " ");

/** Тело первого правила, чей заголовок с открывающей скобкой равен head. */
function block(css: string, head: string): string {
  const source = flat(css);
  const start = source.indexOf(head);
  if (start === -1) {
    throw new Error(`Правило ${head} в CSS не найдено`);
  }
  const end = source.indexOf("}", start + head.length);
  if (end === -1) {
    throw new Error(`У правила ${head} нет закрывающей скобки`);
  }
  return source.slice(start + head.length, end);
}

const LOCK = "resources-panel-locked";

afterEach(() => {
  vi.useRealTimers();
  document.documentElement.classList.remove(LOCK);
  document.body.classList.remove(LOCK);
});

describe("стыки фаз v1.1", () => {
  it("форма стоит внутри ленты карты на прозрачном фоне (8 + 9)", () => {
    renderApp();

    const band = document.querySelector("main > .map-band");
    expect(band).not.toBeNull();
    expect((band as HTMLElement).children).toHaveLength(2);

    const [map, form] = Array.from((band as HTMLElement).children);
    expect(map.tagName).toBe("SECTION");
    expect(map.id).toBe("map");
    expect(map).toHaveClass("map-section");
    expect(form.tagName).toBe("SECTION");
    expect(form.id).toBe("light-form");
    expect(form).toHaveClass("lf-section");

    // Стеклянная карточка формы снята фазой 9: подложку под формой держит лента.
    expect(document.querySelector("#light-form .glass-card")).toBeNull();

    expect(LIGHT_FORM_CSS).not.toContain(".lf-section::before");
    expect(block(LIGHT_FORM_CSS, ".lf-section {")).not.toContain("background");
    // Правила фазы 8 остались как страховка каскада, после фазы 9 они no-op.
    expect(flat(MAP_CSS)).toContain(".map-band .lf-section {");
  });

  it("карточки ресурсов носят утилиту стекла ресурсов (7 + 11)", () => {
    renderApp();

    const cards = document.querySelectorAll("#resources .resource-card");
    expect(cards).toHaveLength(3);
    for (const card of Array.from(cards)) {
      expect(card).toHaveClass("glass");
      expect(card).toHaveClass("glass-resource");
    }

    const utility = block(GLOBAL_CSS, "@utility glass-resource {");
    expect(utility).toContain("blur(14px) saturate(125%)");
    expect(utility).toContain("rgb(255 255 255 / .075)");
  });

  it("заголовок формы плоский, заголовок About градиентный (7 + 9)", () => {
    renderApp();

    for (const id of ["form-title", "map-title", "involve-title"]) {
      const title = document.getElementById(id);
      expect(title, `на странице нет #${id}`).not.toBeNull();
      expect(title).toHaveClass("gradient-title--section");
      expect(title).not.toHaveClass("gradient-title--section-gradient");
    }

    expect(document.getElementById("about-title")).toHaveClass("gradient-title--section-gradient");

    expect(block(PRIMITIVES_CSS, ".gradient-title--section {")).not.toContain("background-image");
    expect(block(PRIMITIVES_CSS, ".gradient-title--section-gradient {")).toContain("104deg");
  });

  it("панель «Видео» показывает превью 16:9 (10 + 11)", () => {
    // Список явный, как в ResourcePanel.test.tsx: планировщик React ходит через
    // MessageChannel, а фаза открытия шторки держится один кадр rAF.
    vi.useFakeTimers({
      toFake: ["setTimeout", "clearTimeout", "requestAnimationFrame", "cancelAnimationFrame"],
    });

    renderApp();

    const trigger = document.querySelector<HTMLButtonElement>(
      '#resources button[data-kind="video"]',
    );
    expect(trigger).not.toBeNull();

    fireEvent.click(trigger as HTMLButtonElement);
    act(() => {
      vi.advanceTimersByTime(20);
    });

    const panel = document.body.querySelector(
      '.resources-panels #resources-panel[data-kind="video"]',
    );
    expect(panel).not.toBeNull();
    expect((panel as HTMLElement).querySelectorAll(".ve")).toHaveLength(16);
    expect((panel as HTMLElement).querySelectorAll(".ve-poster")).toHaveLength(16);
    expect(document.getElementById("resources")).toHaveClass("is-video-active");

    expect(block(VIDEO_EMBED_CSS, ".ve {")).toContain("aspect-ratio: 16 / 9");
    const poster = block(VIDEO_EMBED_CSS, ".ve-poster {");
    expect(poster).toContain("object-fit: cover");
    expect(poster).toContain("object-position: center");
  });

  it("скос карты и canvas огоньков на месте (8 + 15)", () => {
    // Карта строит проекцию по измеренному контейнеру, а jsdom отдаёт нули: без
    // подменённого прямоугольника SVG вообще не рендерится и стык проверять не на чем.
    // Подмена узкая — только у div, canvas глобуса и прокрутка секций её не видят.
    const realRect = HTMLDivElement.prototype.getBoundingClientRect;
    HTMLDivElement.prototype.getBoundingClientRect = function measured(this: HTMLDivElement) {
      if (!this.classList.contains("esd-map")) return realRect.call(this);
      return new DOMRect(0, 0, 1200, 700);
    };

    try {
      renderApp();
    } finally {
      HTMLDivElement.prototype.getBoundingClientRect = realRect;
    }

    const canvas = document.querySelector(".esd-map > canvas.map-lights-canvas");
    expect(canvas).not.toBeNull();
    expect(canvas).toHaveAttribute("data-anim", "pulse");
    expect(canvas).toHaveAttribute("aria-hidden", "true");
    expect(canvas).toHaveAttribute("data-light-count", "942");
    expect(canvas).toHaveAttribute("data-people", "694");
    expect(canvas).toHaveAttribute("data-groups", "248");
    expect(canvas).toHaveAttribute("data-new", "0");
    // Огоньков в SVG не осталось: ни корзин, ни ядер, ни колец, ни градиентов.
    expect(
      document.querySelectorAll(
        ".map-lights, .light-bucket, .light-core, .light-ring, .esd-map defs, .esd-map circle",
      ),
    ).toHaveLength(0);

    expect(block(MAP_CSS, ".map-shell {")).toContain("100% calc(100% - var(--map-wedge))");
    expect(block(MAP_CSS, ".map-band::before {")).toContain("rgb(18 12 52)");
    expect(block(MAP_CSS, ".map-lights-canvas {")).toContain("pointer-events: none");
    expect(MAP_CSS).not.toContain("light-pulse");
    expect(MAP_CSS).not.toContain("light-breathe");
    expect(MAP_CSS).not.toContain("@property --halo-k");
    expect(MAP_CSS).not.toContain("light-arrive");

    // Дыхание живёт в модуле холста, текст CSS его больше не описывает.
    expect(BREATH_PERIOD_MS).toBe(2600);
    expect(LIGHT_BUCKETS).toBe(5);
    expect([HALO_RADIUS_MIN, HALO_RADIUS_MAX]).toEqual([7, 12]);
    expect([HALO_ALPHA_MIN, HALO_ALPHA_MAX]).toEqual([0.3, 0.6]);
  });
});

describe("стыки фаз v1.2", () => {
  it("hero складывает видео оригинала и canvas частиц (14)", () => {
    renderApp();

    const hero = document.querySelector("section#hero");
    expect(hero).not.toBeNull();
    const children = Array.from((hero as HTMLElement).children);

    // Порядок слоёв задаёт z-index: видео под частицами, текст над обоими.
    expect(children[0]).toHaveClass("hero__video");
    const particles = (hero as HTMLElement).querySelector(
      'canvas.hero__particles[data-anim="stars"][aria-hidden="true"]',
    );
    expect(particles).not.toBeNull();
    expect(children[1]).toBe(particles);
    expect(children[2]).toHaveClass("hero__content");

    const video = children[0].querySelector<HTMLVideoElement>('video[data-anim="globe"]');
    expect(video).not.toBeNull();
    for (const attribute of ["autoplay", "loop", "playsinline"]) {
      expect(video).toHaveAttribute(attribute);
    }
    expect(video).toHaveAttribute("preload", "auto");
    expect(video).toHaveAttribute("aria-hidden", "true");
    expect(video).toHaveAttribute("tabindex", "-1");

    const sources = (video as HTMLVideoElement).querySelectorAll("source");
    expect(sources).toHaveLength(2);
    // webm первым: он вдвое легче mp4.
    expect(sources[0]).toHaveAttribute("type", "video/webm");
    expect(sources[0].getAttribute("src")).toMatch(/hero-globe\.webm$/);
    expect(sources[1]).toHaveAttribute("type", "video/mp4");
    expect(sources[1].getAttribute("src")).toMatch(/hero-globe\.mp4$/);

    const particlesCss = block(HERO_CSS, ".hero__particles {");
    expect(particlesCss).toContain("mix-blend-mode: screen");
    expect(particlesCss).toContain("opacity: .72");
    expect(block(HERO_CSS, ".hero__video {")).toContain("z-index: 0");
  });

  it("карта рисует огоньки на canvas, а SVG держит только страны (15 + 8)", () => {
    renderMeasuredApp();

    const canvas = document.querySelector(".esd-map > canvas.map-lights-canvas");
    expect(canvas).not.toBeNull();
    expect(canvas).toHaveAttribute("data-anim", "pulse");
    expect(canvas).toHaveAttribute("aria-hidden", "true");
    expect(canvas).toHaveAttribute("data-light-count", "942");
    expect(canvas).toHaveAttribute("data-people", "694");
    expect(canvas).toHaveAttribute("data-groups", "248");
    expect(canvas).toHaveAttribute("data-new", "0");
    // Холст лежит сразу за картой стран, поэтому огоньки рисуются поверх неё.
    expect(canvas?.previousElementSibling?.tagName.toLowerCase()).toBe("svg");

    expect(
      document.querySelectorAll(
        ".esd-map svg circle, .esd-map svg defs, .map-lights, .light-bucket, .light-core, .light-ring",
      ),
    ).toHaveLength(0);
    expect(document.querySelectorAll(".esd-map svg path").length).toBeGreaterThanOrEqual(177);

    // Структурная половина LIGHT-07: без 942 огоньков в SVG дерево остаётся мелким.
    expect(document.querySelectorAll("svg, svg *").length).toBeLessThan(1300);
  });

  it("форма и футер держат цели касания 44px (16 + 9)", () => {
    renderApp();

    const consent = document.querySelector("#light-form label.lf-check");
    expect(consent).not.toBeNull();
    expect(consent?.querySelector('input.lf-checkbox[type="checkbox"]')).not.toBeNull();
    expect(consent?.querySelector("span.lf-check-text")).not.toBeNull();

    expect(block(LIGHT_FORM_CSS, ".lf-check {")).toContain("min-height: 44px");
    const checkbox = block(LIGHT_FORM_CSS, ".lf-checkbox {");
    expect(checkbox).toContain("width: 20px");
    expect(checkbox).toContain("margin: 0");

    expect(document.querySelectorAll(".site-footer__links a")).toHaveLength(2);
    const link = block(FOOTER_CSS, ".site-footer__links a {");
    expect(link).toContain("min-height: 44px");
    expect(link).toContain("inline-flex");
    // Высоту строки списка задаёт сама ссылка, поэтому зазор между пунктами нулевой.
    expect(block(FOOTER_CSS, ".site-footer__links ul {")).toContain("gap: 0");
  });

  it("реестр data-anim в DOM после слияния (14 + 15)", () => {
    renderMeasuredApp();

    const used = new Set(
      Array.from(document.querySelectorAll("[data-anim]")).map((node) =>
        node.getAttribute("data-anim"),
      ),
    );
    // new-light из реестра в DOM не приходит: кольцо нового огонька рисует canvas.
    expect([...used].sort()).toEqual([
      "atmosphere",
      "beam",
      "globe",
      "halo",
      "particles",
      "pulse",
      "stars",
      "wave",
    ]);

    for (const [value, tag] of [
      ["stars", "CANVAS"],
      ["globe", "VIDEO"],
      ["pulse", "CANVAS"],
    ] as const) {
      const nodes = document.querySelectorAll(`[data-anim="${value}"]`);
      expect(nodes, `узлов с data-anim="${value}"`).toHaveLength(1);
      expect(nodes[0].tagName).toBe(tag);
    }
  });
});
