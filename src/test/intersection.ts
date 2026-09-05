/**
 * Управляемый мок IntersectionObserver для jsdom.
 *
 * Молчаливый мок делал дефекты появления невидимыми: `whileInView` не срабатывал ни разу,
 * весь контент под `Reveal` лежал с `opacity: 0`, и ни один тест не мог проверить, что блок
 * вообще показывается. Здесь наблюдения копятся в реестре, а событие о пересечении шлёт сам
 * тест вызовом `enterViewport()`.
 */

type ObserverRecord = {
  callback: IntersectionObserverCallback;
  targets: Set<Element>;
};

const records = new Set<ObserverRecord>();

export class IntersectionObserverMock implements IntersectionObserver {
  readonly root: Element | Document | null = null;
  readonly rootMargin: string = "";
  readonly thresholds: ReadonlyArray<number> = [];
  private readonly record: ObserverRecord;

  constructor(callback: IntersectionObserverCallback) {
    this.record = { callback, targets: new Set() };
    records.add(this.record);
  }

  observe(target: Element): void {
    // motion держит одного наблюдателя на весь файл тестов и переиспользует его после
    // размонтирования, поэтому запись возвращается в реестр на каждом observe.
    records.add(this.record);
    this.record.targets.add(target);
  }

  unobserve(target: Element): void {
    this.record.targets.delete(target);
  }

  disconnect(): void {
    this.record.targets.clear();
    records.delete(this.record);
  }

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

function intersectingEntry(target: Element): IntersectionObserverEntry {
  const rect = target.getBoundingClientRect();

  return {
    target,
    isIntersecting: true,
    intersectionRatio: 1,
    time: 0,
    boundingClientRect: rect,
    intersectionRect: rect,
    rootBounds: null,
  };
}

/**
 * Сообщает каждому наблюдаемому узлу, что он попал в область просмотра. Браузер шлёт такую
 * запись и в момент, когда наблюдение начинается за уже видимым узлом, поэтому тест вызывает
 * функцию после каждого монтирования новых блоков.
 */
export function enterViewport(): void {
  for (const record of [...records]) {
    const targets = [...record.targets];
    if (targets.length === 0) {
      continue;
    }

    // Второй аргумент колбэка — сам наблюдатель; motion его не читает.
    record.callback(targets.map(intersectingEntry), undefined as unknown as IntersectionObserver);
  }
}
