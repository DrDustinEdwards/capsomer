export interface StepPlayerOptions {
    button: HTMLButtonElement | null;
    current: () => number;
    total: number;
    go: (n: number) => void;
    interval?: number;
    reducedFactor?: number;
    labels?: {
        play?: string;
        pause?: string;
        again?: string;
    };
}
export interface StepPlayer {
    start(): void;
    stop(): void;
    playing(): boolean;
    destroy(): void;
}
export declare const STEP_MS = 3600;
export declare function stepDelay(interval?: number, reducedFactor?: number, reduced?: boolean): number;
export declare function stepPlayer(options: StepPlayerOptions): StepPlayer;
export declare function enhance(root?: ParentNode): () => void;
