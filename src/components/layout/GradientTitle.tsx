import type { ReactNode } from "react";
import "./primitives.css";

export function GradientTitle({
  as,
  variant,
  children,
  className,
  id,
}: {
  as: "h1" | "h2";
  variant: "hero" | "section";
  children: ReactNode;
  className?: string;
  /** Якорь для `aria-labelledby` секции: скринридер называет секцию её заголовком. */
  id?: string;
}) {
  const Tag = as;
  return (
    <Tag
      id={id}
      className={
        `gradient-title gradient-title--${variant} font-display` +
        (className ? " " + className : "")
      }
    >
      {children}
    </Tag>
  );
}
