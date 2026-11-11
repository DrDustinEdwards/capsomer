import { expect, test } from "@playwright/test";
import {
  eachTheme,
  expectContrast,
  expectNoAxeViolations,
  visitStates,
} from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations, and the kind, title and details reach their contrast", async ({
    page,
  }) => {
    await visitStates(page, "sources-list", theme);
    await expectNoAxeViolations(page);
    await expectContrast(page, [
      { sel: "#sl-mixed .cap-source-kind", what: "a kind tag" },
      { sel: "#sl-mixed a.cap-source-title", what: "a linked title" },
      { sel: "#sl-mixed .cap-source-license", what: "a license" },
    ]);
  });

  test("behavior: a closed list is still in the page, and a link that leaves says so", async ({
    page,
  }) => {
    await visitStates(page, "sources-list", theme);
    await expect(page.locator("#sl-closed .cap-source")).toHaveCount(1);
    await expect(
      page
        .locator("#sl-mixed")
        .getByRole("link", { name: "A field guide to field notes (another site)" }),
    ).toBeVisible();
  });
});
