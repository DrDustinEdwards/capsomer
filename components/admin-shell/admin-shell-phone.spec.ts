import { expect, test } from "@playwright/test";
import {
  eachTheme,
  expectContrast,
  expectNoAxeViolations,
  visitStates,
  settled,
} from "../../test/helpers.ts";

// The admin shell at phone width: the header's one row, the sheet and the five tabs.
eachTheme((theme) => {
  // The theme button says what it does: the other theme.
  const themeName = theme === "light" ? "Switch to dark theme" : "Switch to light theme";
  // Reflow at 320px is the sweep's (test/sweep.spec.ts).
  test("behavior: at 320px the logo shows its mark, keeps its name, and the menu button is in view", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await visitStates(page, "admin-shell", theme, "phone");
    // The last tab's wide count ("99+") stays inside the window and clear of its glyph.
    const badges = await page.locator(".cap-site-tabs > *").evaluateAll((els) =>
      els.flatMap((e) => {
        const b = e.querySelector(".cap-site-header-badge")?.getBoundingClientRect();
        const i = e.querySelector("svg")!.getBoundingClientRect();
        return b ? [{ right: b.right, clear: b.left >= i.left + i.width / 2 + 10 }] : [];
      }),
    );
    expect(badges.length).toBeGreaterThan(0);
    for (const b of badges) {
      expect(b.clear).toBe(true);
      expect(b.right).toBeLessThanOrEqual(320);
    }
    const menu = (await page.getByRole("button", { name: "Menu" }).boundingBox())!;
    expect(menu.x + menu.width).toBeLessThanOrEqual(320);
    await expect(page.getByRole("link", { name: "Capsid Portal" })).toBeVisible();
    await expectNoAxeViolations(page);
  });

  test("accessibility: at phone width the strip and menu give way to the header's one row and five tabs, with no More", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 760 });
    await visitStates(page, "admin-shell", theme, "phone");
    await expectNoAxeViolations(page);
    await expect(page.locator(".cap-admin-strip")).toBeHidden();
    await expect(page.locator(".cap-admin-menu")).toBeHidden();
    await expect(page.locator(".cap-site-header")).toMatchAriaSnapshot(`
      - banner:
        - link "Skip to content"
        - link "Capsid Portal"
        - button "Search everything"
        - link "Inbox, 7 need you"
        - button "${themeName}"
        - button "Your account"
        - button "Menu"
    `);
    await expect(page.locator(".cap-site-tabs > *")).toHaveCount(5);
    await expect(page.locator(".cap-site-tabs button")).toHaveCount(0);
    await expect(page.locator(".cap-site-tabs")).toMatchAriaSnapshot(`
      - navigation "Sections":
        - link "Overview"
        - link "Sites, 11"
        - link "Incidents, 4 open"
        - link "Queue, 5 blocked"
        - link "Activity 99+, 120"
    `);
    await expectContrast(page, [
      { sel: ".cap-site-tabs a[aria-current='page']", what: "the current tab" },
      { sel: ".cap-site-tabs a:not([aria-current])", what: "another tab" },
    ]);
  });

  test("keyboard: the menu button opens the sheet with the apps and every page, Esc closes it and focus returns to the button", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 760 });
    await visitStates(page, "admin-shell", theme, "phone");
    const menu = page.getByRole("button", { name: "Menu" });
    await menu.focus();
    await page.keyboard.press("Enter");
    const sheet = page.getByRole("dialog", { name: "Capsid Portal menu" });
    await expect(sheet).toBeVisible();
    await expect(sheet).toHaveAttribute("data-placement", "bottom");
    await expect(menu).toHaveAttribute("aria-expanded", "true");
    await expect(sheet.getByRole("link", { name: /^Carrel/ })).toBeVisible();
    await expect(sheet.getByRole("link", { name: "Namespaces, 11" })).toBeAttached();
    // Search and the inbox are in the top row, so the sheet does not repeat them.
    await expect(sheet.getByRole("button", { name: "Search everything" })).toHaveCount(0);
    await expectNoAxeViolations(page);
    await page.keyboard.press("Escape");
    await expect(sheet).toBeHidden();
    await expect(menu).toBeFocused();
    await expect(menu).toHaveAttribute("aria-expanded", "false");
  });

  test("accessibility: the open sheet reaches its contrast", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 860 });
    await visitStates(page, "admin-shell", theme, "phone-sheet");
    await expectNoAxeViolations(page);
    await expectContrast(page, [
      {
        sel: ".cap-site-header-sheet-list a:not([aria-current]) .cap-site-header-sheet-name",
        what: "an app in the sheet",
      },
      { sel: ".cap-site-header-sheet-label", what: "a section label in the sheet" },
    ]);
  });

  test("behavior: on a short 360px phone Sign out stays in view, pinned under the scrolling list", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 560 });
    await visitStates(page, "admin-shell", theme, "phone");
    await page.getByRole("button", { name: "Menu" }).click();
    const sheet = page.getByRole("dialog", { name: "Capsid Portal menu" });
    const signOut = sheet.getByRole("button", { name: /^Sign out/ });
    await expect(signOut).toBeVisible();
    // Measure the sheet where it rests, not mid-slide: it opens from 2.5rem below.
    await settled(page);
    const box = await signOut.boundingBox();
    expect(box!.y + box!.height).toBeLessThanOrEqual(560);
    const body = await sheet.locator(".cap-dialog-body").evaluate((el) => ({
      scrolls: el.scrollHeight > el.clientHeight,
      bottom: el.getBoundingClientRect().bottom,
    }));
    expect(body.scrolls, "the list above the account block scrolls").toBe(true);
    expect(body.bottom, "the list ends where the account block begins").toBeLessThanOrEqual(box!.y);
    const account = sheet.getByRole("navigation", { name: "Account" });
    await expect(account.getByRole("link", { name: "Portal settings" })).toBeAttached();
    await expect(account.getByRole("button", { name: "Help and shortcuts" })).toBeAttached();
    await expectNoAxeViolations(page);
  });

  test("keyboard: opening the sheet puts focus on its heading, and Tab goes on from there", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await visitStates(page, "admin-shell", theme, "phone");
    const menu = page.getByRole("button", { name: "Menu" });
    await menu.focus();
    await page.keyboard.press("Enter");
    const heading = page.locator("dialog.cap-site-header-sheet .cap-site-header-sheet-title");
    await expect(heading).toBeFocused();
    await expect(heading).toHaveAttribute("tabindex", "-1");
    await page.keyboard.press("Tab");
    expect(
      await page.evaluate(
        () =>
          document.activeElement?.closest("dialog.cap-site-header-sheet") !== null &&
          !document.activeElement?.classList.contains("cap-site-header-sheet-title"),
      ),
    ).toBe(true);
  });

  test("behavior: opening the sheet with a tap leaves no focus ring on a row", async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      hasTouch: true,
      isMobile: true,
      colorScheme: theme,
    });
    const page = await context.newPage();
    await visitStates(page, "admin-shell", theme, "phone");
    await page.getByRole("button", { name: "Menu" }).tap();
    await expect(
      page.locator("dialog.cap-site-header-sheet .cap-site-header-sheet-title"),
    ).toBeFocused();
    expect(await page.evaluate(() => document.activeElement?.matches(":focus-visible"))).toBe(
      false,
    );
    await context.close();
  });

  test("accessibility: the current tab has a tinted pill behind its icon as well as its color, and keeps aria-current", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await visitStates(page, "admin-shell", theme, "phone");
    const fill = (sel: string) =>
      page.locator(sel).evaluate((el) => getComputedStyle(el).backgroundColor);
    const current = ".cap-site-tabs a[aria-current='page'] svg";
    await expect(page.locator(".cap-site-tabs a[aria-current='page']")).toHaveCount(1);
    expect(await fill(current)).not.toBe("rgba(0, 0, 0, 0)");
    expect(await fill(".cap-site-tabs a:not([aria-current]) svg >> nth=0")).toBe(
      "rgba(0, 0, 0, 0)",
    );
    const box = await page.locator(current).boundingBox();
    expect(box!.width).toBeGreaterThan(box!.height * 1.5);
  });

  test("behavior: all five tabs fit a 360px phone, badges clear of the icon", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await visitStates(page, "admin-shell", theme, "phone");
    const tabs = await page.locator(".cap-site-tabs > *").evaluateAll((els) =>
      els.map((e) => {
        const r = e.getBoundingClientRect();
        const text = [...e.childNodes].find((n) => n.nodeType === Node.TEXT_NODE)!;
        const range = document.createRange();
        range.selectNodeContents(text);
        const t = range.getBoundingClientRect();
        const icon = e.querySelector("svg")!.getBoundingClientRect();
        const glyph = { right: icon.left + icon.width / 2 + 10 };
        const badge = e.querySelector(".cap-site-header-badge")?.getBoundingClientRect();
        return {
          right: r.right,
          left: r.left,
          textW: t.width,
          w: r.width,
          clear: badge ? badge.left >= glyph.right : true,
        };
      }),
    );
    expect(tabs).toHaveLength(5);
    for (const t of tabs) {
      expect(t.textW).toBeLessThanOrEqual(t.w);
      expect(t.clear).toBe(true);
    }
    expect(Math.max(...tabs.map((t) => t.right))).toBeLessThanOrEqual(360);
    expect(Math.min(...tabs.map((t) => t.left))).toBeGreaterThanOrEqual(0);
  });

  test("behavior: a tab count past 99 reads 99+ and its name keeps the real count", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await visitStates(page, "admin-shell", theme, "phone-counts");
    const queue = page.getByRole("link", { name: "Queue 99+, 120 blocked" });
    await expect(queue.locator(".cap-site-header-badge")).toHaveText("99+");
    const b = await queue.locator(".cap-site-header-badge").boundingBox();
    const next = await page.locator(".cap-site-tabs > *").nth(4).locator("svg").boundingBox();
    expect(b!.x + b!.width, "the badge stays clear of the next tab's pill").toBeLessThanOrEqual(
      next!.x,
    );
  });

  test("behavior: on a phone the header's logo names the app and the bar keeps the freshness line; a top-level page shows no trail", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await visitStates(page, "admin-shell", theme, "phone");
    await expect(page.locator(".cap-site-header-logo")).toBeVisible();
    await expect(page.locator(".cap-site-header-logo")).toHaveAccessibleName("Capsid Portal");
    await expect(page.locator(".cap-admin-bar")).toContainText("Updated");
    // The bar does not repeat the app's name; the header carries it.
    await expect(page.locator(".cap-admin-bar-app")).toHaveCount(0);
    await page.setViewportSize({ width: 1280, height: 800 });
    await visitStates(page, "admin-shell", theme, "expanded");
    // The page's heading is "Overview": the bar does not say it again.
    await expect(page.locator(".cap-admin-trail")).toHaveCount(0);
    expect(await page.locator(".cap-admin-bar").innerText()).not.toContain("Overview");
    await visitStates(page, "admin-shell", theme, "trail");
    await expect(page.locator(".cap-admin-trail li")).toHaveText(["Sites", "fieldnotes.example"]);
    await expect(page.locator(".cap-admin-trail [aria-current='page']")).toHaveText(
      "fieldnotes.example",
    );
  });
});
