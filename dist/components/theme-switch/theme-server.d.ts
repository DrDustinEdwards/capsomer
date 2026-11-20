export type ThemeChoice = "light" | "dark";
/** The localStorage key the theme switch remembers the choice under, unless a switch names its own (data-cap-pref). */
export declare const THEME_PREF = "cap-theme";
/** The cookie a site remembers the choice in, unless it has its own (txasm's "txasm_theme", Foxhound's "fh_theme"). */
export declare const THEME_COOKIE = "theme";
/** A year: the choice should outlast any visit gap a person would expect it to survive. */
export declare const THEME_COOKIE_MAX_AGE: number;
export declare function isThemeChoice(value: unknown): value is ThemeChoice;
export declare function readThemeCookie(source: Request | string | null | undefined, name?: string): ThemeChoice | null;
export declare function themeCookie(choice: ThemeChoice, opts?: {
    name?: string;
    maxAge?: number;
    secure?: boolean;
}): string;
export declare function colorSchemeContent(choice: ThemeChoice | null): "light" | "dark" | "light dark";
export interface ThemeColorTag {
    name: "theme-color";
    content: string;
    media?: string;
}
export declare function themeColorTags(choice: ThemeChoice | null, ground: {
    light: string;
    dark: string;
}): ThemeColorTag[];
export declare function themeColorMeta(choice: ThemeChoice | null, ground: {
    light: string;
    dark: string;
}): string;
export declare function themeScript(key?: string, opts?: {
    cookie?: string;
}): string;
export declare function themeReturnTo(request: Request): string;
export declare function readThemeChoice(request: Request): Promise<ThemeChoice | null>;
export interface ThemeActionOptions {
    /** The site's cookie ("theme" by default); false writes none (a signed-in account keeps the choice instead). */
    cookie?: string | false;
    /** false for a local http dev server. */
    secure?: boolean;
    /** Saves the choice for the signed-in person (their account row), before the response is written. */
    save?: (choice: ThemeChoice) => void | Promise<unknown>;
}
export declare function themeAction(request: Request, opts?: ThemeActionOptions): Promise<Response>;
