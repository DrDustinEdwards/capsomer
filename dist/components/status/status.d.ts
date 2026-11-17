export type Tone = "crit" | "warn" | "ok" | "info" | "nodata" | "muted";
export type GlyphName = Tone | "running" | "queued" | "unknown" | "blocked" | "question" | "pr" | "report" | "proposal" | "site-down";
export interface GlyphPart {
    tag: "path" | "rect" | "circle";
    attrs: Readonly<Record<string, string>>;
}
export declare const STATUS_GLYPH: Readonly<Record<GlyphName, readonly GlyphPart[]>>;
export declare function glyphParts(name: GlyphName): string;
export declare function glyphHtml(name: GlyphName): string;
export interface StatusHtmlOptions {
    running?: boolean;
    reason?: string;
    brief?: boolean;
}
export declare function statusHtml(tone: Tone, label: string, options?: StatusHtmlOptions): string;
export interface Outcome {
    tone: Tone;
    running: boolean;
    label: string;
}
export declare function outcomeStatus(conclusion: string | null | undefined, labels?: Partial<Record<string, string>>): Outcome;
