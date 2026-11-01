import { type Page } from "@playwright/test";
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
export declare function settled(page: Page): Promise<void>;
export interface Reading {
    fg: string;
    bg: string;
    ratio: number;
}
export declare function paintedContrast(page: Page, selector: string, part?: "color" | "border" | "outline"): Promise<Reading | null>;
export declare function expectContrast(page: Page, checks: Array<{
    sel: string;
    what: string;
    part?: "color" | "border" | "outline";
    min?: number;
}>): Promise<void>;
export declare function focused(page: Page): Promise<string>;
export declare function nextPost(page: Page, root: string): Promise<{
    method: string;
    enctype: string;
    fields: Record<string, string[]>;
}>;
export declare function ringContrast(page: Page, sel: string): Promise<{
    ring: string;
    bg: string;
    ratio: number;
    width: string;
} | null>;
export declare function rowOverflow(page: Page): Promise<string[]>;
