"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";

export const COOKIE_NOTICE_KEY = "cardfile-cookie-notice";

/**
 * Tells visitors what the site stores, once. The app only uses a sign-in
 * cookie and a saved theme choice, both needed for it to work, so there is
 * nothing to accept or reject: the notice informs and can be dismissed.
 */
export default function CookieNotice() {
  // Hidden until we know it hasn't been dismissed (storage is unavailable on the server).
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (window.localStorage.getItem(COOKIE_NOTICE_KEY) !== "dismissed") setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  // Reserve room at the bottom of the page so the notice never covers the footer.
  useEffect(() => {
    const root = document.documentElement;
    const el = ref.current;
    if (!visible || !el) {
      root.style.removeProperty("--cookie-notice-height");
      return;
    }
    const sync = () => root.style.setProperty("--cookie-notice-height", `${el.offsetHeight}px`);
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(el);
    return () => {
      observer.disconnect();
      root.style.removeProperty("--cookie-notice-height");
    };
  }, [visible]);

  function dismiss() {
    setVisible(false);
    try {
      window.localStorage.setItem(COOKIE_NOTICE_KEY, "dismissed");
    } catch {
      // Storage blocked: the notice will show again next visit.
    }
  }

  if (!visible) return null;

  return (
    <div
      ref={ref}
      role="region"
      aria-label="Cookie notice"
      className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-ink bg-card"
    >
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:gap-6 sm:px-6">
        <p className="flex-1 text-[0.9375rem] leading-relaxed text-ink">
          Cardfile uses one cookie to keep you signed in and remembers your light or dark theme on this
          device. It has no advertising or tracking cookies.{" "}
          <Link href="/privacy#cookies" className="font-medium underline underline-offset-2">
            Read the privacy page
          </Link>
        </p>
        <Button onClick={dismiss} className="h-10 shrink-0 px-5 text-base">
          OK, got it
        </Button>
      </div>
    </div>
  );
}
