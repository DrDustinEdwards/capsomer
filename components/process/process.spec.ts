import { expect, test } from "@playwright/test";
import {
  eachTheme,
  expectContrast,
  expectNoAxeViolations,
  visitStates,
} from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "process", theme);
    await expectNoAxeViolations(page);
  });

  test("accessibility: the number, title and text reach their contrast", async ({ page }) => {
    await visitStates(page, "process", theme);
    await expectContrast(page, [
      { sel: "#pr-columns .cap-process-title", what: "a step's title" },
      { sel: "#pr-columns .cap-process-text", what: "a step's text" },
    ]);
  });

  test("accessibility: a step's number is not read", async ({ page }) => {
    await visitStates(page, "process", theme);
    await expect(page.locator("#pr-columns ol")).toMatchAriaSnapshot(`
      - list:
        - listitem:
          - heading "Connect a site" [level=3]
          - paragraph: Add example.com and the checks start within five minutes.
        - listitem:
          - heading "Read the report" [level=3]
          - paragraph: Every failing check names the page and the fix.
        - listitem:
          - heading "Publish with confidence" [level=3]
          - paragraph: A required check that fails holds the publish until it passes.
    `);
  });
});
