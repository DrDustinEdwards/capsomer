import { expect, test, type Page } from "@playwright/test";
import { eachTheme, expectContrast, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

const id = (page: Page) => page.evaluate(() => document.activeElement?.id ?? "");
const selected = (page: Page, root: string) => page.locator(`${root} [role="tab"][aria-selected="true"]`).evaluate((el) => el.id);

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "tabs", theme);
    await expectNoAxeViolations(page);
  });

  test("accessibility: tab text, counts and the chosen tab's edge reach their contrast", async ({ page }) => {
    await visitStates(page, "tabs", theme);
    await expectContrast(page, [
      { sel: "#td-overview", what: "the chosen tab's label" },
      { sel: "#td-runs", what: "a tab's label on the tray" },
      { sel: "#td-runs .cap-tab-count", what: "a tab's count on the tray" },
      { sel: "#td-overview", what: "the chosen tab's edge", part: "border" },
      { sel: "#tl-draft", what: "the chosen line tab's label" },
      { sel: "#tl-preview", what: "a line tab's label" },
      { sel: "#tl-history .cap-tab-count", what: "a line tab's count" },
      { sel: "#td-alerts", what: "a disabled tab's label (kept readable)" },
      { sel: "#tabs-links .cap-tab[aria-current='page']", what: "the current link tab" },
      { sel: "#tabs-links .cap-tab[aria-current='page']", what: "the current link tab's edge", part: "border" },
      { sel: "#tabs-links .cap-tab:not([aria-current])", what: "a link tab" },
    ]);
  });

  test("accessibility: roles and names", async ({ page }) => {
    await visitStates(page, "tabs", theme);
    await expect(page.locator("#tabs-default")).toMatchAriaSnapshot(`
      - tablist "Site sections":
        - tab "Overview" [selected]
        - tab "Runs 24"
        - tab "Alerts" [disabled]
        - tab "Settings"
      - tabpanel "Overview":
        - paragraph: /foxhound.app is up.*/
    `);
    await expect(page.locator("#tabs-links")).toMatchAriaSnapshot(`
      - navigation "Filter mentions by status":
        - link "Open 12"
        - link "Resolved 48"
        - link "All 60"
    `);
    await expect(page.getByRole("tablist", { name: "Settings sections" })).toHaveAttribute("aria-orientation", "vertical");
  });

  test("accessibility: the chosen tab is the one tab stop and each tab names its panel", async ({ page }) => {
    await visitStates(page, "tabs", theme);
    const tabs = page.locator("#tabs-default [role='tab']");
    await expect(tabs.nth(0)).toHaveAttribute("tabindex", "0");
    for (const i of [1, 2, 3]) await expect(tabs.nth(i)).toHaveAttribute("tabindex", "-1");
    await expect(page.locator("#tdp-runs")).toHaveAttribute("aria-labelledby", "td-runs");
    await expect(page.locator("#td-runs")).toHaveAttribute("aria-controls", "tdp-runs");
    await expect(page.locator("#tdp-runs")).toBeHidden();
    await expect(page.locator("#td-alerts")).toHaveAttribute("aria-disabled", "true");
  });

  test("accessibility: every tab is at least the target size", async ({ page }) => {
    await visitStates(page, "tabs", theme);
    const sizes = await page.locator(".cap-tab").evaluateAll((els) => els.map((el) => el.getBoundingClientRect()).filter((r) => r.width > 0).map((r) => [r.width, r.height]));
    expect(sizes.length).toBeGreaterThan(10);
    for (const [w, h] of sizes) {
      expect(w).toBeGreaterThanOrEqual(24);
      expect(h).toBeGreaterThanOrEqual(24);
    }
  });

  test("keyboard: Tab enters the list on the chosen tab, then goes to its panel", async ({ page }) => {
    await visitStates(page, "tabs", theme);
    await page.locator("#td-runs").click();
    await expect(page.locator("#td-runs")).toHaveAttribute("aria-selected", "true");
    await page.keyboard.press("Tab");
    expect(await id(page)).toBe("tdp-runs");
    await page.keyboard.press("Shift+Tab");
    expect(await id(page)).toBe("td-runs");
  });

  test("keyboard: Right and Left arrows move to the next and previous tab and choose it, wrapping and skipping a disabled one", async ({ page }) => {
    await visitStates(page, "tabs", theme);
    await page.locator("#td-overview").focus();
    await page.keyboard.press("ArrowRight");
    expect(await id(page)).toBe("td-runs");
    expect(await selected(page, "#tabs-default")).toBe("td-runs");
    await expect(page.locator("#tdp-runs")).toBeVisible();
    await expect(page.locator("#tdp-overview")).toBeHidden();
    await page.keyboard.press("ArrowRight");
    expect(await id(page)).toBe("td-settings");
    await page.keyboard.press("ArrowRight");
    expect(await id(page)).toBe("td-overview");
    await page.keyboard.press("ArrowLeft");
    expect(await id(page)).toBe("td-settings");
    await page.keyboard.press("ArrowLeft");
    expect(await id(page)).toBe("td-runs");
  });

  test("keyboard: Home and End go to the first and last tab", async ({ page }) => {
    await visitStates(page, "tabs", theme);
    await page.locator("#td-runs").focus();
    await page.keyboard.press("End");
    expect(await id(page)).toBe("td-settings");
    expect(await selected(page, "#tabs-default")).toBe("td-settings");
    await page.keyboard.press("Home");
    expect(await id(page)).toBe("td-overview");
    expect(await selected(page, "#tabs-default")).toBe("td-overview");
  });

  test("keyboard: Down and Up move a vertical list, Left and Right do not", async ({ page }) => {
    await visitStates(page, "tabs", theme);
    await page.locator("#tv-general").focus();
    await page.keyboard.press("ArrowRight");
    expect(await id(page)).toBe("tv-general");
    await page.keyboard.press("ArrowDown");
    expect(await id(page)).toBe("tv-agents");
    expect(await selected(page, "#tabs-vertical")).toBe("tv-agents");
    await page.keyboard.press("ArrowUp");
    expect(await id(page)).toBe("tv-general");
    await page.keyboard.press("End");
    expect(await id(page)).toBe("tv-keys");
  });

  test("keyboard: with manual activation arrows move focus only and Enter or Space chooses", async ({ page }) => {
    await visitStates(page, "tabs", theme);
    await page.locator("#tm-posts").focus();
    await page.keyboard.press("ArrowRight");
    expect(await id(page)).toBe("tm-media");
    expect(await selected(page, "#tabs-manual")).toBe("tm-posts");
    await expect(page.locator("#tmp-posts")).toBeVisible();
    await page.keyboard.press("Enter");
    expect(await selected(page, "#tabs-manual")).toBe("tm-media");
    await expect(page.locator("#tmp-media")).toBeVisible();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("Space");
    expect(await selected(page, "#tabs-manual")).toBe("tm-mentions");
    await expect(page.locator("#tmp-mentions")).toBeVisible();
  });

  test("keyboard: leaving a manual list after only moving focus makes the chosen tab the tab stop again", async ({ page }) => {
    await visitStates(page, "tabs", theme);
    await page.locator("#tm-posts").focus();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("Tab");
    expect(await id(page)).toBe("tmp-posts");
    await expect(page.locator("#tm-posts")).toHaveAttribute("tabindex", "0");
    await expect(page.locator("#tm-media")).toHaveAttribute("tabindex", "-1");
  });

  test("keyboard: link tabs are each a tab stop and Enter follows one", async ({ page }) => {
    await visitStates(page, "tabs", theme);
    await page.getByRole("link", { name: "Open 12" }).focus();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "Resolved 48" })).toBeFocused();
    await page.keyboard.press("Enter");
    expect(new URL(page.url()).hash).toBe("#resolved");
  });

  test("behaviour: a click chooses a tab and shows only its panel", async ({ page }) => {
    await visitStates(page, "tabs", theme);
    await page.locator("#td-settings").click();
    await expect(page.locator("#td-settings")).toHaveAttribute("aria-selected", "true");
    await expect(page.locator("#td-overview")).toHaveAttribute("aria-selected", "false");
    await expect(page.locator("#td-settings")).toHaveAttribute("tabindex", "0");
    await expect(page.locator("#tdp-settings")).toBeVisible();
    await expect(page.locator("#tdp-overview")).toBeHidden();
  });

  test("behaviour: a disabled tab is not chosen by a click", async ({ page }) => {
    await visitStates(page, "tabs", theme);
    await page.locator("#td-alerts").click({ force: true });
    await expect(page.locator("#td-overview")).toHaveAttribute("aria-selected", "true");
    await expect(page.locator("#tdp-alerts")).toBeHidden();
  });

  test("behaviour: choosing a tab tells the page with cap:tabs-change", async ({ page }) => {
    await visitStates(page, "tabs", theme);
    await page.evaluate(() => {
      (window as unknown as { seen: string[] }).seen = [];
      document.addEventListener("cap:tabs-change", (e) => (window as unknown as { seen: string[] }).seen.push(`${(e.target as HTMLElement).id}>${(e as CustomEvent).detail.panel.id}`));
    });
    await page.locator("#td-runs").click();
    await page.locator("#td-runs").click();
    expect(await page.evaluate(() => (window as unknown as { seen: string[] }).seen)).toEqual(["td-runs>tdp-runs"]);
  });

  test("behaviour: the address follows the tab and a link with the hash opens it", async ({ page }) => {
    await visitStates(page, "tabs", theme);
    await page.locator("#th-keys").click();
    expect(new URL(page.url()).hash).toBe("#thp-keys");
    await expect(page.locator("#thp-keys")).toBeVisible();
    await page.evaluate(() => (location.hash = "#thp-start"));
    await expect(page.locator("#th-start")).toHaveAttribute("aria-selected", "true");
    await expect(page.locator("#thp-start")).toBeVisible();
  });

  test("behaviour: the delivered HTML holds every panel, the inactive ones hidden", async ({ page }) => {
    const html = await (await page.request.get("components/tabs/states.html")).text();
    expect(html).toContain("24 runs in the last day.");
    expect(html).toContain('id="tdp-runs" aria-labelledby="td-runs" tabindex="0" hidden');
    expect(html).toContain('<a class="cap-tab" href="#open" aria-current="page">');
  });

  test("behaviour: a list too wide for its space scrolls and keeps the chosen tab in view", async ({ page }) => {
    await visitStates(page, "tabs", theme);
    const list = page.locator("#tabs-narrow .cap-tabs-list");
    const wide = await list.evaluate((el) => el.scrollWidth > el.clientWidth);
    expect(wide).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    await page.locator("#tn-posts").focus();
    await page.keyboard.press("End");
    const inView = await page.locator("#tn-media").evaluate((el) => {
      const a = el.getBoundingClientRect();
      const b = (el.parentElement as HTMLElement).getBoundingClientRect();
      return a.left >= b.left - 1 && a.right <= b.right + 1;
    });
    expect(inView).toBe(true);
  });

  test("behaviour: comfortable density makes the tabs taller", async ({ page }) => {
    await visitStates(page, "tabs", theme);
    const compact = await page.locator("#td-overview").evaluate((el) => el.getBoundingClientRect().height);
    const roomy = await page.locator("#tc-a").evaluate((el) => el.getBoundingClientRect().height);
    expect(roomy).toBeGreaterThan(compact);
  });
  for (const mount of ["router", "router-per-link"]) {
    test(`behaviour: a router link drawn by the ${mount === "router" ? "nav's" : "link's"} slot keeps the tab's look, count and current state`, async ({ page }) => {
      await visitStates(page, "tabs", theme);
      const nav = page.locator(`[data-mount='${mount}']`);
      const links = nav.locator("nav.cap-tabs-list a.cap-tab[data-router-link]");
      await expect(links).toHaveCount(4);
      await expect(nav.getByRole("link", { name: "Waiting 5" })).toHaveAttribute("aria-current", "page");
      await expect(nav.getByRole("link", { name: "All 24" })).not.toHaveAttribute("aria-current", "page");
      await expect(nav.getByRole("link", { name: "Approved 17" })).toHaveAttribute("href", "/mentions/approved");
      await expect(nav.locator(".cap-tab-count")).toHaveText(["24", "5", "17", "2"]);
    });

    test(`keyboard: Enter on a ${mount} link navigates through the router with no page load, and the current tab follows`, async ({ page }) => {
      await visitStates(page, "tabs", theme);
      const nav = page.locator(`[data-mount='${mount}']`);
      const before = page.url();
      await nav.getByRole("link", { name: "Spam 2" }).focus();
      await page.keyboard.press("Enter");
      await expect(nav.locator("[data-router-path]")).toHaveAttribute("data-router-path", "/mentions/spam");
      await expect(nav.getByRole("link", { name: "Spam 2" })).toHaveAttribute("aria-current", "page");
      await expect(nav.getByRole("link", { name: "Waiting 5" })).not.toHaveAttribute("aria-current", "page");
      expect(page.url()).toBe(before);
    });
  }

  test("accessibility: the router links have no axe violations and keep their contrast", async ({ page }) => {
    await visitStates(page, "tabs", theme);
    await expectContrast(page, [
      { sel: "[data-mount='router'] a.cap-tab[aria-current='page']", what: "the current router tab" },
      { sel: "[data-mount='router'] a.cap-tab:not([aria-current])", what: "another router tab" },
    ]);
  });
});
