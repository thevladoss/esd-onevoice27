import { formCopy } from "../../data/copy.form";
import type { LightType, LightTypeValue } from "../../lib/validation";

const OPTIONS: readonly { value: LightType; title: string; text: string }[] = [
  { value: "individual", ...formCopy.types.individual },
  { value: "group", ...formCopy.types.group },
];

/**
 * Две радио-карточки: нативные radio скрыты визуально (`sr-only`, а не `display: none`),
 * поэтому стрелки клавиатуры и фокус работают как обычно. Подпись связана с контролом
 * явным `htmlFor`: обёртка `label` осталась, но связку держит id, а не вложенность.
 *
 * id и текст ошибки приходят сверху, как у `ConsentCheckbox`: по тому же id форма ищет
 * группу, когда уводит фокус на первое невалидное поле.
 */
export function LightTypeChoice({
  id,
  value,
  error,
  onChange,
}: {
  id: string;
  value: LightTypeValue;
  error?: string;
  onChange: (next: LightType) => void;
}) {
  const errorId = `${id}-error`;
  const legendId = `${id}-legend`;

  return (
    // Роль radiogroup, а не group: на роли group атрибут aria-invalid не разрешён.
    // tabIndex -1 делает группу целью фокуса, и скринридер читает legend вместе с ошибкой.
    <fieldset
      className="lf-types"
      id={id}
      role="radiogroup"
      tabIndex={-1}
      aria-labelledby={legendId}
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? errorId : undefined}
    >
      <legend id={legendId} className="sr-only">
        {formCopy.typeLegend}
      </legend>
      {OPTIONS.map((option) => (
        <label
          key={option.value}
          className="lf-type"
          data-type={option.value}
          htmlFor={`${id}-${option.value}`}
        >
          <input
            className="sr-only"
            id={`${id}-${option.value}`}
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
      {error ? (
        <p className="lf-error" id={errorId}>
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
