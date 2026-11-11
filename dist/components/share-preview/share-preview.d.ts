export type SerpPart = "title" | "description";
export declare const SERP_LIMITS: Record<SerpPart, {
    px: number;
    font: number;
}>;
export declare function serpTextWidth(text: string, part: SerpPart): number;
export interface SerpReading {
    over: boolean;
    display: string;
    valueText: string;
}
export declare function serpReading(text: string, px: number | null, limit: number): SerpReading;
