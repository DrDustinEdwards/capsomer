import { type ReactNode } from "react";
import { type PatchOptions } from "./manual.ts";
/** The project's round patch (manual.ts patchSvg) as React; decorative. */
export declare function Patch({ id, name, foot, count, unit }: PatchOptions): import("react").JSX.Element;
export interface RunningHeadProps {
    no: string;
    trail: readonly string[];
    folio: string;
}
/** The running head under the mast. Hidden from screen readers: it sits outside every landmark and says only what the h1 and breadcrumb say. */
export declare function RunningHead({ no, trail, folio }: RunningHeadProps): import("react").JSX.Element;
export interface SignTarget {
    href: string;
    title: string;
    label: string;
    forward?: boolean;
    rel?: string;
}
type Ways = SignTarget | readonly SignTarget[] | null | undefined;
export interface SignLinkProps {
    href: string;
    className: string;
    rel: string;
    "data-variant"?: "forward";
    children: ReactNode;
}
export interface SignsProps {
    label: string;
    prev?: Ways;
    next?: Ways;
    className?: string;
    renderLink?: (props: SignLinkProps) => ReactNode;
}
export declare function Signs({ label, prev, next, className, renderLink }: SignsProps): import("react").JSX.Element | null;
export {};
