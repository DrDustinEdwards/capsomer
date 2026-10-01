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

  test("behaviour: the source line sits at the header's right edge", async ({ page }) => {
    await visitStates(page, "panel", theme);
    const head = await page.locator("#p-head .cap-panel-head").boundingBox();
    const src = await page.locator("#p-head .cap-panel-src").boundingBox();
    expect(head && src).toBeTruthy();
    if (head && src) expect(Math.round(head.x + head.width - (src.x + src.width))).toBe(16);
  });
});
