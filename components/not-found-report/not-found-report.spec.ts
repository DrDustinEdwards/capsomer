import { expect, test } from "@playwright/test";
import {
  eachTheme,
  expectContrast,
  expectNoAxeViolations,
  visitStates,
} from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "not-found-report", theme);
    await expect(page.locator("[data-mount='report'] .cap-row").first()).toBeVisible();
    await expectNoAxeViolations(page);
  });

  test("accessibility: the path, the referrers and the hits reach their contrast", async ({
    page,
  }) => {
    await visitStates(page, "not-found-report", theme);
    const r = "[data-mount='report']";
    await expectContrast(page, [
      { sel: `${r} .cap-nf-path`, what: "path" },
      { sel: `${r} .cap-row-detail`, what: "referrers" },
      { sel: `${r} .cap-nf-meta`, what: "hits" },
      { sel: "[data-mount='reason'] .cap-nf-reason", what: "reason" },
    ]);
  });

  test("keyboard: the arrow keys change the window, and a row's action follows", async ({
    page,
  }) => {
    await visitStates(page, "not-found-report", theme);
    const r = page.locator("[data-mount='report']");
    const thirty = r.getByRole("radio", { name: "30 days" });
    await thirty.focus();
    await page.keyboard.press("ArrowLeft");
    await expect(r.getByRole("radio", { name: "7 days" })).toBeChecked();
    await expect(r.locator(".cap-row")).toHaveCount(2);
    // The row is read, not opened (a static row), so its action is the next stop.
    await page.keyboard.press("Tab");
    await expect(
      r.getByRole("link", { name: "Add a redirect for /blog/spring-update/" }),
    ).toBeFocused();
  });
});
