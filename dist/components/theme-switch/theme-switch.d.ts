import { THEME_COOKIE, THEME_PREF, type ThemeChoice } from "./theme-server.ts";
export { THEME_COOKIE, THEME_PREF, type ThemeChoice };
/** Saves a person's choice where the site keeps it (the signed-in account). Fire and forget: the
 *  page has already switched, so a failed save never switches it back; the next page reconciles. */
export type ThemeSave = (choice: ThemeChoice) => void | Promise<unknown>;
/** Where a person's choice is kept. `key`: this browser's localStorage key (null: none). `cookie`:
 *  the site's cookie, for its server. `onSave`: the site's own save. `onError`: told when that save
 *  throws or rejects (the choice stands either way); without it the failure is let go. */
export interface ThemeMemory {
    key?: string | null;
    cookie?: string;
    onSave?: ThemeSave;
    onError?: (error: unknown) => void;
}
export declare function readTheme(key?: string): ThemeChoice | null;
export declare function applyTheme(choice: ThemeChoice, opts?: {
    key?: string;
    remember?: boolean;
}): void;
export declare function writeThemeCookie(choice: ThemeChoice, name?: string): void;
export declare function chooseTheme(choice: ThemeChoice, { key, cookie, onSave, onError }?: ThemeMemory, { animate }?: {
    animate?: boolean;
}): void;
export declare function syncServedTheme(key?: string): void;
export declare function applyStoredTheme(key?: string): ThemeChoice | null;
export declare function effectiveTheme(): ThemeChoice;
export declare function toggleTheme(key?: string, memory?: Omit<ThemeMemory, "key">): ThemeChoice;
export declare function themeButtonLabel(showing: ThemeChoice): string;
export declare function syncThemeButton(button: HTMLElement, showing?: ThemeChoice): void;
export declare function enhance(root?: ParentNode, { onSave, onError }?: Pick<ThemeMemory, "onSave" | "onError">): () => void;
