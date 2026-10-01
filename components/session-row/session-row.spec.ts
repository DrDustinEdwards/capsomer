import { expect, test } from "@playwright/test";
import { eachTheme, expectContrast, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";
import { order, spokenCount, type SessionState } from "./session-row.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "session-row", theme);
    await expectNoAxeViolations(page);
  });

  test("accessibility: every text tone and the ask's edge reach their contrast", async ({ page }) => {
    await visitStates(page, "session-row", theme);
    await expectContrast(page, [
      { sel: ".cap-session-agent", what: "the agent's name" },
      { sel: ".cap-session-age", what: "the age" },
      { sel: ".cap-session-now", what: "the now-doing line" },
      { sel: ".cap-session-steps", what: "the collapsed steps" },
      { sel: ".cap-session-sample", what: "the sampling note" },
      { sel: ".cap-session-question", what: "the question on its tint" },
      { sel: ".cap-session-cmd", what: "the command on its sunken box" },
      { sel: ".cap-session-note", what: "the note beside the answers" },
      { sel: ".cap-session-ask", what: "the ask block's edge", part: "border" },
    ]);
  });

  test("accessibility: the ask's roles and names", async ({ page }) => {
    await visitStates(page, "session-row", theme);
    await expect(page.locator("#s-needs ~ .cap-session-list .cap-session-ask")).toMatchAriaSnapshot(`
      - group "Asks to push a branch and open a pull request:":
        - paragraph: "Asks to push a branch and open a pull request:"
        - button "Approve push"
        - button "Decline"
    `);
    await expect(page.getByRole("list", { name: "Agent sessions", exact: true })).toBeVisible();
  });

  test("accessibility: a collapsed count is spoken in words", async ({ page }) => {
    await visitStates(page, "session-row", theme);
    const steps = page.locator("#steps-tests");
    await expect(steps.locator("[aria-hidden='true']").first()).toHaveText(" ×12");
    await expect(steps.locator(".cap-sr-only").first()).toHaveText(" 12 times");
  });

  test("keyboard: Tab reaches each answer button, named for its action", async ({ page }) => {
    await visitStates(page, "session-row", theme);
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "Approve push" }).first()).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "Decline" }).first()).toBeFocused();
  });

  test("keyboard: Enter on an answer sends it", async ({ page }) => {
    await visitStates(page, "session-row", theme);
    const approve = page.getByRole("button", { name: "Approve push" }).first();
    await approve.focus();
    await page.keyboard.press("Enter");
    await expect(approve).toHaveAttribute("aria-busy", "true");
  });

  test("keyboard: Space on an answer sends it", async ({ page }) => {
    await visitStates(page, "session-row", theme);
    const decline = page.getByRole("button", { name: "Decline" }).first();
    await decline.focus();
    await page.keyboard.press("Space");
    await expect(decline).toHaveAttribute("aria-busy", "true");
  });

  test("behaviour: an answer announces which session and which answer", async ({ page }) => {
    await visitStates(page, "session-row", theme);
    const detail = page.evaluate(
      () => new Promise((done) => document.addEventListener("cap-answer", (e) => done((e as CustomEvent).detail), { once: true })),
    );
    await page.getByRole("button", { name: "Keep 0008" }).click();
    expect(await detail).toEqual({ session: "sess_migr", answer: "keep-0008" });
  });

  test("behaviour: the list shows a sampled stream and every state's word", async ({ page }) => {
    await visitStates(page, "session-row", theme);
    await expect(page.getByText("Showing 1 in 10 steps", { exact: false })).toBeVisible();
    for (const word of ["Needs you", "Working", "Failed", "Idle", "Stopped"]) {
      await expect(page.locator(".cap-pill", { hasText: word }).first()).toBeVisible();
    }
  });

  test("behaviour: only a failed session is marked critical, and it still says Failed in words", async ({ page }) => {
    await visitStates(page, "session-row", theme);
    const critical = page.locator(".cap-session[data-tone='crit']");
    const failed = page.locator(".cap-session", { has: page.locator(".cap-pill", { hasText: "Failed" }) });
    await expect(critical).not.toHaveCount(0);
    await expect(critical).toHaveCount(await failed.count());
    await expect(critical.first().locator(".cap-pill")).toContainText("Failed");
  });
});

test("behaviour: order puts waiting on you first, the longest wait at the top", () => {
  const s = (id: string, state: SessionState, since: number) => ({ id, state, since });
  const got = order([s("idle", "idle", 50), s("work", "working", 40), s("new-ask", "needs", 90), s("fail", "failed", 10), s("old-ask", "needs", 20), s("stop", "stopped", 99), s("work2", "working", 70)]);
  expect(got.map((x) => x.id)).toEqual(["old-ask", "new-ask", "fail", "work2", "work", "idle", "stop"]);
});

test("behaviour: a count is spoken as times", () => {
  expect(spokenCount(12)).toBe("12 times");
  expect(spokenCount(1)).toBe("once");
});
