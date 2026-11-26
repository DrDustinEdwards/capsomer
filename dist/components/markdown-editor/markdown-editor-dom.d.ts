import type { Edit, MarkdownEditorOptions } from "./markdown-editor-edits.ts";
import type { Surface } from "./markdown-editor.view.ts";
export declare function el<K extends keyof HTMLElementTagNameMap>(tag: K, props?: Record<string, string>, ...kids: Array<Node | string>): HTMLElementTagNameMap[K];
export declare function icon(paths: string[]): SVGSVGElement;
export declare const GLYPH: {
    bold: string[];
    italic: string[];
    link: string[];
    heading: string[];
    code: string[];
    footnote: string[];
    image: string[];
};
export interface EditorContext {
    host: HTMLElement;
    frame: HTMLElement;
    uid: string;
    o: MarkdownEditorOptions;
    surface(): Surface | null;
    doc(): string;
    apply(edit: Edit): void;
    sel(): {
        from: number;
        to: number;
    };
    say(text: string): void;
    locked(): boolean;
}
export declare function floating(c: EditorContext, panel: HTMLElement, pos: number): () => void;
export declare function dismiss(panel: HTMLElement): void;
