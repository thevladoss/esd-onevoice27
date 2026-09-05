const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function prefersReducedMotion(): boolean {
  return window.matchMedia?.(REDUCED_MOTION_QUERY).matches === true;
}

/**
 * Прокручивает страницу к секции по её якорю.
 *
 * Целевая позиция считается как `offsetTop` секции минус высота плавающего
 * header и минус зазор 16px, чтобы заголовок секции не прятался под пилюлю.
 * Якорь `#top` возвращает страницу в самый верх. Если секции нет в документе,
 * функция молча возвращает `false`: страница не дёргается, хеш не меняется.
 */
export function scrollToSection(hash: string, headerHeight: number): boolean {
  const behavior: ScrollBehavior = prefersReducedMotion() ? "auto" : "smooth";

  if (hash === "#top" || hash === "top") {
    window.scrollTo({ top: 0, behavior });
    return true;
  }

  const target = document.getElementById(hash.replace(/^#/, ""));
  if (!target) {
    return false;
  }

  const top = Math.max(0, target.offsetTop - headerHeight - 16);
  window.scrollTo({ top, behavior });
  return true;
}
