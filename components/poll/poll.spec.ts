import { expect, test } from "@playwright/test";
import {
  eachTheme,
  expectContrast,
  expectNoAxeViolations,
  visitStates,
} from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations, and labels and counts reach their contrast over the share", async ({
    page,
  }) => {
    await visitStates(page, "poll", theme);
    await expectNoAxeViolations(page);
    await expectContrast(page, [
      {
        sel: "#pl-open .cap-poll-option[aria-pressed='true'] .cap-poll-label",
        what: "the voted option",
      },
      { sel: "#pl-open .cap-poll-count", what: "a count" },
    ]);
  });

  test("behavior: each option is filled by its share of the votes, through the CSSOM", async ({
    page,
  }) => {
    await visitStates(page, "poll", theme);
    const s = await page
      .locator("#pl-open .cap-poll-option")
      .evaluateAll((els) => els.map((e) => (e as HTMLElement).style.getPropertyValue("--share")));
    expect(s).toEqual(["0.7500", "0.2500", "0.0000"]);
    await expect(
      page.locator("#pl-open").getByRole("button", { name: "Field notes 3 votes", pressed: true }),
    ).toBeVisible();
  });
});
