import type { ReactNode } from "react";
import "./primitives.css";

export function GlassCard({
  children,
  className,
  interactive,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  interactive?: boolean;
  as?: "div" | "article" | "li";
}) {
  const Tag = as;
  return (
    <Tag
      className={
        "glass-card glass p-6 md:p-8" +
        (interactive ? " glass-card--interactive" : "") +
        (className ? " " + className : "")
      }
    >
      {children}
    </Tag>
  );
}
