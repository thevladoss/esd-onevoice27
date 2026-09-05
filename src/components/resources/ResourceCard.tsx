import type { CSSProperties, Ref } from "react";
import type { ResourceKey } from "../../data/copy.resources";
import { resourcesCopy } from "../../data/copy.resources";

/**
 * Карточка ресурса целиком кликабельна, но кнопка в ней — прозрачный слой поверх поверхности,
 * а не сама поверхность. Так заголовок остаётся `<h3>`, описание — `<p>`, и обход по заголовкам
 * ведёт к «Пойте вместе», «Будьте готовы» и «Смотрите и делитесь»: внутрь `<button>` ни то, ни
 * другое положить нельзя, её модель содержимого — только поточный контент.
 * Имя кнопке даёт `aria-labelledby` на этот же заголовок.
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
  const titleId = `resource-card-title-${kind}`;

  return (
    <div
      data-open={isOpen}
      style={{ "--accent": card.accent } as CSSProperties}
      className="resource-card glass relative flex min-h-64 w-full flex-col justify-between p-6 text-left transition-[transform,border-color] duration-[420ms] ease-header hover:border-[color:var(--accent)] motion-safe:hover:-translate-y-1 data-[open=true]:border-[color:var(--accent)]"
    >
      <p className="flex items-center justify-between">
        <span className="font-body text-xs font-bold uppercase leading-[1.4] tracking-[0.08em] text-paper/62">
          {card.label}
        </span>
        <span
          aria-hidden="true"
          className="resource-card__dot h-3 w-3 rounded-full bg-[color:var(--accent)]"
        />
      </p>

      <div>
        <h3
          id={titleId}
          className="font-display text-[22px] font-extrabold leading-[1.15] tracking-[-0.03em] text-paper"
        >
          {card.title}
        </h3>
        <p className="mt-2 font-body text-base leading-[1.5] text-paper/78">{card.description}</p>
        <span className="resource-card__trigger mt-4 inline-block font-body text-xs font-bold uppercase tracking-[0.08em] text-paper">
          {card.cta}
        </span>
      </div>

      {/* Слой во всю карточку: клик по любому месту поверхности раскрывает панель,
          а кольцо фокуса обводит карточку целиком, как и раньше. */}
      <button
        type="button"
        ref={ref}
        data-kind={kind}
        aria-expanded={isOpen}
        aria-labelledby={titleId}
        /* Панель одна на три карточки и живёт в DOM только раскрытой. Ссылку на неё держит
           лишь открытая карточка: у закрытых `aria-controls` указывал бы на несуществующий
           id, а при чужой раскрытой панели ещё и спорил бы с её состоянием. */
        aria-controls={isOpen ? "resources-panel" : undefined}
        onClick={onToggle}
        className="absolute inset-0 rounded-card focus-visible:outline-2 focus-visible:-outline-offset-3 focus-visible:outline-[color:var(--accent)]"
      />
    </div>
  );
}
