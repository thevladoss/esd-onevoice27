import type { ReactNode } from "react";
import type { InvolveCardId } from "../../data/copy.involve";

export function InvolveCard({
  id,
  title,
  action,
  href,
  art,
}: {
  id: InvolveCardId;
  title: string;
  action: string;
  href: string;
  art: ReactNode;
}) {
  return (
    <article className="inv-card" data-card={id}>
      <div className="inv-media" aria-hidden="true">
        {art}
      </div>
      <div className="inv-body flex flex-col gap-4 p-8">
        <h3 className="inv-title font-display">{title}</h3>
        <a className="inv-action font-body" href={href}>
          {action}
          <span className="inv-arrow" aria-hidden="true">
            →
          </span>
        </a>
      </div>
    </article>
  );
}
