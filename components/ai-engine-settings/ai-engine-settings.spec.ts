import { expect, test } from "@playwright/test";
import { eachTheme, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "ai-engine-settings", theme);
    await expect(page.locator("[data-mount='settings'] table")).toBeVisible();
    await expectNoAxeViolations(page);
  });

  test("keyboard: Tab goes through each job's engine, model and effort, and the cap belongs to the table's form", async ({
    page,
  }) => {
    await visitStates(page, "ai-engine-settings", theme);
    const s = page.locator("[data-mount='settings']");
    await s.getByRole("combobox", { name: "Engine for everything" }).focus();
    await page.keyboard.press("Tab");
    await expect(s.getByRole("combobox", { name: "Social post drafts: engine" })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(
      s.getByRole("combobox", { name: "Social post drafts: model when the API does it" }),
    ).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(s.getByRole("combobox", { name: "Social post drafts: effort" })).toBeFocused();
    const cap = s.getByRole("spinbutton", { name: "Cap a month, $" });
    const owner = await cap.evaluate((el) => (el as HTMLInputElement).form?.id ?? "");
    expect(owner).not.toBe("");
    expect(await s.locator(`form#${owner} table`).count()).toBe(1);
  });
});
