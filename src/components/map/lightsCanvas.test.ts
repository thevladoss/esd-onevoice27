import { generateLights, type Light } from "../../data/lights";
import {
  BREATH_PERIOD_MS,
  CORE_RADIUS,
  CORE_SPRITE_RADIUS,
  CORE_STROKE_ALPHA,
  CORE_STROKE_WIDTH,
  FRAME_MS,
  HALO_ALPHA_MAX,
  HALO_ALPHA_MIN,
  HALO_RADIUS_MAX,
  HALO_RADIUS_MIN,
  LIGHT_BUCKETS,
  LIGHT_COLORS,
  LIGHT_RGB,
  MAX_DPR,
  MIN_FRAME_GAP_MS,
  REDUCED_HALO_ALPHA,
  REDUCED_HALO_RADIUS,
  RING_ALPHA_FROM,
  RING_EASE,
  RING_MS,
  RING_RADIUS_FROM,
  RING_RADIUS_TO,
  SPRITE_HALO_ALPHA,
  SPRITE_HALO_RADIUS,
  breath,
  bucketOf,
  clampDpr,
  colorWithAlpha,
  cubicBezier,
  drawFrame,
  frameDue,
  haloAlpha,
  haloRadius,
  isOnCanvas,
  makeSprites,
  ringEase,
  ringState,
  shouldAnimate,
  splitBuckets,
  summarize,
  type LightPoint,
  type LightSprites,
  type Ring,
} from "./lightsCanvas";

// Огоньки строятся один раз на файл: rejection sampling в generateLights дорогой.
const lights = generateLights();
// Проекция тестам не нужна: точки раскладываются сеткой 40 в ряд.
const points: LightPoint[] = lights.map((light, index) => ({
  light,
  x: 10 + (index % 40) * 25,
  y: 10 + Math.floor(index / 40) * 25,
}));

describe("lightsCanvas: константы", () => {
  it("держит числа дыхания и ореола из LIGHT-02", () => {
    expect(BREATH_PERIOD_MS).toBe(2600);
    expect(LIGHT_BUCKETS).toBe(5);
    expect(HALO_RADIUS_MIN).toBe(7);
    expect(HALO_RADIUS_MAX).toBe(12);
    expect(HALO_ALPHA_MIN).toBe(0.3);
    expect(HALO_ALPHA_MAX).toBe(0.6);
    expect(SPRITE_HALO_RADIUS).toBe(12);
    expect(SPRITE_HALO_ALPHA).toBe(0.9);
  });

  it("держит размеры ядра с белой обводкой", () => {
    expect(CORE_RADIUS).toBe(2.2);
    expect(CORE_STROKE_WIDTH).toBe(0.9);
    expect(CORE_STROKE_ALPHA).toBe(0.5);
    expect(CORE_SPRITE_RADIUS).toBeCloseTo(3.1, 5);
  });

  it("держит числа планировщика и режима reduce из LIGHT-04", () => {
    expect(FRAME_MS).toBeCloseTo(1000 / 30, 5);
    expect(MIN_FRAME_GAP_MS).toBe(33);
    expect(REDUCED_HALO_RADIUS).toBe(9);
    expect(REDUCED_HALO_ALPHA).toBe(0.22);
    expect(MAX_DPR).toBe(2);
  });

  it("держит числа кольца нового огонька из LIGHT-05", () => {
    expect(RING_MS).toBe(900);
    expect(RING_RADIUS_FROM).toBe(6);
    expect(RING_RADIUS_TO).toBe(20.4);
    expect(RING_ALPHA_FROM).toBe(0.5);
    expect(RING_EASE).toEqual([0.16, 1, 0.3, 1]);
  });

  it("держит цвета огоньков спецификации", () => {
    expect(LIGHT_COLORS.person).toBe("rgb(158 67 154)");
    expect(LIGHT_COLORS.group).toBe("rgb(84 164 172)");
    expect(LIGHT_RGB.person).toEqual([158, 67, 154]);
    expect(LIGHT_RGB.group).toEqual([84, 164, 172]);
  });

  it("собирает rgba через запятую: этот синтаксис понимают все движки canvas", () => {
    expect(colorWithAlpha("person", 0.9)).toBe("rgba(158, 67, 154, 0.9)");
    expect(colorWithAlpha("group", 0)).toBe("rgba(84, 164, 172, 0)");
    expect(colorWithAlpha("group", 1)).toBe("rgba(84, 164, 172, 1)");
  });
});

