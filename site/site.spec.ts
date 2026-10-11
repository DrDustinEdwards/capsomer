import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { eachTheme, expectNoAxeViolations } from "../test/helpers.ts";

// The site itself: every view loads in the AdminShell with no axe violations, the menu moves
// between views, a component's page shows its states in both themes, and the site runs
// under the Content-Security-Policy the static Worker sends.
const VIEWS = ["overview", "components", "color", "type", "motion", "tests", "defaults", "changes", "settings"];

// The policy the static Worker sends, read from site/public/_headers.
const CSP = /Content-Security-Policy:\s*(.+)/.exec(readFileSync("site/public/_headers", "utf8"))?.[1]?.trim() ?? "";

eachTheme((theme) => {
  for (const view of VIEWS) {
    test(`accessibility: the ${view} view has no axe violations`, async ({ page }) => {
      await page.goto(`./#/${view}`);
      await expect(page.locator(".cap-admin")).toBeVisible();
      await expect(page.locator("#cap-main h1").first()).toBeVisible();
      await expectNoAxeViolations(page, ".cap-admin");
    });
  }

  test("keyboard: the menu's links move between views and mark the current one with the shell's dark pill", async ({ page }) => {
    await page.goto("./#/overview");
    const link = page.locator(".cap-admin-menu").getByRole("link", { name: /^Color and contrast/ });
    await link.focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#\/color$/);
    await expect(link).toHaveAttribute("aria-current", "page");
    await expect(page.locator("#cap-main h1")).toHaveText("Color and contrast");
    await expect(page).toHaveTitle(/^Color and contrast · Capsomer/);
    // The colour page's old address still opens it.
    await page.goto("./#/colour");
    await expect(page.locator("#cap-main h1")).toHaveText("Color and contrast");
  });

  test("behaviour: the site is the reference shell: the family's app strip, the collapse control at its top, the top bar with the theme", async ({ page }) => {
    await page.goto("./#/overview");
    await expect(page.locator(".cap-admin-strip .cap-admin-tile")).toHaveCount(5);
    await expect(page.locator(".cap-admin-strip li").first().locator("[data-cap-part='menu-toggle']")).toBeVisible();
    await expect(page.locator(".cap-admin-bar").getByRole("group", { name: "Theme" })).toBeVisible();
    await expect(page.locator(".cap-admin-bar-page")).toHaveText("Overview");
    await page.keyboard.press("[");
    await expect(page.locator(".cap-admin")).toHaveAttribute("data-menu", "collapsed");
  });

  test("behaviour: the usage example shows AdminShell", async ({ page }) => {
    await page.goto("./#/overview");
    const code = page.locator("#install-h ~ * .site-code, .site-code").first();
    await expect(code).toContainText('import { AdminShell, FIRST_PAGE } from "capsomer/react/admin-shell"');
    await expect(code).toContainText("<AdminShell");
  });

  test("behaviour: the overview counts every family's contrast pairs, not just the committed palette's", async ({ page }) => {
    await page.goto("./#/overview");
    const fig = page.locator(".site-figure").filter({ hasText: "Contrast pairs" });
    await expect(fig.locator("b")).toHaveText(/^\d{3}$/);
    // Two facts, two lines: how many families and themes, then whether any pair fails.
    const lines = await fig.locator("> *").allTextContents();
    expect(lines).toEqual(["Contrast pairs", expect.stringMatching(/^\d{3}$/), "Across 3 color families, in both themes", "None failing"]);
  });

  test("behaviour: the color view shows all three families, each default theme first", async ({ page }) => {
    await page.goto("./#/color");
    for (const [name, first] of [["Purple", "Light"], ["Fox", "Light"], ["Teal", "Dark"]] as const) {
      const fam = page.locator(".site-family").filter({ has: page.getByRole("heading", { name: new RegExp(`^${name}`) }) });
      await expect(fam).toHaveCount(1);
      await expect(fam.locator(".site-steps")).toHaveCount(2);
      await expect(fam.locator(".site-steps").first().locator("li")).toHaveCount(12);
      await expect(fam.locator(".site-steps-row .cap-label").first()).toHaveText(`${first}, default`);
    }
  });

  test("behaviour: the site runs under its production Content-Security-Policy with no violation", async ({ page }) => {
    expect(CSP, "the CSP line in site/public/_headers").not.toBe("");
    await page.route("**/*", async (route) => {
      const response = await route.fetch();
      const type = response.headers()["content-type"] ?? "";
      if (!type.includes("text/html")) return route.fulfill({ response });
      await route.fulfill({ response, headers: { ...response.headers(), "content-security-policy": CSP } });
    });
    await page.addInitScript(() => {
      const w = window as unknown as { cspViolations: string[] };
      w.cspViolations = [];
      document.addEventListener("securitypolicyviolation", (e) => {
        w.cspViolations.push(`${e.violatedDirective}: ${e.blockedURI || "inline"} at ${e.sourceFile}:${e.lineNumber}`);
      });
    });
    for (const view of ["overview", "color", "type", "components/shell"]) {
      await page.goto(`./#/${view}`);
      await expect(page.locator("#cap-main h1").first()).toBeVisible();
      await page.waitForLoadState("networkidle");
      const found = await page.evaluate(() => (window as unknown as { cspViolations: string[] }).cspViolations);
      expect(found, `CSP violations on ${view}`).toEqual([]);
    }
  });

  test("behaviour: a component's page shows its states in both themes", async ({ page }) => {
    await page.goto("./#/components/shell");
    await expect(page.locator("#cap-main h1")).toHaveText("Shell");
    await expect(page.locator("iframe.site-frame")).toHaveCount(2);
  });
});

// Cloudflare Web Analytics injects its beacon into every HTML page on this zone. A public
// site allows it in script-src (Dustin's analytics ruling, 2026-10-03); the beacon reports
// to this origin's /cdn-cgi/rum, so connect-src gains nothing.
test("security: the CSP allows Cloudflare's Web Analytics beacon and nothing else new", () => {
  const directive = (name: string) => CSP.split(";").map((d) => d.trim()).find((d) => d.startsWith(`${name} `)) ?? "";
  expect(directive("script-src").split(" ").slice(1)).toEqual(["'self'", "https://static.cloudflareinsights.com"]);
  expect(directive("connect-src")).toBe("connect-src 'self' https://raw.githubusercontent.com");
});
