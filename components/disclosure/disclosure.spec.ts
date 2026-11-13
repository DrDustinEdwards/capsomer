import { expect, test } from "@playwright/test";
import {
  eachTheme,
  expectContrast,
  expectNoAxeViolations,
  visitStates,
} from "../../test/helpers.ts";

test("behavior: an expand toggle shows its region and says so; a table row opens its detail row", async ({
  page,
}) => {
  await visitStates(page, "disclosure", "light");
  const email = page.getByRole("button", { name: "View email" });
  await email.click();
  await expect(page.getByRole("button", { name: "Hide email" })).toHaveAttribute(
    "aria-expanded",
    "true",
  );
  await expect(page.locator("#email-preview")).toBeVisible();
  const row = page.getByRole("button", { name: "invoice.payment_failed payload" });
  await row.press("Enter");
  await expect(row).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("#evt-1-payload")).toBeVisible();
  await row.press("Enter");
  await expect(page.locator("#evt-1-payload")).toBeHidden();
});

test("behavior: the sign marker keeps the title still, and on paper every section is open but a screen-only one", async ({
  page,
}) => {
  await visitStates(page, "disclosure", "light");
  const title = page.locator("#inline-closed > summary");
  const before = (await title.boundingBox())!.width;
  await title.click();
  await expect(page.locator("#inline-closed")).toHaveAttribute("open", "");
  expect((await title.boundingBox())!.width).toBe(before);
  await title.click();
  await page.emulateMedia({ media: "print" });
  await expect(page.locator("#inline-closed .cap-disclosure-body")).toBeVisible();
  await expect(page.locator("#notices-rows")).toBeVisible();
  await expect(page.locator("#step-calc")).toBeHidden();
});

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "disclosure", theme);
    await expectNoAxeViolations(page);
  });

  test("accessibility: summaries, group rows and counts reach their contrast", async ({ page }) => {
    await visitStates(page, "disclosure", theme);
    await expectContrast(page, [
      { sel: ".cap-disclosure > summary", what: "a section's summary" },
      { sel: ".cap-disclosure[open] .cap-disclosure-body p", what: "an open section's text" },
      { sel: ".cap-group-toggle", what: "a group row's label" },
      { sel: ".cap-group-count", what: "a group's count" },
      { sel: ".cap-group-count", what: "the count's boundary", part: "border" },
      { sel: ".cap-group-rows:not([hidden]) > li", what: "a grouped row" },
      { sel: "#inline-closed > summary", what: "an inline section's title" },
      { sel: "#expand-specimen .cap-expand-toggle", what: "an expand toggle" },
    ]);
  });

  test("accessibility: the group rows' roles and names", { tag: "@markup" }, async ({ page }) => {
    await visitStates(page, "disclosure", theme);
    await expect(page.locator("section[aria-labelledby='s-collapsed']")).toMatchAriaSnapshot(`
      - region "Group row, collapsed, with its count":
        - heading "Group row, collapsed, with its count" [level=2]
        - button /^Notices\\s*,\\s*4$/
    `);
    await expect(page.locator("section[aria-labelledby='s-expanded']")).toMatchAriaSnapshot(`
      - region "Group row, expanded, two levels":
        - heading "Group row, expanded, two levels" [level=2]
        - button /^Dependency updates\\s*,\\s*5$/ [expanded]
        - list:
          - listitem: "api: vite 8.3.1 to 8.4.0"
          - listitem: "api: wrangler 4.40.0 to 4.41.2"
          - listitem:
            - button /^docs\\s*,\\s*3$/
    `);
  });

  test("keyboard: Enter and Space on a group row toggle aria-expanded and the rows", async ({
    page,
  }) => {
    await visitStates(page, "disclosure", theme);
    const btn = page.getByRole("button", { name: /^Notices\s*,\s*4$/ });
    const rows = page.locator("#notices-rows");
    await expect(btn).toHaveAttribute("aria-expanded", "false");
    await expect(rows).toBeHidden();
    await btn.focus();
    await page.keyboard.press("Enter");
    await expect(btn).toHaveAttribute("aria-expanded", "true");
    await expect(rows).toBeVisible();
    await expect(rows.getByRole("listitem")).toHaveCount(4);
    await page.keyboard.press("Space");
    await expect(btn).toHaveAttribute("aria-expanded", "false");
    await expect(rows).toBeHidden();
  });

  test("keyboard: a second-level group toggles on its own", async ({ page }) => {
    await visitStates(page, "disclosure", theme);
    const inner = page.getByRole("button", { name: /^docs\s*,\s*3$/ });
    await inner.focus();
    await page.keyboard.press("Enter");
    await expect(inner).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator("#docs-updates")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /^Dependency updates\s*,\s*5$/ }),
    ).toHaveAttribute("aria-expanded", "true");
  });

  test(
    "accessibility: a group row in a heading is found by heading and still toggles by key",
    { tag: "@markup" },
    async ({ page }) => {
      await visitStates(page, "disclosure", theme);
      await expect(
        page.getByRole("heading", { name: /^Finished jobs\s*,\s*12$/, level: 3 }),
      ).toBeVisible();
      const btn = page.getByRole("button", { name: /^Finished jobs\s*,\s*12$/ });
      await btn.focus();
      await page.keyboard.press("Enter");
      await expect(btn).toHaveAttribute("aria-expanded", "true");
      await expect(page.locator("#queue-done-rows")).toBeVisible();
    },
  );

  test("behavior: a compact card opens in place to its form, with the body in the text color", async ({
    page,
  }) => {
    await visitStates(page, "disclosure", theme);
    const cards = page.locator("#card-sm-specimen > li > details");
    await expect(cards).toHaveCount(3);
    await expect(cards.first().getByRole("textbox", { name: "Name" })).toBeVisible();
    const closed = cards.nth(1);
    await closed.locator("summary").focus();
    await page.keyboard.press("Enter");
    await expect(closed).toHaveAttribute("open", "");
    await expect(closed.getByText("Alex Rivera")).toBeVisible();
    await expectContrast(page, [
      { sel: "#card-sm-specimen summary", what: "a compact card's title" },
      {
        sel: "#card-sm-specimen li:nth-child(2) .cap-disclosure-body",
        what: "a compact card's body",
      },
    ]);
  });

  test("accessibility: a summary in the accordion variant and a pressed one keep their contrast", async ({
    page,
  }) => {
    await visitStates(page, "disclosure", theme);
    await expectContrast(page, [
      { sel: "#accordion-specimen summary", what: "an accordion summary" },
      {
        sel: "#accordion-specimen details[open] .cap-disclosure-body p",
        what: "an accordion panel's text",
      },
      { sel: "summary[data-force='pressed']", what: "a pressed summary" },
      { sel: ".cap-group-toggle[data-force='pressed']", what: "a pressed group row" },
    ]);
  });
});
