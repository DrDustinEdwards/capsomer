import { expect, test } from "@playwright/test";
import {
  eachTheme,
  expectContrast,
  expectNoAxeViolations,
  ringContrast,
  visitStates,
  settled,
} from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "row-list", theme);
    await expectNoAxeViolations(page);
  });

  test("accessibility: no axe violations at phone width", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 640 });
    await visitStates(page, "row-list", theme, "phone");
    await expectNoAxeViolations(page);
  });

  test("accessibility: the outline and muted variants keep their text at contrast", async ({
    page,
  }) => {
    await visitStates(page, "row-list", theme);
    await expectContrast(page, [
      {
        sel: "#list-variants .cap-row[data-variant='muted'] .cap-row-detail",
        what: "a muted row's detail",
      },
      {
        sel: "#list-variants .cap-row[data-variant='outline'] .cap-row-title a",
        what: "an outline row's title",
      },
      {
        sel: "#list-variants .cap-row[data-force='hover'] .cap-row-detail",
        what: "a hovered row's detail",
      },
    ]);
  });

  test("keyboard: a row in the outline variant is still one tab stop with the focus ring", async ({
    page,
  }) => {
    await visitStates(page, "row-list", theme);
    await page.getByRole("link", { name: "Outline variant, with an icon" }).focus();
    await expect(page.locator("#list-variants .cap-row[data-variant='outline']").first()).toHaveCSS(
      "outline-style",
      "solid",
    );
  });

  test("accessibility: title, detail and time reach their contrast, at rest and focused", async ({
    page,
  }) => {
    await visitStates(page, "row-list", theme);
    await expectContrast(page, [
      { sel: "#list-mixed .cap-row-title a", what: "a row's title" },
      { sel: "#list-mixed .cap-row-detail", what: "a row's detail line" },
      { sel: "#list-mixed .cap-row-meta", what: "a row's time" },
      {
        sel: "#list-focus .cap-row[data-force='focus'] .cap-row-title a",
        what: "a focused row's title on --sel",
      },
      {
        sel: "#list-focus .cap-row[data-force='focus'] .cap-row-detail",
        what: "a focused row's detail on --sel",
      },
      {
        sel: "#list-focus .cap-row[data-force='focus'] .cap-row-meta",
        what: "a focused row's time on --sel",
      },
    ]);
  });

  test("accessibility: the focused row's ring is 3:1 against the row's tint, and at least 2 px", async ({
    page,
  }) => {
    await visitStates(page, "row-list", theme);
    const r = await ringContrast(page, "#list-focus .cap-row[data-force='focus']");
    expect(r, "the focused specimen row is on the page").not.toBeNull();
    expect(r?.width).toBe("2px");
    expect(r?.ratio ?? 0, `ring ${r?.ring} on ${r?.bg}`).toBeGreaterThanOrEqual(3);
  });

  test("accessibility: the ring a real keyboard focus draws matches the specimen's", async ({
    page,
  }) => {
    await visitStates(page, "row-list", theme);
    await page.getByRole("link", { name: "4 notices" }).focus();
    // The row's tint eases in over 100 ms: read it once the transition has finished.
    await settled(page);
    const real = await ringContrast(page, "#list-mixed .cap-row:has(a:focus-visible)");
    const forced = await ringContrast(page, "#list-focus .cap-row[data-force='focus']");
    expect(real?.ring).toBe(forced?.ring);
    expect(real?.bg).toBe(forced?.bg);
  });

  test("keyboard: j and k move focus between the primary list's rows", async ({ page }) => {
    await visitStates(page, "row-list", theme);
    await page.locator("h1").click();
    await page.keyboard.press("j");
    await expect(page.getByRole("link", { name: "example.org is not answering" })).toBeFocused();
    await page.keyboard.press("j");
    await expect(
      page.getByRole("link", { name: "D1 rows read will run out before the reset" }),
    ).toBeFocused();
    await page.keyboard.press("k");
    await expect(page.getByRole("link", { name: "example.org is not answering" })).toBeFocused();
    await page.keyboard.press("k");
    await expect(page.getByRole("link", { name: "example.org is not answering" })).toBeFocused();
  });

  test("keyboard: k from outside the list starts at its last row", async ({ page }) => {
    await visitStates(page, "row-list", theme);
    await page.locator("h1").click();
    await page.keyboard.press("k");
    await expect(page.getByRole("link", { name: "4 notices" })).toBeFocused();
  });

  test("keyboard: j stops at the last row", async ({ page }) => {
    await visitStates(page, "row-list", theme);
    await page.getByRole("link", { name: "example.net: no backup reported" }).focus();
    await page.keyboard.press("j");
    await expect(page.getByRole("link", { name: "4 notices" })).toBeFocused();
    await page.keyboard.press("j");
    await expect(page.getByRole("link", { name: "4 notices" })).toBeFocused();
  });

  test("keyboard: j and k work in any list once focus is in it, and only there", async ({
    page,
  }) => {
    await visitStates(page, "row-list", theme);
    const list = page.locator("#list-focus");
    await list.getByRole("link", { name: "Run the browser tests for capsomer" }).focus();
    await page.keyboard.press("j");
    await expect(
      list.getByRole("link", { name: "Refresh the uptime strip fixtures" }),
    ).toBeFocused();
    await page.keyboard.press("k");
    await expect(
      list.getByRole("link", { name: "Run the browser tests for capsomer" }),
    ).toBeFocused();
  });

  test("keyboard: j typed into a field stays in the field", async ({ page }) => {
    await visitStates(page, "row-list", theme);
    await page.evaluate(() => {
      const input = Object.assign(document.createElement("input"), { id: "probe", type: "text" });
      input.setAttribute("aria-label", "Filter");
      document.querySelector("h1")?.after(input);
    });
    await page.locator("#probe").focus();
    await page.keyboard.type("jk");
    await expect(page.locator("#probe")).toBeFocused();
    await expect(page.locator("#probe")).toHaveValue("jk");
  });

  test("keyboard: j does nothing when single-key shortcuts are off", async ({ page }) => {
    await visitStates(page, "row-list", theme);
    await page.evaluate(() => (document.documentElement.dataset.capSingleKeys = "off"));
    await page.locator("h1").click();
    await page.keyboard.press("j");
    await expect(
      page.getByRole("link", { name: "example.org is not answering" }),
    ).not.toBeFocused();
  });

  test("behavior: a click anywhere on the row follows its link", async ({ page }) => {
    await visitStates(page, "row-list", theme);
    // The stretched link covers the whole row, so a click on the row lands on the link.
    await page.locator("#list-crit .cap-row").click();
    await expect(page).toHaveURL(/#job-failed$/);
  });

  test("behavior: row actions sit above the stretched link and take their own clicks", async ({
    page,
  }) => {
    await visitStates(page, "row-list", theme);
    await page.locator("#act-decline").scrollIntoViewIfNeeded();
    const hit = await page.evaluate(() => {
      const b = document.getElementById("act-decline")?.getBoundingClientRect();
      if (!b) return null;
      return document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2)?.id ?? null;
    });
    expect(hit).toBe("act-decline");
    await page.locator("#act-decline").click();
    await expect(page).not.toHaveURL(/#job-push$/);
  });

  test("behavior: at phone width every row's text starts in one column, with or without an icon or a picture beside it", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await visitStates(page, "row-list", theme);
    const starts = await page.locator("#list-variants .cap-row").evaluateAll((rows) =>
      rows.map((r) => {
        const t = r.querySelector(".cap-row-title")!.getBoundingClientRect();
        const m = r.querySelector(".cap-row-media")?.getBoundingClientRect();
        return {
          x: Math.round(t.left),
          beside: m ? m.right <= t.left && m.top < t.bottom && m.bottom > t.top : true,
        };
      }),
    );
    expect(starts.length).toBe(5);
    expect(
      new Set(starts.map((s) => s.x)).size,
      `title starts ${starts.map((s) => s.x).join(", ")}`,
    ).toBe(1);
    expect(
      starts.every((s) => s.beside),
      "every icon and picture is beside its title",
    ).toBe(true);
  });

  test("keyboard: j and k reach a group row's button like any row's link", async ({ page }) => {
    await visitStates(page, "row-list", theme);
    await page.getByRole("button", { name: "3 pull requests await the seat" }).focus();
    await expect(page.locator("#list-group .cap-row")).toHaveCSS("outline-style", "solid");
    await page.keyboard.press("j");
    await expect(
      page.getByRole("button", { name: "3 pull requests await the seat" }),
    ).toBeFocused();
  });

  test("behavior: in a narrow column an icon stays beside its title, as it is in a wide one", async ({
    page,
  }) => {
    const sideBySide = async () =>
      page
        .locator("#list-variants .cap-row:has(> .cap-row-media[data-variant='icon'])")
        .evaluateAll((rows) =>
          rows.map((row) => {
            const m = row.querySelector(".cap-row-media")!.getBoundingClientRect();
            const t = row.querySelector(".cap-row-title")!.getBoundingClientRect();
            return m.right <= t.left && m.top < t.bottom && m.bottom > t.top;
          }),
        );
    await visitStates(page, "row-list", theme);
    const wide = await sideBySide();
    await page.setViewportSize({ width: 390, height: 640 });
    const narrow = await sideBySide();
    expect(wide.length, "icon rows measured").toBeGreaterThanOrEqual(2);
    expect(wide).toEqual(wide.map(() => true));
    expect(narrow).toEqual(wide);
  });

  test("behavior: at phone width a long title wraps instead of being cut", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 640 });
    await visitStates(page, "row-list", theme, "phone");
    const link = page.locator("#phone-long-title");
    const cut = await link.evaluate((el) => el.scrollWidth > el.clientWidth);
    expect(cut).toBe(false);
    await expect(link).toHaveCSS("white-space", "normal");
  });
});

test("keyboard: a reply opens in its row with focus in the box, says why an empty one is not sent, sends on Ctrl+Enter and cancels on Esc", async ({
  page,
}) => {
  await visitStates(page, "row-list", "light");
  const row = page.locator("#rl-reply");
  await row.getByRole("button", { name: "Answer Release sample/api 2.4.0" }).click();
  const box = row.getByLabel("Your answer, sent to its driver");
  await expect(box).toBeFocused();
  await row.getByRole("button", { name: "Send" }).click();
  await expect(row.getByRole("alert")).toHaveText("Write your answer first.");
  await expectNoAxeViolations(page);
  await box.press("Escape");
  await expect(box).toHaveCount(0);
  await row.getByRole("button", { name: "Answer Release sample/api 2.4.0" }).click();
  await row.getByLabel("Your answer, sent to its driver").fill("Yes, publish it.");
  await row.getByLabel("Your answer, sent to its driver").press("Control+Enter");
  await expect(row).toContainText("Sent: Yes, publish it.");
});
