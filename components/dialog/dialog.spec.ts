import { expect, test, type Page } from "@playwright/test";
import { eachTheme, expectContrast, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";
import { errorText, uid } from "./dialog.ts";

const dlg = (page: Page, name: string) => page.getByRole("dialog", { name });
const alertDlg = (page: Page, name = "Revoke foxhound-driver?") => page.getByRole("alertdialog", { name });
const hash = (page: Page) => page.evaluate(() => location.hash);
const STATIC = ["centre", "alert", "large", "right", "left", "bottom", "top", "scroll", "busy"];

async function live(page: Page, theme: "light" | "dark") {
  await visitStates(page, "dialog", theme, "live");
}

// Opens a live dialog from its button with the keyboard, as a person would.
async function openFrom(page: Page, button: string) {
  await page.locator(`#${button}`).focus();
  await page.keyboard.press("Enter");
}

// A press at the page's corner is on the backdrop, outside every placement used here.
const backdropClick = (page: Page) => page.mouse.click(4, 4);

// Plain logic that needs no page.
test("behaviour: errorText reads an Error, a string, or says nothing is known", () => {
  expect(errorText(new Error("The key is already gone"))).toBe("The key is already gone");
  expect(errorText("Offline")).toBe("Offline");
  expect(errorText(new Error(""))).toMatch(/nothing says what/);
  expect(errorText(undefined)).toMatch(/nothing says what/);
});

test("behaviour: uid returns a new id on every call, with the prefix", () => {
  const a = uid("cap-dialog");
  const b = uid("cap-dialog");
  expect(a).toMatch(/^cap-dialog-\d+$/);
  expect(b).not.toBe(a);
});

// With no script the dialog is a card in the page and its form works: a context with script off
// reads the delivered HTML, which is all there is.
test("behaviour: with no script an inline dialog is in the page, open, and its form is there", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL: "http://localhost:4319/" });
  const page = await context.newPage();
  await page.goto("components/dialog/states.html");
  const card = page.locator("#inline-rename");
  await expect(card).toHaveAttribute("open", "");
  await expect(card).toBeVisible();
  await expect(card.getByRole("textbox", { name: "Site name" })).toHaveValue("foxhound.app");
  await expect(card.getByRole("button", { name: "Save name" })).toBeVisible();
  // In the flow, not floating: it sits inside the page's main region, below its own heading.
  expect(await card.evaluate((el) => getComputedStyle(el).position)).toBe("static");
  await expect(page.getByRole("link", { name: "Cancel" })).toHaveAttribute("href", "/admin/sites/foxhound");
  await context.close();
});

