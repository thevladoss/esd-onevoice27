import { mapCopy } from "../../data/copy.map";
import { formatCount } from "../../lib/format";
import { useLights } from "../../state/lights";
import "./map.css";

export function Counters() {
  const { counts } = useLights();

  return (
    <div className="counters">
      <article className="counter counter--people">
        <p className="counter__label">
          <span className="counter__dot" aria-hidden="true" />
          {mapCopy.counters.people}
        </p>
        <p className="counter__value">
          <span aria-live="polite">{formatCount(counts.people)}</span>
        </p>
      </article>
      <article className="counter counter--groups">
        <p className="counter__label">
          <span className="counter__dot" aria-hidden="true" />
          {mapCopy.counters.groups}
        </p>
        <p className="counter__value">
          <span aria-live="polite">{formatCount(counts.groups)}</span>
        </p>
      </article>
    </div>
  );
}
