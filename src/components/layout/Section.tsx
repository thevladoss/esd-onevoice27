import type { ReactNode } from "react";
import type { SectionId } from "../../data/copy";
import { Eyebrow } from "./Eyebrow";
import { GradientTitle } from "./GradientTitle";

export function Section({
  id,
  eyebrow,
  title,
  children,
  className,
}: {
  id: SectionId;
  eyebrow?: string;
  title?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={className}>
      <div className="mx-auto max-w-[72rem] px-4 py-16 md:px-8 md:py-24">
        {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
        {title ? (
          <GradientTitle as="h2" variant="section" className="mt-2">
            {title}
          </GradientTitle>
        ) : null}
        {children ? <div className="mt-6">{children}</div> : null}
      </div>
    </section>
  );
}
