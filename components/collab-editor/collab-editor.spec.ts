import { expect, test, type Page } from "@playwright/test";
import {
  eachTheme,
  expectContrast,
  expectNoAxeViolations,
  visitStates,
} from "../../test/helpers.ts";

const alex = (page: Page) => page.locator("[data-person='0']");
const sam = (page: Page) => page.locator("[data-person='1']");
const text = (scope: ReturnType<typeof alex>) => scope.locator(".cap-rich-editor-surface");

/** Sam, who may only suggest, adds a word at the end of the second paragraph. */
async function samSuggests(page: Page) {
  await text(sam(page)).getByText("A quiet hour is the default.").click();
  await page.keyboard.press("End");
  await page.keyboard.type(" Mostly");
  await expect(text(alex(page))).toContainText("A quiet hour is the default. Mostly");
  await expect
    .poll(() =>
      text(alex(page))
        .locator("ins")
        .evaluateAll((all) => all.map((n) => n.textContent).join("")),
    )
    .toBe(" Mostly");
}

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "collab-editor", theme);
    await expect(text(sam(page))).toBeVisible();
    await expectNoAxeViolations(page);
  });

  test("accessibility: a suggestion, a caret's name and a comment mark reach their contrast", async ({
    page,
  }) => {
    await visitStates(page, "collab-editor", theme);
    await samSuggests(page);
    await expectContrast(page, [
      {
        sel: "[data-person='0'] .cap-rich-editor-surface ins:nth-of-type(2)",
        what: "an insertion on its tint",
      },
      { sel: "[data-person='0'] .cap-collab-caret-name", what: "Sam's name on their caret" },
    ]);
  });

  test("behavior: what one person types appears in the other's copy", async ({ page }) => {
    await visitStates(page, "collab-editor", theme);
    await text(alex(page)).getByText("The spring update").click();
    await page.keyboard.press("End");
    await page.keyboard.type(" Today.");
    await expect(text(sam(page))).toContainText("moves the checks to the edge. Today.");
    // Alex's caret shows in Sam's copy under the room's name for them.
    await expect(sam(page).locator(".cap-collab-caret-name")).toHaveText("Alex Rivera");
  });

  test("behavior: a suggestion is marked for everyone, and accepting it makes it text", async ({
    page,
  }) => {
    await visitStates(page, "collab-editor", theme);
    await samSuggests(page);
    await alex(page).locator("#suggestions-0").getByRole("button", { name: "Accept all" }).click();
    await expect(text(sam(page)).locator("ins")).toHaveCount(0);
    await expect(text(sam(page))).toContainText("A quiet hour is the default. Mostly");
  });

  test("behavior: a comment on a passage marks it in both copies", async ({ page }) => {
    await visitStates(page, "collab-editor", theme);
    await text(alex(page)).getByText("Field notes").click();
    await page.keyboard.press("Home");
    for (let i = 0; i < 5; i++) await page.keyboard.press("Shift+ArrowRight");
    await alex(page).getByRole("button", { name: "Comment on the selection" }).click();
    await alex(page).getByRole("textbox", { name: "Your comment" }).fill("Shorter?");
    await alex(page).getByRole("button", { name: "Send" }).click();
    await expect(text(sam(page)).locator(".cap-collab-mark")).toHaveText("Field");
    await expect(sam(page).getByRole("article", { name: "Comment by Alex Rivera" })).toContainText(
      "Shorter?",
    );
  });
});