describe("lightsCanvas: дыхание корзин", () => {
  it("считает контрольные значения формулы LIGHT-02", () => {
    expect(breath(0, 0)).toBeCloseTo(0.5, 5);
    expect(breath(650, 0)).toBeCloseTo(1, 5);
    expect(breath(1300, 0)).toBeCloseTo(0.5, 5);
    expect(breath(1950, 0)).toBeCloseTo(0, 5);
    expect(breath(0, 1)).toBeCloseTo(0.0245, 3);
    expect(breath(520, 1)).toBeCloseTo(0.5, 5);
    expect(breath(2600, 3)).toBeCloseTo(0.7939, 3);
  });

  it("повторяется через период 2600 мс", () => {
    for (const t of [0, 137, 650, 1234, 2599]) {
      for (let bucket = 0; bucket < LIGHT_BUCKETS; bucket += 1) {
        expect(breath(t + BREATH_PERIOD_MS, bucket)).toBeCloseTo(breath(t, bucket), 5);
      }
    }
  });

  it("сдвигает корзину на пятую часть периода", () => {
    const shift = BREATH_PERIOD_MS / LIGHT_BUCKETS;
    for (const t of [0, 300, 900, 2000]) {
      expect(breath(t, 1)).toBeCloseTo(breath(t - shift, 0), 5);
      expect(breath(t, 3)).toBeCloseTo(breath(t - 3 * shift, 0), 5);
    }
  });

  it("не выходит за отрезок [0, 1]", () => {
    for (let t = 0; t < BREATH_PERIOD_MS; t += 37) {
      const s = breath(t, 2);
      expect(s).toBeGreaterThanOrEqual(0);
      expect(s).toBeLessThanOrEqual(1);
    }
  });

  it("растягивает радиус 7→12 и alpha .30→.60", () => {
    expect(haloRadius(0)).toBeCloseTo(7, 5);
    expect(haloRadius(0.5)).toBeCloseTo(9.5, 5);
    expect(haloRadius(1)).toBeCloseTo(12, 5);
    expect(haloAlpha(0)).toBeCloseTo(0.3, 5);
    expect(haloAlpha(0.5)).toBeCloseTo(0.45, 5);
    expect(haloAlpha(1)).toBeCloseTo(0.6, 5);
  });

  it("раскладывает огоньки по корзинам по остатку индекса", () => {
    expect([0, 1, 2, 3, 4, 5, 6].map(bucketOf)).toEqual([0, 1, 2, 3, 4, 0, 1]);
  });

  it("делит 942 огонька на пять корзин без потерь", () => {
    const buckets = splitBuckets(points);
    expect(buckets).toHaveLength(LIGHT_BUCKETS);
    expect(buckets.map((bucket) => bucket.length)).toEqual([189, 189, 188, 188, 188]);
    expect(buckets.reduce((sum, bucket) => sum + bucket.length, 0)).toBe(942);
  });

  it("сохраняет порядок точек внутри корзины", () => {
    const buckets = splitBuckets(points);
    expect(buckets[0][0]).toBe(points[0]);
    expect(buckets[0][1]).toBe(points[5]);
    expect(buckets[2][0]).toBe(points[2]);
    expect(buckets[2][1]).toBe(points[7]);
  });
});

