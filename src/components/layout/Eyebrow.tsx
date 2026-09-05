import type { ReactNode } from "react";

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={
        "eyebrow font-body text-xs font-bold uppercase tracking-[0.1em] leading-[1.4] text-horizon-200" +
        (className ? " " + className : "")
      }
    >
      {children}
    </p>
  );
}
