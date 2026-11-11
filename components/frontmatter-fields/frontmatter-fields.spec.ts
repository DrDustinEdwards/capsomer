import { expect, test } from "@playwright/test";
import {
  eachTheme,
  expectContrast,
  expectNoAxeViolations,
  visitStates,
} from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "frontmatter-fields", theme);
    await expect(page.locator(".cap-fm")).toHaveCount(4);
    await expectNoAxeViolations(page);
  });

  test("accessibility: the legend, the help and the raw text reach their contrast", async ({
    page,
  }) => {
    await visitStates(page, "frontmatter-fields", theme);
    await expect(page.locator(".cap-fm").first()).toBeVisible();
    await expectContrast(page, [
      { sel: "[data-mount=typed] .cap-fm-legend", what: "the legend" },
      { sel: "[data-mount=typed] .cap-field-help", what: "a list's hint" },
      { sel: "[data-mount=text] .cap-fm-raw-text", what: "the raw text" },
    ]);
  });

  test("keyboard: a list typed with commas keeps its typing and writes [a, b]; Space sets a flag's word", async ({
    page,
  }) => {
    await visitStates(page, "frontmatter-fields", theme);
    const typed = page.locator("[data-mount=typed]");
    const list = typed.getByRole("textbox", { name: "Characters" });
    await expect(list).toHaveAccessibleDescription("Separated by commas.");
    await list.fill("");
    await list.pressSequentially("Jordan Park, ");
    await expect(list).toHaveValue("Jordan Park, ");
    await expect(page.locator("#typed-source")).toContainText("characters: [Jordan Park]");
    await page.keyboard.press("Tab");
    await expect(list).toHaveValue("Jordan Park");

    const specs = page.locator("[data-mount=specs]");
    const flag = specs.getByRole("checkbox", { name: "Draft banner" });
    await flag.focus();
    await page.keyboard.press("Space");
    await expect(page.locator("#specs-source")).toContainText("banner: Draft");
    await page.keyboard.press("Space");
    await expect(page.locator("#specs-source")).not.toContainText("banner:");
    // The block of text no box can say is untouched by every edit above.
    await expect(page.locator("#typed-source")).toContainText(
      "summary: |\n  Two lines\n  of text.",
    );
  });

  test("keyboard: Enter opens the raw text, which names the keys only it holds and edits the file", async ({
    page,
  }) => {
    await visitStates(page, "frontmatter-fields", theme);
    const typed = page.locator("[data-mount=typed]");
    const summary = typed.locator("summary", { hasText: "Edit as text" });
    await summary.focus();
    await page.keyboard.press("Enter");
    const raw = typed.getByRole("textbox", { name: "The frontmatter as text" });
    await expect(raw).toBeVisible();
    await expect(raw).toHaveAccessibleDescription("Only here: summary.");
    // With no box to show, the text starts open.
    await expect(
      page.locator("[data-mount=text]").getByRole("textbox", { name: "The frontmatter as text" }),
    ).toBeVisible();
    await raw.press("End");
    await raw.press("ControlOrMeta+End");
    await page.keyboard.type("\nmood: calm");
    await expect(typed.getByRole("textbox", { name: "Mood" })).toHaveValue("calm");
  });
});
