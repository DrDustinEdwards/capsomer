import { expect, test } from "@playwright/test";
import { eachTheme, visitStates } from "../../test/helpers.ts";

eachTheme((theme) => {
  test("behavior: a read-only submit stays in the page and says why", async ({ page }) => {
    await visitStates(page, "read-only-form", theme);
    const url = page.url();
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByRole("status").filter({ hasText: "This is a demo" })).toBeVisible();
    expect(page.url()).toBe(url);
  });
});
