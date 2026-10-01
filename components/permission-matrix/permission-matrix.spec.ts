import { expect, test } from "@playwright/test";
import { eachTheme, expectContrast, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";
import { holders, holdings, type PermMatrix } from "./permission-matrix.ts";

const sample: PermMatrix = {
  permissions: ["Merge", "Write to main", "Start CI", "Edit workflows", "Money paths"],
  agents: [
    { name: "seat", holds: ["Start CI", "Merge"] },
    { name: "capsomer-driver", holds: [] },
    { name: "foxhound-driver", holds: ["Money paths", "Start CI"] },
  ],
};

test("behaviour: holdings lists what each agent holds, in column order", () => {
  expect(holdings(sample)).toEqual([
    { agent: "seat", held: ["Merge", "Start CI"], text: "Holds: Merge, Start CI" },
    { agent: "capsomer-driver", held: [], text: "Holds no permissions" },
    { agent: "foxhound-driver", held: ["Start CI", "Money paths"], text: "Holds: Start CI, Money paths" },
  ]);
});

test("behaviour: holders lists who holds each permission, and says when nobody does", () => {
  const h = holders(sample);
  expect(h.map((x) => x.text)).toEqual(["Held by: seat", "Nobody holds this", "Held by: seat, foxhound-driver", "Nobody holds this", "Held by: foxhound-driver"]);
});

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "permission-matrix", theme);
    await expectNoAxeViolations(page);
  });

  test("accessibility: no axe violations, narrow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 760 });
    await visitStates(page, "permission-matrix", theme, "narrow");
    await expectNoAxeViolations(page);
  });

  test("accessibility: ticks, dashes and card text reach their contrast", async ({ page }) => {
    await visitStates(page, "permission-matrix", theme);
    await expectContrast(page, [
      { sel: "#perms-wide .cap-perms-cell[data-held='yes']", what: "a tick", min: 3 },
      { sel: "#perms-wide .cap-perms-cell[data-held='no']", what: "a dash", min: 3 },
      { sel: "#perms-wide .cap-perms-agent", what: "an agent's name" },
      { sel: "#perms-wide .cap-perms-note", what: "the note" },
      { sel: "#perms-by-permission .cap-perms-name", what: "a permission's name" },
      { sel: "#perms-by-permission .cap-perms-key", what: "the Held by label" },
      { sel: "#perms-by-permission .cap-perms-holds:not([data-empty])", what: "who holds it" },
      { sel: "#perms-by-permission .cap-perms-holds[data-empty]", what: "Nobody holds this" },
    ]);
  });

  test("accessibility: the switch and the table's roles and names", async ({ page }) => {
    await visitStates(page, "permission-matrix", theme);
    const wide = page.locator("#perms-wide");
    await expect(wide).toMatchAriaSnapshot(`
      - group "View":
        - radio "By agent" [checked]
        - radio "By permission"
      - region "Permissions by agent":
        - table
    `);
    const region = wide.getByRole("region", { name: "Permissions by agent" });
    await expect(region.getByRole("columnheader", { name: "Money paths" })).toBeVisible();
    await expect(region.getByRole("rowheader", { name: "foxhound-driver" })).toBeVisible();
    await expect(region.getByRole("cell", { name: "Yes" })).toHaveCount(5);
    await expect(region.getByRole("cell", { name: "No" })).toHaveCount(15);
  });

  test("accessibility: a narrow container shows one card per agent, listing only what it holds", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 760 });
    await visitStates(page, "permission-matrix", theme, "narrow");
    await expect(page.getByRole("table")).toBeHidden();
    const cards = page.getByRole("list", { name: "Permissions by agent" });
    await expect(cards).toBeVisible();
    await expect(cards.getByRole("listitem")).toHaveCount(4);
    await expect(cards.getByRole("listitem").filter({ hasText: "foxhound-driver" })).toContainText("Holds: Start CI, Money paths");
    await expect(cards.getByRole("listitem").filter({ hasText: "capsomer-driver" })).toContainText("Holds no permissions");
    await expectContrast(page, [
      { sel: ".cap-perms-narrow .cap-perms-name", what: "an agent's name on a card" },
      { sel: ".cap-perms-narrow .cap-perms-key", what: "the Holds label" },
      { sel: ".cap-perms-narrow .cap-perms-holds[data-empty]", what: "Holds no permissions" },
    ]);
  });

  test("keyboard: Tab reaches the view switch, then the table's scroll region", async ({ page }) => {
    await visitStates(page, "permission-matrix", theme);
    const wide = page.locator("#perms-wide");
    await wide.getByRole("radio", { name: "By agent" }).focus();
    await expect(wide.getByRole("radio", { name: "By agent" })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(wide.getByRole("region", { name: "Permissions by agent" })).toBeFocused();
  });

  test("keyboard: arrow keys on the switch move between By agent and By permission", async ({ page }) => {
    await visitStates(page, "permission-matrix", theme);
    const wide = page.locator("#perms-wide");
    await wide.getByRole("radio", { name: "By agent" }).focus();
    await page.keyboard.press("ArrowRight");
    await expect(wide.getByRole("radio", { name: "By permission" })).toBeChecked();
    await expect(wide.getByRole("radio", { name: "By permission" })).toBeFocused();
    await expect(wide.locator(".cap-perms-view[data-view='agent']")).toHaveAttribute("hidden", "");
    await expect(wide.getByRole("list", { name: "Agents by permission" })).toBeVisible();
    await expect(wide.getByRole("listitem").filter({ hasText: "Write to main" })).toContainText("Nobody holds this");
    await page.keyboard.press("ArrowLeft");
    await expect(wide.getByRole("radio", { name: "By agent" })).toBeChecked();
    await expect(wide.locator(".cap-perms-view[data-view='permission']")).toHaveAttribute("hidden", "");
    await expect(wide.getByRole("region", { name: "Permissions by agent" })).toBeVisible();
  });

  test("behaviour: the By permission specimen starts on its own view", async ({ page }) => {
    await visitStates(page, "permission-matrix", theme);
    const perm = page.locator("#perms-by-permission");
    await expect(perm.getByRole("list", { name: "Agents by permission, second sample" })).toBeVisible();
    await expect(perm.getByRole("table")).toBeHidden();
  });
});
