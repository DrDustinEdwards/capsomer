import { expect, test, type Page } from "@playwright/test";
import { eachTheme, expectContrast, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

// Serves the states page with style-src 'self' (no inline styles), as the apps do, and
// records every violation. Base UI writes positions and visually-hidden styles as React
// style props; on the client React applies them through the CSSOM, which CSP allows. A
// violation here means something wrote a style attribute or a <style> element.
async function strictStyles(page: Page): Promise<void> {
  await page.route(/states\.html/, async (route) => {
    const response = await route.fetch();
    await route.fulfill({ response, headers: { ...response.headers(), "content-security-policy": "style-src 'self'" } });
  });
  await page.addInitScript(() => {
    const w = window as unknown as { __csp: string[] };
    w.__csp = [];
    document.addEventListener("securitypolicyviolation", (e) => w.__csp.push(`${e.violatedDirective}: ${e.sample || e.blockedURI}`));
  });
}

const site = (page: Page) => page.getByRole("combobox", { name: "Site", exact: true });

eachTheme((theme) => {
  test("accessibility: no axe violations, closed, disabled and invalid", async ({ page }) => {
    await visitStates(page, "combobox", theme);
    await expect(site(page)).toBeVisible();
    await expectNoAxeViolations(page, undefined, { baseUi: true });
  });

  for (const state of ["open", "filtered", "no-match", "highlighted", "loading"]) {
    test(`accessibility: no axe violations, ${state}`, async ({ page }) => {
      await visitStates(page, "combobox", theme, state);
      await expect(page.locator(".cap-combobox-popup")).toBeVisible();
      await expectNoAxeViolations(page, undefined, { baseUi: true });
    });
  }

  test("accessibility: label, help, error, value and boundaries reach their contrast", async ({ page }) => {
    await visitStates(page, "combobox", theme);
    await expect(site(page)).toBeVisible();
    await expectContrast(page, [
      { sel: "[data-mount='closed'] .cap-combobox-label", what: "the label" },
      { sel: "[data-mount='closed'] .cap-combobox-help", what: "the help text" },
      { sel: "[data-mount='chosen'] .cap-combobox-input", what: "the chosen value in the box" },
      { sel: "[data-mount='invalid'] .cap-combobox-error", what: "the error message" },
      { sel: "[data-mount='disabled'] .cap-combobox-help", what: "the disabled box's reason" },
      { sel: "[data-mount='closed'] .cap-combobox-group", what: "the box's border", part: "border" },
      { sel: "[data-mount='invalid'] .cap-combobox-group", what: "the invalid box's border", part: "border" },
      { sel: "[data-mount='closed'] .cap-combobox-trigger", what: "the open button's glyph", min: 3 },
    ]);
  });

  test("accessibility: options, the highlighted option, empty and loading text reach their contrast", async ({ page }) => {
    await visitStates(page, "combobox", theme, "open");
    await expect(page.getByRole("listbox")).toBeVisible();
    await expectContrast(page, [{ sel: ".cap-option:not([data-highlighted]) .cap-option-label", what: "an option" }]);
    await page.locator(".cap-combobox-input").focus();
    await page.keyboard.press("ArrowDown");
    await expect(page.locator(".cap-option[data-highlighted]")).toHaveCount(1);
    await expectContrast(page, [{ sel: ".cap-option[data-highlighted] .cap-option-label", what: "the highlighted option on --accent-soft" }]);

    await visitStates(page, "combobox", theme, "no-match");
    await expectContrast(page, [{ sel: ".cap-combobox-empty", what: "the no-match message" }]);
    await visitStates(page, "combobox", theme, "loading");
    await expectContrast(page, [{ sel: ".cap-combobox-status", what: "the loading message" }]);
  });

  test("accessibility: the combobox's roles and names", async ({ page }) => {
    await visitStates(page, "combobox", theme);
    await expect(page.locator("[data-mount='closed']")).toMatchAriaSnapshot(`
      - paragraph: Type to filter. Only a listed site can be chosen.
      - group:
        - combobox "Site"
        - button "Show Site options"
    `);
    await expect(site(page)).toHaveAttribute("aria-expanded", "false");
    await expect(site(page)).toHaveAccessibleDescription("Type to filter. Only a listed site can be chosen.");
  });

  test("accessibility: the open list's roles and names", async ({ page }) => {
    await visitStates(page, "combobox", theme, "filtered");
    await expect(page.getByRole("listbox")).toMatchAriaSnapshot(`
      - listbox:
        - option "foxhound.app"
        - option "foxhound.app staging"
    `);
    await expect(page.getByRole("option")).toHaveCount(2);
  });

  test("keyboard: ArrowDown opens the list and moves through the options", async ({ page }) => {
    await visitStates(page, "combobox", theme);
    const input = site(page);
    await input.focus();
    await page.keyboard.press("ArrowDown");
    await expect(page.getByRole("listbox")).toBeVisible();
    await expect(input).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("ArrowDown");
    const highlighted = page.locator(".cap-option[data-highlighted]");
    await expect(highlighted).toHaveCount(1);
    const first = await highlighted.textContent();
    await expect(input).toHaveAttribute("aria-activedescendant", (await highlighted.getAttribute("id")) ?? "missing");
    await page.keyboard.press("ArrowDown");
    await expect(highlighted).toHaveCount(1);
    expect(await highlighted.textContent()).not.toBe(first);
    await expect(input).toBeFocused();
  });

  test("keyboard: Enter chooses the highlighted option and closes the list", async ({ page }) => {
    await visitStates(page, "combobox", theme);
    const input = site(page);
    await input.focus();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowDown");
    const label = (await page.locator(".cap-option[data-highlighted]").textContent())?.trim() ?? "";
    await page.keyboard.press("Enter");
    await expect(page.getByRole("listbox")).toBeHidden();
    await expect(input).toHaveValue(label);
    await expect(page.locator("[data-mount='closed'] [data-chosen]")).not.toHaveAttribute("data-chosen", "");
  });

  test("keyboard: Esc closes the list and keeps focus in the box", async ({ page }) => {
    await visitStates(page, "combobox", theme);
    const input = site(page);
    await input.focus();
    await page.keyboard.press("ArrowDown");
    await expect(page.getByRole("listbox")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("listbox")).toBeHidden();
    await expect(input).toBeFocused();
    await expect(input).toHaveAttribute("aria-expanded", "false");
  });

  test("keyboard: typing filters the list", async ({ page }) => {
    await visitStates(page, "combobox", theme);
    await site(page).focus();
    await page.keyboard.type("recova");
    await expect(page.getByRole("listbox")).toBeVisible();
    await expect(page.getByRole("option")).toHaveCount(2);
    await expect(page.getByRole("option", { name: "Recova merchant" })).toBeVisible();
  });

  test("behaviour: text that matches no option is not kept", async ({ page }) => {
    await visitStates(page, "combobox", theme);
    const input = site(page);
    await input.focus();
    await page.keyboard.type("carrel");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await expect(input).toHaveValue("Carrel");
    await input.fill("not a site");
    await page.keyboard.press("Tab");
    await expect(input).toHaveValue("Carrel");
    await expect(page.locator("[data-mount='closed'] [data-chosen]")).toHaveAttribute("data-chosen", "carrel");
  });

  test("behaviour: no match names the typed text", async ({ page }) => {
    await visitStates(page, "combobox", theme, "no-match");
    await expect(page.locator(".cap-combobox-empty")).toContainText("No match for “foxhund”");
    await expect(page.getByRole("option")).toHaveCount(0);
  });

  test("behaviour: loading says so, and never says no match", async ({ page }) => {
    await visitStates(page, "combobox", theme, "loading");
    await expect(page.getByRole("status").filter({ hasText: "Loading sites" })).toBeVisible();
    await expect(page.locator(".cap-combobox-empty")).toHaveText("");
  });

  test("behaviour: disabled ignores input and says why", async ({ page }) => {
    await visitStates(page, "combobox", theme);
    const input = page.getByRole("combobox", { name: "Site to back up" });
    await expect(input).toBeDisabled();
    await expect(input).toHaveValue("Capsid Portal");
    await expect(input).toHaveAccessibleDescription("Locked while capsid deploys. It unlocks when the deploy ends.");
  });

  test("behaviour: invalid is marked and described by its message", async ({ page }) => {
    await visitStates(page, "combobox", theme);
    const input = page.getByRole("combobox", { name: "Site to watch (required)" });
    await expect(input).toHaveAttribute("aria-invalid", "true");
    await expect(input).toHaveAccessibleDescription("Choose a site from the list. The watcher only checks sites it knows.");
  });

  test("accessibility: the grouped list's roles and names", async ({ page }) => {
    await visitStates(page, "combobox", theme, "grouped");
    await expect(page.getByRole("listbox")).toBeVisible();
    await expect(page.getByRole("group", { name: "Live sites" })).toBeVisible();
    await expect(page.getByRole("group", { name: "Previews and tools" })).toBeVisible();
    await expectNoAxeViolations(page, undefined, { baseUi: true });
    await expectContrast(page, [{ sel: ".cap-listbox-label", what: "a group label" }]);
  });

  test("accessibility: several values, open and closed, have no axe violations and name each remove button", async ({ page }) => {
    await visitStates(page, "combobox", theme, "open-chips");
    await expect(page.getByRole("listbox")).toBeVisible();
    // While the list is open Base UI hides the rest of the page from assistive technology, so the
    // remove buttons are checked closed, below.
    await expect(page.locator(".cap-combobox-chip-remove")).toHaveCount(2);
    await expectNoAxeViolations(page, undefined, { baseUi: true });
    await expect(page.getByRole("listbox")).toHaveAttribute("aria-multiselectable", "true");
    await visitStates(page, "combobox", theme);
    await expect(page.locator("[data-mount='chips']").getByRole("button", { name: "Remove Capsid Portal" })).toBeVisible();
    await expectNoAxeViolations(page, undefined, { baseUi: true });
  });

  test("behaviour: several values show as chips, and a chip's remove button takes that value away", async ({ page }) => {
    await visitStates(page, "combobox", theme);
    const chips = page.locator("[data-mount='chips']");
    await expect(chips.locator(".cap-combobox-chip")).toHaveCount(3);
    await chips.getByRole("button", { name: "Remove foxhound.app" }).click();
    await expect(chips.locator(".cap-combobox-chip")).toHaveCount(2);
    await expect(chips.getByText("foxhound.app", { exact: true })).toHaveCount(0);
  });

  test("keyboard: with several values, Enter adds the highlighted option as a chip and the list stays open", async ({ page }) => {
    await visitStates(page, "combobox", theme);
    const chips = page.locator("[data-mount='chips']");
    const input = chips.getByRole("combobox", { name: "Sites to back up" });
    await input.focus();
    await page.keyboard.type("carrel");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await expect(chips.locator(".cap-combobox-chip")).toHaveCount(4);
    await expect(chips.getByText("Carrel", { exact: true })).toBeVisible();
    await expect(input).toBeFocused();
  });

  test("behaviour: the clear button empties the chosen value and keeps focus in the box", async ({ page }) => {
    await visitStates(page, "combobox", theme);
    const area = page.locator("[data-mount='clearable']");
    const input = area.getByRole("combobox", { name: "Primary site" });
    await expect(input).toHaveValue("germomics.org");
    await area.getByRole("button", { name: "Clear Primary site" }).click();
    await expect(input).toHaveValue("");
    await expect(area.locator("[data-chosen]")).toHaveAttribute("data-chosen", "");
    await expect(area.getByRole("button", { name: "Clear Primary site" })).toHaveCount(0);
  });

  test("behaviour: works under style-src 'self' with no violation", async ({ page }) => {
    await strictStyles(page);
    await visitStates(page, "combobox", theme);
    await site(page).focus();
    await page.keyboard.press("ArrowDown");
    await expect(page.getByRole("listbox")).toBeVisible();
    await expect(page.locator(".cap-combobox-positioner")).toHaveCSS("position", "absolute");
    const violations = await page.evaluate(() => (window as unknown as { __csp: string[] }).__csp);
    expect(violations).toEqual([]);
  });
  test("accessibility: the tag field, open and closed, has no axe violations", async ({ page }) => {
    await visitStates(page, "combobox", theme, "open-tags");
    await expectNoAxeViolations(page);
    await visitStates(page, "combobox", theme);
    await expectNoAxeViolations(page);
  });

  test("keyboard: in a tag field, typed text and Enter make a new tag, and the box is ready for the next", async ({ page }) => {
    await visitStates(page, "combobox", theme);
    const area = page.locator("[data-mount='tags']");
    const input = area.getByRole("combobox", { name: "Tags" });
    await expect(area.locator(".cap-combobox-chip")).toHaveCount(2);
    await input.focus();
    await page.keyboard.type("western blot");
    await expect(page.getByRole("option", { name: "Create “western blot”" })).toBeVisible();
    await page.keyboard.press("Enter");
    await expect(area.locator(".cap-combobox-chip")).toHaveCount(3);
    await expect(area.locator("[data-tags]")).toHaveAttribute("data-tags", "phage|gel shift assay|western blot");
    await expect(input).toHaveValue("");
    await expect(input).toBeFocused();
  });

  test("behaviour: in a tag field, text that matches a suggestion picks it, and no tag is made twice", async ({ page }) => {
    await visitStates(page, "combobox", theme);
    const area = page.locator("[data-mount='tags']");
    const input = area.getByRole("combobox", { name: "Tags" });
    await input.focus();
    await page.keyboard.type("RELEASE");
    // The suggestion matches ignoring case, so there is nothing to create.
    await expect(page.getByRole("option", { name: /^Create/ })).toHaveCount(0);
    await page.keyboard.press("Enter");
    await expect(area.locator("[data-tags]")).toHaveAttribute("data-tags", "phage|gel shift assay|release");
    // A tag already on the field is not offered again as a new one.
    await page.keyboard.type("Gel shift  assay");
    await expect(page.getByRole("option", { name: /^Create/ })).toHaveCount(0);
  });

  test("behaviour: a made tag is a chip with its own remove button, and Backspace takes the last one", async ({ page }) => {
    await visitStates(page, "combobox", theme);
    const area = page.locator("[data-mount='tags']");
    await area.getByRole("button", { name: "Remove gel shift assay" }).click();
    await expect(area.locator("[data-tags]")).toHaveAttribute("data-tags", "phage");
    const input = area.getByRole("combobox", { name: "Tags" });
    await input.focus();
    await page.keyboard.press("Backspace");
    await expect(area.locator("[data-tags]")).toHaveAttribute("data-tags", "");
  });

  test("behaviour: the tag field posts every tag, made or listed, under its name", async ({ page }) => {
    await visitStates(page, "combobox", theme);
    const area = page.locator("[data-mount='tags']");
    await expect(area.locator("input[name='tags']")).toHaveCount(2);
    await expect(area.locator("input[name='tags']").first()).toHaveValue("phage");
    await expect(area.locator("input[name='tags']").last()).toHaveValue("gel shift assay");
  });
});
