import { expect, test } from "@playwright/test";
import { eachTheme, expectContrast, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";
import { arrange, type AttentionItem } from "./attention-list.ts";

const mixed = "section[aria-labelledby='s-mixed']";
const expanded = "section[aria-labelledby='s-expanded']";

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "attention-list", theme);
    await expectNoAxeViolations(page);
  });

  test("accessibility: no axe violations with the group open", async ({ page }) => {
    await visitStates(page, "attention-list", theme);
    await page.locator(mixed).getByRole("button", { name: "Notices, 4" }).click();
    await expectNoAxeViolations(page);
  });

  test("accessibility: the header, the group's rows and the all-clear text reach their contrast", async ({ page }) => {
    await visitStates(page, "attention-list", theme);
    await expectContrast(page, [
      { sel: `${mixed} .cap-attention-title`, what: "the list's title" },
      { sel: `${mixed} .cap-attention-src`, what: "the order and freshness line" },
      { sel: "section[aria-labelledby='s-clear'] .cap-attention-clear-text", what: "the all-clear text" },
    ]);
  });

  test("accessibility: the list's roles and names", async ({ page }) => {
    await visitStates(page, "attention-list", theme);
    await expect(page.locator(`${mixed} .cap-attention`)).toMatchAriaSnapshot(`
      - region "Needs attention":
        - heading "Needs attention" [level=3]
        - list:
          - listitem:
            - link "foxhound.app is not answering"
          - listitem:
            - link "Nightly backup for capsid failed"
          - listitem:
            - link "D1 rows read will run out before the reset"
          - listitem:
            - link "2 jobs are waiting for approval"
          - listitem:
            - link "germomics: no backup reported"
          - listitem:
            - button "Notices, 4"
    `);
    await expect(page.locator(`${mixed} [data-cap-part='group-toggle']`)).toHaveAttribute("aria-expanded", "false");
  });

  test("keyboard: Tab reaches each row's title, then the group button", async ({ page }) => {
    await visitStates(page, "attention-list", theme);
    const root = page.locator(mixed);
    await root.getByRole("link", { name: "foxhound.app is not answering" }).focus();
    for (const name of ["Nightly backup for capsid failed", "D1 rows read will run out before the reset", "2 jobs are waiting for approval", "germomics: no backup reported"]) {
      await page.keyboard.press("Tab");
      await expect(root.getByRole("link", { name })).toBeFocused();
    }
    await page.keyboard.press("Tab");
    await expect(root.getByRole("button", { name: "Notices, 4" })).toBeFocused();
  });

  test("keyboard: Enter on a group button shows its rows, and Tab moves into them", async ({ page }) => {
    await visitStates(page, "attention-list", theme);
    const button = page.locator(mixed).getByRole("button", { name: "Notices, 4" });
    await button.focus();
    await page.keyboard.press("Enter");
    await expect(button).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator("#att-mixed-notices")).toBeVisible();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "Dependency update: vite 8.3.2" })).toBeFocused();
  });

  test("keyboard: Space on a group button hides its rows again", async ({ page }) => {
    await visitStates(page, "attention-list", theme);
    const button = page.locator(expanded).getByRole("button", { name: "Notices, 3" });
    await expect(button).toHaveAttribute("aria-expanded", "true");
    await button.focus();
    await page.keyboard.press("Space");
    await expect(button).toHaveAttribute("aria-expanded", "false");
    await expect(page.locator("#att-open-notices")).toBeHidden();
  });

  test("keyboard: Enter on a row's title follows its link", async ({ page }) => {
    await visitStates(page, "attention-list", theme);
    await page.locator(mixed).getByRole("link", { name: "foxhound.app is not answering" }).focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#att-foxhound$/);
  });

  test("behaviour: critical rows are never inside a group", async ({ page }) => {
    await visitStates(page, "attention-list", theme);
    await expect(page.locator(".cap-attention-members .cap-row[data-tone='crit']")).toHaveCount(0);
    await expect(page.locator(".cap-attention-members .cap-status[data-tone='crit']")).toHaveCount(0);
  });
});

test.describe("arrange()", () => {
  const item = (id: string, tone: AttentionItem["tone"], group?: string): AttentionItem => ({ id, tone, title: id, href: `#${id}`, group });

  test("behaviour: arrange puts the worst first and keeps the given order within a tone", () => {
    const out = arrange([item("a", "info"), item("b", "warn"), item("c", "crit"), item("d", "nodata"), item("e", "warn")]);
    expect(out.map((e) => (e.kind === "row" ? e.item.id : e.key))).toEqual(["c", "b", "e", "d", "a"]);
  });

  test("behaviour: arrange groups rows that share a key, named with their count", () => {
    const out = arrange([item("n1", "info", "Notices"), item("w", "warn"), item("n2", "info", "Notices"), item("n3", "info", "Notices")]);
    expect(out).toHaveLength(2);
    const g = out[1];
    expect(g?.kind).toBe("group");
    if (g?.kind === "group") {
      expect(g.label).toBe("Notices, 3");
      expect(g.tone).toBe("info");
      expect(g.items.map((i) => i.id)).toEqual(["n1", "n2", "n3"]);
    }
  });

  test("behaviour: arrange never groups a critical row, and a group of one is a row", () => {
    const out = arrange([item("c1", "crit", "Sites"), item("c2", "crit", "Sites"), item("w1", "warn", "Sites")]);
    expect(out.map((e) => e.kind)).toEqual(["row", "row", "row"]);
  });

  test("behaviour: a group sits where its worst row would", () => {
    const out = arrange([item("i", "info"), item("g1", "info", "Updates"), item("g2", "warn", "Updates"), item("n", "nodata")]);
    expect(out.map((e) => (e.kind === "row" ? e.item.id : e.key))).toEqual(["Updates", "n", "i"]);
    const g = out[0];
    if (g?.kind === "group") expect(g.tone).toBe("warn");
  });

  test("behaviour: arrange of nothing is empty, the all-clear case", () => {
    expect(arrange([])).toEqual([]);
  });
});
