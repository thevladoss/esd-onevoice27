import { useCallback, useRef, useState, useSyncExternalStore } from "react";
import type { MouseEvent } from "react";
import { copy, sectionIds } from "../../data/copy";
import { navQuery } from "../../lib/breakpoints";
import { scrollToSection } from "../../lib/scrollToSection";
import { useActiveSection } from "../../lib/useActiveSection";
import { useHeaderHide } from "../../lib/useHeaderHide";
import { BurgerButton } from "./BurgerButton";
import { MobileMenu } from "./MobileMenu";
import { Wordmark } from "./Wordmark";
import "./Header.css";

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
  const [menuOpen, setMenuOpen] = useState(false);
  const navInline = useMediaQuery(navQuery());
  const activeSection = useActiveSection(sectionIds, navInline);
  // Ссылка на ландмарку нужна хуку, чтобы вернуть спрятанную шапку на экран,
  // когда фокус приходит на вордмарк, пункт меню или бургер.
  const hidden = useHeaderHide({ menuOpen, header: headerRef });

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  const navigate = useCallback((href: string) => {
    setMenuOpen(false);
    // Отступ берётся из --header-offset: живой замер пилюли давал другое число,
    // потому что к концу плавной прокрутки шапка успевала уехать вверх.
    if (!scrollToSection(href)) {
      return;
    }

    // Переход по якорю отменён preventDefault, поэтому адрес и фокус двигаем
    // сами: иначе ссылку на раздел не скопировать, «Назад» не отматывает
    // переходы, а клавиатурный обход продолжается с шапки.
    const target = document.getElementById(href.replace(/^#/, ""));
    if (!target) {
      history.pushState(null, "", `${location.pathname}${location.search}`);
      return;
    }

    history.pushState(null, "", href);
    target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
  }, []);

  const handleClick = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    event.preventDefault();
    navigate(href);
  };

  const headerClass = [
    "site-header",
    hidden ? "is-header-hidden" : "",
    menuOpen ? "is-menu-open" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <header ref={headerRef} className={headerClass}>
      <div className="site-header__content">
        <a
          className="site-header__brand"
          href="#top"
          aria-label={copy.shell.wordmarkAriaLabel}
          onClick={(event) => handleClick(event, "#top")}
        >
          <Wordmark tone="solid" />
        </a>

        <nav className="site-nav" aria-label={copy.shell.navLabel}>
          <ul className="site-nav__list">
            {copy.shell.nav.map((item) => (
              <li key={item.href}>
                <a
                  className="site-nav__link"
                  href={item.href}
                  aria-current={item.href === `#${activeSection}` ? "true" : undefined}
                  onClick={(event) => handleClick(event, item.href)}
                >
                  {/* Градиент едет по тексту, а не по всей ссылке: клип по
                      background-clip: text работает только на своём элементе. */}
                  <span>{item.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="site-header__toggler">
          <BurgerButton
            ref={burgerRef}
            open={menuOpen}
            onToggle={() => setMenuOpen((open) => !open)}
            controls={MENU_ID}
          />
        </div>

        {/* Оверлей живёт внутри изолированного контекста пилюли, как в оригинале:
            так бургер (z-index 42) остаётся поверх оверлея (z-index 40), и меню
            закрывается крестом, а логотип и стекло уходят под оверлей. */}
        <MobileMenu
          open={menuOpen}
          onClose={closeMenu}
          onNavigate={navigate}
          items={copy.shell.nav}
          burgerRef={burgerRef}
        />
      </div>
    </header>
  );
}
