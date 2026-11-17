export interface AiSampleField {
    label: string;
    value: string;
    mono?: boolean;
}
export type AiSampleResult = {
    fields: AiSampleField[];
    note?: string;
} | {
    error: true;
};
export interface AiSampleOptions {
    generate: (data: FormData) => Promise<AiSampleResult>;
    failed?: string;
}
export declare function drawSample(out: HTMLElement, result: AiSampleResult | null, failed?: string): void;
export declare function enhance(root: ParentNode | undefined, options: AiSampleOptions): () => void;
