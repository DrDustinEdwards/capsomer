import { expect, test } from "@playwright/test";
import { eachTheme, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "repeater-field", theme);
    await expectNoAxeViolations(page);
  });

  test("keyboard: Add lands in the new row, Remove on the next, a move follows its row", async ({
    page,
  }) => {
    await visitStates(page, "repeater-field", theme);
    const links = page.getByRole("group", { name: "Footer links" }).first();
    await links.getByRole("button", { name: "Add a link" }).press("Enter");
    await expect(
      links.getByRole("group", { name: "Link 4" }).getByRole("textbox").first(),
    ).toBeFocused();
    await expect(page.getByRole("status").filter({ hasText: "Link 4 added." })).toHaveCount(1);

    await links.getByRole("button", { name: "Remove Link 2" }).press("Enter");
    await expect(
      links.getByRole("group", { name: "Link 2" }).getByRole("textbox").first(),
    ).toHaveValue("Annual report");
    await expect(
      links.getByRole("group", { name: "Link 2" }).getByRole("textbox").first(),
    ).toBeFocused();

    await links.getByRole("button", { name: "Move up Link 2" }).press("Enter");
    await expect(
      links.getByRole("group", { name: "Link 1" }).getByRole("textbox").first(),
    ).toHaveValue("Annual report");
    await expect(links.getByRole("button", { name: "Move up Link 1" })).toBeDisabled();
    await expect(links.getByRole("button", { name: "Move down Link 1" })).toBeFocused();
    const posted = await links.locator("input[type='hidden'][name='links']").inputValue();
    expect(JSON.parse(posted)[0].label).toBe("Annual report");
  });

  test("behavior: the minimum and the maximum turn Remove and Add off", async ({ page }) => {
    await visitStates(page, "repeater-field", theme);
    const authors = page.getByRole("group", { name: "Authors" });
    await authors.getByRole("button", { name: "Remove Author 2" }).click();
    await expect(authors.getByRole("button", { name: "Remove Author 1" })).toBeDisabled();
    const add = authors.getByRole("button", { name: "Add an author" });
    for (let i = 0; i < 3; i++) await add.click();
    await expect(add).toBeDisabled();
  });
});
