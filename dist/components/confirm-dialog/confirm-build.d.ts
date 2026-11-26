export interface ConfirmOptions {
    title: string;
    lead?: string;
    body: string[];
    action: string;
    typeToConfirm?: string;
    perform: (reason: string) => Promise<void>;
    cancelLabel?: string;
    returnTo?: HTMLElement | null;
    reason?: {
        label?: string;
        note?: string;
    };
    media?: boolean;
}
export declare function svgGlyph(d: string, size: number): SVGSVGElement;
export declare function buildConfirm(o: ConfirmOptions): HTMLDialogElement;
