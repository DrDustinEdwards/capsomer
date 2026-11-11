import { expect, test } from "@playwright/test";
import {
  eachTheme,
  expectContrast,
  expectNoAxeViolations,
  visitStates,
} from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations, and the line reaches its contrast fresh and stale", async ({
    page,
  }) => {
    await visitStates(page, "freshness", theme);
    await expectNoAxeViolations(page);
    await expectContrast(page, [
      { sel: "#fr-fresh .cap-fresh-text", what: "the muted line" },
      { sel: "#fr-fresh b", what: "the age" },
      { sel: "#fr-stale b", what: "the stale age" },
    ]);
  });
});

test("behavior: a short line cuts the second clause, keeps the age whole and stays in its box", async ({
  page,
}) => {
  await visitStates(page, "freshness", "light");
  const short = page.locator("#fr-short");
  const cut = await short.evaluate((el) => {
    const more = el.querySelector<HTMLElement>(".cap-fresh-more")!;
    const text = el.querySelector<HTMLElement>(".cap-fresh-text")!;
    return {
      moreCut: more.scrollWidth > more.clientWidth,
      textWhole: text.scrollWidth <= text.clientWidth,
      inBox: el.scrollWidth <= el.clientWidth,
    };
  });
  expect(cut).toEqual({ moreCut: true, textWhole: true, inBox: true });
  // In a flex row with nothing else setting its width (a header), the line still sizes to its words.
  const width = await page.locator("#fr-fresh").evaluate((el) => {
    const row = document.createElement("div");
    row.style.display = "flex";
    el.parentElement!.append(row);
    row.append(el);
    return el.getBoundingClientRect().width;
  });
  expect(width).toBeGreaterThan(100);
});
