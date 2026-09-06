import { LightForm } from "../form/LightForm";
import { MapSection } from "./MapSection";
import "./map.css";

/**
 * Лента карты и формы: одна скошенная подложка на две секции, как `#ov-map`
 * у оригинала. Пока у карты и формы были свои непрозрачные фоны, на их стыке
 * поверх скошенного низа карты проступала вторая, прямая линия, а нижний
 * ореол карты обрезался по верхней кромке формы.
 */
export function MapBand() {
  return (
    <div className="map-band">
      <MapSection />
      <LightForm />
    </div>
  );
}