describe("lightsCanvas: кольцо нового огонька", () => {
  it("решает кривую cubic-bezier(.16, 1, .3, 1) в контрольных точках", () => {
    expect(ringEase(0)).toBeCloseTo(0, 5);
    expect(ringEase(0.1)).toBeCloseTo(0.494, 2);
    expect(ringEase(0.25)).toBeCloseTo(0.826, 2);
    expect(ringEase(0.5)).toBeCloseTo(0.972, 2);
    expect(ringEase(0.75)).toBeCloseTo(0.998, 2);
    expect(ringEase(1)).toBeCloseTo(1, 5);
  });

  it("не убывает на сетке шагом 0.05 и зажимает края", () => {
    let previous = ringEase(0);
    for (let x = 0.05; x <= 1.0001; x += 0.05) {
      const value = ringEase(x);
      expect(value).toBeGreaterThanOrEqual(previous - 1e-9);
      previous = value;
    }
    expect(ringEase(-0.4)).toBe(0);
    expect(ringEase(1.7)).toBe(1);
  });

  it("строит линейную кривую для контрольных точек по диагонали", () => {
    const linear = cubicBezier(0.25, 0.25, 0.75, 0.75);
    expect(linear(0.2)).toBeCloseTo(0.2, 3);
    expect(linear(0.6)).toBeCloseTo(0.6, 3);
  });

  it("гонит кольцо 900 мс от 6px до 20,4px с гаснущей alpha", () => {
    expect(ringState(0)).toEqual({ radius: 6, alpha: 0.5, done: false });

    const middle = ringState(450);
    expect(middle.radius).toBeCloseTo(19.994, 2);
    expect(middle.alpha).toBeCloseTo(0.014, 2);
    expect(middle.done).toBe(false);

    const end = ringState(900);
    expect(end.radius).toBeCloseTo(20.4, 5);
    expect(end.alpha).toBeCloseTo(0, 5);
    expect(end.done).toBe(true);
  });

  it("держит одну прокрутку: после 900 мс кольцо погашено", () => {
    const late = ringState(1200);
    expect(late.radius).toBeCloseTo(20.4, 5);
    expect(late.alpha).toBeCloseTo(0, 5);
    expect(late.done).toBe(true);
  });
});

describe("lightsCanvas: планировщик и флаги", () => {
  it("пропускает кадр раньше 33 мс", () => {
    expect(frameDue(16.7)).toBe(false);
    expect(frameDue(32.9)).toBe(false);
    expect(frameDue(33)).toBe(true);
    expect(frameDue(50)).toBe(true);
  });

  it("анимирует только во вьюпорте, на видимой вкладке и без reduced motion", () => {
    const combinations = [false, true];
    for (const inView of combinations) {
      for (const hidden of combinations) {
        for (const reducedMotion of combinations) {
          expect(shouldAnimate({ inView, hidden, reducedMotion })).toBe(
            inView && !hidden && !reducedMotion,
          );
        }
      }
    }
  });

  it("зажимает dpr в отрезок [1, 2]", () => {
    expect(clampDpr(undefined)).toBe(1);
    expect(clampDpr(0)).toBe(1);
    expect(clampDpr(Number.NaN)).toBe(1);
    expect(clampDpr(1.5)).toBe(1.5);
    expect(clampDpr(2)).toBe(2);
    expect(clampDpr(3)).toBe(2);
  });
});

describe("lightsCanvas: сводка огоньков", () => {
  it("считает 942 огонька: 694 человека, 248 групп, 0 новых", () => {
    expect(summarize(points)).toEqual({ count: 942, people: 694, groups: 248, fresh: 0 });
  });

  it("учитывает зажжённый посетителем огонёк", () => {
    const fresh: Light = {
      id: "new-1",
      type: "person",
      countryId: 643,
      lon: 37.6,
      lat: 55.7,
      isNew: true,
    };
    const summary = summarize([...points, { light: fresh, x: 100, y: 100 }]);
    expect(summary).toEqual({ count: 943, people: 695, groups: 248, fresh: 1 });
  });
});

