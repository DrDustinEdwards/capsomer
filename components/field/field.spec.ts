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
      { sel: "#cc-summary-c", what: "a character count" },
      { sel: "#cc-bio-c", what: "a count over its limit" },
      { sel: "[aria-controls='pw-current']", what: "a password's Show" },
      { sel: "#dob-day", what: "a date part's edge", part: "border" },
      { sel: "#since-month", what: "a date part in error's edge", part: "border" },
      { sel: "label[for='dob-day']", what: "a date part's label" },
      { sel: "#otp", what: "a one-time code's edge", part: "border" },
    ]);
  });

  test("accessibility: the live form's roles and names", { tag: "@markup" }, async ({ page }) => {
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

  test("keyboard: Enter submits; two or more fields in error send focus to the error summary", async ({ page }) => {
    await visitStates(page, "field", theme);
    const title = await page.title();
    const url = page.locator("#site-url");
    await url.focus();
    await page.keyboard.press("Enter");

    const summary = page.locator("#add-site .cap-error-summary");
    await expect(summary).toBeFocused();
    await expect(summary).toHaveAccessibleName("There is a problem");
    await expect(summary.getByRole("link")).toHaveText(["Give the site a name, such as Foxhound.", "Enter the site's address.", "Choose where the site runs."]);
    await expect(page).toHaveTitle(`Error: ${title}`);
    await expect(page.locator("#site-name")).toHaveAttribute("aria-invalid", "true");
    await expect(page.locator("#site-name-e")).toHaveText("Give the site a name, such as Foxhound.");
    // The summary is what is said; the messages beside the fields are not announced as well.
    await expect(page.locator("#site-name-e")).not.toHaveAttribute("role", "alert");
    await expect(page.getByRole("radio", { name: "Vercel" })).toHaveAttribute("aria-invalid", "true");
    await expect(page.locator("#add-result")).toHaveText("");

    await page.locator("#site-name").fill("Foxhound");
    await url.fill("https://foxhound.app");
    await page.getByRole("radio", { name: "Cloudflare" }).check();
    await page.locator("#site-name").focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("#add-result")).toHaveText("Added Foxhound. Its checks start on the next pass.");
    await expect(page.locator("#add-site .cap-field-error:visible")).toHaveCount(0);
    await expect(summary).toBeHidden();
    await expect(page).toHaveTitle(title);
  });

  test("keyboard: Enter with one field in error moves focus there and announces it; a date that does not exist is wrong on its day", async ({ page }) => {
    await visitStates(page, "field", theme);
    const [day, month, year] = [page.locator("#join-day"), page.locator("#join-month"), page.locator("#join-year")];
    await day.fill("31");
    await year.fill("2026");
    await year.press("Enter");
    await expect(month).toBeFocused();
    await expect(month).toHaveAttribute("aria-invalid", "true");
    await expect(day).not.toHaveAttribute("aria-invalid", "true");
    await expect(month).toHaveAccessibleDescription("Start date must include a month.");
    await expect(page.locator("#join .cap-field-error").last()).toHaveAttribute("role", "alert");
    await expect(page.locator("#join .cap-error-summary")).toHaveCount(0);

    await month.fill("2");
    await month.press("Enter");
    await expect(day).toBeFocused();
    await expect(day).toHaveAccessibleDescription("Start date must be a real date.");
    await expect(month).not.toHaveAttribute("aria-invalid", "true");
    await day.fill("28");
    await day.press("Enter");
    await expect(page.locator("#join-result")).toHaveText("Joined. A sign-in code is on its way.");
  });

  test("keyboard: Show shows the password and says so; Hide hides it again", async ({ page }) => {
    await visitStates(page, "field", theme);
    const input = page.locator("#pw-current");
    const show = page.getByRole("button", { name: "Show password" }).first();
    await show.focus();
    await page.keyboard.press("Enter");
    await expect(input).toHaveAttribute("type", "text");
    const hide = page.getByRole("button", { name: "Hide password" });
    await expect(hide).toBeFocused();
    await expect(hide).toHaveText("Hide");
    await expect(page.getByRole("status", { name: "Results and failures" })).toContainText("Your password is shown.");
    await page.keyboard.press("Space");
    await expect(input).toHaveAttribute("type", "password");
    await expect(page.getByRole("status", { name: "Results and failures" })).toContainText("Your password is hidden.");
  });

  test("behavior: a character count says what is left, then how many too many, and the region says it once typing stops", async ({ page }) => {
    await visitStates(page, "field", theme);
    const count = page.locator("#cc-summary-c");
    await expect(count).toHaveText("You have 66 characters remaining");
    await expect(page.locator("#cc-bio-c")).toHaveText("You have 5 words too many");
    await expect(page.locator("#cc-bio-c")).toHaveAttribute("data-over", "true");
    const area = page.locator("#cc-summary");
    await area.fill("x".repeat(125));
    await expect(count).toHaveText("You have 5 characters too many");
    await expect(page.getByRole("status", { name: "Results and failures" })).toContainText("You have 5 characters too many");
    // Over the limit is wrong on submit; nothing stopped the typing.
    expect(await area.evaluate((el: HTMLTextAreaElement) => el.validationMessage)).toBe("Use 120 characters or fewer.");
  });

  test("keyboard: arrows, Page Up and Down, Home and End step a number; the steppers stop at its bounds", async ({ page }) => {
    await visitStates(page, "field", theme);
    const n = page.getByRole("spinbutton", { name: "Retries" });
    await n.focus();
    await page.keyboard.press("ArrowUp");
    await expect(n).toHaveValue("4");
    await page.keyboard.press("PageUp");
    await expect(n).toHaveValue("10");
    await expect(page.getByRole("button", { name: "Increase retries" })).toBeDisabled();
    await page.keyboard.press("Home");
    await expect(n).toHaveValue("0");
    await expect(page.getByRole("button", { name: "Decrease retries" })).toBeDisabled();
    await page.keyboard.press("End");
    await expect(n).toHaveValue("10");
    await page.keyboard.press("PageDown");
    await expect(n).toHaveValue("0");
    await page.getByRole("button", { name: "Increase retries" }).click();
    await expect(n).toHaveValue("1");
    await expect(n).toBeFocused();
  });

  test("keyboard: Esc clears a search and keeps focus; Clear does the same", async ({ page }) => {
    await visitStates(page, "field", theme);
    const q = page.getByRole("search", { name: "Posts" }).getByRole("searchbox", { name: "Search posts" });
    const clear = page.getByRole("button", { name: "Clear search" });
    await expect(clear).toBeVisible();
    await q.focus();
    await page.keyboard.press("Escape");
    await expect(q).toHaveValue("");
    await expect(q).toBeFocused();
    await expect(clear).toBeHidden();
    await page.keyboard.type("mussels");
    await clear.click();
    await expect(q).toHaveValue("");
    await expect(q).toBeFocused();
  });

  test("accessibility: the parts' buttons are at least the target size", { tag: "@markup" }, async ({ page }) => {
    await visitStates(page, "field", theme);
    for (const name of ["Show password", "Decrease retries", "Increase retries", "Clear search"]) {
      const box = await page.getByRole("button", { name }).first().boundingBox();
      expect(box && Math.min(box.width, box.height), name).toBeGreaterThanOrEqual(24);
    }
    await expect(page.getByRole("textbox", { name: "Sign-in code" })).toHaveAttribute("autocomplete", "one-time-code");
  });

  test("behavior: a message goes as soon as the field is fixed", async ({ page }) => {
    await visitStates(page, "field", theme);
    const url = page.locator("#site-url");
    await url.fill("foxhound.app");
    await url.blur();
    await expect(page.locator("#site-url-e")).toHaveText("Enter a full address, starting with https://.");
    await url.fill("https://foxhound.app/");
    await expect(page.locator("#site-url-e")).toBeHidden();
    await expect(url).not.toHaveAttribute("aria-invalid", "true");
  });

  test("accessibility: a checkbox can be mixed and reports it", { tag: "@markup" }, async ({ page }) => {
    await visitStates(page, "field", theme);
    await expect(page.getByRole("checkbox", { name: "Select all sites (some chosen)" })).toBeChecked({ indeterminate: true });
  });

  test("accessibility: an invalid checkbox and radio expose aria-invalid and their message", { tag: "@markup" }, async ({ page }) => {
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

  test("behavior: clicking an addon's text puts the cursor in its field; its button keeps its own click", async ({ page }) => {
    await visitStates(page, "field", theme);
    await page.locator(".cap-input-group-text").first().click();
    await expect(page.locator("#g-url")).toBeFocused();
    await page.getByRole("button", { name: "Paste an address" }).click();
    await expect(page.locator("#g-url")).not.toBeFocused();
  });

  test("behavior: a message sets data-invalid on its field and clears it when fixed", async ({ page }) => {
    await visitStates(page, "field", theme);
    const url = page.locator("#site-url");
    await url.fill("foxhound.app");
    await url.blur();
    await expect(page.locator("#site-url").locator("xpath=ancestor::div[contains(@class,'cap-field')][1]")).toHaveAttribute("data-invalid", "true");
    await url.fill("https://foxhound.app");
    await expect(page.locator("#site-url").locator("xpath=ancestor::div[contains(@class,'cap-field')][1]")).not.toHaveAttribute("data-invalid", "true");
  });
});
