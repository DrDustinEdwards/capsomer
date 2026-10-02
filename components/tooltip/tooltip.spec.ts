import { expect, test } from "@playwright/test";
import { eachTheme, expectContrast, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations, with tips shown", async ({ page }) => {
    await visitStates(page, "tooltip", theme);
    await expect(page.locator("#tip-copy")).toBeVisible();
    await expectNoAxeViolations(page);
  });

  test("accessibility: tip text and the key cap in a tip reach their contrast", async ({ page }) => {
    await visitStates(page, "tooltip", theme);
    await expect(page.locator("#tip-copy")).toBeVisible();
    await expectContrast(page, [
      { sel: "#tip-copy", what: "tooltip text" },
      { sel: "#tip-refresh kbd", what: "a key cap in a tooltip" },
    ]);
  });

  test("accessibility: the trigger keeps its own name, and the tip is its description", async ({ page }) => {
    await visitStates(page, "tooltip", theme);
    const retry = page.getByRole("button", { name: "Retry job" });
    await expect(retry).toHaveAccessibleName("Retry job");
    await expect(retry).toHaveAccessibleDescription("Runs job_7c21 again with the same inputs. Its last run failed at 14:02.");
    await expect(page.locator("#tip-copy")).toMatchAriaSnapshot(`
      - tooltip "Copies 366b902 to the clipboard."
    `);
  });

  test("keyboard: focus on the trigger shows the tip at once", async ({ page }) => {
    await visitStates(page, "tooltip", theme);
    const tip = page.locator("#tip-retry");
    await expect(tip).toBeHidden();
    await page.locator("#sample-retry").focus();
    await expect(tip).toBeVisible();
  });

  test("keyboard: Esc hides the tip and focus stays on the trigger", async ({ page }) => {
    await visitStates(page, "tooltip", theme);
    const retry = page.locator("#sample-retry");
    await retry.focus();
    await expect(page.locator("#tip-retry")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator("#tip-retry")).toBeHidden();
    await expect(retry).toBeFocused();
  });

  test("keyboard: moving focus away (blur) hides the tip", async ({ page }) => {
    await visitStates(page, "tooltip", theme);
    await page.locator("#sample-retry").focus();
    await expect(page.locator("#tip-retry")).toBeVisible();
    await page.keyboard.press("Tab");
    await expect(page.locator("#sample-next")).toBeFocused();
    await expect(page.locator("#tip-retry")).toBeHidden();
  });

  test("behaviour: hover shows the tip after a short delay, without covering its trigger", async ({ page }) => {
    await visitStates(page, "tooltip", theme);
    await page.locator("#sample-retry").hover();
    const tip = page.locator("#tip-retry");
    await expect(tip).toBeVisible();
    const [t, b] = await Promise.all([tip.boundingBox(), page.locator("#sample-retry").boundingBox()]);
    const apart = !!t && !!b && (t.y + t.height <= b.y || t.y >= b.y + b.height || t.x + t.width <= b.x || t.x >= b.x + b.width);
    expect(apart).toBe(true);
  });

  test("behaviour: the tip is the shared popover's tooltip variant, a manual popover with role tooltip", async ({ page }) => {
    await visitStates(page, "tooltip", theme);
    const tip = page.locator("#tip-retry");
    await expect(tip).toHaveAttribute("popover", "manual");
    await expect(tip).toHaveAttribute("role", "tooltip");
    await expect(tip).toHaveClass(/cap-popover/);
  });

  test("keyboard: Esc hides the tip while the pointer is still over the trigger, until the pointer leaves", async ({ page }) => {
    await visitStates(page, "tooltip", theme);
    await page.locator("#sample-retry").hover();
    const tip = page.locator("#tip-retry");
    await expect(tip).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(tip).toBeHidden();
    await page.waitForTimeout(450);
    await expect(tip).toBeHidden();
  });

  test("behaviour: the pointer can move onto the tip without it closing, and leaving hides it", async ({ page }) => {
    await visitStates(page, "tooltip", theme);
    await page.locator("#sample-retry").hover();
    const tip = page.locator("#tip-retry");
    await expect(tip).toBeVisible();
    const box = await tip.boundingBox();
    if (!box) throw new Error("the tip has no box");
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 4 });
    await page.waitForTimeout(400);
    await expect(tip).toBeVisible();
    await page.mouse.move(2, 2);
    await expect(tip).toBeHidden();
  });
});
