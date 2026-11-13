import { type PatchOptions } from "./manual.ts";
/**
 * The project's round patch (manual.ts patchSvg's contract) as React, so a page draws it without injecting markup.
 * Decorative: the page says the same in words beside it.
 */
export declare function Patch({ id, name, foot, count, unit }: PatchOptions): import("react").JSX.Element;
export interface RunningHeadProps {
    /** The section's number (the site's own, for the section Prelum's sectionOf picks). */
    no: string;
    /** The section's trail, joined with a middle dot. */
    trail: readonly string[];
    /** The right side: the deepest route's folio (manual.ts folioOf), else the site's name. */
    folio: string;
}
/**
 * The running head under the mast: the section's number and trail, the folio at the right, across the wide track of
 * a tracks page. Hidden from screen readers: it sits outside every landmark and says only what the h1 and the
 * breadcrumb say.
 */
export declare function RunningHead({ no, trail, folio }: RunningHeadProps): import("react").JSX.Element;
export interface SignTarget {
    href: string;
    title: string;
    label: string;
}
type Ways = SignTarget | readonly SignTarget[] | null | undefined;
export interface SignsProps {
    label: string;
    prev?: Ways;
    next?: Ways;
    className?: string;
}
export declare function Signs({ label, prev, next, className }: SignsProps): import("react").JSX.Element | null;
export {};
