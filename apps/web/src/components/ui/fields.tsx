import type {
  InputHTMLAttributes,
  LabelHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

/** Standard field label — one weight and color for every form in the app. */
export function Label({ className = "", children, ...rest }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className={`block text-sm font-medium text-ink-secondary ${className}`} {...rest}>
      {children}
    </label>
  );
}

export function Input({ className = "", ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`field-control ${className}`} {...rest} />;
}

export function Textarea({ className = "", ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`field-control ${className}`} {...rest} />;
}

export function Select({ className = "", children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={`field-control ${className}`} {...rest}>
      {children}
    </select>
  );
}

type FormFieldProps = {
  /** id of the control inside; ties the label and the error message to it. */
  htmlFor: string;
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
};

/**
 * Label + control + validation message with consistent spacing. The control
 * passed as children should set `aria-invalid` / `aria-describedby` itself
 * (see fieldErrorProps) so announcement behavior stays with the input.
 */
export function FormField({ htmlFor, label, error, hint, children }: FormFieldProps) {
  return (
    <div>
      <Label htmlFor={htmlFor}>{label}</Label>
      <div className="mt-1.5">{children}</div>
      {hint && !error ? <p className="mt-1.5 text-xs text-ink-muted">{hint}</p> : null}
      {error ? (
        <p id={`${htmlFor}-error`} className="mt-1.5 text-sm text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** aria attributes a control should spread when it may show a validation error. */
export function fieldErrorProps(id: string, error?: string) {
  return {
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? `${id}-error` : undefined,
  } as const;
}
