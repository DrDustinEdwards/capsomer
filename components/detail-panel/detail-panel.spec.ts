import { expect, test, type Page } from "@playwright/test";
import { eachTheme, expectContrast, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

const TITLE = "Push the capsomer branch and open a pull request";
const panel = (page: Page) => page.getByRole("dialog", { name: TITLE });
const rowLink = (page: Page) => page.getByRole("link", { name: TITLE });

eachTheme((theme) => {
  test("accessibility: no axe violations, the states page", async ({ page }) => {
    await visitStates(page, "detail-panel", theme);
    await expectNoAxeViolations(page);
  });

  for (const id of ["rows", "open"]) {
    test(`accessibility: no axe violations, ${id}`, async ({ page }) => {
      await visitStates(page, "detail-panel", theme, id);
      await expectNoAxeViolations(page);
    });
  }

  test("accessibility: the panel's text reaches its contrast", async ({ page }) => {
    await visitStates(page, "detail-panel", theme, "open");
    await expect(panel(page)).toBeVisible();
    await expectContrast(page, [
      { sel: ".cap-detail-title", what: "the title" },
      { sel: ".cap-detail-kind", what: "the kind above the title" },
      { sel: ".cap-detail-id", what: "the identifier" },
      { sel: ".cap-detail-section-title", what: "a section heading" },
      { sel: ".cap-detail-cmd", what: "the command on sunken" },
      { sel: ".cap-detail-record dt", what: "a record label" },
      { sel: ".cap-detail-record dd", what: "a record value" },
      { sel: ".cap-detail-source", what: "the source line" },
      { sel: ".cap-detail-diff del", what: "the old value on its tint" },
      { sel: ".cap-detail-diff ins", what: "the new value on its tint" },
    ]);
  });

  test("accessibility: the panel's roles and names", async ({ page }) => {
    await visitStates(page, "detail-panel", theme, "open");
    await expect(panel(page)).toMatchAriaSnapshot(`
      - dialog "${TITLE}":
        - paragraph: Job, capsomer
        - heading "${TITLE}" [level=2]
        - paragraph: job_7f3a92c1d4e0
        - button "Close"
        - region "Do this first":
          - heading "Do this first" [level=3]
          - button "Copy command"
        - region "Change it":
          - heading "Change it" [level=3]
          - button "Resume"
          - button "Release"
          - button "Mark failed…"
        - region "Record":
          - heading "Record" [level=3]
          - term: Status
          - definition: Blocked, waiting on you
        - region "What changed":
          - heading "What changed" [level=3]
          - term: Status
          - definition: /before: queued\\s*after: blocked/
    `);
  });

  test("keyboard: Enter on a row's link opens the panel with focus on Close", async ({ page }) => {
    await visitStates(page, "detail-panel", theme, "rows");
    await rowLink(page).focus();
    await page.keyboard.press("Enter");
    await expect(panel(page)).toBeVisible();
    await expect(panel(page).getByRole("button", { name: "Close" })).toBeFocused();
  });

  test("keyboard: Esc closes the panel and focus returns to the row's link", async ({ page }) => {
    await visitStates(page, "detail-panel", theme, "rows");
    await rowLink(page).focus();
    await page.keyboard.press("Enter");
    await expect(panel(page)).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(panel(page)).toBeHidden();
    await expect(rowLink(page)).toBeFocused();
    // The entry the panel pushed is taken back.
    await expect(page).not.toHaveURL(/#detail-/);
  });

  test("keyboard: Enter on Close closes the panel and focus returns to the row's link", async ({ page }) => {
    await visitStates(page, "detail-panel", theme, "rows");
    const other = page.getByRole("link", { name: "Rotate the watcher's Cloudflare token" });
    await other.focus();
    await page.keyboard.press("Enter");
    const d = page.getByRole("dialog", { name: "Rotate the watcher's Cloudflare token" });
    await expect(d).toBeVisible();
    await page.keyboard.press("Enter");
    await expect(d).toBeHidden();
    await expect(other).toBeFocused();
  });

  test("behaviour: Back closes the panel when it pushed a history entry", async ({ page }) => {
    await visitStates(page, "detail-panel", theme, "rows");
    await rowLink(page).click();
    await expect(panel(page)).toBeVisible();
    await expect(page).toHaveURL(/#detail-job_7f3a92c1d4e0$/);
    await page.goBack();
    await expect(panel(page)).toBeHidden();
    await expect(rowLink(page)).toBeFocused();
  });

  test("behaviour: a click on the backdrop closes the panel", async ({ page }) => {
    await visitStates(page, "detail-panel", theme, "rows");
    await rowLink(page).click();
    await expect(panel(page)).toBeVisible();
    await page.mouse.click(10, 300);
    await expect(panel(page)).toBeHidden();
  });

  test("behaviour: the panel sits at the right edge on a wide screen and fills a phone", async ({ page }) => {
    await visitStates(page, "detail-panel", theme, "open");
    const view = page.viewportSize();
    await expect.poll(async () => {
      const b = await panel(page).boundingBox();
      return !!b && !!view && b.width < view.width && Math.round(b.x + b.width) === view.width;
    }).toBe(true);
    await page.setViewportSize({ width: 390, height: 760 });
    await expect.poll(async () => Math.round((await panel(page).boundingBox())?.width ?? 0)).toBe(390);
  });

  test("keyboard: Tab stays inside the open panel and never reaches the page behind", async ({ page }) => {
    await visitStates(page, "detail-panel", theme, "rows");
    await rowLink(page).focus();
    await page.keyboard.press("Enter");
    await expect(panel(page)).toBeVisible();
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press(i < 8 ? "Tab" : "Shift+Tab");
      const inside = await page.evaluate(() => !!document.activeElement?.closest("dialog.cap-detail[open]"));
      expect(inside, `focus after key ${i + 1} is inside the panel`).toBe(true);
    }
  });

  test("behaviour: Copy says what happened", async ({ page }) => {
    await visitStates(page, "detail-panel", theme, "open");
    await page.getByRole("button", { name: "Copy command" }).click();
    await expect(panel(page).getByRole("status")).toHaveText(/Command copied\.|Command is selected/);
  });
});
