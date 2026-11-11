import { type Page } from "@playwright/test";
export * from "./page.ts";
export declare const THEMES: readonly ["light", "dark"];
export type Theme = (typeof THEMES)[number];
export declare function eachTheme(body: (theme: Theme) => void): void;
declare global {
    interface Window {
        capRatio(a: string, b: string): number;
    }
}
export declare function visitStates(page: Page, name: string, theme: Theme, only?: string): Promise<void>;
export declare function expectNoAxeViolations(page: Page, include?: string, options?: {
    baseUi?: boolean;
    exclude?: string;
    disableRules?: string[];
}): Promise<void>;
export declare function expectContrast(page: Page, checks: Array<{
    sel: string;
    what: string;
    part?: "color" | "border" | "outline";
    min?: number;
}>): Promise<void>;