eachTheme((theme) => {
  test("accessibility: no axe violations, the states page", async ({ page }) => {
    await visitStates(page, "dialog", theme);
    await expectNoAxeViolations(page);
  });

  test("accessibility: no axe violations, the live page", async ({ page }) => {
    await live(page, theme);
    await expectNoAxeViolations(page);
  });

  for (const id of STATIC) {
    test(`accessibility: no axe violations, ${id}`, async ({ page }) => {
      await visitStates(page, "dialog", theme, id);
      await expect(page.locator("dialog.cap-dialog")).toBeVisible();
      await expectNoAxeViolations(page);
    });
  }

  test("accessibility: title, description, label and the close icon reach their contrast", async ({ page }) => {
    await visitStates(page, "dialog", theme, "centre");
    await expect(dlg(page, "Rename the site")).toBeVisible();
    await expectContrast(page, [
      { sel: ".cap-dialog-title", what: "the title" },
      { sel: ".cap-dialog-description", what: "the description" },
      { sel: ".cap-dialog-body label", what: "a label in the body" },
      { sel: ".cap-dialog-footer .cap-btn", what: "Cancel on the footer band" },
      { sel: ".cap-dialog-close", what: "the close icon", min: 3 },
    ]);
  });

  test("accessibility: the dialog is named by its title and described by its description", async ({ page }) => {
    await visitStates(page, "dialog", theme, "centre");
    const d = dlg(page, "Rename the site");
    await expect(d).toHaveAccessibleName("Rename the site");
    await expect(d).toHaveAccessibleDescription(/Visitors keep the old address/);
    await expect(d.getByRole("heading", { name: "Rename the site", level: 2 })).toBeVisible();
    await expect(d.getByRole("textbox", { name: "Site name" })).toBeVisible();
    await expect(d.getByRole("button", { name: "Cancel" })).toBeVisible();
    await expect(d.getByRole("button", { name: "Save name" })).toBeVisible();
    await expect(d.getByRole("button", { name: "Close" })).toBeVisible();
  });

  test("accessibility: a confirm question is an alertdialog, named and described", async ({ page }) => {
    await visitStates(page, "dialog", theme, "alert");
    const d = alertDlg(page);
    await expect(d).toBeVisible();
    await expect(d).toHaveAccessibleDescription(/This cannot be undone/);
    // An alert dialog has no corner Close button: the answer is Cancel or the action.
    await expect(d.getByRole("button", { name: "Close" })).toHaveCount(0);
  });

  test("accessibility: a dialog named with aria-label has no dangling labelledby", async ({ page }) => {
    await visitStates(page, "dialog", theme, "top");
    const d = dlg(page, "Command menu");
    await expect(d).toBeVisible();
    await expect(d).not.toHaveAttribute("aria-labelledby", /.+/);
  });

  test("accessibility: the page behind a modal dialog is inert, and the dialog is modal", async ({ page }) => {
    await visitStates(page, "dialog", theme, "centre");
    await expect(dlg(page, "Rename the site")).toBeVisible();
    const modal = await page.evaluate(() => document.querySelector("dialog.cap-dialog")?.matches(":modal"));
    expect(modal).toBe(true);
    // The page behind it cannot take focus.
    await page.evaluate(() => document.getElementById("main")?.focus());
    expect(await page.evaluate(() => !!document.activeElement?.closest("dialog.cap-dialog[open]"))).toBe(true);
  });

  test("keyboard: focus starts on the first control, not the Close button", async ({ page }) => {
    await live(page, theme);
    await openFrom(page, "open-centre");
    await expect(dlg(page, "Rename the site")).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Site name" })).toBeFocused();
  });

  test("keyboard: an alert dialog starts on Cancel, and Enter there cancels", async ({ page }) => {
    await live(page, theme);
    await openFrom(page, "open-alert");
    await expect(alertDlg(page)).toBeVisible();
    await expect(page.getByRole("button", { name: "Cancel" })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(alertDlg(page)).toBeHidden();
    await expect(page.locator("#open-alert")).toBeFocused();
  });

  test("keyboard: an element with autofocus takes focus on open", async ({ page }) => {
    await live(page, theme);
    await openFrom(page, "open-focus");
    await expect(dlg(page, "Two fields")).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Second, where focus starts" })).toBeFocused();
  });

  test("keyboard: Esc closes the dialog and focus returns to the button that opened it", async ({ page }) => {
    await live(page, theme);
    await openFrom(page, "open-centre");
    await expect(dlg(page, "Rename the site")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dlg(page, "Rename the site")).toBeHidden();
    await expect(page.locator("#open-centre")).toBeFocused();
  });

  test("keyboard: Tab and Shift Tab stay inside the dialog", async ({ page }) => {
    await live(page, theme);
    await openFrom(page, "open-centre");
    await expect(dlg(page, "Rename the site")).toBeVisible();
    const inside = () => page.evaluate(() => !!document.activeElement?.closest("dialog.cap-dialog[open]"));
    for (let i = 0; i < 7; i++) {
      await page.keyboard.press("Tab");
      expect(await inside(), `after Tab ${i + 1}`).toBe(true);
    }
    for (let i = 0; i < 7; i++) {
      await page.keyboard.press("Shift+Tab");
      expect(await inside(), `after Shift Tab ${i + 1}`).toBe(true);
    }
  });

  test("keyboard: Enter on Close closes the dialog and returns focus", async ({ page }) => {
    await live(page, theme);
    await openFrom(page, "open-sheet");
    const d = dlg(page, "Push the capsomer branch");
    await expect(d).toBeVisible();
    await d.getByRole("button", { name: "Close" }).first().focus();
    await page.keyboard.press("Enter");
    await expect(d).toBeHidden();
    await expect(page.locator("#open-sheet")).toBeFocused();
  });

  test("keyboard: a body that scrolls is a keyboard stop, and the arrow keys scroll it", async ({ page }) => {
    await live(page, theme);
    await openFrom(page, "open-scroll");
    const d = dlg(page, "Audit log");
    await expect(d).toBeVisible();
    const body = d.locator(".cap-dialog-body");
    await expect(body).toHaveAttribute("tabindex", "0");
    await body.focus();
    await page.keyboard.press("PageDown");
    await expect.poll(() => body.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
  });

  test("behaviour: a body that fits is not a keyboard stop", async ({ page }) => {
    await live(page, theme);
    await openFrom(page, "open-centre");
    const d = dlg(page, "Rename the site");
    await expect(d).toBeVisible();
    await expect(d.locator(".cap-dialog-body")).not.toHaveAttribute("tabindex", /.*/);
  });

  test("behaviour: tall content keeps the header and the footer on screen while the body scrolls", async ({ page }) => {
    await live(page, theme);
    await openFrom(page, "open-scroll");
    const d = dlg(page, "Audit log");
    await expect(d).toBeVisible();
    await expect(d.getByRole("heading", { name: "Audit log" })).toBeInViewport();
    await expect(d.getByRole("button", { name: "Close" }).last()).toBeInViewport();
    const fits = await d.evaluate((el) => el.getBoundingClientRect().height <= window.innerHeight);
    expect(fits).toBe(true);
    const body = d.locator(".cap-dialog-body");
    expect(await body.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true);
  });

  test("behaviour: a short centred dialog is as tall as its content, not the window", async ({ page }) => {
    await live(page, theme);
    await openFrom(page, "open-centre");
    const d = dlg(page, "Rename the site");
    await expect(d).toBeVisible();
    const { box, content, win } = await d.evaluate((el) => ({
      box: el.getBoundingClientRect().height,
      content: el.scrollHeight,
      win: window.innerHeight,
    }));
    // The box is its content plus the 1px border each side.
    expect(box - content).toBeLessThanOrEqual(4);
    expect(box).toBeLessThan(win - 100);
  });

  test("behaviour: a click on the backdrop closes a dialog and returns focus", async ({ page }) => {
    await live(page, theme);
    await openFrom(page, "open-centre");
    await expect(dlg(page, "Rename the site")).toBeVisible();
    await backdropClick(page);
    await expect(dlg(page, "Rename the site")).toBeHidden();
    await expect(page.locator("#open-centre")).toBeFocused();
  });

  test("behaviour: a press that starts inside and ends on the backdrop does not close it", async ({ page }) => {
    await live(page, theme);
    await openFrom(page, "open-centre");
    const d = dlg(page, "Rename the site");
    await expect(d).toBeVisible();
    const box = await d.boundingBox();
    if (!box) throw new Error("the dialog has no box");
    await page.mouse.move(box.x + 24, box.y + 24);
    await page.mouse.down();
    await page.mouse.move(4, 4);
    await page.mouse.up();
    await expect(d).toBeVisible();
  });

  test("behaviour: a locked dialog and an alert dialog ignore a click on the backdrop", async ({ page }) => {
    await live(page, theme);
    await openFrom(page, "open-locked");
    const locked = dlg(page, "Locked, a click outside does nothing");
    await expect(locked).toBeVisible();
    await backdropClick(page);
    await expect(locked).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(locked).toBeHidden();

    await openFrom(page, "open-alert");
    await expect(alertDlg(page)).toBeVisible();
    await backdropClick(page);
    await expect(alertDlg(page)).toBeVisible();
  });

  test("behaviour: busy holds Esc, the backdrop and Cancel until the request answers", async ({ page }) => {
    await live(page, theme);
    await openFrom(page, "open-busy");
    const d = dlg(page, "Publish the draft");
    await expect(d).toBeVisible();
    await d.getByRole("button", { name: "Publish" }).click();
    await expect(d).toHaveAttribute("aria-busy", "true");
    await page.keyboard.press("Escape");
    await expect(d).toBeVisible();
    await backdropClick(page);
    await expect(d).toBeVisible();
    await d.getByRole("button", { name: "Cancel" }).click({ force: true });
    await expect(d).toBeVisible();
    await d.getByRole("button", { name: "Finish the request" }).click();
    await expect(d).toBeHidden();
  });

  test("behaviour: a dialog opened from history closes with Back, and Esc takes the entry back", async ({ page }) => {
    await live(page, theme);
    await openFrom(page, "open-sheet");
    const d = dlg(page, "Push the capsomer branch");
    await expect(d).toBeVisible();
    expect(await hash(page)).toBe("#dialog-live-sheet");
    await page.goBack();
    await expect(d).toBeHidden();
    expect(await hash(page)).toBe("");
    await expect(page.locator("#open-sheet")).toBeFocused();

    await openFrom(page, "open-sheet");
    await expect(d).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(d).toBeHidden();
    await expect.poll(() => hash(page)).toBe("");
  });

  test("behaviour: a dialog without history leaves the address alone", async ({ page }) => {
    await live(page, theme);
    await openFrom(page, "open-centre");
    await expect(dlg(page, "Rename the site")).toBeVisible();
    expect(await hash(page)).toBe("");
  });

  test("behaviour: each placement sits against its edge", async ({ page }) => {
    const rect = async (id: string) => {
      await visitStates(page, "dialog", theme, id);
      await expect(page.locator("dialog.cap-dialog")).toBeVisible();
      await page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished.catch(() => undefined))).then(() => undefined));
      return page.evaluate(() => {
        const r = document.querySelector("dialog.cap-dialog")?.getBoundingClientRect();
        if (!r) throw new Error("no dialog");
        return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, w: window.innerWidth, h: window.innerHeight };
      });
    };
    const centre = await rect("centre");
    expect(Math.abs(centre.left + centre.right - centre.w)).toBeLessThanOrEqual(2);
    expect(Math.abs(centre.top + centre.bottom - centre.h)).toBeLessThanOrEqual(2);
    const right = await rect("right");
    expect(right.right).toBeGreaterThanOrEqual(right.w - 1);
    expect(right.top).toBeLessThanOrEqual(1);
    expect(right.bottom).toBeGreaterThanOrEqual(right.h - 1);
    const left = await rect("left");
    expect(left.left).toBeLessThanOrEqual(1);
    expect(left.bottom).toBeGreaterThanOrEqual(left.h - 1);
    const bottom = await rect("bottom");
    expect(bottom.bottom).toBeGreaterThanOrEqual(bottom.h - 1);
    expect(bottom.left).toBeLessThanOrEqual(1);
    expect(bottom.right).toBeGreaterThanOrEqual(bottom.w - 1);
    const top = await rect("top");
    expect(Math.abs(top.left + top.right - top.w)).toBeLessThanOrEqual(2);
    expect(top.top).toBeLessThan(top.h / 3);
  });

  test("behaviour: under reduced motion the dialog appears and goes with no transition", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await live(page, theme);
    await openFrom(page, "open-centre");
    const d = dlg(page, "Rename the site");
    await expect(d).toBeVisible();
    const moving = await page.evaluate(() => {
      const el = document.getElementById("live-centre");
      if (!el) throw new Error("no dialog");
      return { animations: el.getAnimations({ subtree: true }).filter((a) => Number(a.effect?.getComputedTiming().endTime ?? 0) > 1).length, duration: parseFloat(getComputedStyle(el).transitionDuration) };
    });
    expect(moving.animations).toBe(0);
    expect(moving.duration).toBeLessThanOrEqual(0.001);
    await page.keyboard.press("Escape");
    await expect(d).toBeHidden();
  });

  test("behaviour: with motion allowed the dialog opens through a transition and still closes fully", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await live(page, theme);
    const animated = await page.evaluate(() => {
      const el = document.getElementById("live-centre");
      if (!(el instanceof HTMLDialogElement)) throw new Error("no dialog");
      el.showModal();
      return el.getAnimations().length > 0;
    });
    expect(animated).toBe(true);
    const d = dlg(page, "Rename the site");
    await expect(d).toBeVisible();
    await page.evaluate(() => (document.getElementById("live-centre") as HTMLDialogElement).close());
    await expect(d).toBeHidden();
    expect(await page.evaluate(() => (document.getElementById("live-centre") as HTMLDialogElement).open)).toBe(false);
  });

  test("behaviour: the page behind does not scroll while a dialog is open", async ({ page }) => {
    await live(page, theme);
    await openFrom(page, "open-centre");
    await expect(dlg(page, "Rename the site")).toBeVisible();
    const overflow = await page.evaluate(() => getComputedStyle(document.documentElement).overflow);
    expect(overflow).toBe("hidden");
    await page.keyboard.press("Escape");
    await expect(dlg(page, "Rename the site")).toBeHidden();
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).overflow)).not.toBe("hidden");
  });

  test("behaviour: opening the same dialog twice in a row works", async ({ page }) => {
    await live(page, theme);
    for (let i = 0; i < 2; i++) {
      await openFrom(page, "open-bottom");
      await expect(dlg(page, "More views")).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(dlg(page, "More views")).toBeHidden();
    }
  });
  test("behaviour: with script an inline dialog is closed on load and its link opens it as the modal", async ({ page }) => {
    await visitStates(page, "dialog", theme);
    const card = page.locator("#inline-rename");
    await expect(card).not.toHaveAttribute("open", "");
    await expect(card).toBeHidden();
    await page.locator("#open-inline").focus();
    await page.keyboard.press("Enter");
    await expect(dlg(page, "Rename the site")).toBeVisible();
    expect(await card.evaluate((el) => (el as HTMLDialogElement).matches(":modal"))).toBe(true);
    // A form that wraps the parts takes no box of its own, so the body is still the dialog's flex child.
    expect(await card.locator("form").evaluate((el) => getComputedStyle(el).display)).toBe("contents");
    await expect(page).not.toHaveURL(/#inline-rename/);
    expect(await page.evaluate(() => document.activeElement?.closest("dialog")?.id)).toBe("inline-rename");
  });

  test("keyboard: a Cancel that is a link closes the modal and stays on the page, and focus returns to the opener", async ({ page }) => {
    await visitStates(page, "dialog", theme);
    await page.locator("#open-inline").focus();
    await page.keyboard.press("Enter");
    await expect(dlg(page, "Rename the site")).toBeVisible();
    await dlg(page, "Rename the site").getByRole("link", { name: "Cancel" }).click();
    await expect(page.locator("#inline-rename")).toBeHidden();
    await expect(page).toHaveURL(/states\.html/);
    await expect(page.locator("#open-inline")).toBeFocused();
  });

  test("accessibility: the in-page dialog section has no axe violations with script on", async ({ page }) => {
    await visitStates(page, "dialog", theme);
    await expectNoAxeViolations(page);
  });
});
