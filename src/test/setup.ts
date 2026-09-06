import "@testing-library/jest-dom/vitest";

import { IntersectionObserverMock } from "./intersection";
import { resetProgrammaticScroll } from "../lib/programmaticScroll";

class ResizeObserverMock implements ResizeObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

vi.stubGlobal("IntersectionObserver", IntersectionObserverMock);
vi.stubGlobal("ResizeObserver", ResizeObserverMock);

window.matchMedia = vi.fn((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  addListener: vi.fn(),
  removeListener: vi.fn(),
  dispatchEvent: vi.fn(),
})) as unknown as typeof window.matchMedia;

HTMLCanvasElement.prototype.getContext = (() =>
  null) as unknown as HTMLCanvasElement["getContext"];

/* jsdom не реализует медиа: без заглушек каждый рендер App с <video> печатает
   «Not implemented: HTMLMediaElement's play() method». Обычные функции, а не vi.fn:
   состояние мока копилось бы между тестами. Hero.test.tsx кладёт поверх свои
   vi.spyOn и снимает их через restoreAllMocks, поэтому подсчёт вызовов там прежний. */
HTMLMediaElement.prototype.play = () => Promise.resolve();
HTMLMediaElement.prototype.pause = () => {};

Element.prototype.scrollIntoView = vi.fn();
window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;

// Отметка программной прокрутки живёт 700 мс реального времени: между сценариями
// её нужно снимать, иначе переход одного теста глушит скролл следующего.
beforeEach(resetProgrammaticScroll);
