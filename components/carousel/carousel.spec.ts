import { expect, test } from "@playwright/test";
import { eachTheme, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "carousel", theme);
    await expectNoAxeViolations(page);
  });

  test("behavior: Next and Previous loop past the ends, the parked slide is inert, and the status speaks once settled", async ({
    page,
  }) => {
    await visitStates(page, "carousel", theme);
    const root = page.locator("#car-loop");
    const status = root.locator(".cap-carousel-status");
    await expect(status).toHaveText("");
    await expect(root.locator(".cap-carousel-track > :last-child")).toHaveJSProperty("inert", true);
    await root.getByRole("button", { name: "Previous slide" }).click();
    await expect(status).toHaveText("Slide 5 of 5");
    await expect(root.getByRole("button", { name: "Go to slide 5" })).toHaveAttribute(
      "aria-current",
      "true",
    );
    await root.getByRole("button", { name: "Next slide" }).click();
    await expect(status).toHaveText("Slide 1 of 5");
    await root.getByRole("button", { name: "Go to slide 3" }).click();
    await expect(status).toHaveText("Slide 3 of 5");
  });

  test("behavior: two slides are finite and the ends disable", async ({ page }) => {
    await visitStates(page, "carousel", theme);
    const root = page.locator("#car-finite");
    await expect(root.getByRole("button", { name: "Previous slide" })).toBeDisabled();
    await root.getByRole("button", { name: "Next slide" }).click();
    await expect(root.locator(".cap-carousel-status")).toHaveText("Slide 2 of 2");
    await expect(root.getByRole("button", { name: "Next slide" })).toBeDisabled();
  });

  test("keyboard: the track takes focus and the arrow keys scroll it", async ({ page }) => {
    await visitStates(page, "carousel", theme);
    const root = page.locator("#car-finite");
    const track = root.locator(".cap-carousel-track");
    await track.focus();
    await page.keyboard.press("ArrowRight");
    await expect(root.locator(".cap-carousel-status")).toHaveText("Slide 2 of 2");
  });
});
