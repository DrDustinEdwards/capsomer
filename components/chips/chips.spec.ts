import { expect, test, type Page } from "@playwright/test";
import { eachTheme, expectContrast, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

interface Change {
  param: string | null;
  values: string[];
}
type Win = Window & { changes?: Change[] };

async function recordChanges(page: Page): Promise<void> {
  await page.evaluate(() => {
    const w = window as Win;
    w.changes = [];
    document.addEventListener("cap:filter-change", (e) => {
      const d = (e as CustomEvent<Change>).detail;
      w.changes?.push({ param: d.param, values: [...d.values] });
    });
  });
}

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "chips", theme);
    await expectNoAxeViolations(page);
  });

  test("accessibility: words and edges reach their contrast", async ({ page }) => {
    await visitStates(page, "chips", theme);
    await expectContrast(page, [
      { sel: "#chips-some-l", what: "the group's label" },
      { sel: "#chip-unpressed", what: "a chip's word" },
      { sel: "#chip-pressed", what: "a pressed chip's word on its tint" },
      { sel: "#chip-hover", what: "a hovered chip's word" },
      { sel: "#chips-some-count", what: "the result count" },
      { sel: "#chips-some-clear", what: "Clear" },
      { sel: "#empty-text", what: "the empty result" },
      { sel: "#chip-unpressed", what: "a chip's edge", part: "border" },
      { sel: "#chip-pressed", what: "a pressed chip's edge", part: "border" },
      { sel: "#chip-hover", what: "a hovered chip's edge", part: "border" },
    ]);
  });

  test("accessibility: roles, names and pressed states", async ({ page }) => {
    await visitStates(page, "chips", theme);
    await expect(page.locator("#chips-live")).toMatchAriaSnapshot(`
      - group "Status":
        - button "Blocked"
        - button "Running"
        - button "Queued"
        - button "Done"
        - status: 14 jobs
    `);
    await expect(page.locator("#chips-some")).toMatchAriaSnapshot(`
      - group "Status":
        - button "Blocked" [pressed]
        - button "Running" [pressed]
        - button "Queued"
        - button "Done"
        - button "Clear"
        - status: 5 of 14 jobs
    `);
  });

  test("keyboard: Tab moves through the chips, then Clear while any is pressed", async ({ page }) => {
    await visitStates(page, "chips", theme);
    const live = page.locator("#chips-live");
    await page.keyboard.press("Tab");
    await expect(live.getByRole("button", { name: "Blocked" })).toBeFocused();
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await expect(live.getByRole("button", { name: "Done" })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.locator("#chip-pressed")).toBeFocused();

    await live.getByRole("button", { name: "Queued" }).click();
    await live.getByRole("button", { name: "Done" }).focus();
    await page.keyboard.press("Tab");
    await expect(live.getByRole("button", { name: "Clear" })).toBeFocused();
    await expectContrast(page, [{ sel: "#chips-live [data-cap-part='clear']", what: "the focus ring", part: "outline", min: 3 }]);
  });

  test("keyboard: Enter or Space presses or releases a chip; the count and the address follow", async ({ page }) => {
    await visitStates(page, "chips", theme);
    await recordChanges(page);
    const live = page.locator("#chips-live");
    const blocked = live.getByRole("button", { name: "Blocked" });
    const running = live.getByRole("button", { name: "Running" });
    const count = live.locator(".cap-chips-count");

    await blocked.focus();
    await page.keyboard.press("Enter");
    await expect(blocked).toHaveAttribute("aria-pressed", "true");
    await expect(count).toHaveText("3 of 14 jobs");
    await expect(page).toHaveURL(/[?&]status=blocked(&|#|$)/);
    await expect(live.getByRole("button", { name: "Clear" })).toBeVisible();

    await running.focus();
    await page.keyboard.press("Space");
    await expect(running).toHaveAttribute("aria-pressed", "true");
    await expect(count).toHaveText("5 of 14 jobs");
    await expect(page).toHaveURL(/[?&]status=blocked,running(&|#|$)/);

    await blocked.focus();
    await page.keyboard.press("Space");
    await expect(blocked).toHaveAttribute("aria-pressed", "false");
    await expect(page).toHaveURL(/[?&]status=running(&|#|$)/);
    await expect(page).toHaveURL(/[?&]theme=/);

    expect(await page.evaluate(() => (window as Win).changes)).toEqual([
      { param: "status", values: ["blocked"] },
      { param: "status", values: ["blocked", "running"] },
      { param: "status", values: ["running"] },
    ]);
  });

  test("keyboard: Enter on Clear releases every chip and moves focus to the first", async ({ page }) => {
    await visitStates(page, "chips", theme);
    const live = page.locator("#chips-live");
    await live.getByRole("button", { name: "Blocked" }).click();
    await live.getByRole("button", { name: "Queued" }).click();
    const clear = live.getByRole("button", { name: "Clear" });
    await clear.focus();
    await page.keyboard.press("Enter");
    await expect(live.locator(".cap-chip[aria-pressed='true']")).toHaveCount(0);
    await expect(clear).toBeHidden();
    await expect(live.getByRole("button", { name: "Blocked" })).toBeFocused();
    await expect(live.locator(".cap-chips-count")).toHaveText("14 jobs");
    await expect(page).not.toHaveURL(/status=/);
  });

  test("behaviour: the filter is read back from the address", async ({ page }) => {
    await page.goto(`components/chips/states.html?theme=${theme}&status=running,queued`);
    await expect(page.locator("h1").first()).toBeVisible();
    const live = page.locator("#chips-live");
    await expect(live.getByRole("button", { name: "Running" })).toHaveAttribute("aria-pressed", "true");
    await expect(live.getByRole("button", { name: "Queued" })).toHaveAttribute("aria-pressed", "true");
    await expect(live.getByRole("button", { name: "Blocked" })).toHaveAttribute("aria-pressed", "false");
    await expect(live.getByRole("button", { name: "Clear" })).toBeVisible();
    await expect(live.locator(".cap-chips-count")).toHaveText("11 of 14 jobs");
  });

  test("behaviour: a value from the address that no chip carries still shows, pressed, and can be released", async ({ page }) => {
    await page.goto(`components/chips/states.html?theme=${theme}&status=archived`);
    await expect(page.locator("h1").first()).toBeVisible();
    const live = page.locator("#chips-live");
    const extra = live.getByRole("button", { name: "archived" });
    await expect(extra).toHaveAttribute("aria-pressed", "true");
    await expect(live.getByRole("button", { name: "Clear" })).toBeVisible();
    await extra.click();
    await expect(extra).toHaveAttribute("aria-pressed", "false");
    await expect(page).not.toHaveURL(/status=/);
  });

  test("behaviour: an empty result names the filter and Clear filter brings the list back", async ({ page }) => {
    await visitStates(page, "chips", theme);
    const live = page.locator("#chips-live");
    await live.getByRole("button", { name: "Done" }).click();
    await expect(page.locator("#live-empty-text")).toHaveText('No jobs match "Done".');
    await expect(live.locator(".cap-chips-count")).toHaveText("0 of 14 jobs");
    await page.getByRole("button", { name: "Clear filter" }).first().click();
    await expect(page.locator("#live-empty")).toBeHidden();
    await expect(live.locator(".cap-chips-count")).toHaveText("14 jobs");
    await expect(live.getByRole("button", { name: "Blocked" })).toBeFocused();
  });
});
