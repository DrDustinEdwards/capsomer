import { expect, test, type Page } from "@playwright/test";
import { eachTheme, expectContrast, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

// Whether the element is fully inside the window (a pixel of slack for rounding).
function inside(page: Page, sel: string): Promise<boolean> {
  return page.evaluate((s) => {
    const r = document.querySelector(s)?.getBoundingClientRect();
    if (!r) return false;
    return r.left >= -1 && r.top >= -1 && r.right <= document.documentElement.clientWidth + 1 && r.bottom <= window.innerHeight + 1;
  }, sel);
}

eachTheme((theme) => {
  test("accessibility: no axe violations on the states page, a popover and a tooltip open", async ({ page }) => {
    await visitStates(page, "popover", theme);
    await page.getByRole("button", { name: "Dimensions" }).click();
    await expect(page.getByRole("dialog", { name: "Dimensions" })).toBeVisible();
    await expectNoAxeViolations(page, undefined, { baseUi: true });
  });

  test("accessibility: the open specimens have no axe violations", async ({ page }) => {
    for (const id of ["open", "tip-open"]) {
      await visitStates(page, "popover", theme, id);
      await expect(page.locator("[popover]:popover-open")).toBeVisible();
      await expectNoAxeViolations(page);
    }
  });

  test("accessibility: text on the popover surface and in the tooltip reaches its contrast", async ({ page }) => {
    await visitStates(page, "popover", theme, "open");
    await expect(page.locator("#pop-open")).toBeVisible();
    await expectContrast(page, [
      { sel: "#pop-open .cap-popover-title", what: "popover title" },
      { sel: "#pop-open .cap-popover-description", what: "popover description" },
    ]);
    await visitStates(page, "popover", theme, "tip-open");
    await expect(page.locator("#open-tip")).toBeVisible();
    await expectContrast(page, [{ sel: "#open-tip", what: "tooltip text" }]);
  });

  test("accessibility: roles, names and the trigger's wiring", async ({ page }) => {
    await visitStates(page, "popover", theme);
    const trigger = page.getByRole("button", { name: "Dimensions" });
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
    await trigger.click();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator("#pop-dims")).toMatchAriaSnapshot(`
      - dialog "Dimensions":
        - heading "Dimensions" [level=2]
        - paragraph: Set the size of the status badge for foxhound.app.
    `);
    const retry = page.getByRole("button", { name: "Retry job" });
    await expect(retry).toHaveAccessibleName("Retry job");
    await expect(retry).toHaveAccessibleDescription(/^Runs job_7c21 again with the same inputs\./);
    await expect(retry).toHaveAttribute("aria-describedby", "tip-retry");
  });

  test("keyboard: Enter opens the popover and focus moves in; Esc closes it and focus returns to the trigger", async ({ page }) => {
    await visitStates(page, "popover", theme);
    const trigger = page.getByRole("button", { name: "Dimensions" });
    await trigger.focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("#pop-dims")).toBeVisible();
    await expect(page.getByLabel("Width in pixels")).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(page.locator("#pop-dims")).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test("keyboard: Tab moves through the popover, and past its last control closes it without taking focus", async ({ page }) => {
    await visitStates(page, "popover", theme);
    await page.getByRole("button", { name: "Dimensions" }).click();
    await expect(page.getByLabel("Width in pixels")).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "Done" })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.locator("#pop-dims")).toBeHidden();
    await expect(page.getByRole("button", { name: "Next control" })).toBeFocused();
  });

  test("keyboard: the Done button closes the popover and returns focus to the trigger", async ({ page }) => {
    await visitStates(page, "popover", theme);
    const trigger = page.getByRole("button", { name: "Dimensions" });
    await trigger.click();
    await page.getByRole("button", { name: "Done" }).click();
    await expect(page.locator("#pop-dims")).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test("keyboard: focusing a trigger shows its tooltip, Esc hides it and focus stays, blur hides it", async ({ page }) => {
    await visitStates(page, "popover", theme);
    const tip = page.locator("#tip-retry");
    await expect(tip).toBeHidden();
    const retry = page.getByRole("button", { name: "Retry job" });
    await retry.focus();
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Tab");
    await expect(retry).toBeFocused();
    await expect(tip).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(tip).toBeHidden();
    await expect(retry).toBeFocused();
    // Esc closes the tip only: no popover or dialog around it is dismissed.
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "Cancel job" })).toBeFocused();
    await expect(page.locator("#tip-cancel")).toBeVisible();
    await expect(tip).toBeHidden();
  });

  test("behaviour: clicking outside closes the popover (light dismiss)", async ({ page }) => {
    await visitStates(page, "popover", theme);
    await page.getByRole("button", { name: "Dimensions" }).click();
    await expect(page.locator("#pop-dims")).toBeVisible();
    await page.getByRole("heading", { level: 1 }).click();
    await expect(page.locator("#pop-dims")).toBeHidden();
  });

  test("behaviour: a tooltip waits on hover, then the next one opens at once (delay group)", async ({ page }) => {
    await visitStates(page, "popover", theme);
    await page.getByRole("button", { name: "Retry job" }).hover();
    await page.waitForTimeout(80);
    await expect(page.locator("#tip-retry")).toBeHidden();
    await expect(page.locator("#tip-retry")).toBeVisible();
    await page.getByRole("button", { name: "Cancel job" }).hover();
    await expect(page.locator("#tip-cancel")).toBeVisible({ timeout: 120 });
    await expect(page.locator("#tip-retry")).toBeHidden();
  });

  test("behaviour: the pointer can move onto a tooltip without it closing (WCAG 1.4.13)", async ({ page }) => {
    await visitStates(page, "popover", theme);
    await page.getByRole("button", { name: "Retry job" }).hover();
    await expect(page.locator("#tip-retry")).toBeVisible();
    await page.locator("#tip-retry").hover();
    await page.waitForTimeout(500);
    await expect(page.locator("#tip-retry")).toBeVisible();
    await page.mouse.move(2, 2);
    await expect(page.locator("#tip-retry")).toBeHidden();
  });

  test("behaviour: placement stays inside the window, by CSS and by the script fallback", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 240 });
    for (const id of ["flip-css", "flip-js"]) {
      await visitStates(page, "popover", theme, "flip");
      await page.locator(`#${id}`).click();
      const popup = page.locator(`#${id === "flip-css" ? "pop-flip-css" : "pop-flip-js"}`);
      await expect(popup).toBeVisible();
      await page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished.catch(() => undefined))).then(() => undefined));
      expect(await inside(page, `#${await popup.getAttribute("id")}`), `${id} popup is inside the window`).toBe(true);
    }
  });

  test("behaviour: with little room below, the popup opens above its trigger", async ({ page }) => {
    await page.setViewportSize({ width: 600, height: 300 });
    await visitStates(page, "popover", theme, "flip");
    await page.locator("#flip-js").click();
    await expect(page.locator("#pop-flip-js")).toBeVisible();
    const above = await page.evaluate(() => {
      const t = document.querySelector("#flip-js")!.getBoundingClientRect();
      const p = document.querySelector("#pop-flip-js")!.getBoundingClientRect();
      return p.bottom <= t.top + 1 || p.top >= t.bottom - 1;
    });
    expect(above).toBe(true);
  });

  test("behaviour: under reduced motion nothing animates", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await visitStates(page, "popover", theme);
    await page.getByRole("button", { name: "Dimensions" }).click();
    await expect(page.locator("#pop-dims")).toBeVisible();
    const t = await page.locator("#pop-dims").evaluate((el) => getComputedStyle(el).transitionDuration);
    expect(t.split(",").every((d) => parseFloat(d) <= 0.001)).toBe(true);
  });
});