describe("lightsCanvas: отсев за холстом", () => {
  it("пропускает точки дальше поля допуска", () => {
    expect(isOnCanvas(-13, 10, 100, 100, 12)).toBe(false);
    expect(isOnCanvas(-11, 10, 100, 100, 12)).toBe(true);
    expect(isOnCanvas(50, 113, 100, 100, 12)).toBe(false);
    expect(isOnCanvas(50, 111, 100, 100, 12)).toBe(true);
    expect(isOnCanvas(Number.NaN, 10, 100, 100, 12)).toBe(false);
    expect(isOnCanvas(10, Number.NaN, 100, 100, 12)).toBe(false);
  });
});

/** Снимок вызова рисования: globalAlpha между вызовами меняется, по mock.calls его не восстановить. */
interface DrawSnapshot {
  alpha: number;
  args: unknown[];
}

interface StrokeSnapshot {
  alpha: number;
  strokeStyle: unknown;
  lineWidth: number;
  args: number[];
}

interface GradientStops {
  addColorStop: ReturnType<typeof vi.fn>;
}

/** Мок 2d-контекста: в jsdom `getContext` даёт null, поэтому кадр проверяется на нём. */
function mockContext() {
  const drawCalls: DrawSnapshot[] = [];
  const arcCalls: StrokeSnapshot[] = [];
  const fillCalls: { alpha: number; fillStyle: unknown }[] = [];
  const gradients: GradientStops[] = [];
  const ctx = {
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    scale: vi.fn(),
    fillRect: vi.fn(),
    setTransform: vi.fn(),
    createRadialGradient: vi.fn(),
    drawImage: vi.fn(),
    globalAlpha: 1,
    fillStyle: "" as unknown,
    strokeStyle: "" as unknown,
    lineWidth: 1,
    drawCalls,
    arcCalls,
    fillCalls,
    gradients,
  };
  ctx.drawImage = vi.fn((...args: unknown[]) => {
    drawCalls.push({ alpha: ctx.globalAlpha, args });
  });
  ctx.arc = vi.fn((...args: number[]) => {
    arcCalls.push({
      alpha: ctx.globalAlpha,
      strokeStyle: ctx.strokeStyle,
      lineWidth: ctx.lineWidth,
      args,
    });
  });
  ctx.fill = vi.fn(() => {
    fillCalls.push({ alpha: ctx.globalAlpha, fillStyle: ctx.fillStyle });
  });
  ctx.createRadialGradient = vi.fn(() => {
    const gradient = { addColorStop: vi.fn() };
    gradients.push(gradient);
    return gradient;
  });
  return ctx;
}

type MockContext = ReturnType<typeof mockContext>;

function asContext(ctx: MockContext): CanvasRenderingContext2D {
  return ctx as unknown as CanvasRenderingContext2D;
}

/** Фабрика offscreen-canvas: свой мок контекста на каждый спрайт. */
function spriteFactory(contexts: MockContext[], broken = false) {
  return () => {
    const ctx = mockContext();
    contexts.push(ctx);
    return {
      width: 0,
      height: 0,
      getContext: () => (broken ? null : ctx),
    } as unknown as HTMLCanvasElement;
  };
}

/** Готовые спрайты с узнаваемыми холстами: кадр проверяется по ссылке на холст. */
function fakeSprites(): LightSprites {
  const canvas = (tag: string) => ({ tag }) as unknown as HTMLCanvasElement;
  return {
    dpr: 1,
    halo: {
      person: { canvas: canvas("halo-person"), radius: SPRITE_HALO_RADIUS },
      group: { canvas: canvas("halo-group"), radius: SPRITE_HALO_RADIUS },
    },
    core: {
      person: { canvas: canvas("core-person"), radius: CORE_SPRITE_RADIUS },
      group: { canvas: canvas("core-group"), radius: CORE_SPRITE_RADIUS },
    },
  };
}

/** Десять огоньков вперемешку по типам, все внутри холста 400×300. */
function framePoints(): LightPoint[] {
  return Array.from({ length: 10 }, (_, index) => ({
    light: {
      id: `light-${index}`,
      type: index % 2 === 0 ? "person" : "group",
      countryId: 643,
      lon: 0,
      lat: 0,
    } as Light,
    x: 20 + index * 30,
    y: 40 + index * 10,
  }));
}

