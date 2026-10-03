import { expect, test, type Page } from "@playwright/test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { eachTheme, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";
// The wrapper is imported as the package ships it (compiled by npm run build): Playwright rewrites the JSX of any .tsx file a spec imports for its own component testing, so the source cannot be rendered here.
import { Catalog } from "../../dist/components/catalog/catalog.react.js";
import { defineCatalog, parseCatalogParams, queryCatalog } from "./catalog-core.ts";
import { PROTOCOLS, protocolCatalog, type Protocol } from "./fixture.ts";

const wide = (page: Page) => page.locator('form[data-catalog="wide"]');
const narrow = (page: Page) => page.locator('form[data-catalog="narrow"]');
const count = (form: ReturnType<typeof wide>) => form.locator("[data-catalog-region='count']");
const firstTitle = (form: ReturnType<typeof wide>) => form.locator("tbody tr").first().locator("th a");

// The specimen has no server, so a no-script test needs one: a route that renders the catalog the way a site's
// loader and page would, with the same stylesheet the states page uses.
const SSR = "/ssr/protocols";
const ssrCatalog = defineCatalog({ ...protocolCatalog, basePath: SSR });
async function serveCatalog(page: Page): Promise<void> {
  const states = await (await page.request.get("components/catalog/states.html")).text();
  const links = (states.match(/<link rel="stylesheet"[^>]*>/g) ?? []).join("\n");
  await page.route(`**${SSR}*`, async (route) => {
    const url = new URL(route.request().url());
    // A site's loader would also redirect an address that carries defaults to its clean one (catalogRedirect,
    // unit-tested); Playwright does not route a redirected request, so this server answers the address it is given.
    const result = queryCatalog(ssrCatalog, PROTOCOLS, parseCatalogParams(ssrCatalog, url.searchParams));
    const body = renderToStaticMarkup(
      createElement(Catalog<Protocol>, {
        definition: ssrCatalog,
        result,
        labelledBy: "h",
        title: (p: Protocol) => createElement("a", { className: "cap-table-open", href: `#${p.id}` }, p.title),
      }),
    );
    await route.fulfill({
      contentType: "text/html",
      body: `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Protocols</title>${links}</head><body class="cap-specimens"><main><h1 id="h">Protocols</h1>${body}</main></body></html>`,
    });
  });
}

test.describe("no script", () => {
  test.use({ javaScriptEnabled: false });
  test("behaviour: the form, the chips, the sort headers and the pages all work as plain links and a GET form", async ({ page }) => {
    await serveCatalog(page);
    await page.goto(SSR);
    await expect(page.locator("form.cap-catalog")).toHaveAttribute("method", "get");
    await expect(page.locator(".cap-catalog-apply")).toBeVisible();
    // The form: a facet and a search, submitted with Apply.
    await page.getByLabel("Search protocols").fill("phage");
    await page.getByRole("button", { name: "Apply" }).click();
    // A native submit sends every control, including defaults, so the address carries more than q.
    await expect(page).toHaveURL(/\?q=phage/);
    await expect(page.locator(".cap-catalog-count")).toContainText("of 27 protocols");
    // A chip is a link that removes only itself.
    await expect(page.locator(".cap-catalog-chip")).toHaveCount(1);
    await page.locator(".cap-catalog-chip").click();
    await expect(page).toHaveURL(new RegExp(`${SSR}$`));
    // A page link.
    await page.getByRole("link", { name: "Page 2", exact: true }).click();
    await expect(page).toHaveURL(/\?page=2$/);
    await expect(page.locator(".cap-catalog-count")).toHaveText("27 protocols");
    // A sort header link, ascending first.
    await page.getByRole("link", { name: "Name" }).first().click();
    await expect(page).toHaveURL(/\?sort=title$/);
    await expect(page.locator("th[aria-sort='ascending']")).toContainText("Name");
  });

  test("behaviour: the filter tray opens by its address and closes by one, with no script", async ({ page }) => {
    await serveCatalog(page);
    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto(SSR);
    const filters = page.locator(".cap-catalog-filters");
    await expect(filters).toBeHidden();
    await page.getByRole("link", { name: /^Filters/ }).click();
    await expect(filters).toBeVisible();
    await page.getByRole("link", { name: /^Show \d+ protocols$/ }).click();
    await expect(filters).toBeHidden();
  });
});

test("behaviour: typing in the search updates the results, the count, the chips and the address, with no navigation", async ({ page }) => {
  await visitStates(page, "catalog", "light");
  const form = wide(page);
  const before = await count(form).textContent();
  await form.getByLabel("Search protocols").fill("phage");
  await expect(count(form)).not.toHaveText(before ?? "");
  await expect(count(form)).toContainText("of 27 protocols");
  await expect(form.locator(".cap-catalog-chip")).toHaveText(/"phage"/);
  expect(new URL(page.url()).searchParams.get("q")).toBe("phage");
  await expect(form.locator(".cap-catalog-apply")).toBeHidden();
});

