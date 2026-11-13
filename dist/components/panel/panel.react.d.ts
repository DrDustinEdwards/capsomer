import type { ReactNode, Ref } from "react";
export interface PanelProps {
    title?: ReactNode;
    level?: 2 | 3;
    count?: number;
    meta?: ReactNode;
    src?: ReactNode;
    more?: ReactNode;
    moreHref?: string;
    moreLabel?: string;
    reading?: boolean;
    href?: string;
    description?: ReactNode;
    actions?: ReactNode;
    footer?: ReactNode;
    size?: "sm";
    headingId?: string;
    ref?: Ref<HTMLElement>;
    flush?: boolean;
    id?: string;
    section?: string;
    className?: string;
    children: ReactNode;
}
export declare function Panel({ title, level, count, meta, src, more, moreHref, moreLabel, reading, href, description, actions, footer, size, headingId, ref, flush, id, section, className, children, }: PanelProps): import("react").JSX.Element;
export interface TablePanelProps extends Omit<PanelProps, "flush" | "headingId" | "children"> {
    title: ReactNode;
    headingId: string;
    isEmpty: boolean;
    empty: ReactNode;
    reflow?: boolean;
    children: ReactNode;
}
export declare function TablePanel({ headingId, isEmpty, empty, reflow, children, ...panel }: TablePanelProps): import("react").JSX.Element;
