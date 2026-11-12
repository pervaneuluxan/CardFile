import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  applyTheme,
  readPreference,
  resolveTheme,
  THEME_STORAGE_KEY,
  themeInitScript,
} from "@/lib/theme";
import ThemeToggle from "@/components/theme-toggle";

function mockSystemDark(dark: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: dark && query.includes("dark"),
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

const root = document.documentElement;

beforeEach(() => {
  localStorage.clear();
  root.className = "";
  root.style.colorScheme = "";
  mockSystemDark(false);
});
afterEach(() => localStorage.clear());

describe("resolveTheme", () => {
  it("uses an explicit choice as-is", () => {
    expect(resolveTheme("dark", false)).toBe("dark");
    expect(resolveTheme("light", true)).toBe("light");
  });
  it("follows the system for 'system'", () => {
    expect(resolveTheme("system", true)).toBe("dark");
    expect(resolveTheme("system", false)).toBe("light");
  });
});

describe("readPreference", () => {
  it("reads a saved value", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "dark");
    expect(readPreference(localStorage)).toBe("dark");
  });
  it("falls back to system for missing, invalid or blocked storage", () => {
    expect(readPreference(localStorage)).toBe("system");
    localStorage.setItem(THEME_STORAGE_KEY, "purple");
    expect(readPreference(localStorage)).toBe("system");
    expect(readPreference({ getItem: () => { throw new Error("blocked"); } })).toBe("system");
    expect(readPreference(undefined)).toBe("system");
  });
});

describe("applyTheme", () => {
  it("toggles the dark class and colour-scheme", () => {
    applyTheme(root, "dark");
    expect(root).toHaveClass("dark");
    expect(root.style.colorScheme).toBe("dark");
    applyTheme(root, "light");
    expect(root).not.toHaveClass("dark");
    expect(root.style.colorScheme).toBe("light");
  });
});

describe("themeInitScript (runs before paint)", () => {
  const run = () => new Function(themeInitScript)();

  it("applies a saved dark choice", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "dark");
    run();
    expect(root).toHaveClass("dark");
  });

  it("follows the system when nothing is saved", () => {
    mockSystemDark(true);
    run();
    expect(root).toHaveClass("dark");
  });

  it("a saved light choice beats a dark system", () => {
    mockSystemDark(true);
    localStorage.setItem(THEME_STORAGE_KEY, "light");
    run();
    expect(root).not.toHaveClass("dark");
  });
});

describe("ThemeToggle", () => {
  it("starts from the device setting when nothing is saved", async () => {
    root.classList.add("dark"); // as the head script would for a dark device
    render(<ThemeToggle />);
    expect(await screen.findByRole("switch", { name: "Dark mode" })).toHaveAttribute("aria-checked", "true");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
  });

  it("flips between light and dark and saves the choice", async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);
    const toggle = screen.getByRole("switch", { name: "Dark mode" });
    expect(toggle).toHaveAttribute("aria-checked", "false");

    await user.click(toggle);
    expect(root).toHaveClass("dark");
    expect(toggle).toHaveAttribute("aria-checked", "true");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");

    await user.click(toggle);
    expect(root).not.toHaveClass("dark");
    expect(toggle).toHaveAttribute("aria-checked", "false");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
  });

  it("works from the keyboard", async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);
    await user.tab();
    await user.keyboard(" ");
    expect(root).toHaveClass("dark");
  });
});
