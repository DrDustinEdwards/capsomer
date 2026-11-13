import { test } from "@playwright/test";
import {
  eachTheme,
  expectContrast,
  expectNoAxeViolations,
  visitStates,
} from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "ai-answer", theme);
    await expectNoAxeViolations(page);
  });

  test("accessibility: the badge, the note, the answer and its sources reach their contrast", async ({
    page,
  }) => {
    await visitStates(page, "ai-answer", theme);
    const s = "[data-specimen-part='done']";
    await expectContrast(page, [
      { sel: `${s} .cap-badge`, what: "AI generated badge" },
      { sel: `${s} .cap-ai-answer-note`, what: "may be wrong note" },
      { sel: `${s} .cap-ai-answer-body`, what: "answer" },
      { sel: `${s} .cap-ai-answer-sources-label`, what: "sources label" },
      { sel: `${s} .cap-ai-answer-sources a`, what: "source link" },
      { sel: "[data-specimen-part='cut'] .cap-ai-answer-cut", what: "cut-off note" },
    ]);
  });
});
