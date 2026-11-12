"use client";

import { useRef, useState } from "react";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { DialogFooter } from "./ui/dialog";
import { parseTags } from "@/lib/board-utils";
import { type FieldErrors, hasErrors, type JobField, LIMITS, validateJob } from "@/lib/validation";
import FormField, { errorProps } from "./form-field";

export interface JobFormValues {
  company: string;
  position: string;
  location: string;
  salary: string;
  jobUrl: string;
  tags: string;
  description: string;
  notes: string;
}

export const EMPTY_JOB_FORM: JobFormValues = {
  company: "",
  position: "",
  location: "",
  salary: "",
  jobUrl: "",
  tags: "",
  description: "",
  notes: "",
};

export type JobFormPayload = Omit<JobFormValues, "tags"> & { tags: string[] };

export function toPayload(values: JobFormValues): JobFormPayload {
  return {
    ...values,
    company: values.company.trim(),
    position: values.position.trim(),
    location: values.location.trim(),
    salary: values.salary.trim(),
    jobUrl: values.jobUrl.trim(),
    tags: parseTags(values.tags),
  };
}

interface JobFormProps {
  initialValues?: JobFormValues;
  submitLabel: string;
  pendingLabel: string;
  onSubmit: (
    payload: JobFormPayload
  ) => Promise<{ error?: string; fieldErrors?: FieldErrors<JobField> } | undefined | void>;
  onCancel: () => void;
  /** Prefix for input ids so several forms can share a page. */
  idPrefix: string;
}

export default function JobForm({
  initialValues = EMPTY_JOB_FORM,
  submitLabel,
  pendingLabel,
  onSubmit,
  onCancel,
  idPrefix,
}: JobFormProps) {
  const [values, setValues] = useState<JobFormValues>(initialValues);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<JobField>>({});
  // Before the first submit the form stays quiet; after it, messages update as the user types.
  const [submitted, setSubmitted] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const id = (name: keyof JobFormValues) => `${idPrefix}-${name}`;
  const bind = (name: keyof JobFormValues) => ({
    id: id(name),
    name,
    value: values[name],
    ...errorProps(id(name), fieldErrors[name]),
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const next = { ...values, [name]: e.target.value };
      setValues(next);
      if (submitted) setFieldErrors(validateJob(toPayload(next)));
    },
  });

  function focusFirstInvalid(errors: FieldErrors<JobField>) {
    const first = Object.keys(errors)[0] as keyof JobFormValues | undefined;
    if (first) formRef.current?.querySelector<HTMLElement>(`#${CSS.escape(id(first))}`)?.focus();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = toPayload(values);
    const errors = validateJob(payload);
    setSubmitted(true);
    setFieldErrors(errors);
    setError(null);
    if (hasErrors(errors)) {
      focusFirstInvalid(errors);
      return;
    }

    setPending(true);
    try {
      const result = await onSubmit(payload);
      if (result?.fieldErrors && hasErrors(result.fieldErrors)) {
        setFieldErrors(result.fieldErrors);
        focusFirstInvalid(result.fieldErrors);
      } else if (result && result.error) {
        setError(result.error);
      }
    } catch {
      setError("Couldn't save. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    // noValidate: our own messages replace the browser's pop-up bubbles.
    <form ref={formRef} onSubmit={handleSubmit} className="grid gap-4" noValidate>
      {error && (
        <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Company" htmlFor={id("company")} required error={fieldErrors.company}>
          <Input {...bind("company")} required maxLength={LIMITS.company} autoComplete="organization" />
        </FormField>
        <FormField label="Position" htmlFor={id("position")} required error={fieldErrors.position}>
          <Input {...bind("position")} required maxLength={LIMITS.position} />
        </FormField>
        <FormField label="Location" htmlFor={id("location")} error={fieldErrors.location}>
          <Input {...bind("location")} maxLength={LIMITS.location} placeholder="e.g. London, or Remote" />
        </FormField>
        <FormField label="Salary" htmlFor={id("salary")} error={fieldErrors.salary}>
          <Input {...bind("salary")} maxLength={LIMITS.salary} placeholder="e.g. $120k–$150k" />
        </FormField>
      </div>
      <FormField label="Job posting link" htmlFor={id("jobUrl")} error={fieldErrors.jobUrl}>
        <Input {...bind("jobUrl")} type="url" inputMode="url" placeholder="https://" />
      </FormField>
      <FormField label="Tags" htmlFor={id("tags")} hint="Separate with commas" error={fieldErrors.tags}>
        <Input {...bind("tags")} placeholder="e.g. React, Remote, Referral" />
      </FormField>
      <FormField label="Description" htmlFor={id("description")} error={fieldErrors.description}>
        <Textarea {...bind("description")} rows={3} maxLength={LIMITS.description} placeholder="What the role involves" />
      </FormField>
      <FormField label="Notes" htmlFor={id("notes")} error={fieldErrors.notes}>
        <Textarea {...bind("notes")} rows={3} maxLength={LIMITS.notes} placeholder="Recruiter name, next steps, follow-up dates" />
      </FormField>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? pendingLabel : submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}
