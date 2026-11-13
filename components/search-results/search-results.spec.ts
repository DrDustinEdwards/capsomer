import { expect, test } from "@playwright/test";
import {
  eachTheme,
  expectContrast,
  expectNoAxeViolations,
  visitStates,
} from "../../test/helpers.ts";
import { markQuery, snippetHtml, snippetParts } from "./search-results.ts";

test("behavior: a snippet's own markup stays text, only the markers mark", () => {
  expect(snippetHtml("a <b>\u0002word\u0003</b>")).toBe("a &lt;b&gt;<mark>word</mark>&lt;/b&gt;");
  expect(snippetParts("\u0002open to the end")).toEqual([{ text: "open to the end", match: true }]);
  expect(markQuery("Café notes", "cafe")).toBe("\u0002Café\u0003 notes");
  expect(markQuery("Escaping", "cap")).toBe("Escaping");
});

eachTheme((theme) => {
  test("accessibility: no axe violations, and a marked word keeps its contrast", async ({
    page,
  }) => {
    await visitStates(page, "search-results", theme);
    await expectNoAxeViolations(page);
    await expectContrast(page, [
      { sel: "#results .cap-search-snippet mark", what: "a matched word" },
      { sel: "#results .cap-search-why", what: "the why line" },
    ]);
  });
});
