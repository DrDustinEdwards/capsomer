import { expect, test, type Page } from "@playwright/test";
import { eachTheme, expectContrast, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

// The ids are the examples' own (examples.html): #r-* a single-select list, #n-* multi,
// #g-* grouped, #f-* an input-driven filtered list, #i-* roving.
const activeOf = (page: Page, list: string) => page.locator(list).evaluate((el) => el.getAttribute("aria-activedescendant"));
const selectedIds = (page: Page, list: string) => page.locator(`${list} [role='option'][aria-selected='true']`).evaluateAll((els) => els.map((e) => e.id));
const focusedId = (page: Page) => page.evaluate(() => document.activeElement?.id ?? "");

// Records the cap:option-select events a list emits.
async function recordSelects(page: Page, list: string) {
  await page.locator(list).evaluate((el) => {
    const w = window as unknown as { __selects: unknown[] };
    w.__selects = [];
    el.addEventListener("cap:option-select", (e) => w.__selects.push((e as CustomEvent).detail.value));
  });
  return () => page.evaluate(() => (window as unknown as { __selects: unknown[] }).__selects);
}

eachTheme((theme) => {
  test.beforeEach(async ({ page }) => {
    await visitStates(page, "listbox", theme);
  });

  test("accessibility: no axe violations", async ({ page }) => {
    await expectNoAxeViolations(page);
  });

  test("accessibility: text, the current option, key caps, the check and the group label reach their contrast", async ({ page }) => {
    await expectContrast(page, [
      { sel: "#r-fra .cap-option-label", what: "an option" },
      { sel: "#v-jobs .cap-option-label", what: "the current option on its tint" },
      { sel: "#c-revoke .cap-option-label", what: "a destructive option when current" },
      { sel: "#g-over kbd", what: "a key cap" },
      { sel: "#g-over .cap-option-keys", what: "the shortcut text" },
      { sel: "#g-stop .cap-option-hint", what: "a note in words" },
      { sel: "#g-go", what: "a group label" },
      { sel: "#r-pdx .cap-option-indicator", what: "the check on the chosen option", min: 3 },
      { sel: ".cap-listbox-empty:not(:empty)", what: "the no-match line" },
    ]);
  });

  test("accessibility: the current option is marked by more than its colour", async ({ page }) => {
    const mark = (sel: string) => page.locator(sel).evaluate((el) => getComputedStyle(el).boxShadow);
    expect(await mark("#v-jobs")).not.toBe("none");
    expect(await mark("#v-agents")).toBe("none");
  });

  test("accessibility: roles, names, groups and selection state", async ({ page }) => {
    const grouped = page.getByRole("listbox", { name: "Commands, grouped" });
    await expect(grouped.getByRole("group", { name: "Go to" }).getByRole("option")).toHaveCount(2);
    await expect(grouped.getByRole("group", { name: "Actions" }).getByRole("option")).toHaveCount(2);
    await expect(grouped.getByRole("option", { name: /Overview/ })).toHaveAccessibleName(/Overview.*shortcut g o/);
    const region = page.getByRole("listbox", { name: "Region" });
    await expect(region.getByRole("option", { name: "Oregon" })).toHaveAttribute("aria-selected", "true");
    await expect(region.getByRole("option", { name: "Frankfurt" })).toHaveAttribute("aria-selected", "false");
    await expect(region.getByRole("option", { name: /Sydney/ })).toHaveAttribute("aria-disabled", "true");
    await expect(page.getByRole("listbox", { name: "Notify me about" })).toHaveAttribute("aria-multiselectable", "true");
  });

  test("keyboard: arrows move the active descendant and skip a disabled option", async ({ page }) => {
    const list = page.getByRole("listbox", { name: "Region" });
    await list.focus();
    // Focus lands on the chosen option.
    expect(await activeOf(page, "[aria-label='Region']")).toBe("r-pdx");
    await page.keyboard.press("ArrowDown");
    expect(await activeOf(page, "[aria-label='Region']")).toBe("r-sin");
    await page.keyboard.press("ArrowDown");
    expect(await activeOf(page, "[aria-label='Region']"), "Sydney is disabled and the list does not wrap").toBe("r-sin");
    await page.keyboard.press("ArrowUp");
    await page.keyboard.press("ArrowUp");
    expect(await activeOf(page, "[aria-label='Region']")).toBe("r-fra");
    await page.keyboard.press("ArrowUp");
    expect(await activeOf(page, "[aria-label='Region']")).toBe("r-fra");
    await expect(page.locator("#r-fra")).toHaveAttribute("data-active", "");
    await expect(page.locator("#r-pdx")).not.toHaveAttribute("data-active", "");
  });

  test("keyboard: Home and End go to the first and last enabled option", async ({ page }) => {
    await page.getByRole("listbox", { name: "Region" }).focus();
    await page.keyboard.press("End");
    expect(await activeOf(page, "[aria-label='Region']")).toBe("r-sin");
    await page.keyboard.press("Home");
    expect(await activeOf(page, "[aria-label='Region']")).toBe("r-fra");
    await page.keyboard.press("PageDown");
    expect(await activeOf(page, "[aria-label='Region']")).toBe("r-sin");
    await page.keyboard.press("PageUp");
    expect(await activeOf(page, "[aria-label='Region']")).toBe("r-fra");
  });

  test("keyboard: typeahead moves to the option that starts with the letters, skipping a disabled one", async ({ page }) => {
    await page.getByRole("listbox", { name: "Region" }).focus();
    await page.keyboard.press("s");
    expect(await activeOf(page, "[aria-label='Region']"), "S finds Singapore, not the disabled Sydney").toBe("r-sin");
    await page.waitForTimeout(800);
    await page.keyboard.press("f");
    expect(await activeOf(page, "[aria-label='Region']")).toBe("r-fra");
    await page.waitForTimeout(800);
    await page.keyboard.type("or");
    expect(await activeOf(page, "[aria-label='Region']")).toBe("r-pdx");
  });

  test("keyboard: Enter and Space choose the active option, once, and emit cap:option-select", async ({ page }) => {
    const selects = await recordSelects(page, "[aria-label='Region']");
    await page.getByRole("listbox", { name: "Region" }).focus();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    expect(await selectedIds(page, "[aria-label='Region']")).toEqual(["r-sin"]);
    await page.keyboard.press("Home");
    await page.keyboard.press("Space");
    expect(await selectedIds(page, "[aria-label='Region']")).toEqual(["r-fra"]);
    expect(await selects()).toEqual(["r-sin", "r-fra"]);
  });

  test("keyboard: a multiple list toggles with Space and keeps every chosen option", async ({ page }) => {
    await page.getByRole("listbox", { name: "Notify me about" }).focus();
    expect(await selectedIds(page, "[aria-label='Notify me about']")).toEqual(["n-fail", "n-done"]);
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Space");
    expect(await selectedIds(page, "[aria-label='Notify me about']")).toEqual(["n-fail", "n-pause", "n-done"]);
    await page.keyboard.press("Space");
    expect(await selectedIds(page, "[aria-label='Notify me about']")).toEqual(["n-fail", "n-done"]);
  });

  test("keyboard: with focus in an input, the arrows move the active descendant and Enter chooses; focus stays in the input", async ({ page }) => {
    const input = page.getByRole("combobox", { name: "Find a site" });
    const selects = await recordSelects(page, "#f-list");
    await input.focus();
    expect(await input.getAttribute("aria-activedescendant")).toBe("f-a");
    await page.keyboard.press("ArrowDown");
    expect(await input.getAttribute("aria-activedescendant")).toBe("f-b");
    await page.keyboard.press("Enter");
    expect(await selects()).toEqual(["f-b"]);
    expect(await focusedId(page)).toBe("f-input");
    // Home and End still move the caret in the input.
    await page.keyboard.press("Home");
    expect(await input.getAttribute("aria-activedescendant")).toBe("f-b");
  });

  test("keyboard: roving mode moves focus between the options", async ({ page }) => {
    await page.locator("#i-5").focus();
    await page.keyboard.press("ArrowDown");
    expect(await focusedId(page)).toBe("i-15");
    await page.keyboard.press("Home");
    expect(await focusedId(page)).toBe("i-1");
    await page.keyboard.press("Enter");
    expect(await selectedIds(page, "[aria-label='Interval']")).toEqual(["i-1"]);
    await expect(page.locator("#i-1")).toHaveAttribute("tabindex", "0");
    await expect(page.locator("#i-5")).toHaveAttribute("tabindex", "-1");
  });

  test("behaviour: typing filters by label and keyword, announces the count, and says when nothing matches", async ({ page }) => {
    const input = page.getByRole("combobox", { name: "Find a site" });
    const status = page.locator("[data-cap-part='count']");
    await input.fill("blog");
    await expect(page.locator("#f-a")).toBeVisible();
    await expect(page.locator("#f-b")).toBeHidden();
    await expect(status).toHaveText("1 result");
    expect(await input.getAttribute("aria-activedescendant"), "the first match becomes active").toBe("f-a");
    await input.fill("ap");
    await expect(status).toHaveText("2 results");
    await input.fill("zebra");
    await expect(page.locator("#f-list")).toBeHidden();
    await expect(page.locator("#f-list + .cap-listbox-empty")).toHaveText("No results for “zebra”");
    expect(await input.getAttribute("aria-activedescendant")).toBeNull();
    await input.fill("");
    await expect(page.locator("#f-list [role='option']:visible")).toHaveCount(3);
    await expect(status).toHaveText("");
    await expect(page.locator("#f-list + .cap-listbox-empty")).toBeHidden();
  });

  test("behaviour: the pointer moves the active option, and clicking chooses it", async ({ page }) => {
    const selects = await recordSelects(page, "[aria-label='Region']");
    await page.locator("#r-sin").hover();
    expect(await activeOf(page, "[aria-label='Region']")).toBe("r-sin");
    await page.locator("#r-syd").hover();
    expect(await activeOf(page, "[aria-label='Region']"), "a disabled option is not made active").toBe("r-sin");
    await page.locator("#r-fra").click();
    expect(await selectedIds(page, "[aria-label='Region']")).toEqual(["r-fra"]);
    await page.locator("#r-syd").click({ force: true });
    expect(await selects()).toEqual(["r-fra"]);
  });

  test("behaviour: a group hides with its last option, a separator only shows between two shown groups, a group name finds its options", async ({ page }) => {
    const input = page.getByRole("combobox", { name: "Find a site" });
    await input.fill("blog");
    await expect(page.getByRole("group", { name: "Tools" })).toBeHidden();
    await expect(page.getByRole("group", { name: "Writing" })).toBeVisible();
    await expect(page.locator("#f-list .cap-listbox-separator")).toBeHidden();
    await input.fill("tools");
    await expect(page.locator("#f-list [role='option']:visible")).toHaveCount(2);
    await expect(page.getByRole("group", { name: "Writing" })).toBeHidden();
    await input.fill("");
    await expect(page.locator("#f-list .cap-listbox-separator")).toBeVisible();
  });
});
