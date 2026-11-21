export declare const RUN_VERSION = 1;
export interface StepTimer {
    label: string;
    text: string;
    min: number | null;
    max: number | null;
    unit: string;
}
export interface TimerState {
    state: "running" | "paused" | "done";
    endsAt: number | null;
    remainingMs: number;
    totalMs: number;
}
export interface StepState {
    done: boolean;
    doneAt: number | null;
    note: string;
}
export interface Run {
    v: number;
    path: string;
    version: string;
    title: string;
    scale: number | null;
    startedAt: number;
    finishedAt: number | null;
    note: string;
    steps: Record<string, StepState>;
    timers: Record<string, TimerState>;
}
export interface StepInfo {
    key?: string;
    number: number | string;
    section?: string;
    text: string;
}
export declare function timerMs(timer: StepTimer): number | null;
export declare const timerKey: (step: number | string, index: number) => string;
export declare function newRun(checklist: {
    path: string;
    version: string;
    title: string;
    scale: number | null;
}, now: number): Run;
export declare function toggleDone(run: Run, step: number | string, now: number): Run;
export declare function setNote(run: Run, step: number | string, note: string): Run;
export declare const setRunNote: (run: Run, note: string) => Run;
export declare const setScale: (run: Run, scale: number | null) => Run;
export declare const finishRun: (run: Run, now: number) => Run;
export declare function startTimer(run: Run, key: string, ms: number, now: number): Run;
export declare function pauseTimer(run: Run, key: string, now: number): Run;
export declare function resetTimer(run: Run, key: string): Run;
export declare function timerRemaining(run: Run, key: string, now: number): number | null;
export declare function tickTimers(run: Run, now: number): {
    run: Run;
    rang: string[];
};
export declare const clock: (ms: number) => string;
export declare function runProgress(run: Run, steps: Array<number | string>): {
    done: number;
    total: number;
};
export declare function shownStep(run: Run, keys: string[], chosen: string | null): string | null;
export declare function stepBeside(keys: string[], key: string, by: -1 | 1): string | null;
export declare const when: (ms: number | null) => string;
export interface RunRecord {
    record: string;
    format: number;
    checklist: {
        path: string;
        title: string;
        version: string;
    };
    scale: number | null;
    startedAt: string;
    finishedAt: string;
    note: string;
    steps: Array<{
        step: number | string;
        section: string;
        text: string;
        done: boolean;
        doneAt: string;
        note: string;
    }>;
}
export declare function runRecord(run: Run, steps: StepInfo[], name?: string): RunRecord;
export declare function runMarkdown(run: Run, steps: StepInfo[], label?: string): string;
export declare function parseRun(raw: unknown): Run | null;
