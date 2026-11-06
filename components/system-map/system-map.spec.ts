import { expect, type Page, test } from "@playwright/test";
import { eachTheme, expectContrast, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

// The ids are the examples' own (examples.html): #map the live network, #map-lit with Carrel lit,
// #map-system Capsid at level 2, #map-step a job's life at step 5, #map-states forced states,
// #map-noscript as delivered with no script.
eachTheme((theme) => {
  test.beforeEach(async ({ page }) => {
    await visitStates(page, "system-map", theme);
  });

  // The network opens on the hexagons; the plain map is the second tab.
  // How many pairs of systems are tied, from the plain map's cards.
  const pairs = (page: Page) => page.locator("#map").evaluate((m) => new Set([...m.querySelectorAll<HTMLElement>("[data-wire]")].flatMap((c) => (c.dataset.wires ?? "").split(" ").filter(Boolean).map((o) => [c.dataset.wire, o].sort().join(" ")))).size);
  const plainMap = async (page: Page, ...ids: string[]) => {
    for (const id of ids) await page.locator(`#${id}`).getByRole("tab", { name: "Plain map" }).click();
  };

  test("accessibility: no axe violations", async ({ page }) => {
    await expectNoAxeViolations(page);
  });

  test("accessibility: a card's words, a tie's line, a part and a lit part reach their contrast", async ({ page }) => {
    await plainMap(page, "map");
    await expectContrast(page, [
      { sel: "#map .cap-system-map-card[data-id='carrel'] .cap-system-map-card-name", what: "a card's name" },
      { sel: "#map-lit .cap-system-map-detail .cap-system-map-card-text", what: "what the lit system is for, in the detail line" },
      { sel: "#map-lit .cap-system-map-detail .cap-system-map-card-count", what: "its counts" },
      { sel: "#map-lit .cap-system-map-detail .cap-system-map-card-domain", what: "its address" },
      { sel: "#map-lit .cap-system-map-card[data-id='carrel'] .cap-system-map-card-name", what: "the lit card's name, on its tint" },
      { sel: "#map-lit .cap-system-map-card[data-id='site'] .cap-system-map-card-tie", what: "how a card is tied" },
      { sel: "#map-system [data-column='used-by'] .cap-system-map-tie-verbs", what: "a tie's verbs" },
      { sel: "#map-system [data-id='capsid-worker'] .cap-system-map-part-kind", what: "what a part runs on" },
      { sel: "#map-step [data-at] .cap-system-map-part-name", what: "the part a step moves toward, on its tint" },
    ]);
  });

  test("accessibility: lit and private are marked by more than color, and no text is under 12 px", async ({ page }) => {
    await plainMap(page, "map");
    await expect(page.locator("#map-lit .cap-system-map-card[data-id='site'] .cap-system-map-card-tie")).toHaveText("Used by Carrel");
    await expect(page.locator("#map-lit .cap-system-map-card[data-id='capsid'] .cap-system-map-card-tie")).toHaveText("Uses and used by Carrel");
    expect(await page.locator("#map-lit .cap-system-map-card[data-id='carrel']").evaluate((el) => getComputedStyle(el).outlineStyle)).toBe("solid");
    expect(await page.locator("#map .cap-system-map-card[data-id='foxing']").evaluate((el) => getComputedStyle(el).borderTopStyle)).toBe("dashed");
    const smallest = await page.locator(".cap-system-map").evaluateAll((maps) =>
      Math.min(...maps.flatMap((m) => [...m.querySelectorAll("*")].filter((el) => el.childNodes.length && [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent!.trim())).map((el) => Number.parseFloat(getComputedStyle(el).fontSize))))
    );
    expect(smallest).toBeGreaterThanOrEqual(12);
  });

  test("keyboard: the hexagons come first; focus on a cell lights its lines, and the arrow keys reach the plain map", async ({ page }) => {
    const map = page.locator("#map");
    await expect(map.getByRole("tab", { name: "Hexagons" })).toHaveAttribute("aria-selected", "true");
    await expect(map.locator(".cap-system-map-network")).toBeHidden();
    // A line for every pair of tied systems.
    await expect(map.locator(".cap-system-map-comb .cap-system-map-wire")).toHaveCount(await pairs(page));
    await map.locator(".cap-system-map-cell[data-id='prelum']").focus();
    await expect(map).toHaveAttribute("data-lit", "prelum");
    await expect(map.locator(".cap-system-map-comb .cap-system-map-wire[data-on]")).toHaveCount(1);
    await expect(map.locator(".cap-system-map-cell[data-id='site']")).toHaveAttribute("data-tie", "user");
    await map.getByRole("tab", { name: "Hexagons" }).focus();
    await page.keyboard.press("ArrowRight");
    await expect(map.getByRole("tab", { name: "Plain map" })).toHaveAttribute("aria-selected", "true");
    await expect(map.locator(".cap-system-map-hex")).toBeHidden();
    await expect(map.locator(".cap-system-map-network")).toBeVisible();
  });

  test("keyboard: Tab reaches each card's link, focus lights its ties and their wires, and the rest dim", async ({ page }) => {
    await plainMap(page, "map");
    // A wire for every pair of tied systems, drawn where the cards landed.
    await expect(page.locator("#map .cap-system-map-network .cap-system-map-wire")).toHaveCount(await pairs(page));
    const link = page.locator("#map .cap-system-map-card[data-id='prelum'] a");
    await link.focus();
    await expect(page.locator("#map")).toHaveAttribute("data-lit", "prelum");
    await expect(page.locator("#map .cap-system-map-network .cap-system-map-wire[data-on]")).toHaveCount(1);
    await expect(page.locator("#map .cap-system-map-card[data-id='site']")).toHaveAttribute("data-tie", "user");
    await expect(page.locator("#map .cap-system-map-card[data-id='ledger']")).not.toHaveAttribute("data-tie");
    // Tab goes on in the drawing's order, lighting the card it reaches.
    await page.keyboard.press("Tab");
    const next = await page.evaluate(() => document.activeElement?.closest("[data-id]")?.getAttribute("data-id") ?? "");
    expect(next).not.toBe("prelum");
    await expect(page.locator("#map")).toHaveAttribute("data-lit", next);
    await page.locator(`#map .cap-system-map-card[data-id='${next}'] a`).blur();
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

  test("behavior: as delivered with no script both views show, every system a link in each, and each flow a list; on a phone the whole plain map is in view, wired", async ({ page }) => {
    const plain = page.locator("#map-noscript");
    expect(await plain.locator(".cap-system-map-hex").getByRole("link").count()).toBe(14);
    expect(await plain.locator(".cap-system-map-network").getByRole("link").count()).toBe(14);
    await expect(plain.getByRole("tablist")).toBeHidden();
    await expect(page.locator("#map-step li[aria-current='step']")).toHaveText(/^Merged/);
    await page.setViewportSize({ width: 320, height: 800 });
    // Read at once: the wires redraw a frame later, and must not widen the page meanwhile.
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
    await expect(page.locator("#map .cap-system-map-hex")).toBeHidden();
    const graph = page.locator("#map .cap-system-map-graph");
    expect(await graph.evaluate((g) => g.scrollWidth <= g.clientWidth + 1)).toBe(true);
    await expect(page.locator("#map .cap-system-map-wires")).not.toHaveAttribute("hidden");
  });
});
