import { type Run, type StepInfo } from "./checklist-run-model.ts";
export interface RunOptions {
    noun?: string;
    storageKey?: string;
    steps?: string;
    stepText?: string;
    startSlot?: string;
    scaleForm?: string;
    markdownLabel?: string;
    recordName?: string;
    toRecord?: (run: Run, steps: StepInfo[], origin: string) => unknown;
}
export declare function start(root: HTMLElement, options?: RunOptions): () => void;
export declare function enhance(scope?: ParentNode, options?: RunOptions): () => void;
