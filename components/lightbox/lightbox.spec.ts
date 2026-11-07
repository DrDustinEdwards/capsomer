import { expect, test } from "@playwright/test";
import { eachTheme, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations with the viewer open", async ({ page }) => {
    await visitStates(page, "lightbox", theme);
    await page.locator("#sample-photo").click();
    await expect(page.getByRole("dialog", { name: "A blue disc on a pale ground" })).toBeVisible();
    await expectNoAxeViolations(page);
  });

  test("keyboard: Enter on a diagram opens the viewer, and Esc returns focus to it", async ({
    page,
  }) => {
    await visitStates(page, "lightbox", theme);
    const diagram = page.locator("#sample-diagram");
    await expect(diagram).toHaveAccessibleName(
      "Enlarge diagram: Reads go to assembly, then annotation.",
    );
    await diagram.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("dialog", { name: "Diagram, full size" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(diagram).toBeFocused();
  });

  test("behavior: Close and the backdrop close the viewer and focus returns to the link", async ({
    page,
  }) => {
    await visitStates(page, "lightbox", theme);
    const link = page.locator("#sample-photo");
    await link.click();
    await page.getByRole("button", { name: "Close" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(link).toBeFocused();
    await link.click();
    await expect(page.getByRole("dialog")).toBeVisible();
    // The grow covers the page until its view transition ends; wait it out before pressing on
    // the backdrop. :active-view-transition is set the moment the transition starts, so this
    // cannot pass before the animations exist, as a check on getAnimations() could.
    await page.waitForFunction(() => !document.documentElement.matches(":active-view-transition"));
    await page.mouse.click(5, 5);
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("behavior: a modified click leaves the link alone", async ({ page }) => {
    await visitStates(page, "lightbox", theme);
    await page.locator("#sample-photo").click({ modifiers: ["Shift"] });
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });
});
