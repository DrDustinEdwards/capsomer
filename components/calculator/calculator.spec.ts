import { expect, test } from "@playwright/test";
import {
  eachTheme,
  expectContrast,
  expectNoAxeViolations,
  visitStates,
} from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "calculator", theme);
    await expect(page.locator("[data-mount='react'] .cap-calculator-status")).toHaveText(/36 GB/);
    await expectNoAxeViolations(page);
  });

  test("accessibility: the answer, the working and the error reach their contrast", async ({
    page,
  }) => {
    await visitStates(page, "calculator", theme);
    await expectContrast(page, [
      { sel: "#calc-live .cap-calculator-answer strong", what: "the answer" },
      { sel: "#calc-live .cap-calculator-steps li", what: "a worked step" },
      { sel: "#calc-live .cap-calculator-note", what: "a note" },
      { sel: "#calc-live .cap-calculator-unit", what: "a field's unit" },
      { sel: "#calc-error .cap-calculator-error", what: "the error" },
      { sel: "#calc-error .cap-calculator-error", what: "the error's edge", part: "border" },
    ]);
  });

  test("keyboard: typing recomputes, announces the answer and writes the address", async ({
    page,
  }) => {
    await visitStates(page, "calculator", theme);
    const live = page.locator("#calc-live");
    const visits = live.getByRole("textbox", { name: "Visits per month" });
    await visits.focus();
    await page.keyboard.press("ControlOrMeta+a");
    await page.keyboard.type("50000");
    await expect(live.getByRole("status")).toHaveText("Monthly transfer: 90 GB per month");
    await expect(live.locator(".cap-calculator-steps li").first()).toContainText("9 x 107 KB");
    expect(new URL(page.url()).searchParams.get("visits")).toBe("50000");
    // Enter recomputes in place: no reload, focus stays in the field.
    await page.keyboard.press("Enter");
    await expect(visits).toBeFocused();
    await expect(visits).toHaveValue("50000");
  });

  test("keyboard: a value it cannot use says what to enter and clears the working", async ({
    page,
  }) => {
    await visitStates(page, "calculator", theme);
    const live = page.locator("#calc-live");
    await live.getByRole("textbox", { name: "Page weight (KB)" }).fill("");
    await expect(live.getByRole("status")).toHaveText(
      "Enter the page weight in KB, greater than 0.",
    );
    await expect(live.locator(".cap-calculator-detail")).toBeEmpty();
  });

  test("behavior: the React calculator recomputes from its state and leaves the address", async ({
    page,
  }) => {
    await visitStates(page, "calculator", theme);
    const react = page.locator("[data-mount='react']");
    await react.getByRole("textbox", { name: "Visits per month" }).fill("10000");
    await expect(react.getByRole("status")).toHaveText("Monthly transfer: 9 GB per month");
    expect(new URL(page.url()).searchParams.has("visits")).toBe(false);
  });
});
