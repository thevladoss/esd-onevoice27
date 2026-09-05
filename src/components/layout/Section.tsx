import type { ReactNode } from "react";
import type { SectionId } from "../../data/copy";
import { Eyebrow } from "./Eyebrow";
import { GradientTitle } from "./GradientTitle";

export function Section({
  id,
  eyebrow,
  title,
  titleId,
  children,
  className,
}: {
  id: SectionId;
  eyebrow?: string;
  title?: string;
  /**
   * Id заголовка секции. Секция ссылается на него через `aria-labelledby`, поэтому
   * скринридер называет её заголовком, а не «раздел». Секции, которые рисуют заголовок
   * сами (внутри обёртки появления), ставят тот же id на свой `GradientTitle`.
   */
  titleId?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={className} aria-labelledby={titleId}>
      <div className="mx-auto max-w-[72rem] px-4 py-16 md:px-8 md:py-24">
        {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
        {title ? (
          <GradientTitle as="h2" variant="section" className="mt-2" id={titleId}>
            {title}
          </GradientTitle>
        ) : null}
        {children ? <div className="mt-6">{children}</div> : null}
      </div>
    </section>
  );
}
