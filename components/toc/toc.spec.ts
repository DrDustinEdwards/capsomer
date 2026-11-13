import { expect, test } from "@playwright/test";
import { eachTheme, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "toc", theme);
    await expectNoAxeViolations(page);
  });
});

test("behavior: the section being read is marked, and a link moves focus to its heading", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await visitStates(page, "toc", "light");
  const side = page.locator("#toc-side");
  await expect(side.getByRole("link", { name: "Why payments fail" })).toHaveAttribute(
    "aria-current",
    "location",
  );
  await side.getByRole("link", { name: "When to retry" }).click();
  await expect(page.locator("#t-retry")).toBeFocused();
  await expect(side.getByRole("link", { name: "When to retry" })).toHaveAttribute(
    "aria-current",
    "location",
  );
  expect(new URL(page.url()).hash).toBe("#t-retry");
});
