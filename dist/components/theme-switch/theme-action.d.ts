import { type ThemeChoice } from "./theme-cookie.ts";
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
