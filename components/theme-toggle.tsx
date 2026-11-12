"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { applyTheme, readPreference, THEME_STORAGE_KEY } from "@/lib/theme";

/**
 * A light/dark switch. Until the visitor uses it, the site follows the device
 * setting (and keeps following it live); after that their choice is saved.
 */
export default function ThemeToggle() {
  // false on the server; corrected after mount from the class the head script set.
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    // Sync with the theme the pre-paint script already applied.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDark(root.classList.contains("dark"));

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onSystemChange = () => {
      // Only follow the device while the visitor hasn't picked a theme.
      if (readPreference(window.localStorage) !== "system") return;
      applyTheme(root, mq.matches ? "dark" : "light");
      setDark(mq.matches);
    };
    mq.addEventListener("change", onSystemChange);
    return () => mq.removeEventListener("change", onSystemChange);
  }, []);

  function toggle() {
    const next = !document.documentElement.classList.contains("dark");
    applyTheme(document.documentElement, next ? "dark" : "light");
    setDark(next);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next ? "dark" : "light");
    } catch {
      // Storage blocked: the choice still applies for this visit.
    }
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      aria-label="Dark mode"
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={toggle}
      className="relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border border-rule bg-desk p-0.5 outline-none transition-colors hover:border-input focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
    >
      {/* The knob position comes from the `dark` class, so it is right before hydration too. */}
      <span
        aria-hidden="true"
        className="grid size-[1.375rem] place-items-center rounded-full bg-card text-ink shadow-[0_1px_2px_rgb(0_0_0/0.2)] transition-transform duration-200 dark:translate-x-5"
      >
        <Sun className="size-3.5 dark:hidden" />
        <Moon className="hidden size-3.5 dark:block" />
      </span>
    </button>
  );
}
