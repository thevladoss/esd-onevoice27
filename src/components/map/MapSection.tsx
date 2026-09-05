import { useState } from "react";

import { mapCopy } from "../../data/copy.map";
import { useLights } from "../../state/lights";
import { Eyebrow } from "../layout/Eyebrow";
import { GradientTitle } from "../layout/GradientTitle";
import { CountryChips } from "./CountryChips";
import { Counters } from "./Counters";
import { EsdMap } from "./EsdMap";
import { ZoomHint } from "./ZoomHint";
import "./map.css";

export function MapSection() {
  const { lights } = useLights();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [mapError, setMapError] = useState(false);

  return (
    <section id="map" className="map-section">
      <div className="map-section__skew">
        <div className="map-section__inner">
          {/* div, а не header: внутри секции он читался бы вторым баннером страницы */}
          <div className="map-section__header">
            <Eyebrow>{mapCopy.eyebrow}</Eyebrow>
            <GradientTitle as="h2" variant="section">
              {mapCopy.title}
            </GradientTitle>
          </div>
          <CountryChips selectedId={selectedId} onSelect={setSelectedId} disabled={mapError} />
          <div className="map-stage">
            <Counters />
            <div className="map-container">
              <EsdMap
                lights={lights}
                selectedCountryId={selectedId}
                onUserZoomAway={() => setSelectedId(null)}
                onError={setMapError}
              />
            </div>
            <ZoomHint />
          </div>
        </div>
      </div>
    </section>
  );
}
