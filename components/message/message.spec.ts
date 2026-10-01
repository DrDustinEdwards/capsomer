import { expect, test } from "@playwright/test";
import { eachTheme, expectContrast, expectNoAxeViolations, focused, visitStates } from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations, message with Undo", async ({ page }) => {
    await visitStates(page, "message", theme, "undo");
    await expectNoAxeViolations(page);
  });

  test("accessibility: no axe violations, empty region", async ({ page }) => {
    await visitStates(page, "message", theme, "empty");
    await expectNoAxeViolations(page);
    // Present for the next message, and showing nothing.
    const region = page.getByRole("status");
    await expect(region).toHaveCount(1);
    await expect(region.locator(".cap-message-text")).toHaveText("");
  });

  test("accessibility: no axe violations, states page", async ({ page }) => {
    await visitStates(page, "message", theme);
    await expectNoAxeViolations(page);
  });

  test("accessibility: message text reaches its contrast, and the region its boundary", async ({ page }) => {
    await visitStates(page, "message", theme, "undo");
    await expectContrast(page, [
      { sel: ".cap-message-text", what: "the message" },
      { sel: ".cap-message", what: "the region's edge", part: "border" },
    ]);
  });

  test("accessibility: the region's roles and names", async ({ page }) => {
    await visitStates(page, "message", theme, "undo");
    await expect(page.getByRole("status")).toMatchAriaSnapshot(`
      - status:
        - paragraph: Moved the mention from fieldnotes.example to the bin.
        - button "Undo"
        - button "Dismiss"
    `);
  });

  test("keyboard: a message appears without moving focus", async ({ page }) => {
    await visitStates(page, "message", theme, "try");
    const bin = page.locator("#sample-bin");
    await bin.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("status")).toContainText("Moved the mention from fieldnotes.example to the bin.");
    await expect(bin, await focused(page)).toBeFocused();
  });

  test("keyboard: z runs the current Undo, once", async ({ page }) => {
    await visitStates(page, "message", theme, "try");
    await page.locator("#sample-bin").focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("#sample-state")).toHaveText("In the bin");
    await page.keyboard.press("z");
    await expect(page.locator("#sample-state")).toHaveText("Waiting");
    await expect(page.getByRole("status")).toContainText("Undone. The mention from fieldnotes.example is waiting again.");
    await expect(page.getByRole("button", { name: "Undo" })).toBeHidden();
    await page.keyboard.press("z");
    await expect(page.locator("#sample-row")).toHaveAttribute("data-undos", "1");
  });

  test("keyboard: z typed into a text field is text, not Undo", async ({ page }) => {
    await visitStates(page, "message", theme, "try");
    await page.locator("#sample-bin").click();
    const note = page.locator("#sample-note");
    await note.focus();
    await page.keyboard.press("z");
    await expect(note).toHaveValue("z");
    await expect(page.locator("#sample-state")).toHaveText("In the bin");
    await expect(page.locator("#sample-row")).toHaveAttribute("data-undos", "0");
  });

  test("keyboard: z with a modifier held does nothing", async ({ page }) => {
    await visitStates(page, "message", theme, "try");
    await page.locator("#sample-bin").click();
    await page.keyboard.press("Shift+Z");
    await page.keyboard.press("Alt+z");
    await expect(page.locator("#sample-state")).toHaveText("In the bin");
  });

  test("keyboard: Enter on Undo runs it and focus moves to Dismiss", async ({ page }) => {
    await visitStates(page, "message", theme, "try");
    await page.locator("#sample-bin").click();
    const undo = page.getByRole("button", { name: "Undo" });
    await undo.focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("#sample-state")).toHaveText("Waiting");
    await expect(page.getByRole("button", { name: "Dismiss" })).toBeFocused();
  });

  test("keyboard: Dismiss clears the message and focus returns to the control that caused it", async ({ page }) => {
    await visitStates(page, "message", theme, "try");
    await page.locator("#sample-bin").focus();
    await page.keyboard.press("Enter");
    await page.getByRole("button", { name: "Dismiss" }).focus();
    await page.keyboard.press("Enter");
    await expect(page.locator(".cap-message-text")).toHaveText("");
    await expect(page.locator("#sample-bin")).toBeFocused();
    // Nothing is left to undo.
    await page.keyboard.press("z");
    await expect(page.locator("#sample-state")).toHaveText("In the bin");
  });

  test("behaviour: a message with Undo stays until dismissed", async ({ page }) => {
    await page.clock.install();
    await visitStates(page, "message", theme, "try");
    await page.locator("#sample-bin").click();
    await page.clock.fastForward(60_000);
    await expect(page.getByRole("status")).toContainText("Moved the mention");
  });

  test("behaviour: a plain confirmation that asks to clear goes after 4 seconds, with no buttons", async ({ page }) => {
    await page.clock.install();
    await visitStates(page, "message", theme, "try");
    await page.locator("#sample-copy").click();
    await expect(page.getByRole("status")).toContainText("Copied the link to the mention.");
    await expect(page.getByRole("button", { name: "Dismiss" })).toBeHidden();
    await page.clock.fastForward(4_100);
    await expect(page.locator(".cap-message-text")).toHaveText("");
  });

  test("behaviour: clicking Undo runs it and the region says what was undone", async ({ page }) => {
    await visitStates(page, "message", theme, "try");
    await page.locator("#sample-bin").click();
    await page.getByRole("button", { name: "Undo" }).click();
    await expect(page.locator("#sample-row")).toHaveAttribute("data-undos", "1");
    await expect(page.getByRole("status")).toContainText("Undone.");
  });
});
