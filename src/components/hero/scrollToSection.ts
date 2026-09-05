/** Высота фиксированного header: совпадает с `scroll-padding-top` в global.css. */
export const HEADER_OFFSET = 96;

/**
 * Прокручивает страницу к секции по хешу с поправкой на высоту header.
 * Возвращает `false`, если секции нет: вызывающий код оставляет якорю нативное поведение.
 */
export function scrollToSection(hash: string, offset: number = HEADER_OFFSET): boolean {
  const id = hash.startsWith("#") ? hash.slice(1) : hash;
  const target = document.getElementById(id);
  if (!target) return false;

  const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  const top = target.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top, behavior: reduced ? "auto" : "smooth" });
  return true;
}
