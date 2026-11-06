import { expect, test } from "@playwright/test";
import { eachTheme, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations, frames included", async ({ page }) => {
    await visitStates(page, "email", theme);
    await expect(page.locator("iframe[data-email]")).toHaveCount(28);
    await expect
      .poll(() =>
        page
          .locator("iframe[data-email]")
          .evaluateAll((fs) =>
            fs.every((f) => (f as HTMLIFrameElement).contentDocument?.querySelector("h1")),
          ),
      )
      .toBe(true);
    await expectNoAxeViolations(page);
  });

  test("behavior: a digest with rows, a section heading and a preformatted block does not scroll sideways at 320px", async ({
    page,
  }) => {
    await visitStates(page, "email", theme);
    const frame = page.locator('iframe[data-email="digest"][data-width="320"]');
    const doc = await (await frame.elementHandle())?.contentFrame();
    expect(
      await doc?.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      ),
    ).toBe(false);
    const inner = page.frameLocator('iframe[data-email="digest"][data-width="320"]');
    await expect(inner.locator("h1")).toHaveCount(1);
    await expect(inner.locator("h2")).toHaveCount(2);
  });

  test("behavior: a mail has a language, a title, one heading and a link button, and no horizontal scroll at 320px", async ({
    page,
  }) => {
    await visitStates(page, "email", theme);
    const frame = page.frameLocator('iframe[data-email="magicLink"][data-width="320"]').first();
    await expect(frame.locator("h1")).toHaveText("Sign in to Example Co");
    await expect(frame.getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      /EXAMPLE-NOT-A-TOKEN/,
    );
    const el = await page
      .locator('iframe[data-email="magicLink"][data-width="320"]')
      .first()
      .elementHandle();
    const doc = await el?.contentFrame();
    const scroll = await doc?.evaluate(() => ({
      lang: document.documentElement.lang,
      title: document.title,
      wide: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    }));
    expect(scroll).toEqual({ lang: "en", title: "Your sign-in link for Example Co", wide: false });
  });
});
