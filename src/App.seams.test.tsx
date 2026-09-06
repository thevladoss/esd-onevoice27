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

/* vitest настроен с css: false, вычисленных стилей в jsdom нет: значения свойств
   читаются из текста файла тем же приёмом, что в About.test.tsx и MapBand.test.tsx. */
const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

const LIGHT_FORM_CSS = read("src/components/form/light-form.css");
const MAP_CSS = read("src/components/map/map.css");
const GLOBAL_CSS = read("src/styles/global.css");
const PRIMITIVES_CSS = read("src/components/layout/primitives.css");
const VIDEO_EMBED_CSS = read("src/components/about/video-embed.css");

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
