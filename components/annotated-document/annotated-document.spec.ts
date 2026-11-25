import { expect, test } from "@playwright/test";
import {
  eachTheme,
  expectContrast,
  expectNoAxeViolations,
  visitStates,
} from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations, and passages, insertions and deletions reach their contrast", async ({
    page,
  }) => {
    await visitStates(page, "annotated-document", theme);
    await expectNoAxeViolations(page);
  });
});

test("behavior: the views show the original, the edit and every change from one text", async ({
  page,
}) => {
  await visitStates(page, "annotated-document", "light");
  const doc = page.locator("#ad-edited .cap-annotated-doc");
  await expect(doc.locator("mark[data-note='n2']").first()).toHaveText("30 days", {
    useInnerText: true,
  });
  await page.locator("#ad-edited").getByLabel("Original").check();
  await expect(doc.locator("mark[data-note='n2']").first()).toHaveText("about a month", {
    useInnerText: true,
  });
  await expect(page.locator("#ad-all mark")).toHaveText("about a month30 days", {
    useInnerText: true,
  });
});

test("behavior: a view can leave the notes out, and kinds in their tones reach their contrast", async ({
  page,
}) => {
  await visitStates(page, "annotated-document", "light");
  const tone = page.locator("#ad-tone");
  await expect(tone.locator(".cap-annotated-notes")).toBeHidden();
  await tone.getByLabel("Simple markup").check();
  await expect(tone.locator(".cap-annotated-notes")).toBeVisible();
  await expectContrast(page, [
    { sel: "#ad-tone .cap-annotated-note-kind", what: "a kind in its tone" },
  ]);
});

test("keyboard: a note lights every passage it is about, and a second press turns it off", async ({
  page,
}) => {
  await visitStates(page, "annotated-document", "light");
  const note = page.locator("#ad-edited").getByRole("button", { name: /Precision/ });
  await note.focus();
  await page.keyboard.press("Enter");
  await expect(note).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#ad-edited mark[data-lit]")).toHaveCount(2);
  await page.keyboard.press("Space");
  await expect(page.locator("#ad-edited mark[data-lit]")).toHaveCount(0);
  await page.locator("#ad-edited mark[data-note='n3']").click();
  await expect(page.locator("#ad-edited").getByRole("button", { name: /Risk/ })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});
