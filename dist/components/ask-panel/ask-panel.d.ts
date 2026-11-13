import { type SseEvent } from "../sse/sse.ts";
export interface AskSource {
    url: string;
    title: string;
    kind?: string;
}
export interface AskRead {
    delta?: string;
    sources?: AskSource[];
    cut?: boolean;
}
export interface AskWords {
    label: string;
    badge: string;
    note: string;
    working: string;
    unavailable: string;
    stopped: string;
    empty: string;
    cut: string;
    sources: string;
    announce: (answer: string) => string;
}
export declare const ASK_WORDS: AskWords;
export interface AskOptions {
    request: (signal: AbortSignal) => Promise<Response>;
    read?: (event: SseEvent) => AskRead;
    split?: (answer: string) => {
        answer: string;
        followUp?: string;
    };
    followUpHref?: (question: string) => string;
    allowSource?: (url: string) => boolean;
    words?: Partial<AskWords>;
}
export interface AskHandle {
    cancel(): void;
    done: Promise<void>;
}
export declare function ask(container: HTMLElement, options: AskOptions): AskHandle;
export declare function enhance(root: ParentNode | undefined, options: Omit<AskOptions, "request"> & {
    request: (question: string, signal: AbortSignal) => Promise<Response>;
}): () => void;
export declare function postQuestion(endpoint: string, field?: string): (question: string, signal: AbortSignal) => Promise<Response>;
