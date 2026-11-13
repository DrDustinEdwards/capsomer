import { expect, test } from "@playwright/test";
import {
  eachTheme,
  expectContrast,
  expectNoAxeViolations,
  visitStates,
} from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations, and the badge and note reach their contrast", async ({
    page,
  }) => {
    await visitStates(page, "ask-panel", theme);
    await expect(page.locator("#ak-answer .cap-ask-body")).not.toHaveAttribute("aria-busy");
    await expectNoAxeViolations(page);
    await expectContrast(page, [
      { sel: "#ak-answer .cap-ask-badge", what: "the AI badge" },
      { sel: "#ak-answer .cap-ask-note", what: "the may-be-wrong note" },
    ]);
  });
});

test("behavior: the answer streams in as text, with same-origin sources, the follow-up split off and one announcement", async ({
  page,
}) => {
  await visitStates(page, "ask-panel", "light");
  const panel = page.locator("#ak-answer").getByRole("region", { name: "AI answer" });
  await expect(panel.locator(".cap-ask-body")).toHaveText(
    "Logs are kept for 30 days, then deleted. Exports you saved stay until you delete them.",
  );
  await expect(panel.getByRole("list", { name: "Sources" }).getByRole("link")).toHaveText([
    "Retention",
    "Alerts",
  ]);
  await expect(panel.getByRole("link", { name: "How do I export the logs?" })).toHaveAttribute(
    "href",
    "/search?q=How%20do%20I%20export%20the%20logs%3F",
  );
  await expect(panel.locator("[aria-live]")).toHaveText(/^AI answer: Logs are kept/);
  await expect(page.locator("#ak-cut .cap-ask-cut")).toBeVisible();
  await expect(page.locator("#ak-failed .cap-ask-status")).toHaveText("Ask is unavailable.");
});

test("keyboard: the trigger hides on press and focus lands on the answer", async ({ page }) => {
  await visitStates(page, "ask-panel", "light");
  const trigger = page.locator("#ak-mount").getByRole("button", { name: "Ask AI" });
  await trigger.focus();
  await page.keyboard.press("Enter");
  await expect(trigger).toBeHidden();
  await expect(page.locator("#ak-mount .cap-ask")).toBeFocused();
});
