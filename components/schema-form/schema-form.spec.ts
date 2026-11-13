import { expect, test } from "@playwright/test";
import { eachTheme, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "schema-form", theme);
    await expectNoAxeViolations(page);
  });

  test("accessibility: each field is named by its spec and described by its error", async ({
    page,
  }) => {
    await visitStates(page, "schema-form", theme);
    await expect(page.locator("#a-org")).toHaveAccessibleName(/Display name/);
    await expect(page.locator("#a-fee")).toHaveValue("25.00");
    await expect(page.locator("#a-opens")).toHaveValue("2026-12-01T09:00");
    await expect(page.getByRole("radio", { name: "Team" }).first()).toBeChecked();
    await expect(page.locator("#b-contact")).toHaveAccessibleDescription(/Enter an email address/);
    await expect(page.locator("#b-contact")).toHaveAttribute("aria-invalid", "true");
  });

  test("keyboard: a summary link puts focus in its field", async ({ page }) => {
    await visitStates(page, "schema-form", theme);
    await page.getByRole("link", { name: "Enter display name." }).press("Enter");
    await expect(page.locator("#b-org")).toBeFocused();
  });

  test("behavior: a controlled form changes React state, and an app's kind is drawn", async ({
    page,
  }) => {
    await visitStates(page, "schema-form", theme);
    await page.locator("#held-title").fill("Spring update");
    await expect(page.getByText("Title is now: Spring update")).toBeVisible();
    await expect(page.locator("#held-rating")).toHaveAttribute("type", "number");
  });
});
