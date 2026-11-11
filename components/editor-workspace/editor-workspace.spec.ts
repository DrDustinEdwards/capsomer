import { expect, test } from "@playwright/test";
import {
  eachTheme,
  expectContrast,
  expectNoAxeViolations,
  visitStates,
} from "../../test/helpers.ts";

eachTheme((theme) => {
  test("accessibility: no axe violations", async ({ page }) => {
    await visitStates(page, "editor-workspace", theme);
    await expect(page.locator("#ws-react-text")).toBeVisible();
    // The preview frames are sandboxed with no script, so axe cannot run inside them (it fails the
    // run trying); what they show is the site's page, scanned by the site's own checks.
    await expectNoAxeViolations(page, undefined, { exclude: ".cap-preview-pane iframe" });
  });

  test("accessibility: the panes are named, the preview is a titled frame with an empty sandbox", async ({
    page,
  }) => {
    await visitStates(page, "editor-workspace", theme);
    const ws = page.locator("#ws-html");
    await expect(ws.getByRole("region", { name: "Write" })).toBeVisible();
    const frame = ws.getByRole("region", { name: "Preview" }).locator("iframe");
    await expect(frame).toHaveAttribute("sandbox", "");
    await expect(frame).toHaveAttribute("title", /^Preview of /);
    await expectContrast(page, [
      { sel: "#ws-html .cap-preview-pane", what: "the preview's edge", part: "border", min: 3 },
    ]);
  });

  test("keyboard: arrows choose the layout, which shows its panes and is remembered", async ({
    page,
  }) => {
    await visitStates(page, "editor-workspace", theme);
    const ws = page.locator("#ws-html");
    const write = ws.getByRole("region", { name: "Write" });
    const preview = ws.getByRole("region", { name: "Preview" });
    await ws.getByRole("radio", { name: "Split" }).focus();
    await page.keyboard.press("ArrowRight");
    await expect(ws.getByRole("radio", { name: "Preview" })).toBeChecked();
    await expect(write).toBeHidden();
    await expect(preview).toBeVisible();
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("ArrowLeft");
    await expect(write).toBeVisible();
    await expect(preview).toBeHidden();
    await visitStates(page, "editor-workspace", theme);
    await expect(ws.getByRole("radio", { name: "Write" })).toBeChecked();
    await expect(ws.getByRole("region", { name: "Preview" })).toBeHidden();

    // The React switch: its own key, the same behavior.
    const react = page.locator("[data-mount=react]");
    await react.getByRole("radio", { name: "Write" }).focus();
    await page.keyboard.press("ArrowRight");
    await expect(react.getByRole("region", { name: "Preview" })).toBeVisible();
    await expect(react.getByRole("region", { name: "Write" })).toBeVisible();
  });

  test("keyboard: Ctrl or Cmd+S saves in place; typing in the surface makes the chrome step back until the mouse moves", async ({
    page,
  }) => {
    await visitStates(page, "editor-workspace", theme);
    const text = page.locator("#ws-text");
    await text.focus();
    await page.keyboard.press("ControlOrMeta+s");
    await expect(page.locator("#ws-saved")).toHaveText("Saved 1 time.");
    const html = page.locator("html");
    await expect(html).not.toHaveAttribute("data-cap-typing");
    await page.keyboard.type("x");
    await expect(html).toHaveAttribute("data-cap-typing", "");
    const switcher = page.locator("#ws-html [data-cap-layout]");
    await expect(switcher).toHaveCSS("opacity", "0.08");
    await page.mouse.move(10, 10);
    await page.mouse.move(40, 40);
    await expect(html).not.toHaveAttribute("data-cap-typing");
    await expect(switcher).toHaveCSS("opacity", "1");
  });

  test("behavior: the React preview refreshes once the typing pauses, not on every key", async ({
    page,
  }) => {
    await visitStates(page, "editor-workspace", theme);
    const stamp = page.locator("#ws-react-stamp");
    const first = await stamp.textContent();
    await page.locator("#ws-react-text").pressSequentially(" More.");
    await expect(stamp).toHaveText(first ?? "");
    await expect(stamp).not.toHaveText(first ?? "", { timeout: 5000 });
  });
});
