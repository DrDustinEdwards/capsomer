import type { Edit } from "./markdown-editor.ts";
export type KeyName = "bold" | "italic" | "link" | "code" | "save" | "escape" | "down";
export interface SurfaceConfig {
    parent: HTMLElement;
    doc: string;
    placeholder: string;
    nonce: string;
    lineNumbers: boolean;
    readOnly: boolean;
    disabled: boolean;
    attrs: Record<string, string>;
    onDocChange(value: string): void;
    onCaret(): void;
    onKey(name: KeyName): boolean;
    onFile(file: File): boolean;
}
export interface Caret {
    head: number;
    lineFrom: number;
    lineTo: number;
    lineText: string;
}
export interface Surface {
    getValue(): string;
    setValue(value: string): void;
    focus(): void;
    hasFocus(): boolean;
    selection(): {
        from: number;
        to: number;
    };
    caret(): Caret;
    coords(pos: number): {
        top: number;
        bottom: number;
        left: number;
    } | null;
    select(from: number, to: number): void;
    apply(edit: Edit): void;
    configure(c: {
        placeholder: string;
        readOnly: boolean;
        disabled: boolean;
        attrs: Record<string, string>;
    }): void;
    destroy(): void;
}
export declare function createSurface(cfg: SurfaceConfig): Surface;
