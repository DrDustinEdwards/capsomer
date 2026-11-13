import { expect, test } from "@playwright/test";
import { eachTheme, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "pdf-viewer", theme);
    await expect(page.locator("#pdf-live [data-pdf='status']")).toHaveText("Page 1 of 3");
    await expectNoAxeViolations(page);
  });
});

test("keyboard: buttons and keys on the page move through pages and zoom, within the ends", async ({
  page,
}) => {
  await visitStates(page, "pdf-viewer", "light");
  const viewer = page.locator("#pdf-live");
  const status = viewer.locator("[data-pdf='status']");
  await expect(status).toHaveText("Page 1 of 3");
  await expect(viewer.getByRole("button", { name: "Previous page" })).toBeDisabled();
  await viewer.getByRole("button", { name: "Next page" }).click();
  await expect(status).toHaveText("Page 2 of 3");
  await viewer.locator(".cap-pdf-page").focus();
  await page.keyboard.press("End");
  await expect(status).toHaveText("Page 3 of 3");
  await expect(viewer.getByRole("button", { name: "Next page" })).toBeDisabled();
  await page.keyboard.press("+");
  await expect(viewer.locator("[data-pdf='zoom']")).toHaveText("145%");
});

test("behavior: a PDF that fails to load says so and keeps the link", async ({ page }) => {
  await visitStates(page, "pdf-viewer", "light");
  const failed = page.locator("#pdf-failed");
  await expect(failed.getByText("The viewer could not load this PDF.")).toBeVisible();
  await expect(failed.getByRole("link", { name: "Open the PDF" })).toHaveCount(2);
});
