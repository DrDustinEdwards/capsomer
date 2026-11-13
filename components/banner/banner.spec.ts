import { expect, test } from "@playwright/test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  eachTheme,
  expectContrast,
  expectNoAxeViolations,
  visitStates,
} from "../../test/helpers.ts";
// The wrapper is imported as the package ships it (compiled by npm run build); Playwright rewrites the JSX of any .tsx file a spec imports.
import { Banner } from "../../dist/components/banner/banner.react.js";

// The specimen has no React page, so the body slot is checked on markup the way a site's server renders it, with the states page's stylesheet.
test("behavior: the React Banner holds a list in its body, outside any paragraph, inside the banner's width", async ({
  page,
}) => {
  const states = await (await page.request.get("components/banner/states.html")).text();
  const links = (states.match(/<link rel="stylesheet"[^>]*>/g) ?? []).join("\n");
  const item = (text: string) => createElement("li", { key: text }, text);
  const markup = renderToStaticMarkup(
    createElement(Banner, {
      title: "Three sites are slow",
      body: createElement("ul", null, ["Home page", "Search", "Sign in"].map(item)),
      onDismiss: () => {},
    }),
  );
  await page.route("**/ssr/banner", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Banner</title>${links}</head><body class="cap-specimens"><main><h1>Banner</h1>${markup}</main></body></html>`,
    }),
  );
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto("ssr/banner");
  const banner = page.locator(".cap-banner");
  await expect(banner.locator("ul > li")).toHaveCount(3);
  await expect(banner.locator("p ul")).toHaveCount(0);
  const [box, list] = await Promise.all([banner.boundingBox(), banner.locator("ul").boundingBox()]);
  expect(list!.x).toBeGreaterThanOrEqual(box!.x);
  expect(list!.x + list!.width).toBeLessThanOrEqual(box!.x + box!.width + 0.5);
});

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "banner", theme);
    await expectNoAxeViolations(page);
  });

  test("accessibility: banner and alert text reach their contrast", async ({ page }) => {
    await visitStates(page, "banner", theme);
    await expectContrast(page, [
      { sel: "#sample-warn .cap-banner-text", what: "warning banner text" },
      { sel: "#sample-crit .cap-banner-text", what: "critical banner text" },
      { sel: "#sample-warn .cap-status-glyph", what: "warning banner glyph", min: 3 },
      { sel: "#sample-crit .cap-status-glyph", what: "critical banner glyph", min: 3 },
      { sel: "#sample-alert .cap-alert-text", what: "inline alert text" },
      { sel: "#sample-warn", what: "warning banner edge", part: "border", min: 3 },
      { sel: "#sample-crit", what: "critical banner edge", part: "border", min: 3 },
    ]);
  });

  test(
    "accessibility: the banner's and the alert's roles and names",
    { tag: "@markup" },
    async ({ page }) => {
      await visitStates(page, "banner", theme);
      await expect(page.locator("#sample-warn")).toMatchAriaSnapshot(`
      - status:
        - paragraph: Could not refresh. Showing data from 4 minutes ago.
        - button "Try again"
    `);
      await expect(page.locator("#sample-alert")).toMatchAriaSnapshot(`
      - alert: "Could not save the schedule: the server did not answer. Your changes are kept here; save again in a minute."
    `);
      await expect(page.getByRole("button", { name: "Save schedule" })).toHaveAccessibleDescription(
        /Could not save the schedule/,
      );
    },
  );

  test("accessibility: every tone, the title and the alert tones reach their contrast", async ({
    page,
  }) => {
    await visitStates(page, "banner", theme);
    await expectContrast(page, [
      { sel: "#sample-neutral .cap-banner-text", what: "neutral banner text" },
      { sel: "#sample-info .cap-banner-text", what: "notice banner text" },
      { sel: "#sample-ok .cap-banner-text", what: "ok banner text" },
      { sel: "#sample-neutral .cap-status-glyph", what: "neutral glyph", min: 3 },
      { sel: "#sample-info .cap-status-glyph", what: "notice glyph", min: 3 },
      { sel: "#sample-ok .cap-status-glyph", what: "ok glyph", min: 3 },
      { sel: "#sample-neutral", what: "neutral edge", part: "border", min: 3 },
      { sel: "#sample-info", what: "notice edge", part: "border", min: 3 },
      { sel: "#sample-ok", what: "ok edge", part: "border", min: 3 },
      { sel: "#sample-title .cap-banner-title", what: "banner title" },
      { sel: "#sample-title .cap-banner-text", what: "banner description" },
      { sel: "#sample-title a", what: "a link in a banner" },
      { sel: "#sample-alert-title .cap-alert-title", what: "critical alert title" },
      { sel: "#sample-alert-title .cap-alert-text", what: "critical alert description" },
      { sel: "#sample-alert-warn .cap-alert-title", what: "warning alert title" },
      { sel: "#sample-alert-warn .cap-alert-text", what: "warning alert description" },
      { sel: "#sample-alert-neutral .cap-alert-title", what: "neutral alert title" },
      { sel: "#sample-comfortable .cap-banner-text", what: "comfortable banner text" },
    ]);
  });

  test("keyboard: Enter on Dismiss hides the banner and focus moves to the page, not nowhere", async ({
    page,
  }) => {
    await visitStates(page, "banner", theme);
    const dismiss = page.locator("#sample-dismiss").getByRole("button", { name: "Dismiss" });
    await dismiss.focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("#sample-dismiss")).toBeHidden();
    await expect(page.locator("main").first()).toBeFocused();
  });
});
