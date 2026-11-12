"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import FormField, { errorProps } from "@/components/form-field";
import { type AuthField, type FieldErrors, hasErrors, LIMITS, validateAuth } from "@/lib/validation";
import { signIn, signUp } from "@/lib/auth/auth-client";

type Mode = "signin" | "signup";

const COPY: Record<
  Mode,
  {
    title: string;
    lede: string;
    submit: string;
    pending: string;
    fallbackError: string;
    switchPrompt: string;
    switchLabel: string;
    switchHref: string;
  }
> = {
  signin: {
    title: "Sign in",
    lede: "Pick up your board where you left it.",
    submit: "Sign in",
    pending: "Signing in…",
    fallbackError: "Couldn't sign in. Check your email and password and try again.",
    switchPrompt: "New here?",
    switchLabel: "Create an account",
    switchHref: "/signup",
  },
  signup: {
    title: "Create your board",
    lede: "You'll start with five columns: Wish List, Applied, Interviewing, Offer and Rejected.",
    submit: "Create account",
    pending: "Creating account…",
    fallbackError: "Couldn't create your account. Try again in a moment.",
    switchPrompt: "Already have an account?",
    switchLabel: "Sign in",
    switchHref: "/signin",
  },
};

export default function AuthForm({ mode }: { mode: Mode }) {
  const copy = COPY[mode];
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<AuthField>>({});
  const [submitted, setSubmitted] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  function readForm(form: HTMLFormElement) {
    // Read from the form, not React state: anything typed before hydration is kept.
    const data = new FormData(form);
    return {
      name: String(data.get("name") ?? ""),
      email: String(data.get("email") ?? ""),
      password: String(data.get("password") ?? ""),
    };
  }

  // After the first submit, messages update as the user corrects each field.
  function handleChange(e: React.FormEvent<HTMLFormElement>) {
    if (submitted) setFieldErrors(validateAuth(mode, readForm(e.currentTarget)));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const { name, email, password } = readForm(e.currentTarget);
    const errors = validateAuth(mode, { name, email, password });
    setSubmitted(true);
    setFieldErrors(errors);
    setError(null);
    if (hasErrors(errors)) {
      const first = Object.keys(errors)[0];
      formRef.current?.querySelector<HTMLElement>(`#${first}`)?.focus();
      return;
    }
    setLoading(true);
    try {
      const result =
        mode === "signup"
          ? await signUp.email({ name: name.trim(), email: email.trim(), password })
          : await signIn.email({ email: email.trim(), password });

      if (result?.error) {
        setError(result.error.message || copy.fallbackError);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError(copy.fallbackError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 items-start justify-center px-4 py-12 sm:items-center">
      <div className="platform w-full max-w-md">
        <div className="px-6 pt-7 sm:px-8 sm:pt-8">
          <h1 className="font-heading text-4xl font-extrabold leading-none text-ink">{copy.title}</h1>
          <p className="mt-2 text-graphite">{copy.lede}</p>
        </div>

        {/* noValidate: our own messages replace the browser's pop-up bubbles. */}
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          onChange={handleChange}
          noValidate
          className="grid gap-4 px-6 pb-6 pt-5 sm:px-8 sm:pb-8"
        >
          {error && (
            <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          {mode === "signup" && (
            <FormField label="Name" htmlFor="name" error={fieldErrors.name}>
              <Input
                id="name"
                name="name"
                autoComplete="name"
                required
                maxLength={LIMITS.name}
                className="h-10"
                {...errorProps("name", fieldErrors.name)}
              />
            </FormField>
          )}
          <FormField label="Email" htmlFor="email" error={fieldErrors.email}>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              required
              className="h-10"
              {...errorProps("email", fieldErrors.email)}
            />
          </FormField>
          <FormField
            label="Password"
            htmlFor="password"
            hint={mode === "signup" ? `At least ${LIMITS.password.min} characters` : undefined}
            error={fieldErrors.password}
          >
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              required
              minLength={LIMITS.password.min}
              maxLength={LIMITS.password.max}
              className="h-10"
              {...errorProps("password", fieldErrors.password)}
            />
          </FormField>

          <Button type="submit" className="mt-2 h-11 w-full text-base" disabled={loading}>
            {loading ? copy.pending : copy.submit}
          </Button>

          <p className="text-center text-sm text-graphite">
            {copy.switchPrompt}{" "}
            <Link href={copy.switchHref} className="font-medium text-ink underline underline-offset-2">
              {copy.switchLabel}
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
