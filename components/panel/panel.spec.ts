import { expect, test } from "@playwright/test";
import { eachTheme, expectContrast, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "panel", theme);
    await expectNoAxeViolations(page);
  });

  test("accessibility: the heading, the source and the body reach their contrast", async ({ page }) => {
    await visitStates(page, "panel", theme);
    await expectContrast(page, [
      { sel: "#p-head .cap-panel-head h3", what: "the panel's heading on the raised header" },
      { sel: "#p-head .cap-panel-src", what: "the source line on the raised header" },
      { sel: "#p-head .cap-panel-body p", what: "body text" },
      { sel: "#p-head .cap-panel-body .cap-muted", what: "muted body text" },
    ]);
  });

  test("accessibility: the panels' roles and names", async ({ page }) => {
    await visitStates(page, "panel", theme);
    await expect(page.locator("#p-head")).toMatchAriaSnapshot(`
      - heading "Usage against free limits" [level=3]
      - paragraph: /Worker requests/
      - paragraph: /No projection/
    `);
    await expect(page.locator("#p-flush")).toMatchAriaSnapshot(`
      - heading "Recent drafts" [level=3]
      - list "Recent drafts":
        - listitem:
          - link "How phage lambda chooses"
        - listitem:
          - link "Notes on a quiet deploy"
    `);
  });

  test("accessibility: the count and the link to the full view reach their contrast, and the link is a target", async ({ page }) => {
    await visitStates(page, "panel", theme);
    await expectContrast(page, [
      { sel: "#p-more .cap-panel-count", what: "the count on the raised header" },
      { sel: "#p-more .cap-panel-src", what: "the source line beside a link" },
      { sel: "#p-more .cap-panel-more a", what: "the link to the full view on the raised header" },
    ]);
    const box = await page.locator("#p-more .cap-panel-more a").boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(24);
  });

  test("keyboard: Tab reaches the link to the full view, and Enter follows it", async ({ page }) => {
    await visitStates(page, "panel", theme);
    await page.getByRole("link", { name: "All columns in Sites" }).focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#sites$/);
  });

  test("accessibility: a panel given a heading id is a named region wired to its title", async ({ page }) => {
    await visitStates(page, "panel", theme);
    await expect(page.getByRole("region", { name: "Deploy settings" })).toBeVisible();
    await expect(page.locator("#p-card")).toHaveAttribute("aria-labelledby", "p-card-h");
    await expect(page.locator("#p-card-h")).toHaveText("Deploy settings");
    // A panel without one is a plain section, not a landmark.
    await expect(page.getByRole("region", { name: "Usage against free limits" })).toHaveCount(0);
  });

  test("accessibility: description, action, footer and the padded block reach their contrast", async ({ page }) => {
    await visitStates(page, "panel", theme);
    await expectContrast(page, [
      { sel: "#p-card .cap-panel-desc", what: "the description on the raised header" },
      { sel: "#p-card .cap-panel-foot .cap-muted", what: "muted text on the footer band" },
      { sel: "#p-pad .cap-panel-pad p", what: "text in the padded block" },
    ]);
  });

  test("keyboard: the header's action and the footer's button are reached in order", async ({ page }) => {
    await visitStates(page, "panel", theme);
    await page.getByRole("button", { name: "Edit" }).focus();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "Deploy now" })).toBeFocused();
  });

  test("behaviour: the padded block sits inside a flush body, and the rows run to the panel's edges", async ({ page }) => {
    await visitStates(page, "panel", theme);
    await expect(page.locator("#p-pad .cap-panel-body")).toHaveCSS("padding-left", "0px");
    const [panel, row, pad] = await Promise.all([
      page.locator("#p-pad").boundingBox(),
      page.locator("#p-pad .cap-row").first().boundingBox(),
      page.locator("#p-pad .cap-panel-pad p").boundingBox(),
    ]);
    expect(panel && row && pad).toBeTruthy();
    if (panel && row && pad) {
      expect(row.width).toBeGreaterThanOrEqual(panel.width - 3);
      expect(pad.x).toBeGreaterThan(panel.x + 8);
    }
  });
});
