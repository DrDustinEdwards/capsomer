import { expect } from "@playwright/test";
import { visitStates } from "../../test/helpers.js";
export const NAME = "markdown-editor";
export const section = (page, id) => page.locator(`#${id}`);
export const surfaceOf = (scope) => scope.getByRole("textbox", { name: /, markdown$/ });
export const toolbarOf = (scope) => scope.getByRole("toolbar", { name: "Markdown formatting" });
// Waits until the textarea has been upgraded, then returns the editable surface.
export async function ready(page, id) {
    const s = section(page, id);
    await expect(s.locator(".cm-content")).toBeVisible();
    return surfaceOf(s);
}
export async function visitOnly(page, theme, id) {
    await visitStates(page, NAME, theme, id);
    await expect(page.locator(".cm-content")).toBeVisible();
    return surfaceOf(page);
}
// Puts `text` in an empty surface by typing it, which is what a person does.
export async function type(page, surface, text) {
    await surface.click();
    await page.keyboard.press("Control+a");
    await page.keyboard.press("Delete");
    await page.keyboard.type(text);
}
