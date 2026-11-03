import { expect, test } from "@playwright/test";
import { eachTheme, expectContrast, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

// The ids are the examples' own (examples.html): #map the live network, #map-lit with Carrel lit,
// #map-system Capsid at level 2, #map-step a job's life at step 5, #map-states forced states,
// #map-noscript as delivered with no script.
eachTheme((theme) => {
  test.beforeEach(async ({ page }) => {
    await visitStates(page, "system-map", theme);
  });

  test("accessibility: no axe violations", async ({ page }) => {
    await expectNoAxeViolations(page);
  });

  test("accessibility: a card's words, a tie's line, a part and a lit part reach their contrast", async ({ page }) => {
    await expectContrast(page, [
      { sel: "#map [data-id='carrel'] .cap-system-map-card-name", what: "a card's name" },
      { sel: "#map [data-id='carrel'] .cap-system-map-card-text", what: "what it is for" },
      { sel: "#map [data-id='carrel'] .cap-system-map-card-count", what: "its counts" },
      { sel: "#map [data-id='carrel'] .cap-system-map-card-domain", what: "its address" },
      { sel: "#map-lit [data-id='carrel'] .cap-system-map-card-name", what: "the lit card's name, on its tint" },
      { sel: "#map-lit [data-id='site'] .cap-system-map-card-tie", what: "how a card is tied" },
      { sel: "#map-system [data-column='used-by'] .cap-system-map-tie-verbs", what: "a tie's verbs" },
      { sel: "#map-system [data-id='capsid-worker'] .cap-system-map-part-lines", what: "a part's lines" },
      { sel: "#map-step [data-at] .cap-system-map-part-name", what: "the part a step moves toward, on its tint" },
    ]);
  });

  test("accessibility: lit and private are marked by more than color, and no text is under 12 px", async ({ page }) => {
    await expect(page.locator("#map-lit [data-id='site'] .cap-system-map-card-tie")).toHaveText("Used by Carrel");
    await expect(page.locator("#map-lit [data-id='capsid'] .cap-system-map-card-tie")).toHaveText("Uses and used by Carrel");
    expect(await page.locator("#map-lit [data-id='carrel']").evaluate((el) => getComputedStyle(el).outlineStyle)).toBe("solid");
    expect(await page.locator("#map [data-id='foxing']").evaluate((el) => getComputedStyle(el).borderTopStyle)).toBe("dashed");
    const smallest = await page.locator(".cap-system-map").evaluateAll((maps) =>
      Math.min(...maps.flatMap((m) => [...m.querySelectorAll("*")].filter((el) => el.childNodes.length && [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent!.trim())).map((el) => Number.parseFloat(getComputedStyle(el).fontSize))))
    );
    expect(smallest).toBeGreaterThanOrEqual(12);
  });

  test("keyboard: Tab reaches each card's link, focus lights its ties and their wires, and the rest dim", async ({ page }) => {
    // A wire for every pair of tied systems, drawn where the cards landed.
    await expect(page.locator("#map .cap-system-map-wire")).toHaveCount(await page.locator("#map").evaluate((m) => new Set([...m.querySelectorAll<HTMLElement>("[data-wire]")].flatMap((c) => (c.dataset.wires ?? "").split(" ").filter(Boolean).map((o) => [c.dataset.wire, o].sort().join(" ")))).size));
    const link = page.locator("#map").getByRole("link", { name: "Prelum" });
    await link.focus();
    await expect(page.locator("#map")).toHaveAttribute("data-lit", "prelum");
    await expect(page.locator("#map .cap-system-map-wire[data-on]")).toHaveCount(1);
    await expect(page.locator("#map [data-id='site']")).toHaveAttribute("data-tie", "user");
    await expect(page.locator("#map [data-id='ledger']")).not.toHaveAttribute("data-tie");
    await page.keyboard.press("Tab");
    await expect(page.locator("#map")).toHaveAttribute("data-lit", "capsid");
    await page.locator("#map").getByRole("link", { name: "Capsid" }).blur();
    await expect(page.locator("#map")).not.toHaveAttribute("data-lit");
  });

  test("keyboard: Start, Next and Back step a flow, lighting its parts and saying where it is; Escape stops", async ({ page }) => {
    const flow = page.locator("#map-system .cap-system-map-flow");
    const map = page.locator("#map-system");
    await flow.getByRole("button", { name: "Start" }).click();
    await expect(map).toHaveAttribute("data-step", "1");
    await expect(flow.locator(".cap-system-map-flow-status")).toHaveText("Step 1 of 6: Posted: a session posts a job, and the Worker stores it.");
    await expect(map.locator("[data-id='capsid-db']")).toHaveAttribute("data-lit", "");
    await expect(map.locator("[data-id='capsid-portal']")).not.toHaveAttribute("data-lit");
    await expect(flow.getByRole("button", { name: "Back" })).toBeDisabled();
    await page.keyboard.press("Enter");
    await expect(map).toHaveAttribute("data-step", "2");
    await expect(flow.locator("li[aria-current='step']")).toHaveText(/^Claimed/);
    await page.keyboard.press("Escape");
    await expect(map).not.toHaveAttribute("data-step");
    await expect(map.locator("[data-lit]")).toHaveCount(0);
  });

  test("behavior: as delivered with no script every card is a link and each flow a list; on a phone only the drawing scrolls sideways", async ({ page }) => {
    const plain = page.locator("#map-noscript");
    expect(await plain.getByRole("link").count()).toBe(14);
    await expect(page.locator("#map-step li[aria-current='step']")).toHaveText(/^Merged/);
    await page.setViewportSize({ width: 320, height: 800 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  });
});
