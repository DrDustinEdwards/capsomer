import type { ReactNode, Ref } from "react";
export interface PanelProps {
    title: ReactNode;
    level?: 2 | 3;
    count?: number;
    src?: ReactNode;
    more?: ReactNode;
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
export declare function Panel({ title, level, count, src, more, description, actions, footer, size, headingId, ref, flush, id, section, className, children }: PanelProps): import("react").JSX.Element;
