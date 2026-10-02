import { expect, test } from "@playwright/test";
import { eachTheme, expectContrast, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "field", theme);
    await expectNoAxeViolations(page);
  });

  test("accessibility: words and edges reach their contrast", async ({ page }) => {
    await visitStates(page, "field", theme);
    await expectContrast(page, [
      { sel: "label[for='f-default']", what: "a label" },
      { sel: "#f-filled", what: "a typed value" },
      { sel: "#f-help-h", what: "help text" },
      { sel: "label[for='f-help'] .cap-field-required", what: "the required word" },
      { sel: "#f-invalid-e", what: "an error message" },
      { sel: "#f-readonly", what: "a read-only value on its sunken ground" },
      { sel: "#f-default", what: "an input's edge", part: "border" },
      { sel: "#f-hover", what: "a hovered input's edge", part: "border" },
      { sel: "#f-invalid", what: "an invalid input's edge", part: "border" },
      { sel: "#f-notes", what: "a textarea's edge", part: "border" },
      { sel: "#f-readonly", what: "a read-only input's edge", part: "border" },
      { sel: "label.cap-check:has(#c-on)", what: "a checkbox label" },
      { sel: "#c-off", what: "an unchecked checkbox's edge", part: "border" },
      { sel: "#c-on", what: "a checked checkbox's fill against the page", part: "border" },
      { sel: "#c-invalid", what: "an invalid checkbox's edge", part: "border" },
      { sel: "#c-mixed", what: "a mixed checkbox's fill against the page", part: "border" },
      { sel: "#f-file", what: "a file input's edge", part: "border" },
      { sel: "#g-url", what: "an input group's text" },
      { sel: "[aria-label='Site address with scheme']", what: "an input group's edge", part: "border" },
      { sel: ".cap-input-group-text", what: "an addon's text" },
    ]);
  });

  test("accessibility: the live form's roles and names", async ({ page }) => {
    await visitStates(page, "field", theme);
    await expect(page.locator("#add-site")).toMatchAriaSnapshot(`
      - form "A live form":
        - textbox "Site name"
        - textbox "Site address"
        - group "Platform":
          - radio "Cloudflare"
          - radio "Vercel"
        - checkbox "Start checks on the next pass"
        - button "Add site"
    `);
    await expect(page.locator("#f-invalid")).toHaveAccessibleDescription(/Use https:\/\/ and remove/);
    await expect(page.locator("#f-help")).toHaveAccessibleDescription("Starts with https:// and has no path.");
  });

  test("keyboard: Tab leaves a changed field and checks it; an untouched field is left alone", async ({ page }) => {
    await visitStates(page, "field", theme);
    const name = page.locator("#site-name");
    await name.focus();
    await page.keyboard.press("Tab");
    await expect(page.locator("#site-url")).toBeFocused();
    await expect(page.locator("#site-name-e")).toBeHidden();
    await expect(name).not.toHaveAttribute("aria-invalid", "true");

    await page.keyboard.type("http://foxhound.app/health");
    await page.keyboard.press("Tab");
    const err = page.locator("#site-url-e");
    await expect(err).toBeVisible();
    await expect(err).toHaveText("Use https:// and leave off any path, such as /health.");
    await expect(err).not.toHaveAttribute("role", "alert");
    await expect(page.locator("#site-url")).toHaveAttribute("aria-invalid", "true");
    await expect(page.locator("#site-url")).toHaveAccessibleDescription(/Use https:\/\/ and leave off any path/);
  });

  test("keyboard: Space checks and unchecks a checkbox", async ({ page }) => {
    await visitStates(page, "field", theme);
    const box = page.getByRole("checkbox", { name: "Start checks on the next pass" });
    await box.focus();
    await page.keyboard.press("Space");
    await expect(box).toBeChecked();
    await page.keyboard.press("Space");
    await expect(box).not.toBeChecked();
  });

  test("keyboard: arrow keys move between radios and select", async ({ page }) => {
    await visitStates(page, "field", theme);
    const five = page.getByRole("radio", { name: "5 minutes", exact: true });
    await five.focus();
    await page.keyboard.press("ArrowDown");
    const fifteen = page.getByRole("radio", { name: "15 minutes" });
    await expect(fifteen).toBeFocused();
    await expect(fifteen).toBeChecked();
    await page.keyboard.press("ArrowUp");
    await expect(five).toBeChecked();
  });

  test("keyboard: Enter submits; a wrong form moves focus to the first field in error and announces it", async ({ page }) => {
    await visitStates(page, "field", theme);
    const url = page.locator("#site-url");
    await url.focus();
    await page.keyboard.press("Enter");

    await expect(page.locator("#site-name")).toBeFocused();
    await expect(page.locator("#site-name")).toHaveAttribute("aria-invalid", "true");
    await expect(page.locator("#site-name-e")).toHaveText("Give the site a name, such as Foxhound.");
    await expect(page.locator("#site-name-e")).toHaveAttribute("role", "alert");
    await expect(page.locator("#site-url-e")).toHaveText("Enter the site's address.");
    await expect(page.locator("#platform-e")).toHaveText("Choose where the site runs.");
    await expect(page.getByRole("radio", { name: "Vercel" })).toHaveAttribute("aria-invalid", "true");
    await expect(page.locator("#add-result")).toHaveText("");

    await page.keyboard.type("Foxhound");
    await url.fill("https://foxhound.app");
    await page.getByRole("radio", { name: "Cloudflare" }).check();
    await page.locator("#site-name").focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("#add-result")).toHaveText("Added Foxhound. Its checks start on the next pass.");
    await expect(page.locator(".cap-field-error:visible")).toHaveCount(1);
  });

  test("behaviour: a message goes as soon as the field is fixed", async ({ page }) => {
    await visitStates(page, "field", theme);
    const url = page.locator("#site-url");
    await url.fill("foxhound.app");
    await url.blur();
    await expect(page.locator("#site-url-e")).toHaveText("Enter a full address, starting with https://.");
    await url.fill("https://foxhound.app/");
    await expect(page.locator("#site-url-e")).toBeHidden();
    await expect(url).not.toHaveAttribute("aria-invalid", "true");
  });

  test("accessibility: a checkbox can be mixed and reports it", async ({ page }) => {
    await visitStates(page, "field", theme);
    await expect(page.getByRole("checkbox", { name: "Select all sites (some chosen)" })).toBeChecked({ indeterminate: true });
  });

  test("accessibility: an invalid checkbox and radio expose aria-invalid and their message", async ({ page }) => {
    await visitStates(page, "field", theme);
    await expect(page.locator("#c-invalid")).toHaveAttribute("aria-invalid", "true");
    await expect(page.locator("#c-invalid")).toHaveAccessibleDescription("Accept the terms to continue.");
    await expect(page.locator("#r-invalid")).toHaveAttribute("aria-invalid", "true");
  });

  test("accessibility: the group and the focus ring on a field", async ({ page }) => {
    await visitStates(page, "field", theme);
    await expect(page.getByRole("group", { name: "Site address with scheme" })).toBeVisible();
    await page.locator("#g-url").focus();
    await page.keyboard.press("Tab");
    await page.keyboard.press("Shift+Tab");
    await expect(page.locator("#g-url")).toBeFocused();
    await expectContrast(page, [{ sel: "[aria-label='Site address with scheme']", what: "the group's focus ring", part: "outline", min: 3 }]);
    await page.locator("#f-focus").focus();
    await page.keyboard.press("Tab");
    await page.keyboard.press("Shift+Tab");
    await expectContrast(page, [{ sel: "#f-focus", what: "a field's focus ring", part: "outline", min: 3 }]);
  });

  test("keyboard: a checkbox's ring shows on keyboard focus", async ({ page }) => {
    await visitStates(page, "field", theme);
    await page.locator("#c-off").focus();
    await page.keyboard.press("Tab");
    await page.keyboard.press("Shift+Tab");
    await expect(page.locator("#c-off")).toBeFocused();
    await expect(page.locator("#c-off")).toHaveCSS("outline-style", "solid");
    await expectContrast(page, [{ sel: "#c-off", what: "a checkbox's focus ring", part: "outline", min: 3 }]);
  });

  test("behaviour: clicking an addon's text puts the cursor in its field; its button keeps its own click", async ({ page }) => {
    await visitStates(page, "field", theme);
    await page.locator(".cap-input-group-text").first().click();
    await expect(page.locator("#g-url")).toBeFocused();
    await page.getByRole("button", { name: "Paste an address" }).click();
    await expect(page.locator("#g-url")).not.toBeFocused();
  });

  test("behaviour: a message sets data-invalid on its field and clears it when fixed", async ({ page }) => {
    await visitStates(page, "field", theme);
    const url = page.locator("#site-url");
    await url.fill("foxhound.app");
    await url.blur();
    await expect(page.locator("#site-url").locator("xpath=ancestor::div[contains(@class,'cap-field')][1]")).toHaveAttribute("data-invalid", "true");
    await url.fill("https://foxhound.app");
    await expect(page.locator("#site-url").locator("xpath=ancestor::div[contains(@class,'cap-field')][1]")).not.toHaveAttribute("data-invalid", "true");
  });
});
