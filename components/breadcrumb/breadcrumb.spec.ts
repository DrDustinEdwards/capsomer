import { expect, test } from "@playwright/test";
import { eachTheme, expectContrast, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations, with the folded levels closed and open", async ({ page }) => {
    await visitStates(page, "breadcrumb", theme);
    await expectNoAxeViolations(page);
    await page.locator("#bc-folded").getByRole("button", { name: "Show 2 more levels" }).click();
    await expect(page.getByRole("dialog", { name: "More levels" })).toBeVisible();
    await expectNoAxeViolations(page);
  });

  test("accessibility: the open specimen has no axe violations", async ({ page }) => {
    await visitStates(page, "breadcrumb", theme, "open");
    await expect(page.locator("[popover]:popover-open")).toBeVisible();
    await expectNoAxeViolations(page);
  });

  test("accessibility: links, the current page and the folded button reach their contrast", async ({ page }) => {
    await visitStates(page, "breadcrumb", theme);
    await expectContrast(page, [
      { sel: "#bc-default .cap-breadcrumb-link", what: "a link up the trail" },
      { sel: "#bc-default .cap-breadcrumb-page", what: "the current page" },
      { sel: "#bc-two .cap-breadcrumb-link", what: "a link on hover" },
      { sel: "#bc-folded .cap-breadcrumb-ellipsis", what: "the folded-levels button's dots", min: 3 },
    ]);
    await page.locator("#bc-folded .cap-breadcrumb-ellipsis").click();
    await expectContrast(page, [{ sel: "#bc-folded .cap-breadcrumb-more-link", what: "a folded level's link in the popover" }]);
  });

  test("accessibility: roles and names", async ({ page }) => {
    await visitStates(page, "breadcrumb", theme);
    await expect(page.locator("#bc-default")).toMatchAriaSnapshot(`
      - navigation "Breadcrumb":
        - list:
          - listitem:
            - link "Admin"
          - listitem:
            - link "Posts"
          - listitem: Why phage therapy keeps coming back
    `);
    await expect(page.locator("#bc-default [aria-current='page']")).toHaveText("Why phage therapy keeps coming back");
    await expect(page.locator("#bc-folded").getByRole("button", { name: "Show 2 more levels" })).toHaveAttribute("aria-expanded", "false");
  });

  test("accessibility: a separator is not in the page's text or accessibility tree", async ({ page }) => {
    await visitStates(page, "breadcrumb", theme);
    expect(await page.locator("#bc-default").evaluate((el) => (el as HTMLElement).innerText.replace(/\s+/g, " ").trim())).toBe("Admin Posts Why phage therapy keeps coming back");
    expect(await page.locator("#bc-default .cap-breadcrumb-item").count()).toBe(3);
    const content = await page.locator("#bc-default .cap-breadcrumb-item:nth-child(2)").evaluate((el) => getComputedStyle(el, "::before").content);
    expect(content).toBe('""');
  });

  test("accessibility: links and the button are at least the target size", async ({ page }) => {
    await visitStates(page, "breadcrumb", theme);
    const boxes = await page.locator(".cap-breadcrumb-link, .cap-breadcrumb-ellipsis").evaluateAll((els) => els.map((el) => el.getBoundingClientRect()).filter((r) => r.width > 0).map((r) => [r.width, r.height]));
    expect(boxes.length).toBeGreaterThan(8);
    for (const [w, h] of boxes) {
      expect(w).toBeGreaterThanOrEqual(24);
      expect(h).toBeGreaterThanOrEqual(24);
    }
  });

  test("keyboard: Tab moves through the links in order and passes the current page", async ({ page }) => {
    await visitStates(page, "breadcrumb", theme);
    await page.locator("#bc-default").getByRole("link", { name: "Admin" }).focus();
    await page.keyboard.press("Tab");
    await expect(page.locator("#bc-default").getByRole("link", { name: "Posts" })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.locator("#bc-default .cap-breadcrumb-page")).not.toBeFocused();
    await expect(page.locator("#bc-two").getByRole("link", { name: "Sites" })).toBeFocused();
  });

  test("keyboard: Enter follows a link", async ({ page }) => {
    await visitStates(page, "breadcrumb", theme);
    await page.locator("#bc-default").getByRole("link", { name: "Posts" }).focus();
    await page.keyboard.press("Enter");
    expect(new URL(page.url()).hash).toBe("#posts");
  });

  test("keyboard: Enter on the folded-levels button opens the popover and focus moves to its first link", async ({ page }) => {
    await visitStates(page, "breadcrumb", theme);
    const button = page.locator("#bc-folded").getByRole("button", { name: "Show 2 more levels" });
    await button.focus();
    await page.keyboard.press("Enter");
    await expect(button).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByRole("dialog", { name: "More levels" })).toBeVisible();
    await expect(page.getByRole("dialog", { name: "More levels" }).getByRole("link", { name: "Sites" })).toBeFocused();
  });

  test("keyboard: Space on the folded-levels button opens the popover", async ({ page }) => {
    await visitStates(page, "breadcrumb", theme);
    await page.locator("#bc-folded").getByRole("button", { name: "Show 2 more levels" }).focus();
    await page.keyboard.press("Space");
    await expect(page.getByRole("dialog", { name: "More levels" })).toBeVisible();
  });

  test("keyboard: Tab moves between the popover's links and past the last one closes it", async ({ page }) => {
    await visitStates(page, "breadcrumb", theme);
    await page.locator("#bc-folded").getByRole("button", { name: "Show 2 more levels" }).click();
    await expect(page.getByRole("dialog", { name: "More levels" }).getByRole("link", { name: "Sites" })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("dialog", { name: "More levels" }).getByRole("link", { name: "foxhound.app" })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("dialog", { name: "More levels" })).toBeHidden();
  });

  test("keyboard: Esc closes the popover and returns focus to the button", async ({ page }) => {
    await visitStates(page, "breadcrumb", theme);
    const button = page.locator("#bc-folded").getByRole("button", { name: "Show 2 more levels" });
    await button.click();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: "More levels" })).toBeHidden();
    await expect(button).toBeFocused();
    await expect(button).toHaveAttribute("aria-expanded", "false");
  });

  test("behaviour: a long trail with data-max-items folds its middle levels into links in a popover", async ({ page }) => {
    await visitStates(page, "breadcrumb", theme);
    const nav = page.locator("#bc-auto");
    await expect(nav.locator(".cap-breadcrumb-item")).toHaveCount(5);
    await expect(nav.getByRole("link")).toHaveText(["Admin", "September", "Field survey"]);
    await expect(nav.locator("[aria-current='page']")).toHaveText("Plate 3");
    const button = nav.getByRole("button", { name: "Show 2 more levels" });
    await button.click();
    const dialog = page.getByRole("dialog", { name: "More levels" });
    await expect(dialog.getByRole("link")).toHaveText(["Media library", "2026"]);
  });

  test("behaviour: a trail no longer than the limit stays whole", async ({ page }) => {
    await visitStates(page, "breadcrumb", theme);
    await expect(page.locator("#bc-short .cap-breadcrumb-ellipsis")).toHaveCount(0);
    await expect(page.locator("#bc-short").getByRole("link")).toHaveCount(2);
  });

  test("behaviour: the delivered HTML has the whole trail as links", async ({ page }) => {
    const html = await (await page.request.get("components/breadcrumb/states.html")).text();
    for (const level of ["Media library", "2026", "September", "Field survey"]) expect(html).toContain(`>${level}</a>`);
    expect(html).toContain('<span class="cap-breadcrumb-page" aria-current="page">Plate 3</span>');
  });

  test("behaviour: long names are cut and the page does not scroll sideways", async ({ page }) => {
    await visitStates(page, "breadcrumb", theme);
    for (const sel of ["#bc-long-link", "#bc-long-page"]) {
      expect(await page.locator(sel).evaluate((el) => el.scrollWidth > el.clientWidth), sel).toBe(true);
      await expect(page.locator(sel)).toHaveCSS("text-overflow", "ellipsis");
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  });

  test("behaviour: in a narrow space the trail wraps onto more lines", async ({ page }) => {
    await visitStates(page, "breadcrumb", theme);
    const tops = await page.locator("#bc-narrow .cap-breadcrumb-item").evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().top)));
    expect(new Set(tops).size).toBeGreaterThan(1);
    expect(await page.locator("#bc-narrow").evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
  });

  test("behaviour: comfortable density makes the links taller", async ({ page }) => {
    await visitStates(page, "breadcrumb", theme);
    const compact = await page.locator("#bc-default .cap-breadcrumb-link").first().evaluate((el) => el.getBoundingClientRect().height);
    const roomy = await page.locator("#bc-comfortable .cap-breadcrumb-link").evaluate((el) => el.getBoundingClientRect().height);
    expect(roomy).toBeGreaterThan(compact);
  });
});
