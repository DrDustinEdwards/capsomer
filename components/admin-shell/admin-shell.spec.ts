import { expect, test } from "@playwright/test";
import {
  eachTheme,
  expectContrast,
  expectNoAxeViolations,
  visitStates,
} from "../../test/helpers.ts";

eachTheme((theme) => {
  // The theme button says what it does: the other theme.
  const themeName = theme === "light" ? "Switch to dark theme" : "Switch to light theme";
  test("accessibility: no axe violations, expanded", async ({ page }) => {
    await visitStates(page, "admin-shell", theme, "expanded");
    await expectNoAxeViolations(page);
  });

  test("accessibility: no axe violations, collapsed, with a name shown, with the account panel open, as a reader", async ({
    page,
  }) => {
    for (const only of ["collapsed", "tip", "account", "reader", "comfortable"]) {
      await visitStates(page, "admin-shell", theme, only);
      // The tile whose tip is open: axe-core 4.14 reads the open tip's words and key caps as the
      // tile's visible label, but a tip describes its trigger (role tooltip), it does not label
      // it. The tile is scanned closed in every other state.
      // The tip opens after the specimen mounts, so wait for it: marking it before it opens
      // left it unexcluded about one run in twenty.
      if (only === "tip") {
        await page.locator(".cap-admin-tip:popover-open").waitFor();
        await page.evaluate(() =>
          document
            .querySelector(".cap-admin-tip:popover-open")
            ?.closest(".cap-admin-tile")
            ?.setAttribute("data-tip-open", ""),
        );
      }
      await expectNoAxeViolations(
        page,
        undefined,
        only === "tip" ? { exclude: "[data-tip-open]" } : {},
      );
    }
  });

  test(
    "accessibility: the strip's and the menu's roles and names",
    { tag: "@markup" },
    async ({ page }) => {
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
      // Tiles and badges only: search, inbox and help are in the header.
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
    },
  );

  test("accessibility: the app you are in is told by more than color and shows no badge", async ({
    page,
  }) => {
    await visitStates(page, "admin-shell", theme, "expanded");
    const current = page.locator(".cap-admin-tile[aria-current='true']");
    await expect(current).toHaveCount(1);
    await expect(current.locator(".cap-admin-badge")).toHaveCount(0);
    // Another app's badge is there, and the current page in the menu is the dark pill.
    await expect(
      page
        .getByRole("link", { name: "Carrel Desk, 2 AI drafts waiting" })
        .locator(".cap-admin-badge"),
    ).toHaveText("2");
    await expect(page.locator(".cap-admin-menu a[aria-current='page']")).toHaveCSS(
      "font-weight",
      "600",
    );
  });

  test("accessibility: menu text, counts, the dark pill and badges reach their contrast", async ({
    page,
  }) => {
    await visitStates(page, "admin-shell", theme, "expanded");
    await expectContrast(page, [
      {
        sel: ".cap-admin-menu a:not([aria-current]) > span:nth-child(2)",
        what: "an inactive menu entry",
      },
      { sel: ".cap-admin-menu a[aria-current='page']", what: "the current page on its dark pill" },
      { sel: ".cap-admin-count[data-tone='need']", what: "a needs-you pill" },
      { sel: ".cap-admin-count:not([data-tone])", what: "a plain count" },
      { sel: ".cap-admin-group-label", what: "a group label" },
      { sel: ".cap-admin-tile[aria-current='true']", what: "the current app's tile" },
      { sel: ".cap-admin-badge:not([data-dot])", what: "a strip badge" },
      { sel: ".cap-admin-bar", what: "the page's status line" },
    ]);
  });

  test("keyboard: Tab goes header, then strip, then menu, then content, and the skip link comes first", async ({
    page,
  }) => {
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
      names.push(
        await page.evaluate(
          () =>
            document.activeElement?.getAttribute("aria-label") ??
            document.activeElement?.textContent?.trim() ??
            "",
        ),
      );
    }
    expect(names.slice(0, 5)).toEqual([
      "Capsid Portal",
      "Search everything",
      "Inbox, 7 need you",
      themeName,
      "Your account",
    ]);
    expect(names.slice(5, 12).map((n) => n.split(",")[0])).toEqual([
      "Capsid Portal",
      "Carrel Desk",
      "dustinedwards.info",
      "germomics",
      "Foxhound",
      "Foxing",
      "Capsomer Scaffold",
    ]);
    await expect(page.locator("[data-cap-part='menu-toggle']")).toBeFocused();
    await expect(page.locator(".cap-admin-collapse:focus-visible")).toHaveCount(1);
    const order = await page.evaluate(() => {
      const pos = (sel: string) => {
        const el = document.querySelector(sel);
        return el ? [...document.querySelectorAll("*")].indexOf(el) : -1;
      };
      return [
        pos(".cap-site-header"),
        pos(".cap-admin-strip"),
        pos(".cap-admin-menu"),
        pos(".cap-admin-main"),
      ];
    });
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });

  test("keyboard: the collapse control shrinks the menu to icons, nothing moves, and the choice is remembered", async ({
    page,
  }) => {
    await visitStates(page, "admin-shell", theme, "expanded");
    const toggle = page.locator("[data-cap-part='menu-toggle']");
    const menu = page.locator(".cap-admin-menu");
    const places = () =>
      page.evaluate(() =>
        [...document.querySelectorAll<HTMLElement>(".cap-admin-menu a")].map((a) => {
          const r = a.getBoundingClientRect();
          return {
            name: a.getAttribute("aria-label") ?? a.textContent?.trim(),
            y: Math.round(r.top),
            h: Math.round(r.height),
          };
        }),
      );
    const before = await places();
    const control = await toggle.boundingBox();
    await toggle.focus();
    await page.keyboard.press("Enter");
    await expect(page.locator(".cap-admin")).toHaveAttribute("data-menu", "collapsed");
    await expect(toggle).toHaveAccessibleName("Expand menu");
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(menu).toBeVisible();
    // Same order, same places, same names; only the words are hidden.
    const after = await places();
    expect(after).toEqual(before);
    for (const el of await page.locator(".cap-admin-menu a .cap-admin-label").all())
      await expect(el).toHaveCSS("clip-path", "inset(50%)");
    for (const el of await page.locator(".cap-admin-menu .cap-admin-group-label").all())
      await expect(el).toHaveCSS("color", "rgba(0, 0, 0, 0)");
    await expect(page.getByRole("link", { name: "Queue, 5 blocked" })).toBeVisible();
    // Counts stay beside the icons, the same number as open: 99+ past 99.
    const badge = page.getByRole("link", { name: "Queue, 5 blocked" }).locator(".cap-admin-count");
    await expect(badge).toBeVisible();
    await expect(badge).toHaveText("5");
    await expect(
      page.getByRole("link", { name: "Activity 99+, 120" }).locator(".cap-admin-count"),
    ).toHaveText("99+");
    // The current page keeps its dark fill; the strip's badges stay.
    await expect(page.locator(".cap-admin-menu a[aria-current='page']")).toHaveCSS(
      "background-color",
      /^(?!rgba\(0, 0, 0, 0\))/,
    );
    await expect(
      page.getByRole("link", { name: "Carrel Desk, 2 AI drafts waiting" }),
    ).toBeVisible();
    // The collapse control is in the same place in both states.
    const control2 = await toggle.boundingBox();
    expect(control2?.x).toBe(control?.x);
    expect(control2?.y).toBe(control?.y);
    // The shell binds `[` itself: it expands and collapses the menu from anywhere but a field.
    await page.locator("#cap-main").focus();
    await page.keyboard.press("[");
    await expect(page.locator(".cap-admin")).not.toHaveAttribute("data-menu", "collapsed");
    await page.keyboard.press("[");
    await expect(page.locator(".cap-admin")).toHaveAttribute("data-menu", "collapsed");
    await page.reload();
    await expect(page.locator(".cap-admin")).toHaveAttribute("data-menu", "collapsed");
    await toggle.focus();
    await page.keyboard.press("Space");
    await expect(page.locator(".cap-admin")).not.toHaveAttribute("data-menu", "collapsed");
  });

  test("keyboard: a collapsed menu icon shows its name on hover and focus, and Esc hides it", async ({
    page,
  }) => {
    await visitStates(page, "admin-shell", theme, "collapsed");
    const link = page.getByRole("link", { name: "Sites, 11" });
    const tip = link.locator(".cap-admin-tip");
    await expect(tip).toBeHidden();
    await link.hover();
    await expect(tip).toBeVisible();
    await expect(tip).toHaveText("Sites");
    await expectContrast(page, [
      {
        sel: ".cap-admin-menu .cap-admin-tip:popover-open .cap-admin-tip-text",
        what: "the shown name",
      },
    ]);
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
  test("keyboard: a strip control shows its name on focus, its keys as key caps, and Esc hides it", async ({
    page,
  }) => {
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
    for (const k of await tip.locator("kbd").all())
      expect(await k.evaluate((el) => getComputedStyle(el).borderTopStyle)).toBe("solid");
    await expectContrast(page, [
      {
        sel: ".cap-admin-tile .cap-admin-tip:popover-open .cap-admin-tip-text",
        what: "the shown name",
      },
      { sel: ".cap-admin-tile .cap-admin-tip:popover-open kbd", what: "a key cap" },
    ]);
    await page.keyboard.press("Escape");
    await expect(tip).toBeHidden();
  });
  test(
    "accessibility: the header's account menu holds this app, View site and Help, and Sign out last",
    { tag: "@markup" },
    async ({ page }) => {
      await visitStates(page, "admin-shell", theme, "expanded");
      const avatar = page.getByRole("button", { name: "Your account" });
      await expect(avatar.locator(".cap-site-header-initials")).toHaveAttribute(
        "data-initials",
        "DE",
      );
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
    },
  );

  test("behavior: G then a number jumps to that app, never the one already open, and Ctrl and a digit do nothing", async ({
    page,
  }) => {
    // The other apps are other origins: a jump is caught here, not followed.
    await page.route(/https:\/\/(portal|desk)\.dustinedwards\.info\//, (r) =>
      r.fulfill({ body: "another app" }),
    );
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

  test("behavior: a reader's area is the user variant: no strip, the 288px menu, a reading column", async ({
    page,
  }) => {
    await visitStates(page, "admin-shell", theme, "reader");
    await expect(page.locator(".cap-admin-strip")).toHaveCount(0);
    await expect(
      page.locator(".cap-admin-menu").getByRole("link", { name: "Articles" }),
    ).toHaveAttribute("aria-current", "page");
    await expect(page.locator(".cap-admin-page")).toHaveAttribute("data-measure", "reading");
  });

  test("behavior: every icon, the logo tiles and the current row keep their place when the menu opens and closes", async ({
    page,
  }) => {
    await visitStates(page, "admin-shell", theme, "expanded");
    const places = () =>
      page.evaluate(() => {
        const at = (el: Element) => {
          const r = el.getBoundingClientRect();
          return {
            x: Math.round(r.left * 2) / 2,
            y: Math.round(r.top * 2) / 2,
            w: Math.round(r.width),
            h: Math.round(r.height),
          };
        };
        const menu = [...document.querySelectorAll(".cap-admin-menu a")].map((a) =>
          at(a.querySelector(".cap-admin-icon, .cap-admin-letter")!),
        );
        const strip = [...document.querySelectorAll(".cap-admin-strip .cap-admin-tile")].map((el) =>
          at(el.querySelector(".cap-admin-logo") ?? el),
        );
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
      const opaque = cs.backgroundColor.startsWith("rgb(") && cs.opacity === "1";
      const hit = pts.every(([x, y]) => el.contains(document.elementFromPoint(x!, y!)));
      // What the tip must not cover: its own control (and the control's badge), and the controls
      // just above and below it.
      const control = el.parentElement!;
      const li = control.closest("li");
      const near = [
        control,
        control.querySelector(".cap-admin-badge, .cap-admin-count:not(:empty)"),
        li?.previousElementSibling?.querySelector("a, button"),
        li?.nextElementSibling?.querySelector("a, button"),
      ];
      const sib = control.closest(".cap-admin-menu")
        ? [control.previousElementSibling, control.nextElementSibling].filter((e) =>
            e?.matches("a"),
          )
        : [];
      const covers = [...near, ...sib]
        .filter((n): n is Element => !!n)
        .filter((n) => {
          const b = n.getBoundingClientRect();
          return (
            b.width > 0 &&
            Math.min(r.right, b.right) - Math.max(r.left, b.left) > 0 &&
            Math.min(r.bottom, b.bottom) - Math.max(r.top, b.top) > 0
          );
        })
        .map((n) => n.getAttribute("aria-label") ?? n.textContent);
      return {
        hit,
        opaque,
        inside: r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight,
        covers,
        look: [cs.backgroundColor, cs.boxShadow, cs.fontSize, cs.paddingTop, cs.borderRadius].join(
          " | ",
        ),
      };
    });

  test("behavior: a name shown beside any strip control or collapsed menu icon is opaque, whole, above every panel, tile and badge, and covers none of its neighbors", async ({
    page,
  }) => {
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
        expect(got, `${state}: the name of ${await c.getAttribute("aria-label")}`).toMatchObject({
          hit: true,
          opaque: true,
          inside: true,
          covers: [],
        });
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
      expect(got, `the collapsed name ${await tip.textContent()}`).toMatchObject({
        hit: true,
        opaque: true,
        inside: true,
        covers: [],
      });
      looks.add(got.look);
      checked++;
    }
    expect(checked, "names checked").toBeGreaterThanOrEqual(20);
    // The strip open, the strip collapsed and the menu's icons: one tooltip, one look.
    expect([...looks]).toHaveLength(1);
  });

  test("behavior: the collapse control's name shows only while collapsed, where it is opaque, whole and covers no neighbor", async ({
    page,
  }) => {
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
    expect(await tipFacts(tip), "collapsed: the name of the menu button").toMatchObject({
      hit: true,
      opaque: true,
      inside: true,
      covers: [],
    });
  });

  test("accessibility: a shown name has its own surface and a visible edge, unlike the selected menu item, in both themes", async ({
    page,
  }) => {
    await visitStates(page, "admin-shell", theme, "collapsed");
    await page.getByRole("link", { name: "Sites, 11" }).hover();
    const tip = page.locator(".cap-admin-menu .cap-admin-tip:popover-open");
    await expect(tip).toBeVisible();
    const ratios = await page.evaluate(() => {
      const tip = document.querySelector(".cap-admin-menu .cap-admin-tip:popover-open")!;
      const selected = document.querySelector(".cap-admin-menu a[aria-current='page']")!;
      const ground = getComputedStyle(
        document.querySelector(".cap-admin-main")!.closest(".cap-admin")!,
      ).backgroundColor;
      // No edge drawn reads as the surface itself: no edge.
      const edge =
        getComputedStyle(tip).boxShadow.match(/rgba?\([^)]*\)/)?.[0] ??
        getComputedStyle(tip).backgroundColor;
      return {
        tipVsSelected: window.capRatio(
          getComputedStyle(tip).backgroundColor,
          getComputedStyle(selected).backgroundColor,
        ),
        edgeVsGround: window.capRatio(edge, ground),
      };
    });
    expect(
      ratios.tipVsSelected,
      "the tip's surface against the selected item's fill",
    ).toBeGreaterThanOrEqual(3);
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
          const ring = parseFloat(
            getComputedStyle(bubble).boxShadow.match(/(\d+(?:\.\d+)?)px\s*$/)?.[1] ?? "0",
          );
          const b = bubble.getBoundingClientRect();
          const g = glyph.getBoundingClientRect();
          const w = Math.max(
            0,
            Math.min(b.right + ring, g.right) - Math.max(b.left - ring, g.left),
          );
          const h = Math.max(
            0,
            Math.min(b.bottom + ring, g.bottom) - Math.max(b.top - ring, g.top),
          );
          const menu = el.closest(".cap-admin-menu")?.getBoundingClientRect();
          return {
            name: el.getAttribute("aria-label"),
            area: Math.round(w * h),
            dx: Math.round(b.left - g.right),
            dy: Math.round(b.top + b.height / 2 - g.top),
            right: b.right + ring,
            edge: menu ? menu.right - 1 : null,
            text: bubble.textContent,
          };
        })
        .filter((x) => x !== null),
    );

  test("behavior: collapsed, every badge and count sits in one place beside its glyph, never on it, never across the menu's edge", async ({
    page,
  }) => {
    await visitStates(page, "admin-shell", theme, "collapsed");
    const all = await bubbles(page);
    expect(all.length, "bubbles measured").toBeGreaterThanOrEqual(7);
    for (const o of all)
      expect(o.area, `${o.name}: the bubble or its ring covers the glyph`).toBe(0);
    // One place relative to the glyph: the same gap to its right, the same height on its top edge.
    expect(
      [...new Set(all.map((o) => `${o.dx},${o.dy}`))],
      "bubble offsets from their glyphs",
    ).toHaveLength(1);
    for (const o of all.filter((o) => o.edge !== null))
      expect(o.right, `${o.name}: the bubble crosses into the content`).toBeLessThanOrEqual(
        o.edge!,
      );
    // 120 reads 99+ here, as it does open.
    expect(all.find((o) => o.name?.startsWith("Activity"))?.text).toBe("99+");
  });

  test("accessibility: neutral and needs-you bubbles read against their bubble and stand out from the menu, open and collapsed", async ({
    page,
  }) => {
    for (const state of ["expanded", "collapsed"]) {
      await visitStates(page, "admin-shell", theme, state);
      await expectContrast(page, [
        {
          sel: ".cap-admin-menu a:not([aria-current]) .cap-admin-count:not([data-tone]):not(:empty)",
          what: `${state}: a neutral count`,
        },
        {
          sel: ".cap-admin-menu .cap-admin-count[data-tone='need']",
          what: `${state}: a needs-you count`,
        },
        { sel: ".cap-admin-strip .cap-admin-badge", what: `${state}: a strip badge` },
      ]);
      const ratio = await page.evaluate(() => {
        const bubble = getComputedStyle(
          document.querySelector(
            ".cap-admin-menu a:not([aria-current]) .cap-admin-count:not([data-tone]):not(:empty)",
          )!,
        ).backgroundColor;
        const menu = getComputedStyle(document.querySelector(".cap-admin-menu")!).backgroundColor;
        return window.capRatio(bubble, menu);
      });
      expect(ratio, `${state}: a neutral bubble against the menu`).toBeGreaterThanOrEqual(3);
    }
  });

  test("accessibility: a hovered collapsed item is clearly marked: a fill off the page and an edge at 3:1", async ({
    page,
  }) => {
    await visitStates(page, "admin-shell", theme, "collapsed");
    const link = page.getByRole("link", { name: "Activity 99+, 120" });
    await link.hover();
    const read = () =>
      link.evaluate((el) => {
        const cs = getComputedStyle(el);
        const menu = getComputedStyle(el.closest(".cap-admin-menu")!).backgroundColor;
        const edge = cs.boxShadow.match(/rgba?\([^)]*\)/)?.[0] ?? menu;
        return {
          fill: window.capRatio(cs.backgroundColor, menu),
          edge: window.capRatio(edge, menu),
        };
      });
    // The hover fill fades in, so read it once the transition has ended.
    await expect
      .poll(async () => (await read()).fill, { message: "the hover fill against the menu" })
      .toBeGreaterThanOrEqual(1.2);
    expect((await read()).edge, "the hover edge against the menu").toBeGreaterThanOrEqual(3);
  });
});
