import { expect, test } from "@playwright/test";
import {
  eachTheme,
  expectContrast,
  expectNoAxeViolations,
  visitStates,
} from "../../test/helpers.ts";
import { order, spokenCount, type SessionState } from "./session-row.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "session-row", theme);
    await expectNoAxeViolations(page);
  });

  test("accessibility: every text tone and the ask's edge reach their contrast", async ({
    page,
  }) => {
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

  test("accessibility: the ask's roles and names", { tag: "@markup" }, async ({ page }) => {
    await visitStates(page, "session-row", theme);
    await expect(page.locator("#s-needs ~ .cap-session-list .cap-session-ask"))
      .toMatchAriaSnapshot(`
      - group "Asks to push a branch and open a pull request:":
        - paragraph: "Asks to push a branch and open a pull request:"
        - button "Approve push"
        - button "Decline"
    `);
    await expect(page.getByRole("list", { name: "Agent sessions", exact: true })).toBeVisible();
  });

  test("keyboard: Enter on an answer sends it", async ({ page }) => {
    await visitStates(page, "session-row", theme);
    const approve = page.getByRole("button", { name: "Approve push" }).first();
    await approve.focus();
    await page.keyboard.press("Enter");
    await expect(approve).toHaveAttribute("aria-busy", "true");
  });

  test("behavior: an answer announces which session and which answer", async ({ page }) => {
    await visitStates(page, "session-row", theme);
    const detail = page.evaluate(
      () =>
        new Promise((done) =>
          document.addEventListener("cap-answer", (e) => done((e as CustomEvent).detail), {
            once: true,
          }),
        ),
    );
    await page.getByRole("button", { name: "Keep 0008" }).click();
    expect(await detail).toEqual({ session: "sess_migr", answer: "keep-0008" });
  });
});

test("behavior: order puts waiting on you first, the longest wait at the top", () => {
  const s = (id: string, state: SessionState, since: number) => ({ id, state, since });
  const got = order([
    s("idle", "idle", 50),
    s("work", "working", 40),
    s("new-ask", "needs", 90),
    s("fail", "failed", 10),
    s("old-ask", "needs", 20),
    s("stop", "stopped", 99),
    s("work2", "working", 70),
  ]);
  expect(got.map((x) => x.id)).toEqual([
    "old-ask",
    "new-ask",
    "fail",
    "work2",
    "work",
    "idle",
    "stop",
  ]);
});

test("behavior: a count is spoken as times", () => {
  expect(spokenCount(12)).toBe("12 times");
  expect(spokenCount(1)).toBe("once");
});
