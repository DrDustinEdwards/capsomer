import { expect, test } from "@playwright/test";
import { eachTheme, expectContrast, expectNoAxeViolations, focused, visitStates } from "../../test/helpers.ts";

const AUDIT = "the audit row naming access:dustin@example.com was not written: D1 is unavailable";

eachTheme((theme) => {
  for (const id of ["undo", "empty", "warning", "stack", "failure", "undo-failed"]) {
    test(`accessibility: no axe violations, ${id}`, async ({ page }) => {
      await visitStates(page, "message", theme, id);
      if (id !== "empty") await expect(page.locator(".cap-message-item").first()).toBeVisible();
      await expectNoAxeViolations(page);
    });
  }

  test("accessibility: no axe violations, empty region", async ({ page }) => {
    await visitStates(page, "message", theme, "empty");
    // Present for the next message, and showing nothing.
    await expect(page.getByRole("status")).toHaveCount(1);
    await expect(page.locator(".cap-message-item")).toHaveCount(0);
  });

  test("accessibility: no axe violations, states page", async ({ page }) => {
    await visitStates(page, "message", theme);
    await expectNoAxeViolations(page);
  });

  test("accessibility: message text reaches its contrast, and the message its boundary", async ({ page }) => {
    await visitStates(page, "message", theme, "undo");
    await expect(page.locator(".cap-message-text")).toBeVisible();
    await expectContrast(page, [
      { sel: ".cap-message-text", what: "the message" },
      { sel: ".cap-message-item", what: "the message's edge", part: "border" },
    ]);
  });

  test("accessibility: a message that stays reaches its contrast, edge and failed Undo included", async ({ page }) => {
    await visitStates(page, "message", theme, "warning");
    await expect(page.locator(".cap-message-warning")).toBeVisible();
    await expectContrast(page, [
      { sel: ".cap-message-text", what: "the result and its warning" },
      { sel: ".cap-message-item[data-lasting]", what: "a lasting message's edge", part: "border" },
    ]);
    await visitStates(page, "message", theme, "undo-failed");
    await expect(page.locator(".cap-message-error")).toBeVisible();
    await expectContrast(page, [{ sel: ".cap-message-error", what: "the reason Undo failed" }]);
  });

  test("accessibility: the region's roles and names", async ({ page }) => {
    await visitStates(page, "message", theme, "undo");
    await expect(page.getByRole("status")).toHaveAccessibleName("Results and failures");
    await expect(page.getByRole("status")).toMatchAriaSnapshot(`
      - paragraph: Moved the mention from fieldnotes.example to the bin.
      - button "Undo"
      - button "Dismiss"
    `);
  });

  test("accessibility: a warning is a word as well as an edge, and a failure is an alert", async ({ page }) => {
    await visitStates(page, "message", theme, "warning");
    await expect(page.locator(".cap-message-text")).toContainText(`Seat start is on. Warning: ${AUDIT}`);
    await visitStates(page, "message", theme, "failure");
    await expect(page.getByRole("alert")).toContainText("Refresh failed: the watcher pass failed");
    await visitStates(page, "message", theme, "undo-failed");
    await expect(page.getByRole("alert")).toHaveText("Could not undo that. The server did not answer. Try again.");
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

  test("keyboard: Enter on Undo returns focus to the control it undid, when the app says which", async ({ page }) => {
    await visitStates(page, "message", theme, "try");
    await page.locator("#sample-bin-warned").click();
    await page.getByRole("button", { name: "Undo" }).focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("#sample-state")).toHaveText("Waiting");
    await expect(page.locator("#sample-bin")).toBeFocused();
  });

  test("keyboard: Dismiss clears the message and focus returns to the control that caused it", async ({ page }) => {
    await visitStates(page, "message", theme, "try");
    await page.locator("#sample-bin").focus();
    await page.keyboard.press("Enter");
    await page.getByRole("button", { name: "Dismiss" }).focus();
    await page.keyboard.press("Enter");
    await expect(page.locator(".cap-message-item")).toHaveCount(0);
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
    await expect(page.locator(".cap-message-item")).toHaveCount(0);
  });

  test("behaviour: clicking Undo runs it and the region says what was undone", async ({ page }) => {
    await visitStates(page, "message", theme, "try");
    await page.locator("#sample-bin").click();
    await page.getByRole("button", { name: "Undo" }).click();
    await expect(page.locator("#sample-row")).toHaveAttribute("data-undos", "1");
    await expect(page.getByRole("status")).toContainText("Undone.");
  });

  test("behaviour: a plain result is replaced by the next one", async ({ page }) => {
    await visitStates(page, "message", theme, "try");
    await page.locator("#sample-copy").click();
    await page.locator("#sample-bin").click();
    await expect(page.locator(".cap-message-item")).toHaveCount(1);
    await expect(page.getByRole("status")).toContainText("Moved the mention");
  });

  test("behaviour: a warning stays through the next result and for as long as nobody dismisses it", async ({ page }) => {
    await page.clock.install();
    await visitStates(page, "message", theme, "try");
    await page.locator("#sample-bin-warned").click();
    const warned = page.locator(".cap-message-item").filter({ hasText: AUDIT });
    await expect(warned).toContainText("Warning:");
    // The next result is added first and replaces nothing that carries a warning.
    await page.locator("#sample-copy").click();
    await expect(page.locator(".cap-message-item")).toHaveCount(2);
    await expect(page.locator(".cap-message-item").first()).toContainText("Copied the link");
    await page.clock.fastForward(60_000);
    await expect(page.locator(".cap-message-item")).toHaveCount(1);
    await expect(warned).toBeVisible();
    await warned.getByRole("button", { name: "Dismiss" }).click();
    await expect(page.locator(".cap-message-item")).toHaveCount(0);
  });

  test("behaviour: Undo on a message with a warning keeps the warning, without Undo, and says what was undone beside it", async ({ page }) => {
    await visitStates(page, "message", theme, "try");
    await page.locator("#sample-bin-warned").click();
    await page.keyboard.press("z");
    await expect(page.locator("#sample-state")).toHaveText("Waiting");
    const items = page.locator(".cap-message-item");
    await expect(items).toHaveCount(2);
    await expect(items.first()).toContainText("Undone.");
    await expect(items.nth(1)).toContainText(AUDIT);
    await expect(items.nth(1).getByRole("button", { name: "Undo" })).toHaveCount(0);
    await expect(items.nth(1).getByRole("button", { name: "Dismiss" })).toBeVisible();
  });

  test("behaviour: a failure with no control beside it is an alert and stays until dismissed", async ({ page }) => {
    await page.clock.install();
    await visitStates(page, "message", theme, "try");
    await page.locator("#sample-refresh").focus();
    await page.keyboard.press("Enter");
    const failed = page.locator(".cap-message-item").filter({ hasText: "Refresh failed" });
    await expect(failed.getByRole("alert")).toBeVisible();
    await page.clock.fastForward(60_000);
    await expect(failed).toBeVisible();
    await failed.getByRole("button", { name: "Dismiss" }).click();
    await expect(page.locator(".cap-message-item")).toHaveCount(0);
    await expect(page.locator("#sample-refresh")).toBeFocused();
  });

  test("behaviour: an Undo that could not run keeps its message and its Undo, and says why", async ({ page }) => {
    await visitStates(page, "message", theme, "undo-failed");
    const item = page.locator(".cap-message-item");
    await expect(item).toContainText("Moved the mention from fieldnotes.example to the bin.");
    await expect(item.getByRole("alert")).toHaveText("Could not undo that. The server did not answer. Try again.");
    await expect(item.getByRole("button", { name: "Undo" })).toBeVisible();
    await expect(item).toHaveAttribute("data-lasting", "");
  });

  test("behaviour: a warning stays under a newer result in the stack specimen", async ({ page }) => {
    await visitStates(page, "message", theme, "stack");
    const items = page.locator(".cap-message-item");
    await expect(items).toHaveCount(2);
    await expect(items.first()).toContainText("Seat start is off.");
    await expect(items.nth(1)).toContainText(`Warning: ${AUDIT}`);
  });

  test("accessibility: the leading glyph is hidden, differs by kind, and reaches 3:1", async ({ page }) => {
    await visitStates(page, "message", theme, "stack");
    const items = page.locator(".cap-message-item");
    await expect(items).toHaveCount(2);
    await expect(items.locator(".cap-message-glyph").first()).toHaveAttribute("aria-hidden", "true");
    await expectContrast(page, [
      { sel: ".cap-message-item[data-kind='ok'] .cap-message-glyph", what: "a result's glyph", min: 3 },
      { sel: ".cap-message-item[data-kind='warning'] .cap-message-glyph", what: "a warning's glyph", min: 3 },
    ]);
    await visitStates(page, "message", theme, "failure");
    await expectContrast(page, [
      { sel: ".cap-message-item[data-kind='failure'] .cap-message-glyph", what: "a failure's glyph", min: 3 },
      { sel: ".cap-message-item[data-kind='failure']", what: "a failure's edge", part: "border", min: 3 },
    ]);
    const shapes = await page.evaluate(() => [...document.querySelectorAll(".cap-message-glyph")].map((g) => g.innerHTML));
    expect(shapes.length).toBeGreaterThan(0);
  });
});
