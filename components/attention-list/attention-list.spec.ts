import { expect, test } from "@playwright/test";
import { eachTheme, expectContrast, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";
import { arrange, GROUP_CHILDREN, PROBLEM_ROWS, problemCount, type AttentionEntry, type AttentionItem } from "./attention-list.ts";

const mixed = "section[aria-labelledby='s-mixed']";
const expanded = "section[aria-labelledby='s-expanded']";
const more = "section[aria-labelledby='s-more']";

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "attention-list", theme);
    await expectNoAxeViolations(page);
  });

  test("accessibility: no axe violations with the group, the warnings and the notices open", async ({ page }) => {
    await visitStates(page, "attention-list", theme);
    await page.locator(mixed).getByRole("button", { name: "3 pull requests await the seat" }).click();
    await page.locator(mixed).getByRole("button", { name: "4 notices" }).click();
    await page.locator(more).getByRole("button", { name: "2 more warnings" }).click();
    await expectNoAxeViolations(page);
  });

  test("accessibility: no axe violations at phone width", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 760 });
    await visitStates(page, "attention-list", theme, "phone");
    await expectNoAxeViolations(page);
  });

  test("accessibility: the header, the rows under a group, the links and the all-clear text reach their contrast", async ({ page }) => {
    await visitStates(page, "attention-list", theme);
    await expectContrast(page, [
      { sel: `${mixed} .cap-attention-title`, what: "the list's title" },
      { sel: `${mixed} .cap-attention-count`, what: "the problem count" },
      { sel: `${mixed} .cap-attention-src`, what: "the order and freshness line" },
      { sel: `${expanded} .cap-attention-child .cap-row-title a`, what: "a row under a group, on the raised tone" },
      { sel: `${expanded} .cap-attention-child .cap-row-detail`, what: "its detail line" },
      { sel: `${expanded} .cap-attention-child .cap-row-meta`, what: "its time" },
      { sel: `${expanded} .cap-attention-link a`, what: "the link to the group's view, on the raised tone" },
      { sel: `${more} .cap-attention-link button`, what: "the button that shows more warnings" },
      { sel: "section[aria-labelledby='s-clear'] .cap-attention-clear-text", what: "the all-clear text" },
    ]);
  });

  test("accessibility: the list's roles and names", async ({ page }) => {
    await visitStates(page, "attention-list", theme);
    await expect(page.locator(`${mixed} .cap-attention`)).toMatchAriaSnapshot(`
      - region "Needs attention":
        - heading "Needs attention" [level=3]
        - list "Needs attention":
          - listitem:
            - link "foxhound.app is not answering"
          - listitem:
            - link "Nightly backup for capsid failed"
          - listitem:
            - link "D1 rows read will run out before the reset"
          - listitem:
            - link "2 jobs are waiting for approval"
          - listitem:
            - button "3 pull requests await the seat"
          - listitem:
            - button "4 notices"
    `);
    const g = page.locator(mixed).getByRole("button", { name: "3 pull requests await the seat" });
    await expect(g).toHaveAttribute("aria-expanded", "false");
    await expect(g).toHaveAttribute("aria-controls", "att-mixed-prs");
    await expect(g).toHaveAccessibleDescription(/Warning/);
    await expect(page.locator("#att-mixed-prs")).toBeHidden();
    await expect(page.locator("#att-mixed-notices")).toBeHidden();
  });

  test("accessibility: a link's description carries its status and detail", async ({ page }) => {
    await visitStates(page, "attention-list", theme);
    await expect(page.locator(mixed).getByRole("link", { name: "foxhound.app is not answering" })).toHaveAccessibleDescription("Critical 3 failed checks in a row, first at 14:02");
  });

  test("keyboard: Tab reaches each row's title, then the group button, then the notices button", async ({ page }) => {
    await visitStates(page, "attention-list", theme);
    const root = page.locator(mixed);
    await root.getByRole("link", { name: "foxhound.app is not answering" }).focus();
    for (const name of ["Nightly backup for capsid failed", "D1 rows read will run out before the reset", "2 jobs are waiting for approval"]) {
      await page.keyboard.press("Tab");
      await expect(root.getByRole("link", { name })).toBeFocused();
    }
    await page.keyboard.press("Tab");
    await expect(root.getByRole("button", { name: "3 pull requests await the seat" })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(root.getByRole("button", { name: "4 notices" })).toBeFocused();
  });

  test("keyboard: Enter on a group's button shows its rows, and Tab moves into them", async ({ page }) => {
    await visitStates(page, "attention-list", theme);
    const button = page.locator(mixed).getByRole("button", { name: "3 pull requests await the seat" });
    await button.focus();
    await page.keyboard.press("Enter");
    await expect(button).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator("#att-mixed-prs")).toBeVisible();
    await page.keyboard.press("Tab");
    await expect(page.locator("#att-mixed-prs").getByRole("link", { name: "capsid #212 awaits the seat" })).toBeFocused();
  });

  test("keyboard: Space on a group's button hides its rows again", async ({ page }) => {
    await visitStates(page, "attention-list", theme);
    const button = page.locator(expanded).getByRole("button", { name: "7 jobs are waiting on you" });
    await expect(button).toHaveAttribute("aria-expanded", "true");
    await button.focus();
    await page.keyboard.press("Space");
    await expect(button).toHaveAttribute("aria-expanded", "false");
    await expect(page.locator("#att-open-jobs")).toBeHidden();
  });

  test("keyboard: Enter on the notices button shows the notices, each a link", async ({ page }) => {
    await visitStates(page, "attention-list", theme);
    const button = page.locator(mixed).getByRole("button", { name: "4 notices" });
    await button.focus();
    await page.keyboard.press("Enter");
    await expect(button).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("Tab");
    await expect(page.locator("#att-mixed-notices").getByRole("link", { name: "germomics: no backup reported" })).toBeFocused();
  });

  test("keyboard: Enter on the more-warnings button shows the warnings past the cap", async ({ page }) => {
    await visitStates(page, "attention-list", theme);
    // Found by what it controls: its name changes when it opens.
    const button = page.locator(more).locator("button[aria-controls='att-more-rows']");
    await expect(button).toHaveText("2 more warnings");
    await expect(page.locator("#att-more-rows")).toBeHidden();
    await button.focus();
    await page.keyboard.press("Enter");
    await expect(button).toHaveAttribute("aria-expanded", "true");
    await expect(button).toHaveText("Fewer warnings");
    await expect(page.locator("#att-more-rows").getByRole("link", { name: "Capsid reports degraded health" })).toBeVisible();
  });

  test("keyboard: Enter on a row's title follows its link", async ({ page }) => {
    await visitStates(page, "attention-list", theme);
    await page.locator(mixed).getByRole("link", { name: "foxhound.app is not answering" }).focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#att-foxhound$/);
  });

  test("keyboard: j and k move focus among the rows, the group's button and the notices button included", async ({ page }) => {
    await visitStates(page, "attention-list", theme);
    const root = page.locator(mixed);
    await page.locator("h1").click();
    await page.keyboard.press("j");
    await expect(root.getByRole("link", { name: "foxhound.app is not answering" })).toBeFocused();
    for (let i = 0; i < 4; i++) await page.keyboard.press("j");
    await expect(root.getByRole("button", { name: "3 pull requests await the seat" })).toBeFocused();
    await page.keyboard.press("j");
    await expect(root.getByRole("button", { name: "4 notices" })).toBeFocused();
    await page.keyboard.press("k");
    await expect(root.getByRole("button", { name: "3 pull requests await the seat" })).toBeFocused();
  });

  test("keyboard: j goes from a group's button into its rows once it is open", async ({ page }) => {
    await visitStates(page, "attention-list", theme);
    const root = page.locator(mixed);
    const button = root.getByRole("button", { name: "3 pull requests await the seat" });
    await button.focus();
    await page.keyboard.press("Enter");
    await page.keyboard.press("j");
    await expect(root.getByRole("link", { name: "capsid #212 awaits the seat" })).toBeFocused();
    await page.keyboard.press("j");
    await expect(root.getByRole("link", { name: "carrel #88 awaits the seat" })).toBeFocused();
  });

  test("behaviour: critical rows are never inside what a button controls", async ({ page }) => {
    await visitStates(page, "attention-list", theme);
    await expect(page.locator(".cap-attention-region .cap-row[data-tone='crit']")).toHaveCount(0);
    await expect(page.locator(".cap-attention-region .cap-status[data-tone='crit']")).toHaveCount(0);
  });

  test("behaviour: a group's rows start under its title, whatever the status column's width", async ({ page }) => {
    await visitStates(page, "attention-list", theme);
    const title = await page.locator(expanded).getByRole("button", { name: "7 jobs are waiting on you" }).boundingBox();
    const child = await page.locator("#att-open-jobs").getByRole("link", { name: "Merge carrel #88" }).boundingBox();
    expect(title && child).toBeTruthy();
    if (title && child) expect(Math.abs(title.x - child.x)).toBeLessThanOrEqual(1);
  });

  test("behaviour: a click anywhere on a group's row opens it", async ({ page }) => {
    await visitStates(page, "attention-list", theme);
    const row = page.locator(mixed).locator(".cap-row", { has: page.getByRole("button", { name: "3 pull requests await the seat" }) });
    await row.click({ position: { x: 4, y: 4 } });
    await expect(page.locator("#att-mixed-prs")).toBeVisible();
  });

  test("behaviour: at phone width a title wraps instead of being cut, and a group's rows sit at the edge", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 760 });
    await visitStates(page, "attention-list", theme, "phone");
    for (const id of ["#phone-att-title", "#phone-child-title"]) {
      const cut = await page.locator(id).evaluate((el) => el.scrollWidth > el.clientWidth);
      expect(cut, `${id} is cut`).toBe(false);
    }
    const head = await page.getByRole("button", { name: "3 pull requests await the seat" }).boundingBox();
    const child = await page.locator("#phone-child-title").boundingBox();
    expect(head && child).toBeTruthy();
    if (head && child) expect(Math.abs(head.x - child.x)).toBeLessThanOrEqual(1);
  });
});

