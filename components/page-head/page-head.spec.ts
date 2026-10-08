import { expect, test } from "@playwright/test";
import { eachTheme, expectContrast, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "page-head", theme);
    await expectNoAxeViolations(page);
  });

  test("accessibility: the title and the lead reach their contrast", async ({ page }) => {
    await visitStates(page, "page-head", theme);
    await expectContrast(page, [
      { sel: "#ph-full .cap-page-head-title", what: "the page title" },
      { sel: "#ph-full .cap-page-head-lead", what: "the lead line" },
    ]);
  });

  test("accessibility: roles and names: a trail, a heading, a lead and the actions, and no banner landmark", async ({ page }) => {
    await visitStates(page, "page-head", theme);
    await expect(page.locator("#ph-full")).toMatchAriaSnapshot(`
      - navigation "Breadcrumb":
        - list:
          - listitem:
            - link "Sites":
              - /url: "#sites"
          - listitem: foxhound.app
      - heading "foxhound.app" [level=3]
      - paragraph: Checks run every five minutes. A failing required check blocks publishing.
      - button "Run checks now"
      - button "Publish"
    `);
    // A header inside a section is not a banner: the page's one banner is the shell's.
    await expect(page.locator("#ph-full").getByRole("banner")).toHaveCount(0);
  });

  test("keyboard: Tab goes through the trail's link, then the actions", async ({ page }) => {
    await visitStates(page, "page-head", theme);
    await page.locator("#ph-full .cap-breadcrumb-link").focus();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "Run checks now" })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.locator("#ph-full").getByRole("button", { name: "Publish" })).toBeFocused();
  });

  test("behaviour: the actions sit at the right of the title, and drop below it in a narrow space", async ({ page }) => {
    await visitStates(page, "page-head", theme);
    const wide = await page.locator("#ph-full").evaluate((el) => {
      const t = el.querySelector(".cap-page-head-text")!.getBoundingClientRect();
      const a = el.querySelector(".cap-page-head-actions")!.getBoundingClientRect();
      return { sameRow: a.top < t.bottom, right: a.left >= t.right };
    });
    expect(wide).toEqual({ sameRow: true, right: true });
    const narrow = await page.locator("#ph-long").evaluate((el) => {
      const t = el.querySelector(".cap-page-head-text")!.getBoundingClientRect();
      const a = el.querySelector(".cap-page-head-actions")!.getBoundingClientRect();
      return { below: a.top >= t.bottom - 1, within: el.scrollWidth <= el.clientWidth };
    });
    expect(narrow).toEqual({ below: true, within: true });
  });
});
