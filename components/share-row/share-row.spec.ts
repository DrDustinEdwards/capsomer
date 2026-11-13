import { expect, test } from "@playwright/test";
import {
  eachTheme,
  expectContrast,
  expectNoAxeViolations,
  visitStates,
} from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations, and the links reach their contrast", async ({ page }) => {
    await visitStates(page, "share-row", theme);
    await expect(page.locator("[data-mount] .cap-share")).toBeVisible();
    await expectNoAxeViolations(page);
    await expectContrast(page, [{ sel: "#share-default .cap-share-link", what: "a service link" }]);
  });
});

test("behavior: each service's link carries the page's address and title", async ({ page }) => {
  await visitStates(page, "share-row", "light");
  const row = page.locator("[data-mount] .cap-share");
  const href = async (name: string) =>
    new URL((await row.getByRole("link", { name }).getAttribute("href")) ?? "");
  const x = await href("Share on X");
  expect([x.hostname, x.searchParams.get("url"), x.searchParams.get("text")]).toEqual([
    "x.com",
    "https://example.com/spring-update",
    "Spring update",
  ]);
  expect((await href("Share on LinkedIn")).searchParams.get("url")).toBe(
    "https://example.com/spring-update",
  );
  expect((await href("Share on Bluesky")).searchParams.get("text")).toBe(
    "Spring update https://example.com/spring-update",
  );
  expect((await href("Share on Facebook")).searchParams.get("u")).toBe(
    "https://example.com/spring-update",
  );
  const mail = await row.getByRole("link", { name: "Share on Email" }).getAttribute("href");
  expect(mail).toBe(
    "mailto:?subject=Spring%20update&body=https%3A%2F%2Fexample.com%2Fspring-update",
  );
});
