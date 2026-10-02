import { expect, test, type Page } from "@playwright/test";
import { eachTheme, expectContrast, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";
import { pageCountOf, pageItems, showingRange, statusText } from "./pagination.ts";

const nav = (page: Page) => page.locator("#pg-buttons");
const status = (page: Page) => nav(page).locator(".cap-pagination-status");
const current = (page: Page) => nav(page).locator(".cap-page[aria-current='page']");

test("behaviour: the page numbers keep seven slots, the first and last page always shown, a gap for the rest", () => {
  expect(pageItems(1, 5)).toEqual([1, 2, 3, 4, 5]);
  expect(pageItems(3, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  for (let p = 1; p <= 16; p++) {
    const items = pageItems(p, 16);
    expect(items, `page ${p}`).toHaveLength(7);
    expect(items[0]).toBe(1);
    expect(items[6]).toBe(16);
    expect(items, `page ${p} shows itself`).toContain(p);
  }
  expect(pageItems(3, 16)).toEqual([1, 2, 3, 4, 5, "gap-end", 16]);
  expect(pageItems(8, 16)).toEqual([1, "gap-start", 7, 8, 9, "gap-end", 16]);
  expect(pageItems(15, 16)).toEqual([1, "gap-start", 12, 13, 14, 15, 16]);
  expect(pageItems(0, 0)).toEqual([]);
});

test("behaviour: the count line says which items are on the page", () => {
  expect(statusText(3, 20, 312, "posts")).toBe("Showing 41 to 60 of 312 posts");
  expect(statusText(16, 20, 312, "posts")).toBe("Showing 301 to 312 of 312 posts");
  expect(statusText(3, 20, 41, "posts")).toBe("Showing 41 of 41 posts");
  expect(statusText(1, 20, 0, "posts")).toBe("No posts");
  expect(showingRange(2, 25, 61)).toEqual({ from: 26, to: 50 });
  expect(pageCountOf(312, 20)).toBe(16);
  expect(pageCountOf(0, 20)).toBe(1);
});

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "pagination", theme);
    await expectNoAxeViolations(page);
  });

  test("accessibility: text and the edges of the controls reach their contrast", async ({ page }) => {
    await visitStates(page, "pagination", theme);
    await expectContrast(page, [
      { sel: "#pg-middle .cap-pagination-status", what: "the count line" },
      { sel: "#pg-middle .cap-pagination-num .cap-page:not([aria-current])", what: "a page link" },
      { sel: "#pg-middle .cap-page[aria-current='page']", what: "the current page" },
      { sel: "#pg-middle .cap-page[aria-current='page']", what: "the current page's edge", part: "border" },
      { sel: "#pg-middle .cap-page[data-kind='next']", what: "Next" },
      { sel: "#pg-middle .cap-page[data-kind='next']", what: "Next's edge", part: "border" },
      { sel: "#pg-first .cap-page[data-kind='prev']", what: "a disabled Previous (kept readable)" },
      { sel: "#pg-middle .cap-page-gap", what: "the gap" },
    ]);
  });

  test("accessibility: the compact form's text reaches its contrast", async ({ page }) => {
    await visitStates(page, "pagination", theme);
    await expectContrast(page, [{ sel: "#pg-narrow .cap-pagination-where", what: "Page 3 of 16" }]);
  });

  test("accessibility: roles and names", async ({ page }) => {
    await visitStates(page, "pagination", theme);
    await expect(page.locator("#pg-middle")).toMatchAriaSnapshot(`
      - navigation "Pagination":
        - paragraph: Showing 41 to 60 of 312 posts
        - list:
          - listitem:
            - link "Previous"
          - listitem:
            - link "Page 1"
          - listitem:
            - link "Page 2"
          - listitem:
            - link "Page 3"
          - listitem:
            - link "Page 4"
          - listitem:
            - link "Page 5"
          - listitem: More pages
          - listitem:
            - link "Page 16"
          - listitem:
            - link "Next"
    `);
    await expect(page.locator("#pg-middle [aria-current='page']")).toHaveAccessibleName("Page 3");
    await expect(page.locator("#pg-first .cap-page[data-kind='prev']")).toHaveAttribute("aria-disabled", "true");
    await expect(page.locator("#pg-first .cap-page[data-kind='prev']")).not.toHaveAttribute("href");
  });

  test("accessibility: the chevrons and the gap's dots are not read out", async ({ page }) => {
    await visitStates(page, "pagination", theme);
    expect(await page.locator("#pg-middle .cap-page[data-kind='next']").evaluate((el) => (el as HTMLElement).innerText)).toBe("Next");
    expect(await page.locator("#pg-middle .cap-page-gap").evaluate((el) => el.querySelector("[aria-hidden='true']")?.textContent)).toBe("…");
  });

  test("accessibility: every control is at least the target size", async ({ page }) => {
    await visitStates(page, "pagination", theme);
    const boxes = await page.locator("#pg-middle .cap-page, #pg-both .cap-page").evaluateAll((els) => els.map((el) => el.getBoundingClientRect()).map((r) => [r.width, r.height]));
    expect(boxes.length).toBeGreaterThan(10);
    for (const [w, h] of boxes) {
      expect(w).toBeGreaterThanOrEqual(24);
      expect(h).toBeGreaterThanOrEqual(24);
    }
  });

  test("keyboard: Tab moves through Previous, the page numbers and Next", async ({ page }) => {
    await visitStates(page, "pagination", theme);
    await page.locator("#pg-middle").getByRole("link", { name: "Previous" }).focus();
    const seen: string[] = [];
    for (let i = 0; i < 7; i++) {
      await page.keyboard.press("Tab");
      seen.push(await page.evaluate(() => document.activeElement?.getAttribute("aria-label") ?? document.activeElement?.textContent ?? ""));
    }
    expect(seen).toEqual(["Page 1", "Page 2", "Page 3", "Page 4", "Page 5", "Page 16", "Next"]);
  });

  test("keyboard: Enter follows a page link", async ({ page }) => {
    await visitStates(page, "pagination", theme);
    await page.locator("#pg-middle").getByRole("link", { name: "Page 4" }).focus();
    await page.keyboard.press("Enter");
    expect(new URL(page.url()).hash).toBe("#page-4");
  });

  test("keyboard: a disabled link is not a tab stop", async ({ page }) => {
    await visitStates(page, "pagination", theme);
    await page.locator("#pg-first").getByRole("link", { name: "Page 1", exact: true }).focus();
    await page.keyboard.press("Shift+Tab");
    const active = await page.evaluate(() => document.activeElement?.closest("#pg-first") !== null);
    expect(active).toBe(false);
  });

  test("keyboard: Enter and Space choose a page with the buttons", async ({ page }) => {
    await visitStates(page, "pagination", theme);
    await nav(page).getByRole("button", { name: "Page 3" }).focus();
    await page.keyboard.press("Enter");
    await expect(current(page)).toHaveAccessibleName("Page 3");
    await nav(page).getByRole("button", { name: "Page 4" }).focus();
    await page.keyboard.press("Space");
    await expect(current(page)).toHaveAccessibleName("Page 4");
  });

  test("keyboard: after Next, focus stays on Next; on the last page it moves to the current page", async ({ page }) => {
    await visitStates(page, "pagination", theme);
    const next = nav(page).getByRole("button", { name: "Next" });
    await next.focus();
    await page.keyboard.press("Enter");
    await expect(next).toBeFocused();
    await expect(current(page)).toHaveAccessibleName("Page 2");
    await nav(page).getByRole("button", { name: "Page 16" }).click();
    await expect(current(page)).toHaveAccessibleName("Page 16");
    await expect(current(page)).toBeFocused();
    await expect(next).toHaveAttribute("aria-disabled", "true");
  });

  test("keyboard: a disabled button can be reached and does nothing", async ({ page }) => {
    await visitStates(page, "pagination", theme);
    const prev = nav(page).getByRole("button", { name: "Previous" });
    await prev.focus();
    await expect(prev).toBeFocused();
    await expect(prev).toHaveAttribute("aria-disabled", "true");
    await page.keyboard.press("Enter");
    await expect(current(page)).toHaveAccessibleName("Page 1");
  });

  test("behaviour: choosing a page redraws the list, updates the count line in place and tells the page", async ({ page }) => {
    await visitStates(page, "pagination", theme);
    await expect(status(page)).toHaveText("Showing 1 to 20 of 312 posts");
    await status(page).evaluate((el) => ((el as HTMLElement & { mark?: boolean }).mark = true));
    await page.evaluate(() => {
      (window as unknown as { pages: number[] }).pages = [];
      document.addEventListener("cap:page-change", (e) => (window as unknown as { pages: number[] }).pages.push((e as CustomEvent).detail.page));
    });
    await nav(page).getByRole("button", { name: "Page 4" }).click();
    await expect(status(page)).toHaveText("Showing 61 to 80 of 312 posts");
    await expect(nav(page).locator(".cap-pagination-where")).toHaveText("Page 4 of 16");
    expect(await status(page).evaluate((el) => (el as HTMLElement & { mark?: boolean }).mark)).toBe(true);
    await expect(status(page)).toHaveAttribute("role", "status");
    await nav(page).getByRole("button", { name: "Page 4" }).click();
    expect(await page.evaluate(() => (window as unknown as { pages: number[] }).pages)).toEqual([4]);
  });

  test("behaviour: the numbers redraw with a gap on each side as the page moves to the middle", async ({ page }) => {
    await visitStates(page, "pagination", theme);
    await nav(page).getByRole("button", { name: "Page 5" }).click();
    await nav(page).getByRole("button", { name: "Next" }).click();
    await nav(page).getByRole("button", { name: "Next" }).click();
    await expect(current(page)).toHaveAccessibleName("Page 7");
    await expect(nav(page).locator(".cap-page-gap")).toHaveCount(2);
    await expect(nav(page).locator(".cap-pagination-num .cap-page")).toHaveText(["1", "6", "7", "8", "16"]);
  });

  test("behaviour: the delivered HTML has the count line, every page link and the compact text", async ({ page }) => {
    const html = await (await page.request.get("components/pagination/states.html")).text();
    expect(html).toContain("Showing 41 to 60 of 312 posts");
    expect(html).toContain('<a class="cap-page" aria-label="Page 16" href="#page-16">16</a>');
    expect(html).toContain("Page 3 of 16");
  });

  test("behaviour: a wide container shows the numbers, a narrow one shows Page 3 of 16 between Previous and Next", async ({ page }) => {
    await visitStates(page, "pagination", theme);
    await expect(page.locator("#pg-middle .cap-pagination-num").first()).toBeVisible();
    await expect(page.locator("#pg-middle .cap-pagination-where")).toBeHidden();
    await expect(page.locator("#pg-narrow .cap-pagination-num").first()).toBeHidden();
    await expect(page.locator("#pg-narrow .cap-pagination-where")).toBeVisible();
    await expect(page.locator("#pg-narrow .cap-pagination-where")).toHaveText("Page 3 of 16");
    const [prev, where, next] = await Promise.all(
      ["[data-kind='prev']", ".cap-pagination-where", "[data-kind='next']"].map((s) => page.locator(`#pg-narrow ${s}`).evaluate((el) => el.getBoundingClientRect().left)),
    );
    expect(prev).toBeLessThan(where as number);
    expect(where).toBeLessThan(next as number);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  });

  test("behaviour: other words for the ends work", async ({ page }) => {
    await visitStates(page, "pagination", theme);
    await expect(page.locator("#pg-words").getByRole("link", { name: "Newer" })).toBeVisible();
    await expect(page.locator("#pg-words").getByRole("link", { name: "Older" })).toBeVisible();
    await expect(page.locator("#pg-words .cap-pagination-status")).toHaveCount(0);
  });

  test("behaviour: comfortable density makes the controls taller", async ({ page }) => {
    await visitStates(page, "pagination", theme);
    const compact = await page.locator("#pg-middle .cap-page").first().evaluate((el) => el.getBoundingClientRect().height);
    const roomy = await page.locator("#pg-comfortable .cap-page").first().evaluate((el) => el.getBoundingClientRect().height);
    expect(roomy).toBeGreaterThan(compact);
  });
});
