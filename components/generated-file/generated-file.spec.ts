import { expect, test } from "@playwright/test";
import {
  eachTheme,
  expectContrast,
  expectNoAxeViolations,
  visitStates,
} from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "generated-file", theme);
    await expectNoAxeViolations(page);
  });

  test("accessibility: the state's sentence and the file's size reach their contrast", async ({
    page,
  }) => {
    await visitStates(page, "generated-file", theme);
    await expectContrast(page, [
      { sel: ".cap-generated-says", what: "the state's sentence" },
      { sel: ".cap-generated-file .cap-link-meta", what: "the format and size" },
    ]);
  });

  test("behavior: each state says its word, and a run in progress takes no second press", async ({
    page,
  }) => {
    await visitStates(page, "generated-file", theme);
    const words: Record<string, string> = {
      none: "Not made yet",
      generating: "Generating",
      regenerating: "Generating",
      ready: "Ready",
      stale: "Out of date",
      failed: "Failed",
      stalled: "Failed",
    };
    for (const [id, word] of Object.entries(words)) {
      await expect(page.locator(`#s-${id} ~ * .cap-generated-status .cap-status`)).toHaveText(word);
    }
    await expect(page.locator("#s-none ~ *").getByRole("button")).toHaveText("Generate the PDF");
    await expect(page.locator("#s-none ~ *").getByRole("link")).toHaveCount(0);
    await expect(page.locator("#s-regenerating ~ *").getByRole("link")).toHaveText(
      "Download the PDF",
    );
    for (const id of ["generating", "busy"])
      await expect(page.locator(`#s-${id} ~ *`).getByRole("button")).toHaveAttribute(
        "aria-busy",
        "true",
      );
    await expect(page.locator("#s-stalled ~ *").getByRole("button")).toBeEnabled();
    await expect(page.locator("#s-ready ~ * .cap-link-meta")).toHaveText("PDF, 2.4 MB");
  });
});
