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

  test("accessibility: the subtitle, sizes and the pager reach their contrast", async ({
    page,
  }) => {
    await visitStates(page, "document-archive", theme);
    await expectContrast(page, [
      { sel: ".cap-docview-sub", what: "a document's subtitle" },
      { sel: ".cap-docview-download .cap-link-meta", what: "the format and size" },
      { sel: ".cap-archive-empty", what: "an empty category's line" },
      { sel: ".cap-docpager-dir", what: "Previous and Next" },
      { sel: ".cap-docpager-title", what: "a neighbor's title" },
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
    await expect(doc.getByRole("link", { name: "Previous Annual report 2026" })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(doc.getByRole("link", { name: "Next Annual report 2024" })).toBeFocused();
  });

  test("behavior: an end has only its one neighbor, and Next keeps the right-hand side", async ({
    page,
  }) => {
    await visitStates(page, "document-archive", theme);
    const first = page.locator("#s-first ~ * .cap-docpager");
    await expect(first.getByRole("link")).toHaveCount(1);
    const next = first.locator("[rel='next']");
    const navBox = await first.boundingBox();
    const nextBox = await next.boundingBox();
    expect(Math.round((nextBox?.x ?? 0) + (nextBox?.width ?? 0))).toBe(
      Math.round((navBox?.x ?? 0) + (navBox?.width ?? 0)),
    );
    await expect(page.locator("#s-last ~ * .cap-docpager").getByRole("link")).toHaveText([
      "Previous Annual report 2025",
    ]);
  });
});
