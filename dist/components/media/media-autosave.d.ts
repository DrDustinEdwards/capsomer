export type SaveState = "idle" | "dirty" | "saving" | "saved" | "failed";
export interface AutosaveOptions {
    delay?: number;
    save: () => Promise<void>;
    onState?: (state: SaveState, error?: string) => void;
}
export interface Autosave {
    schedule(): void;
    flush(): Promise<void>;
    retry(): Promise<void>;
    state(): SaveState;
    cancel(): void;
}
export declare const AUTOSAVE_MS = 800;
export declare function createAutosave(opts: AutosaveOptions): Autosave;
