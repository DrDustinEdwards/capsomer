import { expect, test } from "@playwright/test";
import {
  eachTheme,
  expectContrast,
  expectNoAxeViolations,
  visitStates,
} from "../../test/helpers.ts";

eachTheme((theme) => {
  test.use({ permissions: ["clipboard-read", "clipboard-write"] });

  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "copy", theme);
    await expectNoAxeViolations(page);
  });

  test("accessibility: the bubble reaches its contrast", async ({ page }) => {
    await visitStates(page, "copy", theme);
    await expectContrast(page, [
      { sel: "#tip-done", what: "the Copied bubble" },
      { sel: "#tip-failed", what: "the Copy failed bubble" },
    ]);
  });

  test("keyboard: Enter copies the target's text and the bubble says Copied, then clears", async ({
    page,
  }) => {
    await visitStates(page, "copy", theme);
    const button = page.getByRole("button", { name: "Copy install command" });
    await button.focus();
    await page.keyboard.press("Enter");
    const tip = page.locator("#copy-snippet + .cap-copy-tip");
    await expect(tip).toHaveText("Copied");
    await expect(button).toHaveAttribute("data-state", "done");
    await expect(button).toBeFocused();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("npm install capsomer");
    await expect(tip).toHaveText("", { timeout: 4000 });
  });

  test("behavior: a repeat press is still announced (the message differs by a no-break space)", async ({
    page,
  }) => {
    await visitStates(page, "copy", theme);
    const button = page.getByRole("button", { name: "Copy link" });
    const tip = page.locator("#copy-link + .cap-copy-tip");
    await button.click();
    await expect(tip).toHaveText("Link copied");
    await button.click();
    await expect.poll(() => tip.evaluate((el) => el.textContent)).toBe("Link copied ");
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
      "example.com/field-notes",
    );
  });

  test("behavior: a refused write says Copy failed and keeps the button usable", async ({
    page,
  }) => {
    await visitStates(page, "copy", theme);
    await page.evaluate(() => {
      Object.defineProperty(navigator, "clipboard", {
        value: { writeText: () => Promise.reject(new Error("denied")) },
        configurable: true,
      });
    });
    const button = page.getByRole("button", { name: "Copy install command" });
    await button.click();
    await expect(page.locator("#copy-snippet + .cap-copy-tip")).toHaveText("Copy failed");
    await expect(button).toHaveAttribute("data-state", "failed");
    await expect(button).toBeEnabled();
  });

  test("behavior: without Invoker Commands, the click fallback copies once", async ({ page }) => {
    await page.addInitScript(() => {
      // @ts-expect-error -- removing the interface the module detects
      delete window.CommandEvent;
    });
    await visitStates(page, "copy", theme);
    let writes = 0;
    await page.exposeFunction("countWrite", () => writes++);
    await page.evaluate(() => {
      const real = navigator.clipboard.writeText.bind(navigator.clipboard);
      navigator.clipboard.writeText = (t: string) => {
        (window as unknown as { countWrite: () => void }).countWrite();
        return real(t);
      };
    });
    await page.getByRole("button", { name: "Copy install command" }).click();
    await expect(page.locator("#copy-snippet + .cap-copy-tip")).toHaveText("Copied");
    expect(writes).toBe(1);
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("npm install capsomer");
  });
});
