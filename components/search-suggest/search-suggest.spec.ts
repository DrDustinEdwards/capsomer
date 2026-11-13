import { expect, test } from "@playwright/test";
import { eachTheme, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations, closed and open", async ({ page }) => {
    await visitStates(page, "search-suggest", theme);
    const box = page.getByRole("combobox", { name: "Search the library" });
    await box.fill("fi");
    await expect(page.getByRole("option", { name: /Field Notes on Moss/ }).first()).toBeVisible();
    await expectNoAxeViolations(page);
  });

  test("keyboard: the arrows move through the suggestions and Enter goes to the active one", async ({
    page,
  }) => {
    await visitStates(page, "search-suggest", theme);
    const box = page.getByRole("combobox", { name: "Search the library" });
    await box.fill("mo");
    await expect(box).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByRole("status").filter({ hasText: "suggestions" })).toHaveText(
      "3 suggestions",
    );
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowDown");
    const active = await box.getAttribute("aria-activedescendant");
    await expect(page.locator(`[id="${active}"]`)).toContainText("Moths of the Night Garden");
    await expect(box).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#moths$/);
    await expect(box).toHaveAttribute("aria-expanded", "false");
  });

  test("keyboard: Enter with no suggestion active searches, and Esc closes the list before it clears", async ({
    page,
  }) => {
    await visitStates(page, "search-suggest", theme);
    const box = page.getByRole("combobox", { name: "Search the library" });
    await box.fill("fern");
    await expect(box).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("Escape");
    await expect(box).toHaveAttribute("aria-expanded", "false");
    await expect(box).toHaveValue("fern");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/q=fern#results$/);
  });
});
