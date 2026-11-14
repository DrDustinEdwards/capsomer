import { expect, test } from "@playwright/test";
import {
  eachTheme,
  expectContrast,
  expectNoAxeViolations,
  visitStates,
} from "../../test/helpers.ts";

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
      {
        sel: "#seg-window .cap-seg-options::before",
        what: "the chosen segment's edge (the sliding highlight)",
        part: "border",
      },
      { sel: "#seg-sm label:has(input:checked)", what: "a small segment's word" },
      { sel: "#seg-invalid .cap-seg-options", what: "an invalid control's edge", part: "border" },
      { sel: "#seg-invalid-e", what: "the message for an invalid control" },
    ]);
  });

  test("accessibility: roles, names and the chosen one", { tag: "@markup" }, async ({ page }) => {
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

  test("keyboard: Tab enters the control at the chosen segment and leaves it in one step", async ({
    page,
  }) => {
    await visitStates(page, "segmented", theme);
    await page.keyboard.press("Tab");
    const day = page.getByRole("radio", { name: "24 hours" });
    await expect(day).toBeFocused();
    const seg = page.locator("#seg-window label:has(input:checked)");
    await expect(seg).toHaveCSS("outline-style", "solid");
    await expectContrast(page, [
      {
        sel: "#seg-window label:has(input:checked)",
        what: "the focus ring",
        part: "outline",
        min: 3,
      },
    ]);
    await page.keyboard.press("Tab");
    await expect(page.getByRole("radio", { name: "Side by side" })).toBeFocused();
  });

  test("accessibility: every size keeps a 24 px hit area", { tag: "@markup" }, async ({ page }) => {
    await visitStates(page, "segmented", theme);
    for (const id of ["#seg-window", "#seg-sm", "#seg-lg", "#seg-icons", "#seg-comf"]) {
      const box = await page.locator(`${id} label`).first().boundingBox();
      expect(box?.height, id).toBeGreaterThanOrEqual(24);
    }
  });
});
