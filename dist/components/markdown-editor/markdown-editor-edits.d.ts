export interface Edit {
    changes: Array<{
        from: number;
        to?: number;
        insert: string;
    }>;
    anchor: number;
    head?: number;
}
export interface LinkTarget {
    href: string;
    title: string;
    hint?: string;
    note?: string;
}
export interface Scaffold {
    id: string;
    label: string;
    hint: string;
    text: string;
    cursor?: number;
    cursorAfter?: string;
    icon?: string;
}
export interface UploadResult {
    url: string;
}
export interface ImageDescription {
    alt: string;
    decorative: boolean;
}
export interface MarkdownEditorOptions {
    label?: string;
    placeholder?: string;
    readOnly?: boolean;
    disabled?: boolean;
    maxLength?: number;
    lineNumbers?: boolean;
    scaffolds?: Scaffold[];
    linkTargets?: LinkTarget[] | ((query: string) => LinkTarget[] | Promise<LinkTarget[]>);
    onUpload?: (file: File, image: ImageDescription, signal: AbortSignal) => Promise<UploadResult>;
    imageMarkdown?: (image: {
        url: string;
        alt: string;
        decorative: boolean;
        name: string;
    }) => string;
    accept?: string;
    onChange?: (value: string) => void;
    onSave?: (value: string) => void;
    nonce?: string;
    wordsPerMinute?: number;
}
export interface MarkdownEditorHandle {
    readonly root: HTMLElement;
    getValue(): string;
    setValue(value: string): void;
    focus(at?: "start" | "end"): void;
    update(patch: Partial<MarkdownEditorOptions>): void;
    destroy(): void;
}
export declare const LINK_RESULT_LIMIT = 8;
export declare function countWords(text: string): number;
export declare function minutesForWords(words: number, wordsPerMinute?: number): number;
export declare function looksLikeUrl(text: string): boolean;
export declare function filterLinkTargets(targets: LinkTarget[], query: string, limit?: number): LinkTarget[];
export declare function lineBounds(doc: string, pos: number): {
    from: number;
    to: number;
};
export declare function wrapEdit(doc: string, from: number, to: number, before: string, after?: string): Edit;
export declare function headingEdit(doc: string, head: number): Edit;
export declare function footnoteEdit(doc: string, from: number, to: number): Edit;
export declare function blockEdit(doc: string, from: number, to: number, text: string, cursor?: number): Edit;
export declare function slashBlockEdit(lineFrom: number, lineTo: number, text: string, cursor?: number): Edit;
export declare function scaffoldCursor(s: Scaffold): number | undefined;
export declare function linkEdit(from: number, to: number, selected: string, href: string, fallbackLabel: string): Edit;
export declare function defaultImageMarkdown({ url, alt }: {
    url: string;
    alt: string;
}): string;
