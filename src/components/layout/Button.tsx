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

  if (tag === "a") {
    return (
      <a className={classes} {...(rest as ComponentPropsWithoutRef<"a">)}>
        {children}
      </a>
    );
  }

  const { type, ...buttonProps } = rest as ComponentPropsWithoutRef<"button">;
  return (
    <button type={type ?? "button"} className={classes} {...buttonProps}>
      {children}
    </button>
  );
}
