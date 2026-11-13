import { expect, test } from "@playwright/test";
import {
  eachTheme,
  expectContrast,
  expectNoAxeViolations,
  visitStates,
} from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "annotated-figure", theme);
    await expectNoAxeViolations(page);
  });

  test("accessibility: labels, leaders and the key reach their contrast", async ({ page }) => {
    await visitStates(page, "annotated-figure", theme);
    await expectContrast(page, [
      { sel: "#af-default .cap-annotated-figure-label", what: "a callout's label" },
      { sel: "#af-default .cap-annotated-figure-caption", what: "the caption" },
      { sel: "#af-key .cap-annotated-key-num", what: "a key entry's number" },
      { sel: "#af-key .cap-annotated-key-name", what: "a key entry's name" },
      { sel: "#af-key .cap-annotated-key-note", what: "a key entry's note" },
      { sel: "#af-key .cap-annotated-key-entry", what: "the key's rules", part: "border" },
    ]);
  });

  test(
    "accessibility: one drawing is exposed, named and described, at each width",
    { tag: "@markup" },
    async ({ page }) => {
      await visitStates(page, "annotated-figure", theme);
      const wide = page.locator("#af-default");
      await expect(wide.getByRole("group", { name: "Figure 1. The parts of a page." })).toHaveCount(
        1,
      );
      await expect(wide.locator("[data-layout='wide']")).toBeVisible();
      await expect(wide.getByRole("img", { name: "Part 3, content" })).toHaveCount(1);
      const narrow = page.locator("#af-narrow");
      await expect(narrow.locator("[data-layout='narrow']")).toBeVisible();
      await expect(narrow.locator("[data-layout='wide']")).toBeHidden();
    },
  );

  test("behavior: a hover lights a callout and its key entry; a tap pins it", async ({ page }) => {
    await visitStates(page, "annotated-figure", theme);
    const entry = page.locator("#af-key [data-callout='2']");
    const target = page.locator(
      "#af-default [data-layout='wide'] .cap-annotated-figure-target[data-callout='2']",
    );
    const leader = page.locator(
      "#af-default [data-layout='wide'] .cap-annotated-figure-leader[data-callout='2']",
    );
    await entry.hover();
    await expect(target).toHaveAttribute("data-lit", "");
    await expect(leader).toHaveAttribute("data-lit", "");
    await page.mouse.move(0, 0);
    await expect(target).not.toHaveAttribute("data-lit");
    await entry.click();
    await page.mouse.move(0, 0);
    await expect(target).toHaveAttribute("data-lit", "");
    await entry.click();
    await page.mouse.move(0, 0);
    await expect(target).not.toHaveAttribute("data-lit");
  });
});
