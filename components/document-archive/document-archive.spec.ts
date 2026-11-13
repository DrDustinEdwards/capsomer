import { expect, test } from "@playwright/test";
import {
  eachTheme,
  expectContrast,
  expectNoAxeViolations,
  visitStates,
} from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "document-archive", theme);
    await expectNoAxeViolations(page);
  });

  test("accessibility: the subtitle and sizes reach their contrast", async ({ page }) => {
    await visitStates(page, "document-archive", theme);
    await expectContrast(page, [
      { sel: ".cap-docview-sub", what: "a document's subtitle" },
      { sel: ".cap-docview-download .cap-link-meta", what: "the format and size" },
      { sel: ".cap-archive-empty", what: "an empty category's line" },
    ]);
  });

  test("accessibility: each category is a named list of links to its documents", async ({
    page,
  }) => {
    await visitStates(page, "document-archive", theme);
    const list = page.getByRole("list", { name: "Field notes", exact: true });
    await expect(list.getByRole("link")).toHaveText([
      "Field notes, spring",
      "Release notes, version 4",
    ]);
    await expect(page.getByRole("link", { name: "All 3 annual reports" })).toBeVisible();
  });

  test("keyboard: Tab goes from the download to the viewer, then Previous, then Next", async ({
    page,
  }) => {
    await visitStates(page, "document-archive", theme);
    const doc = page.locator("#s-page ~ *");
    await doc.getByRole("link", { name: "Download the PDF" }).focus();
    await page.keyboard.press("Tab");
    await expect(doc.getByRole("link", { name: "Open the PDF" })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(doc.getByRole("link", { name: "Previous: Annual report 2026" })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(doc.getByRole("link", { name: "Next: Annual report 2024" })).toBeFocused();
  });

  test("behavior: an end has only its one neighbor", async ({ page }) => {
    await visitStates(page, "document-archive", theme);
    await expect(page.locator("#s-first ~ * .cap-signs").getByRole("link")).toHaveText([
      "Next: Annual report 2025",
    ]);
    await expect(page.locator("#s-last ~ * .cap-signs").getByRole("link")).toHaveText([
      "Previous: Annual report 2025",
    ]);
  });
});