test("behaviour: ticking a facet narrows the results and its chip removes just that filter", async ({ page }) => {
  await visitStates(page, "catalog", "light");
  const form = wide(page);
  await form.getByRole("radio", { name: /^recipe/ }).check();
  await expect(form.locator(".cap-catalog-chip")).toHaveText(/Kind: recipe/);
  const recipeCount = await count(form).textContent();
  expect(recipeCount).toMatch(/^\d+ of 27 protocols$/);
  await form.getByRole("checkbox", { name: /^pcr/i }).check();
  await expect(form.locator(".cap-catalog-chip")).toHaveCount(2);
  await form.locator(".cap-catalog-chip", { hasText: "Method" }).click();
  await expect(form.locator(".cap-catalog-chip")).toHaveCount(1);
  await expect(count(form)).toHaveText(recipeCount ?? "");
  await expect(page).toHaveURL(/kind=recipe/);
  expect(new URL(page.url()).searchParams.getAll("method")).toEqual([]);
  // Focus lands somewhere that says what changed, not on the removed chip.
  await expect(count(form)).toBeFocused();
});

test("behaviour: the sort menu reorders the rows and a sort header toggles direction", async ({ page }) => {
  await visitStates(page, "catalog", "light");
  const form = wide(page);
  await form.getByLabel("Sort").selectOption({ label: "Name, A to Z" });
  await expect(form.locator("th[aria-sort='ascending']")).toContainText("Name");
  const a = await firstTitle(form).textContent();
  await form.getByRole("link", { name: "Name" }).first().click();
  await expect(form.locator("th[aria-sort='descending']")).toContainText("Name");
  expect(await firstTitle(form).textContent()).not.toBe(a);
});

test("behaviour: a page link shows the next page in place and the count says so", async ({ page }) => {
  await visitStates(page, "catalog", "light");
  const form = wide(page);
  await expect(form.locator("tbody tr")).toHaveCount(10);
  await form.getByRole("link", { name: "Page 3", exact: true }).click();
  await expect(form.locator("tbody tr")).toHaveCount(7);
  expect(new URL(page.url()).searchParams.get("page")).toBe("3");
  await expect(form.locator(".cap-pagination-status")).toContainText("21 to 27 of 27");
});

test("behaviour: a search nothing matches shows 'no match' with a way back", async ({ page }) => {
  await visitStates(page, "catalog", "light");
  const form = wide(page);
  await form.getByLabel("Search protocols").fill("zzzz");
  await expect(form.locator(".cap-empty[data-kind='no-match']")).toBeVisible();
  await expect(form.getByRole("link", { name: "Clear filters" })).toBeVisible();
  await form.getByRole("link", { name: "Clear filters" }).click();
  await expect(form.locator("tbody tr").first()).toBeVisible();
  await expect(count(form)).toHaveText("27 protocols");
});

test("behaviour: a failed fetch navigates to the address instead of leaving a stale page", async ({ page }) => {
  await visitStates(page, "catalog", "light");
  await page.evaluate(() => {
    window.fetch = () => Promise.reject(new Error("offline"));
  });
  const nav = page.waitForURL(/q=boom/, { timeout: 5000 });
  await wide(page).getByLabel("Search protocols").fill("boom");
  await nav;
});

test("behaviour: in a phone's width the table is cards and the filters are a tray over the results", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await visitStates(page, "catalog", "light");
  const form = narrow(page);
  const filters = form.locator(".cap-catalog-filters");
  await expect(filters).toBeHidden();
  const thead = form.locator("thead");
  const box = await thead.boundingBox();
  expect(box === null || box.width <= 2, "the header row is visually hidden when rows are cards").toBe(true);
  await expect(form.locator("tbody tr").first().locator("td[data-label]").first()).toBeVisible();
  const open = form.getByRole("link", { name: /^Filters/ });
  await open.click();
  await expect(filters).toBeVisible();
  await expect(form).toHaveAttribute("data-tray", "open");
  await page.keyboard.press("Escape");
  await expect(filters).toBeHidden();
  await expect(open).toBeFocused();
});

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "catalog", theme);
    await expectNoAxeViolations(page);
  });

  test("accessibility: no axe violations with filters chosen and the tray open", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await visitStates(page, "catalog", theme);
    const form = narrow(page);
    await form.getByRole("link", { name: /^Filters/ }).click();
    await form.getByRole("radio", { name: /^protocol/ }).check();
    await expect(form.locator(".cap-catalog-chip")).toHaveCount(1);
    await expectNoAxeViolations(page);
  });
});