test.describe("arrange()", () => {
  const item = (id: string, tone: AttentionItem["tone"], group?: string): AttentionItem => ({ id, tone, title: id, href: `#${id}`, group });
  const ids = (list: AttentionEntry[]) => list.map((e) => (e.kind === "row" ? e.item.id : e.key));

  test("behaviour: arrange puts the worst first and keeps the given order within a tone", () => {
    const out = arrange([item("a", "info"), item("b", "warn"), item("c", "crit"), item("d", "nodata"), item("e", "warn")]);
    expect(ids(out.problems)).toEqual(["c", "b", "e"]);
    expect(out.notices.map((n) => n.id)).toEqual(["d", "a"]);
  });

  test("behaviour: no data and notices are one tier at the foot, not rows among the problems", () => {
    const out = arrange([item("n1", "nodata"), item("n2", "info"), item("w", "warn")]);
    expect(ids(out.problems)).toEqual(["w"]);
    expect(out.noticeCount).toBe(2);
    expect(out.more).toEqual([]);
  });

  test("behaviour: arrange folds rows that share a key, named with their count, where the worst row sits", () => {
    const out = arrange([item("w", "warn"), item("g1", "warn", "PRs"), item("g2", "warn", "PRs"), item("g3", "warn", "PRs")]);
    expect(ids(out.problems)).toEqual(["w", "PRs"]);
    const g = out.problems[1];
    expect(g?.kind).toBe("group");
    if (g?.kind === "group") {
      expect(g.label).toBe("PRs, 3");
      expect(g.tone).toBe("warn");
      expect(g.total).toBe(3);
      expect(g.items.map((i) => i.id)).toEqual(["g1", "g2", "g3"]);
    }
  });

  test("behaviour: a group takes its title, detail and view from the caller, and shows at most five rows", () => {
    const rows = Array.from({ length: 7 }, (_, i) => item(`p${i}`, "warn", "pr"));
    const out = arrange(rows, { groups: { pr: { title: (n) => `${n} pull requests await the seat`, detail: "capsid, carrel", view: { href: "#ci", label: "CI" } } } });
    const g = out.problems[0];
    expect(g?.kind).toBe("group");
    if (g?.kind === "group") {
      expect(g.label).toBe("7 pull requests await the seat");
      expect(g.detail).toBe("capsid, carrel");
      expect(g.items).toHaveLength(GROUP_CHILDREN);
      expect(g.total).toBe(7);
      expect(g.view?.href).toBe("#ci");
    }
  });

  test("behaviour: arrange never folds a critical row, and a group of one is a row", () => {
    const out = arrange([item("c1", "crit", "Sites"), item("c2", "crit", "Sites"), item("w1", "warn", "Sites")]);
    expect(out.problems.map((e) => e.kind)).toEqual(["row", "row", "row"]);
  });

  test("behaviour: warnings past the cap wait behind the button, and critical rows are always shown", () => {
    const crit = Array.from({ length: 3 }, (_, i) => item(`c${i}`, "crit"));
    const warn = Array.from({ length: 9 }, (_, i) => item(`w${i}`, "warn"));
    const out = arrange([...warn, ...crit]);
    expect(out.problems).toHaveLength(PROBLEM_ROWS);
    expect(ids(out.problems).slice(0, 3)).toEqual(["c0", "c1", "c2"]);
    expect(out.more).toHaveLength(12 - PROBLEM_ROWS);
    const flood = arrange(Array.from({ length: PROBLEM_ROWS + 4 }, (_, i) => item(`c${i}`, "crit")));
    expect(flood.problems).toHaveLength(PROBLEM_ROWS + 4);
    expect(flood.more).toEqual([]);
  });

  test("behaviour: a group of notices is one row that opens its view", () => {
    const out = arrange([item("s1", "nodata", "silent"), item("s2", "nodata", "silent"), item("i", "info")], { groups: { silent: { title: (n) => `${n} drivers have been silent for over 7 days`, view: { href: "#agents", label: "Agents" } } } });
    expect(out.notices.map((n) => n.title)).toEqual(["2 drivers have been silent for over 7 days", "i"]);
    expect(out.notices[0]?.href).toBe("#agents");
    expect(out.noticeCount).toBe(3);
  });

  test("behaviour: arrange of nothing is empty, the all-clear case", () => {
    const out = arrange([]);
    expect(out.problems).toEqual([]);
    expect(out.more).toEqual([]);
    expect(out.notices).toEqual([]);
    expect(problemCount(out)).toBe("No problems");
  });
});
