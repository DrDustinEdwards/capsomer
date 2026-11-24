export type ReturnFocus = HTMLElement | (() => HTMLElement | null);
export interface SayOptions {
    undo?: () => void | Promise<void>;
    undone?: string;
    clears?: boolean;
    warning?: string;
    failure?: boolean;
    returnFocus?: ReturnFocus;
}
export interface Message {
    id: number;
    text: string;
    warning: string | null;
    undo: SayOptions["undo"] | null;
    undone?: string;
    returnFocus?: ReturnFocus;
    error: string | null;
    busy: boolean;
    failure: boolean;
    clears: boolean;
}
export declare function newMessage(id: number, text: string, opts?: SayOptions): Message;
/** Whether a message stays when the next one arrives. */
export declare function lasting(m: Pick<Message, "warning" | "error" | "failure">): boolean;
/** The region after `m` arrives: it first, then every lasting message before it. */
export declare function withMessage(all: Message[], m: Message): Message[];
export declare function undoBusy(all: Message[], id: number): Message[];
export declare function undoFailed(all: Message[], id: number, err: unknown): Message[];
export declare function undoDone(all: Message[], m: Message, nextId: () => number): Message[];
export declare function syncTimers(timers: Map<number, number>, next: Message[], onClear: (id: number) => void): void;
export declare function resolveFocus(f: ReturnFocus | undefined): HTMLElement | null;
export declare function isUndoKey(e: KeyboardEvent): boolean;
export declare function currentUndo(all: Message[]): Message | undefined;
export type MessageKind = "ok" | "warning" | "failure";
export declare const kindGlyph: (kind: MessageKind) => string;
export declare function messageKind(m: Pick<Message, "warning" | "error" | "failure">): MessageKind;
export declare function say(text: string, opts?: SayOptions): void;
export declare function fail(text: string): void;
export declare function dismiss(): void;
export declare function runUndo(): Promise<boolean>;
export declare function ensureRegion(after: Element): void;
export declare function enhance(root?: ParentNode): () => void;
