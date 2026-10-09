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
          - link "Activity, 120"
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

  test("keyboard: the collapse control shrinks the menu to icons, nothing moves, and the choice is remembered", async ({ page }) => {
    await visitStates(page, "admin-shell", theme, "expanded");
    const toggle = page.locator("[data-cap-part='menu-toggle']");
    const menu = page.locator(".cap-admin-menu");
    const places = () =>
      page.evaluate(() =>
        [...document.querySelectorAll<HTMLElement>(".cap-admin-menu a")].map((a) => {
          const r = a.getBoundingClientRect();
          return { name: a.getAttribute("aria-label") ?? a.textContent?.trim(), y: Math.round(r.top), h: Math.round(r.height) };
        }),
      );
    const before = await places();
    const control = await toggle.boundingBox();
    await toggle.focus();
    await page.keyboard.press("Enter");
    await expect(page.locator(".cap-admin")).toHaveAttribute("data-menu", "collapsed");
    await expect(toggle).toHaveAccessibleName("Expand menu");
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    // An icon column at the collapsed rail width, beside the strip.
    await expect(menu).toBeVisible();
    expect((await menu.boundingBox())?.width).toBe(56);
    expect((await page.locator(".cap-admin-strip").boundingBox())?.width).toBe(56);
    // Same order, same places, same names; only the words are hidden.
    const after = await places();
    expect(after).toEqual(before);
    for (const sel of [".cap-admin-menu .cap-admin-group-label", ".cap-admin-menu a .cap-admin-label"]) {
      for (const el of await page.locator(sel).all()) await expect(el).toHaveCSS("opacity", "0");
    }
    await expect(page.getByRole("link", { name: "Queue, 5 blocked" })).toBeVisible();
    // Badges stay on the icons: a count, and a dot where a count does not fit.
    const badge = page.getByRole("link", { name: "Queue, 5 blocked" }).locator(".cap-admin-count");
    await expect(badge).toBeVisible();
    await expect(badge).toHaveText("5");
    const wide = await page.getByRole("link", { name: "Activity, 120" }).locator(".cap-admin-count").boundingBox();
    expect(wide?.width).toBe(8);
    // The current page keeps its dark fill; the strip's badges stay.
    await expect(page.locator(".cap-admin-menu a[aria-current='page']")).toHaveCSS("background-color", /^(?!rgba\(0, 0, 0, 0\))/);
    await expect(page.getByRole("link", { name: "Carrel, 2 AI drafts waiting" })).toBeVisible();
    // The collapse control is in the same place in both states.
    const control2 = await toggle.boundingBox();
    expect(control2?.x).toBe(control?.x);
    expect(control2?.y).toBe(control?.y);
    await page.reload();
    await expect(page.locator(".cap-admin")).toHaveAttribute("data-menu", "collapsed");
    await toggle.focus();
    await page.keyboard.press("Space");
    await expect(page.locator(".cap-admin")).not.toHaveAttribute("data-menu", "collapsed");
    expect((await menu.boundingBox())?.width).toBe(208);
  });

  test("keyboard: a collapsed menu icon shows its label on hover and focus, and Esc hides it", async ({ page }) => {
    await visitStates(page, "admin-shell", theme, "collapsed");
    const link = page.getByRole("link", { name: "Sites, 11" });
    const label = link.locator(".cap-admin-label");
    await expect(label).toHaveCSS("opacity", "0");
    await link.hover();
    await expect(label).toHaveCSS("opacity", "1");
    await expectContrast(page, [{ sel: ".cap-admin-menu a:hover .cap-admin-label", what: "the shown label" }]);
    // The label is painted over the page, not under it.
    const top = await label.evaluate((el) => {
      // The label ignores the pointer, so let it be hit for this one look.
      (el as HTMLElement).style.pointerEvents = "auto";
      const r = el.getBoundingClientRect();
      const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)?.closest(".cap-admin-label") === el;
      (el as HTMLElement).style.pointerEvents = "";
      return hit;
    });
    expect(top, "the label is covered by the page").toBe(true);
    await page.mouse.move(700, 400);
    await link.focus();
    await expect(label).toHaveCSS("opacity", "1");
    await expect(label).toHaveText("Sites");
    await page.keyboard.press("Escape");
    await expect(label).toHaveCSS("opacity", "0");
    await expectNoAxeViolations(page);
  });

  test("keyboard: a strip control shows its name on focus, and Esc hides it", async ({ page }) => {
    await visitStates(page, "admin-shell", theme, "expanded");
    const tile = page.getByRole("link", { name: "Carrel, 2 AI drafts waiting" });
    await tile.focus();
    const tip = tile.locator(".cap-admin-tip");
    await expect(tip).toHaveCSS("opacity", "1");
    await expect(tip).toContainText("G 2");
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

  test("behaviour: G then a number jumps to that app, never the one already open, and Ctrl and a digit do nothing", async ({ page }) => {
    await visitStates(page, "admin-shell", theme, "expanded");
    await page.keyboard.press("Control+2");
    await expect(page).not.toHaveURL(/#carrel/);
    await page.keyboard.press("g");
    await page.keyboard.press("1");
    await expect(page).not.toHaveURL(/#portal/);
    await page.keyboard.press("2");
    await expect(page).not.toHaveURL(/#carrel/);
    await page.keyboard.press("g");
    await page.keyboard.press("2");
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

  test("behaviour: on a short 360px phone Sign out stays in view, pinned under the scrolling list", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 560 });
    await visitStates(page, "admin-shell", theme, "phone");
    await page.getByRole("button", { name: "More" }).click();
    const sheet = page.getByRole("dialog", { name: /apps and more/ });
    const signOut = sheet.getByRole("button", { name: /^Sign out/ });
    await expect(signOut).toBeVisible();
    const box = await signOut.boundingBox();
    expect(box!.y + box!.height).toBeLessThanOrEqual(560);
    const body = await sheet.locator(".cap-dialog-body").evaluate((el) => ({ scrolls: el.scrollHeight > el.clientHeight, bottom: el.getBoundingClientRect().bottom }));
    expect(body.scrolls, "the list above the account block scrolls").toBe(true);
    expect(body.bottom, "the list ends where the account block begins").toBeLessThanOrEqual(box!.y);
    await expect(sheet.getByRole("navigation", { name: "Account" }).getByRole("link", { name: "Portal settings" })).toBeVisible();
    await expect(sheet.getByRole("navigation", { name: "Account" }).getByRole("button", { name: "Keyboard shortcuts" })).toBeVisible();
    await expectNoAxeViolations(page);
  });

  test("behaviour: every row of the sheet starts its label in one column, icon or none", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await visitStates(page, "admin-shell", theme, "phone");
    await page.getByRole("button", { name: "More" }).click();
    const xs = await page.locator("dialog.cap-admin-sheet .cap-admin-sheet-name").evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().x)));
    expect(xs.length).toBeGreaterThan(10);
    expect([...new Set(xs)]).toHaveLength(1);
  });

  test("keyboard: opening the sheet puts focus on its heading, and Tab goes on from there", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await visitStates(page, "admin-shell", theme, "phone");
    const more = page.getByRole("button", { name: "More" });
    await more.focus();
    await page.keyboard.press("Enter");
    const heading = page.locator("#cap-admin-sheet-title");
    await expect(heading).toBeFocused();
    await expect(heading).toHaveAttribute("tabindex", "-1");
    await page.keyboard.press("Tab");
    expect(await page.evaluate(() => document.activeElement?.closest("dialog.cap-admin-sheet") !== null && document.activeElement?.id !== "cap-admin-sheet-title")).toBe(true);
  });

  test("behaviour: opening the sheet with a tap leaves no focus ring on a row", async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, colorScheme: theme });
    const page = await context.newPage();
    await visitStates(page, "admin-shell", theme, "phone");
    await page.getByRole("button", { name: "More" }).tap();
    await expect(page.locator("#cap-admin-sheet-title")).toBeFocused();
    expect(await page.evaluate(() => document.activeElement?.matches(":focus-visible"))).toBe(false);
    await context.close();
  });

  test("accessibility: the current tab has a tinted pill behind its icon as well as its colour, and keeps aria-current", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await visitStates(page, "admin-shell", theme, "phone");
    const fill = (sel: string) => page.locator(sel).evaluate((el) => getComputedStyle(el).backgroundColor);
    const current = ".cap-admin-tabs a[aria-current='page'] .cap-admin-icon";
    await expect(page.locator(".cap-admin-tabs a[aria-current='page']")).toHaveCount(1);
    expect(await fill(current)).not.toBe("rgba(0, 0, 0, 0)");
    expect(await fill(".cap-admin-tabs a:not([aria-current]) .cap-admin-icon >> nth=0")).toBe("rgba(0, 0, 0, 0)");
    const box = await page.locator(current).boundingBox();
    expect(box!.width).toBeGreaterThan(box!.height * 1.5);
  });

  test("behaviour: tab labels are 12px and all five tabs fit a 360px phone, badges clear of the icon", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await visitStates(page, "admin-shell", theme, "phone");
    const tabs = await page.locator(".cap-admin-tabs > *").evaluateAll((els) =>
      els.map((e) => {
        const r = e.getBoundingClientRect();
        const text = [...e.childNodes].find((n) => n.nodeType === Node.TEXT_NODE)!;
        const range = document.createRange();
        range.selectNodeContents(text);
        const t = range.getBoundingClientRect();
        const icon = e.querySelector(".cap-admin-icon")!.getBoundingClientRect();
        const glyph = { right: icon.left + icon.width / 2 + 10 };
        const badge = e.querySelector(".cap-admin-badge")?.getBoundingClientRect();
        return { right: r.right, left: r.left, font: getComputedStyle(e).fontSize, textW: t.width, w: r.width, clear: badge ? badge.left >= glyph.right : true };
      }),
    );
    expect(tabs).toHaveLength(5);
    for (const t of tabs) {
      expect(t.font).toBe("12px");
      expect(t.textW).toBeLessThanOrEqual(t.w);
      expect(t.clear).toBe(true);
    }
    expect(Math.max(...tabs.map((t) => t.right))).toBeLessThanOrEqual(360);
    expect(Math.min(...tabs.map((t) => t.left))).toBeGreaterThanOrEqual(0);
  });

  test("behaviour: a tab count past 99 reads 99+ and its name keeps the real count", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await visitStates(page, "admin-shell", theme, "phone-counts");
    const queue = page.getByRole("link", { name: "Queue, 120 blocked" });
    await expect(queue.locator(".cap-admin-badge")).toHaveText("99+");
    const q = await queue.boundingBox();
    const b = await queue.locator(".cap-admin-badge").boundingBox();
    const next = await page.getByRole("button", { name: "More" }).locator(".cap-admin-icon").boundingBox();
    expect(b!.x + b!.width, "the badge stays clear of the next tab's pill").toBeLessThanOrEqual(next!.x);
    expect(q!.width).toBeGreaterThan(0);
  });

  test("behaviour: the phone's thin bar names the app at the left; a desktop bar does not, and an empty one is not drawn", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await visitStates(page, "admin-shell", theme, "phone");
    await expect(page.locator(".cap-admin-bar-app")).toBeVisible();
    await expect(page.locator(".cap-admin-bar-app")).toHaveText("Capsid Portal");
    await expect(page.locator(".cap-admin-bar")).toContainText("Updated 6 min ago");
    await visitStates(page, "admin-shell", theme, "reader");
    await expect(page.locator(".cap-admin-bar")).toContainText("dustinedwards.info");
    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(page.locator(".cap-admin-bar")).toBeHidden();
    await visitStates(page, "admin-shell", theme, "expanded");
    await expect(page.locator(".cap-admin-bar-app")).toBeHidden();
    await expect(page.locator(".cap-admin-bar")).toBeVisible();
  });
});
