import { expect, test } from "@playwright/test";
import { eachTheme, expectContrast, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "select", theme);
    await expectNoAxeViolations(page);
  });

  test("accessibility: no axe violations with the popup open", async ({ page }) => {
    await visitStates(page, "select", theme);
    await page.getByRole("combobox", { name: /^Owner/ }).first().click();
    await expect(page.getByRole("listbox", { name: /^Owner/ })).toBeVisible();
    await expectNoAxeViolations(page);
  });

  test("accessibility: words and edges reach their contrast", async ({ page }) => {
    await visitStates(page, "select", theme);
    await expectContrast(page, [
      { sel: "#sel-platform .cap-select-value", what: "the chosen option" },
      { sel: "#sel-owner .cap-select-value", what: "the placeholder" },
      { sel: "#sel-platform", what: "a select's edge", part: "border" },
      { sel: "#sel-hover", what: "a hovered select's edge", part: "border" },
      { sel: "#sel-invalid", what: "an invalid select's edge", part: "border" },
      { sel: "#sel-invalid-e", what: "an error message" },
      { sel: "#sel-disabled-h", what: "the reason beside a disabled select" },
      { sel: "#sel-native", what: "the native select's value" },
      { sel: "#sel-native", what: "the native select's edge", part: "border" },
      { sel: "#sel-native-bad", what: "the native invalid select's edge", part: "border" },
    ]);
  });

  test("accessibility: the popup's options, check and groups reach their contrast", async ({ page }) => {
    await visitStates(page, "select", theme);
    await page.getByRole("combobox", { name: /^Owner/ }).click();
    await expect(page.getByRole("listbox", { name: /^Owner/ })).toBeVisible();
    await expectContrast(page, [
      { sel: ".cap-select-popup .cap-listbox-label", what: "a group's label" },
      { sel: ".cap-select-popup .cap-option:not([aria-disabled])", what: "an option" },
      { sel: ".cap-select-popup .cap-option[data-active]", what: "the current option" },
    ]);
  });

  test("accessibility: roles, names and values", async ({ page }) => {
    await visitStates(page, "select", theme);
    const platform = page.getByRole("combobox", { name: "Platform" });
    await expect(platform).toHaveText("Cloudflare");
    await expect(platform).toHaveAttribute("aria-haspopup", "listbox");
    await expect(platform).toHaveAttribute("aria-expanded", "false");
    await expect(page.getByRole("combobox", { name: /^Owner/ })).toHaveAttribute("aria-required", "true");
    await expect(page.getByRole("combobox", { name: /^Owner/ })).toHaveText("Choose an agent");
    await expect(page.locator("#sel-invalid")).toHaveAccessibleDescription("Choose who owns this job. It cannot run without an owner.");
    await expect(page.locator("#sel-invalid")).toHaveAttribute("aria-invalid", "true");
    await expect(page.locator("#sel-disabled")).toBeDisabled();
    await expect(page.locator("#sel-disabled")).toHaveAccessibleDescription("Locked while a deploy is running.");
    await expect(page.getByRole("combobox", { name: "Sort by", exact: true })).toBeVisible();
  });

  test("accessibility: the open list is a named listbox with groups, a chosen option and a disabled one", async ({ page }) => {
    await visitStates(page, "select", theme);
    const owner = page.getByRole("combobox", { name: /^Owner/ });
    await owner.click();
    await expect(owner).toHaveAttribute("aria-expanded", "true");
    const list = page.getByRole("listbox", { name: /^Owner/ });
    await expect(list.getByRole("group", { name: "Agents" })).toBeVisible();
    await expect(list.getByRole("group", { name: "People" })).toBeVisible();
    await expect(list.getByRole("option", { name: "Choose an agent" })).toHaveAttribute("aria-selected", "true");
    await expect(list.getByRole("option", { name: "seat-start (paused)" })).toHaveAttribute("aria-disabled", "true");
  });

  test("keyboard: Tab moves focus to the select and shows a ring", async ({ page }) => {
    await visitStates(page, "select", theme);
    await page.keyboard.press("Tab");
    await expect(page.getByRole("combobox", { name: "Platform" })).toBeFocused();
    await expectContrast(page, [{ sel: "#sel-platform", what: "the focus ring", part: "outline", min: 3 }]);
  });

  test("keyboard: Enter, Space and the arrow keys open the list with the chosen option current", async ({ page }) => {
    await visitStates(page, "select", theme);
    const every = page.getByRole("combobox", { name: "Check every" });
    for (const key of ["Enter", "Space", "ArrowDown", "ArrowUp"]) {
      await every.focus();
      await page.keyboard.press(key);
      const list = page.getByRole("listbox", { name: "Check every" });
      await expect(list, key).toBeVisible();
      await expect(list).toBeFocused();
      await expect(list.getByRole("option", { name: "5 minutes", exact: true })).toHaveAttribute("data-active", "");
      await page.keyboard.press("Escape");
      await expect(list).toBeHidden();
    }
  });

  test("keyboard: arrows move, Enter chooses and closes, focus returns, and the native select changes", async ({ page }) => {
    await visitStates(page, "select", theme);
    const every = page.getByRole("combobox", { name: "Check every" });
    const native = page.locator("#sel-every-native");
    await page.evaluate(() => {
      const w = window as unknown as { changes: number };
      w.changes = 0;
      document.querySelector("#sel-every-native")?.addEventListener("change", () => w.changes++);
    });
    await every.focus();
    await page.keyboard.press("Space");
    await expect(page.getByRole("listbox", { name: "Check every" })).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await expect(native).toHaveValue("15");
    await expect(every).toHaveText("15 minutes");
    await expect(every).toBeFocused();
    await expect(page.getByRole("listbox", { name: "Check every" })).toBeHidden();
    expect(await page.evaluate(() => (window as unknown as { changes: number }).changes)).toBe(1);
  });

  test("keyboard: Esc closes without changing and returns focus to the select", async ({ page }) => {
    await visitStates(page, "select", theme);
    const every = page.getByRole("combobox", { name: "Check every" });
    await every.focus();
    await page.keyboard.press("Space");
    await expect(page.getByRole("listbox", { name: "Check every" })).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Escape");
    await expect(page.locator("#sel-every-native")).toHaveValue("5");
    await expect(every).toHaveText("5 minutes");
    await expect(every).toBeFocused();
  });

  test("keyboard: typing letters on the closed select chooses the first option that starts with them", async ({ page }) => {
    await visitStates(page, "select", theme);
    const platform = page.getByRole("combobox", { name: "Platform" });
    await platform.focus();
    await page.keyboard.type("v");
    await expect(page.locator("#sel-platform-native")).toHaveValue("vercel");
    await expect(platform).toHaveText("Vercel");
    await expect(page.getByRole("listbox", { name: "Platform" })).toBeHidden();
  });

  test("keyboard: typing letters in the open list moves to the matching option, Home and End go to the ends", async ({ page }) => {
    await visitStates(page, "select", theme);
    await page.getByRole("combobox", { name: "Platform" }).click();
    const list = page.getByRole("listbox", { name: "Platform" });
    await expect(list).toBeFocused();
    await page.keyboard.type("g");
    await expect(list.getByRole("option", { name: "GitHub Pages" })).toHaveAttribute("data-active", "");
    await page.keyboard.press("End");
    await expect(list.getByRole("option", { name: "Fly.io" })).toHaveAttribute("data-active", "");
    await page.keyboard.press("Home");
    await expect(list.getByRole("option", { name: "Cloudflare" })).toHaveAttribute("data-active", "");
    await page.keyboard.press("Enter");
    await expect(page.locator("#sel-platform-native")).toHaveValue("cloudflare");
  });

  test("keyboard: arrows skip a disabled option", async ({ page }) => {
    await visitStates(page, "select", theme);
    await page.getByRole("combobox", { name: /^Owner/ }).click();
    await expect(page.getByRole("listbox", { name: /^Owner/ })).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowDown");
    await expect(page.getByRole("option", { name: "improve-loop" })).toHaveAttribute("data-active", "");
    await page.keyboard.press("ArrowDown");
    await expect(page.getByRole("option", { name: "Dustin" })).toHaveAttribute("data-active", "");
  });

  test("keyboard: Tab from the open list closes it and moves on", async ({ page }) => {
    await visitStates(page, "select", theme);
    await page.getByRole("combobox", { name: "Platform" }).click();
    await expect(page.getByRole("listbox", { name: "Platform" })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("listbox", { name: "Platform" })).toBeHidden();
  });

  test("behaviour: a click chooses an option and closes; a disabled option cannot be chosen", async ({ page }) => {
    await visitStates(page, "select", theme);
    const owner = page.getByRole("combobox", { name: /^Owner/ });
    await owner.click();
    await page.getByRole("option", { name: "seat-start (paused)" }).click({ force: true });
    await expect(page.locator("#sel-owner-native")).toHaveValue("");
    await expect(page.getByRole("listbox", { name: /^Owner/ })).toBeVisible();
    await page.getByRole("option", { name: "Dustin" }).click();
    await expect(page.locator("#sel-owner-native")).toHaveValue("dustin");
    await expect(owner).toHaveText("Dustin");
    await expect(page.getByRole("listbox", { name: /^Owner/ })).toBeHidden();
  });

  test("behaviour: the chosen option shows a check and the popup is at least as wide as the button", async ({ page }) => {
    await visitStates(page, "select", theme);
    const platform = page.getByRole("combobox", { name: "Platform" });
    await platform.click();
    const list = page.getByRole("listbox", { name: "Platform" });
    await expect(list.getByRole("option", { name: "Cloudflare" }).locator(".cap-option-indicator")).toBeVisible();
    await expect(list.getByRole("option", { name: "Vercel" }).locator(".cap-option-indicator")).toBeHidden();
    const [t, p] = await page.evaluate(() => [document.querySelector("#sel-platform")?.getBoundingClientRect().width ?? 0, document.querySelector(".cap-select-popup:popover-open")?.getBoundingClientRect().width ?? 0]);
    expect(p).toBeGreaterThanOrEqual((t ?? 0) - 2);
  });

  test("behaviour: the native select stays in the page with its options and is out of the tab order", async ({ page }) => {
    await visitStates(page, "select", theme);
    await expect(page.locator("#sel-platform-native option")).toHaveCount(5);
    await expect(page.locator("#sel-platform-native")).toBeHidden();
    await expect(page.locator("#sel-platform-native")).toHaveAttribute("aria-hidden", "true");
  });

  test("keyboard: the native select (no enhancement) is operable by typing", async ({ page }) => {
    await visitStates(page, "select", theme);
    const sel = page.locator("#sel-native");
    await sel.focus();
    await page.keyboard.type("o");
    await expect(sel).toHaveValue("old");
  });
});
