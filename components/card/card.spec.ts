import { expect, test } from "@playwright/test";
import {
  eachTheme,
  expectContrast,
  expectNoAxeViolations,
  visitStates,
} from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "card", theme);
    await expectNoAxeViolations(page);
    await expect(page.getByRole("link", { name: /getting started/i })).toBeVisible();
  });

  test("accessibility: headings and text reach their contrast", async ({ page }) => {
    await visitStates(page, "card", theme);
    await expectContrast(page, [
      { sel: "#card-link h3", what: "a linked card's heading" },
      { sel: "#card-link p", what: "a linked card's text" },
      { sel: "#card-actions .cap-card-link", what: "a stretched heading link" },
    ]);
  });

  test("behavior: a click anywhere on a stretched card follows its heading link, and its own button stays its own", async ({
    page,
  }) => {
    await visitStates(page, "card", theme);
    const card = page.locator("#card-actions");
    await card.scrollIntoViewIfNeeded();
    const box = (await card.boundingBox())!;
    await page.mouse.click(box.x + box.width - 8, box.y + box.height / 2);
    await expect(page).toHaveURL(/#release-notes$/);
    expect(
      await page
        .locator("#card-save")
        .evaluate(
          (el) =>
            document.elementFromPoint(
              el.getBoundingClientRect().x + 4,
              el.getBoundingClientRect().y + 4,
            ) === el,
        ),
    ).toBe(true);
  });

  test("keyboard: a stretched card draws focus on the card, and a choice card checks with Space", async ({
    page,
  }) => {
    await visitStates(page, "card", theme);
    await page.locator("#card-actions .cap-card-link").focus();
    await expect(page.locator("#card-actions")).toHaveCSS("outline-style", "solid");
    await page.locator("#choice-plus input").focus();
    await page.keyboard.press("Space");
    await expect(page.locator("#choice-plus input")).toBeChecked();
    // The checked edge changes color, never the box.
    const before = await page.locator("#choice-plus").boundingBox();
    await expect(page.locator("#choice-plus")).toHaveCSS("outline-style", "solid");
    expect(await page.locator("#choice-plus").boundingBox()).toEqual(before);
  });
});
