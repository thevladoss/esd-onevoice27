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
      data-kind={kind}
      style={{ "--accent": card.accent } as CSSProperties}
      className="resource-card glass glass-resource"
    >
      <p className="resource-card__indicator">
        <span>{card.label}</span>
        <span aria-hidden="true" className="resource-card__dot" />
      </p>

      <div className="resource-card__content">
        <h3 id={titleId} className="resource-card__title">
          {card.title}
        </h3>
        <p className="resource-card__description">{card.description}</p>
        <div className="resource-card__actions">
          <span className="resource-card__trigger">{card.cta}</span>
        </div>
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
