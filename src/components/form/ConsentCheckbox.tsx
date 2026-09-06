import { formCopy } from "../../data/copy.form";
import { RequiredMark } from "./FormField";

/**
 * Согласие на обработку данных: чекбокс нативный и видимый, цвет заливки даёт
 * `accent-color`, как в оригинале. id приходит сверху — тот же источник, по которому
 * форма ищет поле для фокуса.
 *
 * Label служит целью касания не ниже 44px (`.lf-check` в `light-form.css`) и связана
 * с чекбоксом через `htmlFor`, поэтому клик по тексту согласия переключает чекбокс
 * нативно, без собственного обработчика.
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
          className="lf-checkbox"
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
