import { ESD_COUNTRIES } from "../../data/countries";
import { mapCopy } from "../../data/copy.map";
import "./map.css";

export interface CountryChipsProps {
  selectedId: number | null;
  onSelect: (id: number | null) => void;
  /** Карта не отрисовалась: выбирать нечего. */
  disabled?: boolean;
}

interface Chip {
  id: number | null;
  name: string;
}

const CHIPS: Chip[] = [
  { id: null, name: mapCopy.chips.all },
  ...ESD_COUNTRIES.map((country) => ({ id: country.id, name: country.name })),
];

export function CountryChips({ selectedId, onSelect, disabled = false }: CountryChipsProps) {
  return (
    <div
      role="group"
      aria-label={mapCopy.chips.groupLabel}
      className={"chips" + (disabled ? " is-disabled" : "")}
    >
      {CHIPS.map((chip) => (
        <button
          key={chip.id ?? "all"}
          type="button"
          className="chip"
          // Не нативный disabled: чип остаётся в таб-порядке и объясняет своё состояние.
          aria-disabled={disabled || undefined}
          aria-pressed={selectedId === chip.id}
          onClick={() => {
            if (!disabled) onSelect(chip.id);
          }}
        >
          {chip.name}
        </button>
      ))}
    </div>
  );
}
