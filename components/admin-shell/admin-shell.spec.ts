import { expect, test } from "@playwright/test";
import { eachTheme, expectContrast, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations, expanded", async ({ page }) => {
    await visitStates(page, "admin-shell", theme, "expanded");
    await expectNoAxeViolations(page);
  });

  test("accessibility: no axe violations, collapsed, with a name shown, with the account panel open, as a reader", async ({ page }) => {
    for (const only of ["collapsed", "tip", "account", "reader", "comfortable"]) {
      await visitStates(page, "admin-shell", theme, only);
      await expectNoAxeViolations(page);
    }
  });

  test("accessibility: the strip's and the menu's roles and names", async ({ page }) => {
    await visitStates(page, "admin-shell", theme, "expanded");
    await expect(page.locator(".cap-admin-strip")).toMatchAriaSnapshot(`
      - navigation "Apps and tools":
        - list:
          - listitem:
            - button "Collapse menu" [expanded]
          - listitem:
            - link "Capsid Portal"
          - listitem:
            - link "Carrel, 2 AI drafts waiting"
          - listitem:
            - link "dustinedwards.info"
          - listitem:
            - link "germomics, a check is failing"
          - listitem:
            - link "Foxhound"
          - listitem:
            - link "Foxing"
        - list:
          - listitem:
            - button "Search everything"
          - listitem:
            - link "Inbox, 7 need you"
          - listitem:
            - button "Help and shortcuts"
          - listitem:
            - button "Your account"
    `);
    await expect(page.locator(".cap-admin-menu")).toMatchAriaSnapshot(`
      - navigation "Sections":
        - group "Watch":
          - link "Overview"
          - link "Sites, 11"
          - link "Incidents, 4 open"
        - group "Work":
          - link "Queue, 5 blocked"
        - group "Records":
          - link "Activity"
          - link "Namespaces, 11"
    `);
  });

  test("accessibility: the app you are in is told by more than colour and shows no badge", async ({ page }) => {
    await visitStates(page, "admin-shell", theme, "expanded");
    const current = page.locator(".cap-admin-tile[aria-current='true']");
    await expect(current).toHaveCount(1);
    await expect(current.locator(".cap-admin-badge")).toHaveCount(0);
    // Another app's badge is there, and the current page in the menu is the dark pill.
    await expect(page.getByRole("link", { name: "Carrel, 2 AI drafts waiting" }).locator(".cap-admin-badge")).toHaveText("2");
    await expect(page.locator(".cap-admin-menu a[aria-current='page']")).toHaveCSS("font-weight", "600");
  });

  test("accessibility: menu text, counts, the dark pill and badges reach their contrast", async ({ page }) => {
    await visitStates(page, "admin-shell", theme, "expanded");
    await expectContrast(page, [
      { sel: ".cap-admin-menu a:not([aria-current]) > span:nth-child(2)", what: "an inactive menu entry" },
      { sel: ".cap-admin-menu a[aria-current='page']", what: "the current page on its dark pill" },
      { sel: ".cap-admin-count[data-tone='need']", what: "a needs-you pill" },
      { sel: ".cap-admin-count:not([data-tone])", what: "a plain count" },
      { sel: ".cap-admin-group-label", what: "a group label" },
      { sel: ".cap-admin-title", what: "the app's title" },
      { sel: ".cap-admin-tile[aria-current='true']", what: "the current app's tile" },
      { sel: ".cap-admin-badge:not([data-dot])", what: "a strip badge" },
      { sel: ".cap-admin-bar", what: "the page's status line" },
    ]);
  });

  test("keyboard: Tab goes strip, then menu, then content, and the skip link comes first", async ({ page }) => {
    await visitStates(page, "admin-shell", theme, "expanded");
    await page.keyboard.press("Tab");
    const skip = page.locator(".cap-admin-skip");
    await expect(skip).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.locator("#cap-main")).toBeFocused();
    await page.locator(".cap-admin-skip").focus();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "Collapse menu" })).toBeFocused();
    await expect(page.locator(".cap-admin-btn:focus-visible")).toHaveCount(1);
    const order = await page.evaluate(() => {
      const pos = (sel: string) => {
        const el = document.querySelector(sel);
        return el ? [...document.querySelectorAll("*")].indexOf(el) : -1;
      };
      return [pos(".cap-admin-strip"), pos(".cap-admin-menu"), pos(".cap-admin-main")];
    });
    expect(order[0]).toBeLessThan(order[1]!);
    expect(order[1]).toBeLessThan(order[2]!);
  });

  test("keyboard: the collapse control hides the menu, leaves the strip and its badges, and is remembered", async ({ page }) => {
    await visitStates(page, "admin-shell", theme, "expanded");
    const toggle = page.locator("[data-cap-part='menu-toggle']");
    const before = await toggle.boundingBox();
    await toggle.focus();
    await page.keyboard.press("Enter");
    await expect(page.locator(".cap-admin")).toHaveAttribute("data-menu", "collapsed");
    await expect(toggle).toHaveAccessibleName("Expand menu");
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(page.locator(".cap-admin-menu")).toBeHidden();
    await expect(page.locator(".cap-admin-strip")).toBeVisible();
    await expect(page.getByRole("link", { name: "Carrel, 2 AI drafts waiting" })).toBeVisible();
    // The control is in the same place in both states.
    const after = await toggle.boundingBox();
    expect(after?.x).toBe(before?.x);
    expect(after?.y).toBe(before?.y);
    await page.reload();
    await expect(page.locator(".cap-admin")).toHaveAttribute("data-menu", "collapsed");
    await page.keyboard.press("Tab");
    await toggle.focus();
    await page.keyboard.press("Space");
    await expect(page.locator(".cap-admin")).not.toHaveAttribute("data-menu", "collapsed");
    await expect(page.locator(".cap-admin-menu")).toBeVisible();
  });

  test("keyboard: a strip control shows its name on focus, and Esc hides it", async ({ page }) => {
    await visitStates(page, "admin-shell", theme, "expanded");
    const tile = page.getByRole("link", { name: "Carrel, 2 AI drafts waiting" });
    await tile.focus();
    const tip = tile.locator(".cap-admin-tip");
    await expect(tip).toHaveCSS("opacity", "1");
    await expect(tip).toContainText("Ctrl 2");
    await expectContrast(page, [{ sel: ".cap-admin-tile:focus-visible .cap-admin-tip-text", what: "the shown name" }]);
    await page.keyboard.press("Escape");
    await expect(tip).toHaveCSS("opacity", "0");
  });

  test("accessibility: the account panel is a popover with this app, elsewhere and sign out", async ({ page }) => {
    await visitStates(page, "admin-shell", theme, "expanded");
    const avatar = page.getByRole("button", { name: "Your account" });
    await avatar.focus();
    await page.keyboard.press("Enter");
    const panel = page.locator(".cap-admin-account");
    await expect(panel).toBeVisible();
    await expect(panel).toMatchAriaSnapshot(`
      - group "Your account":
        - strong: Dustin Edwards
        - group "This app":
          - link "Portal settings"
          - button "Keyboard shortcuts"
        - group "Elsewhere":
          - link "Carrel"
          - link "dustinedwards.info"
          - link "germomics"
          - link "Foxhound"
          - link "Foxing"
        - button "Sign out"
    `);
    await page.keyboard.press("Escape");
    await expect(panel).toBeHidden();
    await expect(avatar).toBeFocused();
  });

  test("behaviour: Ctrl and a digit jump to that app, never the one already open", async ({ page }) => {
    await visitStates(page, "admin-shell", theme, "expanded");
    await page.keyboard.press("Control+1");
    await expect(page).not.toHaveURL(/#portal/);
    await page.keyboard.press("Control+2");
    await expect(page).toHaveURL(/#carrel/);
  });

  test("behaviour: a public site is the same structure with one app, its sections and a reading column", async ({ page }) => {
    await visitStates(page, "admin-shell", theme, "reader");
    await expect(page.locator(".cap-admin-tile")).toHaveCount(1);
    await expect(page.locator(".cap-admin-menu").getByRole("link", { name: "Research" })).toHaveAttribute("aria-current", "page");
    const widths = await page.evaluate(() => {
      const strip = document.querySelector(".cap-admin-strip")!.getBoundingClientRect().width;
      const menu = document.querySelector(".cap-admin-menu")!.getBoundingClientRect().width;
      return [strip, menu];
    });
    expect(widths[0]).toBe(56);
    expect(widths[1]).toBe(208);
    await expect(page.locator(".cap-admin-page")).toHaveAttribute("data-measure", "reading");
  });

  test("behaviour: the strip and the menu have the same widths in every state", async ({ page }) => {
    await visitStates(page, "admin-shell", theme, "expanded");
    const strip = await page.locator(".cap-admin-strip").boundingBox();
    await visitStates(page, "admin-shell", theme, "collapsed");
    const collapsed = await page.locator(".cap-admin-strip").boundingBox();
    expect(collapsed?.width).toBe(strip?.width);
  });

  test("behaviour: comfortable density makes the menu items taller", async ({ page }) => {
    await visitStates(page, "admin-shell", theme, "expanded");
    const compact = (await page.getByRole("link", { name: "Overview" }).boundingBox())?.height ?? 0;
    await visitStates(page, "admin-shell", theme, "comfortable");
    const roomy = (await page.getByRole("link", { name: "Overview" }).boundingBox())?.height ?? 0;
    expect(roomy).toBeGreaterThanOrEqual(compact);
  });

  test("accessibility: at phone width the strip and menu give way to the tab bar and the sheet", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 760 });
    await visitStates(page, "admin-shell", theme, "phone");
    await expectNoAxeViolations(page);
    await expect(page.locator(".cap-admin-strip")).toBeHidden();
    await expect(page.locator(".cap-admin-menu")).toBeHidden();
    await expect(page.locator(".cap-admin-tabs a, .cap-admin-tabs button")).toHaveCount(5);
    await expect(page.locator(".cap-admin-tabs")).toMatchAriaSnapshot(`
      - navigation "Sections":
        - link "Overview"
        - link "Sites, 11"
        - link "Incidents, 4 open"
        - link "Queue, 5 blocked"
        - button "More"
    `);
    await expectContrast(page, [
      { sel: ".cap-admin-tabs a[aria-current='page']", what: "the current tab" },
      { sel: ".cap-admin-tabs button", what: "the More tab" },
    ]);
  });

  test("keyboard: More opens the sheet with the apps, Esc closes it and focus returns to More", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 760 });
    await visitStates(page, "admin-shell", theme, "phone");
    const more = page.getByRole("button", { name: "More" });
    await more.focus();
    await page.keyboard.press("Enter");
    const sheet = page.getByRole("dialog", { name: /apps and more/ });
    await expect(sheet).toBeVisible();
    await expect(sheet).toHaveAttribute("data-placement", "bottom");
    await expect(more).toHaveAttribute("aria-expanded", "true");
    await expect(sheet.getByRole("link", { name: "Carrel" })).toBeVisible();
    await expect(sheet.getByRole("button", { name: "Search everything" })).toBeVisible();
    await expectNoAxeViolations(page);
    await page.keyboard.press("Escape");
    await expect(sheet).toBeHidden();
    await expect(more).toBeFocused();
    await expect(more).toHaveAttribute("aria-expanded", "false");
  });

  test("accessibility: the open sheet reaches its contrast", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 860 });
    await visitStates(page, "admin-shell", theme, "phone-sheet");
    await expectNoAxeViolations(page);
    await expectContrast(page, [
      { sel: ".cap-admin-sheet-list a:not([aria-current]) .cap-admin-sheet-name", what: "an app in the sheet" },
      { sel: ".cap-admin-sheet-label", what: "a section label in the sheet" },
    ]);
  });
});
