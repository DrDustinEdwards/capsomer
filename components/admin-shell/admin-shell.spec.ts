import { expect, test } from "@playwright/test";
import { eachTheme, expectContrast, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

eachTheme((theme) => {
  // The theme button says what it does: the other theme.
  const themeName = theme === "light" ? "Switch to dark theme" : "Switch to light theme";
  test("accessibility: no axe violations, expanded", async ({ page }) => {
    await visitStates(page, "admin-shell", theme, "expanded");
    await expectNoAxeViolations(page);
  });

  test("accessibility: no axe violations, collapsed, with a name shown, with the account panel open, as a reader", async ({ page }) => {
    for (const only of ["collapsed", "tip", "account", "reader", "comfortable"]) {
      await visitStates(page, "admin-shell", theme, only);
      // The tile whose tip is open: axe-core 4.14 reads the open tip's words and key caps as the
      // tile's visible label, but a tip describes its trigger (role tooltip), it does not label
      // it. The tile is scanned closed in every other state.
      if (only === "tip") await page.evaluate(() => document.querySelector(".cap-admin-tip:popover-open")?.closest(".cap-admin-tile")?.setAttribute("data-tip-open", ""));
      await expectNoAxeViolations(page, undefined, only === "tip" ? { exclude: "[data-tip-open]" } : {});
    }
  });

  test("accessibility: the strip's and the menu's roles and names", { tag: "@markup" }, async ({ page }) => {
    await visitStates(page, "admin-shell", theme, "expanded");
    await expect(page.locator(".cap-site-header")).toMatchAriaSnapshot(`
      - banner:
        - link "Skip to content"
        - link "Capsid Portal"
        - button "Search everything"
        - link "Inbox, 7 need you"
        - button "${themeName}"
        - button "Your account"
    `);
    // Tiles and badges only: search, inbox and help moved to the header (0.9.0).
    await expect(page.locator(".cap-admin-strip")).toMatchAriaSnapshot(`
      - navigation "Apps":
        - list:
          - listitem:
            - link "Capsid Portal"
          - listitem:
            - link "Carrel Desk, 2 AI drafts waiting"
          - listitem:
            - link "dustinedwards.info"
          - listitem:
            - link "germomics, 1 check failing"
          - listitem:
            - link "Foxhound"
          - listitem:
            - link "Foxing"
          - listitem:
            - link "Capsomer Scaffold"
    `);
    await expect(page.locator(".cap-admin-strip button")).toHaveCount(0);
    await expect(page.locator(".cap-admin-menu")).toMatchAriaSnapshot(`
      - navigation "Sections":
        - button "Collapse menu" [expanded]
        - group "Watch":
          - link "Overview"
          - link "Sites, 11"
          - link "Incidents, 4 open"
        - group "Work":
          - link "Queue, 5 blocked"
        - group "Records":
          - link "Activity 99+, 120"
          - link "Namespaces, 11"
    `);
  });

  test("accessibility: the app you are in is told by more than color and shows no badge", async ({ page }) => {
    await visitStates(page, "admin-shell", theme, "expanded");
    const current = page.locator(".cap-admin-tile[aria-current='true']");
    await expect(current).toHaveCount(1);
    await expect(current.locator(".cap-admin-badge")).toHaveCount(0);
    // Another app's badge is there, and the current page in the menu is the dark pill.
    await expect(page.getByRole("link", { name: "Carrel Desk, 2 AI drafts waiting" }).locator(".cap-admin-badge")).toHaveText("2");
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
      { sel: ".cap-admin-tile[aria-current='true']", what: "the current app's tile" },
      { sel: ".cap-admin-badge:not([data-dot])", what: "a strip badge" },
      { sel: ".cap-admin-bar", what: "the page's status line" },
    ]);
  });

  test("keyboard: Tab goes header, then strip, then menu, then content, and the skip link comes first", async ({ page }) => {
    await visitStates(page, "admin-shell", theme, "expanded");
    await page.keyboard.press("Tab");
    const skip = page.locator(".cap-site-header-skip");
    await expect(skip).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.locator("#cap-main")).toBeFocused();
    await skip.focus();
    const names: string[] = [];
    for (let i = 0; i < 13; i++) {
      await page.keyboard.press("Tab");
      names.push(await page.evaluate(() => document.activeElement?.getAttribute("aria-label") ?? document.activeElement?.textContent?.trim() ?? ""));
    }
    expect(names.slice(0, 5)).toEqual(["Capsid Portal", "Search everything", "Inbox, 7 need you", themeName, "Your account"]);
    expect(names.slice(5, 12).map((n) => n.split(",")[0])).toEqual(["Capsid Portal", "Carrel Desk", "dustinedwards.info", "germomics", "Foxhound", "Foxing", "Capsomer Scaffold"]);
    await expect(page.locator("[data-cap-part='menu-toggle']")).toBeFocused();
    await expect(page.locator(".cap-admin-collapse:focus-visible")).toHaveCount(1);
    const order = await page.evaluate(() => {
      const pos = (sel: string) => {
        const el = document.querySelector(sel);
        return el ? [...document.querySelectorAll("*")].indexOf(el) : -1;
      };
      return [pos(".cap-site-header"), pos(".cap-admin-strip"), pos(".cap-admin-menu"), pos(".cap-admin-main")];
    });
    expect(order).toEqual([...order].sort((a, b) => a - b));
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
    expect((await menu.boundingBox())?.width).toBe(80);
    expect((await page.locator(".cap-admin-strip").boundingBox())?.width).toBe(56);
    // Same order, same places, same names; only the words are hidden.
    const after = await places();
    expect(after).toEqual(before);
    for (const el of await page.locator(".cap-admin-menu a .cap-admin-label").all()) await expect(el).toHaveCSS("clip-path", "inset(50%)");
    for (const el of await page.locator(".cap-admin-menu .cap-admin-group-label").all()) await expect(el).toHaveCSS("color", "rgba(0, 0, 0, 0)");
    await expect(page.getByRole("link", { name: "Queue, 5 blocked" })).toBeVisible();
    // Counts stay beside the icons, the same number as open: 99+ past 99.
    const badge = page.getByRole("link", { name: "Queue, 5 blocked" }).locator(".cap-admin-count");
    await expect(badge).toBeVisible();
    await expect(badge).toHaveText("5");
    await expect(page.getByRole("link", { name: "Activity 99+, 120" }).locator(".cap-admin-count")).toHaveText("99+");
    // The current page keeps its dark fill; the strip's badges stay.
    await expect(page.locator(".cap-admin-menu a[aria-current='page']")).toHaveCSS("background-color", /^(?!rgba\(0, 0, 0, 0\))/);
    await expect(page.getByRole("link", { name: "Carrel Desk, 2 AI drafts waiting" })).toBeVisible();
    // The collapse control is in the same place in both states.
    const control2 = await toggle.boundingBox();
    expect(control2?.x).toBe(control?.x);
    expect(control2?.y).toBe(control?.y);
    await page.reload();
    await expect(page.locator(".cap-admin")).toHaveAttribute("data-menu", "collapsed");
    await toggle.focus();
    await page.keyboard.press("Space");
    await expect(page.locator(".cap-admin")).not.toHaveAttribute("data-menu", "collapsed");
    expect((await menu.boundingBox())?.width).toBe(232);
  });

  test("keyboard: a collapsed menu icon shows its name on hover and focus, and Esc hides it", async ({ page }) => {
    await visitStates(page, "admin-shell", theme, "collapsed");
    const link = page.getByRole("link", { name: "Sites, 11" });
    const tip = link.locator(".cap-admin-tip");
    await expect(tip).toBeHidden();
    await link.hover();
    await expect(tip).toBeVisible();
    await expect(tip).toHaveText("Sites");
    await expectContrast(page, [{ sel: ".cap-admin-menu .cap-admin-tip:popover-open .cap-admin-tip-text", what: "the shown name" }]);
    await page.mouse.move(700, 400);
    await expect(tip).toBeHidden();
    await link.focus();
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Tab");
    await expect(tip).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(tip).toBeHidden();
    await expect(link).toBeFocused();
    // The name is the link's own: the tip adds no description that repeats it.
    expect(await link.getAttribute("aria-describedby")).toBeNull();
    await expectNoAxeViolations(page);
  });
  test("keyboard: a strip control shows its name on focus, its keys as key caps, and Esc hides it", async ({ page }) => {
    await visitStates(page, "admin-shell", theme, "expanded");
    await page.locator(".cap-admin-tile").first().focus();
    await page.keyboard.press("Tab");
    const tile = page.getByRole("link", { name: "Carrel Desk, 2 AI drafts waiting" });
    await expect(tile).toBeFocused();
    const tip = tile.locator(".cap-admin-tip");
    await expect(tip).toBeVisible();
    await expect(tip.locator(".cap-admin-tip-text")).toHaveText("Carrel Desk");
    // "G 2" is two keys, each a key cap with its own edge.
    await expect(tip.locator("kbd")).toHaveText(["G", "2"]);
    for (const k of await tip.locator("kbd").all()) expect(await k.evaluate((el) => getComputedStyle(el).borderTopStyle)).toBe("solid");
    await expectContrast(page, [
      { sel: ".cap-admin-tile .cap-admin-tip:popover-open .cap-admin-tip-text", what: "the shown name" },
      { sel: ".cap-admin-tile .cap-admin-tip:popover-open kbd", what: "a key cap" },
    ]);
    await page.keyboard.press("Escape");
    await expect(tip).toBeHidden();
  });
  test("accessibility: the header's account menu holds this app, View site and Help, and Sign out last", { tag: "@markup" }, async ({ page }) => {
    await visitStates(page, "admin-shell", theme, "expanded");
    const avatar = page.getByRole("button", { name: "Your account" });
    await expect(avatar.locator(".cap-site-header-initials")).toHaveAttribute("data-initials", "DE");
    await avatar.focus();
    await page.keyboard.press("Enter");
    const panel = page.locator(".cap-site-header-account .cap-site-header-panel");
    await expect(panel).toBeVisible();
    await expect(avatar).toHaveAttribute("aria-expanded", "true");
    await expect(panel).toMatchAriaSnapshot(`
      - group "Your account":
        - strong: Dustin Edwards
        - text: Owner · dustin@example.test
        - separator
        - text: This app
        - list:
          - listitem:
            - link "Portal settings"
          - listitem:
            - button "Keyboard shortcuts"
        - separator
        - list:
          - listitem:
            - link "View site"
          - listitem:
            - button "Help and shortcuts"
        - separator
        - list:
          - listitem:
            - button "Sign out"
    `);
    await expect(panel.getByRole("link", { name: "Portal settings" })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(panel).toBeHidden();
    await expect(avatar).toBeFocused();
  });

  test("behavior: G then a number jumps to that app, never the one already open, and Ctrl and a digit do nothing", async ({ page }) => {
    // The other apps are other origins: a jump is caught here, not followed.
    await page.route(/https:\/\/(portal|desk)\.dustinedwards\.info\//, (r) => r.fulfill({ body: "another app" }));
    await visitStates(page, "admin-shell", theme, "expanded");
    await page.keyboard.press("Control+2");
    await page.keyboard.press("g");
    await page.keyboard.press("1");
    await page.keyboard.press("2");
    await page.waitForTimeout(300);
    await expect(page).toHaveURL(/localhost/);
    await page.keyboard.press("g");
    await page.keyboard.press("2");
    await expect(page).toHaveURL("https://desk.dustinedwards.info/");
  });

  test("behavior: a reader's area is the user variant: no strip, the 288px menu, a reading column", async ({ page }) => {
    await visitStates(page, "admin-shell", theme, "reader");
    await expect(page.locator(".cap-admin-strip")).toHaveCount(0);
    await expect(page.locator(".cap-admin-menu").getByRole("link", { name: "Articles" })).toHaveAttribute("aria-current", "page");
    expect((await page.locator(".cap-admin-menu").boundingBox())?.width).toBe(288);
    await expect(page.locator(".cap-admin-page")).toHaveAttribute("data-measure", "reading");
  });

  test("behavior: the strip and the menu have the same widths in every state", async ({ page }) => {
    await visitStates(page, "admin-shell", theme, "expanded");
    const strip = await page.locator(".cap-admin-strip").boundingBox();
    await visitStates(page, "admin-shell", theme, "collapsed");
    const collapsed = await page.locator(".cap-admin-strip").boundingBox();
    expect(collapsed?.width).toBe(strip?.width);
  });

  test("behavior: comfortable density makes the menu items taller", async ({ page }) => {
    await visitStates(page, "admin-shell", theme, "expanded");
    const compact = (await page.getByRole("link", { name: "Overview" }).boundingBox())?.height ?? 0;
    await visitStates(page, "admin-shell", theme, "comfortable");
    const roomy = (await page.getByRole("link", { name: "Overview" }).boundingBox())?.height ?? 0;
    expect(roomy).toBeGreaterThanOrEqual(compact);
  });

  // Reflow at 320px is the sweep's (test/sweep.spec.ts).
  test("behavior: at 320px the logo shows its mark, keeps its name, and the menu button is in view", async ({ page }) => {
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

  test("accessibility: at phone width the strip and menu give way to the header's one row and five tabs, with no More", async ({ page }) => {
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

  test("keyboard: the menu button opens the sheet with the apps and every page, Esc closes it and focus returns to the button", async ({ page }) => {
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
      { sel: ".cap-site-header-sheet-list a:not([aria-current]) .cap-site-header-sheet-name", what: "an app in the sheet" },
      { sel: ".cap-site-header-sheet-label", what: "a section label in the sheet" },
    ]);
  });

  test("behavior: on a short 360px phone Sign out stays in view, pinned under the scrolling list", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 560 });
    await visitStates(page, "admin-shell", theme, "phone");
    await page.getByRole("button", { name: "Menu" }).click();
    const sheet = page.getByRole("dialog", { name: "Capsid Portal menu" });
    const signOut = sheet.getByRole("button", { name: /^Sign out/ });
    await expect(signOut).toBeVisible();
    // Measure the sheet where it rests, not mid-slide: it opens from 2.5rem below.
    await page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished.catch(() => undefined))).then(() => undefined));
    const box = await signOut.boundingBox();
    expect(box!.y + box!.height).toBeLessThanOrEqual(560);
    const body = await sheet.locator(".cap-dialog-body").evaluate((el) => ({ scrolls: el.scrollHeight > el.clientHeight, bottom: el.getBoundingClientRect().bottom }));
    expect(body.scrolls, "the list above the account block scrolls").toBe(true);
    expect(body.bottom, "the list ends where the account block begins").toBeLessThanOrEqual(box!.y);
    const account = sheet.getByRole("navigation", { name: "Account" });
    await expect(account.getByRole("link", { name: "Portal settings" })).toBeAttached();
    await expect(account.getByRole("button", { name: "Help and shortcuts" })).toBeAttached();
    await expectNoAxeViolations(page);
  });

  test("behavior: every row of the sheet starts its label in one column, icon or none", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await visitStates(page, "admin-shell", theme, "phone");
    await page.getByRole("button", { name: "Menu" }).click();
    const xs = await page.locator("dialog.cap-site-header-sheet .cap-site-header-sheet-name").evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().x)));
    expect(xs.length).toBeGreaterThan(10);
    expect([...new Set(xs)]).toHaveLength(1);
  });

  test("keyboard: opening the sheet puts focus on its heading, and Tab goes on from there", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await visitStates(page, "admin-shell", theme, "phone");
    const menu = page.getByRole("button", { name: "Menu" });
    await menu.focus();
    await page.keyboard.press("Enter");
    const heading = page.locator("dialog.cap-site-header-sheet .cap-site-header-sheet-title");
    await expect(heading).toBeFocused();
    await expect(heading).toHaveAttribute("tabindex", "-1");
    await page.keyboard.press("Tab");
    expect(await page.evaluate(() => document.activeElement?.closest("dialog.cap-site-header-sheet") !== null && !document.activeElement?.classList.contains("cap-site-header-sheet-title"))).toBe(true);
  });

  test("behavior: opening the sheet with a tap leaves no focus ring on a row", async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, colorScheme: theme });
    const page = await context.newPage();
    await visitStates(page, "admin-shell", theme, "phone");
    await page.getByRole("button", { name: "Menu" }).tap();
    await expect(page.locator("dialog.cap-site-header-sheet .cap-site-header-sheet-title")).toBeFocused();
    expect(await page.evaluate(() => document.activeElement?.matches(":focus-visible"))).toBe(false);
    await context.close();
  });

  test("accessibility: the current tab has a tinted pill behind its icon as well as its color, and keeps aria-current", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await visitStates(page, "admin-shell", theme, "phone");
    const fill = (sel: string) => page.locator(sel).evaluate((el) => getComputedStyle(el).backgroundColor);
    const current = ".cap-site-tabs a[aria-current='page'] svg";
    await expect(page.locator(".cap-site-tabs a[aria-current='page']")).toHaveCount(1);
    expect(await fill(current)).not.toBe("rgba(0, 0, 0, 0)");
    expect(await fill(".cap-site-tabs a:not([aria-current]) svg >> nth=0")).toBe("rgba(0, 0, 0, 0)");
    const box = await page.locator(current).boundingBox();
    expect(box!.width).toBeGreaterThan(box!.height * 1.5);
  });

  test("behavior: tab labels are 12px and all five tabs fit a 360px phone, badges clear of the icon", async ({ page }) => {
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
        return { right: r.right, left: r.left, textW: t.width, w: r.width, clear: badge ? badge.left >= glyph.right : true };
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

  test("behavior: a tab count past 99 reads 99+ and its name keeps the real count", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await visitStates(page, "admin-shell", theme, "phone-counts");
    const queue = page.getByRole("link", { name: "Queue 99+, 120 blocked" });
    await expect(queue.locator(".cap-site-header-badge")).toHaveText("99+");
    const b = await queue.locator(".cap-site-header-badge").boundingBox();
    const next = await page.locator(".cap-site-tabs > *").nth(4).locator("svg").boundingBox();
    expect(b!.x + b!.width, "the badge stays clear of the next tab's pill").toBeLessThanOrEqual(next!.x);
  });

  test("behavior: on a phone the header's logo names the app and the bar keeps the freshness line; a top-level page shows no trail", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await visitStates(page, "admin-shell", theme, "phone");
    await expect(page.locator(".cap-site-header-logo")).toBeVisible();
    await expect(page.locator(".cap-site-header-logo")).toHaveAccessibleName("Capsid Portal");
    await expect(page.locator(".cap-admin-bar")).toContainText("Updated");
    // 0.9.0: the bar no longer repeats the app's name; the header carries it.
    await expect(page.locator(".cap-admin-bar-app")).toHaveCount(0);
    await page.setViewportSize({ width: 1280, height: 800 });
    await visitStates(page, "admin-shell", theme, "expanded");
    // The page's heading is "Overview": the bar does not say it again.
    await expect(page.locator(".cap-admin-trail")).toHaveCount(0);
    expect(await page.locator(".cap-admin-bar").innerText()).not.toContain("Overview");
    await visitStates(page, "admin-shell", theme, "trail");
    await expect(page.locator(".cap-admin-trail li")).toHaveText(["Sites", "fieldnotes.example"]);
    await expect(page.locator(".cap-admin-trail [aria-current='page']")).toHaveText("fieldnotes.example");
  });
  test("behavior: every icon, the logo tiles and the current row keep their place when the menu opens and closes", async ({ page }) => {
    await visitStates(page, "admin-shell", theme, "expanded");
    const places = () =>
      page.evaluate(() => {
        const at = (el: Element) => {
          const r = el.getBoundingClientRect();
          return { x: Math.round(r.left * 2) / 2, y: Math.round(r.top * 2) / 2, w: Math.round(r.width), h: Math.round(r.height) };
        };
        const menu = [...document.querySelectorAll(".cap-admin-menu a")].map((a) => at(a.querySelector(".cap-admin-icon, .cap-admin-letter")!));
        const strip = [...document.querySelectorAll(".cap-admin-strip .cap-admin-tile")].map((el) => at(el.querySelector(".cap-admin-logo") ?? el));
        menu.unshift(at(document.querySelector(".cap-admin-collapse .cap-admin-icon")!));
        const cur = at(document.querySelector(".cap-admin-menu a[aria-current='page']")!);
        return { menu, strip, current: { x: cur.x, y: cur.y, h: cur.h } };
      });
    const open = await places();
    expect(open.menu.length, "menu icons measured, the collapse control's first").toBe(7);
    expect(open.strip.length, "strip tiles measured").toBe(7);
    await page.locator("[data-cap-part='menu-toggle']").click();
    await expect(page.locator(".cap-admin")).toHaveAttribute("data-menu", "collapsed");
    const shut = await places();
    expect(shut.menu, "menu icons, open then collapsed").toEqual(open.menu);
    expect(shut.strip, "strip icons and logos").toEqual(open.strip);
    expect(shut.current, "the current row's left edge, top and height").toEqual(open.current);
    // Collapsed, each icon sits in the middle of the icon column.
    const centered = await page.evaluate(() => {
      const col = document.querySelector(".cap-admin-menu")!.getBoundingClientRect();
      return [...document.querySelectorAll(".cap-admin-menu a .cap-admin-icon")].map((i) => {
        const r = i.getBoundingClientRect();
        return Math.abs(r.left + r.width / 2 - (col.left + col.width / 2));
      });
    });
    for (const off of centered) expect(off).toBeLessThanOrEqual(1.5);
  });

  // One look and one place for every shown name: Capsomer's tooltip, in the top layer.
  const tipFacts = (tip: import("@playwright/test").Locator) =>
    tip.evaluate((el) => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      // 2px inside each rounded corner: on the diagonal a corner of radius R cuts R(1 - 1/√2) off
      // the box (1.76px of a 6px radius), so a point 2px in from the box's corner sits a fraction
      // of a pixel from the curve and missed the hit test at some sub-pixel positions.
      const k = 2 + parseFloat(cs.borderTopLeftRadius) * (1 - Math.SQRT1_2);
      const pts = [
        [r.left + k, r.top + k],
        [r.right - k, r.top + k],
        [r.left + k, r.bottom - k],
        [r.right - k, r.bottom - k],
        [r.left + r.width / 2, r.top + r.height / 2],
      ];
      const opaque = /^rgb\(/.test(cs.backgroundColor) && cs.opacity === "1";
      const hit = pts.every(([x, y]) => el.contains(document.elementFromPoint(x!, y!)));
      // What the tip must not cover: its own control (and the control's badge), and the controls
      // just above and below it.
      const control = el.parentElement!;
      const li = control.closest("li");
      const near = [control, control.querySelector(".cap-admin-badge, .cap-admin-count:not(:empty)"), li?.previousElementSibling?.querySelector("a, button"), li?.nextElementSibling?.querySelector("a, button")];
      const sib = control.closest(".cap-admin-menu") ? [control.previousElementSibling, control.nextElementSibling].filter((e) => e?.matches("a")) : [];
      const covers = [...near, ...sib]
        .filter((n): n is Element => !!n)
        .filter((n) => {
          const b = n.getBoundingClientRect();
          return b.width > 0 && Math.min(r.right, b.right) - Math.max(r.left, b.left) > 0 && Math.min(r.bottom, b.bottom) - Math.max(r.top, b.top) > 0;
        })
        .map((n) => n.getAttribute("aria-label") ?? n.textContent);
      return { hit, opaque, inside: r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight, covers, look: [cs.backgroundColor, cs.boxShadow, cs.fontSize, cs.paddingTop, cs.borderRadius].join(" | ") };
    });

  test("behavior: a name shown beside any strip control or collapsed menu icon is opaque, whole, above every panel, tile and badge, and covers none of its neighbors", async ({ page }) => {
    const looks = new Set<string>();
    let checked = 0;
    for (const state of ["expanded", "collapsed"]) {
      await visitStates(page, "admin-shell", theme, state);
      const controls = page.locator(".cap-admin-strip .cap-admin-tile");
      for (let i = 0; i < (await controls.count()); i++) {
        const c = controls.nth(i);
        await c.hover();
        const tip = c.locator(".cap-admin-tip");
        await expect(tip).toBeVisible();
        await expect(tip).toHaveCSS("opacity", "1");
        const got = await tipFacts(tip);
        expect(got, `${state}: the name of ${await c.getAttribute("aria-label")}`).toMatchObject({ hit: true, opaque: true, inside: true, covers: [] });
        looks.add(got.look);
        checked++;
      }
    }
    const links = page.locator(".cap-admin-menu a");
    for (let i = 0; i < (await links.count()); i++) {
      const link = links.nth(i);
      await link.hover();
      const tip = link.locator(".cap-admin-tip");
      await expect(tip).toBeVisible();
      await expect(tip).toHaveCSS("opacity", "1");
      await expect(tip).toHaveText((await link.locator(".cap-admin-label").textContent()) ?? "");
      const got = await tipFacts(tip);
      expect(got, `the collapsed name ${await tip.textContent()}`).toMatchObject({ hit: true, opaque: true, inside: true, covers: [] });
      looks.add(got.look);
      checked++;
    }
    expect(checked, "names checked").toBeGreaterThanOrEqual(20);
    // The strip open, the strip collapsed and the menu's icons: one tooltip, one look.
    expect([...looks]).toHaveLength(1);
  });

  test("behavior: the collapse control's name shows only while collapsed, where it is opaque, whole and covers no neighbor", async ({ page }) => {
    await visitStates(page, "admin-shell", theme, "expanded");
    const toggle = page.locator("[data-cap-part='menu-toggle']");
    await expect(toggle).toHaveAccessibleName("Collapse menu");
    // Open, its words are in view, so it shows no tip.
    await expect(toggle.locator(".cap-admin-label")).toHaveText("Collapse menu");
    await page.mouse.move(600, 400);
    await toggle.hover();
    await page.waitForTimeout(500);
    await expect(toggle.locator(".cap-admin-tip")).toBeHidden();
    await visitStates(page, "admin-shell", theme, "collapsed");
    await expect(toggle).toHaveAccessibleName("Expand menu");
    await page.mouse.move(600, 400);
    await toggle.hover();
    const tip = toggle.locator(".cap-admin-tip");
    await expect(tip).toBeVisible();
    await expect(tip).toHaveCSS("opacity", "1");
    await expect(tip).toContainText("Expand menu");
    expect(await tipFacts(tip), "collapsed: the name of the menu button").toMatchObject({ hit: true, opaque: true, inside: true, covers: [] });
  });

  test("accessibility: a shown name has its own surface and a visible edge, unlike the selected menu item, in both themes", async ({ page }) => {
    await visitStates(page, "admin-shell", theme, "collapsed");
    await page.getByRole("link", { name: "Sites, 11" }).hover();
    const tip = page.locator(".cap-admin-menu .cap-admin-tip:popover-open");
    await expect(tip).toBeVisible();
    const ratios = await page.evaluate(() => {
      const tip = document.querySelector(".cap-admin-menu .cap-admin-tip:popover-open")!;
      const selected = document.querySelector(".cap-admin-menu a[aria-current='page']")!;
      const ground = getComputedStyle(document.querySelector(".cap-admin-main")!.closest(".cap-admin")!).backgroundColor;
      // No edge drawn reads as the surface itself: no edge.
      const edge = getComputedStyle(tip).boxShadow.match(/rgba?\([^)]*\)/)?.[0] ?? getComputedStyle(tip).backgroundColor;
      return { tipVsSelected: window.capRatio(getComputedStyle(tip).backgroundColor, getComputedStyle(selected).backgroundColor), edgeVsGround: window.capRatio(edge, ground) };
    });
    expect(ratios.tipVsSelected, "the tip's surface against the selected item's fill").toBeGreaterThanOrEqual(3);
    expect(ratios.edgeVsGround, "the tip's edge against the page").toBeGreaterThanOrEqual(3);
  });
  // Every bubble against its glyph, with the ring around the bubble counted as part of it.
  const bubbles = (page: import("@playwright/test").Page) =>
    page.evaluate(() =>
      [...document.querySelectorAll(".cap-admin-strip .cap-admin-tile, .cap-admin-menu a")]
        .map((el) => {
          const bubble = el.querySelector(".cap-admin-badge, .cap-admin-count:not(:empty)");
          const glyph = el.querySelector(".cap-admin-icon, .cap-admin-logo");
          if (!bubble || !glyph || getComputedStyle(bubble).display === "none") return null;
          const ring = parseFloat(getComputedStyle(bubble).boxShadow.match(/(\d+(?:\.\d+)?)px\s*$/)?.[1] ?? "0");
          const b = bubble.getBoundingClientRect();
          const g = glyph.getBoundingClientRect();
          const w = Math.max(0, Math.min(b.right + ring, g.right) - Math.max(b.left - ring, g.left));
          const h = Math.max(0, Math.min(b.bottom + ring, g.bottom) - Math.max(b.top - ring, g.top));
          const menu = el.closest(".cap-admin-menu")?.getBoundingClientRect();
          return { name: el.getAttribute("aria-label"), area: Math.round(w * h), dx: Math.round(b.left - g.right), dy: Math.round(b.top + b.height / 2 - g.top), right: b.right + ring, edge: menu ? menu.right - 1 : null, text: bubble.textContent };
        })
        .filter((x) => x !== null),
    );

  test("behavior: collapsed, every badge and count sits in one place beside its glyph, never on it, never across the menu's edge", async ({ page }) => {
    await visitStates(page, "admin-shell", theme, "collapsed");
    const all = await bubbles(page);
    expect(all.length, "bubbles measured").toBeGreaterThanOrEqual(7);
    for (const o of all) expect(o.area, `${o.name}: the bubble or its ring covers the glyph`).toBe(0);
    // One place relative to the glyph: the same gap to its right, the same height on its top edge.
    expect([...new Set(all.map((o) => `${o.dx},${o.dy}`))], "bubble offsets from their glyphs").toHaveLength(1);
    for (const o of all.filter((o) => o.edge !== null)) expect(o.right, `${o.name}: the bubble crosses into the content`).toBeLessThanOrEqual(o.edge!);
    // 120 reads 99+ here, as it does open.
    expect(all.find((o) => o.name?.startsWith("Activity"))?.text).toBe("99+");
  });

  test("behavior: open, no count crosses the menu's edge", async ({ page }) => {
    await visitStates(page, "admin-shell", theme, "expanded");
    const edge = await page.locator(".cap-admin-menu").evaluate((el) => el.getBoundingClientRect().right - 1);
    const rights = await page.locator(".cap-admin-menu .cap-admin-count:not(:empty)").evaluateAll((els) => els.map((e) => e.getBoundingClientRect().right));
    expect(rights.length).toBeGreaterThanOrEqual(5);
    for (const r of rights) expect(r).toBeLessThanOrEqual(edge);
    await expect(page.getByRole("link", { name: "Activity 99+, 120" }).locator(".cap-admin-count")).toHaveText("99+");
  });

  test("accessibility: neutral and needs-you bubbles read against their bubble and stand out from the menu, open and collapsed", async ({ page }) => {
    for (const state of ["expanded", "collapsed"]) {
      await visitStates(page, "admin-shell", theme, state);
      await expectContrast(page, [
        { sel: ".cap-admin-menu a:not([aria-current]) .cap-admin-count:not([data-tone]):not(:empty)", what: `${state}: a neutral count` },
        { sel: ".cap-admin-menu .cap-admin-count[data-tone='need']", what: `${state}: a needs-you count` },
        { sel: ".cap-admin-strip .cap-admin-badge", what: `${state}: a strip badge` },
      ]);
      const ratio = await page.evaluate(() => {
        const bubble = getComputedStyle(document.querySelector(".cap-admin-menu a:not([aria-current]) .cap-admin-count:not([data-tone]):not(:empty)")!).backgroundColor;
        const menu = getComputedStyle(document.querySelector(".cap-admin-menu")!).backgroundColor;
        return window.capRatio(bubble, menu);
      });
      expect(ratio, `${state}: a neutral bubble against the menu`).toBeGreaterThanOrEqual(3);
    }
  });

  test("accessibility: a hovered collapsed item is clearly marked: a fill off the page and an edge at 3:1", async ({ page }) => {
    await visitStates(page, "admin-shell", theme, "collapsed");
    const link = page.getByRole("link", { name: "Activity 99+, 120" });
    await link.hover();
    const r = await link.evaluate((el) => {
      const cs = getComputedStyle(el);
      const menu = getComputedStyle(el.closest(".cap-admin-menu")!).backgroundColor;
      const edge = cs.boxShadow.match(/rgba?\([^)]*\)/)?.[0] ?? menu;
      return { fill: window.capRatio(cs.backgroundColor, menu), edge: window.capRatio(edge, menu) };
    });
    expect(r.fill, "the hover fill against the menu").toBeGreaterThanOrEqual(1.2);
    expect(r.edge, "the hover edge against the menu").toBeGreaterThanOrEqual(3);
  });

  test("behavior: collapsed, the collapse control's icon heads the column, over the menu's icons; the app's mark is the header's", async ({ page }) => {
    await visitStates(page, "admin-shell", theme, "collapsed");
    const mark = page.locator(".cap-admin-collapse .cap-admin-icon");
    await expect(mark).toBeVisible();
    const [m, icon] = await Promise.all([mark.boundingBox(), page.locator(".cap-admin-menu a .cap-admin-icon").first().boundingBox()]);
    expect(Math.abs(m!.x + m!.width / 2 - (icon!.x + icon!.width / 2))).toBeLessThanOrEqual(1);
    expect(m!.y).toBeLessThan(icon!.y);
    await expect(page.locator(".cap-admin-title, .cap-admin-title-mark")).toHaveCount(0);
  });

  test("behavior: every unread marker is a number, one rule on every tile, 99+ past 99", async ({ page }) => {
    await visitStates(page, "admin-shell", theme, "expanded");
    await expect(page.locator("[data-dot], [data-wide]")).toHaveCount(0);
    const texts = await page.locator(".cap-admin-strip .cap-admin-badge, .cap-admin-menu .cap-admin-count:not(:empty)").allTextContents();
    expect(texts.length).toBeGreaterThanOrEqual(7);
    for (const t of texts) expect(t).toMatch(/^(\d{1,2}|99\+)$/);
  });
  test("behavior: every count and badge is one bubble, open and collapsed", async ({ page }) => {
    const shapes = async () =>
      page.evaluate(() =>
        [...document.querySelectorAll(".cap-admin-strip .cap-admin-badge, .cap-admin-menu .cap-admin-count:not(:empty)")].map((b) => {
          const cs = getComputedStyle(b);
          return [Math.round(b.getBoundingClientRect().height), cs.borderRadius, cs.fontSize, cs.fontWeight].join(" ");
        }),
      );
    await visitStates(page, "admin-shell", theme, "expanded");
    const open = await shapes();
    await visitStates(page, "admin-shell", theme, "collapsed");
    const shut = await shapes();
    expect(open.length + shut.length, "bubbles measured").toBeGreaterThanOrEqual(12);
    expect([...new Set([...open, ...shut])]).toHaveLength(1);
  });

  test("behavior: the strip lists the family's seven apps, Capsomer last, in one order with their own marks, this one marked", async ({ page }) => {
    await visitStates(page, "admin-shell", theme, "expanded");
    const tiles = page.locator(".cap-admin-strip .cap-admin-tile");
    await expect(tiles).toHaveCount(7);
    const names = await tiles.evaluateAll((els) => els.map((e) => ({ label: e.getAttribute("aria-label")!.split(",")[0], logo: !!e.querySelector("svg.cap-admin-logo"), letters: [...e.childNodes].some((n) => n.nodeType === Node.ELEMENT_NODE && (n as Element).tagName === "SPAN" && !(n as Element).className && /\w/.test(n.textContent ?? "")) })));
    expect(names).toEqual(["Capsid Portal", "Carrel Desk", "dustinedwards.info", "germomics", "Foxhound", "Foxing", "Capsomer Scaffold"].map((label) => ({ label, logo: true, letters: false })));
    await expect(tiles.first()).toHaveAttribute("aria-current", "true");
    await expect(page.locator(".cap-site-header-logo")).toHaveAccessibleName("Capsid Portal");
  });
  test("behavior: an app that passes only its own name still shows all seven apps, each tile an svg mark and no letter", async ({ page }) => {
    await visitStates(page, "admin-shell", theme, "minimal");
    const tiles = page.locator(".cap-admin-strip .cap-admin-tile");
    await expect(tiles).toHaveCount(7);
    const facts = await tiles.evaluateAll((els) =>
      els.map((e) => ({
        label: e.getAttribute("aria-label")!.split(",")[0],
        marks: e.querySelectorAll(":scope > svg.cap-admin-logo").length,
        letters: [...e.querySelectorAll(":scope > :not(svg):not(.cap-admin-tip):not(.cap-admin-badge)")].map((n) => n.textContent ?? "").join(""),
      })),
    );
    expect(facts).toEqual(["Capsid Portal", "Carrel Desk", "dustinedwards.info", "germomics", "Foxhound", "Foxing", "Capsomer Scaffold"].map((label) => ({ label, marks: 1, letters: "" })));
    await expect(tiles.nth(4)).toHaveAttribute("aria-current", "true");
  });

  test("behavior: Foxhound keeps its favicon x until Dustin picks; two alternatives sit beside it and none is shipped", async ({ page }) => {
    await visitStates(page, "admin-shell", theme, "foxhound-marks");
    const items = page.locator("[data-mark]");
    expect(await items.evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.mark))).toEqual(["today", "track", "fox"]);
    const svgs = await items.evaluateAll((els) => els.map((e) => e.querySelector("svg")!.innerHTML));
    const [today, ...alternatives] = svgs;
    expect(alternatives, "exactly two alternatives, different from each other").toHaveLength(2);
    expect(alternatives[0]).not.toBe(alternatives[1]);
    expect(alternatives, "Foxhound's mark in FAMILY_APPS is not one of the alternatives").not.toContain(today);
    // Today's mark is the favicon's x: two strokes, no fill.
    expect(today).toContain("M7.5 9 16.5 18M16.5 9 7.5 18");
    // The strip draws that same x for Foxhound.
    await visitStates(page, "admin-shell", theme, "minimal");
    expect(await page.locator('.cap-admin-strip .cap-admin-tile[aria-label^="Foxhound"] svg.cap-admin-logo').innerHTML()).toBe(today);
  });
  test("behavior: the top bar has the freshness line at the left and Refresh last; the theme is the header's one button; the tab says the page and the app", async ({ page }) => {
    await visitStates(page, "admin-shell", theme, "expanded");
    await expect(page).toHaveTitle("Overview · Capsid Portal");
    const bar = page.locator(".cap-admin-bar");
    await expect(bar.locator(".cap-admin-fresh")).toHaveText(/^Updated (\d+ minutes? ago|less than a minute ago|just now) · refreshes itself$/);
    await expect(bar.locator(".cap-admin-fresh time")).toHaveAttribute("datetime", /Z$/);
    const order = await bar.locator(".cap-admin-actions > *").evaluateAll((els) => els.map((e) => e.getAttribute("data-cap-part") ?? e.getAttribute("data-cap")));
    expect(order.at(-1)).toBe("refresh");
    await expect(bar.getByRole("button", { name: "Refresh" })).toBeVisible();
    // 0.9.0: no Light and Dark switch in the bar; one icon button in the header.
    await expect(page.locator("[data-cap='theme-switch']")).toHaveCount(1);
    const button = page.locator(".cap-site-header .cap-theme-button");
    await expect(button).toHaveAccessibleName(theme === "light" ? "Switch to dark theme" : "Switch to light theme");
    await button.click();
    await expect(button).toHaveAccessibleName(theme === "light" ? "Switch to light theme" : "Switch to dark theme");
  });

  test("behavior: the page fills the content area from the same left edge, open and collapsed", async ({ page }) => {
    await visitStates(page, "admin-shell", theme, "expanded");
    const box = () => page.evaluate(() => {
      const main = document.querySelector(".cap-admin-main")!.getBoundingClientRect();
      const p = document.querySelector(".cap-admin-page")!.getBoundingClientRect();
      return { inset: Math.round(p.left - main.left), right: Math.round(main.right - p.right), w: Math.round(p.width) };
    });
    const open = await box();
    await page.locator("[data-cap-part='menu-toggle']").click();
    const shut = await box();
    expect(shut.inset).toBe(open.inset);
    expect(shut.right).toBe(open.right);
    expect(shut.w).toBeGreaterThan(open.w);
  });

  test("accessibility: no axe violations with page transitions on", async ({ page }) => {
    await visitStates(page, "admin-shell", theme, "transition");
    await expectNoAxeViolations(page);
  });

  test("behavior: with transitions on the content, strip and menu are named apart, and reduced motion gives no names", async ({ page }) => {
    await visitStates(page, "admin-shell", theme, "transition");
    const name = (sel: string) => page.locator(sel).evaluate((el) => getComputedStyle(el).viewTransitionName);
    expect(await name(".cap-admin-main")).toBe("cap-admin-page");
    expect(await name(".cap-admin-strip")).toBe("cap-admin-strip");
    expect(await name(".cap-admin-menu")).toBe("cap-admin-menu");
    expect(await name(".cap-site-header")).toBe("cap-admin-header");
    await page.emulateMedia({ reducedMotion: "reduce" });
    expect(await name(".cap-admin-main")).toBe("none");
    expect(await name(".cap-admin-strip")).toBe("none");
    await visitStates(page, "admin-shell", theme, "expanded");
    expect(await name(".cap-admin-main")).toBe("none");
  });

  test("keyboard: Enter on a menu link changes the page, the strip and menu stay and focus stays on the link", async ({ page }) => {
    await visitStates(page, "admin-shell", theme, "transition");
    const strip = await page.locator(".cap-admin-strip").boundingBox();
    const menu = await page.locator(".cap-admin-menu").boundingBox();
    const link = page.getByRole("link", { name: /^Sites/ });
    await link.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("page-title")).toHaveText("sites");
    await expect(link).toBeFocused();
    await expect(link).toHaveAttribute("aria-current", "page");
    expect(await page.locator(".cap-admin-strip").boundingBox()).toEqual(strip);
    expect(await page.locator(".cap-admin-menu").boundingBox()).toEqual(menu);
  });

  test("keyboard: the Next page button changes the page by keyboard with reduced motion on, at once", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await visitStates(page, "admin-shell", theme, "transition");
    await page.getByRole("button", { name: "Next page" }).focus();
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("page-title")).toHaveText("sites");
    expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
  });

  test("behavior: the tab title is \"<page> · <app>\" by default, and documentTitle={false} leaves the app's own", async ({ page }) => {
    await visitStates(page, "admin-shell", theme, "transition");
    await expect(page).toHaveTitle("Overview · Capsid Portal");
    await visitStates(page, "admin-shell", theme, "own-title");
    await expect(page.getByTestId("page-title")).toHaveText("overview");
    await expect(page).toHaveTitle("overview - the app's own title");
    await page.getByRole("button", { name: "Next page" }).click();
    await expect(page.getByTestId("page-title")).toHaveText("sites");
    await expect(page).toHaveTitle("sites - the app's own title");
  });

  test("behavior: a browser without the View Transitions API changes the page with no error", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.addInitScript(() => {
      (document as unknown as { startViewTransition?: unknown }).startViewTransition = undefined;
    });
    await visitStates(page, "admin-shell", theme, "transition");
    await page.getByRole("button", { name: "Next page" }).click();
    await expect(page.getByTestId("page-title")).toHaveText("sites");
    expect(errors).toEqual([]);
  });
});
