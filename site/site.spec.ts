import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { eachTheme, expectNoAxeViolations } from "../test/helpers.ts";

// The docs site: one page of each of the five sections loads with no axe violations in both themes, the Themes controls
// repaint the board, the icon search narrows the grid, and the pages run under the Content-Security-Policy the static
// Worker sends.
const PAGES = [
  ["./", "Themes"],
  ["./components/button/", "Button"],
  ["./primitives/dialog/", "Dialog"],
  ["./icons/", "Icons"],
  ["./colors/", "Colors"],
] as const;

// The headers the static Worker sends on every page: every `/*` rule of the built site's _headers
// combined, as Cloudflare combines them, which `npm run site` writes from the site registry (site-runtime-headers).
const PAGE_HEADERS = Object.fromEntries(
  readFileSync("site-dist/_headers", "utf8")
    .split("\n\n")
    .filter((block) => block.trimStart().startsWith("/*\n"))
    .flatMap((block) => block.trimStart().split("\n").slice(1))
    .map((line) => /^ {2}([A-Za-z-]+): (.+)$/.exec(line))
    .filter((m): m is RegExpExecArray => m !== null)
    .map((m) => [String(m[1]).toLowerCase(), String(m[2])]),
);
const CSP = PAGE_HEADERS["content-security-policy"] ?? "";

eachTheme(() => {
  for (const [path, title] of PAGES)
    test(`accessibility: ${title} (${path}) has no axe violations`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator("h1")).toHaveText(title);
      await expectNoAxeViolations(page, "body");
    });

  test("behavior: the pages run under the production Content-Security-Policy with no violation", async ({
    page,
  }) => {
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
      // Enforced violations only: the staged Report-Only policy (Trusted Types, frame-src) reports
      // by design, and those reports are what it is staged to collect.
      document.addEventListener("securitypolicyviolation", (e) => {
        if (e.disposition !== "enforce") return;
        w.cspViolations.push(
          `${e.violatedDirective}: ${e.blockedURI || "inline"} at ${e.sourceFile}:${e.lineNumber}`,
        );
      });
    });
    // The Themes and Colors pages paint their samples through the CSSOM, which the CSP allows; a component page's
    // example frames carry style attributes, which bin/states.mjs lifts into the page's states.css.
    for (const [path, title] of PAGES) {
      await page.goto(path);
      await expect(page.locator("h1")).toHaveText(title);
      const frame = page.locator(".comp-ex-frame").first();
      if (await frame.count()) {
        await frame.scrollIntoViewIfNeeded();
        await expect(frame.contentFrame().locator(".cap-specimen-shown")).toBeVisible();
      }
      await page.waitForLoadState("networkidle");
      for (const f of page.frames()) {
        const found = await f.evaluate(
          () => (window as unknown as { cspViolations?: string[] }).cspViolations ?? [],
        );
        expect(found, `CSP violations in ${f.url()}`).toEqual([]);
      }
    }
  });
});

// The Themes controls set the board's family, theme and density as a site does, and the token values follow.
test("behavior: the Themes controls repaint the board and its token values", async ({ page }) => {
  await page.goto("./themes/color/");
  const board = page.locator("[data-cap-part='board']").first();
  const accent = page.locator(".th-val[data-token='accent'] code").first();
  const before = await accent.textContent();
  await page.getByLabel("Family").selectOption("teal");
  await expect(board).toHaveAttribute("data-family", "teal");
  await expect(accent).not.toHaveText(before ?? "");
  await page.locator("label", { hasText: "Comfortable" }).click();
  await expect(board).toHaveAttribute("data-density", "comfortable");
});

// The icon search narrows the grid and says how many are left.
test("behavior: the icon search finds an icon", async ({ page }) => {
  await page.goto("./icons/");
  await page.getByLabel("Find an icon").fill("search");
  await expect(page.locator(".sw-icons > li:visible").first()).toHaveAttribute(
    "data-name",
    /search/i,
  );
  await expect(page.locator("#icon-n")).toHaveText(/^\d+ of \d+ icons$/);
});

// A component page does not shift as its example frames load: each frame's height is reserved (CLS). The bar is web.dev's
// "good" 0.1; the page measured 0.1 to 0.4 before the heights were reserved.
for (const width of [390, 1440]) {
  test(`layout: a component page's example frames do not shift the page (${width}px)`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.addInitScript(() => {
      (window as unknown as { cls: number }).cls = 0;
      new PerformanceObserver((list) => {
        for (const e of list.getEntries() as unknown as {
          value: number;
          hadRecentInput: boolean;
        }[])
          if (!e.hadRecentInput) (window as unknown as { cls: number }).cls += e.value;
      }).observe({ type: "layout-shift", buffered: true });
    });
    await page.goto("./components/combobox/");
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 400) {
        scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 60));
      }
    });
    await page.waitForTimeout(1000);
    expect(await page.evaluate(() => (window as unknown as { cls: number }).cls)).toBeLessThan(0.1);
  });
}

// Cloudflare Web Analytics injects its beacon into every HTML page on this zone. A public
// site allows its file and versioned path in script-src (Dustin's analytics ruling,
// 2026-10-03; site-runtime writes the two sources); the beacon reports
// to this origin's /cdn-cgi/rum, so connect-src gains nothing.
test("security: the CSP allows Cloudflare's Web Analytics beacon and nothing else new", () => {
  const directive = (name: string) =>
    CSP.split(";")
      .map((d) => d.trim())
      .find((d) => d.startsWith(`${name} `)) ?? "";
  expect(directive("script-src").split(" ").slice(1)).toEqual([
    "'self'",
    "https://static.cloudflareinsights.com/beacon.min.js",
    "https://static.cloudflareinsights.com/beacon.min.js/",
  ]);
  expect(directive("connect-src")).toBe(
    "connect-src 'self' https://raw.githubusercontent.com/DrDustinEdwards/capsomer/results/results.json",
  );
});
