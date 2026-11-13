import { expect, test, type Page } from "@playwright/test";
import {
  eachTheme,
  expectContrast,
  expectNoAxeViolations,
  visitStates,
} from "../../test/helpers.ts";
import {
  pageCountOf,
  pageEnvelope,
  pageHref,
  pageItems,
  parsePage,
  showingRange,
  statusText,
} from "./pagination.ts";

const nav = (page: Page) => page.locator("#pg-buttons");
const status = (page: Page) => nav(page).locator(".cap-pagination-status");
const current = (page: Page) => nav(page).locator(".cap-page[aria-current='page']");

test("behavior: the page numbers keep seven slots, the first and last page always shown, a gap for the rest", () => {
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

test("behavior: the count line says which items are on the page", () => {
  expect(statusText(3, 20, 312, "posts")).toBe("Showing 41 to 60 of 312 posts");
  expect(statusText(16, 20, 312, "posts")).toBe("Showing 301 to 312 of 312 posts");
  expect(statusText(3, 20, 41, "posts")).toBe("Showing 41 of 41 posts");
  expect(statusText(1, 20, 0, "posts")).toBe("No posts");
  expect(showingRange(2, 25, 61)).toEqual({ from: 26, to: 50 });
  expect(pageCountOf(312, 20)).toBe(16);
  expect(pageCountOf(0, 20)).toBe(1);
});

test("behavior: an address's page is read strictly, kept in range, and each page has one address", () => {
  for (const bad of [null, "", "0", "-1", "2.5", "1e3", "2abc", " 2", "99999999999999999999"])
    expect(parsePage(bad), String(bad)).toBe(1);
  expect(parsePage("12")).toBe(12);
  expect(pageEnvelope(99, 25, 60)).toMatchObject({
    page: 3,
    pageCount: 3,
    offset: 50,
    from: 51,
    to: 60,
    hasNext: false,
  });
  expect(pageEnvelope(1, 25, 0)).toMatchObject({
    page: 1,
    pageCount: 1,
    from: 0,
    to: 0,
    hasPrev: false,
    hasNext: false,
  });
  expect(pageEnvelope(2, "all", 60)).toMatchObject({ page: 1, perPage: 60, to: 60 });
  expect(
    pageHref("/admin/webhooks", { type: "invoice.paid", errors: true, pending: false, q: "" }, 1),
  ).toBe("/admin/webhooks?type=invoice.paid&errors=1");
  expect(pageHref("/books", new URLSearchParams("sort=year-desc&page=4"), 2)).toBe(
    "/books?sort=year-desc&page=2",
  );
  expect(pageHref("/books", {}, 1)).toBe("/books");
});

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "pagination", theme);
    await expectNoAxeViolations(page);
  });

  test("accessibility: text and the edges of the controls reach their contrast", async ({
    page,
  }) => {
    await visitStates(page, "pagination", theme);
    await expectContrast(page, [
      { sel: "#pg-middle .cap-pagination-status", what: "the count line" },
      { sel: "#pg-middle .cap-pagination-num .cap-page:not([aria-current])", what: "a page link" },
      { sel: "#pg-middle .cap-page[aria-current='page']", what: "the current page" },
      {
        sel: "#pg-middle .cap-page[aria-current='page']",
        what: "the current page's edge",
        part: "border",
      },
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

  test(
    "accessibility: every control is at least the target size",
    { tag: "@markup" },
    async ({ page }) => {
      await visitStates(page, "pagination", theme);
      const boxes = await page
        .locator("#pg-middle .cap-page, #pg-both .cap-page")
        .evaluateAll((els) =>
          els.map((el) => el.getBoundingClientRect()).map((r) => [r.width, r.height]),
        );
      expect(boxes.length).toBeGreaterThan(10);
      for (const [w, h] of boxes) {
        expect(w).toBeGreaterThanOrEqual(24);
        expect(h).toBeGreaterThanOrEqual(24);
      }
    },
  );

  test("keyboard: after Next, focus stays on Next; on the last page it moves to the current page", async ({
    page,
  }) => {
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

  test("behavior: choosing a page redraws the list, updates the count line in place and tells the page", async ({
    page,
  }) => {
    await visitStates(page, "pagination", theme);
    await expect(status(page)).toHaveText("Showing 1 to 20 of 312 posts");
    await status(page).evaluate((el) => ((el as HTMLElement & { mark?: boolean }).mark = true));
    await page.evaluate(() => {
      (window as unknown as { pages: number[] }).pages = [];
      document.addEventListener("cap:page-change", (e) =>
        (window as unknown as { pages: number[] }).pages.push((e as CustomEvent).detail.page),
      );
    });
    await nav(page).getByRole("button", { name: "Page 4" }).click();
    await expect(status(page)).toHaveText("Showing 61 to 80 of 312 posts");
    await expect(nav(page).locator(".cap-pagination-where")).toHaveText("Page 4 of 16");
    expect(await status(page).evaluate((el) => (el as HTMLElement & { mark?: boolean }).mark)).toBe(
      true,
    );
    await expect(status(page)).toHaveAttribute("role", "status");
    await nav(page).getByRole("button", { name: "Page 4" }).click();
    expect(await page.evaluate(() => (window as unknown as { pages: number[] }).pages)).toEqual([
      4,
    ]);
  });

  test("behavior: the numbers redraw with a gap on each side as the page moves to the middle", async ({
    page,
  }) => {
    await visitStates(page, "pagination", theme);
    await nav(page).getByRole("button", { name: "Page 5" }).click();
    await nav(page).getByRole("button", { name: "Next" }).click();
    await nav(page).getByRole("button", { name: "Next" }).click();
    await expect(current(page)).toHaveAccessibleName("Page 7");
    await expect(nav(page).locator(".cap-page-gap")).toHaveCount(2);
    await expect(nav(page).locator(".cap-pagination-num .cap-page")).toHaveText([
      "1",
      "6",
      "7",
      "8",
      "16",
    ]);
  });

  test("behavior: a wide container shows the numbers, a narrow one shows Page 3 of 16 between Previous and Next", async ({
    page,
  }) => {
    await visitStates(page, "pagination", theme);
    await expect(page.locator("#pg-middle .cap-pagination-num").first()).toBeVisible();
    await expect(page.locator("#pg-middle .cap-pagination-where")).toBeHidden();
    await expect(page.locator("#pg-narrow .cap-pagination-num").first()).toBeHidden();
    await expect(page.locator("#pg-narrow .cap-pagination-where")).toBeVisible();
    await expect(page.locator("#pg-narrow .cap-pagination-where")).toHaveText("Page 3 of 16");
    const [prev, where, next] = await Promise.all(
      ["[data-kind='prev']", ".cap-pagination-where", "[data-kind='next']"].map((s) =>
        page.locator(`#pg-narrow ${s}`).evaluate((el) => el.getBoundingClientRect().left),
      ),
    );
    expect(prev).toBeLessThan(where as number);
    expect(where).toBeLessThan(next as number);
  });
});
