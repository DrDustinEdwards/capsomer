import { expect, test, type Page } from "@playwright/test";
import { eachTheme, expectContrast, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

const PHONE = { width: 390, height: 760 };

// Where each named control sits, left to right, in the header's one row.
const rowOrder = (page: Page) =>
  page.locator(".cap-site-header").evaluate((h) =>
    [...h.querySelectorAll<HTMLElement>(":scope > a:not(.cap-site-header-skip), .cap-site-header-switch, .cap-site-header-sections :is(a, button), .cap-site-header-tools :is(a, button):not(.cap-site-header-panel *)")]
      .filter((el) => el.getBoundingClientRect().width > 0 && getComputedStyle(el).visibility !== "hidden")
      .map((el) => ({ name: el.getAttribute("aria-label") ?? el.textContent!.trim(), x: Math.round(el.getBoundingClientRect().left) })),
  );

// Lets any color transition finish before a color is read.
const settle = (page: Page) => page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished.catch(() => undefined))).then(() => undefined));

eachTheme((theme) => {
  // The theme button says what it does: the other theme.
  const themeName = theme === "light" ? "Switch to dark theme" : "Switch to light theme";
  const otherName = theme === "light" ? "Switch to light theme" : "Switch to dark theme";

  test("accessibility: no axe violations on every surface, desktop", async ({ page }) => {
    for (const only of ["fh-public", "fh-dashboard", "fh-admin", "fx-public", "fx-reader", "fx-admin", "markup"]) {
      await visitStates(page, "site-header", theme, only);
      await expectNoAxeViolations(page);
    }
  });

  test("accessibility: no axe violations with a panel open: the switcher, a section, the account, the site's own panel", async ({ page }) => {
    for (const only of ["fh-dashboard-switcher", "fh-dashboard-account", "fx-books", "fx-reader-account"]) {
      await visitStates(page, "site-header", theme, only);
      await expect(page.locator(".cap-site-header-panel:popover-open")).toHaveCount(1);
      await expectNoAxeViolations(page);
    }
  });

  test("accessibility: the header is the banner, in the fixed order: logo, section links, extras, theme, Sign in last", async ({ page }) => {
    await visitStates(page, "site-header", theme, "fh-public");
    await expect(page.locator(".cap-site-header")).toMatchAriaSnapshot(`
      - banner:
        - link "Skip to content"
        - link "Foxhound"
        - navigation "Site":
          - list:
            - listitem:
              - link "Products"
            - listitem:
              - link "Pricing"
            - listitem:
              - link "Demos"
            - listitem:
              - link "Features"
            - listitem:
              - link "Docs"
            - listitem:
              - link "Blog"
        - link "Free audit"
        - button "${themeName}"
        - link "Sign in"
    `);
    await expect(page.getByRole("link", { name: "Pricing" })).toHaveAttribute("aria-current", "page");
    const row = await rowOrder(page);
    expect(row.map((r) => r.name)).toEqual(["Foxhound", "Products", "Pricing", "Demos", "Features", "Docs", "Blog", "Free audit", themeName, "Sign in"]);
    expect(row.map((r) => r.x)).toEqual([...row.map((r) => r.x)].sort((a, b) => a - b));
  });

  test("accessibility: signed in, the extras then the theme, and the avatar last", async ({ page }) => {
    await visitStates(page, "site-header", theme, "fx-reader");
    await expect(page.locator(".cap-site-header")).toMatchAriaSnapshot(`
      - banner:
        - link "Skip to content"
        - link "Foxing"
        - navigation "Site":
          - list:
            - listitem:
              - button "Books"
            - listitem:
              - button "Celebrity Picks"
            - listitem:
              - link "Clubs"
            - listitem:
              - link "People"
            - listitem:
              - link "Journal"
        - button "Search"
        - link "Notifications, 3 new"
        - button "${themeName}"
        - button "Your account"
    `);
    const row = await rowOrder(page);
    expect(row.at(-1)?.name).toBe("Your account");
    expect(row.map((r) => r.x)).toEqual([...row.map((r) => r.x)].sort((a, b) => a - b));
    await expect(page.getByRole("link", { name: "Notifications, 3 new" }).locator(".cap-site-header-badge")).toHaveText("3");
  });

  test("accessibility: a dashboard puts the business tile and the product switcher after the logo, with no section links", async ({ page }) => {
    await visitStates(page, "site-header", theme, "fh-dashboard");
    const row = await rowOrder(page);
    expect(row.map((r) => r.name)).toEqual(["Foxhound", "Business: Acme Supply Co.", "Product: Recovery", themeName, "Your account"]);
    await expect(page.locator(".cap-site-header-sections")).toHaveCount(0);
    await expect(page.locator(".cap-site-header-switch-tile")).toHaveAttribute("data-tile", "A");
  });

  test("behavior: sticky: the header stays at the top while the page scrolls, and scroll padding keeps a focused target out from under it", async ({ page }) => {
    await visitStates(page, "site-header", theme, "fx-reader");
    await page.mouse.wheel(0, 600);
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(300);
    const h = await page.locator(".cap-site-header").boundingBox();
    expect(h!.y).toBe(0);
    expect(await page.locator(".cap-site-header").evaluate((el) => getComputedStyle(el).position)).toBe("sticky");
    // The header's height and a little room, so a focused control is clear of its edge.
    expect(parseFloat(await page.evaluate(() => getComputedStyle(document.documentElement).scrollPaddingTop))).toBeGreaterThanOrEqual(56);
  });

  test("behavior: the letterhead stays whole at the top as the page scrolls; a short window lets it scroll away", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await visitStates(page, "site-header", theme, "lh-public");
    const header = page.locator(".cap-site-header[data-variant='letterhead']");
    await header.evaluate((h) => h.after(Object.assign(document.createElement("div"), { style: "block-size: 3000px" })));
    await page.mouse.wheel(0, 600);
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(300);
    expect((await header.boundingBox())!.y).toBe(0);
    await page.setViewportSize({ width: 1440, height: 400 });
    expect((await header.boundingBox())!.y).toBeLessThan(0);
  });

  test("behavior: links on the right sit after a thin divider before the tools; centered links sit in the middle of the band", async ({ page }) => {
    await visitStates(page, "site-header", theme, "fh-public");
    const right = await page.evaluate(() => {
      const nav = document.querySelector(".cap-site-header-sections")!.getBoundingClientRect();
      const tools = document.querySelector(".cap-site-header-tools")!;
      const line = getComputedStyle(tools, "::before");
      return { navRight: nav.right, toolsLeft: tools.getBoundingClientRect().left, logoRight: document.querySelector(".cap-site-header-logo")!.getBoundingClientRect().right, navLeft: nav.left, w: line.width, h: line.height };
    });
    expect(right.navRight).toBeLessThanOrEqual(right.toolsLeft);
    expect(right.navLeft - right.logoRight, "the links are pushed right").toBeGreaterThan(300);
    expect(right.w).toBe("1px");
    expect(right.h).toBe("16px");
    await visitStates(page, "site-header", theme, "fx-public");
    const center = await page.evaluate(() => {
      const nav = document.querySelector(".cap-site-header-sections")!.getBoundingClientRect();
      return Math.abs(nav.left + nav.width / 2 - innerWidth / 2);
    });
    expect(center).toBeLessThanOrEqual(1);
  });

  test("behavior: a section panel opens on hover at once, under the header, lined up with its button, and closes when the pointer leaves", async ({ page }) => {
    await visitStates(page, "site-header", theme, "fx-public");
    const books = page.getByRole("button", { name: "Books" });
    const panel = page.locator("#" + (await books.getAttribute("aria-controls")));
    await expect(panel).toBeHidden();
    await books.hover();
    await expect(panel).toBeVisible({ timeout: 100 });
    await expect(books).toHaveAttribute("aria-expanded", "true");
    const [b, p, h] = await Promise.all([books.boundingBox(), panel.boundingBox(), page.locator(".cap-site-header").boundingBox()]);
    expect(p!.y, "the panel starts under the header").toBeGreaterThanOrEqual(h!.y + h!.height - 1);
    expect(Math.abs(p!.x - b!.x), "the panel lines up with its button's left edge").toBeLessThanOrEqual(1);
    await page.mouse.move(640, 600);
    await expect(panel).toBeHidden();
    await expect(books).toHaveAttribute("aria-expanded", "false");
  });

  test("keyboard: Enter opens a panel and focuses its first item; Up, Down, Home and End move; Esc closes and returns focus", async ({ page }) => {
    await visitStates(page, "site-header", theme, "fx-public");
    const books = page.getByRole("button", { name: "Books" });
    const panel = page.locator("#" + (await books.getAttribute("aria-controls")));
    await books.focus();
    await page.keyboard.press("Enter");
    await expect(panel).toBeVisible();
    const items = panel.locator("a, button");
    const n = await items.count();
    expect(n).toBeGreaterThanOrEqual(4);
    await expect(items.first()).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(items.nth(1)).toBeFocused();
    await page.keyboard.press("End");
    await expect(items.last()).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(items.first(), "Down wraps to the first item").toBeFocused();
    await page.keyboard.press("ArrowUp");
    await expect(items.last(), "Up wraps to the last item").toBeFocused();
    await page.keyboard.press("Home");
    await expect(items.first()).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(panel).toBeHidden();
    await expect(books).toBeFocused();
    await expect(books).toHaveAttribute("aria-expanded", "false");
    // Space opens it too.
    await page.keyboard.press("Space");
    await expect(panel).toBeVisible();
    await page.keyboard.press("Escape");
  });

  test("keyboard: Tab past a panel's last item closes it and goes on to the next control", async ({ page }) => {
    await visitStates(page, "site-header", theme, "fx-public");
    const books = page.getByRole("button", { name: "Books" });
    const panel = page.locator("#" + (await books.getAttribute("aria-controls")));
    await books.focus();
    await page.keyboard.press("Enter");
    await page.keyboard.press("End");
    await page.keyboard.press("Tab");
    await expect(panel).toBeHidden();
    await expect(page.getByRole("button", { name: "Celebrity Picks" })).toBeFocused();
  });

  test("keyboard: the switcher and the account are disclosure buttons that open lists of links, not menus", async ({ page }) => {
    await visitStates(page, "site-header", theme, "fh-dashboard");
    for (const name of ["Business: Acme Supply Co.", "Your account"]) {
      const trigger = page.getByRole("button", { name });
      await expect(trigger).toHaveAttribute("aria-expanded", "false");
      const id = await trigger.getAttribute("aria-controls");
      expect(id).toBeTruthy();
      await trigger.focus();
      await page.keyboard.press("Enter");
      const panel = page.locator(`#${id}`);
      await expect(panel).toBeVisible();
      await expect(panel).toHaveAttribute("role", "group");
      await expect(page.locator("[role='menu'], [role='menuitem']")).toHaveCount(0);
      await page.keyboard.press("Escape");
      await expect(trigger).toBeFocused();
    }
    // The account panel ends with Sign out, and sits at the window's right edge.
    await page.getByRole("button", { name: "Your account" }).click();
    const panel = page.locator(".cap-site-header-account .cap-site-header-panel");
    await expect(panel.locator("a, button").last()).toHaveText(/^Sign out/);
    const p = await panel.boundingBox();
    expect(p!.x + p!.width).toBeLessThanOrEqual(1280 - 16);
  });

  test("behavior: a click outside an open panel closes it", async ({ page }) => {
    await visitStates(page, "site-header", theme, "fh-dashboard");
    const trigger = page.getByRole("button", { name: "Product: Recovery" });
    await trigger.click();
    const panel = page.locator("#" + (await trigger.getAttribute("aria-controls")));
    await expect(panel).toBeVisible();
    await page.mouse.click(900, 500);
    await expect(panel).toBeHidden();
  });

  test("keyboard: the theme button names what it does, switches the theme, and shows its name on focus", async ({ page }) => {
    await visitStates(page, "site-header", theme, "fh-public");
    const button = page.locator(".cap-site-header .cap-theme-button");
    await expect(button).toHaveAccessibleName(themeName);
    await button.focus();
    const tip = button.locator(".cap-theme-tip");
    await expect(tip).toBeVisible();
    await expect(tip).toContainText(themeName);
    expect(await button.getAttribute("aria-describedby")).toBeNull();
    await page.keyboard.press("Enter");
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme === "light" ? "dark" : "light");
    await expect(button).toHaveAccessibleName(otherName);
    // Light and Dark only: there is no System choice in the header.
    await expect(page.locator(".cap-site-header input[type='radio']")).toHaveCount(0);
  });

  test("keyboard: where the site binds single keys, T switches the theme, and not while typing", async ({ page }) => {
    await visitStates(page, "site-header", theme, "fx-public");
    await page.locator("body").click({ position: { x: 600, y: 500 } });
    await page.keyboard.press("t");
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme === "light" ? "dark" : "light");
    await expect(page.getByRole("button", { name: otherName })).toBeVisible();
  });

  test("accessibility: links, the current link, the button extra, the theme and Sign in reach their contrast on the dark band and the translucent band", async ({ page }) => {
    for (const only of ["fh-public", "fx-public"]) {
      await visitStates(page, "site-header", theme, only);
      await settle(page);
      await expectContrast(page, [
        { sel: ".cap-site-header-link:not([aria-current])", what: `${only}: a section link` },
        { sel: ".cap-site-header-link:is([aria-current], [data-current])", what: `${only}: the current link` },
        { sel: ".cap-site-header-cta", what: `${only}: the button extra` },
        { sel: ".cap-site-header-theme", what: `${only}: the theme button` },
        { sel: ".cap-site-header-signin", what: `${only}: Sign in` },
      ]);
    }
    await visitStates(page, "site-header", theme, "fx-reader");
    await settle(page);
    await expectContrast(page, [
      { sel: ".cap-site-header-extras .cap-site-header-icon", what: "an icon extra" },
      { sel: ".cap-site-header-badge", what: "a count's bubble" },
      { sel: ".cap-site-header-initials", what: "the avatar's initials" },
    ]);
  });

  test("accessibility: the current link's underline is 2px in the accent and stands at 3:1 against the band", async ({ page }) => {
    for (const only of ["fh-public", "fx-public"]) {
      await visitStates(page, "site-header", theme, only);
      await settle(page);
      const got = await page.locator(".cap-site-header-link:is([aria-current], [data-current])").evaluate((el) => {
        const line = getComputedStyle(el, "::after");
        const band = getComputedStyle(el.closest(".cap-site-header")!).backgroundColor;
        return { h: line.height, ratio: window.capRatio(line.backgroundColor, band.replace(/,\s*0?\.\d+\)$/, ")")), weight: getComputedStyle(el).fontWeight };
      });
      expect(got.h, only).toBe("2px");
      expect(got.weight, only).toBe("500");
      expect(got.ratio, `${only}: the underline against the band`).toBeGreaterThanOrEqual(3);
    }
  });

  test("behavior: the dark band stays dark in both themes; the translucent band is see-through and blurred", async ({ page }) => {
    await visitStates(page, "site-header", theme, "fh-public");
    const lum = await page.locator(".cap-site-header").evaluate((el) => {
      const x = document.createElement("canvas").getContext("2d")!;
      x.fillStyle = getComputedStyle(el).backgroundColor;
      x.fillRect(0, 0, 1, 1);
      const [r, g, b] = x.getImageData(0, 0, 1, 1).data;
      return (r! + g! + b!) / 3;
    });
    expect(lum).toBeLessThan(60);
    await visitStates(page, "site-header", theme, "fx-public");
    const t = await page.locator(".cap-site-header").evaluate((el) => ({ bg: getComputedStyle(el).backgroundColor, blur: getComputedStyle(el).backdropFilter }));
    expect(t.bg).toMatch(/^(rgba|color)\(.*(0\.85|\/ 0\.85)/);
    expect(t.blur).toContain("blur");
  });

  test("accessibility: at phone width, one 56px row: the logo, up to two site icons, the theme, Sign in or the avatar, the menu button last; no second row", async ({ page }) => {
    await page.setViewportSize(PHONE);
    await visitStates(page, "site-header", theme, "fh-public-phone");
    await expectNoAxeViolations(page);
    expect((await page.locator(".cap-site-header").boundingBox())!.height).toBe(56);
    expect((await page.locator(".cap-site-header-logo").boundingBox())!.x).toBe(16);
    await expect(page.locator(".cap-site-header-sections")).toBeHidden();
    await expect(page.locator(".cap-site-header-cta")).toBeHidden();
    let row = await rowOrder(page);
    expect(row.map((r) => r.name)).toEqual(["Foxhound", themeName, "Sign in", "Menu"]);
    // Links on the right hide on a phone; the menu button still ends the row 16px from the edge.
    const menu = (await page.locator(".cap-site-header-menu").boundingBox())!;
    expect(Math.round(menu.x + menu.width)).toBe(PHONE.width - 16);
    await visitStates(page, "site-header", theme, "fx-reader-phone");
    row = await rowOrder(page);
    expect(row.map((r) => r.name)).toEqual(["Foxing", "Search", "Notifications, 3 new", themeName, "Your account", "Menu"]);
    expect(row.map((r) => r.x)).toEqual([...row.map((r) => r.x)].sort((a, b) => a - b));
    // Every control is in the one row, inside the window.
    const boxes = await page.locator(".cap-site-header-tools > *:visible").evaluateAll((els) => els.map((e) => e.getBoundingClientRect()).map((r) => ({ top: r.top, bottom: r.bottom, right: r.right })));
    for (const b of boxes) {
      expect(b.top).toBeGreaterThanOrEqual(0);
      expect(b.bottom).toBeLessThanOrEqual(56);
      expect(b.right).toBeLessThanOrEqual(390);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  });

  test("keyboard: the menu button opens one sheet from the bottom, focus on its heading, Sign in pinned under the list; Esc returns focus", async ({ page }) => {
    await page.setViewportSize(PHONE);
    await visitStates(page, "site-header", theme, "fx-public-phone");
    const menu = page.getByRole("button", { name: "Menu" });
    await expect(menu).toHaveAttribute("aria-haspopup", "dialog");
    await menu.focus();
    await page.keyboard.press("Enter");
    const sheet = page.getByRole("dialog", { name: "Foxing menu" });
    await expect(sheet).toBeVisible();
    await expect(sheet).toHaveAttribute("data-placement", "bottom");
    await expect(menu).toHaveAttribute("aria-expanded", "true");
    await expect(sheet.locator(".cap-site-header-sheet-title")).toBeFocused();
    await expect(sheet.locator(".cap-site-header-sheet-label")).toHaveText(["Books", "Celebrity Picks", "More"]);
    await expect(sheet.getByRole("link", { name: "Join free" })).toBeVisible();
    await expect(sheet.getByRole("navigation", { name: "Account" }).getByRole("link", { name: "Sign in" })).toBeVisible();
    await expectNoAxeViolations(page);
    await page.keyboard.press("Escape");
    await expect(sheet).toBeHidden();
    await expect(menu).toBeFocused();
    await expect(menu).toHaveAttribute("aria-expanded", "false");
  });

  test("accessibility: the dashboard's sheet lists the switchers and every page, with Sign out pinned and in view", async ({ page }) => {
    await page.setViewportSize(PHONE);
    await visitStates(page, "site-header", theme, "fh-sheet");
    const sheet = page.getByRole("dialog", { name: "Foxhound menu" });
    await expect(sheet).toBeVisible();
    await expect(sheet.locator(".cap-site-header-sheet-label").first()).toHaveText("Businesses");
    await expect(sheet.getByRole("link", { name: "Northwind Goods" })).toBeAttached();
    await expect(sheet.getByRole("link", { name: "Expiring cards, 23" })).toBeAttached();
    const signOut = sheet.getByRole("navigation", { name: "Account" }).getByRole("button", { name: "Sign out (Sam Rivera)" });
    await expect(signOut).toBeVisible();
    await page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished.catch(() => undefined))).then(() => undefined));
    const box = await signOut.boundingBox();
    expect(box!.y + box!.height).toBeLessThanOrEqual(PHONE.height);
    await expectNoAxeViolations(page);
    await expectContrast(page, [
      { sel: ".cap-site-header-sheet-list a:not([aria-current]) .cap-site-header-sheet-name", what: "a row in the sheet" },
      { sel: ".cap-site-header-sheet-label", what: "a group label in the sheet" },
    ]);
  });

  test("behavior: the bottom bar shows only on a phone, where a person is signed in: up to five tabs and no More", async ({ page }) => {
    await page.setViewportSize(PHONE);
    await visitStates(page, "site-header", theme, "fx-reader-phone");
    const tabs = page.locator(".cap-site-tabs");
    await expect(tabs).toBeVisible();
    await expect(tabs).toMatchAriaSnapshot(`
      - navigation "Your reading":
        - link "Home"
        - link "Library"
        - link "Diary"
        - link "Feed"
        - link "People"
    `);
    await expect(tabs.locator("button")).toHaveCount(0);
    await expect(tabs.locator("a[aria-current='page']")).toHaveText("Home");
    const t = await tabs.boundingBox();
    expect(t!.y + t!.height).toBe(PHONE.height);
    await expectContrast(page, [
      { sel: ".cap-site-tabs a[aria-current='page']", what: "the current tab" },
      { sel: ".cap-site-tabs a:not([aria-current])", what: "another tab" },
    ]);
    await visitStates(page, "site-header", theme, "fx-public-phone");
    await expect(page.locator(".cap-site-tabs")).toHaveCount(0);
    await page.setViewportSize({ width: 1280, height: 800 });
    await visitStates(page, "site-header", theme, "fx-reader");
    await expect(page.locator(".cap-site-tabs")).toBeHidden();
  });

  test("behavior: the hand-written header works through the behavior module: its panel, the theme button and the sheet", async ({ page }) => {
    await visitStates(page, "site-header", theme, "markup");
    const products = page.getByRole("button", { name: "Products" });
    await products.focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("#markup-products")).toBeVisible();
    await expect(page.locator("#markup-products a").first()).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(products).toBeFocused();
    const button = page.locator(".cap-site-header .cap-theme-button");
    await expect(button).toHaveAccessibleName(themeName);
    await button.click();
    await expect(button).toHaveAccessibleName(otherName);
    await page.setViewportSize(PHONE);
    const menu = page.getByRole("button", { name: "Menu" });
    await menu.click();
    await expect(page.getByRole("dialog", { name: "Foxhound menu" })).toBeVisible();
    await expect(page.locator("#markup-sheet-title")).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(menu).toBeFocused();
  });
});
