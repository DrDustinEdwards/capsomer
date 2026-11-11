import { expect, test } from "@playwright/test";
import {
  eachTheme,
  enforceTrustedTypes,
  expectContrast,
  expectNoAxeViolations,
  visitStates,
} from "../../test/helpers.ts";

test("behavior: under enforced Trusted Types RichText renders through the capsomer policy, with no violation", async ({
  page,
}) => {
  const violations = await enforceTrustedTypes(page, "trusted-html");
  await visitStates(page, "trusted-html", "light");
  await expect(page.getByRole("link", { name: "access@example.com" })).toBeVisible();
  await expect(page.locator("#sample-titles em")).toHaveText("Quercus alba");
  expect(violations).toEqual([]);
});

eachTheme((theme) => {
  test.beforeEach(async ({ page }) => {
    await visitStates(page, "trusted-html", theme);
    await expect(page.locator("#sample-paragraph")).toHaveCount(1);
  });

  test("accessibility: no axe violations", async ({ page }) => {
    await expectNoAxeViolations(page);
  });

  test("accessibility: the stored text and the fallback reach their contrast", async ({ page }) => {
    await expectContrast(page, [
      { sel: "#sample-measure p", what: "stored text" },
      { sel: "#sample-measure a", what: "a link in stored text" },
      { sel: "#sample-titles .cap-muted", what: "the fallback" },
    ]);
  });

  test("behavior: the measure is a class rule, never a style attribute, and an empty title shows the fallback", async ({
    page,
  }) => {
    const statement = page.locator("#sample-measure");
    await expect(statement).toHaveAttribute("data-measure", "text");
    await expect(statement).not.toHaveAttribute("style", /.*/);
    await expect(page.locator(".cap-rich-text[style]")).toHaveCount(0);
    await expect(statement).not.toHaveCSS("max-inline-size", "none");
    await expect(page.locator("#sample-titles li").last()).toHaveText("Untitled");
    await expect(page.locator("#sample-paragraph")).toHaveClass("cap-rich-text sample-lead");
  });
});
