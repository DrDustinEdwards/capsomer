import { expect, test, type Page } from "@playwright/test";
import { eachTheme, expectContrast, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

// The focus ring is an inset outline drawn over the row's own --sel tint, so its contrast is
// the outline colour against the row's background (paintedContrast measures an outline
// against the parent's background, which is not what the eye sees here).
function ringContrast(page: Page, sel: string): Promise<{ ring: string; bg: string; ratio: number; width: string } | null> {
  return page.evaluate((s) => {
    const el = document.querySelector<HTMLElement>(s);
    if (!el) return null;
    const cs = getComputedStyle(el);
    const rgb = (v: string) => (v.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
    const lum = (c: number[]) => {
      const f = (x: number) => {
        const t = x / 255;
        return t <= 0.04045 ? t / 12.92 : Math.pow((t + 0.055) / 1.055, 2.4);
      };
      return 0.2126 * f(c[0] ?? 0) + 0.7152 * f(c[1] ?? 0) + 0.0722 * f(c[2] ?? 0);
    };
    const a = lum(rgb(cs.outlineColor));
    const b = lum(rgb(cs.backgroundColor));
    return { ring: cs.outlineColor, bg: cs.backgroundColor, width: cs.outlineWidth, ratio: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05) };
  }, sel);
}

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "row-list", theme);
    await expectNoAxeViolations(page);
  });

  test("accessibility: no axe violations at phone width", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 640 });
    await visitStates(page, "row-list", theme, "phone");
    await expectNoAxeViolations(page);
  });

  test("accessibility: title, detail and time reach their contrast, at rest and focused", async ({ page }) => {
    await visitStates(page, "row-list", theme);
    await expectContrast(page, [
      { sel: "#list-mixed .cap-row-title a", what: "a row's title" },
      { sel: "#list-mixed .cap-row-detail", what: "a row's detail line" },
      { sel: "#list-mixed .cap-row-meta", what: "a row's time" },
      { sel: "#list-focus .cap-row[data-force='focus'] .cap-row-title a", what: "a focused row's title on --sel" },
      { sel: "#list-focus .cap-row[data-force='focus'] .cap-row-detail", what: "a focused row's detail on --sel" },
      { sel: "#list-focus .cap-row[data-force='focus'] .cap-row-meta", what: "a focused row's time on --sel" },
    ]);
  });

  test("accessibility: the focused row's ring is 3:1 against the row's tint, and at least 2 px", async ({ page }) => {
    await visitStates(page, "row-list", theme);
    const r = await ringContrast(page, "#list-focus .cap-row[data-force='focus']");
    expect(r, "the focused specimen row is on the page").not.toBeNull();
    expect(r?.width).toBe("2px");
    expect(r?.ratio ?? 0, `ring ${r?.ring} on ${r?.bg}`).toBeGreaterThanOrEqual(3);
  });

  test("accessibility: the ring a real keyboard focus draws matches the specimen's", async ({ page }) => {
    await visitStates(page, "row-list", theme);
    await page.getByRole("link", { name: "4 notices" }).focus();
    const real = await ringContrast(page, "#list-mixed .cap-row:has(a:focus-visible)");
    const forced = await ringContrast(page, "#list-focus .cap-row[data-force='focus']");
    expect(real?.ring).toBe(forced?.ring);
    expect(real?.bg).toBe(forced?.bg);
  });

  test("accessibility: the list's roles and names", async ({ page }) => {
    await visitStates(page, "row-list", theme);
    await expect(page.locator("#list-mixed")).toMatchAriaSnapshot(`
      - list /Mixed, worst first/:
        - listitem:
          - link "foxhound.app is not answering"
        - listitem:
          - link "D1 rows read will run out before the reset"
        - listitem:
          - link "2 jobs are waiting for approval"
        - listitem:
          - link /germomics/
        - listitem:
          - link "4 notices"
    `);
    await expect(page.locator("#list-actions")).toMatchAriaSnapshot(`
      - list:
        - listitem:
          - link "Push design/capsomer and open a pull request"
          - button "Approve"
          - button "Decline"
    `);
  });

  test("accessibility: a row's link is described by its status and detail", async ({ page }) => {
    await visitStates(page, "row-list", theme);
    await expect(page.getByRole("link", { name: "foxhound.app is not answering" })).toHaveAccessibleDescription("Critical 3 failed checks in a row, first at 14:02");
  });

  test("keyboard: j and k move focus between the primary list's rows", async ({ page }) => {
    await visitStates(page, "row-list", theme);
    await page.locator("h1").click();
    await page.keyboard.press("j");
    await expect(page.getByRole("link", { name: "foxhound.app is not answering" })).toBeFocused();
    await page.keyboard.press("j");
    await expect(page.getByRole("link", { name: "D1 rows read will run out before the reset" })).toBeFocused();
    await page.keyboard.press("k");
    await expect(page.getByRole("link", { name: "foxhound.app is not answering" })).toBeFocused();
    await page.keyboard.press("k");
    await expect(page.getByRole("link", { name: "foxhound.app is not answering" })).toBeFocused();
  });

  test("keyboard: j stops at the last row", async ({ page }) => {
    await visitStates(page, "row-list", theme);
    await page.getByRole("link", { name: "germomics: no backup reported" }).focus();
    await page.keyboard.press("j");
    await expect(page.getByRole("link", { name: "4 notices" })).toBeFocused();
    await page.keyboard.press("j");
    await expect(page.getByRole("link", { name: "4 notices" })).toBeFocused();
  });

  test("keyboard: j and k work in any list once focus is in it, and only there", async ({ page }) => {
    await visitStates(page, "row-list", theme);
    await page.getByRole("link", { name: "Run the browser tests for capsomer" }).focus();
    await page.keyboard.press("j");
    await expect(page.getByRole("link", { name: "Refresh the uptime strip fixtures" })).toBeFocused();
    await page.keyboard.press("k");
    await expect(page.getByRole("link", { name: "Run the browser tests for capsomer" })).toBeFocused();
  });

  test("keyboard: Tab moves from row to row, one stop each", async ({ page }) => {
    await visitStates(page, "row-list", theme);
    await page.getByRole("link", { name: "foxhound.app is not answering" }).focus();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "D1 rows read will run out before the reset" })).toBeFocused();
  });

  test("keyboard: Enter follows the focused row's link", async ({ page }) => {
    await visitStates(page, "row-list", theme);
    await page.locator("h1").click();
    await page.keyboard.press("j");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#site-foxhound$/);
  });

  test("keyboard: j typed into a field stays in the field", async ({ page }) => {
    await visitStates(page, "row-list", theme);
    await page.evaluate(() => {
      const input = Object.assign(document.createElement("input"), { id: "probe", type: "text" });
      input.setAttribute("aria-label", "Filter");
      document.querySelector("h1")?.after(input);
    });
    await page.locator("#probe").focus();
    await page.keyboard.type("jk");
    await expect(page.locator("#probe")).toBeFocused();
    await expect(page.locator("#probe")).toHaveValue("jk");
  });

  test("keyboard: j does nothing when single-key shortcuts are off", async ({ page }) => {
    await visitStates(page, "row-list", theme);
    await page.evaluate(() => (document.documentElement.dataset.capSingleKeys = "off"));
    await page.locator("h1").click();
    await page.keyboard.press("j");
    await expect(page.getByRole("link", { name: "foxhound.app is not answering" })).not.toBeFocused();
  });

  test("keyboard: a row is one tab stop, and its actions are their own", async ({ page }) => {
    await visitStates(page, "row-list", theme);
    await page.getByRole("link", { name: "Push design/capsomer and open a pull request" }).focus();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "Approve" })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "Decline" })).toBeFocused();
  });

  test("behaviour: a click anywhere on the row follows its link", async ({ page }) => {
    await visitStates(page, "row-list", theme);
    // The stretched link covers the whole row, so a click on the row lands on the link.
    await page.locator("#list-crit .cap-row").click();
    await expect(page).toHaveURL(/#job-failed$/);
  });

  test("behaviour: row actions sit above the stretched link and take their own clicks", async ({ page }) => {
    await visitStates(page, "row-list", theme);
    await page.locator("#act-decline").scrollIntoViewIfNeeded();
    const hit = await page.evaluate(() => {
      const b = document.getElementById("act-decline")?.getBoundingClientRect();
      if (!b) return null;
      return document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2)?.id ?? null;
    });
    expect(hit).toBe("act-decline");
    await page.locator("#act-decline").click();
    await expect(page).not.toHaveURL(/#job-push$/);
  });

  test("behaviour: a long title is cut with an ellipsis and keeps its full name", async ({ page }) => {
    await visitStates(page, "row-list", theme);
    const link = page.locator("#long-title");
    await expect(link).toHaveCSS("text-overflow", "ellipsis");
    const cut = await link.evaluate((el) => el.scrollWidth > el.clientWidth);
    expect(cut).toBe(true);
    await expect(link).toHaveAccessibleName(/factor of two$/);
  });

  test("behaviour: a critical row has the red edge, others none", async ({ page }) => {
    await visitStates(page, "row-list", theme);
    const edge = (sel: string) => page.locator(sel).evaluate((el) => getComputedStyle(el, "::before").content);
    expect(await edge("#list-crit .cap-row")).toBe('""');
    expect(await edge("#list-focus .cap-row >> nth=0")).toBe("none");
  });

  test("behaviour: at phone width the status sits above the title", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 640 });
    await visitStates(page, "row-list", theme, "phone");
    const status = await page.locator("#p1-s").boundingBox();
    const title = await page.getByRole("link", { name: "Push design/capsomer" }).boundingBox();
    expect(status && title).toBeTruthy();
    if (status && title) expect(status.y + status.height).toBeLessThanOrEqual(title.y + 1);
  });
});
