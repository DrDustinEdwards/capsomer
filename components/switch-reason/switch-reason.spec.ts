import { expect, test, type Page } from "@playwright/test";
import { eachTheme, expectContrast, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

interface Applied {
  checked: boolean;
  reason: string;
}
interface Settle {
  res: () => void;
  rej: (e: Error) => void;
}
type Win = Window & { applied?: Applied[]; settle?: Settle; escapes?: number };

const MISSING = "Type a reason. It is recorded with the change.";

// Records every cap:switch-applied event on the page.
async function recordApplied(page: Page): Promise<void> {
  await page.evaluate(() => {
    const w = window as Win;
    w.applied = [];
    document.addEventListener("cap:switch-applied", (e) => {
      const d = (e as CustomEvent<Applied>).detail;
      w.applied?.push({ checked: d.checked, reason: d.reason });
    });
  });
}

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "switch-reason", theme);
    await expectNoAxeViolations(page);
  });

  test("accessibility: words and edges reach their contrast", async ({ page }) => {
    await visitStates(page, "switch-reason", theme);
    await expectContrast(page, [
      { sel: "label[for='sr-ask-why']", what: "the reason's label" },
      { sel: "#sr-ask-why", what: "a typed reason" },
      { sel: "#sr-ask-keys", what: "the keys hint" },
      { sel: "#sr-loop-note", what: "the note beside the switch" },
      { sel: "#sr-note-text", what: "the note beside a paused switch" },
      { sel: "#sr-miss-err", what: "the reason-missing message" },
      { sel: "#sr-fail-err", what: "the could-not-apply message" },
      { sel: "#sr-ask-why", what: "the reason field's edge", part: "border" },
      { sel: "#sr-miss-why", what: "an invalid reason field's edge", part: "border" },
      { sel: "#sr-loop input[role='switch']", what: "the track's edge, on", part: "border" },
      { sel: "#sr-backups input[role='switch']", what: "the track's edge, off", part: "border" },
      { sel: "[aria-labelledby='s-pending'] input[role='switch']", what: "the pending switch's outline", part: "outline" },
    ]);
  });

  test("accessibility: roles and names", async ({ page }) => {
    await visitStates(page, "switch-reason", theme);
    await expect(page.locator("#sr-loop")).toMatchAriaSnapshot(`
      - switch "Improve loop" [checked]
    `);
    await expect(page.locator("#sr-loop form")).toBeHidden();
    await expect(page.locator("#sr-miss-why")).toHaveAccessibleName("Turning mention sync on. Reason:");
    await expect(page.locator("#sr-miss-why")).toHaveAccessibleDescription(`${MISSING} Enter applies, Esc cancels. The reason is recorded with the change.`);
  });

  test("accessibility: while the change is sent, the switch and the form say they are busy, and the switch keeps its name", async ({ page }) => {
    await visitStates(page, "switch-reason", theme);
    const sw = page.locator("[aria-labelledby='s-pending'] input[role='switch']");
    await expect(sw).toHaveAttribute("aria-busy", "true");
    await expect(sw).toHaveAccessibleName("Agent access for foxhound-driver");
    await expect(page.locator("[aria-labelledby='s-pending'] form")).toHaveAttribute("aria-busy", "true");
    await expect(page.locator("#sr-pend-apply")).toHaveAttribute("aria-busy", "true");
  });

  test("keyboard: Space on the switch asks why beside it and does not move it", async ({ page }) => {
    await visitStates(page, "switch-reason", theme);
    const sw = page.getByRole("switch", { name: "Improve loop" });
    await expect(page.locator("#sr-loop-note")).toBeVisible();
    await sw.focus();
    await page.keyboard.press("Space");
    await expect(sw).toBeChecked();
    await expect(page.locator("#sr-loop .cap-switch-state")).toHaveText("On");
    const why = page.getByRole("textbox", { name: "Turning the improve loop off. Reason:" });
    await expect(why).toBeVisible();
    await expect(why).toBeFocused();
    // The note gives way to the reason.
    await expect(page.locator("#sr-loop-note")).toBeHidden();
  });

  test("keyboard: Enter with no reason shows an error beside the field and the switch stays", async ({ page }) => {
    await visitStates(page, "switch-reason", theme);
    await recordApplied(page);
    const sw = page.getByRole("switch", { name: "Improve loop" });
    await sw.focus();
    await page.keyboard.press("Space");
    await page.keyboard.press("Enter");
    const err = page.locator("#sr-loop-err");
    await expect(err).toHaveText(MISSING);
    await expect(err).toHaveAttribute("role", "alert");
    await expect(page.locator("#sr-loop-why")).toHaveAttribute("aria-invalid", "true");
    expect((await page.locator("#sr-loop-why").getAttribute("aria-describedby"))?.split(" ")).toContain("sr-loop-err");
    await expect(page.locator("#sr-loop-why")).toBeFocused();
    await expect(sw).toBeChecked();
    expect(await page.evaluate(() => (window as Win).applied)).toEqual([]);
  });

  test("keyboard: Enter with a reason applies: the switch moves, the event carries the reason, focus returns", async ({ page }) => {
    await visitStates(page, "switch-reason", theme);
    await recordApplied(page);
    const sw = page.getByRole("switch", { name: "Improve loop" });
    await sw.focus();
    await page.keyboard.press("Space");
    await page.keyboard.type("Pausing during the migration");
    await page.keyboard.press("Enter");
    await expect(sw).not.toBeChecked();
    await expect(page.locator("#sr-loop .cap-switch-state")).toHaveText("Off");
    await expect(page.locator("#sr-loop form")).toBeHidden();
    await expect(sw).toBeFocused();
    expect(await page.evaluate(() => (window as Win).applied)).toEqual([{ checked: false, reason: "Pausing during the migration" }]);

    const said = page.locator("#sr-loop-said");
    await expect(said).toContainText('Improve loop turned off: "Pausing during the migration".');
    await said.getByRole("button", { name: "Undo" }).click();
    await expect(sw).toBeChecked();
    await expect(page.locator("#sr-loop .cap-switch-state")).toHaveText("On");
  });

  test("keyboard: Esc cancels and returns focus to the switch, which has not moved", async ({ page }) => {
    await visitStates(page, "switch-reason", theme);
    const sw = page.getByRole("switch", { name: "Improve loop" });
    await sw.focus();
    await page.keyboard.press("Space");
    await page.keyboard.type("Half a thought");
    await page.keyboard.press("Escape");
    await expect(page.locator("#sr-loop form")).toBeHidden();
    await expect(sw).toBeFocused();
    await expect(sw).toBeChecked();
    await page.keyboard.press("Space");
    await expect(page.locator("#sr-loop-why")).toHaveValue("");
  });

  test("keyboard: Esc in the reason does not reach a panel the switch sits in", async ({ page }) => {
    await visitStates(page, "switch-reason", theme);
    await page.evaluate(() => {
      const w = window as Win;
      w.escapes = 0;
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") w.escapes = (w.escapes ?? 0) + 1;
      });
    });
    await page.getByRole("switch", { name: "Improve loop" }).focus();
    await page.keyboard.press("Space");
    await page.keyboard.press("Escape");
    await expect(page.locator("#sr-loop form")).toBeHidden();
    expect(await page.evaluate(() => (window as Win).escapes)).toBe(0);
  });

  test("behaviour: a click asks too, and Cancel closes the form", async ({ page }) => {
    await visitStates(page, "switch-reason", theme);
    const sw = page.getByRole("switch", { name: "Nightly backups" });
    await sw.click();
    await expect(sw).not.toBeChecked();
    await expect(page.getByRole("textbox", { name: "Enabling nightly backups. Reason:" })).toBeFocused();
    await page.locator("#sr-backups").getByRole("button", { name: "Cancel" }).click();
    await expect(page.locator("#sr-backups form")).toBeHidden();
    await expect(sw).toBeFocused();
  });

  test("behaviour: a click on the switch while the reason is open goes back to the reason and keeps what was typed", async ({ page }) => {
    await visitStates(page, "switch-reason", theme);
    const sw = page.getByRole("switch", { name: "Nightly backups" });
    await sw.click();
    await page.locator("#sr-backups-why").fill("The storage move is done");
    await sw.click();
    await expect(page.locator("#sr-backups-why")).toBeFocused();
    await expect(page.locator("#sr-backups-why")).toHaveValue("The storage move is done");
  });

  test("behaviour: the state asked for is fixed when the reason opens, whatever the switch does meanwhile", async ({ page }) => {
    await visitStates(page, "switch-reason", theme);
    await recordApplied(page);
    const sw = page.getByRole("switch", { name: "Improve loop" });
    await sw.focus();
    await page.keyboard.press("Space");
    // A poll lands and the app moves the switch to the state the person is asking for.
    await page.evaluate(() => {
      const input = document.querySelector<HTMLInputElement>("#sr-loop input[role='switch']");
      if (input) input.checked = false;
    });
    await page.keyboard.type("The poll got there first");
    await page.keyboard.press("Enter");
    expect(await page.evaluate(() => (window as Win).applied)).toEqual([{ checked: false, reason: "The poll got there first" }]);
  });

  test("behaviour: while the app saves, the switch and Apply are pending and Esc is held; a failure keeps the form with its message", async ({ page }) => {
    await visitStates(page, "switch-reason", theme);
    await page.evaluate(() => {
      const w = window as Win;
      document.querySelector("#sr-backups")?.addEventListener("cap:switch-applied", (e) => {
        (e as CustomEvent<{ waitUntil: (p: Promise<unknown>) => void }>).detail.waitUntil(
          new Promise<void>((res, rej) => {
            w.settle = { res, rej };
          }),
        );
      });
    });
    const sw = page.getByRole("switch", { name: "Nightly backups" });
    const form = page.locator("#sr-backups form");
    const apply = page.locator("#sr-backups button[type='submit']");
    await sw.click();
    await page.locator("#sr-backups-why").fill("The storage move is done");
    await page.keyboard.press("Enter");

    await expect(apply).toHaveAttribute("aria-busy", "true");
    await expect(sw).toHaveAttribute("aria-busy", "true");
    await expect(form).toHaveAttribute("aria-busy", "true");
    await expect(sw).not.toBeChecked();
    await page.keyboard.press("Escape");
    await expect(form).toBeVisible();

    await page.evaluate(() => (window as Win).settle?.rej(new Error("The Portal did not answer.")));
    const err = page.locator("#sr-backups-err");
    await expect(err).toHaveText("Could not turn nightly backups on. The Portal did not answer. Try again, or press Esc to cancel.");
    await expect(err).toHaveAttribute("role", "alert");
    await expect(apply).not.toHaveAttribute("aria-busy", "true");
    await expect(sw).not.toHaveAttribute("aria-busy", "true");
    await expect(sw).not.toBeChecked();
    await expect(page.locator("#sr-backups-why")).toBeFocused();

    await page.keyboard.press("Enter");
    await expect(apply).toHaveAttribute("aria-busy", "true");
    await page.evaluate(() => (window as Win).settle?.res());
    await expect(sw).toBeChecked();
    await expect(page.locator("#sr-backups .cap-switch-state")).toHaveText("On");
    await expect(form).toBeHidden();
  });
});
