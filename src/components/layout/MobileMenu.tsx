import { useCallback, useEffect, useRef } from "react";
import type { MouseEvent, RefObject } from "react";
import { copy } from "../../data/copy";
import type { NavItem } from "../../data/copy";
import { navQuery } from "../../lib/breakpoints";
import { lockScroll, unlockScroll } from "../../lib/scrollLock";

type MobileMenuProps = {
  open: boolean;
  onClose: () => void;
  onNavigate: (href: string) => void;
  items: readonly NavItem[];
  burgerRef: RefObject<HTMLButtonElement | null>;
};

export function MobileMenu({ open, onClose, onNavigate, items, burgerRef }: MobileMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const wasOpen = useRef(false);

  const focusables = useCallback((): HTMLElement[] => {
    const links = Array.from(menuRef.current?.querySelectorAll<HTMLElement>("a[href]") ?? []);
    return burgerRef.current ? [burgerRef.current, ...links] : links;
  }, [burgerRef]);

  // Кнопка закрытия оверлея — бургер — лежит снаружи диалога, в пилюле header,
  // поэтому aria-modal тут не годится: скринридер спрятал бы от пользователя
  // элемент, на который фокус-ловушка ставит фокус первым. Вместо этого на время
  // показа оверлея из обхода выключается остальная страница.
  useEffect(() => {
    if (!open) {
      return;
    }

    const header = menuRef.current?.closest("header");
    const siblings = Array.from(header?.parentElement?.children ?? []).filter(
      (element): element is HTMLElement => element instanceof HTMLElement && element !== header,
    );

    siblings.forEach((element) => element.setAttribute("inert", ""));
    return () => siblings.forEach((element) => element.removeAttribute("inert"));
  }, [open]);

  // Скролл страницы блокируется на время показа оверлея и возвращается к тому
  // значению, которое было до открытия.
  useEffect(() => {
    if (!open) {
      return;
    }

    lockScroll();
    return unlockScroll;
  }, [open]);

  useEffect(() => {
    if (open) {
      menuRef.current?.querySelector<HTMLElement>("a[href]")?.focus();
    } else if (wasOpen.current) {
      burgerRef.current?.focus();
    }

    wasOpen.current = open;
  }, [open, burgerRef]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const stops = focusables();
      if (stops.length === 0) {
        return;
      }

      const current = stops.indexOf(document.activeElement as HTMLElement);
      const step = event.shiftKey ? -1 : 1;
      const next =
        current === -1
          ? (event.shiftKey ? stops.length - 1 : 0)
          : (current + step + stops.length) % stops.length;

      event.preventDefault();
      stops[next].focus();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose, focusables]);

  // Меню живёт только на узком экране: как только места хватает под горизонтальную
  // навигацию, оверлей закрывается и разблокирует скролл.
  useEffect(() => {
    if (!open) {
      return;
    }

    const list = window.matchMedia?.(navQuery());
    if (!list) {
      return;
    }

    const onChange = (event: MediaQueryListEvent) => {
      if (event.matches) {
        onClose();
      }
    };

    list.addEventListener("change", onChange);
    return () => list.removeEventListener("change", onChange);
  }, [open, onClose]);

  const onBackdropClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      ref={menuRef}
      id="mobile-menu"
      className={open ? "mobile-menu is-open" : "mobile-menu"}
      role="dialog"
      aria-label={copy.shell.menuDialogLabel}
      aria-hidden={!open}
      inert={!open}
      onClick={onBackdropClick}
    >
      <nav className="mobile-menu__nav">
        <ul className="mobile-menu__list">
          {items.map((item) => (
            <li key={item.href}>
              <a
                className="mobile-menu__link"
                href={item.href}
                onClick={(event) => {
                  event.preventDefault();
                  // Позиция страницы возвращается до перехода: иначе очистка
                  // эффекта отмотала бы страницу обратно уже после прокрутки.
                  unlockScroll();
                  onNavigate(item.href);
                }}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
