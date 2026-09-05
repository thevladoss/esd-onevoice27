import { useId } from "react";

import { formCopy } from "../../data/copy.form";
import type { LightType } from "../../lib/validation";

const OPTIONS: readonly { value: LightType; title: string; text: string }[] = [
  { value: "individual", ...formCopy.types.individual },
  { value: "group", ...formCopy.types.group },
];

/**
 * Две радио-карточки: нативные radio скрыты визуально (`sr-only`, а не `display: none`),
 * поэтому стрелки клавиатуры и фокус работают как обычно. Подпись связана с контролом
 * явным `htmlFor`: обёртка `label` осталась, но связку держит id, а не вложенность.
 */
export function LightTypeChoice({
  value,
  onChange,
}: {
  value: LightType;
  onChange: (next: LightType) => void;
}) {
  // Префикс на экземпляр: две формы на странице не делят id радио-карточек.
  const uid = useId();

  return (
    <fieldset className="lf-types">
      <legend className="lf-legend">{formCopy.typeLegend}</legend>
      {OPTIONS.map((option) => (
        <label
          key={option.value}
          className="lf-type"
          data-type={option.value}
          htmlFor={`${uid}-${option.value}`}
        >
          <input
            className="sr-only"
            id={`${uid}-${option.value}`}
            type="radio"
            name="lightType"
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
          />
          <span className="lf-type-title">{option.title}</span>
          <span className="lf-type-text">{option.text}</span>
          <span className="lf-type-dot" aria-hidden="true" />
        </label>
      ))}
    </fieldset>
  );
}
