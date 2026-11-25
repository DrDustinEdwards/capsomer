import type { Locator, Page } from "@playwright/test";
import { visitStates, type Theme } from "../../test/helpers.ts";

export const FOX = "launch-hero.jpg";
export const UPTIME = "uptime-strip.png";

export const tile = (page: Page, name: string): Locator =>
  page.locator(`.cap-media-tile[data-label="${name}"]`);
export const link = (page: Page, name: string): Locator =>
  tile(page, name).locator(".cap-media-open");
export const inspector = (page: Page): Locator => page.locator("dialog.cap-media-inspector");
export const alt = (page: Page): Locator => inspector(page).getByLabel("Alt text");
export const saveStatus = (page: Page): Locator =>
  inspector(page).locator("[data-cap-part='save-status']");
export const library = (page: Page, theme: Theme, only = "library") =>
  visitStates(page, "media", theme, only);
