import { expect, test } from "@playwright/test";
import {
  eachTheme,
  expectContrast,
  expectNoAxeViolations,
  visitStates,
} from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations, and the labels, the badge and the failure line reach their contrast", async ({
    page,
  }) => {
    await visitStates(page, "ai-sample", theme);
    await expectNoAxeViolations(page);
    await expectContrast(page, [
      { sel: "#as-result .cap-ai-sample-live", what: "the live badge" },
      { sel: "#as-result .cap-ai-sample-label", what: "a field label" },
      { sel: "#as-result .cap-ai-sample-field[data-variant='mono']", what: "the body" },
      { sel: "#as-failed .cap-ai-sample-error", what: "the failure line" },
    ]);
  });
});

test("behavior: another input clears the sample, Generate says it is busy, then the new sample lands", async ({
  page,
}) => {
  await visitStates(page, "ai-sample", "light");
  const form = page.locator("#as-result");
  await form.getByLabel("Overdue").check();
  await expect(form.locator(".cap-ai-sample-out")).toBeEmpty();
  await form.getByRole("button", { name: "Write a sample email" }).press("Enter");
  await expect(form.getByRole("button", { name: "Writing..." })).toBeDisabled();
  await expect(form.locator(".cap-ai-sample-field").first()).toHaveText(
    "Your invoice from Example Co is past due",
  );
  await expect(form.getByRole("button", { name: "Write a sample email" })).toBeEnabled();
});
