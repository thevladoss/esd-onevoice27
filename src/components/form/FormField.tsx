import type { ReactNode } from "react";

export interface FormControlProps {
  id: string;
  className: string;
  "aria-invalid": true | undefined;
  "aria-describedby": string | undefined;
}

/**
 * Подпись, контрол и текст ошибки одной связкой: id ошибки выводится из id поля,
 * поэтому aria-describedby никогда не расходится с разметкой.
 */
export function FormField({
  id,
  label,
  error,
  className,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  className?: string;
  children: (control: FormControlProps) => ReactNode;
}) {
  const errorId = `${id}-error`;

  return (
    <div className={"lf-field" + (className ? " " + className : "")}>
      <label className="lf-label" htmlFor={id}>
        {label}
      </label>
      {children({
        id,
        className: "lf-control",
        "aria-invalid": error ? true : undefined,
        "aria-describedby": error ? errorId : undefined,
      })}
      {error ? (
        <p className="lf-error" id={errorId}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
