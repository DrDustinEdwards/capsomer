import { expect, test } from "@playwright/test";
import { eachTheme, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations with the form open and its hint shown", async ({
    page,
  }) => {
    await visitStates(page, "config-form", theme);
    await page.getByRole("button", { name: "Add site" }).click();
    await page.getByRole("button", { name: "Preview" }).click();
    await expect(page.getByRole("alert")).toHaveText("A name is needed.");
    await expectNoAxeViolations(page);
  });
});

test("keyboard: the form takes focus in its first field, switching rows starts a fresh draft, and Esc closes it", async ({
  page,
}) => {
  await visitStates(page, "config-form", "light");
  await page.getByRole("button", { name: "Edit example.com" }).click();
  const name = page.getByLabel("Name");
  await expect(name).toBeFocused();
  await expect(name).toHaveValue("example.com");
  await name.fill("changed");
  await page.getByRole("button", { name: "Edit docs" }).click();
  await expect(page.getByLabel("Name")).toHaveValue("docs");
  await expect(page.getByRole("region", { name: "Edit docs" })).toBeVisible();
  await page.getByLabel("Name").press("Escape");
  await expect(page.getByRole("region", { name: "Edit docs" })).toHaveCount(0);
});
