import { formCopy } from "../../data/copy.form";

const CONSENT_ID = "light-form-consent";
const ERROR_ID = `${CONSENT_ID}-error`;

/** Согласие на обработку данных: нативный чекбокс скрыт, галочку рисует свой бокс. */
export function ConsentCheckbox({
  checked,
  error,
  onChange,
  onBlur,
}: {
  checked: boolean;
  error?: string;
  onChange: (next: boolean) => void;
  onBlur: () => void;
}) {
  return (
    <div className="lf-consent">
      <label className="lf-check flex min-h-11 items-start gap-3" htmlFor={CONSENT_ID}>
        <input
          className="sr-only"
          id={CONSENT_ID}
          type="checkbox"
          name="consent"
          checked={checked}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? ERROR_ID : undefined}
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
        <span className="lf-check-text">{formCopy.consent}</span>
      </label>
      {error ? (
        <p className="lf-error" id={ERROR_ID}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
