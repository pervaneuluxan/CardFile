import { expect, test } from "@playwright/test";
import { signUp, uniqueUser } from "./helpers";

test("the board requires an account", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/signin$/);
});

test("sign up creates a board with the five default columns", async ({ page }) => {
  await signUp(page);
  const headings = page.getByRole("heading", { level: 2 });
  await expect(headings).toHaveText(["Wish List", "Applied", "Interviewing", "Offer", "Rejected"]);
  await expect(page.getByTestId("board-summary")).toContainText("No applications yet");
});

test("sign out, then sign back in", async ({ page }) => {
  const user = await signUp(page);

  await page.getByRole("button", { name: "Account menu" }).click();
  await expect(page.getByRole("menu")).toContainText(user.email);
  await page.getByRole("menuitem", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/signin$/);

  await page.getByLabel("Email").fill(user.email);
  await page.getByLabel(/password/i).fill(user.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
});

test("a wrong password shows an error", async ({ page }) => {
  const user = await signUp(page);
  await page.context().clearCookies();

  await page.goto("/signin");
  await page.getByLabel("Email").fill(user.email);
  await page.getByLabel(/password/i).fill("definitely-wrong");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page).toHaveURL(/\/signin$/);
});

test("signed-in users are sent from /signin to the board", async ({ page }) => {
  await signUp(page, uniqueUser("redirect"));
  await page.goto("/signin");
  await expect(page).toHaveURL(/\/dashboard$/);
});
