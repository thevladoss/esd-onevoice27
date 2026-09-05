type LockedState = {
  y: number;
  overflow: string;
  position: string;
  top: string;
  width: string;
};

/** Блокировка одна на документ, поэтому состояние живёт в модуле, а не в компоненте. */
let locked: LockedState | null = null;

/**
 * Замораживает страницу под оверлеем.
 *
 * `overflow: hidden` на body не останавливает тач-скролл в iOS Safari — то есть
 * ровно на том классе устройств, ради которых сделано мобильное меню. Поэтому
 * body дополнительно фиксируется на текущей позиции: браузеру нечего скроллить.
 * Повторный вызов ничего не делает.
 */
export function lockScroll(): void {
  if (locked) {
    return;
  }

  const { style } = document.body;
  locked = {
    y: window.scrollY,
    overflow: style.overflow,
    position: style.position,
    top: style.top,
    width: style.width,
  };

  style.overflow = "hidden";
  style.position = "fixed";
  style.top = `-${locked.y}px`;
  style.width = "100%";
}

/**
 * Возвращает странице прокрутку и ту позицию, на которой её застало открытие
 * оверлея. Вызывается и из очистки эффекта, и из обработчика перехода по пункту
 * меню: там позицию нужно вернуть до прокрутки к секции, иначе восстановление
 * перебило бы переход. Повторный вызов ничего не делает.
 */
export function unlockScroll(): void {
  if (!locked) {
    return;
  }

  const { style } = document.body;
  style.overflow = locked.overflow;
  style.position = locked.position;
  style.top = locked.top;
  style.width = locked.width;

  const { y } = locked;
  locked = null;
  window.scrollTo({ top: y, behavior: "auto" });
}
