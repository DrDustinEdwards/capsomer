/** A browser page that runs a function inside it: Playwright's Page or Puppeteer's. */
export interface PageLike {
    evaluate(...args: never[]): Promise<unknown>;
}
export declare function settled(page: PageLike): Promise<void>;
export interface Reading {
    fg: string;
    bg: string;
    ratio: number;
}
export declare function paintedContrast(page: PageLike, selector: string, part?: "color" | "border" | "outline"): Promise<Reading | null>;
export declare function focused(page: PageLike): Promise<string>;
export declare function nextPost(page: PageLike, root: string): Promise<{
    method: string;
    enctype: string;
    fields: Record<string, string[]>;
}>;
export declare function ringContrast(page: PageLike, sel: string): Promise<{
    ring: string;
    bg: string;
    ratio: number;
    width: string;
} | null>;
export declare function countCssRules(page: PageLike): Promise<number>;
export declare function rowOverflow(page: PageLike): Promise<string[]>;
