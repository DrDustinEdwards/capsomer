import { type SentenceOptions } from "./draft-compare-diff.ts";
export type CompareView = "side" | "inline" | "changes";
export declare const VIEWS: readonly CompareView[];
export interface CompareSide {
    title: string;
    who?: string;
    time?: string;
    text: string;
}
export type RunKind = "you" | "ai" | "quoted";
export interface RunSpan {
    from: number;
    to: number;
    kind: RunKind;
}
export interface CompareLabels {
    before: string;
    after: string;
}
export interface CompareOptions extends SentenceOptions {
    id?: string;
    view?: CompareView;
    context?: number;
    labels?: Partial<CompareLabels>;
    runs?: {
        before?: RunSpan[];
        after?: RunSpan[];
    };
    remember?: boolean;
    heads?: boolean;
}
export declare const STORAGE_KEY = "cap-compare-view";
import { escapeHtml as esc } from "../email/email.ts";
export { esc };
export declare const plural: (n: number, one: string, many: string) => string;
export declare const sr: (s: string) => string;
export declare function renderCompare(before: CompareSide, after: CompareSide, options?: CompareOptions): string;
