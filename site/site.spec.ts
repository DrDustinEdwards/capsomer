import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { eachTheme, expectNoAxeViolations } from "../test/helpers.ts";

// The site itself: the public page at the root, a component's public page and every admin view at
// /admin/ load with no axe violations, the menu moves between views, a component's page shows its states in both themes,
// an old root address opens its admin page, and the site runs under the Content-Security-Policy
// the static Worker sends.
const VIEWS = ["overview", "components", "color", "type", "motion", "tests", "defaults", "changes"];

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
  test("accessibility: the public page has no axe violations", async ({ page }) => {
    await page.goto("./");
    await expect(page.locator("h1")).toHaveText("One design system for every site and app");
    await expectNoAxeViolations(page, "body");
  });

  test("accessibility: a component's public page has no axe violations", async ({ page }) => {
    await page.goto("./components/button/");
    await expect(page.locator("h1")).toHaveText("Button");
    await expect(page.locator(".comp-side [aria-current='page']")).toHaveText("Button");
    await expect(page.locator(".comp-ex-frame").first().contentFrame().locator(".cap-specimen-shown")).toBeVisible();
    await expectNoAxeViolations(page, "body");
  });

  test("accessibility: the theme builder has no axe violations", async ({ page }) => {
    await page.goto("./make/");
    await expect(page.locator("[data-cap-part='verdict']")).toHaveText(/^All \d+ pairs pass/);
    await expectNoAxeViolations(page, "body");
  });

  for (const view of VIEWS) {
    test(`accessibility: the ${view} view has no axe violations`, async ({ page }) => {
      await page.goto(`./admin/#/${view}`);
      await expect(page.locator(".cap-admin")).toBeVisible();
      await expect(page.locator("#cap-main h1").first()).toBeVisible();
      await expectNoAxeViolations(page, ".cap-admin");
    });
  }

  test("keyboard: the menu's links move between views and mark the current one with the shell's dark pill", async ({ page }) => {
    await page.goto("./admin/#/overview");
    const link = page.locator(".cap-admin-menu").getByRole("link", { name: /^Color and contrast/ });
    await link.focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#\/color$/);
    await expect(link).toHaveAttribute("aria-current", "page");
    await expect(page.locator("#cap-main h1")).toHaveText("Color and contrast");
    await expect(page).toHaveTitle(/^Color and contrast · Capsomer/);
    // The color page's old address still opens it.
    await page.goto("./admin/#/colour"); // codespell:ignore
    await expect(page.locator("#cap-main h1")).toHaveText("Color and contrast");
  });

  test("behavior: the site is the reference shell: the site header with the theme button, the family's app strip, the collapse control at the menu's top", async ({ page }) => {
    await page.goto("./admin/#/overview");
    await expect(page.locator(".cap-site-header")).toBeVisible();
    await expect(page.locator(".cap-site-header .cap-theme-button")).toBeVisible();
    await expect(page.locator(".cap-admin-strip .cap-admin-tile")).toHaveCount(7);
    await expect(page.locator(".cap-admin-menu > [data-cap-part='menu-toggle']").first()).toBeVisible();
    await page.keyboard.press("[");
    await expect(page.locator(".cap-admin")).toHaveAttribute("data-menu", "collapsed");
  });

  test("behavior: the usage example shows AdminShell", async ({ page }) => {
    await page.goto("./admin/#/overview");
    const code = page.locator("#install-h ~ * .site-code, .site-code").first();
    await expect(code).toContainText('import { AdminShell, FIRST_PAGE } from "capsomer/react/admin-shell"');
    await expect(code).toContainText("<AdminShell");
  });

  test("behavior: the overview counts every family's contrast pairs, not just the committed palette's", async ({ page }) => {
    await page.goto("./admin/#/overview");
    const fig = page.locator(".site-figure").filter({ hasText: "Contrast pairs" });
    await expect(fig.locator("b")).toHaveText(/^\d[\d,]*$/);
    // Two facts, two lines: how many families and themes, then whether any pair fails.
    const lines = await fig.locator("> *").allTextContents();
    expect(lines).toEqual(["Contrast pairs", expect.stringMatching(/^\d[\d,]*$/), expect.stringMatching(/^\d+ color families in 2 themes$/), "None failing"]);
  });

  test("behavior: the Tests card says its number once", async ({ page }) => {
    await page.goto("./admin/#/overview");
    const fig = page.locator(".site-figure").filter({ hasText: "Tests" });
    // One read of the number and the card together: the site swaps in main's last run once it
    // has fetched it, and two separate reads could straddle that swap.
    const { n, text } = await fig.evaluate((el) => ({ n: el.querySelector("b")!.textContent!.trim(), text: el.textContent! }));
    expect(text.split(n).length - 1, `"${n}" in "${text}"`).toBe(1);
  });

  test("behavior: the site's strip marks Capsomer as the app you are in, and the bar says how fresh the results are", async ({ page }) => {
    await page.goto("./admin/#/overview");
    const current = page.locator(".cap-admin-strip .cap-admin-tile[aria-current='true']");
    await expect(current).toHaveCount(1);
    await expect(current).toHaveAccessibleName("Capsomer Scaffold");
    await expect(page.locator(".cap-admin-fresh")).toHaveText(/^Updated /);
    // The letterhead's trail says where you are: a component's page is Components, then it.
    await page.goto("./admin/#/components/shell");
    await expect(page.locator(".cap-site-header-trail li")).toHaveText(["Components", "Shell"]);
  });

  test("behavior: the site runs under its production Content-Security-Policy with no violation", async ({ page }) => {
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
    await page.goto("./");
    await expect(page.locator("h1")).toHaveText("One design system for every site and app");
    await page.waitForLoadState("networkidle");
    expect(await page.evaluate(() => (window as unknown as { cspViolations: string[] }).cspViolations), "CSP violations on the public page").toEqual([]);
    // The theme builder paints its previews through the CSSOM, which the CSP allows.
    await page.goto("./make/");
    await expect(page.locator("[data-cap-part='verdict']")).toHaveText(/pass/);
    await page.waitForLoadState("networkidle");
    expect(await page.evaluate(() => (window as unknown as { cspViolations: string[] }).cspViolations), "CSP violations on the theme builder").toEqual([]);
    await page.goto("./components/button/");
    await expect(page.locator("h1")).toHaveText("Button");
    await page.waitForLoadState("networkidle");
    // Its example frames too: the button's examples carry a style attribute, which bin/states.mjs
    // lifts into the page's states.css because the CSP drops inline style.
    await page.locator(".comp-ex-frame").first().scrollIntoViewIfNeeded();
    await expect(page.locator(".comp-ex-frame").first().contentFrame().locator(".cap-specimen-shown")).toBeVisible();
    await page.waitForLoadState("networkidle");
    for (const frame of page.frames()) {
      const found = await frame.evaluate(() => (window as unknown as { cspViolations?: string[] }).cspViolations ?? []);
      expect(found, `CSP violations in ${frame.url()}`).toEqual([]);
    }
    for (const view of ["overview", "color", "type", "components/shell"]) {
      await page.goto(`./admin/#/${view}`);
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

  test("behavior: a component's page shows its states in both themes", async ({ page }) => {
    await page.goto("./admin/#/components/shell");
    await expect(page.locator("#cap-main h1")).toHaveText("Shell");
    await expect(page.locator("iframe.site-frame")).toHaveCount(2);
  });
});

// The admin's pages lived at the root's hash addresses before it moved to /admin/.
test("behavior: an old address at the root opens its page in the admin", async ({ page }) => {
  await page.goto("./#/components/shell");
  await expect(page).toHaveURL(/\/admin\/#\/components\/shell$/);
  await expect(page.locator("#cap-main h1")).toHaveText("Shell");
});

// The public page's script: the preview takes a family, and the filter narrows the components.
test("behavior: the public page's preview takes the chosen family and the filter finds a component", async ({ page }) => {
  await page.goto("./");
  await page.locator(".home-try label", { hasText: "Teal" }).click();
  await expect(page.locator("[data-cap-part='stage']")).toHaveAttribute("data-family", "teal");
  await page.getByLabel("Find a component").fill("combobox");
  await expect(page.locator(".home-parts > li:visible")).toHaveCount(1);
  await expect(page.locator("#home-find-n")).toHaveText(/^1 of \d+ components$/);
});

// The theme builder: a brand color rebuilds the previews and the CSS, and the address carries the
// theme, so a shared link opens it again.
test("behavior: the theme builder makes a theme from a brand color and a link reopens it", async ({ page }) => {
  await page.goto("./make/");
  await page.getByLabel("Brand color", { exact: true }).fill("#0b6e4f");
  const light = page.locator(".make-pane[data-scheme='light']");
  await expect(light).toHaveCSS("--accent", "#0b6e4f");
  await expect(page.locator("[data-cap-part='css']")).toContainText("--accent: #0b6e4f;");
  await page.getByLabel("Start from").selectOption("foxing");
  await expect(page.getByLabel("Headings")).toHaveValue("fraunces");
  const url = page.url();
  expect(url).toContain("h=fraunces");
  await page.goto("about:blank");
  await page.goto(url);
  await expect(page.getByLabel("Start from")).toHaveValue("foxing");
  await expect(light).toHaveCSS("--accent", "#cc4f0c");
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
