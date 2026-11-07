export declare const DEFAULT_PREF = "cap-rail";
export declare function readPref(key: string): string | null;
export declare function writePref(key: string, value: string): void;
export declare function setRail(shell: HTMLElement, collapsed: boolean, remember?: boolean): void;
export declare function toggleRail(shell: HTMLElement): void;
export declare function openMore(shell: HTMLElement): void;
export declare function closeMore(shell: HTMLElement): void;
export type Density = "compact" | "comfortable";
export declare const DENSITY_PREF = "cap-density";
export declare function readDensity(key?: string): Density | null;
export declare function applyDensity(choice: Density, opts?: {
    key?: string;
    remember?: boolean;
}): void;
export declare function applyStoredDensity(key?: string): Density | null;
export declare function enhance(root?: ParentNode): () => void;
