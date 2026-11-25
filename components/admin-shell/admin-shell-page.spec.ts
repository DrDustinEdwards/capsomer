import { expect, test } from "@playwright/test";
import { eachTheme, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

// The admin shell's apps strip, page bar and page transitions.
eachTheme((theme) => {
  test("behavior: the strip lists the family's seven apps, Capsomer last, in one order with their own marks, this one marked", async ({
    page,
  }) => {
    await visitStates(page, "admin-shell", theme, "expanded");
    const tiles = page.locator(".cap-admin-strip .cap-admin-tile");
    await expect(tiles).toHaveCount(7);
    const names = await tiles.evaluateAll((els) =>
      els.map((e) => ({
        label: e.getAttribute("aria-label")!.split(",")[0],
        logo: !!e.querySelector("svg.cap-admin-logo"),
        letters: [...e.childNodes].some(
          (n) =>
            n.nodeType === Node.ELEMENT_NODE &&
            (n as Element).tagName === "SPAN" &&
            !(n as Element).className &&
            /\w/.test(n.textContent ?? ""),
        ),
      })),
    );
    expect(names).toEqual(
      [
        "Capsid Portal",
        "Carrel Desk",
        "dustinedwards.info",
        "germomics",
        "Foxhound",
        "Foxing",
        "Capsomer Scaffold",
      ].map((label) => ({ label, logo: true, letters: false })),
    );
    await expect(tiles.first()).toHaveAttribute("aria-current", "true");
    await expect(page.locator(".cap-site-header-logo")).toHaveAccessibleName("Capsid Portal");
  });
  test("behavior: an app that passes only its own name still shows all seven apps, each tile an svg mark and no letter", async ({
    page,
  }) => {
    await visitStates(page, "admin-shell", theme, "minimal");
    const tiles = page.locator(".cap-admin-strip .cap-admin-tile");
    await expect(tiles).toHaveCount(7);
    const facts = await tiles.evaluateAll((els) =>
      els.map((e) => ({
        label: e.getAttribute("aria-label")!.split(",")[0],
        marks: e.querySelectorAll(":scope > svg.cap-admin-logo").length,
        letters: [
          ...e.querySelectorAll(":scope > :not(svg):not(.cap-admin-tip):not(.cap-admin-badge)"),
        ]
          .map((n) => n.textContent ?? "")
          .join(""),
      })),
    );
    expect(facts).toEqual(
      [
        "Capsid Portal",
        "Carrel Desk",
        "dustinedwards.info",
        "germomics",
        "Foxhound",
        "Foxing",
        "Capsomer Scaffold",
      ].map((label) => ({ label, marks: 1, letters: "" })),
    );
    await expect(tiles.nth(4)).toHaveAttribute("aria-current", "true");
  });

  test("behavior: Foxhound keeps its favicon x until Dustin picks; two alternatives sit beside it and none is shipped", async ({
    page,
  }) => {
    await visitStates(page, "admin-shell", theme, "foxhound-marks");
    const items = page.locator("[data-mark]");
    expect(
      await items.evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.mark)),
    ).toEqual(["today", "track", "fox"]);
    const svgs = await items.evaluateAll((els) =>
      els.map((e) => e.querySelector("svg")!.innerHTML),
    );
    const [today, ...alternatives] = svgs;
    expect(alternatives, "exactly two alternatives, different from each other").toHaveLength(2);
    expect(alternatives[0]).not.toBe(alternatives[1]);
    expect(
      alternatives,
      "Foxhound's mark in FAMILY_APPS is not one of the alternatives",
    ).not.toContain(today);
    // Today's mark is the favicon's x: two strokes, no fill.
    expect(today).toContain("M7.5 9 16.5 18M16.5 9 7.5 18");
    // The strip draws that same x for Foxhound.
    await visitStates(page, "admin-shell", theme, "minimal");
    expect(
      await page
        .locator('.cap-admin-strip .cap-admin-tile[aria-label^="Foxhound"] svg.cap-admin-logo')
        .innerHTML(),
    ).toBe(today);
  });
  test("behavior: the top bar has the freshness line at the left and Refresh last; the theme is the header's one button; the tab says the page and the app", async ({
    page,
  }) => {
    await visitStates(page, "admin-shell", theme, "expanded");
    await expect(page).toHaveTitle("Overview · Capsid Portal");
    const bar = page.locator(".cap-admin-bar");
    await expect(bar.locator(".cap-admin-fresh")).toHaveText(
      /^Updated (\d+ minutes? ago|less than a minute ago|just now) · refreshes itself$/,
    );
    await expect(bar.locator(".cap-admin-fresh time")).toHaveAttribute("datetime", /Z$/);
    const order = await bar
      .locator(".cap-admin-actions > *")
      .evaluateAll((els) =>
        els.map((e) => e.getAttribute("data-cap-part") ?? e.getAttribute("data-cap")),
      );
    expect(order.at(-1)).toBe("refresh");
    await expect(bar.getByRole("button", { name: "Refresh" })).toBeVisible();
    // No Light and Dark switch in the bar; one icon button in the header.
    await expect(page.locator("[data-cap='theme-switch']")).toHaveCount(1);
    const button = page.locator(".cap-site-header .cap-theme-button");
    await expect(button).toHaveAccessibleName(
      theme === "light" ? "Switch to dark theme" : "Switch to light theme",
    );
    await button.click();
    await expect(button).toHaveAccessibleName(
      theme === "light" ? "Switch to light theme" : "Switch to dark theme",
    );
  });

  test("behavior: the page fills the content area from the same left edge, open and collapsed", async ({
    page,
  }) => {
    await visitStates(page, "admin-shell", theme, "expanded");
    const box = () =>
      page.evaluate(() => {
        const main = document.querySelector(".cap-admin-main")!.getBoundingClientRect();
        const p = document.querySelector(".cap-admin-page")!.getBoundingClientRect();
        return {
          inset: Math.round(p.left - main.left),
          right: Math.round(main.right - p.right),
          w: Math.round(p.width),
        };
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

  test("behavior: with transitions on the content, strip and menu are named apart, and reduced motion gives no names", async ({
    page,
  }) => {
    await visitStates(page, "admin-shell", theme, "transition");
    const name = (sel: string) =>
      page.locator(sel).evaluate((el) => getComputedStyle(el).viewTransitionName);
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

  test("keyboard: Enter on a menu link changes the page, the strip and menu stay and focus stays on the link", async ({
    page,
  }) => {
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

  test("keyboard: the Next page button changes the page by keyboard with reduced motion on, at once", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await visitStates(page, "admin-shell", theme, "transition");
    await page.getByRole("button", { name: "Next page" }).focus();
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("page-title")).toHaveText("sites");
    expect(
      await page.evaluate(
        () => document.getAnimations().filter((a) => a.timeline === document.timeline).length,
      ),
    ).toBe(0);
  });

  test('behavior: the tab title is "<page> · <app>" by default, and documentTitle={false} leaves the app\'s own', async ({
    page,
  }) => {
    await visitStates(page, "admin-shell", theme, "transition");
    await expect(page).toHaveTitle("Overview · Capsid Portal");
    await visitStates(page, "admin-shell", theme, "own-title");
    await expect(page.getByTestId("page-title")).toHaveText("overview");
    await expect(page).toHaveTitle("overview - the app's own title");
    await page.getByRole("button", { name: "Next page" }).click();
    await expect(page.getByTestId("page-title")).toHaveText("sites");
    await expect(page).toHaveTitle("sites - the app's own title");
  });

  test("behavior: a browser without the View Transitions API changes the page with no error", async ({
    page,
  }) => {
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
