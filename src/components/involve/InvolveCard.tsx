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
      <div className="inv-body">
        <h3 className="inv-title">{title}</h3>
        <a className="inv-action" href={href}>
          {action}
          <span className="inv-arrow" aria-hidden="true">
            →
          </span>
        </a>
      </div>
    </article>
  );
}
