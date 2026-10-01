import { expect, test } from "@playwright/test";
import { eachTheme, expectContrast, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "segmented", theme);
    await expectNoAxeViolations(page);
  });

  test("accessibility: words and edges reach their contrast", async ({ page }) => {
    await visitStates(page, "segmented", theme);
    await expectContrast(page, [
      { sel: "#seg-window > legend", what: "the legend" },
      { sel: "#seg-window label:has(input:checked)", what: "the chosen segment's word" },
      { sel: "#seg-window label:has(input:not(:checked))", what: "an unchosen segment's word" },
      { sel: "#seg-hovered", what: "a hovered segment's word" },
      { sel: "#seg-view label:has(input:disabled)", what: "a disabled segment's word" },
      { sel: "#seg-view-why", what: "the reason for a disabled segment" },
      { sel: "#seg-window .cap-seg-options", what: "the control's edge", part: "border" },
      { sel: "#seg-window label:has(input:checked)", what: "the chosen segment's edge", part: "border" },
    ]);
  });

  test("accessibility: roles, names and the chosen one", async ({ page }) => {
    await visitStates(page, "segmented", theme);
    await expect(page.locator("#seg-window")).toMatchAriaSnapshot(`
      - group "Window":
        - radio "24 hours" [checked]
        - radio "7 days"
        - radio "30 days"
    `);
    await expect(page.getByRole("group", { name: "Theme" })).toBeVisible();
    await expect(page.getByRole("radio", { name: "Board" })).toBeDisabled();
  });

  test("keyboard: Tab enters the control at the chosen segment and leaves it in one step", async ({ page }) => {
    await visitStates(page, "segmented", theme);
    await page.keyboard.press("Tab");
    const day = page.getByRole("radio", { name: "24 hours" });
    await expect(day).toBeFocused();
    const seg = page.locator("#seg-window label:has(input:checked)");
    await expect(seg).toHaveCSS("outline-style", "solid");
    await expectContrast(page, [{ sel: "#seg-window label:has(input:checked)", what: "the focus ring", part: "outline", min: 3 }]);
    await page.keyboard.press("Tab");
    await expect(page.getByRole("radio", { name: "Side by side" })).toBeFocused();
  });

  test("keyboard: arrow keys move and choose", async ({ page }) => {
    await visitStates(page, "segmented", theme);
    await page.getByRole("radio", { name: "24 hours" }).focus();
    await page.keyboard.press("ArrowRight");
    const week = page.getByRole("radio", { name: "7 days" });
    await expect(week).toBeFocused();
    await expect(week).toBeChecked();
    await page.keyboard.press("ArrowLeft");
    await expect(page.getByRole("radio", { name: "24 hours" })).toBeChecked();
  });

  test("keyboard: Space chooses the focused segment when none is chosen", async ({ page }) => {
    await visitStates(page, "segmented", theme);
    const side = page.getByRole("radio", { name: "Side by side" });
    await side.focus();
    await expect(side).not.toBeChecked();
    await page.keyboard.press("Space");
    await expect(side).toBeChecked();
  });

  test("keyboard: arrow keys skip a disabled segment", async ({ page }) => {
    await visitStates(page, "segmented", theme);
    await page.getByRole("radio", { name: "List" }).focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("radio", { name: "Calendar" })).toBeChecked();
    await expect(page.getByRole("radio", { name: "Board" })).not.toBeChecked();
  });

  test("behaviour: a click anywhere on a segment chooses it, and each segment is a full target", async ({ page }) => {
    await visitStates(page, "segmented", theme);
    const label = page.locator("#seg-window label").nth(2);
    await label.click({ position: { x: 4, y: 4 } });
    await expect(page.getByRole("radio", { name: "30 days" })).toBeChecked();
    const box = await label.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(24);
  });
});
