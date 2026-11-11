import { expect, test, type Page } from "@playwright/test";
import { eachTheme, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

const box = (page: Page, name: string) => page.getByRole("textbox", { name, exact: true });
const value = (page: Page, name: string) =>
  box(page, name).locator(
    "xpath=ancestor::div[contains(@class,'cap-rich-text')][1]/following-sibling::output[1]",
  );
const mod = process.platform === "darwin" ? "Meta" : "Control";

async function select(page: Page, name: string, text: string) {
  await box(page, name).evaluate((el, t) => {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const at = n.textContent!.indexOf(t);
      if (at < 0) continue;
      const r = document.createRange();
      r.setStart(n, at);
      r.setEnd(n, at + t.length);
      const s = getSelection()!;
      s.removeAllRanges();
      s.addRange(r);
      return;
    }
    throw new Error(`no "${t}"`);
  }, text);
}

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "rich-text-field", theme);
    await expect(box(page, "Title")).toContainText("Example species");
    await expectNoAxeViolations(page);
  });

  test("keyboard: Ctrl or Cmd with I, period and comma toggle italic, superscript and subscript", async ({
    page,
  }) => {
    await visitStates(page, "rich-text-field", theme);
    await box(page, "Body").focus();
    await select(page, "Body", "Samples");
    await page.keyboard.press(`${mod}+i`);
    await expect(value(page, "Body")).toContainText("<em>Samples</em>");
    await expect(
      page
        .getByRole("toolbar", { name: "Formatting" })
        .nth(1)
        .getByRole("button", { name: "Italic" }),
    ).toHaveAttribute("aria-pressed", "true");
    await page.keyboard.press(`${mod}+i`);
    await expect(value(page, "Body")).not.toContainText("<em>");
    await select(page, "Body", "mL");
    await page.keyboard.press(`${mod}+.`);
    await expect(value(page, "Body")).toContainText("<sup>mL</sup>");
    await select(page, "Body", "air");
    await page.keyboard.press(`${mod}+,`);
    await expect(value(page, "Body")).toContainText("<sub>air</sub>");
  });

  test("keyboard: Enter adds no line break and the browser's bold writes no tag the field refuses", async ({
    page,
  }) => {
    await visitStates(page, "rich-text-field", theme);
    await box(page, "Title").focus();
    await select(page, "Title", "spring");
    await page.keyboard.press(`${mod}+b`);
    await page.keyboard.press("End");
    await page.keyboard.press("Enter");
    await page.keyboard.type(" again");
    await expect(value(page, "Title")).toHaveText(
      "Field notes on <em>Example species</em> in spring again",
    );
  });

  test("keyboard: the formatting toolbar is one tab stop with arrow keys", async ({ page }) => {
    await visitStates(page, "rich-text-field", theme);
    const bar = page.getByRole("toolbar", { name: "Formatting" }).nth(1);
    await bar.getByRole("button", { name: "Italic" }).focus();
    await page.keyboard.press("ArrowRight");
    await expect(bar.getByRole("button", { name: "Superscript" })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(box(page, "Body")).toBeFocused();
  });

  test("behavior: a paste keeps the allowed tags and drops every other tag, attribute and script", async ({
    page,
  }) => {
    await visitStates(page, "rich-text-field", theme);
    await box(page, "Title").focus();
    await page.keyboard.press(`${mod}+a`);
    await box(page, "Title").evaluate((el) => {
      const data = new DataTransfer();
      data.setData(
        "text/html",
        '<p style="color:red"><i>Sample</i> <b>bold</b> <a href="javascript:alert(1)">link</a><img src=x onerror=alert(1)><script>alert(2)</script></p>',
      );
      data.setData("text/plain", "Sample bold link");
      el.dispatchEvent(
        new ClipboardEvent("paste", { clipboardData: data, bubbles: true, cancelable: true }),
      );
    });
    await expect(value(page, "Title")).toHaveText("<em>Sample</em> bold link");
    await expect(box(page, "Title").locator("img, a, script, p, b")).toHaveCount(0);
  });
});
