import { expect, test, type Page } from "@playwright/test";
import { eachTheme, expectContrast, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

const revoke = (page: Page) => page.getByRole("button", { name: "Revoke foxhound-driver…" });
const dialog = (page: Page, name = "Revoke foxhound-driver?") => page.getByRole("alertdialog", { name });

async function openLive(page: Page, theme: "light" | "dark") {
  await visitStates(page, "confirm-dialog", theme, "live");
  await revoke(page).focus();
  await page.keyboard.press("Enter");
  await expect(dialog(page)).toBeVisible();
}

eachTheme((theme) => {
  test("accessibility: no axe violations, the states page", async ({ page }) => {
    await visitStates(page, "confirm-dialog", theme);
    await expectNoAxeViolations(page);
  });

  for (const id of ["open", "comfortable", "busy", "error", "typed-empty", "typed-matched", "reason-missing"]) {
    test(`accessibility: no axe violations, ${id}`, async ({ page }) => {
      await visitStates(page, "confirm-dialog", theme, id);
      await expect(page.locator("dialog.cap-dialog")).toBeVisible();
      await expectNoAxeViolations(page);
    });
  }

  test("accessibility: dialog text, the error and the guard reach their contrast", async ({ page }) => {
    await visitStates(page, "confirm-dialog", theme, "error");
    await expectContrast(page, [
      { sel: ".cap-dialog-title", what: "the dialog title" },
      { sel: ".cap-dialog-body li", what: "a line of what changes" },
      { sel: ".cap-dialog-description", what: "the lead sentence" },
      { sel: ".cap-confirm-error-lead", what: "the error's lead" },
      { sel: ".cap-confirm-error p:not(.cap-confirm-error-lead)", what: "the error's reason" },
      { sel: ".cap-confirm-error", what: "the error's boundary", part: "border" },
    ]);
    await visitStates(page, "confirm-dialog", theme, "typed-empty");
    await expectContrast(page, [
      { sel: ".cap-confirm-typed label", what: "the guard's label" },
      { sel: ".cap-confirm-typed input", what: "the guard field's boundary", part: "border" },
    ]);
  });

  test("accessibility: the reason's label, note and boundary reach their contrast", async ({ page }) => {
    await visitStates(page, "confirm-dialog", theme, "reason-missing");
    await expectContrast(page, [
      { sel: ".cap-confirm-reason label", what: "the reason's label" },
      { sel: ".cap-confirm-note", what: "the note under the reason" },
      { sel: ".cap-confirm-reason textarea", what: "the invalid reason field's boundary", part: "border" },
    ]);
  });

  test("accessibility: the dialog's roles and names", async ({ page }) => {
    await visitStates(page, "confirm-dialog", theme, "open");
    await expect(page.locator("dialog.cap-dialog")).toMatchAriaSnapshot(`
      - alertdialog "Revoke foxhound-driver?":
        - heading "Revoke foxhound-driver?" [level=2]
        - paragraph: This cannot be undone. The agent stops working at once.
        - list:
          - listitem: Its key stops being accepted.
          - listitem: Its 1 claimed job goes back to the queue.
          - listitem: An audit row records the revocation under your name.
        - button "Cancel"
        - button "Revoke agent"
    `);
    await expect(page.locator("dialog.cap-dialog")).toHaveAccessibleDescription(/This cannot be undone\..*Its key stops being accepted\./);
  });

  test("keyboard: focus starts on Cancel when the dialog opens", async ({ page }) => {
    await openLive(page, theme);
    await expect(page.getByRole("button", { name: "Cancel" })).toBeFocused();
  });

  test("accessibility: it is an alert dialog with no corner Close button", async ({ page }) => {
    await openLive(page, theme);
    await expect(dialog(page)).toHaveAttribute("role", "alertdialog");
    await expect(dialog(page).getByRole("button", { name: "Close" })).toHaveCount(0);
  });

  test("keyboard: Tab moves from Cancel to the action and Shift Tab back", async ({ page }) => {
    await openLive(page, theme);
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "Revoke agent" })).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(page.getByRole("button", { name: "Cancel" })).toBeFocused();
  });

  test("keyboard: Esc closes the dialog and focus returns to the opener", async ({ page }) => {
    await openLive(page, theme);
    await page.keyboard.press("Escape");
    await expect(dialog(page)).toBeHidden();
    await expect(revoke(page)).toBeFocused();
    await expect(page.getByRole("status")).toHaveText("Nothing changed.");
  });

  test("keyboard: Enter on Cancel closes the dialog and focus returns to the opener", async ({ page }) => {
    await openLive(page, theme);
    await page.keyboard.press("Enter");
    await expect(dialog(page)).toBeHidden();
    await expect(revoke(page)).toBeFocused();
  });

  test("behaviour: a click outside the dialog does not close it", async ({ page }) => {
    await openLive(page, theme);
    await page.mouse.click(8, 8);
    await expect(dialog(page)).toBeVisible();
    await expect(page.getByRole("button", { name: "Cancel" })).toBeFocused();
  });

  test("keyboard: Esc is held while the action runs, and focus goes to the page when the opener has gone", async ({ page }) => {
    await openLive(page, theme);
    await page.keyboard.press("Tab");
    const perform = page.getByRole("button", { name: "Revoke agent" });
    await expect(perform).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(dialog(page)).toHaveAttribute("aria-busy", "true");
    await expect(perform).toHaveAttribute("aria-busy", "true");
    await expect(page.getByRole("button", { name: "Cancel" })).toHaveAttribute("aria-disabled", "true");
    await page.keyboard.press("Escape");
    await page.keyboard.press("Escape");
    await expect(dialog(page)).toBeVisible();
    // Cancel is aria-disabled while busy, so a pointer click reaches it and does nothing.
    await page.getByRole("button", { name: "Cancel" }).dispatchEvent("click");
    await expect(dialog(page)).toBeVisible();
    await page.evaluate(() => (window as unknown as { capRelease: () => void }).capRelease());
    await expect(dialog(page)).toBeHidden();
    await expect(page.getByRole("status")).toHaveText("Revoked foxhound-driver.");
    // The opener went with its row, so focus lands on the main region, not the body.
    await expect(page.locator("main")).toBeFocused();
  });

  test("keyboard: Esc is held in the busy specimen", async ({ page }) => {
    await visitStates(page, "confirm-dialog", theme, "busy");
    await expect(page.locator("dialog.cap-dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator("dialog.cap-dialog")).toBeVisible();
  });

  test("behaviour: a failure stays inside the dialog with its reason and Try again", async ({ page }) => {
    await openLive(page, theme);
    await page.getByRole("button", { name: "Revoke agent" }).click();
    await page.evaluate(() => (window as unknown as { capFail: () => void }).capFail());
    const alert = dialog(page).getByRole("alert");
    await expect(alert).toContainText("Not done. Nothing was changed.");
    await expect(alert).toContainText("The server did not answer in 10 seconds.");
    const again = page.getByRole("button", { name: "Try again" });
    await expect(again).toBeFocused();
    await expect(dialog(page)).not.toHaveAttribute("aria-busy", "true");
    await page.keyboard.press("Escape");
    await expect(dialog(page)).toBeHidden();
  });

  test("keyboard: the typed word turns the action on, in any case", async ({ page }) => {
    await visitStates(page, "confirm-dialog", theme, "live");
    await page.getByRole("button", { name: "Delete the germomics.org record…" }).click();
    const d = dialog(page, "Delete the germomics.org record?");
    await expect(d).toBeVisible();
    await expect(page.getByRole("button", { name: "Cancel" })).toBeFocused();
    const perform = page.getByRole("button", { name: "Delete record" });
    await expect(perform).toHaveAttribute("aria-disabled", "true");
    await expect(perform).toHaveAccessibleDescription("Type delete to confirm");
    // Pressing it before the word is typed moves to the field and runs nothing.
    await perform.dispatchEvent("click");
    await expect(d).not.toHaveAttribute("aria-busy", "true");
    const field = page.getByRole("textbox", { name: "Type delete to confirm" });
    await expect(field).toBeFocused();
    await page.keyboard.type("DELETE");
    await expect(perform).not.toHaveAttribute("aria-disabled", "true");
    await page.keyboard.press("Enter");
    await expect(d).toHaveAttribute("aria-busy", "true");
  });

  test("keyboard: a required reason is asked for, pressing with it empty says so and sends nothing", async ({ page }) => {
    await visitStates(page, "confirm-dialog", theme, "live");
    await page.getByRole("button", { name: "Mark job_0cdf2803f0ba failed…" }).click();
    const d = dialog(page, "Mark job failed: Rotate the watcher's Cloudflare token");
    await expect(d).toBeVisible();
    await expect(page.getByRole("button", { name: "Cancel" })).toBeFocused();
    const field = page.getByRole("textbox", { name: "Reason (required)" });
    await expect(field).not.toHaveAttribute("aria-invalid", "true");
    const perform = page.getByRole("button", { name: "Mark failed" });
    // Never a silently disabled button: pressing it says what is missing.
    await expect(perform).not.toHaveAttribute("aria-disabled", "true");
    await perform.click();
    await expect(d).not.toHaveAttribute("aria-busy", "true");
    await expect(d.getByRole("alert")).toContainText("A reason is required.");
    await expect(field).toHaveAttribute("aria-invalid", "true");
    await expect(field).toBeFocused();
    await expect(field).toHaveAccessibleDescription(/A reason is required\./);
    // A plain Enter is a new line; Ctrl or Cmd with Enter performs.
    await page.keyboard.type("rotated by hand");
    await page.keyboard.press("Enter");
    await expect(d).not.toHaveAttribute("aria-busy", "true");
    await page.keyboard.press("ControlOrMeta+Enter");
    await expect(d).toHaveAttribute("aria-busy", "true");
    await page.evaluate(() => (window as unknown as { capRelease: () => void }).capRelease());
    await expect(d).toBeHidden();
    await expect(page.getByRole("status")).toContainText("Marked failed: rotated by hand");
  });

  test("behaviour: a reason the browser filled in without an input event still counts", async ({ page }) => {
    await visitStates(page, "confirm-dialog", theme, "live");
    await page.getByRole("button", { name: "Mark job_0cdf2803f0ba failed…" }).click();
    await page.getByRole("textbox", { name: "Reason (required)" }).evaluate((el: HTMLTextAreaElement) => {
      el.value = "filled by the browser";
    });
    await page.getByRole("button", { name: "Mark failed" }).click();
    await expect(dialog(page, "Mark job failed: Rotate the watcher's Cloudflare token")).toHaveAttribute("aria-busy", "true");
  });

  test("behaviour: the matched specimen's action is on", async ({ page }) => {
    await visitStates(page, "confirm-dialog", theme, "typed-matched");
    await expect(page.getByRole("button", { name: "Delete record" })).not.toHaveAttribute("aria-disabled", "true");
  });
});
