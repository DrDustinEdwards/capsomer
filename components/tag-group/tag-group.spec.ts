import { expect, test } from "@playwright/test";
import { eachTheme, expectContrast, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "tag-group", theme);
    await expectNoAxeViolations(page);
  });

  test("accessibility: a tag's name, its remove icon and the empty line reach their contrast", async ({ page }) => {
    await visitStates(page, "tag-group", theme);
    await expectContrast(page, [
      { sel: "#tags-live .cap-tag-name", what: "a tag's name" },
      { sel: "#tags-live .cap-tag-remove", what: "the remove icon", min: 3 },
      { sel: "#tags-empty .cap-tags-empty", what: "the empty line" },
    ]);
  });

  test("keyboard: one tab stop; arrows move; Delete, Backspace and Enter remove; focus is kept; Undo puts a tag back", async ({ page }) => {
    await visitStates(page, "tag-group", theme);
    const group = page.getByRole("group", { name: "Tags" });
    const remove = (name: string) => group.getByRole("button", { name: `Remove ${name}` });
    await page.locator("h1").click();
    await page.keyboard.press("Tab");
    await expect(remove("field notes")).toBeFocused();
    await page.keyboard.press("ArrowRight");
    await expect(remove("monitoring")).toBeFocused();
    await page.keyboard.press("Delete");
    await expect(remove("monitoring")).toHaveCount(0);
    await expect(remove("quiet hours")).toBeFocused();
    await page.keyboard.press("Backspace");
    await expect(remove("field notes")).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(group.getByRole("listitem")).toHaveCount(0);
    await expect(page.getByRole("textbox", { name: "Add a tag" })).toBeFocused();
    await expect(page.getByRole("status").getByText("Removed field notes.")).toBeVisible();
    await page.getByRole("button", { name: "Undo" }).click();
    await expect(remove("field notes")).toBeFocused();
  });
});
