import { Label } from "./ui/label";

/** Props to spread on an input so screen readers announce its error. */
export function errorProps(id: string, error?: string) {
  return error ? { "aria-invalid": true as const, "aria-describedby": `${id}-error` } : {};
}

/** A labelled field with an optional hint and an inline error message. */
export default function FormField({
  label,
  htmlFor,
  required,
  hint,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={htmlFor} className="text-ink">
        {label}
        {required ? (
          <span className="font-normal text-graphite">(required)</span>
        ) : hint ? (
          <span className="font-normal text-graphite">{hint}</span>
        ) : null}
      </Label>
      {children}
      {error && (
        <p id={`${htmlFor}-error`} className="text-sm font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
