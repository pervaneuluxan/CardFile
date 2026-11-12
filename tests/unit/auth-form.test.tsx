import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const push = vi.fn();
const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, refresh }) }));

const signInEmail = vi.fn();
const signUpEmail = vi.fn();
vi.mock("@/lib/auth/auth-client", () => ({
  signIn: { email: (...a: unknown[]) => signInEmail(...a) },
  signUp: { email: (...a: unknown[]) => signUpEmail(...a) },
}));

import AuthForm from "@/components/auth-form";

beforeEach(() => {
  signInEmail.mockResolvedValue({ data: {}, error: null });
  signUpEmail.mockResolvedValue({ data: {}, error: null });
});

describe("AuthForm (sign in)", () => {
  it("is titled Sign in and has no name field", () => {
    render(<AuthForm mode="signin" />);
    expect(screen.getByRole("heading", { name: "Sign in" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Name")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Create an account" })).toHaveAttribute("href", "/signup");
  });

  it("signs in and goes to the board", async () => {
    const user = userEvent.setup();
    render(<AuthForm mode="signin" />);
    await user.type(screen.getByLabelText("Email"), " ada@example.com ");
    await user.type(screen.getByLabelText(/password/i), "correct-horse");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(signInEmail).toHaveBeenCalledWith({ email: "ada@example.com", password: "correct-horse" });
    expect(push).toHaveBeenCalledWith("/dashboard");
  });

  it("shows the auth error and stays on the page", async () => {
    signInEmail.mockResolvedValue({ data: null, error: { message: "Invalid email or password" } });
    const user = userEvent.setup();
    render(<AuthForm mode="signin" />);
    await user.type(screen.getByLabelText("Email"), "ada@example.com");
    await user.type(screen.getByLabelText(/password/i), "wrong-pass");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid email or password");
    expect(push).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Sign in" })).toBeEnabled();
  });

  it("falls back to a specific message when the request throws", async () => {
    signInEmail.mockRejectedValue(new Error("network"));
    const user = userEvent.setup();
    render(<AuthForm mode="signin" />);
    await user.type(screen.getByLabelText("Email"), "ada@example.com");
    await user.type(screen.getByLabelText(/password/i), "whatever1");
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/couldn't sign in/i);
  });
});

describe("AuthForm (sign up)", () => {
  it("requires name, email and an 8+ character password", () => {
    render(<AuthForm mode="signup" />);
    expect(screen.getByLabelText("Name")).toBeRequired();
    expect(screen.getByLabelText("Email")).toBeRequired();
    expect(screen.getByLabelText(/password/i)).toHaveAttribute("minLength", "8");
  });

  it("creates the account and goes to the board", async () => {
    const user = userEvent.setup();
    render(<AuthForm mode="signup" />);
    await user.type(screen.getByLabelText("Name"), "Ada Lovelace ");
    await user.type(screen.getByLabelText("Email"), "ada@example.com");
    await user.type(screen.getByLabelText(/password/i), "correct-horse");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(signUpEmail).toHaveBeenCalledWith({ name: "Ada Lovelace", email: "ada@example.com", password: "correct-horse" });
    expect(push).toHaveBeenCalledWith("/dashboard");
  });
});

describe("AuthForm validation", () => {
  it("names each problem inline and does not call the server", async () => {
    const user = userEvent.setup();
    render(<AuthForm mode="signup" />);
    await user.type(screen.getByLabelText("Email"), "ada@example");
    await user.type(screen.getByLabelText(/password/i), "short");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    const name = screen.getByLabelText("Name");
    expect(name).toHaveAccessibleDescription("Enter your name.");
    expect(name).toHaveFocus();
    expect(screen.getByLabelText("Email")).toHaveAccessibleDescription("Enter an email address like name@example.com.");
    expect(screen.getByLabelText(/password/i)).toHaveAccessibleDescription("Use at least 8 characters.");
    expect(signUpEmail).not.toHaveBeenCalled();
  });

  it("clears messages as fields are corrected, then submits", async () => {
    const user = userEvent.setup();
    render(<AuthForm mode="signin" />);
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    const email = screen.getByLabelText("Email");
    expect(email).toBeInvalid();

    await user.type(email, "ada@example.com");
    expect(email).toBeValid();
    await user.type(screen.getByLabelText(/password/i), "correct-horse");
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(signInEmail).toHaveBeenCalledTimes(1);
  });
});

