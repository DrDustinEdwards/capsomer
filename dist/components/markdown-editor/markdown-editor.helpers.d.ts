import { type Locator, type Page } from "@playwright/test";
export declare const NAME = "markdown-editor";
export declare const section: (page: Page, id: string) => Locator;
export declare const surfaceOf: (scope: Page | Locator) => Locator;
export declare const toolbarOf: (scope: Page | Locator) => Locator;
export declare function ready(page: Page, id: string): Promise<Locator>;
export declare function visitOnly(page: Page, theme: "light" | "dark", id: string): Promise<Locator>;
export declare function type(page: Page, surface: Locator, text: string): Promise<void>;
