import { expect, test, type Page } from "@playwright/test";
import { eachTheme, expectContrast, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";
import { countText, fillCount, plural, previewItems } from "./bulk-bar.ts";

const check = (page: Page, list: string, n: number) => page.locator(`#${list} li:nth-child(${n}) input`);

test("behaviour: the count, the templates and the preview are pure", () => {
  expect(countText(3)).toBe("3 selected");
  expect(fillCount("Bin {n} item{s}", 12)).toBe("Bin 12 items");
  expect(fillCount("Bin {n} item{s}", 1)).toBe("Bin 1 item");
  expect(plural(1, "draft")).toBe("draft");
  expect(plural(2, "draft")).toBe("drafts");
  expect(previewItems([{ id: "a", label: "First" }, { id: "b", label: "Second" }])).toEqual(["First", "Second"]);
});

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "bulk-bar", theme);
    await expectNoAxeViolations(page);
  });

  test("accessibility: the count, the detail and the edge reach their contrast", async ({ page }) => {
    await visitStates(page, "bulk-bar", theme);
    await expectContrast(page, [
      { sel: "#bulk-static .cap-bulk-count", what: "the count" },
      { sel: "#bulk-static .cap-bulk-detail", what: "the size beside the count" },
      { sel: "#bulk-static .cap-bulk-clear", what: "Clear selection" },
      { sel: "#bulk-static [data-cap-bulk-action='bin']", what: "the destructive action's label" },
      { sel: "#bulk-static .cap-bulk-field label", what: "a value field's label" },
      { sel: "#bulk-static", what: "the bar's edge", part: "border" },
    ]);
  });

  test("accessibility: the bar is a named region with a live count and its actions", async ({ page }) => {
    await visitStates(page, "bulk-bar", theme);
    await expect(page.locator("#bulk-static")).toMatchAriaSnapshot(`
      - region "Bulk actions":
        - status: 3 selected 2.4 MB
        - button "Select all 24 in view"
        - button "Archive"
        - text: Tag
        - combobox "Tag"
        - button "Add tag"
        - button "Bin"
        - button "Clear selection"
    `);
  });

  test("accessibility: the delivered HTML has the selection, and the empty bar is hidden", async ({ page }) => {
    const html = await (await page.request.get("components/bulk-bar/states.html")).text();
    expect(html).toContain('<p class="cap-bulk-count" role="status">3 selected <span');
    expect(html).toContain('<p class="cap-bulk-count" role="status">12 selected</p>');
    await visitStates(page, "bulk-bar", theme);
    await expect(page.locator("#bulk-none")).toBeHidden();
    await expect(page.locator("#bulk-none")).toHaveAttribute("hidden", "");
  });

  test("keyboard: Tab goes through the bar's controls in reading order", async ({ page }) => {
    await visitStates(page, "bulk-bar", theme);
    await page.getByRole("button", { name: "Select all 24 in view" }).focus();
    await page.keyboard.press("Tab");
    await expect(page.locator("#bulk-static").getByRole("button", { name: "Archive" })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.locator("#bulk-static").getByRole("combobox", { name: "Tag" })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.locator("#bulk-static").getByRole("button", { name: "Add tag" })).toBeFocused();
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await expect(page.locator("#bulk-static").getByRole("button", { name: "Clear selection" })).toBeFocused();
  });

  test("keyboard: Space on an item's checkbox selects it and the bar appears", async ({ page }) => {
    await visitStates(page, "bulk-bar", theme);
    await expect(page.locator("#bulk-live")).toBeHidden();
    await check(page, "live-list", 2).focus();
    await page.keyboard.press("Space");
    await expect(page.locator("#bulk-live")).toBeVisible();
    await expect(page.locator("#bulk-live .cap-bulk-count")).toHaveText("1 selected");
    await check(page, "live-list", 4).focus();
    await page.keyboard.press("Space");
    await expect(page.locator("#bulk-live .cap-bulk-count")).toHaveText("2 selected");
  });

  test("keyboard: Enter on a reversible action runs it at once and the region offers Undo", async ({ page }) => {
    await visitStates(page, "bulk-bar", theme);
    await check(page, "live-list", 1).check();
    await check(page, "live-list", 2).check();
    await page.locator("#bulk-live").getByRole("button", { name: "Archive" }).focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("alertdialog")).toHaveCount(0);
    await expect(page.locator("#live-list li:visible")).toHaveCount(3);
    await expect(page.locator(".cap-message-item")).toContainText("Archived 2 drafts.");
    await expect(page.locator("#bulk-live")).toBeHidden();
    await expect(page.getByRole("button", { name: "Undo" })).toBeVisible();
  });

  test("keyboard: z undoes the last reversible action", async ({ page }) => {
    await visitStates(page, "bulk-bar", theme);
    await check(page, "live-list", 1).check();
    await page.locator("#bulk-live").getByRole("button", { name: "Archive" }).click();
    await expect(page.locator("#live-list li:visible")).toHaveCount(4);
    await page.locator("h1").click();
    await page.keyboard.press("z");
    await expect(page.locator("#live-list li:visible")).toHaveCount(5);
    await expect(page.locator(".cap-message-item")).toContainText("Brought 1 draft back.");
  });

  test("keyboard: Esc in the list clears the selection and hides the bar", async ({ page }) => {
    await visitStates(page, "bulk-bar", theme);
    await check(page, "live-list", 3).check();
    await check(page, "live-list", 3).focus();
    await expect(page.locator("#bulk-live")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator("#bulk-live")).toBeHidden();
    await expect(check(page, "live-list", 3)).not.toBeChecked();
    await expect(check(page, "live-list", 3)).toBeFocused();
  });

  test("keyboard: Esc in the bar clears the selection and focus goes back to the list", async ({ page }) => {
    await visitStates(page, "bulk-bar", theme);
    await check(page, "live-list", 2).check();
    await page.locator("#bulk-live").getByRole("button", { name: "Archive" }).focus();
    await page.keyboard.press("Escape");
    await expect(page.locator("#bulk-live")).toBeHidden();
    await expect(check(page, "live-list", 2)).toBeFocused();
  });

  test("keyboard: Enter on Clear selection clears and returns focus to the list", async ({ page }) => {
    await visitStates(page, "bulk-bar", theme);
    await check(page, "live-list", 4).check();
    await page.locator("#bulk-live").getByRole("button", { name: "Clear selection" }).focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("#bulk-live")).toBeHidden();
    await expect(check(page, "live-list", 4)).toBeFocused();
  });

  test("keyboard: Enter on a destructive action opens the preview with focus on Cancel", async ({ page }) => {
    await visitStates(page, "bulk-bar", theme);
    await check(page, "live-list", 1).check();
    await check(page, "live-list", 3).check();
    const bin = page.locator("#bulk-live").getByRole("button", { name: "Bin" });
    await bin.focus();
    await page.keyboard.press("Enter");
    const dialog = page.getByRole("alertdialog", { name: "Bin 2 items?" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Cancel" })).toBeFocused();
    await expect(dialog.getByRole("listitem")).toHaveText(["Notes on the Foxhound release", "What a mention queue is for"]);
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(bin).toBeFocused();
    await expect(page.locator("#live-list li")).toHaveCount(5);
    await expect(page.locator("#bulk-live .cap-bulk-count")).toHaveText("2 selected");
  });

  test("keyboard: Enter on the preview's action performs it, and nothing is read as done before", async ({ page }) => {
    await visitStates(page, "bulk-bar", theme);
    await check(page, "live-list", 1).check();
    await check(page, "live-list", 2).check();
    await page.locator("#bulk-live").getByRole("button", { name: "Bin" }).click();
    const dialog = page.getByRole("alertdialog", { name: "Bin 2 items?" });
    await expect(page.locator(".cap-message-item")).toHaveCount(0);
    await dialog.getByRole("button", { name: "Bin 2 items" }).focus();
    await page.keyboard.press("Enter");
    await expect(dialog).toBeHidden();
    await expect(page.locator("#live-list li")).toHaveCount(3);
    await expect(page.locator("#bulk-live")).toBeHidden();
    await expect(page.locator(".cap-message-item")).toContainText("Binned 2 drafts.");
  });

  test("behaviour: the count follows the selection and the bar hides when it is empty", async ({ page }) => {
    await visitStates(page, "bulk-bar", theme);
    await check(page, "live-list", 1).check();
    await expect(page.locator("#bulk-live .cap-bulk-count")).toHaveText("1 selected");
    await check(page, "live-list", 2).check();
    await expect(page.locator("#bulk-live .cap-bulk-count")).toHaveText("2 selected");
    await check(page, "live-list", 1).uncheck();
    await check(page, "live-list", 2).uncheck();
    await expect(page.locator("#bulk-live")).toBeHidden();
  });

  test("behaviour: the header checkbox selects everything in view and shows a mixed state", async ({ page }) => {
    await visitStates(page, "bulk-bar", theme);
    const head = page.locator("input[data-cap-select-all][data-cap-list='live-list']");
    await check(page, "live-list", 1).check();
    expect(await head.evaluate((el: HTMLInputElement) => el.indeterminate)).toBe(true);
    await head.check();
    await expect(page.locator("#bulk-live .cap-bulk-count")).toHaveText("5 selected");
    expect(await head.evaluate((el: HTMLInputElement) => el.indeterminate)).toBe(false);
    await head.uncheck();
    await expect(page.locator("#bulk-live")).toBeHidden();
  });

  test("behaviour: Select all in view selects what is visible and hides itself once all are", async ({ page }) => {
    await visitStates(page, "bulk-bar", theme);
    await check(page, "live-list", 1).check();
    const all = page.locator("#bulk-live").getByRole("button", { name: "Select all 5 in view" });
    await expect(all).toBeVisible();
    await all.click();
    await expect(page.locator("#bulk-live .cap-bulk-count")).toHaveText("5 selected");
    await expect(all).toBeHidden();
  });

  test("behaviour: a reversible action's Undo puts the items back", async ({ page }) => {
    await visitStates(page, "bulk-bar", theme);
    await check(page, "live-list", 2).check();
    await check(page, "live-list", 3).check();
    await page.locator("#bulk-live").getByRole("button", { name: "Archive" }).click();
    await expect(page.locator("#live-list li:visible")).toHaveCount(3);
    await page.getByRole("button", { name: "Undo" }).click();
    await expect(page.locator("#live-list li:visible")).toHaveCount(5);
    await expect(page.locator(".cap-message-item")).toContainText("Brought 2 drafts back.");
  });

  test("behaviour: a destructive action lists every selected item and names the count", async ({ page }) => {
    await visitStates(page, "bulk-bar", theme);
    await page.locator("#bulk-twelve").getByRole("button", { name: "Bin" }).click();
    const dialog = page.getByRole("alertdialog", { name: "Bin 12 items?" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("listitem")).toHaveCount(12);
    await expect(dialog.getByRole("button", { name: "Bin 12 items" })).toBeVisible();
    await expect(dialog).toContainText("Binned drafts cannot be brought back.");
    await dialog.getByRole("button", { name: "Cancel" }).click();
    await expect(page.locator("#bulk-twelve .cap-bulk-count")).toHaveText("12 selected");
  });

  test("behaviour: an action that fails says so in the region and keeps the selection", async ({ page }) => {
    await visitStates(page, "bulk-bar", theme);
    await page.locator("#bulk-fail").getByRole("button", { name: "Publish" }).click();
    await expect(page.locator(".cap-message-item")).toContainText("Could not publish 2 items: the drafts index did not answer (502)");
    await expect(page.locator("#bulk-fail .cap-bulk-count")).toHaveText("2 selected");
  });

  test("behaviour: a destructive action that fails stays in the dialog with the reason", async ({ page }) => {
    await visitStates(page, "bulk-bar", theme);
    await page.locator("#bulk-fail").getByRole("button", { name: "Bin" }).click();
    const dialog = page.getByRole("alertdialog", { name: "Bin 2 items?" });
    await dialog.getByRole("button", { name: "Bin 2 items" }).click();
    await expect(dialog.getByRole("alert")).toContainText("Not done. Nothing was changed.");
    await expect(dialog.getByRole("alert")).toContainText("the drafts index did not answer (502)");
    await expect(dialog.getByRole("button", { name: "Try again" })).toBeVisible();
    await dialog.getByRole("button", { name: "Cancel" }).click();
  });

  test("behaviour: the bar sticks to the bottom of its scroll area, or the top", async ({ page }) => {
    await visitStates(page, "bulk-bar", theme);
    const near = async (scroller: string, bar: string, edge: "top" | "bottom") => {
      await page.locator(scroller).evaluate((el) => (el.scrollTop = el.scrollHeight / 2));
      const s = await page.locator(scroller).boundingBox();
      const b = await page.locator(bar).boundingBox();
      expect(s && b, "both are on the page").toBeTruthy();
      if (!s || !b) return;
      if (edge === "bottom") expect(Math.abs(s.y + s.height - (b.y + b.height))).toBeLessThan(40);
      else expect(Math.abs(b.y - s.y)).toBeLessThan(40);
    };
    await near("#bulk-scroll", "#bulk-sticky", "bottom");
    await near("#bulk-scroll-top", "#bulk-top", "top");
  });
});
