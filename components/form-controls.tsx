import type { ReactNode } from "react";

const controlClass =
  "w-full rounded-xl border bg-white px-3.5 text-base text-ink outline-none transition-colors placeholder:text-muted/80 focus:border-accent focus:ring-4 focus:ring-accent/10";

type FieldProps = {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  wide?: boolean;
  children: ReactNode;
};

export function Field({ id, label, required, error, wide, children }: FieldProps) {
  return (
    <div className={`flex flex-col gap-1.5 ${wide ? "sm:col-span-2" : ""}`}>
      <label htmlFor={id} className="text-sm font-medium text-ink/90">
        {label}
        {required ? <span aria-hidden="true"> *</span> : null}
        {required ? <span className="sr-only"> (obligatorio)</span> : null}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

type TextInputProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  wide?: boolean;
  type?: "text" | "email" | "tel" | "date" | "time";
  placeholder?: string;
  autoComplete?: string;
  maxLength?: number;
  readOnly?: boolean;
};

export function TextInput({
  id,
  label,
  value,
  onChange,
  error,
  required,
  wide,
  type = "text",
  placeholder,
  autoComplete = "off",
  maxLength,
  readOnly = false,
}: TextInputProps) {
  const invalid = Boolean(error);

  return (
    <Field id={id} label={label} required={required} error={error} wide={wide}>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        autoComplete={autoComplete}
        maxLength={maxLength}
        readOnly={readOnly}
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? `${id}-error` : undefined}
        onChange={(event) => onChange(event.target.value)}
        className={`${controlClass} h-12 ${readOnly ? "bg-background text-muted" : ""} ${invalid ? "border-danger focus:border-danger focus:ring-danger/10" : "border-line"}`}
      />
    </Field>
  );
}

type TextAreaProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
  maxLength?: number;
  rows?: number;
};

export function TextArea({
  id,
  label,
  value,
  onChange,
  error,
  required,
  placeholder,
  maxLength,
  rows = 4,
}: TextAreaProps) {
  const invalid = Boolean(error);

  return (
    <Field id={id} label={label} required={required} error={error} wide>
      <textarea
        id={id}
        name={id}
        value={value}
        required={required}
        placeholder={placeholder}
        maxLength={maxLength}
        rows={rows}
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? `${id}-error` : undefined}
        onChange={(event) => onChange(event.target.value)}
        className={`${controlClass} min-h-28 py-3 leading-6 ${invalid ? "border-danger focus:border-danger focus:ring-danger/10" : "border-line"}`}
      />
    </Field>
  );
}

type SelectInputProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  error?: string;
  required?: boolean;
  wide?: boolean;
};

export function SelectInput({
  id,
  label,
  value,
  onChange,
  options,
  error,
  required,
  wide,
}: SelectInputProps) {
  const invalid = Boolean(error);

  return (
    <Field id={id} label={label} required={required} error={error} wide={wide}>
      <select
        id={id}
        name={id}
        value={value}
        required={required}
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? `${id}-error` : undefined}
        onChange={(event) => onChange(event.target.value)}
        className={`${controlClass} h-12 ${invalid ? "border-danger focus:border-danger focus:ring-danger/10" : "border-line"}`}
      >
        {options.map((option) => (
          <option key={option.value || "empty"} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  );
}
