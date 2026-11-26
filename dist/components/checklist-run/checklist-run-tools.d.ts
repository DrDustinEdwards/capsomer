import { type Run, type StepInfo } from "./checklist-run-model.ts";
/** What a step's tools reach back for. */
export interface RunHost {
    /** The selector of a step's words, after which its tools go. */
    stepText: string;
    run: () => Run | null;
    update: (next: Run) => void;
    say: (message: string) => void;
    keyOf: (li: HTMLElement) => string;
    /** Timer key to the number of its step, for the words a ringing timer says. */
    timerStep: Map<string, string>;
    /** Writes each pending note (a debounce is waiting) when the run ends. */
    flushes: Array<() => void>;
    sound: {
        ensure(): void;
    };
    redraw: () => void;
    startTicker: () => void;
}
export declare function drawAllTimers(root: HTMLElement): void;
export declare function buildTools(host: RunHost, li: HTMLElement): void;
/** A step's record in the run's files: its key, number, section's title and words. */
export declare function stepRecordsOf(items: HTMLElement[], textSelector: string, keyOf: (li: HTMLElement) => string): StepInfo[];
export declare function roll(host: RunHost, items: HTMLElement[], lit: HTMLElement | undefined): HTMLOListElement;
export declare function applyView(root: HTMLElement, host: RunHost, items: HTMLElement[], keys: string[], title: string, oneAtATime: boolean, shownKey: string | null): void;
/** The run record at the end: a count, a note on the whole run, the downloads, Print and Start over. */
export declare function drawSummary(summary: HTMLElement, ids: {
    headingId: string;
    noteId: string;
}, host: RunHost, p: {
    path: string;
    stepKeys: string[];
    stepRecords: () => StepInfo[];
    forget: () => void;
    record: (run: Run) => unknown;
    markdown: (run: Run) => string;
}): void;
