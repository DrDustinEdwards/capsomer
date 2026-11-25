import { expect, type Locator, type Page } from "@playwright/test";
import { visitStates } from "../../test/helpers.ts";

export const NAME = "markdown-editor";
export const section = (page: Page, id: string) => page.locator(`#${id}`);
export const surfaceOf = (scope: Page | Locator) =>
  scope.getByRole("textbox", { name: /, markdown$/ });
export const toolbarOf = (scope: Page | Locator) =>
  scope.getByRole("toolbar", { name: "Markdown formatting" });

// Waits until the textarea has been upgraded, then returns the editable surface.
export async function ready(page: Page, id: string): Promise<Locator> {
  const s = section(page, id);
  await expect(s.locator(".cm-content")).toBeVisible();
  return surfaceOf(s);
}

export async function visitOnly(page: Page, theme: "light" | "dark", id: string): Promise<Locator> {
  await visitStates(page, NAME, theme, id);
  await expect(page.locator(".cm-content")).toBeVisible();
  return surfaceOf(page);
}

// Puts `text` in an empty surface by typing it, which is what a person does.
export async function type(page: Page, surface: Locator, text: string) {
  await surface.click();
  await page.keyboard.press("Control+a");
  await page.keyboard.press("Delete");
  await page.keyboard.type(text);
}
