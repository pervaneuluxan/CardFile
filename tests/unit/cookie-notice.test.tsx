import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import CookieNotice, { COOKIE_NOTICE_KEY } from "@/components/cookie-notice";

beforeEach(() => {
  localStorage.clear();
  document.documentElement.style.removeProperty("--cookie-notice-height");
});

describe("CookieNotice", () => {
  it("shows on a first visit, says what is stored and links to the privacy page", async () => {
    render(<CookieNotice />);
    const notice = await screen.findByRole("region", { name: "Cookie notice" });
    expect(notice).toHaveTextContent(/one cookie to keep you signed in/);
    expect(notice).toHaveTextContent(/no advertising or tracking cookies/);
    expect(screen.getByRole("link", { name: "Read the privacy page" })).toHaveAttribute("href", "/privacy#cookies");
  });

  it("goes away when dismissed and remembers it", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<CookieNotice />);
    await user.click(await screen.findByRole("button", { name: "OK, got it" }));
    expect(screen.queryByRole("region", { name: "Cookie notice" })).not.toBeInTheDocument();
    expect(localStorage.getItem(COOKIE_NOTICE_KEY)).toBe("dismissed");

    unmount();
    render(<CookieNotice />);
    expect(screen.queryByRole("region", { name: "Cookie notice" })).not.toBeInTheDocument();
  });

  it("reserves space at the bottom of the page only while showing", async () => {
    const user = userEvent.setup();
    render(<CookieNotice />);
    await screen.findByRole("region", { name: "Cookie notice" });
    expect(document.documentElement.style.getPropertyValue("--cookie-notice-height")).not.toBe("");
    await user.click(screen.getByRole("button", { name: "OK, got it" }));
    expect(document.documentElement.style.getPropertyValue("--cookie-notice-height")).toBe("");
  });
});
