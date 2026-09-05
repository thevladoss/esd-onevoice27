import type { Ref } from "react";
import { copy } from "../../data/copy";

type BurgerButtonProps = {
  open: boolean;
  onToggle: () => void;
  controls: string;
  ref?: Ref<HTMLButtonElement>;
};

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
      <span className="burger__line" />
      <span className="burger__line" />
      <span className="burger__line" />
    </button>
  );
}
