import { expect, type Page } from "@playwright/test";

export function uniqueUser(prefix = "e2e") {
  const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
  return { name: `Test ${prefix}`, email: `${prefix}-${id}@example.test`, password: `pw-${id}-secure` };
}

export async function signUp(page: Page, user = uniqueUser()) {
  await page.goto("/signup");
  await page.getByLabel("Name").fill(user.name);
  await page.getByLabel("Email").fill(user.email);
  await page.getByLabel(/password/i).fill(user.password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { level: 2, name: "Wish List" })).toBeVisible();
  return user;
}

export function column(page: Page, name: string) {
  return page.getByRole("region", { name });
}

export async function addJob(page: Page, columnName: string, job: { company: string; position: string; tags?: string }) {
  await page.getByRole("button", { name: `Add application to ${columnName}` }).click();
  const dialog = page.getByRole("dialog", { name: "Add application" });
  await dialog.getByLabel(/company/i).fill(job.company);
  await dialog.getByLabel(/position/i).fill(job.position);
  if (job.tags) await dialog.getByLabel(/tags/i).fill(job.tags);
  await dialog.getByRole("button", { name: "Add application" }).click();
  await expect(dialog).toBeHidden();
  const card = column(page, columnName).getByRole("article", { name: `${job.position} at ${job.company}` });
  await expect(card).toBeVisible();
  return card;
}

/** Runs `action` and waits for the server action it triggers to respond. */
export async function andWaitForSave(page: Page, action: () => Promise<void>) {
  const saved = page.waitForResponse((r) => r.request().method() === "POST" && r.url().includes("/dashboard"));
  await action();
  expect((await saved).ok()).toBe(true);
}
