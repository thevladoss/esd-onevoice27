import type { KeyboardEventHandler, Ref } from "react";
import type { ResourceKey } from "../../data/copy.resources";
import { resourcesCopy } from "../../data/copy.resources";
import { MaterialsList } from "./MaterialsList";
import { MusicPlaceholder } from "./MusicPlaceholder";
import { VideoGrid } from "./VideoGrid";

/**
 * Панель под сеткой карточек. Стеклянная поверхность взята утилитой `.glass`, а не компонентом
 * `GlassCard`: панели нужны собственные `role`, `tabIndex` и `ref`.
 */
export function ResourcePanel({
  kind,
  onClose,
  ref,
  onKeyDown,
}: {
  kind: ResourceKey;
  onClose: () => void;
  ref?: Ref<HTMLDivElement>;
  onKeyDown?: KeyboardEventHandler<HTMLDivElement>;
}) {
  const card = resourcesCopy.cards[kind];

  return (
    <div
      ref={ref}
      id="resources-panel"
      role="region"
      aria-labelledby="resources-panel-title"
      tabIndex={-1}
      onKeyDown={onKeyDown}
      data-kind={kind}
      className="resources-panel glass relative p-6 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-horizon-400 md:p-8"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-body text-xs font-bold uppercase leading-[1.4] tracking-[0.08em] text-paper/62">
            {card.label}
          </p>
          <h3
            id="resources-panel-title"
            className="font-display text-[22px] font-extrabold leading-[1.15] tracking-[-0.03em] text-paper"
          >
            {card.title}
          </h3>
          <p className="mt-2 font-body text-base leading-[1.5] text-paper/78">{card.description}</p>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label={resourcesCopy.panel.closeLabel}
          className="flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-2 rounded-lg px-3 text-paper/78 transition-colors duration-[240ms] ease-ui hover:bg-paper/[.06] hover:text-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-horizon-400"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.6}
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="m5 5 10 10M15 5 5 15" />
          </svg>
          <span className="hidden font-body text-xs font-bold uppercase tracking-[0.08em] md:inline">
            {resourcesCopy.panel.close}
          </span>
        </button>
      </div>

      <div className="mt-6">
        {kind === "materials" ? <MaterialsList /> : null}
        {/* Колонки задаёт панель: на 390px шестнадцать роликов идут в две колонки. */}
        {kind === "video" ? (
          <VideoGrid className="grid-cols-2 md:grid-cols-3 lg:grid-cols-4" />
        ) : null}
        {kind === "music" ? <MusicPlaceholder /> : null}
      </div>
    </div>
  );
}
