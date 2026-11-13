import { expect, test, type Page } from "@playwright/test";
import {
  eachTheme,
  enforceTrustedTypes,
  expectNoAxeViolations,
  visitStates,
} from "../../test/helpers.ts";

type Block = { value: unknown; server: string };
type Rendered = { node: Block; hostile: Block; errors: string[] };
const rendered = (page: Page) =>
  page.evaluate(() => (window as unknown as { jsonLd: Rendered }).jsonLd);
const parsed = (page: Page, key: string) =>
  page
    .locator(`[data-mount="${key}"] script[type="application/ld+json"]`)
    .evaluate((s) => JSON.parse(s.textContent ?? "null") as unknown);

test("behavior: a string holding </script>, & and U+2028 stays inside the block, as the server sends it and the browser parses it", async ({
  page,
}) => {
  await visitStates(page, "json-ld", "light");
  const { hostile } = await rendered(page);
  // The server's HTML: one opening and one closing tag, nothing that could end the element early.
  expect(hostile.server.match(/<\/?script/gi)).toEqual(["<script", "</script"]);
  expect(hostile.server).not.toMatch(/[&\u2028\u2029]|<b>/);
  // The browser's block parses back to exactly the value, and no second script was made.
  expect(await parsed(page, "hostile")).toEqual(hostile.value);
  await expect(page.locator('[data-mount="hostile"] script')).toHaveCount(1);
});

test("behavior: a server-rendered block hydrates under enforced Trusted Types, with no violation", async ({
  page,
}) => {
  // The site's staged policy, enforced: innerHTML takes TrustedHTML only, and only the capsomer policy may make it.
  const violations = await enforceTrustedTypes(page, "json-ld");
  await visitStates(page, "json-ld", "light");
  const { node, errors } = await rendered(page);
  expect(await parsed(page, "node")).toEqual(node.value);
  expect(errors).toEqual([]);
  await expect(page.locator("#read-node")).toContainText('"headline": "Spring update"');
  expect(violations).toEqual([]);
});

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "json-ld", theme);
    await expect(page.locator("#read-hostile")).not.toBeEmpty();
    await expectNoAxeViolations(page);
  });
});
