import { mapCopy } from "../../data/copy.map";
import { useLights } from "../../state/lights";
import { Eyebrow } from "../layout/Eyebrow";
import { GradientTitle } from "../layout/GradientTitle";
import { Counters } from "./Counters";
import { EsdMap } from "./EsdMap";
import "./map.css";

export function MapSection() {
  const { lights } = useLights();

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
          <div className="map-stage">
            <Counters />
            <div className="map-container">
              <EsdMap lights={lights} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
