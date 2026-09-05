import type { CSSProperties, Ref } from "react";
import type { ResourceKey } from "../../data/copy.resources";
import { resourcesCopy } from "../../data/copy.resources";

/**
 * Карточка ресурса целиком кликабельна: вся поверхность — один `<button>`.
 * Триггер «Открыть …» нарисован `<span>`, потому что вложенная ссылка внутри кнопки
 * невалидна и ломает клавиатуру.
 */
export function ResourceCard({
  kind,
  isOpen,
  onToggle,
  ref,
}: {
  kind: ResourceKey;
  isOpen: boolean;
  onToggle: () => void;
  ref?: Ref<HTMLButtonElement>;
}) {
  const card = resourcesCopy.cards[kind];

  return (
    <button
      type="button"
      ref={ref}
      data-kind={kind}
      aria-expanded={isOpen}
      /* Панель одна на три карточки и живёт в DOM только раскрытой. Ссылку на неё держит
         лишь открытая карточка: у закрытых `aria-controls` указывал бы на несуществующий
         id, а при чужой раскрытой панели ещё и спорил бы с её состоянием. */
      aria-controls={isOpen ? "resources-panel" : undefined}
      onClick={onToggle}
      style={{ "--accent": card.accent } as CSSProperties}
      className="resource-card glass flex min-h-64 w-full flex-col justify-between p-6 text-left transition-[transform,border-color] duration-[420ms] ease-header hover:border-[color:var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--accent)] motion-safe:hover:-translate-y-1 aria-expanded:border-[color:var(--accent)]"
    >
      <span className="flex items-center justify-between">
        <span className="font-body text-xs font-bold uppercase leading-[1.4] tracking-[0.08em] text-paper/60">
          {card.label}
        </span>
        <span
          aria-hidden="true"
          className="resource-card__dot h-3 w-3 rounded-full bg-[color:var(--accent)]"
        />
      </span>

      <span className="block">
        <h3 className="font-display text-[22px] font-extrabold leading-[1.15] tracking-[-0.03em] text-paper">
          {card.title}
        </h3>
        <p className="mt-2 font-body text-base leading-[1.5] text-paper/80">{card.description}</p>
        <span className="resource-card__trigger mt-4 inline-block font-body text-xs font-bold uppercase tracking-[0.08em] text-paper">
          {card.cta}
        </span>
      </span>
    </button>
  );
}
