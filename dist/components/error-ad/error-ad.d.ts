export interface AdPart {
    kind: "text" | "burst" | "rect" | "use";
    x?: number;
    y?: number;
    cx?: number;
    cy?: number;
    w?: number;
    h?: number;
    ref?: string;
    anchor?: "start" | "middle" | "end";
    font?: "display" | "slab" | "serif";
    size?: number;
    leading?: number;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    shadow?: {
        dx: number;
        dy: number;
        fill: string;
    };
    rotate?: number;
    lines?: string[];
    outer?: number;
    inner?: number;
    points?: number;
    color?: string;
}
export interface Ad {
    id: string;
    title: string;
    era: string;
    credit: string;
    viewBox: [number, number];
    parts: AdPart[];
}
export declare const AD_FONTS: readonly ["display", "slab", "serif"];
export declare function adProblems(ad: Partial<Ad> | null | undefined, art: string): string[];
export declare function burstPoints(cx: number, cy: number, outer: number, inner: number, points: number): string;
export declare function scopeArt(art: string, adId: string): string;
export declare function chooseAd<T extends {
    id: string;
}>(ads: T[], search: string, random?: () => number): T | undefined;
