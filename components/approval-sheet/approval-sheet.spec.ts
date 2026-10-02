import { expect, test, type Page } from "@playwright/test";
import { eachTheme, expectContrast, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";
import { approveLabel, titleText } from "./approval-sheet.ts";

const sheet = (page: Page) => page.getByRole("dialog");
const approveBtn = (page: Page) => page.locator("[data-cap-part='approve']");
const cancelBtn = (page: Page) => page.getByRole("button", { name: "Cancel" });

eachTheme((theme) => {
  for (const id of ["two", "one-unchecked", "pending", "error", "comfortable"]) {
    test(`accessibility: no axe violations, ${id}`, async ({ page }) => {
      await visitStates(page, "approval-sheet", theme, id);
      await expect(sheet(page)).toBeVisible();
      await expectNoAxeViolations(page);
    });
  }

  test("accessibility: the sheet's text reaches its contrast", async ({ page }) => {
    await visitStates(page, "approval-sheet", theme, "two");
    await expectContrast(page, [
      { sel: ".cap-dialog-title", what: "the title" },
      { sel: ".cap-dialog-description", what: "the lead line" },
      { sel: ".cap-approval-job", what: "a gate's job title" },
      { sel: ".cap-approval-meta", what: "a gate's meta line" },
      { sel: ".cap-approval-cmd", what: "the command on its sunken box" },
    ]);
  });

  test("accessibility: the sheet's roles and names", async ({ page }) => {
    await visitStates(page, "approval-sheet", theme, "two");
    await expect(sheet(page)).toMatchAriaSnapshot(`
      - dialog "2 gates are waiting":
        - heading "2 gates are waiting" [level=2]
        - group "Gates waiting for approval":
          - group "Deploy foxhound to production":
            - checkbox "Include this gate" [checked]
            - textbox "Comment (optional)"
          - group "Run the Carrel migration 0008":
            - checkbox "Include this gate" [checked]
            - textbox "Comment (optional)"
        - button "Cancel"
        - button "Approve 2 gates"
    `);
  });

  test("keyboard: focus starts on Cancel", async ({ page }) => {
    await visitStates(page, "approval-sheet", theme, "two");
    await expect(cancelBtn(page)).toBeFocused();
  });

  test("keyboard: Space on a gate's checkbox changes the count", async ({ page }) => {
    await visitStates(page, "approval-sheet", theme, "two");
    const second = page.getByRole("group", { name: "Run the Carrel migration 0008" }).getByRole("checkbox");
    await second.focus();
    await page.keyboard.press("Space");
    await expect(approveBtn(page)).toHaveAccessibleName("Approve 1 gate");
    await page.keyboard.press("Space");
    await expect(approveBtn(page)).toHaveAccessibleName("Approve 2 gates");
  });

  test("keyboard: with no gate chosen, Approve says why and does nothing", async ({ page }) => {
    await visitStates(page, "approval-sheet", theme, "one-unchecked");
    await expect(approveBtn(page)).toHaveAccessibleName("Approve 1 gate");
    const first = page.getByRole("group", { name: "Deploy foxhound to production" }).getByRole("checkbox");
    await first.focus();
    await page.keyboard.press("Space");
    await expect(approveBtn(page)).toHaveAccessibleName("Approve 0 gates");
    await expect(approveBtn(page)).toHaveAttribute("aria-disabled", "true");
    await expect(approveBtn(page)).toHaveAccessibleDescription("Choose at least one gate.");
    await expectContrast(page, [{ sel: ".cap-approval-none", what: "the reason Approve is disabled" }]);
    await approveBtn(page).focus();
    await page.keyboard.press("Enter");
    await expect(approveBtn(page)).not.toHaveAttribute("aria-busy", "true");
    await expect(sheet(page)).toBeVisible();
  });

  test("keyboard: Enter on Approve sends the approval and holds the sheet pending", async ({ page }) => {
    await visitStates(page, "approval-sheet", theme, "two");
    await approveBtn(page).focus();
    await page.keyboard.press("Enter");
    await expect(approveBtn(page)).toHaveAttribute("aria-busy", "true");
    await expect(approveBtn(page)).toHaveAccessibleName("Approving 2 gates");
    await expect(cancelBtn(page)).toHaveAttribute("aria-disabled", "true");
  });

  test("keyboard: Tab and Shift+Tab stay inside the sheet", async ({ page }) => {
    await visitStates(page, "approval-sheet", theme, "two");
    for (let i = 0; i < 9; i++) {
      await page.keyboard.press("Tab");
      expect(await page.evaluate(() => !!document.activeElement?.closest("dialog"))).toBe(true);
    }
    for (let i = 0; i < 9; i++) {
      await page.keyboard.press("Shift+Tab");
      expect(await page.evaluate(() => !!document.activeElement?.closest("dialog"))).toBe(true);
    }
  });

  test("accessibility: the controls show a focus ring", async ({ page }) => {
    await visitStates(page, "approval-sheet", theme, "two");
    await approveBtn(page).focus();
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Tab");
    await expect(approveBtn(page)).toBeFocused();
    const width = await approveBtn(page).evaluate((el) => getComputedStyle(el).outlineWidth);
    expect(parseFloat(width)).toBeGreaterThanOrEqual(2);
  });

  test("keyboard: Esc closes the sheet and focus returns to its button", async ({ page }) => {
    await visitStates(page, "approval-sheet", theme, "two");
    await page.keyboard.press("Escape");
    await expect(sheet(page)).toBeHidden();
    await expect(page.getByRole("button", { name: "Review 2 gates" })).toBeFocused();
  });

  test("keyboard: Enter on Cancel closes the sheet and focus returns to its button", async ({ page }) => {
    await visitStates(page, "approval-sheet", theme, "two");
    await page.keyboard.press("Enter");
    await expect(sheet(page)).toBeHidden();
    await expect(page.getByRole("button", { name: "Review 2 gates" })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(sheet(page)).toBeVisible();
    await expect(cancelBtn(page)).toBeFocused();
  });

  test("keyboard: Esc is held while the approval is in flight", async ({ page }) => {
    await visitStates(page, "approval-sheet", theme, "pending");
    await expect(approveBtn(page)).toHaveAttribute("aria-busy", "true");
    await page.keyboard.press("Escape");
    await expect(sheet(page)).toBeVisible();
    // Cancel is aria-disabled while pending; force the click to prove it does nothing.
    await cancelBtn(page).click({ force: true });
    await expect(sheet(page)).toBeVisible();
  });

  test("behaviour: a click outside the sheet does not close it", async ({ page }) => {
    await visitStates(page, "approval-sheet", theme, "two");
    await page.mouse.click(4, 4);
    await expect(sheet(page)).toBeVisible();
  });

  test("behaviour: the approval names the chosen gates and their comments", async ({ page }) => {
    await visitStates(page, "approval-sheet", theme, "one-unchecked");
    const detail = page.evaluate(
      () => new Promise((done) => document.addEventListener("cap-approve", (e) => done((e as CustomEvent).detail), { once: true })),
    );
    await approveBtn(page).click();
    expect(await detail).toEqual({ gates: [{ id: "job_8c21", comment: "Checked the preview at a91c4e0." }] });
  });

  test("behaviour: a failed approval says what happened beside the buttons", async ({ page }) => {
    await visitStates(page, "approval-sheet", theme, "error");
    await expect(page.getByRole("alert")).toContainText("Nothing was approved");
    await expect(approveBtn(page)).toHaveAccessibleName("Approve 2 gates");
  });
});

test("behaviour: the Approve label and the title follow the count", () => {
  expect(approveLabel(2)).toBe("Approve 2 gates");
  expect(approveLabel(1)).toBe("Approve 1 gate");
  expect(approveLabel(0)).toBe("Approve 0 gates");
  expect(approveLabel(3, true)).toBe("Approving 3 gates");
  expect(titleText(1)).toBe("1 gate is waiting");
  expect(titleText(4)).toBe("4 gates are waiting");
});
