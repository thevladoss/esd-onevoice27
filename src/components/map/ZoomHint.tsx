import { mapCopy } from "../../data/copy.map";
import "./map.css";

/** Подсказка о жестах: обычный текст, а не title, иначе её не прочитает скринридер. */
export function ZoomHint() {
  return (
    <p className="map-hint">
      <span className="map-hint__pointer">{mapCopy.hint.pointer}</span>
      <span className="map-hint__touch">{mapCopy.hint.touch}</span>
    </p>
  );
}
