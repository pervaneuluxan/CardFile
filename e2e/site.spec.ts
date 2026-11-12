import { expect, test } from "@playwright/test";
import { signUp } from "./helpers";

test.describe("cookie notice", () => {
  test("shows once, can be dismissed, and stays dismissed", async ({ page }) => {
    await page.goto("/");
    const notice = page.getByRole("region", { name: "Cookie notice" });
    await expect(notice).toBeVisible();
    await expect(notice).toContainText("no advertising or tracking cookies");

    await notice.getByRole("button", { name: "OK, got it" }).click();
    await expect(notice).toBeHidden();
    await page.goto("/guide");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(notice).toBeHidden();
  });

  test("never covers the footer links", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("region", { name: "Cookie notice" })).toBeVisible();
    // Clicking fails if the notice sits on top of the link.
    await page.getByRole("contentinfo").getByRole("link", { name: "Privacy" }).click();
    await expect(page).toHaveURL(/\/privacy$/);
  });

  test("links to the cookies section of the privacy page", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Read the privacy page" }).click();
    await expect(page).toHaveURL(/\/privacy#cookies$/);
    await expect(page.getByRole("heading", { name: "Cookies and browser storage" })).toBeVisible();
  });
});

test.describe("form validation", () => {
  test("sign-up names each problem and creates no account", async ({ page }) => {
    await page.goto("/signup");
    await page.getByLabel("Email").fill("not-an-email");
    await page.getByLabel(/password/i).fill("short");
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page.getByText("Enter your name.")).toBeVisible();
    await expect(page.getByText("Enter an email address like name@example.com.")).toBeVisible();
    await expect(page.getByText("Use at least 8 characters.")).toBeVisible();
    await expect(page.getByLabel("Name")).toBeFocused();
    await expect(page).toHaveURL(/\/signup$/);

    // Messages clear as each field is fixed.
    await page.getByLabel("Name").fill("Ada");
    await expect(page.getByText("Enter your name.")).toBeHidden();
  });

  test("add-application form rejects a bad link, then accepts a good one", async ({ page }) => {
    await signUp(page);
    await page.getByRole("button", { name: "Add application to Applied" }).click();
    const dialog = page.getByRole("dialog", { name: "Add application" });
    await dialog.getByRole("button", { name: "Add application" }).click();
    await expect(dialog.getByText("Enter the company name.")).toBeVisible();
    await expect(dialog.getByText("Enter the position.")).toBeVisible();

    await dialog.getByLabel(/company/i).fill("Stripe");
    await dialog.getByLabel(/position/i).fill("Engineer");
    await dialog.getByLabel(/job posting link/i).fill("stripe.com/jobs");
    await dialog.getByRole("button", { name: "Add application" }).click();
    await expect(dialog.getByText("Enter a full link that starts with https://")).toBeVisible();
    await expect(dialog).toBeVisible();

    await dialog.getByLabel(/job posting link/i).fill("https://stripe.com/jobs");
    await dialog.getByRole("button", { name: "Add application" }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByRole("article", { name: "Engineer at Stripe" })).toBeVisible();
  });
});

test.describe("metadata", () => {
  const pages = [
    { path: "/", title: "Cardfile | Job application tracker", canonical: "" },
    { path: "/guide", title: "Guide | Cardfile", canonical: "/guide" },
    { path: "/privacy", title: "Privacy | Cardfile", canonical: "/privacy" },
    { path: "/signin", title: "Sign in | Cardfile", canonical: "/signin" },
    { path: "/signup", title: "Create your board | Cardfile", canonical: "/signup" },
  ];

  for (const { path, title, canonical } of pages) {
    test(`${path} has a title, description, canonical link and share tags`, async ({ page, baseURL }) => {
      await page.goto(path);
      await expect(page).toHaveTitle(title);
      const attr = (selector: string, name = "content") => page.locator(selector).first().getAttribute(name);

      expect((await attr('meta[name="description"]'))!.length).toBeGreaterThan(40);
      expect(await attr('link[rel="canonical"]', "href")).toBe(`${baseURL}${canonical}`);
      expect(await attr('meta[property="og:title"]')).toBe(title);
      expect(await attr('meta[property="og:image"]')).toContain("/opengraph-image");
      expect((await attr('meta[property="og:image:alt"]'))!).toContain("transit line");
      expect(await attr('meta[name="twitter:card"]')).toBe("summary_large_image");
    });
  }

  test("the board and the 404 page are kept out of search", async ({ page }) => {
    await signUp(page);
    await expect(page).toHaveTitle("Your board | Cardfile");
    await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute("content", /noindex/);

    await page.goto("/no-such-page");
    await expect(page).toHaveTitle("Page not found | Cardfile");
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
  });

  test("share image, icons, manifest, robots and sitemap are served", async ({ page, request }) => {
    await page.goto("/");
    const og = await page.locator('meta[property="og:image"]').first().getAttribute("content");
    const image = await request.get(og!);
    expect(image.ok()).toBe(true);
    expect(image.headers()["content-type"]).toBe("image/png");

    for (const selector of ['link[rel="icon"][href*="favicon.ico"]', 'link[rel="icon"][type="image/svg+xml"]', 'link[rel="apple-touch-icon"]']) {
      const href = await page.locator(selector).first().getAttribute("href");
      expect((await request.get(href!)).ok(), selector).toBe(true);
    }

    const manifest = await (await request.get("/manifest.webmanifest")).json();
    expect(manifest.name).toBe("Cardfile");
    for (const icon of manifest.icons) expect((await request.get(icon.src)).ok(), icon.src).toBe(true);

    const robots = await (await request.get("/robots.txt")).text();
    expect(robots).toContain("Disallow: /dashboard");
    expect(robots).toContain("/sitemap.xml");

    const sitemap = await (await request.get("/sitemap.xml")).text();
    for (const path of ["/guide", "/privacy", "/signup"]) expect(sitemap).toContain(`${path}</loc>`);
    expect(sitemap).not.toContain("/dashboard");
  });
});
