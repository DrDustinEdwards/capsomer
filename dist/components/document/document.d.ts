export interface DocumentScope {
    family?: string;
    site?: string;
    theme?: "light" | "dark" | null;
}
export declare function documentAttrs({ family, site, theme }: DocumentScope): Record<string, string>;
export type Starter = () => unknown;
export declare function startSite(parts: readonly Starter[], report?: (error: unknown) => void): Promise<number>;
