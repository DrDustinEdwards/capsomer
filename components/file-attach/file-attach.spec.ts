import { expect, test } from "@playwright/test";
import { eachTheme, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "file-attach", theme);
    await expectNoAxeViolations(page);
  });

  test("behavior: a refused file is named with its reason and nothing is sent", async ({
    page,
  }) => {
    await visitStates(page, "file-attach", theme);
    await page
      .getByLabel("Upload file")
      .first()
      .setInputFiles({
        name: "notes.exe",
        mimeType: "application/octet-stream",
        buffer: Buffer.from("x"),
      });
    await expect(page.getByRole("alert").first()).toContainText("notes.exe: type not allowed");
    await expect(
      page.getByText("Files cannot be changed once the evidence is submitted."),
    ).toBeVisible();
  });
});