const identity = { apply: (point: [number, number]): [number, number] => point };

function centerOf(call: DrawSnapshot): [number, number] {
  const [, left, top, width, height] = call.args as [unknown, number, number, number, number];
  return [left + width / 2, top + height / 2];
}

function callAt(calls: DrawSnapshot[], x: number, y: number): DrawSnapshot {
  const found = calls.find((call) => {
    const [cx, cy] = centerOf(call);
    return Math.abs(cx - x) < 1e-6 && Math.abs(cy - y) < 1e-6;
  });
  expect(found).toBeDefined();
  return found as DrawSnapshot;
}

function haloCalls(ctx: MockContext, sprites: LightSprites): DrawSnapshot[] {
  return ctx.drawCalls.filter(
    (call) => call.args[0] === sprites.halo.person.canvas || call.args[0] === sprites.halo.group.canvas,
  );
}

function coreCalls(ctx: MockContext, sprites: LightSprites): DrawSnapshot[] {
  return ctx.drawCalls.filter(
    (call) => call.args[0] === sprites.core.person.canvas || call.args[0] === sprites.core.group.canvas,
  );
}

describe("lightsCanvas: спрайты", () => {
  it("рисует четыре offscreen-спрайта под dpr", () => {
    const contexts: MockContext[] = [];
    const factory = vi.fn(spriteFactory(contexts));
    const sprites = makeSprites(2, factory);

    expect(factory).toHaveBeenCalledTimes(4);
    expect(sprites).not.toBeNull();
    expect(sprites?.dpr).toBe(2);
    expect(sprites?.halo.person.radius).toBe(12);
    expect(sprites?.halo.group.radius).toBe(12);
    expect(sprites?.core.person.radius).toBeCloseTo(3.1, 5);
    expect(sprites?.core.group.radius).toBeCloseTo(3.1, 5);

    expect(sprites?.halo.person.canvas.width).toBe(48);
    expect(sprites?.halo.person.canvas.height).toBe(48);
    expect(sprites?.core.person.canvas.width).toBe(13);
    expect(sprites?.core.person.canvas.height).toBe(13);
    for (const ctx of contexts) {
      expect(ctx.scale).toHaveBeenCalledWith(2, 2);
    }
  });

  it("заливает ореол радиальным градиентом от цвета с alpha .9 к нулю", () => {
    const contexts: MockContext[] = [];
    makeSprites(2, spriteFactory(contexts));

    const [haloPerson, haloGroup] = contexts;
    expect(haloPerson.createRadialGradient).toHaveBeenCalledWith(12, 12, 0, 12, 12, 12);
    expect(haloPerson.gradients[0].addColorStop).toHaveBeenCalledWith(0, "rgba(158, 67, 154, 0.9)");
    expect(haloPerson.gradients[0].addColorStop).toHaveBeenCalledWith(1, "rgba(158, 67, 154, 0)");
    expect(haloPerson.fillRect).toHaveBeenCalledWith(0, 0, 24, 24);

    expect(haloGroup.gradients[0].addColorStop).toHaveBeenCalledWith(0, "rgba(84, 164, 172, 0.9)");
    expect(haloGroup.gradients[0].addColorStop).toHaveBeenCalledWith(1, "rgba(84, 164, 172, 0)");
  });

  it("рисует ядро 2,2px с белой обводкой .9px alpha .5", () => {
    const contexts: MockContext[] = [];
    makeSprites(2, spriteFactory(contexts));

    const corePerson = contexts[2];
    expect(corePerson.arcCalls).toHaveLength(1);
    expect(corePerson.arcCalls[0].args[0]).toBeCloseTo(3.1, 5);
    expect(corePerson.arcCalls[0].args[1]).toBeCloseTo(3.1, 5);
    expect(corePerson.arcCalls[0].args[2]).toBeCloseTo(2.2, 5);
    expect(corePerson.arcCalls[0].args[3]).toBe(0);
    expect(corePerson.arcCalls[0].args[4]).toBeCloseTo(Math.PI * 2, 5);
    expect(corePerson.fillCalls[0].fillStyle).toBe("rgba(158, 67, 154, 1)");
    expect(corePerson.lineWidth).toBe(0.9);
    expect(corePerson.strokeStyle).toBe("rgba(255, 255, 255, 0.5)");
    expect(corePerson.stroke).toHaveBeenCalled();

    expect(contexts[3].fillCalls[0].fillStyle).toBe("rgba(84, 164, 172, 1)");
  });

  it("возвращает null, если у спрайта нет 2d-контекста", () => {
    const contexts: MockContext[] = [];
    expect(() => makeSprites(1, spriteFactory(contexts, true))).not.toThrow();
    expect(makeSprites(1, spriteFactory(contexts, true))).toBeNull();
  });
});

