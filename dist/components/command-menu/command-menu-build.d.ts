import { type Command } from "./command-menu-model.ts";
export interface MenuOptions {
    label?: string;
    placeholder?: string;
    search?: AttachOptions["search"];
    searchDelay?: number;
    recentKey?: string;
    ask?: AttachOptions["ask"];
    answer?: AttachOptions["answer"];
}
export interface AnswerRun {
    cancel(): void;
}
export interface AttachOptions {
    search?: (query: string, signal: AbortSignal) => Promise<Command[]>;
    searchDelay?: number;
    recentKey?: string;
    ask?: {
        label?: string;
        run: (query: string) => void;
    };
    answer?: {
        label?: string;
        offer?: boolean;
        run: (query: string, region: HTMLElement) => AnswerRun | Promise<AnswerRun>;
    };
}
export declare const ANSWER_LABEL = "Answer this";
export declare function startAnswer(answer: NonNullable<AttachOptions["answer"]>, query: string, region: HTMLElement, wanted: () => boolean): Promise<{
    run: AnswerRun;
} | {
    failed: string;
} | null>;
export declare function focusAnswer(region: HTMLElement): void;
export declare function markSnippet(el: HTMLElement, query: string): void;
export declare function buildMenu(commands: Command[], opts?: MenuOptions): HTMLDialogElement;
