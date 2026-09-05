import type { ComponentPropsWithoutRef, ReactNode } from "react";
import "./primitives.css";

type ButtonOwnProps = {
  variant?: "primary" | "ghost";
  className?: string;
  children: ReactNode;
};

type ButtonProps =
  | (ButtonOwnProps & { as: "a" } & ComponentPropsWithoutRef<"a">)
  | (ButtonOwnProps & { as?: "button" } & ComponentPropsWithoutRef<"button">);

export function Button(props: ButtonProps) {
  const {
    as: tag = "button",
    variant = "primary",
    className,
    children,
    ...rest
  } = props as ButtonOwnProps & { as?: "a" | "button" };

  const classes = `btn btn--${variant}` + (className ? " " + className : "");
  // Луч по границе рисует ::before основной кнопки. Сам эффект живёт в CSS, тут
  // объявляется его носитель: по этому атрибуту блок reduced motion подменяет
  // бегущий конический градиент статичным. У ghost луча нет.
  const anim = variant === "primary" ? "beam" : undefined;

  if (tag === "a") {
    return (
      <a className={classes} data-anim={anim} {...(rest as ComponentPropsWithoutRef<"a">)}>
        {children}
      </a>
    );
  }

  const { type, ...buttonProps } = rest as ComponentPropsWithoutRef<"button">;
  return (
    <button type={type ?? "button"} className={classes} data-anim={anim} {...buttonProps}>
      {children}
    </button>
  );
}
