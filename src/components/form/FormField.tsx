import type { ReactNode } from "react";

import { formCopy } from "../../data/copy.form";

export interface FormControlProps {
  id: string;
  className: string;
  "aria-invalid": true | undefined;
  "aria-describedby": string | undefined;
  "aria-required": true | undefined;
}

/**
 * Пометка обязательного поля: звёздочка для глаза, слово для скринридера.
 * Пробел между ними обязателен — без него доступное имя склеится в «Имяобязательно».
 */
export function RequiredMark() {
  return (
    <>
      <span className="lf-required" title={formCopy.required.title} aria-hidden="true">
        <svg viewBox="0 0 12 12" focusable="false">
          <path
            d="M6 1v10M1.67 3.5l8.66 5M1.67 8.5l8.66-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </span>{" "}
      <span className="sr-only">{formCopy.required.hint}</span>
    </>
  );
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
  required,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  className?: string;
  required?: boolean;
  children: (control: FormControlProps) => ReactNode;
}) {
  const errorId = `${id}-error`;

  return (
    <div className={"lf-field" + (className ? " " + className : "")}>
      <label className="lf-label" htmlFor={id}>
        {label}
        {required ? <RequiredMark /> : null}
      </label>
      {children({
        id,
        className: "lf-control",
        "aria-invalid": error ? true : undefined,
        "aria-describedby": error ? errorId : undefined,
        "aria-required": required ? true : undefined,
      })}
      {error ? (
        <p className="lf-error" id={errorId}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
