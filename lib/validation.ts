/**
 * Form validation shared by the browser forms and the server actions.
 * The forms use it for inline messages; the server runs it again because
 * anything sent from a browser can be changed on the way.
 */

export type FieldErrors<K extends string = string> = Partial<Record<K, string>>;

export const LIMITS = {
  name: 80,
  password: { min: 8, max: 128 },
  company: 100,
  position: 100,
  location: 100,
  salary: 60,
  jobUrl: 2000,
  tagCount: 10,
  tagLength: 30,
  description: 1000,
  notes: 5000,
} as const;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function hasErrors(errors: FieldErrors): boolean {
  return Object.keys(errors).length > 0;
}

/** The first message, for places that can only show one. */
export function firstError(errors: FieldErrors): string | undefined {
  return Object.values(errors)[0];
}

// ---------- Sign in / sign up ----------

export type AuthField = "name" | "email" | "password";

export function validateAuth(
  mode: "signin" | "signup",
  values: { name?: string; email: string; password: string }
): FieldErrors<AuthField> {
  const errors: FieldErrors<AuthField> = {};
  const name = values.name?.trim() ?? "";
  const email = values.email.trim();

  if (mode === "signup") {
    if (!name) errors.name = "Enter your name.";
    else if (name.length > LIMITS.name) errors.name = `Use ${LIMITS.name} characters or fewer.`;
  }

  if (!email) errors.email = "Enter your email address.";
  else if (!EMAIL.test(email)) errors.email = "Enter an email address like name@example.com.";

  if (!values.password) {
    errors.password = "Enter your password.";
  } else if (mode === "signup") {
    // Only new passwords are checked for length; existing ones are checked by signing in.
    if (values.password.length < LIMITS.password.min) {
      errors.password = `Use at least ${LIMITS.password.min} characters.`;
    } else if (values.password.length > LIMITS.password.max) {
      errors.password = `Use ${LIMITS.password.max} characters or fewer.`;
    }
  }
  return errors;
}

// ---------- Job application ----------

export type JobField =
  | "company"
  | "position"
  | "location"
  | "salary"
  | "jobUrl"
  | "tags"
  | "description"
  | "notes";

export interface JobInput {
  company?: string;
  position?: string;
  location?: string;
  salary?: string;
  jobUrl?: string;
  tags?: string[];
  description?: string;
  notes?: string;
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (url.protocol === "http:" || url.protocol === "https:") && url.hostname.includes(".");
  } catch {
    return false;
  }
}

/**
 * Checks a job application. With `partial`, only the fields that are present
 * are checked (used when editing some fields of an existing card).
 */
export function validateJob(input: JobInput, { partial = false } = {}): FieldErrors<JobField> {
  const errors: FieldErrors<JobField> = {};
  const given = (key: keyof JobInput) => !partial || input[key] !== undefined;

  const text = (key: "company" | "position", label: string, max: number) => {
    if (!given(key)) return;
    const value = (input[key] ?? "").trim();
    if (!value) errors[key] = `Enter the ${label}.`;
    else if (value.length > max) errors[key] = `Use ${max} characters or fewer.`;
  };
  text("company", "company name", LIMITS.company);
  text("position", "position", LIMITS.position);

  const optional = (key: "location" | "salary" | "description" | "notes", max: number) => {
    const value = input[key];
    if (value !== undefined && value.length > max) errors[key] = `Use ${max} characters or fewer.`;
  };
  optional("location", LIMITS.location);
  optional("salary", LIMITS.salary);
  optional("description", LIMITS.description);
  optional("notes", LIMITS.notes);

  const url = input.jobUrl?.trim();
  if (url) {
    if (url.length > LIMITS.jobUrl) errors.jobUrl = "That link is too long.";
    else if (!isHttpUrl(url)) errors.jobUrl = "Enter a full link that starts with https://";
  }

  if (input.tags) {
    if (input.tags.length > LIMITS.tagCount) {
      errors.tags = `Use ${LIMITS.tagCount} tags or fewer.`;
    } else if (input.tags.some((tag) => tag.length > LIMITS.tagLength)) {
      errors.tags = `Keep each tag to ${LIMITS.tagLength} characters or fewer.`;
    }
  }
  return errors;
}
