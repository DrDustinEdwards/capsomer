import { expect, test } from "@playwright/test";
import {
  eachTheme,
  expectContrast,
  expectNoAxeViolations,
  visitStates,
} from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations and every part reaches its contrast", async ({ page }) => {
    await visitStates(page, "entry-list", theme);
    await expectNoAxeViolations(page);
    await expectContrast(page, [
      { sel: "#sample-list .cap-entry-when time", what: "the date" },
      { sel: "#sample-list .cap-entry-more", what: "the second fact" },
      { sel: "#sample-list .cap-entry-mark", what: "the mark" },
      { sel: "#sample-list .cap-entry-kicker", what: "the kicker" },
      { sel: "#sample-list .cap-entry-summary", what: "the summary" },
      { sel: "#sample-list .cap-entry-tags a[data-force]", what: "a tag under the pointer" },
    ]);
  });
});

test("the kicker is drawn above the title but the title stays first in the source", async ({
  page,
}) => {
  await visitStates(page, "entry-list", "light");
  const entry = page.locator("#sample-list .cap-entry").first();
  const title = await entry.locator(".cap-entry-title").boundingBox();
  const kicker = await entry.locator(".cap-entry-kicker").boundingBox();
  expect((kicker?.y ?? 0) < (title?.y ?? 0)).toBe(true);
  await page.setViewportSize({ width: 375, height: 800 });
  const when = await entry.locator(".cap-entry-when").boundingBox();
  const body = await entry.locator(".cap-entry-body").boundingBox();
  expect((when?.y ?? 0) < (body?.y ?? 0)).toBe(true);
});
