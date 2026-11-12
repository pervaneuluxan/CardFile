import { expect, test } from "@playwright/test";

test("landing page explains the product and leads to sign-up", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle("Cardfile | Job application tracker");
  await expect(page.getByRole("link", { name: "Cardfile home" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Every application, on one board.");

  const stages = page.getByRole("region", { name: "Five stages, left to right" }).getByRole("listitem");
  await expect(stages).toHaveCount(5);
  await expect(page.getByRole("region", { name: "Everything about a role, on one card" }).getByRole("term")).toHaveCount(6);

  await page.getByRole("main").getByRole("link", { name: "Create your board" }).first().click();
  await expect(page).toHaveURL(/\/signup$/);
  await expect(page.getByRole("heading", { name: "Create your board" })).toBeVisible();
});

test("FAQ answers open and close", async ({ page }) => {
  await page.goto("/");
  const faq = page.getByRole("region", { name: "Questions" });
  const answer = faq.getByText(/Every change to a card is checked/);
  await expect(answer).toBeHidden();
  await faq.getByText("Who can see my board?").click();
  await expect(answer).toBeVisible();
  await faq.getByText("Who can see my board?").click();
  await expect(answer).toBeHidden();
});

test("guide, privacy and 404 pages", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("contentinfo").getByRole("link", { name: "Guide" }).click();
  await expect(page).toHaveTitle("Guide | Cardfile");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Using your board");
  await expect(page.getByRole("table")).toContainText("Space");

  await page.getByRole("contentinfo").getByRole("link", { name: "Privacy" }).click();
  await expect(page).toHaveTitle("Privacy | Cardfile");

  const res = await page.goto("/no-such-page");
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "This page isn't on the map" })).toBeVisible();
});

test("page has no horizontal scroll", async ({ page }) => {
  for (const path of ["/", "/guide", "/privacy", "/signin"]) {
    await page.goto(path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, path).toBeLessThanOrEqual(0);
  }
});
