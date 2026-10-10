import { expect, test, type Page } from "@playwright/test";
import { eachTheme, expectContrast, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

// The ids are the examples' own (examples.html): #map the live map, #map-chosen with Carrel
// chosen, #map-inside entered, #map-plain in the plain view, #map-states with forced states,
// #map-plain-html as delivered with no script.
const tile = (page: Page, map: string, id: string) => page.locator(`#${map} .cap-system-map-tile[data-id='${id}']`);
const focusedId = (page: Page) => page.evaluate(() => (document.activeElement as HTMLElement | null)?.dataset?.id ?? document.activeElement?.textContent ?? "");

eachTheme((theme) => {
  test.beforeEach(async ({ page }) => {
    await visitStates(page, "system-map", theme);
  });

  test("accessibility: no axe violations", async ({ page }) => {
    await expectNoAxeViolations(page);
  });

  test("accessibility: a name, its word, a private word, the core, a chosen capsomer and the detail reach their contrast", async ({ page }) => {
    await expectContrast(page, [
      { sel: "#map [data-id='carrel'] .cap-system-map-name", what: "a capsomer's name" },
      { sel: "#map [data-id='carrel'] .cap-system-map-tag", what: "its word" },
      { sel: "#map [data-id='prelum'] .cap-system-map-name", what: "a shared part's name, on its tint" },
      { sel: "#map [data-id='foxing'] .cap-system-map-tag", what: "the word private" },
      { sel: "#map [data-id='capsid'] .cap-system-map-name", what: "the core's name" },
      { sel: "#map-chosen [data-id='carrel'] .cap-system-map-name", what: "a chosen capsomer's name" },
      { sel: "#map-chosen .cap-system-map-detail-text", what: "the detail line" },
      { sel: "#map-inside .cap-system-map-box-name", what: "a part inside the core" },
    ]);
  });

  test("accessibility: chosen and private are marked by more than colour", async ({ page }) => {
    const stroke = (sel: string, prop: string) => page.locator(sel).evaluate((el, p) => getComputedStyle(el).getPropertyValue(p), prop);
    expect(Number.parseFloat(await stroke("#map-chosen [data-id='carrel'] polygon", "stroke-width"))).toBeGreaterThan(Number.parseFloat(await stroke("#map-chosen [data-id='enarratio'] polygon", "stroke-width")));
    expect(await stroke("#map [data-id='foxing'] polygon", "stroke-dasharray")).not.toBe("none");
    await expect(tile(page, "map", "foxing")).toHaveAttribute("aria-label", "Foxing, private");
  });

  test("accessibility: the map is a group of named buttons, and the list holds the same systems", async ({ page }) => {
    const map = page.getByRole("group", { name: "The family", exact: true });
    await expect(map.getByRole("button", { name: "Capsid" })).toHaveAttribute("aria-pressed", "false");
    await expect(map.getByRole("button", { name: "Carrel, tool" })).toBeAttached();
    const tiles = await page.locator("#map .cap-system-map-tile[role='button']").evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.id).sort());
    const items = await page.locator("#map .cap-system-map-list li[data-id]").evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.id).sort());
    expect(tiles.length).toBe(16);
    expect(items).toEqual(tiles);
  });

  test("keyboard: Tab enters on the core and leaves in one press; arrows move to the neighbour that way, Home and End", async ({ page }) => {
    const stops = () => page.locator("#map .cap-system-map-tile[tabindex='0']").count();
    expect(await stops()).toBe(1);
    await page.locator("#map .cap-system-map-views button").last().focus();
    await page.keyboard.press("Tab");
    expect(await focusedId(page)).toBe("capsid");
    await page.keyboard.press("Tab");
    expect(await page.evaluate(() => !!document.activeElement?.closest("#map .cap-system-map-stage"))).toBe(false);
    await tile(page, "map", "capsid").focus();
    const xy = (id: string) => tile(page, "map", id).evaluate((el) => [Number((el as HTMLElement).dataset.x), Number((el as HTMLElement).dataset.y)]);
    const [cx, cy] = await xy("capsid");
    await page.keyboard.press("ArrowUp");
    const up = await focusedId(page);
    expect((await xy(up))[1]).toBeLessThan(cy!);
    await page.keyboard.press("ArrowDown");
    expect(await focusedId(page)).toBe("capsid");
    await page.keyboard.press("ArrowRight");
    expect((await xy(await focusedId(page)))[0]).toBeGreaterThan(cx!);
    await page.keyboard.press("End");
    expect(await focusedId(page)).not.toBe("capsid");
    await page.keyboard.press("Home");
    expect(await focusedId(page)).toBe("capsid");
    expect(await stops()).toBe(1);
  });

  test("keyboard: Enter chooses and draws the lines, Escape clears", async ({ page }) => {
    await tile(page, "map", "carrel").focus();
    await page.keyboard.press("Enter");
    await expect(tile(page, "map", "carrel")).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("#map .cap-system-map-edge[data-on]")).toHaveCount(4);
    await expect(page.locator("#map .cap-system-map-detail")).toContainText("4 connections drawn");
    await page.keyboard.press("Space");
    await expect(tile(page, "map", "carrel")).toHaveAttribute("aria-pressed", "true");
    await page.keyboard.press("Escape");
    await expect(tile(page, "map", "carrel")).toHaveAttribute("aria-pressed", "false");
    await expect(page.locator("#map .cap-system-map-edge[data-on]")).toHaveCount(0);
  });

  test("keyboard: Enter on the chosen core goes inside, Escape steps out to the core", async ({ page }) => {
    await tile(page, "map", "capsid").focus();
    await page.keyboard.press("Enter");
    await page.keyboard.press("Enter");
    await expect(page.locator("#map")).toHaveAttribute("data-entered", "");
    await expect(page.locator("#map").getByRole("img", { name: /Inside Capsid: MCP Worker, Portal, Five-minute tick/ })).toBeVisible();
    await expect(page.locator("#map").getByRole("button", { name: "Step out" })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(page.locator("#map")).not.toHaveAttribute("data-entered", "");
    expect(await focusedId(page)).toBe("capsid");
  });

  test("behaviour: a pointer chooses, and Go inside and Step out work as buttons", async ({ page }) => {
    await tile(page, "map", "capsid").click();
    await page.locator("#map").getByRole("button", { name: "Go inside" }).click();
    await expect(page.locator("#map")).toHaveAttribute("data-entered", "");
    await page.locator("#map").getByRole("button", { name: "Step out" }).click();
    await expect(page.locator("#map")).not.toHaveAttribute("data-entered", "");
    const events = page.evaluate(() => new Promise((resolve) => document.querySelector("#map")!.addEventListener("cap:system-map-select", (e) => resolve((e as CustomEvent).detail), { once: true })));
    await tile(page, "map", "enarratio").click();
    expect(await events).toEqual({ id: "enarratio" });
  });

  test("behaviour: the plain map shows the list as columns and hides the drawing", async ({ page }) => {
    await page.locator("#map").getByRole("button", { name: "Plain map" }).click();
    await expect(page.locator("#map")).toHaveAttribute("data-view", "plain");
    await expect(page.locator("#map .cap-system-map-stage")).toBeHidden();
    await expect(page.locator("#map .cap-system-map-list")).toHaveAttribute("open", "");
    await expect(page.locator("#map").getByRole("button", { name: "Plain map" })).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("#map").getByRole("heading", { name: "Shared parts" })).toBeVisible();
  });

  test("behaviour: going inside animates, and with reduced motion runs no animation", async ({ page }) => {
    // The control: without the preference the layers do move, so a count of 0 below is
    // the preference at work and not a test that cannot see an animation.
    await tile(page, "map", "capsid").click();
    await tile(page, "map", "capsid").click();
    expect(await page.evaluate(() => document.getAnimations().length)).toBeGreaterThan(0);
    await page.keyboard.press("Escape");

    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.waitForTimeout(600);
    // Stepping out leaves the core chosen, so one click goes back in.
    await tile(page, "map", "capsid").click();
    await expect(page.locator("#map")).toHaveAttribute("data-entered", "");
    expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
  });

  test("behaviour: delivered with no script, the drawing is one named picture and the list is open", async ({ page }) => {
    await expect(page.getByRole("img", { name: /The family, no script: 16 systems in rings/ })).toBeAttached();
    await expect(page.locator("#map-plain-html .cap-system-map-list")).toHaveAttribute("open", "");
    await expect(page.locator("#map-plain-html .cap-system-map-tile[role='button']")).toHaveCount(0);
    await expect(page.locator("#map-plain-html .cap-system-map-views")).toBeHidden();
  });
});
