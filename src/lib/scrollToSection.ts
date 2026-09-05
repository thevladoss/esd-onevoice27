const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/** Зазор между нижней границей плавающего header и верхом секции. */
export const SECTION_GAP = 16;

function prefersReducedMotion(): boolean {
  return window.matchMedia?.(REDUCED_MOTION_QUERY).matches === true;
}

/**
 * Прокручивает страницу к секции по её якорю.
 *
 * Позиция секции берётся из `getBoundingClientRect().top` и переводится в
 * координаты документа прибавлением `window.scrollY`. `offsetTop` для этого не
 * годится: он меряет смещение от ближайшего позиционированного предка, и любой
 * `position: relative` на обёртке молча увёл бы все переходы по меню.
 *
 * Из позиции вычитается `headerBottom` — нижняя граница пилюли вместе с её
 * отступом сверху, а не только высота, — и зазор `SECTION_GAP`, чтобы заголовок
 * секции не прижимался к шапке.
 *
 * Якорь `#top` возвращает страницу в самый верх. Если секции нет в документе,
 * функция молча возвращает `false`: страница не дёргается, хеш не меняется.
 */
export function scrollToSection(hash: string, headerBottom: number): boolean {
  const behavior: ScrollBehavior = prefersReducedMotion() ? "auto" : "smooth";

  if (hash === "#top" || hash === "top") {
    window.scrollTo({ top: 0, behavior });
    return true;
  }

  const target = document.getElementById(hash.replace(/^#/, ""));
  if (!target) {
    return false;
  }

  const documentTop = target.getBoundingClientRect().top + window.scrollY;
  const top = Math.max(0, documentTop - headerBottom - SECTION_GAP);
  window.scrollTo({ top, behavior });
  return true;
}
