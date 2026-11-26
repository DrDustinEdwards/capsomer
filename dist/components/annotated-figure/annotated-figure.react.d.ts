import { type ReactNode } from "react";
import { type Segment } from "./annotated-figure.ts";
export type { Point, Segment } from "./annotated-figure.ts";
export interface Callout {
    id: string;
    name: string;
    label: string;
    target: ReactNode;
    leader: Segment[];
    text: {
        x: number;
        y: number;
        anchor: "start" | "end";
    };
}
export interface AnnotatedDrawingProps {
    id: string;
    layout?: "wide" | "narrow";
    view: {
        x: number;
        y: number;
        w: number;
        h: number;
    };
    title: string;
    description: string;
    art?: ReactNode;
    callouts: Callout[];
    after?: ReactNode;
}
export declare function AnnotatedDrawing(props: AnnotatedDrawingProps): import("react").JSX.Element;
export interface AnnotatedFigureProps {
    id: string;
    draw?: boolean;
    caption?: ReactNode;
    children: ReactNode;
}
export declare function AnnotatedFigure({ id, draw, caption, children }: AnnotatedFigureProps): import("react").JSX.Element;
export interface KeyEntry {
    id: string;
    number: string;
    name: string;
    note?: ReactNode;
    art?: ReactNode;
    artLabel?: string;
    size?: number;
}
export interface AnnotatedKeyProps {
    for?: string;
    label: string;
    entries: KeyEntry[];
}
export declare function AnnotatedKey({ for: figure, label, entries }: AnnotatedKeyProps): import("react").JSX.Element;
