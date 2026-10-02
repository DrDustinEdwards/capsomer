import { expect, test } from "@playwright/test";
import { eachTheme, expectContrast, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "empty", theme);
    await expectNoAxeViolations(page);
  });

  test("accessibility: every kind's words reach their contrast", async ({ page }) => {
    await visitStates(page, "empty", theme);
    await expectContrast(page, [
      { sel: "#sample-nothing .cap-empty-title", what: "nothing yet title" },
      { sel: "#sample-nothing .cap-empty-text", what: "nothing yet text" },
      { sel: "#sample-nothing .cap-empty-media", what: "the icon tile's icon", min: 3 },
      { sel: "#sample-nomatch .cap-empty-text", what: "no match text" },
      { sel: "#sample-clear .cap-status", what: "all clear status" },
      { sel: "#sample-clear .cap-empty-text", what: "all clear text" },
      { sel: "#sample-failed .cap-empty-title", what: "failed title" },
      { sel: "#sample-failed .cap-empty-text", what: "failed text" },
      { sel: "#sample-flush .cap-empty-text a", what: "a link in the text" },
      { sel: "#sample-direct .cap-empty-title", what: "0.1 markup title" },
      { sel: "#sample-comfortable .cap-empty-text", what: "comfortable text" },
      { sel: "#sample-wait .cap-empty-text", what: "how long it takes" },
    ]);
  });

  test("accessibility: the kinds' roles and names", async ({ page }) => {
    await visitStates(page, "empty", theme);
    await expect(page.locator("#sample-nomatch")).toMatchAriaSnapshot(`
      - paragraph: No jobs match “Blocked”
      - paragraph: 14 jobs are hidden by this filter.
      - button "Clear filter"
    `);
    await expect(page.locator("#sample-failed")).toMatchAriaSnapshot(`
      - alert:
        - paragraph: Could not load the queue
        - paragraph: The server answered with an error (502). Nothing changed on your side.
        - button "Try again"
    `);
  });

  test("accessibility: the icon tile is decorative and hidden from assistive technology", async ({ page }) => {
    await visitStates(page, "empty", theme);
    await expect(page.locator("#sample-nothing .cap-empty-media")).toHaveAttribute("aria-hidden", "true");
    await expect(page.locator("#sample-nothing")).toMatchAriaSnapshot(`
      - paragraph: No sites are watched yet
      - paragraph: Add the first one and its checks start on the next pass.
      - button "Add a site"
    `);
  });

  test("accessibility: a long wait is busy and names what it waits for", async ({ page }) => {
    await visitStates(page, "empty", theme);
    await expect(page.locator("#sample-wait")).toHaveAttribute("aria-busy", "true");
    await expect(page.locator("#sample-wait .cap-spinner-label")).toHaveText("Building the site");
  });

  test("keyboard: each kind's one action is reachable with Tab", async ({ page }) => {
    await visitStates(page, "empty", theme);
    await page.getByRole("button", { name: "Add a site" }).first().focus();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "Clear filter" })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "Try again" })).toBeFocused();
    await expect(page.locator("#sample-clear").getByRole("button")).toHaveCount(0);
  });

  test("behaviour: the markup of 0.1, with the action as a direct child, still works", async ({ page }) => {
    await visitStates(page, "empty", theme);
    await expect(page.locator("#sample-direct").getByRole("button", { name: "New draft" })).toBeVisible();
  });
});
