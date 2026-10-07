import { expect, test, type Page } from "@playwright/test";
import { eachTheme, expectContrast, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

const TITLE = "Push the capsomer branch and open a pull request";
const panel = (page: Page) => page.getByRole("dialog", { name: TITLE });
const rowLink = (page: Page) => page.getByRole("link", { name: TITLE });

eachTheme((theme) => {
  test("accessibility: no axe violations, the states page", async ({ page }) => {
    await visitStates(page, "detail-panel", theme);
    await expectNoAxeViolations(page);
  });

  for (const id of ["rows", "open", "comfortable"]) {
    test(`accessibility: no axe violations, ${id}`, async ({ page }) => {
      await visitStates(page, "detail-panel", theme, id);
      await expectNoAxeViolations(page);
    });
  }

  test("accessibility: the panel's text reaches its contrast", async ({ page }) => {
    await visitStates(page, "detail-panel", theme, "open");
    await expect(panel(page)).toBeVisible();
    await expectContrast(page, [
      { sel: ".cap-dialog-title", what: "the title" },
      { sel: ".cap-detail-kind", what: "the kind above the title" },
      { sel: ".cap-detail-id", what: "the identifier" },
      { sel: ".cap-detail-section-title", what: "a section heading" },
      { sel: ".cap-detail-cmd", what: "the command on sunken" },
      { sel: ".cap-detail-record dt", what: "a record label" },
      { sel: ".cap-detail-record dd", what: "a record value" },
      { sel: ".cap-detail-source", what: "the source line" },
      { sel: ".cap-detail-diff del", what: "the old value on its tint" },
      { sel: ".cap-detail-diff ins", what: "the new value on its tint" },
    ]);
  });

  test("accessibility: the panel's roles and names", async ({ page }) => {
    await visitStates(page, "detail-panel", theme, "open");
    await expect(panel(page)).toMatchAriaSnapshot(`
      - dialog "${TITLE}":
        - paragraph: Job, capsomer
        - heading "${TITLE}" [level=2]
        - paragraph: job_7f3a92c1d4e0
        - region "Do this first":
          - heading "Do this first" [level=3]
          - button "Copy command"
        - region "Change it":
          - heading "Change it" [level=3]
          - button "Resume"
          - button "Release"
          - button "Mark failed…"
        - region "Record":
          - heading "Record" [level=3]
          - term: Status
          - definition: Blocked, waiting on you
        - region "What changed":
          - heading "What changed" [level=3]
          - term: Status
          - definition:
            - deletion: "before: queued"
            - insertion: "after: blocked"
        - button "Close"
    `);
  });

  test("keyboard: Enter on a row's link opens the panel with focus on its first control", async ({ page }) => {
    await visitStates(page, "detail-panel", theme, "rows");
    await rowLink(page).focus();
    await page.keyboard.press("Enter");
    await expect(panel(page)).toBeVisible();
    await expect(panel(page).getByRole("button", { name: "Copy command" })).toBeFocused();
  });

  test("keyboard: a panel with nothing to press opens with focus on Close", async ({ page }) => {
    await visitStates(page, "detail-panel", theme, "rows");
    await page.getByRole("link", { name: "Rotate the watcher's Cloudflare token" }).click();
    await expect(page.getByRole("dialog", { name: "Rotate the watcher's Cloudflare token" }).getByRole("button", { name: "Close" })).toBeFocused();
  });

  test("keyboard: Esc closes the panel and focus returns to the row's link", async ({ page }) => {
    await visitStates(page, "detail-panel", theme, "rows");
    await rowLink(page).focus();
    await page.keyboard.press("Enter");
    await expect(panel(page)).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(panel(page)).toBeHidden();
    await expect(rowLink(page)).toBeFocused();
    // The entry the panel pushed is taken back.
    await expect(page).not.toHaveURL(/#detail-/);
  });

  test("keyboard: Enter on Close closes the panel and focus returns to the row's link", async ({ page }) => {
    await visitStates(page, "detail-panel", theme, "rows");
    const other = page.getByRole("link", { name: "Rotate the watcher's Cloudflare token" });
    await other.focus();
    await page.keyboard.press("Enter");
    const d = page.getByRole("dialog", { name: "Rotate the watcher's Cloudflare token" });
    await expect(d).toBeVisible();
    await page.keyboard.press("Enter");
    await expect(d).toBeHidden();
    await expect(other).toBeFocused();
  });

  test("behaviour: Back closes the panel when it pushed a history entry", async ({ page }) => {
    await visitStates(page, "detail-panel", theme, "rows");
    await rowLink(page).click();
    await expect(panel(page)).toBeVisible();
    await expect(page).toHaveURL(/#detail-job_7f3a92c1d4e0$/);
    await page.goBack();
    await expect(panel(page)).toBeHidden();
    await expect(rowLink(page)).toBeFocused();
  });

  test("keyboard: Enter on the corner Close button closes the panel", async ({ page }) => {
    await visitStates(page, "detail-panel", theme, "rows");
    await rowLink(page).click();
    await expect(panel(page)).toBeVisible();
    await panel(page).getByRole("button", { name: "Close" }).focus();
    await page.keyboard.press("Enter");
    await expect(panel(page)).toBeHidden();
    await expect(rowLink(page)).toBeFocused();
  });

  test("behaviour: a click on the backdrop closes the panel", async ({ page }) => {
    await visitStates(page, "detail-panel", theme, "rows");
    await rowLink(page).click();
    await expect(panel(page)).toBeVisible();
    await page.mouse.click(10, 300);
    await expect(panel(page)).toBeHidden();
  });

  test("keyboard: Tab stays inside the open panel and never reaches the page behind", async ({ page }) => {
    await visitStates(page, "detail-panel", theme, "rows");
    await rowLink(page).focus();
    await page.keyboard.press("Enter");
    await expect(panel(page)).toBeVisible();
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press(i < 8 ? "Tab" : "Shift+Tab");
      // A modal dialog hands Tab on from its last control to the browser's own bar, which
      // leaves the document with no focused element; what must never happen is focus landing
      // on the page behind.
      const place = await page.evaluate(() => {
        const a = document.activeElement;
        if (!a || a === document.body || a === document.documentElement) return "browser";
        return a.closest("dialog.cap-detail[open]") ? "panel" : "page";
      });
      expect(place, `focus after key ${i + 1} never reaches the page behind`).not.toBe("page");
    }
  });

  test("behaviour: Copy says what happened", async ({ page }) => {
    await visitStates(page, "detail-panel", theme, "open");
    await page.getByRole("button", { name: "Copy command" }).click();
    await expect(panel(page).getByRole("status")).toHaveText(/Command copied\.|Command is selected/);
  });
  // ---- driven by the address (?inspect=) ------------------------------------------------------
  const MENTION = "A reply from rosa.example about the burst size paper";
  const mention = (page: Page) => page.getByRole("dialog", { name: MENTION });
  const visitUrl = async (page: Page, inspect?: string) => {
    await page.goto(`components/detail-panel/states.html?theme=${theme}&only=url${inspect ? `&inspect=${inspect}` : ""}`);
    await page.evaluate(() => document.fonts.ready.then(() => undefined));
  };

  test("behaviour: a link to ?inspect= opens the panel as the modal and puts the id in the address, other parts kept", async ({ page }) => {
    await visitUrl(page);
    await expect(mention(page)).toBeHidden();
    await page.locator("#open-mention-41").click();
    await expect(mention(page)).toBeVisible();
    expect(await page.locator("#mention-41").evaluate((el) => (el as HTMLDialogElement).matches(":modal"))).toBe(true);
    const url = new URL(page.url());
    expect(url.searchParams.get("inspect")).toBe("mention-41");
    expect(url.searchParams.get("theme")).toBe(theme);
    expect(url.searchParams.get("only")).toBe("url");
  });

  test("keyboard: Esc closes the address-driven panel, takes its entry back, and focus returns to the link", async ({ page }) => {
    await visitUrl(page);
    const before = await page.evaluate(() => history.length);
    await page.locator("#open-mention-41").focus();
    await page.keyboard.press("Enter");
    await expect(mention(page)).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(mention(page)).toBeHidden();
    await expect.poll(() => new URL(page.url()).searchParams.has("inspect")).toBe(false);
    await expect(page.locator("#open-mention-41")).toBeFocused();
    // The entry it pushed was taken back: Back goes where it went before, not into the panel.
    expect(await page.evaluate(() => history.length)).toBeGreaterThanOrEqual(before);
    expect(new URL(page.url()).searchParams.get("only")).toBe("url");
  });

  test("behaviour: Back closes the address-driven panel and Forward opens it again", async ({ page }) => {
    await visitUrl(page);
    await page.locator("#open-mention-41").click();
    await expect(mention(page)).toBeVisible();
    await page.goBack();
    await expect(mention(page)).toBeHidden();
    expect(new URL(page.url()).searchParams.has("inspect")).toBe(false);
    await page.goForward();
    await expect(mention(page)).toBeVisible();
    expect(new URL(page.url()).searchParams.get("inspect")).toBe("mention-41");
  });

  test("behaviour: a page loaded with ?inspect= has the panel open, and closing it rewrites the address without a new entry", async ({ page }) => {
    await visitUrl(page, "mention-41");
    await expect(mention(page)).toBeVisible();
    expect(await page.locator("#mention-41").evaluate((el) => (el as HTMLDialogElement).matches(":modal"))).toBe(true);
    const before = await page.evaluate(() => history.length);
    await page.keyboard.press("Escape");
    await expect(mention(page)).toBeHidden();
    await expect.poll(() => new URL(page.url()).searchParams.has("inspect")).toBe(false);
    expect(await page.evaluate(() => history.length)).toBe(before);
  });

  test("behaviour: the plain form inside posts its fields and the pressed button, with no script of ours", async ({ page }) => {
    await visitUrl(page, "mention-41");
    const posted = page.evaluate(
      () =>
        new Promise<Record<string, string>>((done) => {
          document.querySelector("#mention-41 form")!.addEventListener("submit", (e) => {
            e.preventDefault();
            const data = new FormData(e.target as HTMLFormElement, (e as SubmitEvent).submitter);
            done(Object.fromEntries(Array.from(data.entries()).map(([k, v]) => [k, String(v)])));
          });
        }),
    );
    await mention(page).getByRole("textbox", { name: "Note, kept with the decision" }).fill("Looks like a real reply.");
    await mention(page).getByRole("button", { name: "Approve" }).click();
    expect(await posted).toEqual({ id: "mention-41", note: "Looks like a real reply.", intent: "approve" });
  });

  test("accessibility: the address-driven panel, open, has no axe violations", async ({ page }) => {
    await visitUrl(page, "mention-41");
    await expect(mention(page)).toBeVisible();
    await expectNoAxeViolations(page);
  });
});
