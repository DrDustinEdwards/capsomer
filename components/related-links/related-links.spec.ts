import { test } from "@playwright/test";
import {
  eachTheme,
  expectContrast,
  expectNoAxeViolations,
  visitStates,
} from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "related-links", theme);
    await expectNoAxeViolations(page);
  });

  test("accessibility: titles, links, excerpts and dates reach their contrast", async ({
    page,
  }) => {
    await visitStates(page, "related-links", theme);
    await expectContrast(page, [
      { sel: "#sample-internal .cap-related-title", what: "title" },
      { sel: "#sample-internal .cap-related-name", what: "internal link" },
      { sel: "#sample-external .cap-related-name", what: "external link" },
      { sel: "#sample-mentions a.cap-related-name", what: "sender" },
      { sel: "#sample-mentions span.cap-related-name", what: "sender as text" },
      { sel: "#sample-mentions .cap-related-excerpt", what: "excerpt" },
      { sel: "#sample-mentions .cap-related-date", what: "date" },
    ]);
  });
});
