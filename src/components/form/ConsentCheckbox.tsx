import { formCopy } from "../../data/copy.form";
import { RequiredMark } from "./FormField";

/**
 * Согласие на обработку данных: нативный чекбокс скрыт, галочку рисует свой бокс.
 * id приходит сверху — тот же источник, по которому форма ищет поле для фокуса.
 */
export function ConsentCheckbox({
  id,
  checked,
  error,
  onChange,
  onBlur,
}: {
  id: string;
  checked: boolean;
  error?: string;
  onChange: (next: boolean) => void;
  onBlur: () => void;
}) {
  const errorId = `${id}-error`;

  return (
    <div className="lf-consent">
      <label className="lf-check" htmlFor={id}>
        <input
          className="sr-only"
          id={id}
          type="checkbox"
          name="consent"
          checked={checked}
          aria-required={true}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          onChange={(event) => onChange(event.target.checked)}
          onBlur={onBlur}
        />
        <span className="lf-check-box" aria-hidden="true">
          <svg viewBox="0 0 12 12" focusable="false">
            <path
              d="M1 6.2 4.4 9.4 11 2.6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <span className="lf-check-text">
          {formCopy.consent}
          <RequiredMark />
        </span>
      </label>
      {error ? (
        <p className="lf-error" id={errorId}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
