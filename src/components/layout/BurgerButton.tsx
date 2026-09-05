import type { Ref } from "react";
import { copy } from "../../data/copy";

type BurgerButtonProps = {
  open: boolean;
  onToggle: () => void;
  controls: string;
  ref?: Ref<HTMLButtonElement>;
};

/**
 * Иконка повторяет оригинал: три прямоугольника в системе координат 64×28.
 * В открытом состоянии верхняя линия гаснет, а средняя с нижней складываются в
 * крест — CSS ловит их по классу `is-menu-open` на ландмарке header.
 */
export function BurgerButton({ open, onToggle, controls, ref }: BurgerButtonProps) {
  return (
    <button
      ref={ref}
      type="button"
      className="burger"
      aria-expanded={open}
      aria-controls={controls}
      aria-label={open ? copy.shell.menuClose : copy.shell.menuOpen}
      onClick={onToggle}
    >
      <svg
        className="burger__icon"
        viewBox="0 0 64 28"
        width="64"
        height="28"
        fill="none"
        aria-hidden="true"
        focusable="false"
      >
        <rect width="64" height="4" rx="2" />
        <rect x="6" y="12" width="52" height="4" rx="2" />
        <rect y="24" width="64" height="4" rx="2" />
      </svg>
    </button>
  );
}
