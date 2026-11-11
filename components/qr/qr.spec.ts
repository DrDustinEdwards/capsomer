import { expect, test } from "@playwright/test";
import {
  eachTheme,
  expectContrast,
  expectNoAxeViolations,
  visitStates,
} from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "qr", theme);
    await expectNoAxeViolations(page);
  });

  test("accessibility: the code is named for its address, which is shown as text", async ({
    page,
  }) => {
    await visitStates(page, "qr", theme);
    const figure = page.locator("#qr-default");
    await expect(
      figure.getByRole("img", { name: "QR code for https://example.com/guides/getting-started" }),
    ).toBeVisible();
    await expect(figure.locator(".cap-qr-url")).toHaveText(
      "https://example.com/guides/getting-started",
    );
    await expectContrast(page, [
      { sel: "#qr-default .cap-qr-caption", what: "what the code is for" },
      { sel: "#qr-default .cap-qr-url", what: "the address" },
    ]);
  });

  test("accessibility: the code stays black on white in either theme", async ({ page }) => {
    await visitStates(page, "qr", theme);
    const fills = await page
      .locator("#qr-default svg")
      .evaluate((svg) => [
        getComputedStyle(svg.querySelector("rect")!).fill,
        getComputedStyle(svg.querySelector("path")!).fill,
      ]);
    expect(fills).toEqual(["rgb(255, 255, 255)", "rgb(0, 0, 0)"]);
  });
});
