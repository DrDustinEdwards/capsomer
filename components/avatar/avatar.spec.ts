import { expect, test } from "@playwright/test";
import { eachTheme, expectContrast, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "avatar", theme);
    await expectNoAxeViolations(page);
  });

  test("accessibility: the initials and the count reach their contrast", async ({ page }) => {
    await visitStates(page, "avatar", theme);
    await expectContrast(page, [
      { sel: "#av-initials .cap-avatar-fallback", what: "the initials" },
      { sel: "#av-group .cap-avatar-count", what: "the group's count" },
    ]);
  });

  test("accessibility: each avatar is one image named for the person", async ({ page }) => {
    await visitStates(page, "avatar", theme);
    await expect(page.getByRole("img", { name: "Dustin Edwards", exact: true }).first()).toBeVisible();
    await expect(page.getByRole("img", { name: "Dustin Edwards, online" })).toBeVisible();
    await expect(page.getByRole("group", { name: "Contributors" })).toBeVisible();
    await expect(page.getByRole("img", { name: "and 3 more" })).toBeVisible();
  });

  test("behaviour: a picture that fails to load gives way to the initials", async ({ page }) => {
    await visitStates(page, "avatar", theme);
    await expect(page.locator("#av-broken")).toHaveAttribute("data-state", "error");
    await expect(page.locator("#av-broken .cap-avatar-image")).toBeHidden();
    await expect(page.locator("#av-broken .cap-avatar-fallback")).toBeVisible();
    await expect(page.locator("#av-picture")).not.toHaveAttribute("data-state", "error");
  });

  test("behaviour: the initials are in the delivered HTML", async ({ page }) => {
    const html = await (await page.request.get("components/avatar/states.html")).text();
    expect(html).toContain('<span class="cap-avatar-fallback" aria-hidden="true">DE</span>');
  });
});
