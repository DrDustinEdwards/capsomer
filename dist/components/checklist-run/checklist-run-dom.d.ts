export declare const el: <K extends keyof HTMLElementTagNameMap>(tag: K, props?: Record<string, string>, ...kids: Array<Node | string>) => HTMLElementTagNameMap[K];
export declare const button: (label: string, variant: string, part: string, onClick: () => void) => HTMLButtonElement;
export declare function download(name: string, text: string, type: string): void;
/** The timer's beep: the audio context is made on a press (browsers want a gesture) and used when a timer rings. */
export declare function beeper(): {
    ensure(): void;
    beep(): void;
};
/** Keeps the screen on during a run. `onDenied` says so when the browser would not. */
export declare function screenLock(onDenied: () => void): {
    hold(): Promise<void>;
    release(): Promise<void>;
};
