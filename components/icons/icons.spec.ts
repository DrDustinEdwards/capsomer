import { expect, test } from "@playwright/test";
import { eachTheme, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations; icons are hidden unless labeled, and an icon-only button is named", async ({
    page,
  }) => {
    await visitStates(page, "icons", theme);
    await expectNoAxeViolations(page);
    await expect(page.getByRole("button", { name: "Search" })).toBeVisible();
    await expect(page.getByRole("img", { name: "Opens another site" })).toBeVisible();
    await expect(page.locator("#ic-button .cap-icon")).toHaveAttribute("aria-hidden", "true");
  });
});
