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
export declare function themeColorMeta(choice: ThemeChoice | null, ground: {
    light: string;
    dark: string;
}): string;
export declare function themeScript(key?: string): string;
