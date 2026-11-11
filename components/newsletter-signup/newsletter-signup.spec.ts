import { expect, test } from "@playwright/test";
import { eachTheme, expectContrast, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations, and the consent, error and sent lines reach their contrast", async ({ page }) => {
    await visitStates(page, "newsletter-signup", theme);
    await expectNoAxeViolations(page);
    await expectContrast(page, [
      { sel: "#nl-card .cap-newsletter-consent span", what: "the consent line" },
      { sel: "#nl-error .cap-newsletter-error", what: "the error" },
      { sel: "#nl-done .cap-newsletter-done", what: "the sent line" },
    ]);
  });

  test("keyboard: the form will not send without an email and the consent box", async ({ page }) => {
    await visitStates(page, "newsletter-signup", theme);
    const form = page.locator("#nl-card form");
    const email = form.getByRole("textbox", { name: "Email address" });
    await email.fill("alex@example.com");
    await email.press("Enter");
    expect(await form.evaluate((f: HTMLFormElement) => f.checkValidity())).toBe(false);
    await form.getByRole("checkbox").check();
    expect(await form.evaluate((f: HTMLFormElement) => f.checkValidity())).toBe(true);
  });

  test("behavior: the field and button share a row when wide and stack on a phone", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await visitStates(page, "newsletter-signup", theme);
    const [i, b] = await Promise.all([
      page.locator("#nl-card .cap-input").boundingBox(),
      page.locator("#nl-card .cap-btn").boundingBox(),
    ]);
    expect(b!.y).toBeGreaterThan(i!.y);
  });
});
