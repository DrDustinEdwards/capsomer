import { test } from "@playwright/test";
import {
  eachTheme,
  expectContrast,
  expectNoAxeViolations,
  visitStates,
} from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations, and the questions and answers reach their contrast", async ({
    page,
  }) => {
    await visitStates(page, "faq", theme);
    await expectNoAxeViolations(page);
    await expectContrast(page, [
      { sel: "#faq-list .cap-faq-question", what: "a question" },
      { sel: "#faq-list .cap-faq-answer p", what: "an answer" },
    ]);
  });
});
