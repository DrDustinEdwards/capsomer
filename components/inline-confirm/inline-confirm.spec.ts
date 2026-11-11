import { expect, test } from "@playwright/test";
import { eachTheme, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "inline-confirm", theme);
    await expectNoAxeViolations(page);
  });

  test("keyboard: opening lands on Cancel, never the confirm; Cancel goes back", async ({
    page,
  }) => {
    await visitStates(page, "inline-confirm", theme);
    const open = page.getByRole("button", { name: "Remove member Alex Rivera" });
    await open.press("Enter");
    const cancel = page
      .getByRole("form", { name: "Remove Alex Rivera?" })
      .getByRole("button", { name: "Cancel" });
    await expect(cancel).toBeFocused();
    await expect(
      page.getByRole("button", { name: "Yes, remove member" }).first(),
    ).toHaveAccessibleDescription(/Remove/);
    await cancel.press("Enter");
    await expect(page.getByRole("button", { name: "Remove member Alex Rivera" })).toBeFocused();
  });

  test("behavior: running withdraws Cancel and keeps the confirm from sending twice", async ({
    page,
  }) => {
    await visitStates(page, "inline-confirm", theme);
    const form = page.getByRole("form", { name: /concedes the dispute/ });
    await expect(form.getByRole("button", { name: "Accepting…" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    await expect(form.getByRole("button", { name: "Cancel" })).toHaveCount(0);
  });
});
