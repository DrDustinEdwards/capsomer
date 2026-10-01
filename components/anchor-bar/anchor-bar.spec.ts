import { expect, test, type Page } from "@playwright/test";
import { eachTheme, expectContrast, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

const bar = (page: Page) => page.getByRole("navigation", { name: "On this page" });
const link = (page: Page, name: string) => bar(page).getByRole("link", { name });

eachTheme((theme) => {
  test("accessibility: no axe violations, the states page", async ({ page }) => {
    await visitStates(page, "anchor-bar", theme);
    await expectNoAxeViolations(page);
  });

  for (const id of ["top", "third", "short", "blocks"]) {
    test(`accessibility: no axe violations, ${id}`, async ({ page }) => {
      await visitStates(page, "anchor-bar", theme, id);
      await expectNoAxeViolations(page);
    });
  }

  test("accessibility: links, current and not, reach their contrast", async ({ page }) => {
    await visitStates(page, "anchor-bar", theme, "third");
    await expect(link(page, "When it alerts")).toHaveAttribute("aria-current", "location");
    await expectContrast(page, [
      { sel: ".cap-anchors-list a:not([aria-current])", what: "a link to another section" },
      { sel: ".cap-anchors-list a[aria-current='location']", what: "the current section's link" },
      { sel: ".cap-anchors-label", what: "the bar's label" },
    ]);
  });

  test("accessibility: the bar's roles and names", async ({ page }) => {
    await visitStates(page, "anchor-bar", theme, "top");
    await expect(bar(page)).toMatchAriaSnapshot(`
      - navigation "On this page":
        - list:
          - listitem:
            - link "What it checks"
          - listitem:
            - link "Thresholds"
          - listitem:
            - link "When it alerts"
          - listitem:
            - link "What it keeps"
    `);
  });

  test("behaviour: scrolled into the third section, its link is the current one", async ({ page }) => {
    await visitStates(page, "anchor-bar", theme, "third");
    await expect(link(page, "When it alerts")).toHaveAttribute("aria-current", "location");
    await expect(bar(page).locator("[aria-current]")).toHaveCount(1);
    await expect(bar(page)).toBeInViewport();
  });

  test("keyboard: Enter on a link moves focus to its section's heading, below the bar", async ({ page }) => {
    await visitStates(page, "anchor-bar", theme, "top");
    await link(page, "What it keeps").focus();
    await page.keyboard.press("Enter");
    const heading = page.getByRole("heading", { name: "What it keeps" });
    await expect(heading).toBeFocused();
    await expect(link(page, "What it keeps")).toHaveAttribute("aria-current", "location");
    await expect(page).toHaveURL(/#what-it-keeps$/);
    await expect
      .poll(async () => {
        const h = await heading.boundingBox();
        const b = await bar(page).boundingBox();
        return !!h && !!b && h.y >= b.y + b.height;
      })
      .toBe(true);
  });

  test("keyboard: following a link replaces the address's hash and adds no history entry", async ({ page }) => {
    await visitStates(page, "anchor-bar", theme, "top");
    const before = await page.evaluate(() => history.length);
    await link(page, "Thresholds").focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#thresholds$/);
    expect(await page.evaluate(() => history.length)).toBe(before);
  });

  test("behaviour: a bar built from data-section blocks shows when the page grows past two screens, and goes when it shrinks", async ({ page }) => {
    await visitStates(page, "anchor-bar", theme, "blocks");
    await expect(bar(page)).toBeHidden();
    // Content that arrives late (a panel with its data) is what the measuring is for.
    await page.evaluate(() => {
      const filler = document.createElement("div");
      filler.id = "filler";
      filler.style.height = "4000px";
      document.getElementById("usage")?.append(filler);
    });
    await expect(bar(page)).toBeVisible();
    await expect(bar(page).getByRole("link")).toHaveText(["Usage", "Sites", "Deploys"]);
    await expectNoAxeViolations(page);
    await page.evaluate(() => document.getElementById("filler")?.remove());
    await expect(bar(page)).toBeHidden();
  });

  test("behaviour: a page with fewer than three sections shows no bar", async ({ page }) => {
    await visitStates(page, "anchor-bar", theme, "short");
    await expect(page.locator(".cap-anchors")).toBeHidden();
  });

  test("behaviour: on a phone the links scroll sideways", async ({ page }) => {
    // The narrowest phone, so the four links cannot fit however the padding is tuned.
    await page.setViewportSize({ width: 320, height: 640 });
    await visitStates(page, "anchor-bar", theme, "top");
    const list = page.locator(".cap-anchors-list");
    await expect(list).toHaveCSS("overflow-x", "auto");
    const wide = await list.evaluate((el) => el.scrollWidth > el.clientWidth);
    expect(wide).toBe(true);
    const doc = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
    expect(doc).toBe(true);
  });
});
