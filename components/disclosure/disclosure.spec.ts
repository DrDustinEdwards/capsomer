import { expect, test } from "@playwright/test";
import { eachTheme, expectContrast, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "disclosure", theme);
    await expectNoAxeViolations(page);
  });

  test("accessibility: summaries, group rows and counts reach their contrast", async ({ page }) => {
    await visitStates(page, "disclosure", theme);
    await expectContrast(page, [
      { sel: ".cap-disclosure > summary", what: "a section's summary" },
      { sel: ".cap-disclosure[open] .cap-disclosure-body p", what: "an open section's text" },
      { sel: ".cap-group-toggle", what: "a group row's label" },
      { sel: ".cap-group-count", what: "a group's count" },
      { sel: ".cap-group-count", what: "the count's boundary", part: "border" },
      { sel: ".cap-group-rows:not([hidden]) > li", what: "a grouped row" },
    ]);
  });

  test("accessibility: the group rows' roles and names", async ({ page }) => {
    await visitStates(page, "disclosure", theme);
    await expect(page.locator("section[aria-labelledby='s-collapsed']")).toMatchAriaSnapshot(`
      - region "Group row, collapsed, with its count":
        - heading "Group row, collapsed, with its count" [level=2]
        - button /^Notices\\s*,\\s*4$/
    `);
    await expect(page.locator("section[aria-labelledby='s-expanded']")).toMatchAriaSnapshot(`
      - region "Group row, expanded, two levels":
        - heading "Group row, expanded, two levels" [level=2]
        - button /^Dependency updates\\s*,\\s*5$/ [expanded]
        - list:
          - listitem: "capsid: vite 8.3.1 to 8.4.0"
          - listitem: "capsid: wrangler 4.40.0 to 4.41.2"
          - listitem:
            - button /^carrel\\s*,\\s*3$/
    `);
  });

  test("keyboard: Enter and Space on a group row toggle aria-expanded and the rows", async ({ page }) => {
    await visitStates(page, "disclosure", theme);
    const btn = page.getByRole("button", { name: /^Notices\s*,\s*4$/ });
    const rows = page.locator("#notices-rows");
    await expect(btn).toHaveAttribute("aria-expanded", "false");
    await expect(rows).toBeHidden();
    await btn.focus();
    await page.keyboard.press("Enter");
    await expect(btn).toHaveAttribute("aria-expanded", "true");
    await expect(rows).toBeVisible();
    await expect(rows.getByRole("listitem")).toHaveCount(4);
    await page.keyboard.press("Space");
    await expect(btn).toHaveAttribute("aria-expanded", "false");
    await expect(rows).toBeHidden();
  });

  test("keyboard: a second-level group toggles on its own", async ({ page }) => {
    await visitStates(page, "disclosure", theme);
    const inner = page.getByRole("button", { name: /^carrel\s*,\s*3$/ });
    await inner.focus();
    await page.keyboard.press("Enter");
    await expect(inner).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator("#carrel-updates")).toBeVisible();
    await expect(page.getByRole("button", { name: /^Dependency updates\s*,\s*5$/ })).toHaveAttribute("aria-expanded", "true");
  });

  test("keyboard: Enter on a summary opens and closes its section", async ({ page }) => {
    await visitStates(page, "disclosure", theme);
    const details = page.locator("details", { hasText: "Why is foxhound.app marked degraded?" });
    const summary = details.locator("summary");
    await summary.focus();
    await page.keyboard.press("Enter");
    await expect(details).toHaveAttribute("open", "");
    await expect(details.getByText("Its median response")).toBeVisible();
    await page.keyboard.press("Space");
    await expect(details).not.toHaveAttribute("open", "");
  });

  test("behaviour: sections that share a name open one at a time", async ({ page }) => {
    await visitStates(page, "disclosure", theme);
    const first = page.locator("details[name='limits']").nth(0);
    const second = page.locator("details[name='limits']").nth(1);
    await expect(first).toHaveAttribute("open", "");
    await second.locator("summary").click();
    await expect(second).toHaveAttribute("open", "");
    await expect(first).not.toHaveAttribute("open", "");
  });
});
