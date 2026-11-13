import { expect, test } from "@playwright/test";
import { eachTheme, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

test("behavior: on a wide screen the tabs sit beside the text, and an empty tab is left out", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await visitStates(page, "inspector", "light");
  const side = page.locator("[data-mount='wide'] .cap-inspector");
  await expect(side).toHaveAccessibleName("About this post");
  await expect(side.getByRole("tab")).toHaveText(["Details", "Checks2", "History"]);
  await side.getByRole("tab", { name: /Checks/ }).click();
  await expect(side.getByRole("tabpanel")).toHaveText("Two open checks.");
  await expect(
    page.locator("[data-mount='asked']").getByRole("tab", { selected: true }),
  ).toHaveText(/Checks/);
});

test("keyboard: on a phone the head stays in the page and each tab opens the sheet on itself", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await visitStates(page, "inspector", "light");
  // The other specimen's address opened its sheet on load: close it first.
  await expect(page.getByRole("dialog", { name: "About this draft" })).toBeVisible();
  await page.keyboard.press("Escape");
  const wide = page.locator("[data-mount='wide']");
  await expect(wide.getByText("Saved 2 minutes ago.")).toBeVisible();
  await expect(wide.getByRole("tab")).toHaveCount(0);
  const open = wide.getByRole("button", { name: /^Checks\W*2$/ });
  await open.focus();
  await page.keyboard.press("Enter");
  const sheet = page.getByRole("dialog", { name: "About this post" });
  await expect(sheet).toBeVisible();
  await expect(sheet.getByRole("tab", { selected: true })).toHaveText(/Checks/);
  await page.keyboard.press("Escape");
  await expect(sheet).toBeHidden();
  await expect(open).toBeFocused();
});

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "inspector", theme);
    await expectNoAxeViolations(page);
  });
});
