import { type ReactNode } from "react";
export interface ShellEntry {
    id: string;
    label: string;
    href: string;
    icon?: ReactNode;
    current?: boolean;
    count?: number;
    countNote?: string;
    tone?: "crit" | "warn";
    group?: string;
}
export interface LinkProps {
    href: string;
    className?: string;
    "aria-current"?: "page" | "true";
    "aria-label"?: string;
    onClick?: () => void;
    children: ReactNode;
}
export interface ShellProps {
    brand: ReactNode;
    brandHref?: string;
    logo?: ReactNode;
    brandLabel?: string;
    nav: ShellEntry[];
    tabs?: ShellEntry[];
    more?: ShellEntry[];
    moreLabel?: string;
    moreIcon?: ReactNode;
    navLabel?: string;
    status?: ReactNode;
    actions?: ReactNode;
    railFoot?: ReactNode;
    prefKey?: string;
    renderLink?: (props: LinkProps) => ReactNode;
    collapsed?: boolean;
    onCollapsedChange?: (collapsed: boolean) => void;
    children: ReactNode;
}
export declare const plainLink: ({ children, ...props }: LinkProps) => import("react").JSX.Element;
export declare function groups<E extends {
    group?: string;
}>(nav: E[]): Array<{
    label?: string;
    entries: E[];
}>;
export declare function useCollapsedPref(prefKey: string, controlled: boolean | undefined, onChange: ((next: boolean) => void) | undefined): [boolean, (next: boolean) => void];
export declare function Shell(props: ShellProps): import("react").JSX.Element;
