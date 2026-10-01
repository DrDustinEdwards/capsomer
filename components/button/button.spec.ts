import { expect, test } from "@playwright/test";
import { eachTheme, expectContrast, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

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

  test("accessibility: the variants' roles and names", async ({ page }) => {
    await visitStates(page, "button", theme);
    await expect(page.locator("#variants")).toMatchAriaSnapshot(`
      - button "Refresh"
      - button "Save changes"
      - button "Revoke agent"
      - button "Show more"
    `);
    await expect(page.locator("#b-icon")).toHaveAccessibleName("Refresh sites");
    await expect(page.locator("#b-disabled")).toHaveAccessibleDescription("Fix the 2 problems above first.");
    await expect(page.locator("#b-pending")).toHaveAccessibleName("Refresh");
  });

  test("keyboard: Tab reaches every button, including one disabled with its reason", async ({ page }) => {
    await visitStates(page, "button", theme);
    await page.locator("#b-pressed").focus();
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await expect(page.locator("#b-disabled")).toBeFocused();
    await expect(page.locator("#b-disabled")).toHaveCSS("outline-style", "solid");
    await expectContrast(page, [{ sel: "#b-disabled", what: "the focus ring", part: "outline", min: 3 }]);
  });

  test("keyboard: Enter or Space activates a button", async ({ page }) => {
    await visitStates(page, "button", theme);
    await page.evaluate(() => {
      const w = window as unknown as { presses: number };
      w.presses = 0;
      document.querySelector("#b-focus")?.addEventListener("click", () => w.presses++);
    });
    await page.locator("#b-focus").focus();
    await page.keyboard.press("Enter");
    await page.keyboard.press("Space");
    expect(await page.evaluate(() => (window as unknown as { presses: number }).presses)).toBe(2);
  });

  test("keyboard: Enter follows a link styled as a button", async ({ page }) => {
    await visitStates(page, "button", theme);
    await page.locator("#b-link").focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#jobs$/);
  });

  test("behaviour: a pending button keeps its width and shows the spinner", async ({ page }) => {
    await visitStates(page, "button", theme);
    const busy = await page.locator("#b-pending").boundingBox();
    const rest = await page.locator("#b-pending-twin").boundingBox();
    expect(busy?.width).toBe(rest?.width);
    await expect(page.locator("#b-pending .cap-btn-spinner")).toBeVisible();
    await expect(page.locator("#b-pending-twin .cap-btn-spinner")).toBeHidden();
    await expect(page.locator("#b-pending .cap-btn-label")).toHaveCSS("opacity", "0");
  });

  test("behaviour: a button is at least the control height and an icon button is square", async ({ page }) => {
    await visitStates(page, "button", theme);
    const b = await page.locator("#b-default").boundingBox();
    expect(b?.height).toBeGreaterThanOrEqual(32);
    const icon = await page.locator("#b-icon").boundingBox();
    expect(icon?.width).toBe(icon?.height);
    const link = await page.locator("#b-linkbtn").boundingBox();
    expect(link?.height).toBeGreaterThanOrEqual(24);
  });
});
