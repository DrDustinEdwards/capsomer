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

  test("behaviour: a flush body has no padding and a plain body has", async ({ page }) => {
    await visitStates(page, "panel", theme);
    await expect(page.locator("#p-flush .cap-panel-body")).toHaveCSS("padding-top", "0px");
    await expect(page.locator("#p-flush .cap-panel-body")).toHaveCSS("padding-left", "0px");
    await expect(page.locator("#p-head .cap-panel-body")).toHaveCSS("padding-left", "16px");
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

  test("behaviour: the link to the full view follows the source line, at the header's right edge", async ({ page }) => {
    await visitStates(page, "panel", theme);
    const src = await page.locator("#p-more .cap-panel-src").boundingBox();
    const more = await page.locator("#p-more .cap-panel-more").boundingBox();
    const head = await page.locator("#p-more .cap-panel-head").boundingBox();
    expect(src && more && head).toBeTruthy();
    if (src && more && head) {
      expect(more.x).toBeGreaterThanOrEqual(src.x + src.width - 1);
      expect(Math.round(head.x + head.width - (more.x + more.width))).toBe(16);
    }
  });

  test("behaviour: the source line sits at the header's right edge", async ({ page }) => {
    await visitStates(page, "panel", theme);
    const head = await page.locator("#p-head .cap-panel-head").boundingBox();
    const src = await page.locator("#p-head .cap-panel-src").boundingBox();
    expect(head && src).toBeTruthy();
    if (head && src) expect(Math.round(head.x + head.width - (src.x + src.width))).toBe(16);
  });
});
