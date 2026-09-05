import { headerOffset } from "./headerOffset";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

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
 * Из позиции вычитается `offset`: сколько header занимает сверху вместе с
 * зазором до заголовка секции. По умолчанию значение приходит из CSS-переменной
 * `--header-offset`, той же, что стоит в `scroll-padding-top`.
 *
 * Якорь `#top` возвращает страницу в самый верх. Если секции нет в документе,
 * функция молча возвращает `false`: страница не дёргается, хеш не меняется.
 */
export function scrollToSection(hash: string, offset: number = headerOffset()): boolean {
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
  const top = Math.max(0, documentTop - offset);
  window.scrollTo({ top, behavior });
  return true;
}
