import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { eachTheme, expectNoAxeViolations } from "../test/helpers.ts";

// The site itself: every view loads in the shell with no axe violations, the rail moves
// between views, a component's page shows its states in both themes, and the site runs
// under the Content-Security-Policy the static Worker sends.
const VIEWS = ["overview", "components", "colour", "type", "motion", "tests", "defaults", "changes", "settings"];

// The policy the static Worker sends, read from site/public/_headers.
const CSP = /Content-Security-Policy:\s*(.+)/.exec(readFileSync("site/public/_headers", "utf8"))?.[1]?.trim() ?? "";

eachTheme((theme) => {
  for (const view of VIEWS) {
    test(`accessibility: the ${view} view has no axe violations`, async ({ page }) => {
      await page.goto(`./#/${view}`);
      await expect(page.locator(".cap-shell")).toBeVisible();
      await expect(page.locator("#cap-main h1").first()).toBeVisible();
      await expectNoAxeViolations(page, ".cap-shell");
    });
  }

  test("keyboard: the rail's links move between views and mark the current one", async ({ page }) => {
    await page.goto("./#/overview");
    const link = page.locator(".cap-shell-rail").getByRole("link", { name: /^Colour and contrast/ });
    await link.focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#\/colour$/);
    await expect(link).toHaveAttribute("aria-current", "page");
    await expect(page.locator("#cap-main h1")).toHaveText("Colour and contrast");
  });

  test("behaviour: the overview counts every family's contrast pairs, not just the committed palette's", async ({ page }) => {
    await page.goto("./#/overview");
    const fig = page.locator(".site-figure").filter({ hasText: "Contrast pairs" });
    await expect(fig.locator("b")).toHaveText(/^\d{3}$/);
    await expect(fig).toContainText("0 failing");
    await expect(fig).toContainText("3 families, both themes");
  });

  test("behaviour: the colour view shows all three families, each default theme first", async ({ page }) => {
    await page.goto("./#/colour");
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
    for (const view of ["overview", "colour", "type", "components/shell"]) {
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