describe("lightsCanvas: drawFrame", () => {
  it("чистит холст и рисует ореолы корзин с дыханием, ядра поверх", () => {
    const ctx = mockContext();
    const sprites = fakeSprites();
    const points = framePoints();

    const result = drawFrame(asContext(ctx), sprites, {
      points,
      buckets: splitBuckets(points),
      transform: identity,
      now: 650,
      rings: [],
      reduced: false,
      width: 400,
      height: 300,
    });

    expect(ctx.clearRect).toHaveBeenCalledWith(0, 0, 400, 300);
    expect(ctx.drawCalls).toHaveLength(20);
    expect(haloCalls(ctx, sprites)).toHaveLength(10);
    expect(coreCalls(ctx, sprites)).toHaveLength(10);
    // Ореолы идут слоем под ядрами: первые десять вызовов ореольные.
    expect(ctx.drawCalls.slice(0, 10)).toEqual(haloCalls(ctx, sprites));

    // Корзина 0 на 650 мс дышит полным вдохом: радиус 12, alpha .60.
    const first = callAt(haloCalls(ctx, sprites), points[0].x, points[0].y);
    expect(first.alpha).toBeCloseTo(0.6, 5);
    expect(first.args).toEqual([sprites.halo.person.canvas, 20 - 12, 40 - 12, 24, 24]);

    // Корзина 1 сдвинута на пятую часть периода: s = 0.6545.
    const second = callAt(haloCalls(ctx, sprites), points[1].x, points[1].y);
    expect(second.alpha).toBeCloseTo(0.4964, 3);
    expect(second.args[0]).toBe(sprites.halo.group.canvas);
    expect(second.args[3]).toBeCloseTo(20.545, 3);
    expect(second.args[4]).toBeCloseTo(20.545, 3);

    const core = callAt(coreCalls(ctx, sprites), points[0].x, points[0].y);
    expect(core.alpha).toBe(1);
    expect(core.args[0]).toBe(sprites.core.person.canvas);
    expect(core.args[1]).toBeCloseTo(20 - 3.1, 5);
    expect(core.args[2]).toBeCloseTo(40 - 3.1, 5);
    expect(core.args[3]).toBeCloseTo(6.2, 5);
    expect(core.args[4]).toBeCloseTo(6.2, 5);

    expect(ctx.globalAlpha).toBe(1);
    expect(result.ringsActive).toBe(false);
  });

  it("берёт экранные позиции из transform.apply, размер спрайта от масштаба не зависит", () => {
    const ctx = mockContext();
    const sprites = fakeSprites();
    const points = framePoints();
    const apply = vi.fn((point: [number, number]): [number, number] => [
      2 * point[0] + 10,
      2 * point[1] + 20,
    ]);

    drawFrame(asContext(ctx), sprites, {
      points,
      buckets: splitBuckets(points),
      transform: { apply },
      now: 650,
      rings: [],
      reduced: false,
      width: 400,
      height: 300,
    });

    expect(apply.mock.calls.length).toBeGreaterThanOrEqual(points.length);
    for (const point of points) {
      expect(apply).toHaveBeenCalledWith([point.x, point.y]);
    }

    const halo = callAt(haloCalls(ctx, sprites), 2 * points[0].x + 10, 2 * points[0].y + 20);
    expect(halo.args[1]).toBeCloseTo(2 * 20 + 10 - 12, 5);
    expect(halo.args[2]).toBeCloseTo(2 * 40 + 20 - 12, 5);
    expect(halo.args[3]).toBe(24);

    const core = callAt(coreCalls(ctx, sprites), 2 * points[0].x + 10, 2 * points[0].y + 20);
    expect(core.args[3]).toBeCloseTo(6.2, 5);
  });

  it("рисует кольцо нового огонька поверх ядер одну прокрутку", () => {
    const sprites = fakeSprites();
    const points = framePoints();
    const rings: Ring[] = [{ point: points[0], startedAt: 650 }];
    const input = {
      points,
      buckets: splitBuckets(points),
      transform: identity,
      rings,
      reduced: false,
      width: 400,
      height: 300,
    };

    const start = mockContext();
    const atStart = drawFrame(asContext(start), sprites, { ...input, now: 650 });
    expect(atStart.ringsActive).toBe(true);
    expect(start.arcCalls).toHaveLength(1);
    expect(start.arcCalls[0].args).toEqual([points[0].x, points[0].y, 6, 0, Math.PI * 2]);
    expect(start.arcCalls[0].alpha).toBeCloseTo(0.5, 5);
    expect(start.arcCalls[0].strokeStyle).toBe("rgba(158, 67, 154, 1)");
    expect(start.arcCalls[0].lineWidth).toBe(1);
    expect(start.beginPath).toHaveBeenCalled();
    expect(start.stroke).toHaveBeenCalledTimes(1);

    const middle = mockContext();
    const atMiddle = drawFrame(asContext(middle), sprites, { ...input, now: 1100 });
    expect(atMiddle.ringsActive).toBe(true);
    expect(middle.arcCalls[0].args[2]).toBeCloseTo(ringState(450).radius, 5);
    expect(middle.arcCalls[0].alpha).toBeCloseTo(ringState(450).alpha, 5);

    const done = mockContext();
    const atEnd = drawFrame(asContext(done), sprites, { ...input, now: 1550 });
    expect(atEnd.ringsActive).toBe(false);
    expect(done.arcCalls).toHaveLength(0);
    expect(done.globalAlpha).toBe(1);
  });

  it("под reduce рисует статичный кадр: ореол 9px alpha .22 и никаких колец", () => {
    const ctx = mockContext();
    const sprites = fakeSprites();
    const points = framePoints();

    const result = drawFrame(asContext(ctx), sprites, {
      points,
      buckets: splitBuckets(points),
      transform: identity,
      now: 650,
      rings: [{ point: points[0], startedAt: 650 }],
      reduced: true,
      width: 400,
      height: 300,
    });

    for (const call of haloCalls(ctx, sprites)) {
      expect(call.args[3]).toBe(18);
      expect(call.args[4]).toBe(18);
      expect(call.alpha).toBeCloseTo(0.22, 5);
    }
    for (const call of coreCalls(ctx, sprites)) {
      expect(call.alpha).toBe(1);
      expect(call.args[3]).toBeCloseTo(6.2, 5);
    }
    expect(ctx.arcCalls).toHaveLength(0);
    expect(result.ringsActive).toBe(false);
  });

  it("пропускает точки за холстом", () => {
    const sprites = fakeSprites();
    const points = framePoints();
    points[0] = { ...points[0], x: -50, y: -50 };
    const input = {
      points,
      buckets: splitBuckets(points),
      now: 650,
      rings: [],
      reduced: false,
      width: 400,
      height: 300,
    };

    const near = mockContext();
    drawFrame(asContext(near), sprites, { ...input, transform: identity });
    expect(near.drawCalls).toHaveLength(18);

    // Точка уезжает за холст уже после трансформа: её тоже не рисуем.
    const away = mockContext();
    drawFrame(asContext(away), sprites, {
      ...input,
      transform: { apply: ([x, y]: [number, number]): [number, number] => [x, y + 500] },
    });
    expect(away.drawCalls).toHaveLength(0);
  });
});
