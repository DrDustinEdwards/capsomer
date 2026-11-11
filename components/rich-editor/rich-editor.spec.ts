import { expect, test, type Page } from "@playwright/test";
import { eachTheme, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

const opening = `## Release notes

The **spring update** moves the checks to the edge, so one _slow_ network no longer pages anyone at night. See [Getting started](/writing/getting-started).

- Checks every 5 minutes
- A quiet hour is the default
`;

const surface = (page: Page) => page.getByRole("textbox", { name: "Body, formatted" });
const markdown = (page: Page) => page.locator("#rich-md");

/** The states page under an enforced Trusted Types policy, as a site sends it once staged. */
async function enforceTrustedTypes(page: Page) {
  await page.route("**/components/rich-editor/states.html*", async (route) => {
    const response = await route.fetch();
    await route.fulfill({
      response,
      headers: {
        ...response.headers(),
        "content-security-policy":
          "require-trusted-types-for 'script'; trusted-types default capsomer enarratio turnstile",
      },
    });
  });
}

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "rich-editor", theme);
    await expect(surface(page)).toBeVisible();
    await expectNoAxeViolations(page);
  });

  test("keyboard: the toolbar is one tab stop, arrows move in it, and Ctrl+B bolds the selection", async ({
    page,
  }) => {
    await visitStates(page, "rich-editor", theme);
    const bar = page.getByRole("toolbar", { name: "Formatting" }).first();
    await bar.getByRole("button", { name: "Bold" }).focus();
    await page.keyboard.press("ArrowRight");
    await expect(bar.getByRole("button", { name: "Italic" })).toBeFocused();
    await page.keyboard.press("End");
    await expect(bar.getByRole("button", { name: "Note", exact: true })).toBeFocused();
    await page.keyboard.press("Home");
    await expect(bar.getByRole("button", { name: "Bold" })).toBeFocused();
    await expect(bar.locator("button[tabindex='0']")).toHaveCount(1);

    await surface(page).getByText("A quiet hour is the default").click();
    await page.keyboard.press("End");
    await page.keyboard.press("Control+Shift+ArrowLeft");
    // ProseMirror reads a native selection on selectionchange, a task later: let it arrive first.
    await page.evaluate(
      () => new Promise((done) => setTimeout(() => requestAnimationFrame(done), 0)),
    );
    await page.keyboard.press("ControlOrMeta+b");
    await expect(markdown(page)).toContainText("- A quiet hour is the **default**");
  });

  test("behavior: an edit changes only the bytes of the block it touched", async ({ page }) => {
    await visitStates(page, "rich-editor", theme);
    await surface(page).getByText("Release notes").click();
    await page.keyboard.press("End");
    await page.keyboard.type(", spring");
    await expect(markdown(page)).toHaveText(
      opening.replace("## Release notes", "## Release notes, spring"),
      { useInnerText: true },
    );
  });

  test("behavior: pasted HTML arrives formatted under enforced Trusted Types", async ({ page }) => {
    await enforceTrustedTypes(page);
    const violations: string[] = [];
    page.on("console", (m) => {
      if (/Trusted Type|TrustedHTML/i.test(m.text())) violations.push(m.text());
    });
    await visitStates(page, "rich-editor", theme);
    await surface(page).getByText("A quiet hour is the default").click();
    await page.keyboard.press("End");
    await page.keyboard.press("Enter");
    await surface(page).evaluate((el) => {
      const data = new DataTransfer();
      data.setData(
        "text/html",
        "<p>Pasted <strong>firmly</strong> <script>window.pwned = 1</script></p>",
      );
      data.setData("text/plain", "Pasted firmly");
      el.dispatchEvent(
        new ClipboardEvent("paste", { clipboardData: data, bubbles: true, cancelable: true }),
      );
    });
    await expect(surface(page).locator("strong", { hasText: "firmly" })).toBeVisible();
    await expect(surface(page)).not.toContainText("<strong>");
    await expect(markdown(page)).toContainText("Pasted **firmly**");
    expect(await page.evaluate(() => (window as { pwned?: number }).pwned)).toBeUndefined();
    expect(violations).toEqual([]);
  });
});
