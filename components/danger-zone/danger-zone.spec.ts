import { expect, test } from "@playwright/test";
import {
  eachTheme,
  expectContrast,
  expectNoAxeViolations,
  visitStates,
} from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations, and the label and note reach their contrast", async ({
    page,
  }) => {
    await visitStates(page, "danger-zone", theme);
    await expectNoAxeViolations(page);
    await expectContrast(page, [
      { sel: "#dz-one .cap-danger-title", what: "the Danger label" },
      { sel: "#dz-one .cap-danger-note", what: "the note" },
    ]);
  });
});

test("accessibility: the zone is a group named by its label", async ({ page }) => {
  await visitStates(page, "danger-zone", "light");
  await expect(page.getByRole("group", { name: "Danger" }).first()).toBeVisible();
  await expect(page.locator("#dz-one").getByRole("button", { name: "Remove site" })).toBeVisible();
});
