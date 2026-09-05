import { useCallback, useState } from "react";

import { mapCopy } from "../../data/copy.map";
import { useLights } from "../../state/lights";
import { Eyebrow } from "../layout/Eyebrow";
import { Reveal } from "../layout/Reveal";
import { GradientTitle } from "../layout/GradientTitle";
import { CountryChips } from "./CountryChips";
import { Counters } from "./Counters";
import { EsdMap } from "./EsdMap";
import { ZoomHint } from "./ZoomHint";
import "./map.css";

/** Выбранная страна и номер полёта: по номеру карта отличает новый клик от повторного рендера. */
interface Selection {
  id: number | null;
  key: number;
}

export function MapSection() {
  const { lights } = useLights();
  const [selection, setSelection] = useState<Selection>({ id: null, key: 0 });
  const [mapError, setMapError] = useState(false);

  // Клик по уже активному чипу тоже растит номер: камера возвращается к стране.
  const handleSelect = useCallback((id: number | null) => {
    setSelection((prev) => ({ id, key: prev.key + 1 }));
  }, []);

  // Камеру увёл посетитель: снимаем подсветку, но полёт не заводим.
  const handleZoomAway = useCallback(() => {
    setSelection((prev) => (prev.id === null ? prev : { ...prev, id: null }));
  }, []);

  return (
    <section id="map" className="map-section" aria-labelledby="map-title">
      <div className="map-section__skew">
        <div className="map-section__inner">
          {/* div, а не header: внутри секции он читался бы вторым баннером страницы */}
          <Reveal className="map-section__header">
            <Eyebrow>{mapCopy.eyebrow}</Eyebrow>
            <GradientTitle as="h2" variant="section" id="map-title">
              {mapCopy.title}
            </GradientTitle>
          </Reveal>
          <CountryChips selectedId={selection.id} onSelect={handleSelect} disabled={mapError} />
          <div className="map-stage">
            {/* Каскад пары счётчиков живёт в самом `Counters`: контейнер `.counters`
                позиционируется поверх карты, и лишняя обёртка вокруг него схлопнулась бы
                в нулевую высоту, до порога IntersectionObserver дело бы не дошло. */}
            <Counters />
            {/* Обёртка снаружи контейнера карты: размеры контейнера читает ResizeObserver. */}
            <Reveal delay={0.1}>
              <div className="map-container">
                <EsdMap
                  lights={lights}
                  selectedCountryId={selection.id}
                  flightKey={selection.key}
                  onUserZoomAway={handleZoomAway}
                  onError={setMapError}
                />
              </div>
            </Reveal>
            <ZoomHint />
          </div>
        </div>
      </div>
    </section>
  );
}
