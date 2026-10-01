import { readdirSync, existsSync } from "node:fs";
import { test } from "@playwright/test";

// One full-page screenshot per states page with forced colours on, into
// test-results/forced-colours/. CI keeps them with the run for review.
const names = readdirSync("components", { withFileTypes: true })
  .filter((d) => d.isDirectory() && existsSync(`components/${d.name}/states.html`))
  .map((d) => d.name);

for (const name of names) {
  test(`forced colours: ${name}`, async ({ page }) => {
    await page.goto(`components/${name}/states.html`);
    await page.evaluate(() => document.fonts.ready.then(() => undefined));
    await page.screenshot({ path: `test-results/forced-colours/${name}.png`, fullPage: true });
  });
}
