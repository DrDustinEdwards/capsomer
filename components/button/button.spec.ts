import { expect, test } from "@playwright/test";
import {
  eachTheme,
  expectContrast,
  expectNoAxeViolations,
  visitStates,
} from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "button", theme);
    await expectNoAxeViolations(page);
  });

  test("accessibility: labels and edges reach their contrast", async ({ page }) => {
    await visitStates(page, "button", theme);
    await expectContrast(page, [
      { sel: "#b-default", what: "a default label" },
      { sel: "#b-default", what: "a default button's edge", part: "border" },
      { sel: "#b-hover", what: "a hovered button's edge", part: "border" },
      { sel: "#b-pressed", what: "a pressed label" },
      { sel: "#b-primary", what: "a primary label on the accent" },
      { sel: "#b-secondary", what: "a secondary label on its tint" },
      { sel: "#b-secondary", what: "a secondary button's edge", part: "border" },
      { sel: "#b-secondary-hover", what: "a hovered secondary label" },
      { sel: "#b-variant-link", what: "a link variant's label" },
      { sel: "#b-invalid", what: "an invalid button's edge", part: "border" },
      { sel: "#b-danger", what: "a danger label on its soft tint" },
      { sel: "#b-danger", what: "a danger button's edge", part: "border" },
      { sel: "#b-danger-pressed", what: "a pressed danger label" },
      { sel: "#b-quiet", what: "a quiet label" },
      { sel: "#b-quiet-hover", what: "a hovered quiet label" },
      { sel: "#b-disabled", what: "a disabled label" },
      { sel: "#b-disabled", what: "a disabled button's edge", part: "border" },
      { sel: "#why-publish", what: "the reason beside a disabled button" },
      { sel: "#b-link", what: "a link styled as a button" },
      { sel: "#b-linkbtn", what: "a button styled as a link" },
      { sel: "#b-icon", what: "an icon button's edge", part: "border" },
    ]);
  });

  test("keyboard: Tab reaches every button, including one disabled with its reason", async ({
    page,
  }) => {
    await visitStates(page, "button", theme);
    await page.locator("#b-expanded").focus();
    await page.keyboard.press("Tab");
    await expect(page.locator("#b-disabled")).toBeFocused();
    await expect(page.locator("#b-disabled")).toHaveCSS("outline-style", "solid");
    await expectContrast(page, [
      { sel: "#b-disabled", what: "the focus ring", part: "outline", min: 3 },
    ]);
  });

  test("behavior: a pending button keeps its width and shows the spinner", async ({ page }) => {
    await visitStates(page, "button", theme);
    const busy = await page.locator("#b-pending").boundingBox();
    const rest = await page.locator("#b-pending-twin").boundingBox();
    expect(busy?.width).toBe(rest?.width);
    await expect(page.locator("#b-pending .cap-btn-spinner")).toBeVisible();
    await expect(page.locator("#b-pending-twin .cap-btn-spinner")).toBeHidden();
    await expect(page.locator("#b-pending .cap-btn-label")).toHaveCSS("opacity", "0");
  });

  test("accessibility: every size keeps a 24 px hit area", { tag: "@markup" }, async ({ page }) => {
    await visitStates(page, "button", theme);
    for (const id of ["#b-xs", "#b-sm", "#b-size-default", "#b-lg", "#b-icon"]) {
      const b = await page.locator(id).boundingBox();
      expect(b?.height, id).toBeGreaterThanOrEqual(24);
      expect(b?.width, id).toBeGreaterThanOrEqual(24);
    }
    const link = await page.locator("#b-linkbtn").boundingBox();
    expect(link?.height).toBeGreaterThanOrEqual(24);
  });
});
