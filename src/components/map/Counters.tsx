import { useRef } from "react";

import { mapCopy } from "../../data/copy.map";
import { formatCount } from "../../lib/format";
import { useCountUp } from "../../lib/useCountUp";
import { useInViewOnce } from "../../lib/useInViewOnce";
import { usePrefersReducedMotion } from "../../lib/useReducedMotion";
import { useLights } from "../../state/lights";
import "./map.css";

/** Счёт стартует, когда видно 40% блока со счётчиками. */
const COUNT_UP_THRESHOLD = 0.4;

export function Counters() {
  const { counts } = useLights();
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInViewOnce(rootRef, COUNT_UP_THRESHOLD);
  const reduced = usePrefersReducedMotion();
  const people = useCountUp(counts.people, { active: inView, reduced });
  const groups = useCountUp(counts.groups, { active: inView, reduced });

  return (
    // Живой регион один на обе карточки: два polite-региона ставили два объявления
    // в очередь на одно действие. Анимация счёта скрыта от него через aria-hidden.
    <div className="counters" ref={rootRef} aria-live="polite">
      <article className="counter counter--people">
        <p className="counter__label">
          <span className="counter__dot" aria-hidden="true" />
          {mapCopy.counters.people}
        </p>
        <p className="counter__value">
          <span aria-hidden="true">{formatCount(people)}</span>
          <span className="sr-only">{mapCopy.counters.peopleLive(formatCount(counts.people))}</span>
        </p>
      </article>
      <article className="counter counter--groups">
        <p className="counter__label">
          <span className="counter__dot" aria-hidden="true" />
          {mapCopy.counters.groups}
        </p>
        <p className="counter__value">
          <span aria-hidden="true">{formatCount(groups)}</span>
          <span className="sr-only">{mapCopy.counters.groupsLive(formatCount(counts.groups))}</span>
        </p>
      </article>
    </div>
  );
}
