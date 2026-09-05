import type { ReactNode } from "react";
import "./primitives.css";

export function GradientTitle({
  as,
  variant,
  children,
  className,
}: {
  as: "h1" | "h2";
  variant: "hero" | "section";
  children: ReactNode;
  className?: string;
}) {
  const Tag = as;
  return (
    <Tag
      className={
        `gradient-title gradient-title--${variant} font-display` +
        (className ? " " + className : "")
      }
    >
      {children}
    </Tag>
  );
}
