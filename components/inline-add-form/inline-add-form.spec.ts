import { expect, test } from "@playwright/test";
import {
  eachTheme,
  expectContrast,
  expectNoAxeViolations,
  visitStates,
} from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "inline-add-form", theme);
    await expectNoAxeViolations(page);
  });

  test("accessibility: the labels and the field edges reach their contrast", async ({ page }) => {
    await visitStates(page, "inline-add-form", theme);
    await expectContrast(page, [
      { sel: "#s-one ~ .cap-inline-add .cap-field-label", what: "label" },
      { sel: "#ia-scene", what: "field edge", part: "border" },
    ]);
  });

  test("keyboard: Tab goes from the fields to the button, and Enter in a field posts", async ({
    page,
  }) => {
    await visitStates(page, "inline-add-form", theme);
    const form = page.getByRole("form", { name: "Add a scene" });
    await page.locator("#ia-scene").fill("Getting started");
    await form.evaluate((f) =>
      f.addEventListener("submit", () => f.setAttribute("data-posted", ""), { once: true }),
    );
    await page.keyboard.press("Enter");
    await expect(form).toHaveAttribute("data-posted", "");
    await page.locator("#ia-scene").focus();
    await page.keyboard.press("Tab");
    await expect(form.getByRole("button", { name: "Start it" })).toBeFocused();
  });
});
