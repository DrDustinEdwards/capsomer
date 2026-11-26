import { visitStates } from "../../test/helpers.js";
export const FOX = "launch-hero.jpg";
export const UPTIME = "uptime-strip.png";
export const tile = (page, name) => page.locator(`.cap-media-tile[data-label="${name}"]`);
export const link = (page, name) => tile(page, name).locator(".cap-media-open");
export const inspector = (page) => page.locator("dialog.cap-media-inspector");
export const alt = (page) => inspector(page).getByLabel("Alt text");
export const saveStatus = (page) => inspector(page).locator("[data-cap-part='save-status']");
export const library = (page, theme, only = "library") => visitStates(page, "media", theme, only);
