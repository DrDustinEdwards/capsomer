import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { eachTheme, expectNoAxeViolations } from "../test/helpers.ts";

// The site itself: every view loads in the AdminShell with no axe violations, the menu moves
// between views, a component's page shows its states in both themes, and the site runs
// under the Content-Security-Policy the static Worker sends.
const VIEWS = ["overview", "components", "color", "type", "motion", "tests", "defaults", "changes", "settings"];

// The headers the static Worker sends on every page: the `/*` rule of the built site's _headers,
// which the build writes from scripts/security-headers.ts.
const PAGE_HEADERS = Object.fromEntries(
  (readFileSync("site-dist/_headers", "utf8").split("\n\n")[0] ?? "")
    .split("\n")
    .slice(1)
    .map((line) => /^ {2}([A-Za-z-]+): (.+)$/.exec(line))
    .filter((m): m is RegExpExecArray => m !== null)
    .map((m) => [String(m[1]).toLowerCase(), String(m[2])]),
);
const CSP = PAGE_HEADERS["content-security-policy"] ?? "";

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

  test("behaviour: the site is the reference shell: the site header with the theme button, the family's app strip, the collapse control at the menu's top", async ({ page }) => {
    await page.goto("./#/overview");
    await expect(page.locator(".cap-site-header")).toBeVisible();
    await expect(page.locator(".cap-site-header .cap-theme-button")).toBeVisible();
    await expect(page.locator(".cap-admin-strip .cap-admin-tile")).toHaveCount(7);
    await expect(page.locator(".cap-admin-menu > [data-cap-part='menu-toggle']").first()).toBeVisible();
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
    expect(lines).toEqual(["Contrast pairs", expect.stringMatching(/^\d{3}$/), "5 color families in 2 themes", "None failing"]);
  });

  test("behaviour: the Tests card says its number once", async ({ page }) => {
    await page.goto("./#/overview");
    const fig = page.locator(".site-figure").filter({ hasText: "Tests" });
    // One read of the number and the card together: the site swaps in main's last run once it
    // has fetched it, and two separate reads could straddle that swap.
    const { n, text } = await fig.evaluate((el) => ({ n: el.querySelector("b")!.textContent!.trim(), text: el.textContent! }));
    expect(text.split(n).length - 1, `"${n}" in "${text}"`).toBe(1);
  });

  test("behaviour: the site's strip marks Capsomer as the app you are in, and the bar says how fresh the results are", async ({ page }) => {
    await page.goto("./#/overview");
    const current = page.locator(".cap-admin-strip .cap-admin-tile[aria-current='true']");
    await expect(current).toHaveCount(1);
    await expect(current).toHaveAccessibleName("Capsomer");
    await expect(page.locator(".cap-admin-fresh")).toHaveText(/^Updated /);
    // A top-level page: no trail repeating its heading. A component's page: Components, then it.
    await expect(page.locator(".cap-admin-trail")).toHaveCount(0);
    await page.goto("./#/components/shell");
    await expect(page.locator(".cap-admin-trail li")).toHaveText(["Components", "Shell"]);
  });

  test("behaviour: the site runs under its production Content-Security-Policy with no violation", async ({ page }) => {
    expect(CSP, "the CSP line in site-dist/_headers").not.toBe("");
    await page.route("**/*", async (route) => {
      const response = await route.fetch();
      const type = response.headers()["content-type"] ?? "";
      if (!type.includes("text/html")) return route.fulfill({ response });
      await route.fulfill({ response, headers: { ...response.headers(), ...PAGE_HEADERS } });
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
    // The site frames its own pages (frame-ancestors 'self', X-Frame-Options sameorigin): the
    // shell's states page loads in its frame, and its specimens load in theirs, with no violation
    // in any frame.
    const states = page.locator("iframe.site-frame").first();
    await states.scrollIntoViewIfNeeded();
    const specimen = states.contentFrame().locator("iframe.cap-specimen-frame").first();
    await specimen.scrollIntoViewIfNeeded();
    await expect(specimen.contentFrame().locator("body.cap-specimen-only")).toBeAttached();
    await page.waitForLoadState("networkidle");
    expect(page.frames().length, "the states page and its specimens are framed").toBeGreaterThan(2);
    for (const frame of page.frames()) {
      const found = await frame.evaluate(() => (window as unknown as { cspViolations?: string[] }).cspViolations ?? []);
      expect(found, `CSP violations in ${frame.url()}`).toEqual([]);
    }
  });

  test("behaviour: a component's page shows its states in both themes", async ({ page }) => {
    await page.goto("./#/components/shell");
    await expect(page.locator("#cap-main h1")).toHaveText("Shell");
    await expect(page.locator("iframe.site-frame")).toHaveCount(2);
  });
});

// Cloudflare Web Analytics injects its beacon into every HTML page on this zone. A public
// site allows its file and versioned path in script-src (Dustin's analytics ruling,
// 2026-10-03; site-runtime writes the two sources); the beacon reports
// to this origin's /cdn-cgi/rum, so connect-src gains nothing.
test("security: the CSP allows Cloudflare's Web Analytics beacon and nothing else new", () => {
  const directive = (name: string) => CSP.split(";").map((d) => d.trim()).find((d) => d.startsWith(`${name} `)) ?? "";
  expect(directive("script-src").split(" ").slice(1)).toEqual([
    "'self'",
    "https://static.cloudflareinsights.com/beacon.min.js",
    "https://static.cloudflareinsights.com/beacon.min.js/",
  ]);
  expect(directive("connect-src")).toBe("connect-src 'self' https://raw.githubusercontent.com");
});
