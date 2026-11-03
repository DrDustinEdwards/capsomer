import { type ReactNode } from "react";
export interface RowListProps {
    labelledBy?: string;
    label?: string;
    primary?: boolean;
    gap?: "sm" | "xs" | "default";
    children: ReactNode;
}
export declare function RowList({ labelledBy, label, primary, gap, children }: RowListProps): import("react").JSX.Element;
export interface RowLinkProps {
    href: string;
    "aria-describedby"?: string;
    children: ReactNode;
}
export interface RowProps {
    title: ReactNode;
    href?: string;
    onOpen?: () => void;
    status?: ReactNode;
    detail?: ReactNode;
    meta?: ReactNode;
    actions?: ReactNode;
    tone?: "crit";
    variant?: "outline" | "muted";
    size?: "sm" | "xs";
    media?: ReactNode;
    mediaVariant?: "icon" | "image";
    expanded?: boolean;
    controls?: string;
    className?: string;
    renderLink?: (props: RowLinkProps) => ReactNode;
}
export declare function Row({ title, href, onOpen, status, detail, meta, actions, tone, variant, size, media, mediaVariant, expanded, controls, className, renderLink }: RowProps): import("react").JSX.Element;
