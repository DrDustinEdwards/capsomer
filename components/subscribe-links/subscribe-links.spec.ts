import { expect, test } from "@playwright/test";
import {
  eachTheme,
  expectContrast,
  expectNoAxeViolations,
  visitStates,
} from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations, and the links reach their contrast", async ({ page }) => {
    await visitStates(page, "subscribe-links", theme);
    await expectNoAxeViolations(page);
    await expectContrast(page, [
      { sel: "#sub-full li:first-child .cap-subscribe-link", what: "an app link" },
      { sel: "#sub-full .cap-subscribe-more", what: "the more link" },
    ]);
  });
});

test("accessibility: a named section with one link per destination", async ({ page }) => {
  await visitStates(page, "subscribe-links", "light");
  const section = page.getByRole("region", { name: "Listen and subscribe" });
  await expect(section.getByRole("link")).toHaveCount(4);
  await expect(section.getByRole("link", { name: /^RSS$/ })).toBeVisible();
});
