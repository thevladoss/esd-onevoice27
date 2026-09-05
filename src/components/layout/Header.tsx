import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { MouseEvent } from "react";
import { copy, sectionIds } from "../../data/copy";
import { scrollToSection } from "../../lib/scrollToSection";
import { useActiveSection } from "../../lib/useActiveSection";
import { BurgerButton } from "./BurgerButton";
import { MobileMenu } from "./MobileMenu";
import { Wordmark } from "./Wordmark";
import "./Header.css";

const DESKTOP_QUERY = "(min-width: 768px)";
const COMPACT_AFTER = 24;
const MENU_ID = "mobile-menu";

function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia?.(query);
      if (!list) {
        return () => {};
      }

      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    [query],
  );

  const getSnapshot = useCallback(() => window.matchMedia?.(query).matches === true, [query]);

  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}

export function Header() {
  const headerRef = useRef<HTMLElement>(null);
  const burgerRef = useRef<HTMLButtonElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const activeSection = useActiveSection(sectionIds, isDesktop);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > COMPACT_AFTER);

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  const navigate = useCallback((href: string) => {
    setMenuOpen(false);
    // Нижняя граница пилюли, а не её высота: header зафиксирован с отступом
    // сверху, и `bottom` учитывает этот отступ.
    scrollToSection(href, headerRef.current?.getBoundingClientRect().bottom ?? 0);
  }, []);

  const handleClick = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    event.preventDefault();
    navigate(href);
  };

  return (
    <header ref={headerRef} className="site-header" data-scrolled={scrolled ? "true" : "false"}>
      <div className="site-header__pill">
        <a
          className="site-header__brand"
          href="#top"
          aria-label={copy.shell.wordmarkAriaLabel}
          onClick={(event) => handleClick(event, "#top")}
        >
          <Wordmark />
        </a>

        <nav className="site-header__nav" aria-label={copy.shell.navLabel}>
          <ul className="site-header__list">
            {copy.shell.nav.map((item) => (
              <li key={item.href}>
                <a
                  className="site-header__link"
                  href={item.href}
                  aria-current={item.href === `#${activeSection}` ? "true" : undefined}
                  onClick={(event) => handleClick(event, item.href)}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <BurgerButton
          ref={burgerRef}
          open={menuOpen}
          onToggle={() => setMenuOpen((open) => !open)}
          controls={MENU_ID}
        />
      </div>

      <MobileMenu
        open={menuOpen}
        onClose={closeMenu}
        onNavigate={navigate}
        items={copy.shell.nav}
        burgerRef={burgerRef}
      />
    </header>
  );
}
