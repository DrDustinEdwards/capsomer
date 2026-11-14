import { expect, test } from "@playwright/test";
import { eachTheme, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "range-slider", theme);
    await expectNoAxeViolations(page);
  });
});

test("keyboard: arrows move a handle, the low one stays under the high one, and the filter commits once", async ({
  page,
}) => {
  await visitStates(page, "range-slider", "light");
  const low = page.getByRole("slider", { name: "Minimum amount" });
  const high = page.getByRole("slider", { name: "Maximum amount" });
  await low.focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await expect(low).toHaveAttribute("aria-valuetext", "$20");
  await expect(page.locator("#rs-said")).toHaveText("Filtered: 2000 to 50000");
  await expect(high).toHaveAttribute("aria-valuetext", "$500+");
  await high.focus();
  await page.keyboard.press("Home");
  // The high handle stops a step above the low one.
  await expect(high).toHaveValue("3000");
  await expect(page.locator("#rs-live .cap-range-slider-value")).toHaveText("$20 – $30");
});

test("behavior: a press on the track, with no drag, moves the nearer handle there", async ({
  page,
}) => {
  await visitStates(page, "range-slider", "light");
  const track = page.locator("#rs-live .cap-range-slider-track");
  const box = await track.boundingBox();
  if (!box) throw new Error("no track");
  // Near the top end: the high handle comes down to it, and takes focus.
  await page.mouse.click(box.x + box.width * 0.8, box.y + box.height / 2);
  const high = page.getByRole("slider", { name: "Maximum amount" });
  await expect(high).toHaveValue("40000");
  await expect(high).toBeFocused();
});
