import type { ComponentPropsWithoutRef, ReactNode } from "react";
import "./primitives.css";

type ButtonOwnProps = {
  variant?: "primary" | "ghost";
  /** Форма растягивает submit на всю ширину карточки и равняет его по высоте полей. */
  size?: "form";
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
    size,
    className,
    children,
    ...rest
  } = props as ButtonOwnProps & { as?: "a" | "button" };

  const classes = `btn btn--${variant}` + (className ? " " + className : "");
  // Луч по границе и сетку точек рисует основной вариант: data-beam включает
  // правила в global.css, data-anim="beam" отдаёт бегущий угол блоку reduced
  // motion. У ghost ни луча, ни точек нет.
  const beam = variant === "primary" ? "true" : undefined;
  const anim = variant === "primary" ? "beam" : undefined;
  // Точки лежат слоем над поверхностью, поэтому подпись живёт в span: по нему
  // CSS поднимает текст выше сетки.
  const label = <span className="btn__label">{children}</span>;

  if (tag === "a") {
    return (
      <a
        className={classes}
        data-beam={beam}
        data-anim={anim}
        data-size={size}
        {...(rest as ComponentPropsWithoutRef<"a">)}
      >
        {label}
      </a>
    );
  }

  const { type, ...buttonProps } = rest as ComponentPropsWithoutRef<"button">;
  return (
    <button
      type={type ?? "button"}
      className={classes}
      data-beam={beam}
      data-anim={anim}
      data-size={size}
      {...buttonProps}
    >
      {label}
    </button>
  );
}
