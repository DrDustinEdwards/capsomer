import { expect, test } from "@playwright/test";
import {
  eachTheme,
  expectContrast,
  expectNoAxeViolations,
  visitStates,
} from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "skeleton", theme);
    await expectNoAxeViolations(page);
  });

  test("accessibility: no axe violations, the centered page spinner", async ({ page }) => {
    await visitStates(page, "skeleton", theme, "page");
    await expectNoAxeViolations(page);
  });

  test("accessibility: the spinner's word and arc reach their contrast", async ({ page }) => {
    await visitStates(page, "skeleton", theme);
    await expectContrast(page, [
      { sel: "#sample-spinner .cap-spinner-label", what: "spinner word" },
      { sel: "#sample-spinner .cap-spinner-arc", what: "spinner arc", min: 3 },
      { sel: "#sample-sizes .cap-spinner-label", what: "small spinner word" },
      { sel: "#sample-comfortable .cap-spinner-label", what: "comfortable spinner word" },
    ]);
  });

  test("accessibility: the page spinner is a status region with its word", async ({ page }) => {
    await visitStates(page, "skeleton", theme, "page");
    await expect(page.getByRole("status")).toHaveText("Loading the Portal");
    await expect(page.locator("main")).toHaveAttribute("aria-busy", "true");
    await expectContrast(page, [
      { sel: "#sample-page .cap-spinner-label", what: "page spinner word" },
    ]);
  });

  test("behavior: the skeleton pulses and the spinner turns when motion is welcome", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await visitStates(page, "skeleton", theme);
    await expect(page.locator("#sample-skeleton .cap-skeleton-line").first()).toHaveCSS(
      "animation-name",
      "cap-skeleton-pulse",
    );
    await expect(page.locator("#sample-shapes .cap-skeleton-block").first()).toHaveCSS(
      "animation-name",
      "cap-skeleton-pulse",
    );
    await expect(page.locator("#sample-spinner .cap-spinner-arc")).toHaveCSS(
      "animation-name",
      "cap-spin",
    );
    await expect(page.locator("#sample-spinner .cap-spinner-arc")).toBeVisible();
  });

  test("behavior: under reduced motion nothing moves, and the word Loading shows alone", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await visitStates(page, "skeleton", theme);
    await expect(page.locator("#sample-skeleton .cap-skeleton-line").first()).toHaveCSS(
      "animation-name",
      "none",
    );
    await expect(page.locator("#sample-shapes .cap-skeleton-block").first()).toHaveCSS(
      "animation-name",
      "none",
    );
    await expect(page.locator("#sample-spinner .cap-spinner-arc")).toBeHidden();
    await expect(page.locator("#sample-spinner .cap-spinner-label")).toBeVisible();
    await expect(page.locator("#sample-spinner")).toHaveText("Loading");
    await expect(page.locator("#sample-hidden-label .cap-spinner-label")).toBeVisible();
  });
});
