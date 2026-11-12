import { expect, test } from "@playwright/test";
import { addJob, andWaitForSave, column, signUp } from "./helpers";

test.beforeEach(async ({ page }) => {
  await signUp(page);
});

test("add an application and it survives a reload", async ({ page }) => {
  const card = await addJob(page, "Wish List", { company: "Wise", position: "Product Designer", tags: "Figma, Remote" });
  await expect(card.getByRole("listitem")).toHaveText(["Figma", "Remote"]);
  await expect(page.getByTestId("board-summary")).toHaveText("1 application, 0 in interviews.");

  await page.reload();
  await expect(column(page, "Wish List").getByRole("article", { name: "Product Designer at Wise" })).toBeVisible();
});

test("move a card with its menu", async ({ page }) => {
  await addJob(page, "Applied", { company: "Stripe", position: "Engineer" });

  await page.getByRole("button", { name: "Actions for Engineer at Stripe" }).click();
  await andWaitForSave(page, () => page.getByRole("menuitem", { name: "Interviewing" }).click());

  await expect(column(page, "Interviewing").getByRole("article", { name: "Engineer at Stripe" })).toBeVisible();
  await expect(page.getByTestId("board-summary")).toHaveText("1 application, 1 in interviews.");

  await page.reload();
  await expect(column(page, "Interviewing").getByRole("article", { name: "Engineer at Stripe" })).toBeVisible();
  await expect(column(page, "Applied").getByRole("article")).toHaveCount(0);
});

test("drag a card to another column", async ({ page }) => {
  const card = await addJob(page, "Wish List", { company: "Nomura", position: "Mobile Developer" });
  // Mid-screen target: columns near the edge trigger dnd-kit auto-scroll.
  const target = column(page, "Interviewing");

  const from = (await card.boundingBox())!;
  const to = (await target.boundingBox())!;
  await page.mouse.move(from.x + from.width / 2, from.y + 20);
  await page.mouse.down();
  // Move past the 8px activation distance, then across in steps so dnd-kit tracks it.
  await page.mouse.move(from.x + from.width / 2 + 20, from.y + 30, { steps: 5 });
  await page.mouse.move(to.x + to.width / 2, to.y + 120, { steps: 20 });
  await andWaitForSave(page, () => page.mouse.up());

  await expect(target.getByRole("article", { name: "Mobile Developer at Nomura" })).toBeVisible();
  await page.reload();
  await expect(column(page, "Interviewing").getByRole("article", { name: "Mobile Developer at Nomura" })).toBeVisible();
});

test("move a card with the keyboard", async ({ page }) => {
  const card = await addJob(page, "Wish List", { company: "Wise", position: "Designer" });

  // Wait on the screen-reader announcements, as a keyboard user would listen for them.
  const live = page.getByRole("status").filter({ hasText: "Designer at Wise" });
  await card.focus();
  await page.keyboard.press("Space");
  await expect(live).toHaveText(/Picked up Designer at Wise|Designer at Wise is in its starting place in Wish List/);
  await page.keyboard.press("ArrowRight");
  await expect(live).toHaveText("Designer at Wise is over Applied.");
  await andWaitForSave(page, () => page.keyboard.press("Space"));

  await expect(column(page, "Applied").getByRole("article", { name: "Designer at Wise" })).toBeVisible();
  await page.reload();
  await expect(column(page, "Applied").getByRole("article", { name: "Designer at Wise" })).toBeVisible();
});

test("edit an application's details", async ({ page }) => {
  await addJob(page, "Applied", { company: "Danone", position: "DevOps Engineer" });

  await page.getByRole("button", { name: "Actions for DevOps Engineer at Danone" }).click();
  await page.getByRole("menuitem", { name: "Edit details" }).click();
  const dialog = page.getByRole("dialog", { name: "Edit application" });
  await dialog.getByLabel(/position/i).fill("Senior DevOps Engineer");
  await dialog.getByLabel(/location/i).fill("Paris");
  await dialog.getByRole("button", { name: "Save changes" }).click();
  await expect(dialog).toBeHidden();

  const card = column(page, "Applied").getByRole("article", { name: "Senior DevOps Engineer at Danone" });
  await expect(card).toContainText("Paris");
  await page.reload();
  await expect(card).toContainText("Paris");
});

test("delete asks first, then removes the card", async ({ page }) => {
  await addJob(page, "Rejected", { company: "NRI", position: "Web Tester" });

  await page.getByRole("button", { name: "Actions for Web Tester at NRI" }).click();
  await page.getByRole("menuitem", { name: "Delete" }).click();
  const confirm = page.getByRole("dialog", { name: "Delete this application?" });
  await confirm.getByRole("button", { name: "Keep it" }).click();
  await expect(confirm).toBeHidden();
  await expect(column(page, "Rejected").getByRole("article")).toHaveCount(1);

  await page.getByRole("button", { name: "Actions for Web Tester at NRI" }).click();
  await page.getByRole("menuitem", { name: "Delete" }).click();
  // While the dialog is open the board is hidden from the accessibility tree,
  // so wait for the save and the dialog to close before counting cards.
  await andWaitForSave(page, () => confirm.getByRole("button", { name: "Delete application" }).click());
  await expect(confirm).toBeHidden();
  await expect(column(page, "Rejected").getByRole("article")).toHaveCount(0);

  await page.reload();
  await expect(column(page, "Rejected").getByRole("article")).toHaveCount(0);
});

test("one user's board is not visible to another", async ({ page, browser }) => {
  await addJob(page, "Wish List", { company: "Private Co", position: "Secret Role" });

  const other = await browser.newContext();
  const otherPage = await other.newPage();
  await signUp(otherPage);
  await expect(otherPage.getByText("Private Co")).toHaveCount(0);
  await other.close();
});

test("pages load without console errors (no hydration mismatches)", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text().slice(0, 300));
  });
  await addJob(page, "Applied", { company: "Stripe", position: "Engineer" });
  for (const path of ["/dashboard", "/", "/guide", "/privacy"]) {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
  }
  expect(errors).toEqual([]);
});
